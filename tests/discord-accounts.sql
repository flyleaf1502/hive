-- Integration checks against the live schema; all synthetic users/data are rolled back.
begin;
do $$
declare
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
 entry jsonb := '{"name":"HIVE QA","knows_us":"","race":"Orc","class_name":"Mage","spec":"Frost","days":["Mon"],"max_raid_days":2,"earliest_start":"18:30","latest_end":"23:00","raid_vision":"QA rollback","discord_name":"forged"}';
 saved jsonb; again jsonb; row_count integer; rejected boolean;
begin
 insert into auth.users(id,aud,role,email) values(a,'authenticated','authenticated',a::text||'@example.invalid'),(b,'authenticated','authenticated',b::text||'@example.invalid'),(c,'authenticated','authenticated',c::text||'@example.invalid');
 insert into auth.identities(id,user_id,provider_id,provider,identity_data) values(gen_random_uuid(),a,a::text,'discord',jsonb_build_object('sub',a::text,'preferred_username','qa-discord-a')),(gen_random_uuid(),b,b::text,'discord',jsonb_build_object('sub',b::text,'preferred_username','qa-discord-b'));
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 saved := public.hive_save_my_registration(entry);
 if saved->>'discord_name' <> 'qa-discord-a' or saved ? 'user_id' or saved ? 'edit_token_hash' then raise exception 'Discord identity or response projection failed'; end if;
 again := public.hive_save_my_registration(entry || '{"name":"HIVE QA updated","race":"Undead","class_name":"Paladin","spec":"Holy"}');
 if saved->>'id' <> again->>'id' or again->>'role' <> 'Healer' then raise exception 'Upsert/spec derivation failed'; end if;
 if public.hive_get_my_registration()->>'name' <> 'HIVE QA updated' then raise exception 'Own read failed'; end if;
 select count(*) into row_count from public.registrations;
 if row_count <> 0 then raise exception 'Participant bypassed table RLS'; end if;
 rejected := false;
 begin perform public.hive_save_my_registration(entry || '{"race":"Orc","class_name":"Paladin","spec":"Holy"}'); exception when check_violation then rejected := true; end;
 if not rejected then raise exception 'Invalid race/class accepted'; end if;
 rejected := false;
 begin perform public.hive_save_my_registration(entry || '{"earliest_start":"18:00"}'); exception when raise_exception then rejected := true; end;
 if not rejected then raise exception '18:00 accepted'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 if public.hive_get_my_registration() is not null or public.hive_delete_my_registration() then raise exception 'Cross-account read/delete allowed'; end if;
 again := public.hive_save_my_registration(entry || jsonb_build_object('id',saved->>'id','user_id',a));
 if again->>'id' = saved->>'id' or again->>'discord_name' <> 'qa-discord-b' then raise exception 'Cross-account ownership spoofing allowed'; end if;
 if not public.hive_delete_my_registration() then raise exception 'Own delete failed'; end if;
 if public.hive_get_my_registration() is not null then raise exception 'Deleted row still present'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);
 rejected := false;
 begin perform public.hive_save_my_registration(entry); exception when insufficient_privilege then rejected := true; end;
 if not rejected then raise exception 'Non-Discord identity accepted'; end if;
 perform set_config('role','postgres',true);
 insert into public.hive_admins(user_id) values(c);
 perform set_config('role','authenticated',true);
 update public.registrations set name='HIVE QA admin edit' where id=(saved->>'id')::uuid;
 get diagnostics row_count = row_count;
 if row_count <> 1 then raise exception 'Admin edit failed'; end if;
 delete from public.registrations where id=(saved->>'id')::uuid;
 get diagnostics row_count = row_count;
 if row_count <> 1 then raise exception 'Admin delete failed'; end if;
 perform set_config('role','postgres',true);
 if has_function_privilege('anon','public.hive_save_my_registration(jsonb)','execute') or has_function_privilege('authenticated','public.hive_create_registration(jsonb,text)','execute') or has_function_privilege('anon','public.hive_update_registration(uuid,text,jsonb)','execute') then raise exception 'Legacy/anonymous endpoint still allowed'; end if;
end; $$;
rollback;
select 'PASS: Discord identity, own create/read/update/delete, account isolation, RLS, admin edit/delete, Race/Class and 18:00; all test data rolled back' as verification;
