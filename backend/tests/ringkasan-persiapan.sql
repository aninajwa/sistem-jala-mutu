-- All temporary fixtures and the locked-profile check are rolled back.
begin;
do $$
declare provider_auth uuid; provider_id integer; pid integer; state jsonb; before_state jsonb; after_state jsonb; checklist jsonb; r record; visible boolean; n integer; doc_count integer;
begin
 select p.pengguna_id,p.auth_user_id into provider_id,provider_auth from public.pengguna p join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) where pr.nama='penyedia_jasa' limit 1;
 select paket_id into pid from public.paket_kontrak order by paket_id limit 1;
 if provider_auth is null or pid is null then raise exception 'Need a linked provider and one package';end if;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);
 execute 'set local role authenticated';
 before_state:=public.baca_checklist_persiapan(pid);
 state:=public.baca_ringkasan_persiapan(pid);
 after_state:=public.baca_checklist_persiapan(pid);
 if before_state<>after_state then raise exception 'Summary changed checklist';end if;
 if state->'pengisian'<>before_state->'pengisian' then raise exception 'Version/status mismatch';end if;
 checklist:=state->'checklist';
 if (checklist->>'jumlah_item')::int<>(before_state#>>'{ringkasan,jumlah_item}')::int then raise exception 'Item count mismatch';end if;
 if (checklist->>'jumlah_terjawab')::int<>(before_state#>>'{ringkasan,jumlah_terjawab}')::int then raise exception 'Answer count mismatch';end if;
 if (checklist->>'jumlah_ya')::int+(checklist->>'jumlah_tidak')::int+(checklist->>'jumlah_belum_dijawab')::int<>(checklist->>'jumlah_item')::int then raise exception 'Answer totals inconsistent';end if;
 select count(*) into n from jsonb_array_elements(before_state->'items') i where i->>'bukti_dokumen_id' is not null;
 if (checklist->>'jumlah_item_dengan_pautan_bukti')::int<>n then raise exception 'Link count mismatch';end if;
 select count(*) into doc_count from public.dokumen where paket_id=pid and sumber_tipe='PERSIAPAN' and status='TERSEDIA';
 if (state#>>'{dokumen,jumlah_tersedia}')::int<>doc_count or state->>'syarat_submit_aktif'<>'false' then raise exception 'Document/submit mismatch';end if;
 execute 'reset role';
 -- Exercise every linked account: visible packages work; foreign scopes must raise P0002.
 for r in select distinct auth_user_id from public.pengguna where auth_user_id is not null loop
  perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);
  execute 'set local role authenticated';
  select exists(select 1 from public.paket_kontrak where paket_id=pid) into visible;
  if visible then
   state:=public.baca_ringkasan_persiapan(pid);
   if (state->>'paket_id')::int<>pid then raise exception 'Wrong package';end if;
  else
   begin perform public.baca_ringkasan_persiapan(pid);raise exception 'Foreign scope leaked summary';exception when no_data_found then null;end;
  end if;
  execute 'reset role';
 end loop;
 -- Empty package: GET must return 25 unanswered items and not create a filling row.
 insert into public.paket_kontrak(paket_id,balai_id,nama_paket,status) overriding system value values(-2100000002,1,'Temporary summary test','DRAFT');
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);
 execute 'set local role authenticated';
 state:=public.baca_ringkasan_persiapan(-2100000002);
 if state#>>'{pengisian,pengisian_id}' is not null or state#>>'{pengisian,versi}'<>'0' or state#>>'{checklist,jumlah_belum_dijawab}'<>'25' or state#>>'{checklist,jumlah_item_dengan_pautan_bukti}'<>'0' or state#>>'{dokumen,jumlah_tersedia}'<>'0' then raise exception 'Empty package summary incorrect';end if;
 begin perform public.baca_ringkasan_persiapan(2147483647);raise exception 'Missing package accepted';exception when no_data_found then null;end;
 execute 'reset role';
 if exists(select 1 from public.checklist_pengisian where paket_id=-2100000002) then raise exception 'GET created checklist';end if;
 update public.pengguna set terkunci=true where pengguna_id=provider_id;
 execute 'set local role authenticated';
 begin perform public.baca_ringkasan_persiapan(pid);raise exception 'Locked profile allowed';exception when no_data_found then null;end;
 execute 'reset role';
 if has_function_privilege('anon','public.baca_ringkasan_persiapan(integer)','EXECUTE') then raise exception 'Anonymous execute allowed';end if;
 if (select prosecdef from pg_proc where oid='public.baca_ringkasan_persiapan(integer)'::regprocedure) then raise exception 'Must be invoker';end if;
end $$;
rollback;
select 'PASS: counts match source data, all account scopes, locked/missing package, empty unsaved checklist, no writes, invoker and anonymous restriction; fixtures rolled back' as verification;
