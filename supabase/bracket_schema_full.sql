-- =============================================================================
-- BRACKET – FULL SCHEMA  (run this once in Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / ON CONFLICT DO NOTHING
-- =============================================================================

-- ─── Migration 1: Profiles ────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text not null,
  handle text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Public profiles are viewable by everyone.') then
    create policy "Public profiles are viewable by everyone."
      on public.profiles for select using ( true );
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can insert their own profile.') then
    create policy "Users can insert their own profile."
      on public.profiles for insert with check ( auth.uid() = id );
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can update own profile.') then
    create policy "Users can update own profile."
      on public.profiles for update using ( auth.uid() = id );
  end if;
end $$;

-- Auto-create a profile row whenever a new auth user signs up
-- Covers web signups that skip the mobile onboarding flow
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, handle, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g'))
      || '_' || substr(gen_random_uuid()::text, 1, 6),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Migration 2: Tournaments & core tables ───────────────────────────────────


create table if not exists public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  organizer_id    uuid references auth.users on delete cascade not null,
  name            text not null,
  slug            text unique not null,
  game            text not null,
  description_md  text,
  banner_url      text,
  thumbnail_url   text,
  video_url       text,
  is_online       boolean not null default false,
  location        text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  registration_fee numeric(10,2) not null default 0,
  prize_pool      text,
  max_entrants    int,
  status          text not null default 'draft'
                    check (status in ('draft','registration_open','registration_closed','in_progress','completed','cancelled')),
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.tournaments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='tournaments' and policyname='Tournaments are publicly viewable') then
    create policy "Tournaments are publicly viewable"
      on public.tournaments for select using ( status != 'draft' or organizer_id = auth.uid() );
  end if;
  if not exists (select 1 from pg_policies where tablename='tournaments' and policyname='Authenticated users can create tournaments') then
    create policy "Authenticated users can create tournaments"
      on public.tournaments for insert with check ( auth.uid() = organizer_id );
  end if;
  if not exists (select 1 from pg_policies where tablename='tournaments' and policyname='Organizers can update their own tournaments') then
    create policy "Organizers can update their own tournaments"
      on public.tournaments for update using ( auth.uid() = organizer_id );
  end if;
  if not exists (select 1 from pg_policies where tablename='tournaments' and policyname='Organizers can delete their own tournaments') then
    create policy "Organizers can delete their own tournaments"
      on public.tournaments for delete using ( auth.uid() = organizer_id and status in ('draft','registration_open','registration_closed') );
  end if;
end $$;

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_tournament_updated on public.tournaments;
create trigger on_tournament_updated
  before update on public.tournaments
  for each row execute procedure public.handle_updated_at();

-- Events
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid references public.tournaments on delete cascade not null,
  name            text not null,
  format          text not null default 'double_elim'
                    check (format in ('single_elim','double_elim','round_robin','swiss')),
  max_entrants    int,
  entrants_count  int not null default 0,
  status          text not null default 'pending'
                    check (status in ('pending','seeding','in_progress','completed')),
  stage_data      jsonb,
  created_at      timestamptz not null default now()
);

alter table public.events enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='events' and policyname='Events are publicly viewable') then
    create policy "Events are publicly viewable"
      on public.events for select using ( true );
  end if;
  if not exists (select 1 from pg_policies where tablename='events' and policyname='Tournament organizer can manage events') then
    create policy "Tournament organizer can manage events"
      on public.events for all
      using (
        exists (select 1 from public.tournaments where id = tournament_id and organizer_id = auth.uid())
      )
      with check (
        exists (select 1 from public.tournaments where id = tournament_id and organizer_id = auth.uid())
      );
  end if;
end $$;

-- Registrations
create table if not exists public.registrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  tournament_id   uuid references public.tournaments on delete cascade not null,
  event_ids       uuid[] not null default '{}',
  status          text not null default 'confirmed'
                    check (status in ('pending','confirmed','waitlisted','cancelled','refunded')),
  checked_in      boolean not null default false,
  registered_at   timestamptz not null default now(),
  unique (user_id, tournament_id)
);

alter table public.registrations enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='registrations' and policyname='Users can view own registrations') then
    create policy "Users can view own registrations"
      on public.registrations for select
      using (
        auth.uid() = user_id
        or exists (select 1 from public.tournaments where id = tournament_id and organizer_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='registrations' and policyname='Authenticated users can register') then
    create policy "Authenticated users can register"
      on public.registrations for insert with check ( auth.uid() = user_id );
  end if;
  if not exists (select 1 from pg_policies where tablename='registrations' and policyname='Users can update own registration') then
    create policy "Users can update own registration"
      on public.registrations for update using ( auth.uid() = user_id );
  end if;
end $$;

-- Rankings
create table if not exists public.rankings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  tournament_id   uuid references public.tournaments on delete cascade not null,
  event_id        uuid references public.events on delete cascade not null,
  placement       int not null,
  wins            int not null default 0,
  losses          int not null default 0,
  recorded_at     timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.rankings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='rankings' and policyname='Rankings are publicly viewable') then
    create policy "Rankings are publicly viewable"
      on public.rankings for select using ( true );
  end if;
  if not exists (select 1 from pg_policies where tablename='rankings' and policyname='Organizers can record rankings') then
    create policy "Organizers can record rankings"
      on public.rankings for all
      using (
        exists (select 1 from public.tournaments where id = tournament_id and organizer_id = auth.uid())
      )
      with check (
        exists (select 1 from public.tournaments where id = tournament_id and organizer_id = auth.uid())
      );
  end if;
end $$;

-- Disputes
create table if not exists public.disputes (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid references public.tournaments on delete cascade not null,
  event_id        uuid references public.events on delete cascade not null,
  reported_by     uuid references auth.users on delete set null,
  match_id        text,
  description     text not null,
  status          text not null default 'open'
                    check (status in ('open','under_review','resolved','dismissed')),
  resolution      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.disputes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='disputes' and policyname='Disputes visible to reporter and organizer') then
    create policy "Disputes visible to reporter and organizer"
      on public.disputes for select
      using (
        auth.uid() = reported_by
        or exists (select 1 from public.tournaments where id = tournament_id and organizer_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='disputes' and policyname='Authenticated users can file disputes') then
    create policy "Authenticated users can file disputes"
      on public.disputes for insert with check ( auth.uid() = reported_by );
  end if;
  if not exists (select 1 from pg_policies where tablename='disputes' and policyname='Organizers can update disputes') then
    create policy "Organizers can update disputes"
      on public.disputes for update
      using (
        exists (select 1 from public.tournaments where id = tournament_id and organizer_id = auth.uid())
      );
  end if;
end $$;

drop trigger if exists on_dispute_updated on public.disputes;
create trigger on_dispute_updated
  before update on public.disputes
  for each row execute procedure public.handle_updated_at();

-- ─── Migration 3: Realtime + Storage + Views + Indexes ───────────────────────

-- Realtime
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.registrations;
alter publication supabase_realtime add table public.disputes;

-- Storage buckets
insert into storage.buckets (id, name, public) values ('tournament-banners', 'tournament-banners', true)
  on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Public read on tournament-banners') then
    create policy "Public read on tournament-banners"
      on storage.objects for select using ( bucket_id = 'tournament-banners' );
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Authenticated users can upload banners') then
    create policy "Authenticated users can upload banners"
      on storage.objects for insert with check ( bucket_id = 'tournament-banners' and auth.role() = 'authenticated' );
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Public read on avatars') then
    create policy "Public read on avatars"
      on storage.objects for select using ( bucket_id = 'avatars' );
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Authenticated users can upload avatars') then
    create policy "Authenticated users can upload avatars"
      on storage.objects for insert with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
  end if;
end $$;

-- Analytics view
create or replace view public.organizer_tournament_stats as
  select
    t.id                                              as tournament_id,
    t.organizer_id,
    t.name,
    t.status,
    t.starts_at,
    count(distinct r.id)                              as registration_count,
    count(distinct r.id) filter (where r.checked_in)  as checked_in_count,
    count(distinct d.id) filter (where d.status = 'open') as open_dispute_count,
    sum(t.registration_fee)                           as gross_revenue
  from public.tournaments t
  left join public.registrations r on r.tournament_id = t.id and r.status = 'confirmed'
  left join public.disputes d      on d.tournament_id = t.id
  where t.organizer_id = auth.uid()
  group by t.id;

-- Full-text search column
alter table public.tournaments
  add column if not exists fts tsvector
    generated always as (
      to_tsvector('english', coalesce(name, '') || ' ' || coalesce(game, '') || ' ' || coalesce(location, ''))
    ) stored;

-- Indexes
create index if not exists tournaments_fts_idx       on public.tournaments using gin(fts);
create index if not exists tournaments_starts_at_idx on public.tournaments (starts_at);
create index if not exists tournaments_status_idx    on public.tournaments (status);
create index if not exists registrations_user_idx    on public.registrations (user_id);
create index if not exists rankings_user_idx         on public.rankings (user_id);

-- ─── Done ─────────────────────────────────────────────────────────────────────
select 'Bracket schema applied successfully 🎉' as result;
