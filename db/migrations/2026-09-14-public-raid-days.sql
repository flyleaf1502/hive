-- Owner-approved public raid availability; no registration data is modified.
begin;
drop function public.hive_public_roster();
create function public.hive_public_roster()
returns table (name text, race text, class_name text, spec text, role text, server_mode text, raid_vision text, days text[], max_raid_days integer, earliest_start text, latest_end text)
language sql stable security definer set search_path = '' as $$
  select r.name, r.race, r.class_name, r.spec, r.role, r.server_mode, r.raid_vision, r.days, r.max_raid_days, r.earliest_start, r.latest_end
  from public.registrations r
  order by case r.role when 'Tank' then 1 when 'Healer' then 2 when 'Damage' then 3 else 4 end,
    r.class_name, r.spec, r.name;
$$;
revoke all on function public.hive_public_roster() from public;
grant execute on function public.hive_public_roster() to anon, authenticated;
notify pgrst, 'reload schema';
commit;
