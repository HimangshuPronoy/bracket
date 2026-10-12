-- =============================================================================
-- Migration: Fix Foreign Keys, RLS Policies, Entrant Count Trigger & Stats View
-- =============================================================================

-- 1. Add Foreign Key constraints from registrations & rankings to public.profiles
-- This enables PostgREST resource embedding: registrations.select('..., profiles(...)')
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_registrations_profiles' and table_name = 'registrations'
  ) then
    alter table public.registrations
      add constraint fk_registrations_profiles
      foreign key (user_id) references public.profiles(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_rankings_profiles' and table_name = 'rankings'
  ) then
    alter table public.rankings
      add constraint fk_rankings_profiles
      foreign key (user_id) references public.profiles(id)
      on delete cascade;
  end if;
end $$;

-- 2. RLS: Allow Organizers to UPDATE registrations for their tournaments (enables check-ins & status management)
drop policy if exists "Organizers can update registrations for their tournaments" on public.registrations;
create policy "Organizers can update registrations for their tournaments"
  on public.registrations for update
  using (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  );

-- 3. RLS: Allow anyone to view confirmed registrations for public (non-draft) tournaments
-- (enables public attendee lists, seeding views, and public entrant counts)
drop policy if exists "Confirmed registrations are publicly viewable" on public.registrations;
create policy "Confirmed registrations are publicly viewable"
  on public.registrations for select
  using (
    status = 'confirmed'
    and exists (
      select 1 from public.tournaments
      where id = tournament_id and status != 'draft'
    )
  );

-- 4. Fix Trigger: update_event_entrant_count to properly handle status transitions
-- (e.g. confirmed -> cancelled/refunded decrements, cancelled/refunded -> confirmed increments)
create or replace function public.update_event_entrant_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    if new.status = 'confirmed' then
      update public.events
      set entrants_count = entrants_count + 1
      where id = any(new.event_ids);
    end if;
  elsif TG_OP = 'DELETE' then
    if old.status = 'confirmed' then
      update public.events
      set entrants_count = greatest(0, entrants_count - 1)
      where id = any(old.event_ids);
    end if;
  elsif TG_OP = 'UPDATE' then
    -- Case A: Status changed from confirmed to non-confirmed (cancelled, refunded, etc.)
    if old.status = 'confirmed' and new.status != 'confirmed' then
      update public.events
      set entrants_count = greatest(0, entrants_count - 1)
      where id = any(old.event_ids);
    -- Case B: Status changed from non-confirmed to confirmed
    elsif old.status != 'confirmed' and new.status = 'confirmed' then
      update public.events
      set entrants_count = entrants_count + 1
      where id = any(new.event_ids);
    -- Case C: Remained confirmed, but event_ids list changed
    elsif old.status = 'confirmed' and new.status = 'confirmed' then
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
  end if;
  return null;
end;
$$;

-- 5. Fix View: organizer_tournament_stats to eliminate Cartesian product revenue inflation
create or replace view public.organizer_tournament_stats as
  select
    t.id                                                  as tournament_id,
    t.organizer_id,
    t.name,
    t.status,
    t.starts_at,
    count(distinct r.id) filter (where r.status = 'confirmed') as registration_count,
    count(distinct r.id) filter (where r.status = 'confirmed' and r.checked_in) as checked_in_count,
    count(distinct d.id) filter (where d.status = 'open') as open_dispute_count,
    coalesce(count(distinct r.id) filter (where r.status = 'confirmed') * t.registration_fee, 0) as gross_revenue
  from public.tournaments t
  left join public.registrations r on r.tournament_id = t.id
  left join public.disputes d      on d.tournament_id = t.id
  where t.organizer_id = auth.uid()
  group by t.id;
