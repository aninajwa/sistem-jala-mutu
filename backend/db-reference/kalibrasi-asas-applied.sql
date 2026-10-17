-- Rujukan perubahan yang sudah dipasang; jangan jalankan ulang.
-- Katalog nama sahaja. Kode ialah pengecam aplikasi; tiada ambang/metode/SMD direka.
insert into public.jenis_survei(kode,nama,aktif) values
('IRI','IRI',true),('PCI','PCI',true),('LENDUTAN','Lendutan',true),('JEMBATAN','Jembatan',true),
('LERENG','Lereng',true),('DRAINASE','Drainase',true),('LALU_LINTAS','Lalu Lintas',true),('RNI','RNI',true);
-- Model satu organisasi penyedia seperti skop sistem yang diminta.
create unique index penyedia_jasa_satu_organisasi on public.penyedia_jasa ((true));
alter table public.jenis_survei enable row level security;
alter table public.penyedia_jasa enable row level security;
alter table public.tim_survei enable row level security;
alter table public.alat_survei enable row level security;
alter table public.penugasan_alat enable row level security;
revoke all privileges on public.jenis_survei,public.penyedia_jasa,public.tim_survei,public.alat_survei,public.penugasan_alat from anon,authenticated;
grant select on public.jenis_survei,public.penyedia_jasa,public.tim_survei,public.alat_survei,public.penugasan_alat to authenticated;
create policy jenis_survei_read_authenticated on public.jenis_survei for select to authenticated using (
 exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama in ('penyedia_jasa','pic_balai','direktorat','admin'))
);
create policy tim_read_paket on public.tim_survei for select to authenticated using (exists(select 1 from public.paket_kontrak p where p.paket_id=tim_survei.paket_id));
create policy penugasan_alat_read_tim on public.penugasan_alat for select to authenticated using (exists(select 1 from public.tim_survei t where t.tim_id=penugasan_alat.tim_id));
create policy penyedia_read_scope on public.penyedia_jasa for select to authenticated using (
 exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama in ('penyedia_jasa','direktorat','admin'))
 or exists(select 1 from public.paket_kontrak p where p.penyedia_id=penyedia_jasa.penyedia_id)
);
create policy alat_read_scope on public.alat_survei for select to authenticated using (
 exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama in ('penyedia_jasa','direktorat','admin'))
 or exists(select 1 from public.penugasan_alat a where a.alat_id=alat_survei.alat_id)
);
create function app_private.assert_tahap_kalibrasi(p_paket_id integer)
returns integer language plpgsql security definer set search_path='' as $$
declare actor integer; package_status text;
begin
 select u.pengguna_id into actor from public.pengguna u where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false) and exists(select 1 from public.pengguna_peran pp join public.peran r using(peran_id) where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa');
 if actor is null then raise exception 'Hanya Penyedia Jasa aktif boleh mengurus tim dan alat' using errcode='42501';end if;
 select status into package_status from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if package_status is distinct from 'DRAFT' then raise exception 'Status paket belum disokong untuk pendaftaran tahap ini' using errcode='55000';end if;
 if not exists(select 1 from public.checklist_pengisian q join public.checklist_template t using(template_id) where q.paket_id=p_paket_id and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01' and q.status='DISETUJUI') then raise exception 'Persiapan perlu disetujui sebelum pendaftaran tim dan alat tahap kalibrasi' using errcode='55000';end if;
 return actor;
end $$;
revoke all on function app_private.assert_tahap_kalibrasi(integer) from public,anon;
grant execute on function app_private.assert_tahap_kalibrasi(integer) to authenticated;
create function app_private.daftar_penyedia_tunggal(p_nama text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; org public.penyedia_jasa;
begin
 select u.pengguna_id into actor from public.pengguna u where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false) and exists(select 1 from public.pengguna_peran pp join public.peran r using(peran_id) where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa');
 if actor is null then raise exception 'Hanya Penyedia Jasa aktif boleh mendaftar organisasi' using errcode='42501';end if;
 if p_nama is null or length(btrim(p_nama)) not between 1 and 255 then raise exception 'Nama penyedia tidak valid' using errcode='22023';end if;
 insert into public.penyedia_jasa(nama) values(btrim(p_nama)) returning * into org;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu) values(actor,'penyedia_jasa',org.penyedia_id::text,'CREATE_PROVIDER',jsonb_build_object('penyedia_id',org.penyedia_id,'nama',org.nama),localtimestamp);
 return jsonb_build_object('penyedia_id',org.penyedia_id,'nama',org.nama);
end $$;
revoke all on function app_private.daftar_penyedia_tunggal(text) from public,anon;
grant execute on function app_private.daftar_penyedia_tunggal(text) to authenticated;
create function public.daftar_penyedia_tunggal(p_nama text) returns jsonb language sql security invoker set search_path='' as $$select app_private.daftar_penyedia_tunggal(p_nama);$$;
revoke all on function public.daftar_penyedia_tunggal(text) from public,anon;
grant execute on function public.daftar_penyedia_tunggal(text) to authenticated;
create function app_private.daftar_tim_survei(p_paket_id integer,p_penyedia_id integer,p_jenis_survei_id integer,p_nama_tim text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; org_id integer; t public.tim_survei;
begin
 actor:=app_private.assert_tahap_kalibrasi(p_paket_id);
 if p_nama_tim is null or length(btrim(p_nama_tim)) not between 1 and 255 or p_penyedia_id is null or p_penyedia_id<1 or p_jenis_survei_id is null or p_jenis_survei_id<1 then raise exception 'Maklumat tim tidak valid' using errcode='22023';end if;
 if not exists(select 1 from public.penyedia_jasa where penyedia_id=p_penyedia_id) then raise exception 'Organisasi penyedia tidak ditemukan' using errcode='22023';end if;
 if not exists(select 1 from public.jenis_survei where jenis_survei_id=p_jenis_survei_id and aktif is true) then raise exception 'Jenis survei tidak aktif atau tidak ditemukan' using errcode='22023';end if;
 select penyedia_id into org_id from public.paket_kontrak where paket_id=p_paket_id;
 if org_id is not null and org_id<>p_penyedia_id then raise exception 'Penyedia paket tidak sepadan' using errcode='22023';end if;
 if exists(select 1 from public.tim_survei where paket_id=p_paket_id and jenis_survei_id=p_jenis_survei_id and lower(btrim(nama_tim))=lower(btrim(p_nama_tim))) then raise exception 'Nama tim untuk jenis survei ini sudah digunakan dalam paket' using errcode='23505';end if;
 if org_id is null then
  update public.paket_kontrak set penyedia_id=p_penyedia_id where paket_id=p_paket_id;
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu) values(actor,'paket_kontrak',p_paket_id::text,'LINK_PROVIDER',jsonb_build_object('penyedia_id',null),jsonb_build_object('penyedia_id',p_penyedia_id),localtimestamp);
 end if;
 insert into public.tim_survei(paket_id,jenis_survei_id,nama_tim) values(p_paket_id,p_jenis_survei_id,btrim(p_nama_tim)) returning * into t;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu) values(actor,'tim_survei',t.tim_id::text,'CREATE_SURVEY_TEAM',to_jsonb(t),localtimestamp);
 return to_jsonb(t);
end $$;
revoke all on function app_private.daftar_tim_survei(integer,integer,integer,text) from public,anon;
grant execute on function app_private.daftar_tim_survei(integer,integer,integer,text) to authenticated;
create function public.daftar_tim_survei(p_paket_id integer,p_penyedia_id integer,p_jenis_survei_id integer,p_nama_tim text) returns jsonb language sql security invoker set search_path='' as $$select app_private.daftar_tim_survei(p_paket_id,p_penyedia_id,p_jenis_survei_id,p_nama_tim);$$;
revoke all on function public.daftar_tim_survei(integer,integer,integer,text) from public,anon;
grant execute on function public.daftar_tim_survei(integer,integer,integer,text) to authenticated;
create function app_private.daftar_alat_tim(p_paket_id integer,p_tim_id integer,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; t public.tim_survei; tool public.alat_survei; a public.penugasan_alat; k text; org integer; start_date date; end_date date; vehicle text; existing boolean;
begin
 actor:=app_private.assert_tahap_kalibrasi(p_paket_id);
 select * into t from public.tim_survei where tim_id=p_tim_id and paket_id=p_paket_id for update;
 if not found then raise exception 'Tim tidak ditemukan dalam paket ini' using errcode='P0002';end if;
 select penyedia_id into org from public.paket_kontrak where paket_id=p_paket_id;
 if org is null then raise exception 'Paket belum mempunyai organisasi penyedia' using errcode='55000';end if;
 if not exists(select 1 from public.jenis_survei where jenis_survei_id=t.jenis_survei_id and aktif is true) then raise exception 'Jenis survei tim tidak aktif' using errcode='22023';end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Maklumat alat tidak valid' using errcode='22023';end if;
 existing:=p_data ? 'alat_id';
 for k in select jsonb_object_keys(p_data) loop
  if (existing and k not in ('alat_id','kendaraan','mulai','selesai')) or (not existing and k not in ('nama_alat','merek_tipe','nomor_seri','kelas','tahun_perolehan','kondisi','milik_djbm','kendaraan','mulai','selesai')) then raise exception 'Kolum alat tidak dibenarkan' using errcode='22023';end if;
 end loop;
 foreach k in array array['kendaraan','mulai','selesai'] loop
  if p_data ? k and jsonb_typeof(p_data->k) not in ('string','null') then raise exception 'Maklumat penugasan tidak valid' using errcode='22023';end if;
 end loop;
 if length(btrim(p_data->>'kendaraan'))>255 then raise exception 'Nama kendaraan terlalu panjang' using errcode='22023';end if;
 vehicle:=nullif(btrim(p_data->>'kendaraan'),'');
 foreach k in array array['mulai','selesai'] loop
  if p_data->>k is not null then
   if p_data->>k !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Tarikh mesti YYYY-MM-DD' using errcode='22023';end if;
   begin
    if k='mulai' then start_date:=(p_data->>k)::date;else end_date:=(p_data->>k)::date;end if;
   exception when invalid_datetime_format or datetime_field_overflow then raise exception 'Tarikh tidak valid' using errcode='22023';end;
  end if;
 end loop;
 if end_date is not null and (start_date is null or end_date<start_date) then raise exception 'Tarikh selesai memerlukan mulai dan tidak boleh lebih awal' using errcode='22023';end if;
 if existing then
  if jsonb_typeof(p_data->'alat_id')<>'number' or (p_data->>'alat_id')::numeric not between 1 and 2147483647 or trunc((p_data->>'alat_id')::numeric)<>(p_data->>'alat_id')::numeric then raise exception 'ID alat tidak valid' using errcode='22023';end if;
  select * into tool from public.alat_survei where alat_id=(p_data->>'alat_id')::numeric::integer for update;
  if not found or tool.penyedia_id is distinct from org or tool.jenis_survei_id is distinct from t.jenis_survei_id then raise exception 'Alat tidak ditemukan atau penyedia/jenis survei tidak sepadan' using errcode='22023';end if;
 else
  foreach k in array array['nama_alat','nomor_seri','kondisi'] loop
   if not(p_data ? k) or jsonb_typeof(p_data->k)<>'string' or length(btrim(p_data->>k)) not between 1 and 255 then raise exception 'Nama alat, nomor seri dan kondisi diperlukan' using errcode='22023';end if;
  end loop;
  foreach k in array array['merek_tipe','kelas'] loop
   if p_data ? k and (jsonb_typeof(p_data->k) not in ('string','null') or length(btrim(p_data->>k))>255) then raise exception 'Maklumat alat tidak valid' using errcode='22023';end if;
  end loop;
  if not(p_data ? 'milik_djbm') or jsonb_typeof(p_data->'milik_djbm')<>'boolean' then raise exception 'milik_djbm mesti boolean' using errcode='22023';end if;
  if p_data->>'tahun_perolehan' is not null then
   if jsonb_typeof(p_data->'tahun_perolehan')<>'number' or (p_data->>'tahun_perolehan')::numeric not between 1900 and 2100 or trunc((p_data->>'tahun_perolehan')::numeric)<>(p_data->>'tahun_perolehan')::numeric then raise exception 'Tahun perolehan tidak valid' using errcode='22023';end if;
  end if;
  insert into public.alat_survei(penyedia_id,jenis_survei_id,nama_alat,merek_tipe,nomor_seri,kelas,tahun_perolehan,kondisi,milik_djbm)
  values(org,t.jenis_survei_id,btrim(p_data->>'nama_alat'),nullif(btrim(p_data->>'merek_tipe'),''),btrim(p_data->>'nomor_seri'),nullif(btrim(p_data->>'kelas'),''),(p_data->>'tahun_perolehan')::numeric::integer,btrim(p_data->>'kondisi'),(p_data->>'milik_djbm')::boolean) returning * into tool;
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu) values(actor,'alat_survei',tool.alat_id::text,'CREATE_EQUIPMENT',to_jsonb(tool),localtimestamp);
 end if;
 if exists(select 1 from public.penugasan_alat where tim_id=t.tim_id and alat_id=tool.alat_id and mulai is not distinct from start_date and selesai is not distinct from end_date) then raise exception 'Penugasan alat dengan tempoh yang sama sudah ada' using errcode='23505';end if;
 insert into public.penugasan_alat(tim_id,alat_id,kendaraan,mulai,selesai) values(t.tim_id,tool.alat_id,vehicle,start_date,end_date) returning * into a;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu) values(actor,'penugasan_alat',a.penugasan_id::text,'ASSIGN_EQUIPMENT',to_jsonb(a),localtimestamp);
 return jsonb_build_object('alat',to_jsonb(tool),'penugasan',to_jsonb(a),'kalibrasi_belum_dinilai',true);
end $$;
revoke all on function app_private.daftar_alat_tim(integer,integer,jsonb) from public,anon;
grant execute on function app_private.daftar_alat_tim(integer,integer,jsonb) to authenticated;
create function public.daftar_alat_tim(p_paket_id integer,p_tim_id integer,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.daftar_alat_tim(p_paket_id,p_tim_id,p_data);$$;
revoke all on function public.daftar_alat_tim(integer,integer,jsonb) from public,anon;
grant execute on function public.daftar_alat_tim(integer,integer,jsonb) to authenticated;
