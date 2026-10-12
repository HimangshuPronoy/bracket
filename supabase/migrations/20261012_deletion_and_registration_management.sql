-- =============================================================================
-- Migration: Support Event Deletion, Registration Deletion & Player Removal
-- =============================================================================

-- 1. RLS: Allow Users to DELETE their own registrations (withdraw)
drop policy if exists "Users can delete own registration" on public.registrations;
create policy "Users can delete own registration"
  on public.registrations for delete
  using ( auth.uid() = user_id );

-- 2. RLS: Allow Organizers to DELETE registrations for their tournaments (kick/remove players)
drop policy if exists "Organizers can delete registrations for their tournaments" on public.registrations;
create policy "Organizers can delete registrations for their tournaments"
  on public.registrations for delete
  using (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  );

-- 3. RLS: Allow Organizers to DELETE their tournaments at any stage
drop policy if exists "Organizers can delete their own tournaments" on public.tournaments;
create policy "Organizers can delete their own tournaments"
  on public.tournaments for delete
  using ( auth.uid() = organizer_id );

-- 4. Trigger: Clean up registrations and rankings when an event is deleted
create or replace function public.cleanup_deleted_event()
returns trigger language plpgsql security definer as $$
begin
  -- Remove the deleted event ID from all registrations for this tournament
  update public.registrations
  set event_ids = array_remove(event_ids, old.id)
  where tournament_id = old.tournament_id and old.id = any(event_ids);

  -- If any registration now has an empty event_ids array, mark as cancelled
  update public.registrations
  set status = 'cancelled'
  where tournament_id = old.tournament_id and (event_ids is null or cardinality(event_ids) = 0) and status = 'confirmed';

  -- Clean up any rankings referencing this event
  delete from public.rankings where event_id = old.id;

  return old;
end;
$$;

drop trigger if exists on_event_deleted on public.events;
create trigger on_event_deleted
  before delete on public.events
  for each row execute procedure public.cleanup_deleted_event();

-- 5. RLS: Allow Organizers to UPDATE registrations for their tournaments (check-in / status)
drop policy if exists "Organizers can update registrations for their tournaments" on public.registrations;
create policy "Organizers can update registrations for their tournaments"
  on public.registrations for update
  using (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and organizer_id = auth.uid()
    )
  );

