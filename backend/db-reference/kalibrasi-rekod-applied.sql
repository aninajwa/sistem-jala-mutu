-- Rujukan perubahan yang sudah dipasang; jangan jalankan ulang.
-- paket_id ialah tambahan teknikal untuk scope rekod dan sijil, bukan ambang kelulusan.
alter table public.kalibrasi_alat
 add column paket_id integer not null references public.paket_kontrak(paket_id),
 add column created_by integer not null references public.pengguna(pengguna_id),
 add column versi integer not null default 1 check(versi>=1),
 add column updated_at timestamptz not null default now(),
 alter column alat_id set not null,
 alter column status set default 'DRAFT',
 alter column status set not null,
 add constraint kalibrasi_tarikh_valid check(berlaku_sd is null or (tgl_kalibrasi is not null and berlaku_sd>=tgl_kalibrasi));
create index kalibrasi_paket_idx on public.kalibrasi_alat(paket_id);
create index kalibrasi_alat_idx on public.kalibrasi_alat(alat_id);
alter table public.kalibrasi_alat enable row level security;
revoke all privileges on public.kalibrasi_alat from anon,authenticated;
grant select on public.kalibrasi_alat to authenticated;
create policy kalibrasi_read_paket on public.kalibrasi_alat for select to authenticated using(exists(select 1 from public.paket_kontrak p where p.paket_id=kalibrasi_alat.paket_id));
insert into public.jenis_dokumen(kode,nama,kategori) values('SERTIFIKAT_KALIBRASI','Sertifikat Kalibrasi Alat','KALIBRASI');
create policy jenis_dokumen_kalibrasi_read on public.jenis_dokumen for select to authenticated using(kode='SERTIFIKAT_KALIBRASI' and exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama in ('penyedia_jasa','pic_balai','direktorat','admin')));
create function app_private.simpan_kalibrasi_alat(p_paket_id integer,p_kalibrasi_id integer,p_expected_version integer,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; k public.kalibrasi_alat; old_state jsonb; key text; creating boolean:=p_kalibrasi_id is null;
begin
 actor:=app_private.assert_tahap_kalibrasi(p_paket_id);
 if p_data is null or jsonb_typeof(p_data)<>'object' or p_data='{}'::jsonb then raise exception 'Data kalibrasi kosong atau tidak valid' using errcode='22023';end if;
 if creating then
  if p_expected_version is not null or not(p_data ? 'alat_id') or jsonb_typeof(p_data->'alat_id')<>'number' or (p_data->>'alat_id')::numeric not between 1 and 2147483647 or trunc((p_data->>'alat_id')::numeric)<>(p_data->>'alat_id')::numeric then raise exception 'ID alat tidak valid' using errcode='22023';end if;
  k.alat_id:=(p_data->>'alat_id')::numeric::integer;k.paket_id:=p_paket_id;
  if not exists(select 1 from public.penugasan_alat a join public.tim_survei t using(tim_id) join public.alat_survei e using(alat_id) join public.paket_kontrak p on p.paket_id=t.paket_id where t.paket_id=p_paket_id and a.alat_id=k.alat_id and e.penyedia_id=p.penyedia_id and e.jenis_survei_id=t.jenis_survei_id) then raise exception 'Alat belum ditugaskan pada tim yang sepadan dalam paket ini' using errcode='22023';end if;
 else
  select * into k from public.kalibrasi_alat where kalibrasi_id=p_kalibrasi_id and paket_id=p_paket_id for update;
  if not found then raise exception 'Rekod kalibrasi tidak ditemukan' using errcode='P0002';end if;
  if k.status<>'DRAFT' then raise exception 'Hanya kalibrasi DRAFT boleh diubah' using errcode='55000';end if;
  if p_expected_version is null or p_expected_version not between 1 and 2147483646 then raise exception 'Versi kalibrasi tidak valid' using errcode='22023';end if;
  if k.versi<>p_expected_version then raise exception 'Rekod kalibrasi telah berubah. Baca semula' using errcode='55000';end if;
  old_state:=to_jsonb(k);
 end if;
 for key in select jsonb_object_keys(p_data) loop
  if key not in ('jenis','standar','komponen','tgl_kalibrasi','berlaku_sd','pelaksana') and not(creating and key='alat_id') then raise exception 'Kolum kalibrasi tidak dibenarkan' using errcode='22023';end if;
 end loop;
 foreach key in array array['jenis','standar','komponen','pelaksana'] loop
  if creating and not(p_data ? key) then raise exception 'Jenis, standard, komponen dan pelaksana diperlukan' using errcode='22023';end if;
  if p_data ? key then
   if jsonb_typeof(p_data->key)<>'string' or length(btrim(p_data->>key)) not between 1 and 255 then raise exception 'Maklumat kalibrasi tidak valid' using errcode='22023';end if;
   case key when 'jenis' then k.jenis:=btrim(p_data->>key);when 'standar' then k.standar:=btrim(p_data->>key);when 'komponen' then k.komponen:=btrim(p_data->>key);when 'pelaksana' then k.pelaksana:=btrim(p_data->>key);end case;
  end if;
 end loop;
 if k.jenis not in ('REFERENSI','RELATIF') then raise exception 'Jenis mesti REFERENSI atau RELATIF' using errcode='22023';end if;
 if creating and not(p_data ? 'tgl_kalibrasi') then raise exception 'Tarikh kalibrasi diperlukan' using errcode='22023';end if;
 foreach key in array array['tgl_kalibrasi','berlaku_sd'] loop
  if p_data ? key then
   if key='berlaku_sd' and p_data->key='null'::jsonb then k.berlaku_sd:=null;
   else
    if jsonb_typeof(p_data->key)<>'string' or p_data->>key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Tarikh mesti sah dan menggunakan YYYY-MM-DD' using errcode='22023';end if;
    begin
     if key='tgl_kalibrasi' then k.tgl_kalibrasi:=(p_data->>key)::date;else k.berlaku_sd:=(p_data->>key)::date;end if;
    exception when invalid_datetime_format or datetime_field_overflow then raise exception 'Tarikh tidak valid' using errcode='22023';end;
   end if;
  end if;
 end loop;
 if k.berlaku_sd is not null and k.berlaku_sd<k.tgl_kalibrasi then raise exception 'Tarikh tamat tidak boleh lebih awal daripada kalibrasi' using errcode='22023';end if;
 if creating then
  insert into public.kalibrasi_alat(paket_id,alat_id,jenis,standar,komponen,tgl_kalibrasi,berlaku_sd,pelaksana,status,created_by)
  values(p_paket_id,k.alat_id,k.jenis,k.standar,k.komponen,k.tgl_kalibrasi,k.berlaku_sd,k.pelaksana,'DRAFT',actor) returning * into k;
 else
  if to_jsonb(k)=old_state then return to_jsonb(k);end if;
  update public.kalibrasi_alat set jenis=k.jenis,standar=k.standar,komponen=k.komponen,tgl_kalibrasi=k.tgl_kalibrasi,berlaku_sd=k.berlaku_sd,pelaksana=k.pelaksana,versi=versi+1,updated_at=clock_timestamp() where kalibrasi_id=k.kalibrasi_id returning * into k;
 end if;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu) values(actor,'kalibrasi_alat',k.kalibrasi_id::text,case when creating then 'CREATE_CALIBRATION_DRAFT' else 'UPDATE_CALIBRATION_DRAFT' end,old_state,to_jsonb(k),localtimestamp);
 return to_jsonb(k);
end $$;
revoke all on function app_private.simpan_kalibrasi_alat(integer,integer,integer,jsonb) from public,anon;
grant execute on function app_private.simpan_kalibrasi_alat(integer,integer,integer,jsonb) to authenticated;
create function public.simpan_kalibrasi_alat(p_paket_id integer,p_kalibrasi_id integer,p_expected_version integer,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.simpan_kalibrasi_alat(p_paket_id,p_kalibrasi_id,p_expected_version,p_data);$$;
revoke all on function public.simpan_kalibrasi_alat(integer,integer,integer,jsonb) from public,anon;
grant execute on function public.simpan_kalibrasi_alat(integer,integer,integer,jsonb) to authenticated;
create function app_private.kalibrasi_file_berdaftar(p_name text) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.dokumen_versi where bucket_id='dokumen-kalibrasi' and object_path=p_name);$$;
revoke all on function app_private.kalibrasi_file_berdaftar(text) from public,anon;
grant execute on function app_private.kalibrasi_file_berdaftar(text) to authenticated;
create policy kalibrasi_storage_insert on storage.objects for insert to authenticated with check(
 bucket_id='dokumen-kalibrasi' and owner_id=(select auth.uid())::text and name ~ '^[1-9][0-9]{0,9}/[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$'
 and exists(select 1 from public.kalibrasi_alat k join public.paket_kontrak p on p.paket_id=k.paket_id join public.pengguna u on u.auth_user_id=(select auth.uid()) join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id)
 where k.paket_id::text=split_part(name,'/',1) and k.kalibrasi_id::text=split_part(name,'/',2) and k.status='DRAFT' and p.status='DRAFT' and r.nama='penyedia_jasa' and not coalesce(u.terkunci,false)
 and exists(select 1 from public.checklist_pengisian q join public.checklist_template t using(template_id) where q.paket_id=p.paket_id and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01' and q.status='DISETUJUI'))
);
create policy kalibrasi_storage_read on storage.objects for select to authenticated using(
 bucket_id='dokumen-kalibrasi' and (
 exists(select 1 from public.dokumen_versi v join public.dokumen d using(dokumen_id) join public.kalibrasi_alat k on k.dokumen_id=d.dokumen_id where v.bucket_id=storage.objects.bucket_id and v.object_path=storage.objects.name and d.sumber_tipe='KALIBRASI' and d.sumber_id=k.kalibrasi_id and d.paket_id=k.paket_id and d.status='TERSEDIA')
 or (owner_id=(select auth.uid())::text and exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa')))
);
create policy kalibrasi_storage_cleanup on storage.objects for delete to authenticated using(
 bucket_id='dokumen-kalibrasi' and owner_id=(select auth.uid())::text and not app_private.kalibrasi_file_berdaftar(name)
 and exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa')
);
create function app_private.daftar_sertifikat_kalibrasi(p_paket_id integer,p_kalibrasi_id integer,p_expected_version integer,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; k public.kalibrasi_alat; d public.dokumen; v public.dokumen_versi; type_id integer; old_state jsonb; next_version integer;
begin
 actor:=app_private.assert_tahap_kalibrasi(p_paket_id);
 select * into k from public.kalibrasi_alat where kalibrasi_id=p_kalibrasi_id and paket_id=p_paket_id for update;
 if not found then raise exception 'Rekod kalibrasi tidak ditemukan' using errcode='P0002';end if;
 if k.status<>'DRAFT' then raise exception 'Sijil hanya boleh diupload ketika kalibrasi DRAFT' using errcode='55000';end if;
 if p_expected_version is null or p_expected_version not between 1 and 2147483646 then raise exception 'Versi kalibrasi tidak valid' using errcode='22023';end if;
 if k.versi<>p_expected_version then raise exception 'Rekod kalibrasi telah berubah. Baca semula' using errcode='55000';end if;
 if p_nama_file is null or length(p_nama_file) not between 5 and 255 or p_nama_file !~* '\.pdf$' or p_nama_file ~ '[[:cntrl:]/\\]'
 or p_ukuran is null or p_ukuran not between 1 and 10485760 or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$'
 or p_object_path is null or p_object_path !~ '^[1-9][0-9]{0,9}/[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$' or split_part(p_object_path,'/',1)<>p_paket_id::text or split_part(p_object_path,'/',2)<>p_kalibrasi_id::text then raise exception 'Metadata sijil tidak valid' using errcode='22023';end if;
 if not exists(select 1 from storage.buckets where id='dokumen-kalibrasi' and public is false) then raise exception 'Bucket private dokumen-kalibrasi belum tersedia' using errcode='55000';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='dokumen-kalibrasi' and o.name=p_object_path and o.owner_id=auth.uid()::text and o.metadata->>'size'=p_ukuran::text and o.metadata->>'mimetype'='application/pdf') then raise exception 'Fail sijil tidak tersedia atau metadata tidak sepadan' using errcode='22023';end if;
 if exists(select 1 from public.dokumen_versi where object_path=p_object_path) then raise exception 'Fail telah didaftarkan' using errcode='22023';end if;
 select jenis_dokumen_id into type_id from public.jenis_dokumen where kode='SERTIFIKAT_KALIBRASI';
 if type_id is null then raise exception 'Jenis sijil belum tersedia' using errcode='55000';end if;
 old_state:=to_jsonb(k);
 if k.dokumen_id is null then
  insert into public.dokumen(paket_id,jenis_dokumen_id,judul,sumber_tipe,sumber_id,versi_aktif,status,diunggah_oleh,diunggah_pada)
  values(p_paket_id,type_id,'Sertifikat Kalibrasi #'||k.kalibrasi_id,'KALIBRASI',k.kalibrasi_id,1,'TERSEDIA',actor,localtimestamp) returning * into d;
  next_version:=1;
 else
  select * into d from public.dokumen where dokumen_id=k.dokumen_id and paket_id=p_paket_id and sumber_tipe='KALIBRASI' and sumber_id=k.kalibrasi_id and jenis_dokumen_id=type_id and status='TERSEDIA' for update;
  if not found or d.versi_aktif not between 1 and 2147483646 then raise exception 'Rekod sijil tidak sepadan atau had versi dicapai' using errcode='55000';end if;
  next_version:=d.versi_aktif+1;
  update public.dokumen set versi_aktif=next_version where dokumen_id=d.dokumen_id returning * into d;
 end if;
 insert into public.dokumen_versi(dokumen_id,versi_ke,hash_file,ukuran_byte,dibuat_pada,bucket_id,object_path,nama_file,mime_type)
 values(d.dokumen_id,next_version,p_sha256,p_ukuran,localtimestamp,'dokumen-kalibrasi',p_object_path,p_nama_file,'application/pdf') returning * into v;
 update public.kalibrasi_alat set dokumen_id=d.dokumen_id,versi=versi+1,updated_at=clock_timestamp() where kalibrasi_id=k.kalibrasi_id returning * into k;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(actor,'kalibrasi_alat',k.kalibrasi_id::text,'UPLOAD_CALIBRATION_CERTIFICATE',old_state,jsonb_build_object('kalibrasi',to_jsonb(k),'dokumen',to_jsonb(d),'versi',to_jsonb(v)),localtimestamp);
 return jsonb_build_object('kalibrasi',to_jsonb(k),'dokumen',to_jsonb(d),'versi',to_jsonb(v));
end $$;
revoke all on function app_private.daftar_sertifikat_kalibrasi(integer,integer,integer,text,text,bigint,text) from public,anon;
grant execute on function app_private.daftar_sertifikat_kalibrasi(integer,integer,integer,text,text,bigint,text) to authenticated;
create function public.daftar_sertifikat_kalibrasi(p_paket_id integer,p_kalibrasi_id integer,p_expected_version integer,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text) returns jsonb language sql security invoker set search_path='' as $$select app_private.daftar_sertifikat_kalibrasi(p_paket_id,p_kalibrasi_id,p_expected_version,p_object_path,p_nama_file,p_ukuran,p_sha256);$$;
revoke all on function public.daftar_sertifikat_kalibrasi(integer,integer,integer,text,text,bigint,text) from public,anon;
grant execute on function public.daftar_sertifikat_kalibrasi(integer,integer,integer,text,text,bigint,text) to authenticated;
