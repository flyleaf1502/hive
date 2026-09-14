-- Apply once to the existing HIVE Raid Supabase project.
-- Existing 18:00 registrations remain stored; new/edited signups must choose 18:30 or later.
begin;

alter table public.registrations
  drop constraint if exists registrations_knows_us_check;
alter table public.registrations
  alter column knows_us set default '';
alter table public.registrations
  add constraint registrations_knows_us_check check (char_length(knows_us) <= 200);

grant select, update, delete on public.registrations to authenticated;
drop policy if exists hive_admin_delete on public.registrations;
create policy hive_admin_delete on public.registrations
  for delete to authenticated using (public.hive_is_admin());

create or replace function public.hive_assert_entry(p_entry jsonb)
returns void language plpgsql set search_path = '' as $$
declare
  v_days text[];
  v_max_days integer;
begin
  if jsonb_typeof(p_entry) <> 'object' then
    raise exception 'Ungültige Anmeldung.';
  end if;
  if char_length(trim(coalesce(p_entry->>'name', ''))) not between 1 and 80
    or char_length(trim(coalesce(p_entry->>'knows_us', ''))) > 200
    or char_length(trim(coalesce(p_entry->>'race', ''))) not between 1 and 80
    or char_length(trim(coalesce(p_entry->>'class_name', ''))) not between 1 and 80
    or char_length(trim(coalesce(p_entry->>'spec', ''))) not between 1 and 80
    or char_length(trim(coalesce(p_entry->>'raid_vision', ''))) not between 1 and 1000
    or char_length(trim(coalesce(p_entry->>'discord_name', ''))) not between 1 and 80 then
    raise exception 'Bitte prüfe die Pflichtfelder und Textlängen.';
  end if;
  if (p_entry->>'race') not in ('Orc', 'Troll', 'Tauren', 'Undead', 'Skyborne', 'Not sure yet') then
    raise exception 'Bitte wähle eine gültige Rasse.';
  end if;
  if public.hive_role_for_spec(p_entry->>'class_name', p_entry->>'spec') is null then
    raise exception 'Bitte wähle eine gültige Klasse und Spec.';
  end if;
  if jsonb_typeof(p_entry->'days') <> 'array' then
    raise exception 'Bitte wähle mindestens einen Raidtag.';
  end if;
  v_days := array(select jsonb_array_elements_text(p_entry->'days'));
  if cardinality(v_days) not between 1 and 7
    or not (v_days <@ array['Mon','Tue','Wed','Thu','Fri','Sat','Sun']::text[])
    or cardinality(v_days) <> cardinality(array(select distinct unnest(v_days))) then
    raise exception 'Bitte wähle gültige Raidtage.';
  end if;
  begin
    v_max_days := (p_entry->>'max_raid_days')::integer;
  exception when others then
    raise exception 'Bitte wähle die maximale Zahl der Raidtage.';
  end;
  if v_max_days not between 1 and 4 then
    raise exception 'Die Zahl der Raidtage muss zwischen 1 und 4 liegen.';
  end if;
  if not coalesce((p_entry->>'earliest_start') in ('18:30', '19:00', '19:30', '20:00'), false) then
    raise exception 'Bitte wähle eine gültige früheste Startzeit.';
  end if;
  if not coalesce((p_entry->>'latest_end') in ('22:00', '22:30', '23:00'), false) then
    raise exception 'Bitte wähle eine gültige späteste Endzeit.';
  end if;
end;
$$;

revoke all on function public.hive_assert_entry(jsonb) from public;

commit;
