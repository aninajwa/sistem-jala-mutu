begin;
do $$
declare provider_id integer; provider_auth uuid; b1 integer; b2 integer; item1 integer; item2 integer; tpl_id integer; foreign_tpl integer; foreign_item integer; state jsonb; baseline jsonb; invalid_answers jsonb; r record; can_read boolean; n integer; qid integer;
begin
 select p.pengguna_id,p.auth_user_id into provider_id,provider_auth from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran pr on pr.peran_id=pp.peran_id where pr.nama='penyedia_jasa' limit 1;
 select min(scope_balai_id),max(scope_balai_id) into b1,b2 from public.pengguna_peran pp join public.peran pr on pr.peran_id=pp.peran_id where pr.nama='pic_balai';
 insert into public.paket_kontrak(paket_id,balai_id,nama_paket,status,created_by) overriding system value values (-2100000001,b1,'Temporary checklist A','DRAFT',provider_id),(-2100000002,b2,'Temporary checklist B','DRAFT',provider_id);
 select template_id into tpl_id from public.checklist_template where no_dokumen='JM-PERSIAPAN-TAHAP0' and revisi='DRAFT-01';
 select item_id into item1 from public.checklist_item where template_id=tpl_id order by urutan limit 1;
 select item_id into item2 from public.checklist_item where template_id=tpl_id order by urutan offset 1 limit 1;
 insert into public.checklist_template(jenis,no_dokumen,revisi) values ('OTHER','__CHECKLIST_TEST__','TEST') returning template_id into foreign_tpl;
 insert into public.checklist_item(template_id,uraian) values(foreign_tpl,'Other template') returning item_id into foreign_item;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 state:=public.baca_checklist_persiapan(-2100000001);
 if jsonb_array_length(state->'items')<>25 or (state#>>'{pengisian,versi}')::integer<>0 or state#>>'{pengisian,pengisian_id}' is not null then raise exception 'Unsaved view invalid';end if;
 state:=public.simpan_checklist_persiapan(-2100000001,0,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya','keterangan','Catatan asal'),jsonb_build_object('item_id',item2,'jawaban','Tidak')));
 qid:=(state#>>'{pengisian,pengisian_id}')::integer;
 if (state#>>'{ringkasan,jumlah_terjawab}')::integer<>2 or (state#>>'{pengisian,versi}')::integer<>1 or (state#>>'{ringkasan,persen_terisi}')::numeric<>8 then raise exception 'Save summary invalid';end if;
 if (state#>>'{ringkasan,syarat_submit_aktif}')::boolean then raise exception 'Unexpected submission readiness';end if;
 state:=public.simpan_checklist_persiapan(-2100000001,1,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Tidak')));
 if state#>>'{items,0,keterangan}'<>'Catatan asal' or (state#>>'{ringkasan,jumlah_terjawab}')::integer<>2 then raise exception 'Partial save lost notes or other answers';end if;
 state:=public.simpan_checklist_persiapan(-2100000001,2,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban',null)));
 if (state#>>'{ringkasan,jumlah_terjawab}')::integer<>1 or (state#>>'{pengisian,versi}')::integer<>3 then raise exception 'Clearing answer failed';end if;
 baseline:=state;
 begin
 perform public.simpan_checklist_persiapan(-2100000001,1,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya')));
 raise exception 'Stale version accepted';exception when serialization_failure then null;end;
 for invalid_answers in select value from jsonb_array_elements(jsonb_build_array('[]'::jsonb,'{}'::jsonb,
 jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','MUNGKIN')),
 jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban',true)),
 jsonb_build_array(jsonb_build_object('item_id',item1)),
 jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya','keterangan',null)),
 jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya','bukti_dokumen_id',1)),
 jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya'),jsonb_build_object('item_id',item1,'jawaban','Tidak')),
 jsonb_build_array(jsonb_build_object('item_id',foreign_item,'jawaban','Ya')),
 jsonb_build_array(jsonb_build_object('item_id',1.5,'jawaban','Ya')),
 jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya','keterangan',repeat('x',2001))))) loop
 begin
 perform public.simpan_checklist_persiapan(-2100000001,3,invalid_answers);
 raise exception 'Invalid answers accepted';exception when invalid_parameter_value then null;end;
 end loop;
 execute 'reset role';
 select count(*) into n from public.audit_trail where tabel='checklist_pengisian' and record_id=qid::text and aksi='SAVE_DRAFT';
 if n<>3 then raise exception 'Audit count invalid';end if;
 for r in select p.auth_user_id,p.pengguna_id,pr.nama,pp.scope_balai_id from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran pr on pr.peran_id=pp.peran_id loop
 can_read:=r.nama in ('penyedia_jasa','admin','direktorat') or (r.nama='pic_balai' and r.scope_balai_id=b1);
 perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);execute 'set local role authenticated';
 select count(*) into n from public.checklist_pengisian where pengisian_id=qid;
 if n<>(case when can_read then 1 else 0 end) then raise exception 'Direct RLS leak in checklist';end if;
 select count(*) into n from public.checklist_jawaban where pengisian_id=qid;
 if n<>(case when can_read then 2 else 0 end) then raise exception 'Direct RLS leak in answers';end if;
 if can_read then
 state:=public.baca_checklist_persiapan(-2100000001);
 if state#>>'{pengisian,pengisian_id}'<>qid::text then raise exception 'RPC read failed';end if;
 else
 begin
 perform public.baca_checklist_persiapan(-2100000001);raise exception 'Foreign PIC RPC read allowed';
 exception when no_data_found then null;end;
 end if;
 if r.nama<>'penyedia_jasa' then
 begin
 perform public.simpan_checklist_persiapan(-2100000001,3,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya')));
 raise exception 'Non-provider save allowed';exception when insufficient_privilege then null;end;
 end if;
 if has_table_privilege(current_user,'public.checklist_jawaban','UPDATE') or has_table_privilege(current_user,'public.checklist_pengisian','INSERT') then raise exception 'Unexpected direct writes';end if;
 execute 'reset role';
 end loop;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);
 update public.checklist_pengisian set status='DIAJUKAN' where pengisian_id=qid;
 execute 'set local role authenticated';
 begin
 perform public.simpan_checklist_persiapan(-2100000001,3,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya')));
 raise exception 'Submitted checklist edited';exception when object_not_in_prerequisite_state then null;end;
 execute 'reset role';update public.checklist_pengisian set status='DRAFT' where pengisian_id=qid;
 update public.paket_kontrak set status='AKTIF' where paket_id=-2100000001;
 execute 'set local role authenticated';
 begin
 perform public.simpan_checklist_persiapan(-2100000001,3,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya')));
 raise exception 'Non-draft package edited';exception when object_not_in_prerequisite_state then null;end;
 execute 'reset role';update public.paket_kontrak set status='DRAFT' where paket_id=-2100000001;
 alter table public.audit_trail add constraint test_checklist_audit_failure check(aksi<>'SAVE_DRAFT') not valid;
 execute 'set local role authenticated';
 begin
 perform public.simpan_checklist_persiapan(-2100000001,3,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya')));
 raise exception 'Audit failure not raised';exception when check_violation then null;end;
 if public.baca_checklist_persiapan(-2100000001)<>baseline then raise exception 'Audit rollback failed';end if;
 execute 'reset role';alter table public.audit_trail drop constraint test_checklist_audit_failure;
 update public.pengguna set terkunci=true where pengguna_id=provider_id;
 execute 'set local role authenticated';
 select count(*) into n from public.checklist_jawaban where pengisian_id=qid;
 if n<>0 then raise exception 'Locked profile read allowed';end if;
 begin
 perform public.simpan_checklist_persiapan(-2100000001,3,jsonb_build_array(jsonb_build_object('item_id',item1,'jawaban','Ya')));
 raise exception 'Locked provider saved';exception when insufficient_privilege then null;end;
 execute 'reset role';
 if has_function_privilege('anon','public.simpan_checklist_persiapan(integer,integer,jsonb)','EXECUTE') or has_function_privilege('anon','public.baca_checklist_persiapan(integer)','EXECUTE') then raise exception 'Anonymous RPC granted';end if;
end $$;
rollback;
select 'PASS: draft read/save, partial update, clearing, version conflicts, input validation, audit atomicity, all 36 account scopes including direct table reads; test fixtures rolled back' as verification;
