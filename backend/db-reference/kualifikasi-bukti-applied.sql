-- Langkah 13. Metadata dokumen dan versi melalui RPC; tiada SQL writes ke storage.objects/buckets.
alter table public.kualifikasi_personel
 add column versi integer not null default 1 check(versi>=1),
 add column updated_at timestamptz not null default now();
insert into public.jenis_dokumen(kode,nama,kategori) values('BUKTI_KUALIFIKASI_PERSONEL','Bukti Kualifikasi Personel','KUALIFIKASI');
create policy jenis_dokumen_kualifikasi_read on public.jenis_dokumen for select to authenticated using(kode='BUKTI_KUALIFIKASI_PERSONEL' and exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama in ('penyedia_jasa','pic_balai','direktorat','admin')));
-- Shared qualification evidence follows personnel scope, including assignments in another Balai.
create policy dokumen_kualifikasi_read on public.dokumen for select to authenticated using(status='TERSEDIA' and sumber_tipe='KUALIFIKASI' and exists(select 1 from public.kualifikasi_personel q where q.kualifikasi_id=dokumen.sumber_id and q.dokumen_id=dokumen.dokumen_id));
create policy dokumen_versi_kualifikasi_read on public.dokumen_versi for select to authenticated using(exists(select 1 from public.dokumen d join public.kualifikasi_personel q on q.kualifikasi_id=d.sumber_id and q.dokumen_id=d.dokumen_id where d.dokumen_id=dokumen_versi.dokumen_id and d.sumber_tipe='KUALIFIKASI' and d.status='TERSEDIA'));
create function app_private.kualifikasi_file_berdaftar(p_name text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.dokumen_versi where bucket_id='dokumen-kualifikasi' and object_path=p_name);$$;
revoke all on function app_private.kualifikasi_file_berdaftar(text) from public,anon;
grant execute on function app_private.kualifikasi_file_berdaftar(text) to authenticated;
create policy kualifikasi_storage_insert on storage.objects for insert to authenticated with check(
 bucket_id='dokumen-kualifikasi' and owner_id=(select auth.uid())::text and name ~ '^[1-9][0-9]{0,9}/[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$'
 and exists(select 1 from public.kualifikasi_personel k join public.personel pe using(personel_id) join public.anggota_tim a using(personel_id) join public.tim_survei ti using(tim_id) join public.paket_kontrak p using(paket_id) join public.pengguna u on u.auth_user_id=(select auth.uid()) join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id)
 where k.personel_id::text=split_part(name,'/',1) and k.kualifikasi_id::text=split_part(name,'/',2) and pe.penyedia_id=p.penyedia_id and p.status='DRAFT' and r.nama='penyedia_jasa' and not coalesce(u.terkunci,false)
 and exists(select 1 from public.checklist_pengisian ch join public.checklist_template ct using(template_id) where ch.paket_id=p.paket_id and ct.no_dokumen='JM-PERSIAPAN-TAHAP0' and ct.revisi='DRAFT-01' and ch.status='DISETUJUI'))
);
create policy kualifikasi_storage_read on storage.objects for select to authenticated using(
 bucket_id='dokumen-kualifikasi' and (
 exists(select 1 from public.dokumen_versi v join public.dokumen d using(dokumen_id) join public.kualifikasi_personel q on q.kualifikasi_id=d.sumber_id and q.dokumen_id=d.dokumen_id where v.bucket_id=storage.objects.bucket_id and v.object_path=storage.objects.name and d.sumber_tipe='KUALIFIKASI' and d.status='TERSEDIA')
 or (owner_id=(select auth.uid())::text and exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa')))
);
create policy kualifikasi_storage_cleanup on storage.objects for delete to authenticated using(
 bucket_id='dokumen-kualifikasi' and owner_id=(select auth.uid())::text and not app_private.kualifikasi_file_berdaftar(name)
 and exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa')
);
create function app_private.daftar_bukti_kualifikasi(p_paket_id integer,p_tim_id integer,p_personel_id integer,p_kualifikasi_id integer,p_expected_version integer,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; q public.kualifikasi_personel; d public.dokumen; v public.dokumen_versi; type_id integer; next_version integer; old_state jsonb;
begin
 actor:=app_private.assert_tahap_kalibrasi(p_paket_id);
 perform 1 from public.tim_survei where tim_id=p_tim_id and paket_id=p_paket_id for update;
 if not found then raise exception 'Tim tidak ditemukan dalam paket ini' using errcode='P0002';end if;
 perform 1 from public.personel pe join public.paket_kontrak p on p.penyedia_id=pe.penyedia_id where pe.personel_id=p_personel_id and p.paket_id=p_paket_id and exists(select 1 from public.anggota_tim a where a.tim_id=p_tim_id and a.personel_id=pe.personel_id) for update of pe;
 if not found then raise exception 'Personel tidak ditemukan dalam tim atau penyedia tidak sepadan' using errcode='P0002';end if;
 select * into q from public.kualifikasi_personel where kualifikasi_id=p_kualifikasi_id and personel_id=p_personel_id for update;
 if not found then raise exception 'Kualifikasi tidak ditemukan untuk personel ini' using errcode='P0002';end if;
 if p_expected_version is null or p_expected_version not between 1 and 2147483646 then raise exception 'Versi kualifikasi tidak valid' using errcode='22023';end if;
 if q.versi<>p_expected_version then raise exception 'Rekod kualifikasi telah berubah. Baca semula' using errcode='55000';end if;
 if p_nama_file is null or length(p_nama_file) not between 5 and 255 or p_nama_file !~* '\.pdf$' or p_nama_file ~ '[[:cntrl:]/\\]'
 or p_ukuran is null or p_ukuran not between 1 and 10485760 or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$'
 or p_object_path is null or p_object_path !~ '^[1-9][0-9]{0,9}/[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$' or split_part(p_object_path,'/',1)<>p_personel_id::text or split_part(p_object_path,'/',2)<>p_kualifikasi_id::text then raise exception 'Metadata bukti tidak valid' using errcode='22023';end if;
 if not exists(select 1 from storage.buckets where id='dokumen-kualifikasi' and public is false) then raise exception 'Bucket private dokumen-kualifikasi belum tersedia' using errcode='55000';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='dokumen-kualifikasi' and o.name=p_object_path and o.owner_id=auth.uid()::text and o.metadata->>'size'=p_ukuran::text and o.metadata->>'mimetype'='application/pdf') then raise exception 'Fail bukti tidak tersedia atau metadata tidak sepadan' using errcode='22023';end if;
 if exists(select 1 from public.dokumen_versi where bucket_id='dokumen-kualifikasi' and object_path=p_object_path) then raise exception 'Fail telah didaftarkan' using errcode='22023';end if;
 select jenis_dokumen_id into type_id from public.jenis_dokumen where kode='BUKTI_KUALIFIKASI_PERSONEL';
 if type_id is null then raise exception 'Jenis bukti belum tersedia' using errcode='55000';end if;
 old_state:=to_jsonb(q);
 if q.dokumen_id is null then
  insert into public.dokumen(paket_id,jenis_dokumen_id,judul,sumber_tipe,sumber_id,versi_aktif,status,diunggah_oleh,diunggah_pada)
  values(p_paket_id,type_id,'Bukti '||q.jenis||' #'||q.kualifikasi_id,'KUALIFIKASI',q.kualifikasi_id,1,'TERSEDIA',actor,localtimestamp) returning * into d;next_version:=1;
 else
  select * into d from public.dokumen where dokumen_id=q.dokumen_id and sumber_tipe='KUALIFIKASI' and sumber_id=q.kualifikasi_id and jenis_dokumen_id=type_id and status='TERSEDIA' for update;
  if not found or d.versi_aktif not between 1 and 2147483646 then raise exception 'Rekod bukti tidak sepadan atau had versi dicapai' using errcode='55000';end if;
  next_version:=d.versi_aktif+1;
  update public.dokumen set versi_aktif=next_version where dokumen_id=d.dokumen_id returning * into d;
 end if;
 insert into public.dokumen_versi(dokumen_id,versi_ke,hash_file,ukuran_byte,dibuat_pada,bucket_id,object_path,nama_file,mime_type)
 values(d.dokumen_id,next_version,p_sha256,p_ukuran,localtimestamp,'dokumen-kualifikasi',p_object_path,p_nama_file,'application/pdf') returning * into v;
 update public.kualifikasi_personel set dokumen_id=d.dokumen_id,versi=versi+1,updated_at=clock_timestamp() where kualifikasi_id=q.kualifikasi_id returning * into q;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(actor,'kualifikasi_personel',q.kualifikasi_id::text,'UPLOAD_QUALIFICATION_EVIDENCE',old_state,jsonb_build_object('paket_id',p_paket_id,'tim_id',p_tim_id,'personel_id',p_personel_id,'kualifikasi',to_jsonb(q),'dokumen',to_jsonb(d),'versi',to_jsonb(v)),localtimestamp);
 return jsonb_build_object('kualifikasi',to_jsonb(q),'dokumen',to_jsonb(d),'versi',to_jsonb(v),'kelayakan_belum_dinilai',true);
end $$;
revoke all on function app_private.daftar_bukti_kualifikasi(integer,integer,integer,integer,integer,text,text,bigint,text) from public,anon;
grant execute on function app_private.daftar_bukti_kualifikasi(integer,integer,integer,integer,integer,text,text,bigint,text) to authenticated;
create function public.daftar_bukti_kualifikasi(p_paket_id integer,p_tim_id integer,p_personel_id integer,p_kualifikasi_id integer,p_expected_version integer,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language sql security invoker set search_path='' as $$select app_private.daftar_bukti_kualifikasi(p_paket_id,p_tim_id,p_personel_id,p_kualifikasi_id,p_expected_version,p_object_path,p_nama_file,p_ukuran,p_sha256);$$;
revoke all on function public.daftar_bukti_kualifikasi(integer,integer,integer,integer,integer,text,text,bigint,text) from public,anon;
grant execute on function public.daftar_bukti_kualifikasi(integer,integer,integer,integer,integer,text,text,bigint,text) to authenticated;

-- Helpers prive dan policy akhir, untuk mengelakkan pengembangan RLS bertingkat.
create function app_private.boleh_baca_bukti_kualifikasi(p_dokumen_id integer) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.dokumen d join public.kualifikasi_personel q on q.dokumen_id=d.dokumen_id and q.kualifikasi_id=d.sumber_id
 where d.dokumen_id=p_dokumen_id and d.sumber_tipe='KUALIFIKASI' and d.status='TERSEDIA'
 and exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id)
 where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false) and (r.nama in ('penyedia_jasa','direktorat','admin') or (r.nama='pic_balai' and exists(select 1 from public.anggota_tim a join public.tim_survei t using(tim_id) join public.paket_kontrak p using(paket_id) where a.personel_id=q.personel_id and p.balai_id=pp.scope_balai_id and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id))))));
$$;
revoke all on function app_private.boleh_baca_bukti_kualifikasi(integer) from public,anon;
grant execute on function app_private.boleh_baca_bukti_kualifikasi(integer) to authenticated;
create function app_private.boleh_baca_fail_kualifikasi(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.dokumen_versi v where v.bucket_id='dokumen-kualifikasi' and v.object_path=p_name and app_private.boleh_baca_bukti_kualifikasi(v.dokumen_id));
$$;
revoke all on function app_private.boleh_baca_fail_kualifikasi(text) from public,anon;
grant execute on function app_private.boleh_baca_fail_kualifikasi(text) to authenticated;
create function app_private.boleh_upload_bukti_kualifikasi(p_personel text,p_kualifikasi text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa')
 and exists(select 1 from public.kualifikasi_personel k join public.personel pe using(personel_id) join public.anggota_tim a using(personel_id) join public.tim_survei ti using(tim_id) join public.paket_kontrak p using(paket_id)
 where k.personel_id::text=p_personel and k.kualifikasi_id::text=p_kualifikasi and pe.penyedia_id=p.penyedia_id and p.status='DRAFT'
 and exists(select 1 from public.checklist_pengisian ch join public.checklist_template ct using(template_id) where ch.paket_id=p.paket_id and ct.no_dokumen='JM-PERSIAPAN-TAHAP0' and ct.revisi='DRAFT-01' and ch.status='DISETUJUI'));
$$;
revoke all on function app_private.boleh_upload_bukti_kualifikasi(text,text) from public,anon;
grant execute on function app_private.boleh_upload_bukti_kualifikasi(text,text) to authenticated;
alter policy dokumen_kualifikasi_read on public.dokumen using(sumber_tipe='KUALIFIKASI' and app_private.boleh_baca_bukti_kualifikasi(dokumen_id));
alter policy dokumen_versi_kualifikasi_read on public.dokumen_versi using(app_private.boleh_baca_bukti_kualifikasi(dokumen_id));
alter policy kualifikasi_storage_insert on storage.objects with check(bucket_id='dokumen-kualifikasi' and owner_id=(select auth.uid())::text and name ~ '^[1-9][0-9]{0,9}/[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$' and app_private.boleh_upload_bukti_kualifikasi(split_part(name,'/',1),split_part(name,'/',2)));
alter policy kualifikasi_storage_read on storage.objects using(bucket_id='dokumen-kualifikasi' and (app_private.boleh_baca_fail_kualifikasi(name) or (owner_id=(select auth.uid())::text and exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa'))));
