-- Uses an existing uploaded test document read-only, with every checklist edit rolled back.
begin;
do $$
declare provider_id integer; provider_auth uuid; real_doc integer; real_package integer; matched_item integer; wrong_item integer; base_version integer; current_version integer; qid integer; base_state jsonb; state jsonb; baseline jsonb; item jsonb; r record; n integer; audit_before integer;
begin
 select p.pengguna_id,p.auth_user_id into provider_id,provider_auth from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran pr on pr.peran_id=pp.peran_id where pr.nama='penyedia_jasa' limit 1;
 select d.dokumen_id,d.paket_id into real_doc,real_package from public.dokumen d join public.jenis_dokumen j on j.jenis_dokumen_id=d.jenis_dokumen_id join public.dokumen_versi v on v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif join storage.objects o on o.bucket_id=v.bucket_id and o.name=v.object_path where j.kode='LAPORAN_PENDAHULUAN' and d.status='TERSEDIA' order by d.dokumen_id limit 1;
 if real_doc is null then raise exception 'Upload one test document before this test';end if;
 select i.item_id into matched_item from public.checklist_item i join public.checklist_template t on t.template_id=i.template_id where i.jenis_bukti_kode='LAPORAN_PENDAHULUAN' and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01';
 select i.item_id into wrong_item from public.checklist_item i join public.checklist_template t on t.template_id=i.template_id where i.jenis_bukti_kode='PROGRAM_MUTU' and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01';
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 base_state:=public.baca_checklist_persiapan(real_package);base_version:=(base_state#>>'{pengisian,versi}')::integer;
 state:=public.tautkan_bukti_persiapan(real_package,base_version,matched_item,real_doc);current_version:=(state#>>'{pengisian,versi}')::integer;qid:=(state#>>'{pengisian,pengisian_id}')::integer;
 select value into item from jsonb_array_elements(state->'items') where (value->>'item_id')::integer=matched_item;
 if item->>'bukti_dokumen_id'<>real_doc::text then raise exception 'Evidence not linked';end if;
 if state->'ringkasan'<>base_state->'ringkasan' then raise exception 'Linking changed answer completeness';end if;
 -- A no-op must not increment version or add an extra audit.
 if (public.tautkan_bukti_persiapan(real_package,current_version,matched_item,real_doc)#>>'{pengisian,versi}')::integer<>current_version then raise exception 'No-op changed version';end if;
 begin
 perform public.tautkan_bukti_persiapan(real_package,current_version,wrong_item,real_doc);
 raise exception 'Wrong document type linked';exception when invalid_parameter_value then null;end;
 begin
 perform public.tautkan_bukti_persiapan(real_package,current_version,1,real_doc);
 raise exception 'Unmapped item linked';exception when invalid_parameter_value then null;end;
 begin
 perform public.tautkan_bukti_persiapan(real_package,current_version,matched_item,2147483647);
 raise exception 'Missing document linked';exception when invalid_parameter_value then null;end;
 begin
 perform public.tautkan_bukti_persiapan(real_package,base_version,matched_item,real_doc);
 raise exception 'Stale version allowed';exception when serialization_failure then null;end;
 state:=public.simpan_checklist_persiapan(real_package,current_version,jsonb_build_array(jsonb_build_object('item_id',matched_item,'jawaban','Tidak','keterangan','Temporary test note')));current_version:=(state#>>'{pengisian,versi}')::integer;
 select value into item from jsonb_array_elements(state->'items') where (value->>'item_id')::integer=matched_item;
 if item->>'bukti_dokumen_id'<>real_doc::text then raise exception 'Saving answers erased evidence';end if;
 execute 'reset role';
 insert into public.paket_kontrak(paket_id,balai_id,nama_paket,status) overriding system value values(-2100000001,1,'Temporary foreign evidence package','DRAFT');
 execute 'set local role authenticated';
 begin
 perform public.tautkan_bukti_persiapan(-2100000001,0,matched_item,real_doc);
 raise exception 'Cross-package evidence allowed';exception when invalid_parameter_value then null;end;
 execute 'reset role';
 for r in select distinct p.auth_user_id from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran pr on pr.peran_id=pp.peran_id where pr.nama<>'penyedia_jasa' loop
 perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);execute 'set local role authenticated';
 begin
 perform public.tautkan_bukti_persiapan(real_package,current_version,matched_item,null);
 raise exception 'Non-provider changed evidence';exception when insufficient_privilege then null;end;
 execute 'reset role';end loop;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);
 update public.checklist_pengisian set status='DIAJUKAN' where pengisian_id=qid;
 execute 'set local role authenticated';
 begin
 perform public.tautkan_bukti_persiapan(real_package,current_version,matched_item,null);
 raise exception 'Submitted evidence changed';exception when object_not_in_prerequisite_state then null;end;
 execute 'reset role';update public.checklist_pengisian set status='DRAFT' where pengisian_id=qid;
 update public.paket_kontrak set status='AKTIF' where paket_id=real_package;
 execute 'set local role authenticated';
 begin
 perform public.tautkan_bukti_persiapan(real_package,current_version,matched_item,null);
 raise exception 'Non-draft package evidence changed';exception when object_not_in_prerequisite_state then null;end;
 execute 'reset role';update public.paket_kontrak set status='DRAFT' where paket_id=real_package;
 execute 'set local role authenticated';baseline:=public.baca_checklist_persiapan(real_package);execute 'reset role';
 alter table public.audit_trail add constraint test_link_audit_failure check(aksi<>'UNLINK_EVIDENCE') not valid;
 execute 'set local role authenticated';
 begin
 perform public.tautkan_bukti_persiapan(real_package,current_version,matched_item,null);
 raise exception 'Audit failure not raised';exception when check_violation then null;end;
 if public.baca_checklist_persiapan(real_package)<>baseline then raise exception 'Evidence audit rollback failed';end if;
 execute 'reset role';alter table public.audit_trail drop constraint test_link_audit_failure;
 execute 'set local role authenticated';
 state:=public.tautkan_bukti_persiapan(real_package,current_version,matched_item,null);current_version:=(state#>>'{pengisian,versi}')::integer;
 select value into item from jsonb_array_elements(state->'items') where (value->>'item_id')::integer=matched_item;
 if item->>'bukti_dokumen_id' is not null or item->>'jawaban'<>'Tidak' or item->>'keterangan'<>'Temporary test note' then raise exception 'Unlink changed answers or notes';end if;
 execute 'reset role';
 if not exists(select 1 from public.dokumen where dokumen_id=real_doc) then raise exception 'Unlink deleted document';end if;
 update public.pengguna set terkunci=true where pengguna_id=provider_id;
 execute 'set local role authenticated';
 begin
 perform public.tautkan_bukti_persiapan(real_package,current_version,matched_item,real_doc);
 raise exception 'Locked provider linked evidence';exception when insufficient_privilege then null;end;
 execute 'reset role';
 if has_function_privilege('anon','public.tautkan_bukti_persiapan(integer,integer,integer,integer)','EXECUTE') then raise exception 'Anonymous execute allowed';end if;
end $$;
rollback;
select 'PASS: real uploaded document linked/unlinked within rollback; answer preservation, same-package/type checks, stale version, all other roles, draft locks and audit atomicity; original records restored' as verification;
