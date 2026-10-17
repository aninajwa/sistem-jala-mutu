-- Run as project database owner. All fixtures, grants context and changes roll back.
begin;
do $$
declare provider_id integer; provider_auth uuid; selected_balai integer; r record; result public.paket_kontrak; invalid_patch jsonb; n integer; snapshot jsonb;
begin
 select p.pengguna_id,p.auth_user_id into provider_id,provider_auth from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran pr on pr.peran_id=pp.peran_id where pr.nama='penyedia_jasa' limit 1;
 select min(balai_id) into selected_balai from public.balai where aktif;
 insert into public.paket_kontrak(paket_id,balai_id,nama_paket,nomor_kontrak,tahun_anggaran,status,created_by) overriding system value values
 (-2100000001,selected_balai,'Temporary Edit A','__EDIT_A__',2026,'DRAFT',provider_id),
 (-2100000002,selected_balai,'Temporary Edit B','__EDIT_CONFLICT__',2026,'DRAFT',provider_id),
 (-2100000003,selected_balai,'Temporary Active','__EDIT_ACTIVE__',2026,'AKTIF',provider_id);
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);
 execute 'set local role authenticated';
 select * into result from public.ubah_paket_draft(-2100000001,'{"nama_paket":" Updated draft ","nomor_kontrak":" __EDIT_UPDATED__ ","tahun_anggaran":2027,"nama_ppk":" PPK Ujian ","tgl_spmk":"2026-10-17"}');
 if result.nama_paket<>'Updated draft' or result.nomor_kontrak<>'__EDIT_UPDATED__' or result.tahun_anggaran<>2027 or result.nama_ppk<>'PPK Ujian' or result.tgl_spmk<>'2026-10-17'::date or result.status<>'DRAFT' or result.created_by<>provider_id then raise exception 'Valid edit failed';end if;
 snapshot:=to_jsonb(result);
 -- No-op succeeds and produces no extra audit entry.
 perform public.ubah_paket_draft(-2100000001,'{"nama_ppk":"PPK Ujian"}');
 for invalid_patch in select value from jsonb_array_elements('[{}, {"status":"DISETUJUI"}, {"created_by":1}, {"balai_id":1}, {"nama_paket":null}, {"nama_paket":" "}, {"nomor_kontrak":42}, {"tahun_anggaran":2026.1}, {"tahun_anggaran":"2026"}, {"nama_ppk":{}}, {"tgl_spmk":"2026-02-30"}, {"tgl_spmk":"17/10/2026"}, {"tgl_spmk":42}, {"tgl_spmk":"0000-01-01"}]'::jsonb) loop
  begin
   perform public.ubah_paket_draft(-2100000001,invalid_patch);
   raise exception 'Invalid patch accepted: %',invalid_patch;
  exception when invalid_parameter_value then null;end;
 end loop;
 begin
  perform public.ubah_paket_draft(-2100000001,'{"nomor_kontrak":"__EDIT_CONFLICT__"}');
  raise exception 'Duplicate contract accepted';exception when unique_violation then null;end;
 begin
  perform public.ubah_paket_draft(-2100000003,'{"nama_ppk":"Forbidden"}');
  raise exception 'Active package edited';exception when object_not_in_prerequisite_state then null;end;
 begin
  perform public.ubah_paket_draft(-2100000999,'{"nama_ppk":"Missing"}');
  raise exception 'Missing package accepted';exception when no_data_found then null;end;
 execute 'reset role';
 select count(*) into n from public.audit_trail where tabel='paket_kontrak' and record_id='-2100000001' and aksi='UPDATE_DRAFT' and pengguna_id=provider_id and nilai_lama->>'nama_paket'='Temporary Edit A' and nilai_baru->>'nama_paket'='Updated draft';
 if n<>1 then raise exception 'Audit before/after failed';end if;
 if (select to_jsonb(p) from public.paket_kontrak p where paket_id=-2100000001)<>snapshot then raise exception 'Failed edits modified row';end if;
 for r in select distinct p.auth_user_id from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran pr on pr.peran_id=pp.peran_id where pr.nama<>'penyedia_jasa' loop
  perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);
  execute 'set local role authenticated';
  begin
   perform public.ubah_paket_draft(-2100000001,'{"nama_ppk":"Forbidden"}');
   raise exception 'Non-provider edited package';exception when insufficient_privilege then null;end;
  execute 'reset role';
 end loop;
 update public.pengguna set terkunci=true where pengguna_id=provider_id;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);
 execute 'set local role authenticated';
 begin
  perform public.ubah_paket_draft(-2100000001,'{"nama_ppk":"Locked"}');
  raise exception 'Locked provider edited';exception when insufficient_privilege then null;end;
 execute 'reset role';
 update public.pengguna set terkunci=false where pengguna_id=provider_id;
 -- A failed audit insert must roll back the package update as well.
 alter table public.audit_trail add constraint test_edit_audit_failure check (aksi<>'UPDATE_DRAFT') not valid;
 execute 'set local role authenticated';
 begin
  perform public.ubah_paket_draft(-2100000001,'{"nama_ppk":"Must roll back"}');
  raise exception 'Audit failure was not raised';exception when check_violation then null;end;
 execute 'reset role';
 if (select to_jsonb(p) from public.paket_kontrak p where paket_id=-2100000001)<>snapshot then raise exception 'Audit atomicity failed';end if;
 alter table public.audit_trail drop constraint test_edit_audit_failure;
 execute 'set local role authenticated';
 select * into result from public.ubah_paket_draft(-2100000001,'{"nama_ppk":null,"tgl_spmk":null}');
 if result.nama_ppk is not null or result.tgl_spmk is not null then raise exception 'Clearing optional fields failed';end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub','',true);
 execute 'set local role authenticated';
 begin
  perform public.ubah_paket_draft(-2100000001,'{"nama_ppk":"No identity"}');
  raise exception 'Missing identity edited';exception when insufficient_privilege then null;end;
 execute 'reset role';
 if has_function_privilege('anon','public.ubah_paket_draft(integer,jsonb)','EXECUTE') then raise exception 'Anonymous RPC allowed';end if;
end $$;
rollback;
select 'PASS: valid edits, trimming, no-op, 14 invalid inputs, duplicate, non-draft/missing packages, non-provider/locked/missing identity rejection, audit atomicity and nullable fields; fixtures rolled back' as verification;
