-- Add an explicit no-preference choice without changing existing responses.
begin;
alter table public.registrations drop constraint registrations_server_mode_check;
alter table public.registrations add constraint registrations_server_mode_check
  check (server_mode in ('PVE','PVP','ANY'));
create or replace function public.hive_save_my_registration(p_entry jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_entry jsonb; v_saved public.registrations; v_id uuid;
begin
  v_entry := p_entry || jsonb_build_object('discord_name',private.hive_discord_name());
  perform public.hive_assert_entry(v_entry);
  -- Older cached clients may omit this new field; never erase an existing choice.
  if v_entry ? 'server_mode' and not coalesce(v_entry->>'server_mode' in ('PVE','PVP','ANY'), false) then
    raise exception 'Bitte wähle PVE, PVP oder Mir egal als bevorzugten Server.' using errcode = '23514';
  end if;
  -- Serialize a participant's saves: concurrent tabs cannot create duplicates.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 260915));
  select id into v_id from public.registrations where user_id = auth.uid();
  if v_id is null then
    v_id := public.hive_create_registration(v_entry, encode(extensions.gen_random_bytes(32),'hex'));
    update public.registrations set user_id = auth.uid(), server_mode = v_entry->>'server_mode' where id = v_id;
  else
    update public.registrations set
      name = trim(v_entry->>'name'), knows_us = trim(coalesce(v_entry->>'knows_us','')),
      server_mode = case when v_entry ? 'server_mode' then v_entry->>'server_mode' else server_mode end,
      race = v_entry->>'race', class_name = v_entry->>'class_name', spec = v_entry->>'spec',
      role = public.hive_role_for_spec(v_entry->>'class_name',v_entry->>'spec'),
      days = array(select jsonb_array_elements_text(v_entry->'days')),
      max_raid_days = (v_entry->>'max_raid_days')::integer,
      earliest_start = v_entry->>'earliest_start', latest_end = v_entry->>'latest_end',
      raid_vision = trim(v_entry->>'raid_vision'), discord_name = v_entry->>'discord_name'
    where id = v_id and user_id = auth.uid();
  end if;
  select * into strict v_saved from public.registrations where id = v_id and user_id = auth.uid();
  return to_jsonb(v_saved) - 'edit_token_hash' - 'user_id';
end;
$$;

notify pgrst, 'reload schema';
commit;
