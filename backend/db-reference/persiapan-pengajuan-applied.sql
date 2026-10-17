-- Rujukan perubahan yang telah dipasang. Jangan jalankan semula.
-- Pengajuan ini ialah semakan manual PIC, bukan pengesahan automatik semua syarat pedoman.
alter table public.checklist_pengisian
 add column pengajuan_trail_id bigint references public.audit_trail(trail_id),
 add column snapshot_pengajuan jsonb,
 add column diajukan_oleh integer references public.pengguna(pengguna_id),
 add column diajukan_pada timestamptz,
 add column direview_oleh integer references public.pengguna(pengguna_id),
 add column direview_pada timestamptz,
 add column catatan_review text;
alter table public.persetujuan_dokumen
 add column dok_versi_id integer references public.dokumen_versi(dok_versi_id),
 add column pengisian_id integer references public.checklist_pengisian(pengisian_id),
 add column pengajuan_trail_id bigint references public.audit_trail(trail_id),
 add constraint persetujuan_pengajuan_unique unique(pengajuan_trail_id);
alter table public.persetujuan_dokumen enable row level security;
revoke all privileges on public.persetujuan_dokumen from anon,authenticated;
grant select on public.persetujuan_dokumen to authenticated;
create policy persetujuan_persiapan_read on public.persetujuan_dokumen for select to authenticated using (
 pengisian_id is not null and exists(select 1 from public.checklist_pengisian q where q.pengisian_id=persetujuan_dokumen.pengisian_id)
);
create function app_private.assert_persiapan_editable(p_paket_id integer)
returns void language plpgsql security definer set search_path='' as $$
declare package_status text;
begin
 if auth.uid() is null or not exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa') then raise exception 'Hanya Penyedia Jasa aktif boleh mengubah persiapan' using errcode='42501';end if;
 select status into package_status from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if package_status is distinct from 'DRAFT' then raise exception 'Paket bukan berstatus DRAFT' using errcode='55000';end if;
 if exists(select 1 from public.checklist_pengisian q join public.checklist_template t using(template_id) where q.paket_id=p_paket_id and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01' and q.status not in ('DRAFT','PERLU_REVISI')) then raise exception 'Persiapan dikunci ketika menunggu semakan atau sudah disetujui' using errcode='55000';end if;
end $$;
revoke all on function app_private.assert_persiapan_editable(integer) from public,anon;
grant execute on function app_private.assert_persiapan_editable(integer) to authenticated;

create or replace function app_private.ubah_paket_draft(p_paket_id integer, p_patch jsonb)
returns public.paket_kontrak language plpgsql security definer set search_path = '' as $$
declare actor_id integer; old_paket public.paket_kontrak; new_paket public.paket_kontrak; item_key text;
begin
 perform app_private.assert_persiapan_editable(p_paket_id);
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
 select p.pengguna_id into actor_id from public.pengguna p
 where p.auth_user_id=auth.uid() and not coalesce(p.terkunci,false)
 and exists (select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=p.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh mengubah draft' using errcode='42501'; end if;
 if p_patch is null or jsonb_typeof(p_patch)<>'object' or p_patch='{}'::jsonb then
  raise exception 'Perubahan paket tidak valid atau kosong' using errcode='22023'; end if;
 for item_key in select jsonb_object_keys(p_patch) loop
  if item_key not in ('nama_paket','nomor_kontrak','tahun_anggaran','nama_ppk','tgl_spmk') then
   raise exception 'Kolum perubahan tidak dibenarkan' using errcode='22023'; end if;
 end loop;
 select * into old_paket from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002'; end if;
 if old_paket.status is distinct from 'DRAFT' then
  raise exception 'Hanya paket berstatus DRAFT boleh diubah' using errcode='55000'; end if;
 new_paket:=old_paket;
 if p_patch ? 'nama_paket' then
  if jsonb_typeof(p_patch->'nama_paket')<>'string' or length(btrim(p_patch->>'nama_paket')) not between 1 and 255 then
   raise exception 'Nama paket tidak valid' using errcode='22023'; end if;
  new_paket.nama_paket:=btrim(p_patch->>'nama_paket');
 end if;
 if p_patch ? 'nomor_kontrak' then
  if jsonb_typeof(p_patch->'nomor_kontrak')<>'string' or length(btrim(p_patch->>'nomor_kontrak')) not between 1 and 100 then
   raise exception 'Nomor kontrak tidak valid' using errcode='22023'; end if;
  new_paket.nomor_kontrak:=btrim(p_patch->>'nomor_kontrak');
 end if;
 if p_patch ? 'tahun_anggaran' then
  if jsonb_typeof(p_patch->'tahun_anggaran')<>'number' then raise exception 'Tahun tidak valid' using errcode='22023';end if;
  if (p_patch->>'tahun_anggaran')::numeric not between 2000 and 2100 or trunc((p_patch->>'tahun_anggaran')::numeric)<>(p_patch->>'tahun_anggaran')::numeric then
   raise exception 'Tahun tidak valid' using errcode='22023';end if;
  new_paket.tahun_anggaran:=(p_patch->>'tahun_anggaran')::numeric::integer;
 end if;
 if p_patch ? 'nama_ppk' then
  if jsonb_typeof(p_patch->'nama_ppk') not in ('string','null') or length(btrim(p_patch->>'nama_ppk'))>255 then
   raise exception 'Nama PPK tidak valid' using errcode='22023'; end if;
  new_paket.nama_ppk:=nullif(btrim(p_patch->>'nama_ppk'),'');
 end if;
 if p_patch ? 'tgl_spmk' then
  if p_patch->'tgl_spmk'='null'::jsonb then new_paket.tgl_spmk:=null;
  else
   if jsonb_typeof(p_patch->'tgl_spmk')<>'string' or (p_patch->>'tgl_spmk') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Tarikh SPMK mesti YYYY-MM-DD atau null' using errcode='22023';end if;
   begin new_paket.tgl_spmk:=(p_patch->>'tgl_spmk')::date;
   exception when invalid_datetime_format or datetime_field_overflow then
    raise exception 'Tarikh SPMK tidak valid' using errcode='22023';end;
  end if;
 end if;
 if to_jsonb(new_paket)=to_jsonb(old_paket) then return old_paket;end if;
 update public.paket_kontrak set nama_paket=new_paket.nama_paket,nomor_kontrak=new_paket.nomor_kontrak,
 tahun_anggaran=new_paket.tahun_anggaran,nama_ppk=new_paket.nama_ppk,tgl_spmk=new_paket.tgl_spmk
 where paket_id=p_paket_id returning * into new_paket;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values (actor_id,'paket_kontrak',p_paket_id::text,'UPDATE_DRAFT',to_jsonb(old_paket),to_jsonb(new_paket),localtimestamp);
 return new_paket;
end $$;

create or replace function app_private.daftar_dokumen_persiapan(p_paket_id integer,p_jenis text,p_judul text,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; type_id integer; d public.dokumen; v public.dokumen_versi; package_status text;
begin
 perform app_private.assert_persiapan_editable(p_paket_id);
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

create or replace function app_private.simpan_checklist_persiapan(p_paket_id integer,p_expected_version integer,p_jawaban jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; paket public.paket_kontrak; tpl public.checklist_template; filled public.checklist_pengisian; entry jsonb; item_key text; old_state jsonb; new_state jsonb; total integer; answered integer;
begin
 perform app_private.assert_persiapan_editable(p_paket_id);
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501';end if;
 select p.pengguna_id into actor_id from public.pengguna p where p.auth_user_id=auth.uid() and not coalesce(p.terkunci,false)
 and exists(select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=p.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh mengisi checklist' using errcode='42501';end if;
 select * into paket from public.paket_kontrak p where p.paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if paket.status is distinct from 'DRAFT' then raise exception 'Checklist persiapan hanya boleh diisi ketika paket DRAFT' using errcode='55000';end if;
 select * into tpl from public.checklist_template t where t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01';
 if not found then raise exception 'Template persiapan belum tersedia' using errcode='55000';end if;
 if p_expected_version is null or p_expected_version<0 or p_jawaban is null or jsonb_typeof(p_jawaban)<>'array' then
 raise exception 'Versi dan senarai jawapan tidak valid' using errcode='22023';end if;
 if jsonb_array_length(p_jawaban) not between 1 and 25 then raise exception 'Hantar 1 hingga 25 jawapan' using errcode='22023';end if;
 for entry in select value from jsonb_array_elements(p_jawaban) loop
  if jsonb_typeof(entry)<>'object' then raise exception 'Jawapan tidak valid' using errcode='22023';end if;
  for item_key in select jsonb_object_keys(entry) loop
   if item_key not in ('item_id','jawaban','keterangan') then raise exception 'Kolum jawapan tidak dibenarkan' using errcode='22023';end if;
  end loop;
  if not(entry ? 'item_id') or not(entry ? 'jawaban') or jsonb_typeof(entry->'item_id')<>'number' then raise exception 'Item dan jawapan diperlukan' using errcode='22023';end if;
  if (entry->>'item_id')::numeric<1 or (entry->>'item_id')::numeric>2147483647 or trunc((entry->>'item_id')::numeric)<>(entry->>'item_id')::numeric then raise exception 'ID item tidak valid' using errcode='22023';end if;
  if not exists(select 1 from public.checklist_item i where i.item_id=(entry->>'item_id')::numeric::integer and i.template_id=tpl.template_id) then raise exception 'Item bukan milik template persiapan' using errcode='22023';end if;
  if entry->'jawaban'<>'null'::jsonb and (jsonb_typeof(entry->'jawaban')<>'string' or entry->>'jawaban' not in ('Ya','Tidak')) then raise exception 'Jawapan mesti Ya, Tidak atau null' using errcode='22023';end if;
  if entry ? 'keterangan' and (jsonb_typeof(entry->'keterangan')<>'string' or length(entry->>'keterangan')>2000) then raise exception 'Catatan mesti teks maksimum 2000 aksara' using errcode='22023';end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(p_jawaban) e group by (e->>'item_id')::numeric having count(*)>1) then raise exception 'Item berulang dalam permintaan' using errcode='22023';end if;
 select * into filled from public.checklist_pengisian q where q.paket_id=p_paket_id and q.template_id=tpl.template_id for update;
 if found then
  if filled.status not in ('DRAFT','PERLU_REVISI') then raise exception 'Checklist bukan berstatus DRAFT' using errcode='55000';end if;
  if filled.versi<>p_expected_version then raise exception 'Checklist telah berubah. Baca semula sebelum menyimpan' using errcode='40001';end if;
 else
  if p_expected_version<>0 then raise exception 'Checklist telah berubah. Baca semula sebelum menyimpan' using errcode='40001';end if;
 end if;
 old_state:=public.baca_checklist_persiapan(p_paket_id);
 if filled.pengisian_id is null then
  insert into public.checklist_pengisian(paket_id,template_id,konteks,konteks_id,tanggal,diisi_oleh,status,persen_lengkap)
  values(p_paket_id,tpl.template_id,'PAKET',p_paket_id,current_date,actor_id,'DRAFT',0) returning * into filled;
 end if;
 for entry in select value from jsonb_array_elements(p_jawaban) loop
  insert into public.checklist_jawaban(pengisian_id,item_id,jawaban,keterangan)
  values(filled.pengisian_id,(entry->>'item_id')::numeric::integer,entry->>'jawaban',case when entry ? 'keterangan' then entry->>'keterangan' else null end)
  on conflict(pengisian_id,item_id) do update set jawaban=excluded.jawaban,
  keterangan=case when entry ? 'keterangan' then excluded.keterangan else checklist_jawaban.keterangan end;
 end loop;
 select count(*),count(j.jawaban) into total,answered from public.checklist_item i left join public.checklist_jawaban j on j.item_id=i.item_id and j.pengisian_id=filled.pengisian_id where i.template_id=tpl.template_id;
 update public.checklist_pengisian set persen_lengkap=case when total=0 then 0 else round(answered*100.0/total,2) end,versi=versi+1,updated_at=clock_timestamp() where pengisian_id=filled.pengisian_id;
 new_state:=public.baca_checklist_persiapan(p_paket_id);
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(actor_id,'checklist_pengisian',filled.pengisian_id::text,'SAVE_DRAFT',old_state,new_state,localtimestamp);
 return new_state;
end $$;

create or replace function app_private.tautkan_bukti_persiapan(p_paket_id integer,p_expected_version integer,p_item_id integer,p_dokumen_id integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; paket public.paket_kontrak; tpl public.checklist_template; filled public.checklist_pengisian; expected_kind text; old_state jsonb; new_state jsonb; old_document integer;
begin
 perform app_private.assert_persiapan_editable(p_paket_id);
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501';end if;
 select u.pengguna_id into actor_id from public.pengguna u where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false)
 and exists(select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh mengubah bukti checklist' using errcode='42501';end if;
 select * into paket from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if paket.status is distinct from 'DRAFT' then raise exception 'Pautan bukti hanya boleh diubah ketika paket DRAFT' using errcode='55000';end if;
 if p_expected_version is null or p_expected_version<0 or p_expected_version>=2147483647 or p_item_id is null or p_item_id<1 or (p_dokumen_id is not null and p_dokumen_id<1) then
 raise exception 'ID atau versi tidak valid' using errcode='22023';end if;
 select * into tpl from public.checklist_template where no_dokumen='JM-PERSIAPAN-TAHAP0' and revisi='DRAFT-01';
 if not found then raise exception 'Template persiapan belum tersedia' using errcode='55000';end if;
 select i.jenis_bukti_kode into expected_kind from public.checklist_item i where i.item_id=p_item_id and i.template_id=tpl.template_id;
 if expected_kind is null then raise exception 'Item ini belum mempunyai padanan jenis bukti' using errcode='22023';end if;
 select * into filled from public.checklist_pengisian q where q.paket_id=p_paket_id and q.template_id=tpl.template_id for update;
 if found then
  if filled.status not in ('DRAFT','PERLU_REVISI') then raise exception 'Checklist bukan berstatus DRAFT' using errcode='55000';end if;
  if filled.versi<>p_expected_version then raise exception 'Checklist telah berubah. Baca semula sebelum menyimpan' using errcode='40001';end if;
 else
  if p_expected_version<>0 then raise exception 'Checklist telah berubah. Baca semula sebelum menyimpan' using errcode='40001';end if;
 end if;
 if p_dokumen_id is not null then
  if not exists(select 1 from public.dokumen d join public.jenis_dokumen j on j.jenis_dokumen_id=d.jenis_dokumen_id
   join public.dokumen_versi v on v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif
   join storage.objects o on o.bucket_id=v.bucket_id and o.name=v.object_path
   where d.dokumen_id=p_dokumen_id and d.paket_id=p_paket_id and d.status='TERSEDIA' and d.sumber_tipe='PERSIAPAN' and j.kode=expected_kind
   and v.bucket_id='dokumen-persiapan' and o.metadata->>'size'=v.ukuran_byte::text and o.metadata->>'mimetype'='application/pdf') then
   raise exception 'Dokumen tidak tersedia, bukan paket yang sama atau jenis bukti tidak sepadan' using errcode='22023';end if;
 end if;
 old_state:=public.baca_checklist_persiapan(p_paket_id);
 select bukti_dokumen_id into old_document from public.checklist_jawaban where pengisian_id=filled.pengisian_id and item_id=p_item_id;
 if old_document is not distinct from p_dokumen_id then return old_state;end if;
 if filled.pengisian_id is null then
  insert into public.checklist_pengisian(paket_id,template_id,konteks,konteks_id,tanggal,diisi_oleh,status,persen_lengkap)
  values(p_paket_id,tpl.template_id,'PAKET',p_paket_id,current_date,actor_id,'DRAFT',0) returning * into filled;
 end if;
 insert into public.checklist_jawaban(pengisian_id,item_id,bukti_dokumen_id) values(filled.pengisian_id,p_item_id,p_dokumen_id)
 on conflict(pengisian_id,item_id) do update set bukti_dokumen_id=excluded.bukti_dokumen_id;
 update public.checklist_pengisian set versi=versi+1,updated_at=clock_timestamp() where pengisian_id=filled.pengisian_id;
 new_state:=public.baca_checklist_persiapan(p_paket_id);
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(actor_id,'checklist_pengisian',filled.pengisian_id::text,case when p_dokumen_id is null then 'UNLINK_EVIDENCE' else 'LINK_EVIDENCE' end,old_state,new_state,localtimestamp);
 return new_state;
end $$;

create or replace function app_private.tambah_versi_dokumen_persiapan(p_paket_id integer,p_dokumen_id integer,p_expected_version integer,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; package_status text; d public.dokumen; v public.dokumen_versi; old_d jsonb; q public.checklist_pengisian; changed jsonb:='[]'::jsonb;
begin
 perform app_private.assert_persiapan_editable(p_paket_id);
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501';end if;
 select u.pengguna_id into actor_id from public.pengguna u where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false)
 and exists(select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh upload versi dokumen' using errcode='42501';end if;
 select status into package_status from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if package_status is distinct from 'DRAFT' then raise exception 'Versi dokumen hanya boleh ditambah ketika paket DRAFT' using errcode='55000';end if;
 select * into d from public.dokumen where dokumen_id=p_dokumen_id and paket_id=p_paket_id and sumber_tipe='PERSIAPAN' and status='TERSEDIA' for update;
 if not found then raise exception 'Dokumen tidak ditemukan' using errcode='P0002';end if;
 if not exists(select 1 from public.jenis_dokumen j where j.jenis_dokumen_id=d.jenis_dokumen_id and j.kode in ('LAPORAN_PENDAHULUAN','PROGRAM_MUTU')) then raise exception 'Jenis dokumen tidak disokong' using errcode='22023';end if;
 if p_expected_version is null or p_expected_version not between 1 and 2147483646
 or p_nama_file is null or length(p_nama_file) not between 5 and 255 or p_nama_file !~* '\.pdf$' or p_nama_file ~ '[[:cntrl:]/\\]'
 or p_ukuran is null or p_ukuran not between 1 and 10485760 or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$'
 or p_object_path is null or split_part(p_object_path,'/',1)<>p_paket_id::text or p_object_path !~ '^[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$' then
 raise exception 'Maklumat versi dokumen tidak valid' using errcode='22023';end if;
 -- Registered-path retries are idempotent, but cannot claim an object belonging to another document.
 select * into v from public.dokumen_versi where object_path=p_object_path;
 if found then
  if v.dokumen_id<>d.dokumen_id or v.versi_ke<>p_expected_version+1 or v.hash_file<>p_sha256 or v.ukuran_byte<>p_ukuran or v.nama_file<>p_nama_file then raise exception 'Fail telah digunakan' using errcode='22023';end if;
  return jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v),'checklist_dikemas_kini',changed);
 end if;
 if d.versi_aktif is distinct from p_expected_version then raise exception 'Versi dokumen telah berubah. Baca senarai dokumen semula' using errcode='40001';end if;
 -- Lock any draft checklist whose evidence will now resolve to the new active file.
 for q in select c.* from public.checklist_pengisian c where exists(select 1 from public.checklist_jawaban a where a.pengisian_id=c.pengisian_id and a.bukti_dokumen_id=p_dokumen_id) order by c.pengisian_id for update loop
  if q.paket_id<>p_paket_id or q.status not in ('DRAFT','PERLU_REVISI') then raise exception 'Bukti checklist bukan DRAFT tidak boleh diganti' using errcode='55000';end if;
  if q.versi>=2147483647 then raise exception 'Had versi checklist telah dicapai' using errcode='55000';end if;
 end loop;
 if not exists(select 1 from storage.buckets where id='dokumen-persiapan' and public is false) then raise exception 'Bucket private dokumen-persiapan belum tersedia' using errcode='55000';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='dokumen-persiapan' and o.name=p_object_path and o.owner_id=auth.uid()::text and o.metadata->>'size'=p_ukuran::text and o.metadata->>'mimetype'='application/pdf') then raise exception 'Fail upload belum tersedia atau metadata tidak sepadan' using errcode='22023';end if;
 old_d:=to_jsonb(d);
 insert into public.dokumen_versi(dokumen_id,versi_ke,hash_file,ukuran_byte,dibuat_pada,bucket_id,object_path,nama_file,mime_type)
 values(d.dokumen_id,p_expected_version+1,p_sha256,p_ukuran,localtimestamp,'dokumen-persiapan',p_object_path,p_nama_file,'application/pdf') returning * into v;
 update public.dokumen set versi_aktif=v.versi_ke where dokumen_id=d.dokumen_id returning * into d;
 for q in select c.* from public.checklist_pengisian c where exists(select 1 from public.checklist_jawaban a where a.pengisian_id=c.pengisian_id and a.bukti_dokumen_id=p_dokumen_id) order by c.pengisian_id loop
  update public.checklist_pengisian set versi=versi+1,updated_at=clock_timestamp() where pengisian_id=q.pengisian_id;
  changed:=changed||jsonb_build_array(jsonb_build_object('pengisian_id',q.pengisian_id,'versi',q.versi+1));
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
  values(actor_id,'checklist_pengisian',q.pengisian_id::text,'VERSION_EVIDENCE',to_jsonb(q),to_jsonb(q)||jsonb_build_object('versi',q.versi+1,'dokumen_id',d.dokumen_id,'versi_dokumen',v.versi_ke),localtimestamp);
 end loop;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(actor_id,'dokumen',d.dokumen_id::text,'UPLOAD_DOCUMENT_VERSION',old_d,jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v)),localtimestamp);
 return jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v),'checklist_dikemas_kini',changed);
end $$;

alter policy dokumen_storage_insert_provider on storage.objects with check (
 bucket_id='dokumen-persiapan' and owner_id=(select auth.uid())::text
 and name ~ '^[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$'
 and exists(select 1 from public.paket_kontrak p join public.pengguna u on u.auth_user_id=(select auth.uid()) join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id join public.peran r on r.peran_id=pp.peran_id
 where p.paket_id::text=split_part(name,'/',1) and p.status='DRAFT' and not coalesce(u.terkunci,false) and r.nama='penyedia_jasa'
 and not exists(select 1 from public.checklist_pengisian q join public.checklist_template t using(template_id) where q.paket_id=p.paket_id and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01' and q.status not in ('DRAFT','PERLU_REVISI')))
);
create function public.baca_pengajuan_persiapan(p_paket_id integer)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare q public.checklist_pengisian; decision jsonb;
begin
 if not exists(select 1 from public.paket_kontrak where paket_id=p_paket_id) then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002';end if;
 select c.* into q from public.checklist_pengisian c join public.checklist_template t using(template_id) where c.paket_id=p_paket_id and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01';
 select jsonb_build_object('persetujuan_id',a.persetujuan_id,'pengguna_id',a.pengguna_id,'keputusan',a.keputusan,'catatan',a.catatan,'waktu',a.waktu,'dokumen_id',a.dokumen_id,'dok_versi_id',a.dok_versi_id) into decision from public.persetujuan_dokumen a where a.pengajuan_trail_id=q.pengajuan_trail_id;
 return jsonb_build_object('paket_id',p_paket_id,'pengisian_id',q.pengisian_id,'status',coalesce(q.status,'DRAFT'),'versi',coalesce(q.versi,0),
 'pengajuan',case when q.pengajuan_trail_id is null then null else jsonb_build_object('pengajuan_id',q.pengajuan_trail_id,'diajukan_oleh',q.diajukan_oleh,'diajukan_pada',q.diajukan_pada,'snapshot',q.snapshot_pengajuan) end,
 'review',decision,'aturan',jsonb_build_object('mode','SEMAKAN_MANUAL_PIC','validasi_kelengkapan_resmi_aktif',false));
end $$;
revoke all on function public.baca_pengajuan_persiapan(integer) from public,anon;
grant execute on function public.baca_pengajuan_persiapan(integer) to authenticated;
create function app_private.ajukan_persiapan(p_paket_id integer,p_expected_version integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; q public.checklist_pengisian; report_id integer; report_version integer; snapshot jsonb; documents jsonb; submitted_at timestamptz; trail bigint; package_json jsonb;
begin
 perform app_private.assert_persiapan_editable(p_paket_id);
 select pengguna_id into actor from public.pengguna where auth_user_id=auth.uid() and not coalesce(terkunci,false);
 if p_expected_version is null or p_expected_version not between 0 and 2147483646 then raise exception 'Versi tidak valid' using errcode='22023';end if;
 select c.* into q from public.checklist_pengisian c join public.checklist_template t using(template_id) where c.paket_id=p_paket_id and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01' for update of c;
 if not found then raise exception 'Simpan checklist dan pautkan Laporan Pendahuluan dahulu' using errcode='22023';end if;
 if q.versi<>p_expected_version then raise exception 'Checklist telah berubah. Baca semula sebelum menghantar' using errcode='40001';end if;
 select a.bukti_dokumen_id into report_id from public.checklist_jawaban a join public.checklist_item i using(item_id) where a.pengisian_id=q.pengisian_id and i.template_id=q.template_id and i.kode='DOK-01' and i.jenis_bukti_kode='LAPORAN_PENDAHULUAN';
 if report_id is null then raise exception 'Pautkan PDF Laporan Pendahuluan sebelum menghantar' using errcode='22023';end if;
 -- Validate every selected attachment, including the report, against package/type/current Storage metadata.
 if exists(select 1 from public.checklist_jawaban a join public.checklist_item i using(item_id) where a.pengisian_id=q.pengisian_id and a.bukti_dokumen_id is not null and not exists(
  select 1 from public.dokumen d join public.jenis_dokumen j using(jenis_dokumen_id) join public.dokumen_versi v on v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif join storage.objects o on o.bucket_id=v.bucket_id and o.name=v.object_path
  where d.dokumen_id=a.bukti_dokumen_id and d.paket_id=p_paket_id and d.sumber_tipe='PERSIAPAN' and d.status='TERSEDIA' and j.kode=i.jenis_bukti_kode and v.bucket_id='dokumen-persiapan' and o.metadata->>'size'=v.ukuran_byte::text and o.metadata->>'mimetype'='application/pdf')) then raise exception 'Bukti dokumen tidak tersedia atau tidak sepadan' using errcode='22023';end if;
 select jsonb_agg(jsonb_build_object('dokumen_id',d.dokumen_id,'judul',d.judul,'jenis',j.kode,'dok_versi_id',v.dok_versi_id,'versi_ke',v.versi_ke,'nama_file',v.nama_file,'ukuran_byte',v.ukuran_byte,'hash_file',v.hash_file,'bucket_id',v.bucket_id,'object_path',v.object_path) order by d.dokumen_id)
 into documents from public.dokumen d join public.jenis_dokumen j using(jenis_dokumen_id) join public.dokumen_versi v on v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif where d.paket_id=p_paket_id and exists(select 1 from public.checklist_jawaban a where a.pengisian_id=q.pengisian_id and a.bukti_dokumen_id=d.dokumen_id);
 select v.dok_versi_id into report_version from public.dokumen_versi v join public.dokumen d using(dokumen_id) where d.dokumen_id=report_id and v.versi_ke=d.versi_aktif;
 submitted_at:=clock_timestamp();
 select jsonb_build_object('paket_id',p.paket_id,'balai_id',p.balai_id,'nama_paket',p.nama_paket,'nomor_kontrak',p.nomor_kontrak,'tahun_anggaran',p.tahun_anggaran,'nama_ppk',p.nama_ppk,'tgl_spmk',p.tgl_spmk) into package_json from public.paket_kontrak p where p.paket_id=p_paket_id;
 snapshot:=jsonb_build_object('paket',package_json,'checklist',jsonb_set(jsonb_set(public.baca_checklist_persiapan(p_paket_id),'{pengisian,status}','"DIAJUKAN"'::jsonb),'{pengisian,versi}',to_jsonb(q.versi+1)),'dokumen',documents,'laporan_dokumen_id',report_id,'laporan_dok_versi_id',report_version,'versi_saat_dikirim',q.versi+1,'diajukan_oleh',actor,'diajukan_pada',submitted_at,'mode','SEMAKAN_MANUAL_PIC','validasi_kelengkapan_resmi_aktif',false);
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu) values(actor,'checklist_pengisian',q.pengisian_id::text,'SUBMIT_PREPARATION',jsonb_build_object('status',q.status,'versi',q.versi),snapshot,localtimestamp) returning trail_id into trail;
 update public.checklist_pengisian set status='DIAJUKAN',versi=versi+1,updated_at=clock_timestamp(),pengajuan_trail_id=trail,snapshot_pengajuan=snapshot,diajukan_oleh=actor,diajukan_pada=submitted_at,direview_oleh=null,direview_pada=null,catatan_review=null where pengisian_id=q.pengisian_id;
 return public.baca_pengajuan_persiapan(p_paket_id);
end $$;
revoke all on function app_private.ajukan_persiapan(integer,integer) from public,anon;
grant execute on function app_private.ajukan_persiapan(integer,integer) to authenticated;
create function public.ajukan_persiapan(p_paket_id integer,p_expected_version integer)
returns jsonb language sql security invoker set search_path='' as $$select app_private.ajukan_persiapan(p_paket_id,p_expected_version);$$;
revoke all on function public.ajukan_persiapan(integer,integer) from public,anon;
grant execute on function public.ajukan_persiapan(integer,integer) to authenticated;
create function app_private.review_persiapan(p_paket_id integer,p_expected_version integer,p_keputusan text,p_catatan text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; q public.checklist_pengisian; before_state jsonb; result jsonb; report_id integer; report_version integer;
begin
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501';end if;
 select u.pengguna_id into actor from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) join public.paket_kontrak p on p.paket_id=p_paket_id
 where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false) and r.nama='pic_balai' and pp.scope_balai_id=p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id) limit 1;
 if actor is null then raise exception 'Hanya PIC Balai yang ditugaskan boleh menyemak persiapan' using errcode='42501';end if;
 perform 1 from public.paket_kontrak where paket_id=p_paket_id and status='DRAFT' for update;
 if not found then raise exception 'Paket bukan berstatus DRAFT' using errcode='55000';end if;
 if p_expected_version is null or p_expected_version not between 0 and 2147483646 or p_keputusan is null or p_keputusan not in ('PERLU_REVISI','DISETUJUI') or p_catatan is null or length(p_catatan)>2000 or (p_keputusan='PERLU_REVISI' and length(btrim(p_catatan))=0) then raise exception 'Keputusan atau catatan tidak valid; revisi memerlukan catatan' using errcode='22023';end if;
 select c.* into q from public.checklist_pengisian c join public.checklist_template t using(template_id) where c.paket_id=p_paket_id and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01' for update of c;
 if not found or q.status<>'DIAJUKAN' or q.snapshot_pengajuan is null or q.pengajuan_trail_id is null then raise exception 'Persiapan belum diajukan atau sudah diputuskan' using errcode='55000';end if;
 if q.diajukan_oleh=actor then raise exception 'Pengirim tidak boleh menyemak pengajuannya sendiri' using errcode='42501';end if;
 if q.versi<>p_expected_version then raise exception 'Checklist telah berubah. Baca semula sebelum menyemak' using errcode='40001';end if;
 report_id:=(q.snapshot_pengajuan->>'laporan_dokumen_id')::integer;report_version:=(q.snapshot_pengajuan->>'laporan_dok_versi_id')::integer;
 if exists(select 1 from jsonb_array_elements(q.snapshot_pengajuan->'dokumen') x where not exists(select 1 from public.dokumen d join public.dokumen_versi v on v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif where d.dokumen_id=(x->>'dokumen_id')::integer and d.paket_id=p_paket_id and d.status='TERSEDIA' and v.dok_versi_id=(x->>'dok_versi_id')::integer)) then raise exception 'Versi bukti tidak lagi sepadan dengan pengajuan' using errcode='55000';end if;
 before_state:=public.baca_pengajuan_persiapan(p_paket_id);
 insert into public.persetujuan_dokumen(dokumen_id,dok_versi_id,pengisian_id,pengajuan_trail_id,pengguna_id,keputusan,catatan,waktu)
 values(report_id,report_version,q.pengisian_id,q.pengajuan_trail_id,actor,p_keputusan,btrim(p_catatan),localtimestamp);
 update public.checklist_pengisian set status=p_keputusan,versi=versi+1,updated_at=clock_timestamp(),direview_oleh=actor,direview_pada=clock_timestamp(),catatan_review=btrim(p_catatan) where pengisian_id=q.pengisian_id;
 result:=public.baca_pengajuan_persiapan(p_paket_id);
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu) values(actor,'checklist_pengisian',q.pengisian_id::text,'REVIEW_PREPARATION',before_state,result,localtimestamp);
 return result;
end $$;
revoke all on function app_private.review_persiapan(integer,integer,text,text) from public,anon;
grant execute on function app_private.review_persiapan(integer,integer,text,text) to authenticated;
create function public.review_persiapan(p_paket_id integer,p_expected_version integer,p_keputusan text,p_catatan text)
returns jsonb language sql security invoker set search_path='' as $$select app_private.review_persiapan(p_paket_id,p_expected_version,p_keputusan,p_catatan);$$;
revoke all on function public.review_persiapan(integer,integer,text,text) from public,anon;
grant execute on function public.review_persiapan(integer,integer,text,text) to authenticated;
