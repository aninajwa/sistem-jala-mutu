-- Uses existing test PDF metadata. No Storage objects are inserted/deleted/updated by SQL.
-- A temporary public metadata path change frees the real object's path for registration;
-- the original path, versions, checklist and audit records are all restored by ROLLBACK.
begin;
do $$
declare actor integer; provider_auth uuid; d public.dokumen; original public.dokumen_versi; old_version public.dokumen_versi; q public.checklist_pengisian; state jsonb; baseline jsonb; result jsonb; original_answers jsonb; r record; item_id integer; wrong_path text; n integer;
begin
 select p.pengguna_id,p.auth_user_id into actor,provider_auth from public.pengguna p join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) where pr.nama='penyedia_jasa' limit 1;
 select doc.* into d from public.dokumen doc join public.dokumen_versi v on v.dokumen_id=doc.dokumen_id and v.versi_ke=doc.versi_aktif join storage.objects o on o.name=v.object_path and o.bucket_id=v.bucket_id where doc.sumber_tipe='PERSIAPAN' and doc.status='TERSEDIA' and o.owner_id=provider_auth::text order by doc.dokumen_id limit 1;
 if d.dokumen_id is null then raise exception 'Need one uploaded provider test PDF';end if;
 select * into original from public.dokumen_versi where dokumen_id=d.dokumen_id and versi_ke=d.versi_aktif;
 select i.item_id into item_id from public.checklist_item i join public.jenis_dokumen j on j.kode=i.jenis_bukti_kode where j.jenis_dokumen_id=d.jenis_dokumen_id limit 1;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 baseline:=public.baca_checklist_persiapan(d.paket_id);
 state:=public.tautkan_bukti_persiapan(d.paket_id,(baseline#>>'{pengisian,versi}')::int,item_id,d.dokumen_id);
 execute 'reset role';
 select * into q from public.checklist_pengisian where pengisian_id=(state#>>'{pengisian,pengisian_id}')::int;
 select jsonb_agg(to_jsonb(a) order by a.jawaban_id) into original_answers from public.checklist_jawaban a where pengisian_id=q.pengisian_id;
 -- Only a public fixture metadata path changes, inside this rollback transaction.
 update public.dokumen_versi set object_path=object_path||'.rollback-fixture' where dok_versi_id=original.dok_versi_id returning * into old_version;
 wrong_path:=d.paket_id::text||'/00000000-0000-4000-8000-000000000077.pdf';
 execute 'set local role authenticated';
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,0,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Invalid version allowed';exception when invalid_parameter_value then null;end;
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,wrong_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Missing Storage object allowed';exception when invalid_parameter_value then null;end;
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,2147483647,d.versi_aktif,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Missing document allowed';exception when no_data_found then null;end;
 execute 'reset role';
 update public.checklist_pengisian set status='DIAJUKAN' where pengisian_id=q.pengisian_id;
 execute 'set local role authenticated';
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Submitted evidence replaced';exception when object_not_in_prerequisite_state then null;end;
 execute 'reset role';update public.checklist_pengisian set status='DRAFT' where pengisian_id=q.pengisian_id;
 update public.paket_kontrak set status='AKTIF' where paket_id=d.paket_id;
 execute 'set local role authenticated';
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Non-draft package replaced';exception when object_not_in_prerequisite_state then null;end;
 execute 'reset role';update public.paket_kontrak set status='DRAFT' where paket_id=d.paket_id;
 -- An audit failure must roll back active version, new metadata row and checklist version.
 alter table public.audit_trail add constraint test_version_audit_failure check(aksi<>'UPLOAD_DOCUMENT_VERSION') not valid;
 execute 'set local role authenticated';
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Audit failure not raised';exception when check_violation then null;end;
 execute 'reset role';
 if (select versi_aktif from public.dokumen where dokumen_id=d.dokumen_id)<>d.versi_aktif or exists(select 1 from public.dokumen_versi where object_path=original.object_path) or (select versi from public.checklist_pengisian where pengisian_id=q.pengisian_id)<>q.versi then raise exception 'Audit failure was not atomic';end if;
 alter table public.audit_trail drop constraint test_version_audit_failure;
 execute 'set local role authenticated';
 result:=public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);
 if result#>>'{dokumen,dokumen_id}'<>d.dokumen_id::text or result#>>'{dokumen,versi_aktif}'<>(d.versi_aktif+1)::text then raise exception 'Document identity/active version incorrect';end if;
 if not exists(select 1 from public.dokumen_versi v where v.dok_versi_id=old_version.dok_versi_id and to_jsonb(v)=to_jsonb(old_version)) then raise exception 'Old version modified';end if;
 state:=public.baca_checklist_persiapan(d.paket_id);
 if state#>>'{pengisian,versi}'<>(q.versi+1)::text then raise exception 'Linked checklist version did not increase';end if;
 if (select jsonb_agg(to_jsonb(a) order by a.jawaban_id) from public.checklist_jawaban a where pengisian_id=q.pengisian_id)<>original_answers then raise exception 'Answers/links changed';end if;
 -- Retry same object is a no-op, without another checklist increment.
 perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);
 if (select versi from public.checklist_pengisian where pengisian_id=q.pengisian_id)<>q.versi+1 then raise exception 'Retry increased checklist version';end if;
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,wrong_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Stale version allowed';exception when serialization_failure then null;end;
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif+1,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Registered object reused for another version';exception when invalid_parameter_value then null;end;
 execute 'reset role';
 for r in select distinct p.auth_user_id from public.pengguna p join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) where pr.nama<>'penyedia_jasa' loop
  perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);execute 'set local role authenticated';
  begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Non-provider upload allowed';exception when insufficient_privilege then null;end;
  execute 'reset role';
 end loop;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);
 update public.pengguna set terkunci=true where pengguna_id=actor;execute 'set local role authenticated';
 begin perform public.tambah_versi_dokumen_persiapan(d.paket_id,d.dokumen_id,d.versi_aktif,original.object_path,original.nama_file,original.ukuran_byte,original.hash_file);raise exception 'Locked profile allowed';exception when insufficient_privilege then null;end;
 execute 'reset role';
 if has_function_privilege('anon','public.tambah_versi_dokumen_persiapan(integer,integer,integer,text,text,bigint,text)','EXECUTE') then raise exception 'Anonymous execute granted';end if;
end $$;
rollback;
select 'PASS: metadata version registration, old-version retention, linked-checklist version and answer preservation, retry no-op, stale conflict, draft locks, provider/locked restrictions, and audit atomicity. All fixtures restored; Storage unchanged.' as verification;
