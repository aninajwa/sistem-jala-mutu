-- Read-scope tests plus temporary metadata fixtures; no Storage writes.
begin;
do $$
declare provider_id integer; provider_auth uuid; d public.dokumen; state jsonb; before_d jsonb; before_versions jsonb; r record; visible boolean; old_version integer; qversion integer; kind integer; bad_page integer;
begin
 select u.pengguna_id,u.auth_user_id into provider_id,provider_auth from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) where pr.nama='penyedia_jasa' limit 1;
 select * into d from public.dokumen where sumber_tipe='PERSIAPAN' and status='TERSEDIA' order by dokumen_id limit 1;
 if d.dokumen_id is null then raise exception 'Need an existing preparation document';end if;
 before_d:=to_jsonb(d);
 select jsonb_agg(to_jsonb(v) order by versi_ke) into before_versions from public.dokumen_versi v where dokumen_id=d.dokumen_id;
 for r in select distinct auth_user_id from public.pengguna where auth_user_id is not null loop
  perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);execute 'set local role authenticated';
  select exists(select 1 from public.dokumen where dokumen_id=d.dokumen_id) into visible;
  if visible then
   state:=public.baca_detail_dokumen_persiapan(d.paket_id,d.dokumen_id,1);
   if state#>>'{dokumen,dokumen_id}'<>d.dokumen_id::text or state#>>'{versi_aktif,versi_ke}'<>d.versi_aktif::text then raise exception 'Metadata mismatch';end if;
   if (state#>>'{pagination,total}')::int<>(select count(*) from public.dokumen_versi where dokumen_id=d.dokumen_id) then raise exception 'History count mismatch';end if;
  else
   begin perform public.baca_detail_dokumen_persiapan(d.paket_id,d.dokumen_id,1);raise exception 'Foreign scope allowed';exception when no_data_found then null;end;
  end if;
  execute 'reset role';
 end loop;
 -- 53 versions exercise both pagination pages and an empty page.
 insert into public.paket_kontrak(paket_id,balai_id,nama_paket,status) overriding system value values(-2100000008,(select balai_id from public.paket_kontrak where paket_id=d.paket_id),'Temporary history pagination','DRAFT');
 insert into public.dokumen(dokumen_id,paket_id,jenis_dokumen_id,judul,sumber_tipe,sumber_id,versi_aktif,status,diunggah_oleh) overriding system value values(-2100000008,-2100000008,d.jenis_dokumen_id,'Temporary history','PERSIAPAN',-2100000008,53,'TERSEDIA',provider_id);
 insert into public.dokumen_versi(dok_versi_id,dokumen_id,versi_ke,object_path,nama_file,hash_file,ukuran_byte) overriding system value
 select -2100000000-n,-2100000008,n,'rollback-only/history-'||n||'.pdf','fixture-'||n||'.pdf',repeat('a',64),100 from generate_series(1,53) n;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 state:=public.baca_detail_dokumen_persiapan(-2100000008,-2100000008,1);
 if jsonb_array_length(state->'riwayat_versi')<>50 or state#>>'{riwayat_versi,0,versi_ke}'<>'53' or state#>>'{riwayat_versi,49,versi_ke}'<>'4' or state#>>'{pagination,total}'<>'53' or state#>>'{pagination,total_pages}'<>'2' or state#>>'{pagination,has_next}'<>'true' then raise exception 'First page incorrect';end if;
 state:=public.baca_detail_dokumen_persiapan(-2100000008,-2100000008,2);
 if jsonb_array_length(state->'riwayat_versi')<>3 or state#>>'{riwayat_versi,0,versi_ke}'<>'3' or state#>>'{riwayat_versi,2,versi_ke}'<>'1' or state#>>'{versi_aktif,versi_ke}'<>'53' or state#>>'{pagination,has_next}'<>'false' then raise exception 'Second page incorrect';end if;
 if exists(select 1 from jsonb_array_elements(state->'riwayat_versi') v where (v->>'aktif')::boolean) then raise exception 'Old version marked active';end if;
 state:=public.baca_detail_dokumen_persiapan(-2100000008,-2100000008,3);
 if state->'riwayat_versi'<>'[]'::jsonb or state#>>'{versi_aktif,versi_ke}'<>'53' then raise exception 'Empty page lost active file';end if;
 foreach bad_page in array array[0,-1,1000001] loop
  begin perform public.baca_detail_dokumen_persiapan(d.paket_id,d.dokumen_id,bad_page);raise exception 'Bad page allowed';exception when invalid_parameter_value then null;end;
 end loop;
 begin perform public.baca_detail_dokumen_persiapan(-2100000008,d.dokumen_id,1);raise exception 'Document from another package allowed';exception when no_data_found then null;end;
 begin perform public.baca_detail_dokumen_persiapan(d.paket_id,2147483647,1);raise exception 'Missing document allowed';exception when no_data_found then null;end;
 execute 'reset role';
 update public.pengguna set terkunci=true where pengguna_id=provider_id;
 execute 'set local role authenticated';
 begin perform public.baca_detail_dokumen_persiapan(d.paket_id,d.dokumen_id,1);raise exception 'Locked user allowed';exception when no_data_found then null;end;
 execute 'reset role';
 if (select to_jsonb(doc) from public.dokumen doc where dokumen_id=d.dokumen_id)<>before_d or (select jsonb_agg(to_jsonb(v) order by versi_ke) from public.dokumen_versi v where dokumen_id=d.dokumen_id)<>before_versions then raise exception 'GET modified document/history';end if;
 if has_function_privilege('anon','public.baca_detail_dokumen_persiapan(integer,integer,integer)','EXECUTE') then raise exception 'Anonymous execute granted';end if;
 if (select prosecdef from pg_proc where oid='public.baca_detail_dokumen_persiapan(integer,integer,integer)'::regprocedure) then raise exception 'Must be invoker';end if;
end $$;
rollback;
select 'PASS: real document metadata, all linked account scopes, 53-version pagination and ordering, active version on older/empty pages, invalid page, mismatched/missing doc, locked account and invoker permissions; all fixtures restored, Storage unchanged' as verification;
