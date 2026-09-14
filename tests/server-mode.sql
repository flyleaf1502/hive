-- Live integration test. All test accounts, rows and preferences roll back.
begin;
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); admin_id uuid := gen_random_uuid();
  entry jsonb := '{"name":"HIVE Server QA","knows_us":"","race":"Orc","class_name":"Mage","spec":"Frost","days":["Mon"],"max_raid_days":2,"earliest_start":"18:30","latest_end":"23:00","raid_vision":"Rollback test"}';
  saved jsonb; updated jsonb; bad jsonb; rejected boolean; affected integer; projected jsonb;
begin
  insert into auth.users(id,aud,role,email) values
    (a,'authenticated','authenticated',a::text||'@example.invalid'),
    (b,'authenticated','authenticated',b::text||'@example.invalid'),
    (admin_id,'authenticated','authenticated',admin_id::text||'@example.invalid');
  insert into auth.identities(id,user_id,provider_id,provider,identity_data) values
    (gen_random_uuid(),a,a::text,'discord',jsonb_build_object('sub',a::text,'preferred_username','qa-server-a')),
    (gen_random_uuid(),b,b::text,'discord',jsonb_build_object('sub',b::text,'preferred_username','qa-server-b'));
  insert into public.hive_admins(user_id) values(admin_id);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  saved := public.hive_save_my_registration(entry);
  if saved->>'server_mode' is not null then raise exception 'Legacy client was assigned an invented preference'; end if;
  updated := public.hive_save_my_registration(entry || '{"server_mode":"PVE"}');
  if updated->>'id' <> saved->>'id' or updated->>'server_mode' <> 'PVE' then raise exception 'PVE save failed'; end if;
  updated := public.hive_save_my_registration(entry || '{"server_mode":"PVP"}');
  if public.hive_get_my_registration()->>'server_mode' <> 'PVP' then raise exception 'PVP update/read failed'; end if;
  updated := public.hive_save_my_registration(entry || '{"server_mode":"ANY"}');
  if public.hive_get_my_registration()->>'server_mode' <> 'ANY' then raise exception 'No-preference update/read failed'; end if;
  updated := public.hive_save_my_registration(entry);
  if updated->>'server_mode' <> 'ANY' then raise exception 'Legacy update erased preference'; end if;
  for bad in select value from jsonb_array_elements('["PVE/PVP","pvp","",null,42]') loop
    rejected := false;
    begin
      perform public.hive_save_my_registration(entry || jsonb_build_object('server_mode',bad));
    exception when check_violation then rejected := true;
    end;
    if not rejected then raise exception 'Invalid server preference accepted: %',bad; end if;
  end loop;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  updated := public.hive_save_my_registration(entry || jsonb_build_object('server_mode','PVE','id',saved->>'id','user_id',a));
  if updated->>'id' = saved->>'id' then raise exception 'Cross-account update allowed'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  update public.registrations set server_mode='PVE' where id=(saved->>'id')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Admin preference edit failed'; end if;
  rejected := false;
  begin update public.registrations set server_mode='invalid' where id=(saved->>'id')::uuid;
  exception when check_violation then rejected := true; end;
  if not rejected then raise exception 'Admin bypassed server constraint'; end if;
  perform set_config('role','anon',true);
  select to_jsonb(r) into projected from public.hive_public_roster() r where r.name='HIVE Server QA' limit 1;
  if projected->>'raid_vision' <> 'Rollback test' or projected->>'server_mode' <> 'PVE' or
    (select array_agg(key order by key) from jsonb_object_keys(projected) key) <>
    array['class_name','days','earliest_start','latest_end','max_raid_days','name','race','raid_vision','role','server_mode','spec']::text[] then
    raise exception 'Public projection incorrect: %',projected;
  end if;
  rejected := false;
  begin perform 1 from public.registrations; exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Anonymous raw table access allowed'; end if;
end; $$;
rollback;
select 'PASS: PVE/PVP/ANY save, edit, reload, legacy preservation, invalid values, account isolation, admin edit, eleven public fields and anonymous table isolation; all test data rolled back' as verification;
