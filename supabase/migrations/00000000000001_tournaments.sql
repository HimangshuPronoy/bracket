-- =============================================================================
-- Bracket – Core Tournament Schema
-- =============================================================================

-- ─── Tournaments ─────────────────────────────────────────────────────────────
create table public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  organizer_id    uuid references auth.users on delete cascade not null,
  name            text not null,
  slug            text unique not null,
  game            text not null,
  description_md  text,
  banner_url      text,
  is_online       boolean not null default false,
  location        text,                    -- null for online events
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  registration_fee numeric(10,2) not null default 0,
  prize_pool      text,                    -- display string e.g. "$5,000"
  max_entrants    int,
  status          text not null default 'draft'
                    check (status in ('draft','registration_open','registration_closed','in_progress','completed','cancelled')),
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.tournaments enable row level security;

-- Public tournaments are viewable by everyone
create policy "Tournaments are publicly viewable"
  on public.tournaments for select using ( status != 'draft' or organizer_id = auth.uid() );

-- Organizers can create tournaments
create policy "Authenticated users can create tournaments"
  on public.tournaments for insert
  with check ( auth.uid() = organizer_id );

-- Organizers can update their own tournaments
create policy "Organizers can update their own tournaments"
  on public.tournaments for update
  using ( auth.uid() = organizer_id );

-- Organizers can delete their own draft/upcoming tournaments
create policy "Organizers can delete their own tournaments"
  on public.tournaments for delete
  using ( auth.uid() = organizer_id and status in ('draft','registration_open','registration_closed') );

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_tournament_updated
  before update on public.tournaments
  for each row execute procedure public.handle_updated_at();

-- ─── Events ──────────────────────────────────────────────────────────────────
-- An "event" is a sub-bracket inside a tournament (e.g. Singles, Doubles).
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid references public.tournaments on delete cascade not null,
  name            text not null,           -- "Singles", "Doubles", etc.
  format          text not null default 'double_elim'
                    check (format in ('single_elim','double_elim','round_robin','swiss')),
  max_entrants    int,
  entrants_count  int not null default 0,
  status          text not null default 'pending'
                    check (status in ('pending','seeding','in_progress','completed')),
  stage_data      jsonb,                   -- serialized StageState from bracket engine
  created_at      timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Events are publicly viewable"
  on public.events for select using ( true );

create policy "Tournament organizer can manage events"
  on public.events for all
  using (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  );

-- ─── Registrations ───────────────────────────────────────────────────────────
create table public.registrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  tournament_id   uuid references public.tournaments on delete cascade not null,
  event_ids       uuid[] not null default '{}',   -- sub-events the user registered for
  status          text not null default 'confirmed'
                    check (status in ('pending','confirmed','waitlisted','cancelled','refunded')),
  checked_in      boolean not null default false,
  registered_at   timestamptz not null default now(),
  unique (user_id, tournament_id)
);

alter table public.registrations enable row level security;

-- Users can see their own registrations; organizers can see all for their tournaments
create policy "Users can view own registrations"
  on public.registrations for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  );

create policy "Authenticated users can register"
  on public.registrations for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own registration"
  on public.registrations for update
  using ( auth.uid() = user_id );

-- Keep entrants_count in sync
create or replace function public.update_event_entrant_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.events
    set entrants_count = entrants_count + cardinality(new.event_ids)
    where id = any(new.event_ids);
  elsif TG_OP = 'DELETE' then
    update public.events
    set entrants_count = greatest(0, entrants_count - cardinality(old.event_ids))
    where id = any(old.event_ids);
  elsif TG_OP = 'UPDATE' then
    -- Decrement for removed events
    update public.events
    set entrants_count = greatest(0, entrants_count - 1)
    where id = any(
      array(select unnest(old.event_ids) except select unnest(new.event_ids))
    );
    -- Increment for added events
    update public.events
    set entrants_count = entrants_count + 1
    where id = any(
      array(select unnest(new.event_ids) except select unnest(old.event_ids))
    );
  end if;
  return null;
end;
$$;

create trigger on_registration_change
  after insert or update or delete on public.registrations
  for each row execute procedure public.update_event_entrant_count();

-- ─── Rankings ────────────────────────────────────────────────────────────────
create table public.rankings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  tournament_id   uuid references public.tournaments on delete cascade not null,
  event_id        uuid references public.events on delete cascade not null,
  placement       int not null,            -- final standing (1 = 1st place)
  wins            int not null default 0,
  losses          int not null default 0,
  recorded_at     timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.rankings enable row level security;

create policy "Rankings are publicly viewable"
  on public.rankings for select using ( true );

create policy "Organizers can record rankings"
  on public.rankings for all
  using (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  );

-- ─── Disputes ────────────────────────────────────────────────────────────────
create table public.disputes (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid references public.tournaments on delete cascade not null,
  event_id        uuid references public.events on delete cascade not null,
  reported_by     uuid references auth.users on delete set null,
  match_id        text,                    -- match id within stage_data
  description     text not null,
  status          text not null default 'open'
                    check (status in ('open','under_review','resolved','dismissed')),
  resolution      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.disputes enable row level security;

create policy "Disputes visible to reporter and organizer"
  on public.disputes for select
  using (
    auth.uid() = reported_by
    or exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  );

create policy "Authenticated users can file disputes"
  on public.disputes for insert
  with check ( auth.uid() = reported_by );

create policy "Organizers can update disputes"
  on public.disputes for update
  using (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  );

create trigger on_dispute_updated
  before update on public.disputes
  for each row execute procedure public.handle_updated_at();
