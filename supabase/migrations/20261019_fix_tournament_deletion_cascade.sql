-- =============================================================================
-- Migration: Fix Tournament Deletion Cascade & Foreign Key Constraint Conflict
-- =============================================================================
-- When a tournament is deleted, Postgres cascades deletion to events.
-- The on_event_deleted trigger on events previously attempted to UPDATE public.registrations
-- referencing the tournament_id that was already being deleted in the transaction, causing:
-- "insert or update on table registrations violates foreign key constraint registrations_tournament_id_fkey".
--
-- This fix ensures cleanup_deleted_event() only updates registrations if the
-- parent tournament still exists (i.e. single event deletion). If the entire
-- tournament is being deleted, ON DELETE CASCADE automatically cleans up registrations.

create or replace function public.cleanup_deleted_event()
returns trigger language plpgsql security definer as $$
begin
  -- If the parent tournament is already deleted or being deleted in this transaction,
  -- do not update registrations; ON DELETE CASCADE will delete all registrations.
  if not exists (select 1 from public.tournaments where id = old.tournament_id) then
    return old;
  end if;

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
