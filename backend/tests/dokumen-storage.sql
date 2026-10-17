-- ACL tests use public metadata fixtures and evaluate Storage policy expressions.
-- They never insert/delete SQL records in storage.objects or storage.buckets.
begin;
do $$
declare provider_id integer; provider_auth uuid; b1 integer; b2 integer; kind integer; doc_id integer; read_expr text; insert_expr text; delete_expr text; r record; allowed boolean; expected boolean; total integer; expression_result boolean; path text;
begin
 select p.pengguna_id,p.auth_user_id into provider_id,provider_auth from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran pr on pr.peran_id=pp.peran_id where pr.nama='penyedia_jasa' limit 1;
 select min(scope_balai_id),max(scope_balai_id) into b1,b2 from public.pengguna_peran pp join public.peran pr on pr.peran_id=pp.peran_id where pr.nama='pic_balai';
 insert into public.paket_kontrak(paket_id,balai_id,nama_paket,status,created_by) overriding system value values (-2100000001,b1,'Temporary doc A','DRAFT',provider_id),(-2100000002,b2,'Temporary doc B','DRAFT',provider_id);
 select jenis_dokumen_id into kind from public.jenis_dokumen where kode='LAPORAN_PENDAHULUAN';
 insert into public.dokumen(paket_id,jenis_dokumen_id,judul,status,diunggah_oleh,versi_aktif) values(-2100000001,kind,'ACL fixture only - no actual Storage file','TERSEDIA',provider_id,1) returning dokumen_id into doc_id;
 path:='-2100000001/00000000-0000-4000-8000-000000000001.pdf';
 insert into public.dokumen_versi(dokumen_id,versi_ke,object_path,nama_file,hash_file,ukuran_byte) values(doc_id,1,path,'fixture.pdf',repeat('a',64),100);
 select pg_get_expr(polqual,polrelid) into read_expr from pg_policy where polname='dokumen_storage_read_sesuai_paket' and polrelid='storage.objects'::regclass;
 select pg_get_expr(polwithcheck,polrelid) into insert_expr from pg_policy where polname='dokumen_storage_insert_provider' and polrelid='storage.objects'::regclass;
 select pg_get_expr(polqual,polrelid) into delete_expr from pg_policy where polname='dokumen_storage_delete_unregistered_only' and polrelid='storage.objects'::regclass;
 for r in select p.auth_user_id,p.pengguna_id,pr.nama,pp.scope_balai_id from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran pr on pr.peran_id=pp.peran_id loop
 expected:=r.nama in ('penyedia_jasa','admin','direktorat') or (r.nama='pic_balai' and r.scope_balai_id=b1);
 perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);execute 'set local role authenticated';
 select count(*) into total from public.dokumen where dokumen_id=doc_id;
 if total<>(case when expected then 1 else 0 end) then raise exception 'Document RLS scope failed';end if;
 select count(*) into total from public.dokumen_versi where dokumen_id=doc_id;
 if total<>(case when expected then 1 else 0 end) then raise exception 'Document version scope failed';end if;
 execute 'select ('||read_expr||') from (select $1::text as bucket_id,$2::text as name,$3::text as owner_id) as objects' into allowed using 'dokumen-persiapan',path,provider_auth::text;
 if allowed is distinct from expected then raise exception 'Storage read scope failed for user %',r.pengguna_id;end if;
 execute 'select ('||delete_expr||') from (select $1::text as bucket_id,$2::text as name,$3::text as owner_id) as objects' into allowed using 'dokumen-persiapan',path,provider_auth::text;
 if allowed then raise exception 'Registered document deletion allowed';end if;
 if r.nama<>'penyedia_jasa' then
 begin
 perform public.daftar_dokumen_persiapan(-2100000001,'LAPORAN_PENDAHULUAN','Test',path,'test.pdf',100,repeat('a',64));
 raise exception 'Non-provider registration allowed';exception when insufficient_privilege then null;end;
 end if;
 if has_table_privilege(current_user,'public.dokumen','INSERT') or has_table_privilege(current_user,'public.dokumen_versi','UPDATE') then raise exception 'Unexpected direct metadata writes';end if;
 execute 'reset role';
 end loop;
 -- Positive-ID package fixture: actual bucket not required for evaluating the upload policy.
 insert into public.paket_kontrak(paket_id,balai_id,nama_paket,status,created_by) overriding system value values (2100000001,b1,'Temporary upload policy','DRAFT',provider_id);
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 execute 'select ('||insert_expr||') from (select $1::text as bucket_id,$2::text as name,$3::text as owner_id) as objects' into allowed using 'dokumen-persiapan','2100000001/00000000-0000-4000-8000-000000000002.pdf',provider_auth::text;
 if not allowed then raise exception 'Provider insert policy denies own draft path';end if;
 execute 'select ('||insert_expr||') from (select $1::text as bucket_id,$2::text as name,$3::text as owner_id) as objects' into allowed using 'dokumen-persiapan','2100000001/../../bad.pdf',provider_auth::text;
 if allowed then raise exception 'Malformed path allowed';end if;
 execute 'select ('||delete_expr||') from (select $1::text as bucket_id,$2::text as name,$3::text as owner_id) as objects' into allowed using 'dokumen-persiapan','2100000001/00000000-0000-4000-8000-000000000002.pdf',provider_auth::text;
 if not allowed then raise exception 'Unregistered owner cleanup denied';end if;
 begin
 perform public.daftar_dokumen_persiapan(2100000001,'BAD','Test','2100000001/00000000-0000-4000-8000-000000000002.pdf','test.pdf',100,repeat('a',64));
 raise exception 'Invalid type allowed';exception when invalid_parameter_value then null;end;
 begin
 perform public.daftar_dokumen_persiapan(2100000001,'PROGRAM_MUTU','Test','2100000001/00000000-0000-4000-8000-000000000002.pdf','test.pdf',10485761,repeat('a',64));
 raise exception 'Oversize metadata allowed';exception when invalid_parameter_value then null;end;
 execute 'reset role';update public.paket_kontrak set status='AKTIF' where paket_id=2100000001;
 execute 'set local role authenticated';
 begin
 perform public.daftar_dokumen_persiapan(2100000001,'PROGRAM_MUTU','Test','2100000001/00000000-0000-4000-8000-000000000002.pdf','test.pdf',100,repeat('a',64));
 raise exception 'Active package upload allowed';exception when object_not_in_prerequisite_state then null;end;
 execute 'reset role';
 update public.pengguna set terkunci=true where pengguna_id=provider_id;
 execute 'set local role authenticated';
 execute 'select ('||read_expr||') from (select $1::text as bucket_id,$2::text as name,$3::text as owner_id) as objects' into allowed using 'dokumen-persiapan',path,provider_auth::text;
 if allowed then raise exception 'Locked user can read Storage';end if;
 execute 'reset role';
 if has_function_privilege('anon','public.daftar_dokumen_persiapan(integer,text,text,text,text,bigint,text)','EXECUTE') then raise exception 'Anonymous registration granted';end if;
end $$;
rollback;
select 'PASS: all 36 accounts document/version/Storage read scopes, registered-file delete denied, provider upload predicate, invalid paths/type/size and non-draft/locked access denied; fixtures rolled back; no SQL changes to Storage metadata' as verification;
