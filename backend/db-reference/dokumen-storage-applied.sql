-- Rujukan perubahan database. Bucket dibuat melalui dashboard/API Storage, bukan SQL.
alter table public.jenis_dokumen add column kode text unique;
insert into public.jenis_dokumen(kode,nama,kategori) values
 ('LAPORAN_PENDAHULUAN','Laporan Pendahuluan','PERSIAPAN'),('PROGRAM_MUTU','Program Mutu / Quality Management Plan','PERSIAPAN');
alter table public.dokumen_versi add column bucket_id text not null default 'dokumen-persiapan';
alter table public.dokumen_versi add column object_path text not null unique;
alter table public.dokumen_versi add column nama_file text not null;
alter table public.dokumen_versi add column mime_type text not null default 'application/pdf';
alter table public.dokumen_versi add constraint dokumen_versi_unik unique(dokumen_id,versi_ke);
revoke all privileges on public.jenis_dokumen,public.dokumen,public.dokumen_versi from anon,authenticated;
grant select on public.jenis_dokumen,public.dokumen,public.dokumen_versi to authenticated;
create policy jenis_dokumen_read on public.jenis_dokumen for select to authenticated using (
 kode in ('LAPORAN_PENDAHULUAN','PROGRAM_MUTU') and exists(select 1 from public.pengguna u join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id join public.peran r on r.peran_id=pp.peran_id where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama in ('penyedia_jasa','pic_balai','direktorat','admin'))
);
create policy dokumen_read_sesuai_paket on public.dokumen for select to authenticated using (
 status='TERSEDIA' and exists(select 1 from public.paket_kontrak p
 join public.pengguna u on u.auth_user_id=(select auth.uid()) join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id join public.peran r on r.peran_id=pp.peran_id
 where p.paket_id=dokumen.paket_id and not coalesce(u.terkunci,false)
 and (r.nama in ('penyedia_jasa','direktorat','admin') or (r.nama='pic_balai' and pp.scope_balai_id=p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id))))
);
create policy dokumen_versi_read_sesuai_paket on public.dokumen_versi for select to authenticated using (
 exists(select 1 from public.dokumen d join public.paket_kontrak p on p.paket_id=d.paket_id
 join public.pengguna u on u.auth_user_id=(select auth.uid()) join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id join public.peran r on r.peran_id=pp.peran_id
 where d.dokumen_id=dokumen_versi.dokumen_id and d.status='TERSEDIA' and not coalesce(u.terkunci,false)
 and (r.nama in ('penyedia_jasa','direktorat','admin') or (r.nama='pic_balai' and pp.scope_balai_id=p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id))))
);
create policy dokumen_storage_insert_provider on storage.objects for insert to authenticated with check (
 bucket_id='dokumen-persiapan' and owner_id=(select auth.uid())::text
 and name ~ '^[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$'
 and exists(select 1 from public.paket_kontrak p join public.pengguna u on u.auth_user_id=(select auth.uid()) join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id join public.peran r on r.peran_id=pp.peran_id
 where p.paket_id::text=split_part(name,'/',1) and p.status='DRAFT' and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa')
);
create policy dokumen_storage_read_sesuai_paket on storage.objects for select to authenticated using (
 bucket_id='dokumen-persiapan' and (
 exists(select 1 from public.dokumen_versi v join public.dokumen d on d.dokumen_id=v.dokumen_id join public.paket_kontrak p on p.paket_id=d.paket_id
 join public.pengguna u on u.auth_user_id=(select auth.uid()) join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id join public.peran r on r.peran_id=pp.peran_id
 where v.bucket_id=storage.objects.bucket_id and v.object_path=storage.objects.name and d.status='TERSEDIA' and not coalesce(u.terkunci,false)
 and (r.nama in ('penyedia_jasa','direktorat','admin') or (r.nama='pic_balai' and pp.scope_balai_id=p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id))))
 or (owner_id=(select auth.uid())::text and exists(select 1 from public.pengguna u join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id join public.peran r on r.peran_id=pp.peran_id where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa'))
 )
);
create policy dokumen_storage_delete_unregistered_only on storage.objects for delete to authenticated using (
 bucket_id='dokumen-persiapan' and owner_id=(select auth.uid())::text
 and not exists(select 1 from public.dokumen_versi v where v.bucket_id=storage.objects.bucket_id and v.object_path=storage.objects.name)
 and exists(select 1 from public.pengguna u join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id join public.peran r on r.peran_id=pp.peran_id where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa')
);
create function app_private.daftar_dokumen_persiapan(p_paket_id integer,p_jenis text,p_judul text,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; type_id integer; d public.dokumen; v public.dokumen_versi; package_status text;
begin
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501';end if;
 select u.pengguna_id into actor_id from public.pengguna u where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false) and exists(select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh upload dokumen' using errcode='42501';end if;
 select status into package_status from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if package_status is distinct from 'DRAFT' then raise exception 'Upload hanya dibenarkan ketika paket DRAFT' using errcode='55000';end if;
 select jenis_dokumen_id into type_id from public.jenis_dokumen where kode=p_jenis and kode in ('LAPORAN_PENDAHULUAN','PROGRAM_MUTU');
 if type_id is null or p_judul is null or length(btrim(p_judul)) not between 1 and 255 or p_nama_file is null or length(p_nama_file) not between 5 and 255 or p_nama_file !~* '\.pdf$'
 or p_ukuran is null or p_ukuran not between 1 and 10485760 or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$'
 or p_object_path is null or split_part(p_object_path,'/',1)<>p_paket_id::text or p_object_path !~ '^[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$' then
 raise exception 'Maklumat dokumen tidak valid' using errcode='22023';end if;
 if not exists(select 1 from storage.buckets where id='dokumen-persiapan' and public is false) then raise exception 'Bucket private dokumen-persiapan belum tersedia' using errcode='55000';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='dokumen-persiapan' and o.name=p_object_path and o.owner_id=auth.uid()::text and o.metadata->>'size'=p_ukuran::text and o.metadata->>'mimetype'='application/pdf') then
 raise exception 'Fail upload belum tersedia atau metadata tidak sepadan' using errcode='22023';end if;
 select * into v from public.dokumen_versi where object_path=p_object_path;
 if found then
 select * into d from public.dokumen where dokumen_id=v.dokumen_id;
 if d.paket_id<>p_paket_id or d.diunggah_oleh<>actor_id or v.hash_file<>p_sha256 or d.jenis_dokumen_id<>type_id then raise exception 'Fail telah digunakan' using errcode='42501';end if;
 return jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v));end if;
 insert into public.dokumen(paket_id,jenis_dokumen_id,judul,sumber_tipe,sumber_id,versi_aktif,status,diunggah_oleh,diunggah_pada)
 values(p_paket_id,type_id,btrim(p_judul),'PERSIAPAN',p_paket_id,1,'TERSEDIA',actor_id,localtimestamp) returning * into d;
 insert into public.dokumen_versi(dokumen_id,versi_ke,hash_file,ukuran_byte,dibuat_pada,bucket_id,object_path,nama_file,mime_type)
 values(d.dokumen_id,1,p_sha256,p_ukuran,localtimestamp,'dokumen-persiapan',p_object_path,p_nama_file,'application/pdf') returning * into v;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu)
 values(actor_id,'dokumen',d.dokumen_id::text,'UPLOAD_DOCUMENT',jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v)),localtimestamp);
 return jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v));
end $$;
revoke all on function app_private.daftar_dokumen_persiapan(integer,text,text,text,text,bigint,text) from public,anon;
grant execute on function app_private.daftar_dokumen_persiapan(integer,text,text,text,text,bigint,text) to authenticated;
create function public.daftar_dokumen_persiapan(p_paket_id integer,p_jenis text,p_judul text,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language sql security invoker set search_path='' as $$
 select app_private.daftar_dokumen_persiapan(p_paket_id,p_jenis,p_judul,p_object_path,p_nama_file,p_ukuran,p_sha256);
$$;
revoke all on function public.daftar_dokumen_persiapan(integer,text,text,text,text,bigint,text) from public,anon;
grant execute on function public.daftar_dokumen_persiapan(integer,text,text,text,text,bigint,text) to authenticated;
