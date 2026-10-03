-- =============================================================================
-- Bracket – Realtime + Storage + Helpful Views
-- =============================================================================

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable realtime for live bracket updates
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.registrations;
alter publication supabase_realtime add table public.disputes;

-- ─── Storage ─────────────────────────────────────────────────────────────────
-- Tournament banner images
insert into storage.buckets (id, name, public) values ('tournament-banners', 'tournament-banners', true)
  on conflict do nothing;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict do nothing;

-- Anyone can read public buckets
create policy "Public read on tournament-banners"
  on storage.objects for select
  using ( bucket_id = 'tournament-banners' );

create policy "Authenticated users can upload banners"
  on storage.objects for insert
  with check ( bucket_id = 'tournament-banners' and auth.role() = 'authenticated' );

create policy "Users can update their own banner uploads"
  on storage.objects for update
  using ( bucket_id = 'tournament-banners' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Public read on avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );

-- ─── Organizer Analytics View ────────────────────────────────────────────────
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

-- ─── Search / Discover Index ─────────────────────────────────────────────────
-- Full-text search on name + game
alter table public.tournaments
  add column if not exists fts tsvector
    generated always as (
      to_tsvector('english', coalesce(name, '') || ' ' || coalesce(game, '') || ' ' || coalesce(location, ''))
    ) stored;

create index if not exists tournaments_fts_idx on public.tournaments using gin(fts);
create index if not exists tournaments_starts_at_idx on public.tournaments (starts_at);
create index if not exists tournaments_status_idx on public.tournaments (status);
create index if not exists registrations_user_idx on public.registrations (user_id);
create index if not exists rankings_user_idx on public.rankings (user_id);
