-- ============================================================
-- Migration: 20261020_fix_audit_bugs.sql
-- Fixes:
--   1. Tournament delete RLS now allows deletion at any status
--      (client already handles cascading child records first)
-- ============================================================

-- Fix #2: Remove status restriction from tournament delete policy
-- Organizers were blocked from deleting in_progress/completed
-- tournaments despite the client-side code already removing child
-- records first, leaving orphaned data.
drop policy if exists "Organizers can delete their own tournaments" on public.tournaments;

create policy "Organizers can delete their own tournaments"
  on public.tournaments for delete
  using ( auth.uid() = organizer_id );
