-- Fix update_event_entrant_count trigger to increment/decrement by 1 per event instead of cardinality
create or replace function public.update_event_entrant_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.events
    set entrants_count = entrants_count + 1
    where id = any(new.event_ids);
  elsif TG_OP = 'DELETE' then
    update public.events
    set entrants_count = greatest(0, entrants_count - 1)
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
