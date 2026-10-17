-- Real database test; no Storage writes. All calibration/metadata fixtures rolled back.
begin;
do $$
declare provider_auth uuid; provider_user integer; pid integer; alat integer; balai integer; k integer; v integer; data jsonb; state jsonb; old_state jsonb; row_data public.kalibrasi_alat; r record; can_read boolean; policy text; allowed boolean; doc integer; kind integer; path text;
begin
 select u.pengguna_id,u.auth_user_id into provider_user,provider_auth from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) where pr.nama='penyedia_jasa' limit 1;
 select a.alat_id,t.paket_id,p.balai_id into alat,pid,balai from public.penugasan_alat a join public.tim_survei t using(tim_id) join public.paket_kontrak p using(paket_id) join public.checklist_pengisian q using(paket_id) where q.status='DISETUJUI' order by a.penugasan_id limit 1;
 if alat is null then raise exception 'Need an assigned tool on approved package';end if;
 data:=jsonb_build_object('alat_id',alat,'jenis','RELATIF','standar','UJIAN - standard sijil','komponen','Transduser jarak','tgl_kalibrasi','2026-10-18','berlaku_sd',null,'pelaksana','UJIAN - pelaksana');
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 begin perform public.simpan_kalibrasi_alat(pid,null,null,data||'{"status":"LULUS"}');raise exception 'Forged status allowed';exception when invalid_parameter_value then null;end;
 begin perform public.simpan_kalibrasi_alat(pid,null,null,data||'{"alat_id":2147483647}');raise exception 'Unassigned tool allowed';exception when invalid_parameter_value then null;end;
 begin perform public.simpan_kalibrasi_alat(pid,null,null,data||'{"tgl_kalibrasi":"2026-02-30"}');raise exception 'Bad date allowed';exception when invalid_parameter_value then null;end;
 begin perform public.simpan_kalibrasi_alat(pid,null,null,data||'{"berlaku_sd":"2026-10-01"}');raise exception 'Invalid expiry allowed';exception when invalid_parameter_value then null;end;
 execute 'reset role';alter table public.audit_trail add constraint test_cal_audit_failure check(aksi<>'CREATE_CALIBRATION_DRAFT') not valid;
 execute 'set local role authenticated';
 begin perform public.simpan_kalibrasi_alat(pid,null,null,data);raise exception 'Create audit failure not raised';exception when check_violation then null;end;
 execute 'reset role';alter table public.audit_trail drop constraint test_cal_audit_failure;
 execute 'set local role authenticated';
 state:=public.simpan_kalibrasi_alat(pid,null,null,data);k:=(state->>'kalibrasi_id')::int;v:=(state->>'versi')::int;
 if state->>'status'<>'DRAFT' or v<>1 or state->>'berlaku_sd' is not null or state->>'dokumen_id' is not null then raise exception 'Draft defaults fabricated expiry/result/certificate';end if;
 state:=public.simpan_kalibrasi_alat(pid,k,v,'{"pelaksana":"UJIAN - pembetulan"}');v:=(state->>'versi')::int;
 if v<>2 or state->>'pelaksana'<>'UJIAN - pembetulan' then raise exception 'Edit failed';end if;
 if (public.simpan_kalibrasi_alat(pid,k,v,'{"pelaksana":"UJIAN - pembetulan"}')->>'versi')::int<>v then raise exception 'No-op increased version';end if;
 begin perform public.simpan_kalibrasi_alat(pid,k,1,'{"pelaksana":"Stale"}');raise exception 'Stale edit allowed';exception when serialization_failure then null;end;
 begin perform public.simpan_kalibrasi_alat(pid,k,v,'{"alat_id":1}');raise exception 'Tool reparent allowed';exception when invalid_parameter_value then null;end;
 old_state:=public.simpan_kalibrasi_alat(pid,k,v,'{"pelaksana":"UJIAN - pembetulan"}');
 execute 'reset role';alter table public.audit_trail add constraint test_cal_edit_audit_failure check(aksi<>'UPDATE_CALIBRATION_DRAFT') not valid;
 execute 'set local role authenticated';
 begin perform public.simpan_kalibrasi_alat(pid,k,v,'{"pelaksana":"Must roll back"}');raise exception 'Edit audit failure not raised';exception when check_violation then null;end;
 select to_jsonb(c) into state from public.kalibrasi_alat c where kalibrasi_id=k;
 if state<>old_state then raise exception 'Edit audit rollback incomplete';end if;
 execute 'reset role';alter table public.audit_trail drop constraint test_cal_edit_audit_failure;
 -- Public metadata fixture for registered-file policies, never a Storage object fixture.
 select jenis_dokumen_id into kind from public.jenis_dokumen where kode='SERTIFIKAT_KALIBRASI';
 insert into public.dokumen(paket_id,jenis_dokumen_id,judul,sumber_tipe,sumber_id,versi_aktif,status,diunggah_oleh) values(pid,kind,'Rollback policy certificate','KALIBRASI',k,1,'TERSEDIA',provider_user) returning dokumen_id into doc;
 path:=pid||'/'||k||'/00000000-0000-4000-8000-000000000011.pdf';
 insert into public.dokumen_versi(dokumen_id,versi_ke,bucket_id,object_path,nama_file,hash_file,ukuran_byte) values(doc,1,'dokumen-kalibrasi',path,'fixture.pdf',repeat('a',64),100);
 update public.kalibrasi_alat set dokumen_id=doc where kalibrasi_id=k;
 for r in select u.auth_user_id,u.pengguna_id,pr.nama,pp.scope_balai_id,pp.scope_paket_id from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) loop
  can_read:=r.nama in ('penyedia_jasa','admin','direktorat') or (r.nama='pic_balai' and r.scope_balai_id=balai and (r.scope_paket_id is null or r.scope_paket_id=pid));
  perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);execute 'set local role authenticated';
  if (select count(*) from public.kalibrasi_alat where kalibrasi_id=k)<>(case when can_read then 1 else 0 end) then raise exception 'Calibration RLS failed';end if;
  if (select count(*) from public.dokumen_versi where dokumen_id=doc)<>(case when can_read then 1 else 0 end) then raise exception 'Certificate version RLS failed';end if;
  execute 'reset role';select pg_get_expr(polqual,polrelid) into policy from pg_policy where polname='kalibrasi_storage_read' and polrelid='storage.objects'::regclass;execute 'set local role authenticated';
  execute 'select ('||policy||') from (select $1::text bucket_id,$2::text name,$3::text owner_id) objects' into allowed using 'dokumen-kalibrasi',path,provider_auth::text;
  if allowed is distinct from can_read then raise exception 'Certificate Storage read scope failed';end if;
  if r.nama<>'penyedia_jasa' then
   begin perform public.simpan_kalibrasi_alat(pid,null,null,data);raise exception 'Non-provider creates';exception when insufficient_privilege then null;end;
   begin perform public.daftar_sertifikat_kalibrasi(pid,k,v,path,'fixture.pdf',100,repeat('a',64));raise exception 'Non-provider uploads';exception when insufficient_privilege then null;end;
  end if;
  if has_table_privilege(current_user,'public.kalibrasi_alat','INSERT') or has_table_privilege(current_user,'public.kalibrasi_alat','UPDATE') then raise exception 'Direct calibration writes granted';end if;
  execute 'reset role';
 end loop;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 -- Deletion protection must work even when a registered document is hidden by its RLS.
 execute 'reset role';update public.dokumen set status='DRAFT' where dokumen_id=doc;
 select pg_get_expr(polqual,polrelid) into policy from pg_policy where polname='kalibrasi_storage_cleanup' and polrelid='storage.objects'::regclass;
 execute 'set local role authenticated';
 execute 'select ('||policy||') from (select $1::text bucket_id,$2::text name,$3::text owner_id) objects' into allowed using 'dokumen-kalibrasi',path,provider_auth::text;
 if allowed then raise exception 'Hidden registered object can be deleted';end if;
 execute 'reset role';update public.dokumen set status='TERSEDIA' where dokumen_id=doc;
 select pg_get_expr(polwithcheck,polrelid) into policy from pg_policy where polname='kalibrasi_storage_insert' and polrelid='storage.objects'::regclass;
 execute 'set local role authenticated';
 execute 'select ('||policy||') from (select $1::text bucket_id,$2::text name,$3::text owner_id) objects' into allowed using 'dokumen-kalibrasi',path,provider_auth::text;
 if not allowed then raise exception 'Draft upload predicate denies provider';end if;
 execute 'reset role';update public.kalibrasi_alat set status='LULUS' where kalibrasi_id=k;
 execute 'set local role authenticated';
 begin perform public.simpan_kalibrasi_alat(pid,k,v,'{"pelaksana":"Blocked"}');raise exception 'Non-draft edit allowed';exception when object_not_in_prerequisite_state then null;end;
 begin perform public.daftar_sertifikat_kalibrasi(pid,k,v,path,'fixture.pdf',100,repeat('a',64));raise exception 'Non-draft upload allowed';exception when object_not_in_prerequisite_state then null;end;
 execute 'select ('||policy||') from (select $1::text bucket_id,$2::text name,$3::text owner_id) objects' into allowed using 'dokumen-kalibrasi',path,provider_auth::text;
 if allowed then raise exception 'Non-draft Storage upload predicate allowed';end if;
 execute 'reset role';
 if has_function_privilege('anon','public.simpan_kalibrasi_alat(integer,integer,integer,jsonb)','EXECUTE') or has_function_privilege('anon','public.daftar_sertifikat_kalibrasi(integer,integer,integer,text,text,bigint,text)','EXECUTE') then raise exception 'Anon RPC granted';end if;
end $$;
rollback;
select 'PASS: draft create/edit/no-op, input and date validation, tool assignment, optimistic version, audit rollback, all-account calibration/certificate/Storage read scopes, draft upload predicate, hidden-registered cleanup denial and non-draft locks. No Storage SQL writes; fixtures rolled back. Real bucket upload remains to be tested.' as verification;
