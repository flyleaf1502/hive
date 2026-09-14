-- Apply to the existing HIVE project. No historical rows are changed or removed.
-- NOT VALID retains old combinations, while every new/updated row must be valid.
begin;

-- Horde matrix: Blizzard BlizzCon 2026, checked 2026-09-14.
create or replace function public.hive_race_class_allowed(p_race text, p_class text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(case
    when p_class = 'Not sure yet' then p_race in ('Orc','Troll','Tauren','Undead','Skyborne','Not sure yet')
    when p_race = 'Not sure yet' then p_class in ('Warrior','Hunter','Rogue','Druid','Shaman','Mage','Warlock','Priest','Paladin')
    when p_race = 'Orc' then p_class in ('Warrior','Hunter','Rogue','Shaman','Mage','Warlock')
    when p_race = 'Troll' then p_class in ('Warrior','Hunter','Rogue','Priest','Shaman','Mage','Warlock')
    when p_race = 'Tauren' then p_class in ('Warrior','Hunter','Shaman','Druid')
    when p_race = 'Undead' then p_class in ('Warrior','Paladin','Rogue','Priest','Mage','Warlock')
    when p_race = 'Skyborne' then p_class in ('Warrior','Hunter','Rogue','Shaman','Druid')
    else false
  end, false);
$$;

revoke all on function public.hive_race_class_allowed(text, text) from public;
grant execute on function public.hive_race_class_allowed(text, text) to anon, authenticated;

alter table public.registrations
  add constraint registrations_race_class_check
  check (public.hive_race_class_allowed(race, class_name)) not valid;

commit;
