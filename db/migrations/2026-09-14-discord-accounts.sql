-- Discord owns every new signup. Existing rows are retained, never claimed by name.
begin;
alter table public.registrations add column user_id uuid references auth.users(id) on delete set null;
create unique index registrations_user_id_unique on public.registrations(user_id) where user_id is not null;

create or replace function private.hive_discord_name()
returns text language plpgsql stable security definer set search_path = '' as $$
declare v_name text;
begin
  select left(coalesce(nullif(i.identity_data->>'preferred_username',''), nullif(i.identity_data->'custom_claims'->>'global_name',''), nullif(i.identity_data->>'full_name',''), nullif(i.identity_data->>'name',''), i.provider_id),80)
    into v_name from auth.identities i where i.user_id = auth.uid() and i.provider = 'discord' limit 1;
  if auth.uid() is null or v_name is null then
    raise exception 'Bitte melde dich mit Discord an.' using errcode = '42501';
  end if;
  return v_name;
end;
$$;
revoke all on function private.hive_discord_name() from public, anon, authenticated;

create or replace function public.hive_get_my_registration()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.hive_discord_name();
  return (select to_jsonb(r) - 'edit_token_hash' - 'user_id' from public.registrations r where user_id = auth.uid());
end;
$$;

create or replace function public.hive_save_my_registration(p_entry jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_entry jsonb; v_saved public.registrations; v_id uuid;
begin
  v_entry := p_entry || jsonb_build_object('discord_name',private.hive_discord_name());
  perform public.hive_assert_entry(v_entry);
  -- Serialize a participant's saves: concurrent tabs cannot create duplicates.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 260915));
  select id into v_id from public.registrations where user_id = auth.uid();
  if v_id is null then
    v_id := public.hive_create_registration(v_entry, encode(extensions.gen_random_bytes(32),'hex'));
    update public.registrations set user_id = auth.uid() where id = v_id;
  else
    update public.registrations set
      name = trim(v_entry->>'name'), knows_us = trim(coalesce(v_entry->>'knows_us','')),
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

create or replace function public.hive_delete_my_registration()
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform private.hive_discord_name();
  delete from public.registrations where user_id = auth.uid();
  return found;
end;
$$;

-- Retire all public bearer-link operations; internal create remains available to the owner RPC.
revoke all on function public.hive_create_registration(jsonb,text) from public,anon,authenticated;
revoke all on function public.hive_get_registration(uuid,text) from public,anon,authenticated;
revoke all on function public.hive_update_registration(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.hive_delete_registration(uuid,text) from public,anon,authenticated;
revoke all on function public.hive_get_my_registration() from public,anon;
revoke all on function public.hive_save_my_registration(jsonb) from public,anon;
revoke all on function public.hive_delete_my_registration() from public,anon;
grant execute on function public.hive_get_my_registration() to authenticated;
grant execute on function public.hive_save_my_registration(jsonb) to authenticated;
grant execute on function public.hive_delete_my_registration() to authenticated;
commit;
