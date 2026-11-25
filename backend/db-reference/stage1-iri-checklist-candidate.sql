-- CANDIDATE ONLY. Do NOT run against shared Supabase without separate approval.
-- Stage 1 internal IRI draft; not an official source revision.
-- Reuses public.checklist_template/item/pengisian/jawaban; does not touch
-- Tahap 0 template data/functions, existing grants, RLS, or auth helpers.
begin;

alter table public.checklist_template
  add column source_sha256 text,
  add column approval_state text;
alter table public.checklist_template
  add constraint checklist_template_source_sha256_format
    check (source_sha256 is null or source_sha256 ~ '^[0-9a-f]{64}$'),
  add constraint checklist_template_approval_state_valid
    check (approval_state is null or approval_state in ('INTERNAL_PROJECT_DRAFT','OFFICIALLY_APPROVED'));

-- Versioned, exact candidate identity. The conflict guard is intentional:
-- never silently reuse/replace a different registration.
do $$
declare iri_id integer; template_id_value integer;
begin
  select jenis_survei_id into iri_id from public.jenis_survei where upper(kode)='IRI' and aktif is true;
  if iri_id is null then raise exception 'Active IRI survey master row is required' using errcode='55000'; end if;
  if exists(select 1 from public.checklist_template where no_dokumen='JM-KALIBRASI-TAHAP1-IRI' and revisi='CANDIDATE-IRI-CAL-01') then
    raise exception 'Stage 1 IRI candidate template already exists; inspect it, do not rerun' using errcode='23505';
  end if;
  execute 'create unique index checklist_stage1_iri_candidate_identity_unique on public.checklist_template(no_dokumen,revisi) where no_dokumen=''JM-KALIBRASI-TAHAP1-IRI'' and revisi=''CANDIDATE-IRI-CAL-01''';
  insert into public.checklist_template(jenis_survei_id,jenis,no_dokumen,revisi,source_sha256,approval_state)
  values(iri_id,'KALIBRASI_TAHAP1_IRI','JM-KALIBRASI-TAHAP1-IRI','CANDIDATE-IRI-CAL-01',
    'ab68855c227ec7ea681fcf3ff03a0b75157b14761e63a13d48bd08a5f8fd550d','INTERNAL_PROJECT_DRAFT')
  returning checklist_template.template_id into template_id_value;
  execute format('create unique index checklist_stage1_iri_candidate_items_unique on public.checklist_item(template_id,kode) where template_id=%s',template_id_value);

  insert into public.checklist_item(template_id,bagian,kode,uraian,wajib,urutan)
  values
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.1','Sertifikat kalibrasi alat masih berlaku',null,1),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.2','Kalibrasi transducer pengukur jarak (odometer) setelah pemasangan',null,2),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.3','Kalibrasi jarak mencapai minimal 1 km',null,3),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.4','Accelerometer diperiksa sesuai dengan prosedur pabrik',null,4),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.5','Transducer laser dikalibrasi sesuai petunjuk pabrik',null,5),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.6','Resolusi alat pengukur <0,1 mm',null,6),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.7','Ketelitian pengukuran mencapai <0,1 mm',null,7),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.8','Kalibrasi dilakukan setelah penggantian roda kendaraan',null,8),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.9','Semua sensor berfungsi dengan baik',null,9),
  (template_id_value,'2. Kalibrasi Alat','IRI-CAL-2.10','Parameter kalibrasi sesuai standar SNI 3426:2022',null,10),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.1','Validasi dilakukan pada minimal 3 lokasi (300 m/lokasi)',null,11),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.2','Validasi mencakup nilai ketidakrataan <4, 4-6, dan >6',null,12),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.3','Pengukuran dilakukan minimal 3 kali per lajur roda',null,13),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.4','Pengukuran dengan alat yang divalidasi dilakukan 5 kali pada 3 kecepatan berbeda',null,14),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.5','Kecepatan validasi mencakup 40 km/jam, 50 km/jam, dan >60 km/jam',null,15),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.6','Nilai gradien persamaan regresi (A) berada dalam rentang 0,95 ≤ A ≤ 1,05',null,16),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.7','Nilai intersep persamaan regresi (B) berada dalam rentang -0,25 ≤ B ≤ 0,25 m/km',null,17),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.8','Nilai koefisien determinasi (R²) ≥ 0,95',null,18),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.9','Koefisien variasi (CV) dari 5 kali pengukuran ≤ 5%',null,19),
  (template_id_value,'3. Validasi Alat','IRI-VAL-3.10','Bounce test dilakukan sebelum dan sesudah pengukuran',null,20),
  (template_id_value,'4. GPS dan Pengukuran Jarak','IRI-GPS-4.1','GPS memiliki ketelitian ±1m pada 90% waktu',null,21),
  (template_id_value,'4. GPS dan Pengukuran Jarak','IRI-GPS-4.2','Odometer terkalibrasi',null,22),
  (template_id_value,'4. GPS dan Pengukuran Jarak','IRI-GPS-4.3','Ketelitian pengukuran jarak mencapai 0,1%',null,23),
  (template_id_value,'4. GPS dan Pengukuran Jarak','IRI-GPS-4.4','Pembacaan jarak berfungsi dengan baik',null,24),
  (template_id_value,'4. GPS dan Pengukuran Jarak','IRI-GPS-4.5','Integrasi GPS-odometer berfungsi dengan baik',null,25),
  (template_id_value,'5. Dokumentasi Kalibrasi','IRI-DOC-5.1','Laporan hasil kalibrasi tersedia dan lengkap',null,26),
  (template_id_value,'5. Dokumentasi Kalibrasi','IRI-DOC-5.2','Foto saat kalibrasi tersedia',null,27),
  (template_id_value,'5. Dokumentasi Kalibrasi','IRI-DOC-5.3','Berita acara kalibrasi tersedia',null,28),
  (template_id_value,'5. Dokumentasi Kalibrasi','IRI-DOC-5.4','Sertifikat kalibrasi dari lembaga yang berwenang tersedia',null,29),
  (template_id_value,'5. Dokumentasi Kalibrasi','IRI-DOC-5.5','Data mentah hasil kalibrasi tersedia',null,30);
end $$;

create or replace function app_private.baca_checklist_kalibrasi_iri(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor_id integer; pkg public.paket_kontrak; tpl public.checklist_template; filled public.checklist_pengisian; items jsonb; answer_map jsonb;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
  select u.pengguna_id into actor_id from public.pengguna u
    where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false);
  if actor_id is null then raise exception 'Identitas aktif diperlukan' using errcode='42501'; end if;
  select * into pkg from public.paket_kontrak p where p.paket_id=p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  if not exists(
    select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
    where pp.pengguna_id=actor_id and (
      (r.nama='penyedia_jasa' and pkg.created_by=actor_id and (pp.scope_paket_id is null or pp.scope_paket_id=p_paket_id)
        and (pp.scope_balai_id is null or pp.scope_balai_id=pkg.balai_id))
      or (r.nama='pic_balai' and pp.scope_balai_id=pkg.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id=p_paket_id))
    )
  ) then raise exception 'Akses ke paket ini ditolak' using errcode='42501'; end if;
  if not exists(select 1 from public.tim_survei t join public.jenis_survei s using(jenis_survei_id)
    where t.paket_id=p_paket_id and upper(s.kode)='IRI' and s.aktif is true) then
    raise exception 'Checklist IRI hanya berlaku jika paket memiliki tim survei IRI aktif' using errcode='55000';
  end if;
  select * into tpl from public.checklist_template t
    where t.no_dokumen='JM-KALIBRASI-TAHAP1-IRI' and t.revisi='CANDIDATE-IRI-CAL-01'
      and t.source_sha256='ab68855c227ec7ea681fcf3ff03a0b75157b14761e63a13d48bd08a5f8fd550d'
      and t.approval_state='INTERNAL_PROJECT_DRAFT' and t.jenis_survei_id=(select jenis_survei_id from public.jenis_survei where upper(kode)='IRI' and aktif is true);
  if not found then raise exception 'Internal IRI candidate template unavailable' using errcode='55000'; end if;
  select * into filled from public.checklist_pengisian q where q.paket_id=p_paket_id and q.template_id=tpl.template_id;
  if filled.pengisian_id is not null and filled.status is distinct from 'DRAFT' then
    raise exception 'Checklist IRI bukan draf; baca melalui kontrak alur yang berwenang' using errcode='55000';
  end if;
  if (select count(*) from public.checklist_item i where i.template_id=tpl.template_id)<>30 then
    raise exception 'Template IRI tidak memiliki tepat 30 item kandidat' using errcode='55000';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('key',i.kode,'section',i.bagian,'label',i.uraian,'number',substring(i.kode from '[0-9]+\.[0-9]+$'),
      'options',jsonb_build_array('Ya','Tidak'),'answerType','choice','mandatory',null,'applicability',jsonb_build_array('IRI')) order by i.urutan),'[]'::jsonb)
    into items from public.checklist_item i where i.template_id=tpl.template_id;
  select coalesce(jsonb_object_agg(i.kode,jsonb_build_object('value',j.jawaban,'note',j.keterangan)),'{}'::jsonb)
    into answer_map from public.checklist_item i join public.checklist_jawaban j on j.item_id=i.item_id and j.pengisian_id=filled.pengisian_id
    where i.template_id=tpl.template_id;
  return jsonb_build_object('paket_id',p_paket_id,'survey','IRI',
    'template',jsonb_build_object('template_id',tpl.template_id,'documentId','bd492d0bf8d7f96d','candidateRevision',tpl.revisi,
      'officialRevision',null,'sourceHash',tpl.source_sha256,'approvalState',tpl.approval_state),
    'filling',jsonb_build_object('pengisian_id',filled.pengisian_id,'version',coalesce(filled.versi,0),'answer_status','DRAFT','updated_at',filled.updated_at),
    'items',items,'answers',answer_map);
end $$;

create or replace function app_private.simpan_checklist_kalibrasi_iri(p_paket_id integer,p_template_id integer,p_expected_version integer,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; pkg public.paket_kontrak; tpl public.checklist_template; filled public.checklist_pengisian; entry jsonb; prop text; old_state jsonb; new_state jsonb; item public.checklist_item;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
  actor_id:=app_private.assert_tahap_kalibrasi(p_paket_id);
  select * into pkg from public.paket_kontrak p where p.paket_id=p_paket_id for update;
  if not found or pkg.created_by is distinct from actor_id then raise exception 'Akses Provider ke paket ini ditolak' using errcode='42501'; end if;
  if not exists(select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
    where pp.pengguna_id=actor_id and r.nama='penyedia_jasa' and (pp.scope_paket_id is null or pp.scope_paket_id=p_paket_id)
      and (pp.scope_balai_id is null or pp.scope_balai_id=pkg.balai_id)) then
    raise exception 'Peran Provider tidak memiliki scope paket ini' using errcode='42501'; end if;
  if not exists(select 1 from public.tim_survei t join public.jenis_survei s using(jenis_survei_id)
    where t.paket_id=p_paket_id and upper(s.kode)='IRI' and s.aktif is true) then
    raise exception 'Checklist IRI hanya berlaku jika paket memiliki tim survei IRI aktif' using errcode='55000'; end if;
  select * into tpl from public.checklist_template t where t.template_id=p_template_id
    and t.no_dokumen='JM-KALIBRASI-TAHAP1-IRI' and t.revisi='CANDIDATE-IRI-CAL-01'
    and t.source_sha256='ab68855c227ec7ea681fcf3ff03a0b75157b14761e63a13d48bd08a5f8fd550d'
    and t.approval_state='INTERNAL_PROJECT_DRAFT'
    and t.jenis_survei_id=(select jenis_survei_id from public.jenis_survei where upper(kode)='IRI' and aktif is true);
  if not found then raise exception 'Template IRI tidak dikenal atau tidak berlaku' using errcode='22023'; end if;
  if p_expected_version is null or p_expected_version not between 0 and 2147483646 or p_answers is null
    or jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers) not between 1 and 30 then
    raise exception 'Versi atau jawaban draf tidak valid' using errcode='22023'; end if;
  for entry in select value from jsonb_array_elements(p_answers) loop
    if jsonb_typeof(entry)<>'object' then raise exception 'Jawaban harus berupa object' using errcode='22023'; end if;
    for prop in select jsonb_object_keys(entry) loop
      if prop not in ('key','value','note') then raise exception 'Kolom jawaban tidak dibenarkan' using errcode='22023'; end if;
    end loop;
    if not(entry ? 'key') or jsonb_typeof(entry->'key')<>'string' or not(entry ? 'value') then
      raise exception 'Key dan value jawaban diperlukan' using errcode='22023'; end if;
    select * into item from public.checklist_item i where i.template_id=tpl.template_id and i.kode=entry->>'key';
    if not found then raise exception 'Item bukan milik template IRI ini' using errcode='22023'; end if;
    if entry->'value'<>'null'::jsonb and (jsonb_typeof(entry->'value')<>'string' or entry->>'value' not in ('Ya','Tidak')) then
      raise exception 'Jawaban mesti Ya, Tidak atau null' using errcode='22023'; end if;
    if entry ? 'note' and entry->'note'<>'null'::jsonb and (jsonb_typeof(entry->'note')<>'string' or length(btrim(entry->>'note'))>2000) then
      raise exception 'Catatan maksimum 2000 aksara' using errcode='22023'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(p_answers) e group by e->>'key' having count(*)>1) then
    raise exception 'Item berulang dalam permintaan' using errcode='22023'; end if;
  select * into filled from public.checklist_pengisian q where q.paket_id=p_paket_id and q.template_id=tpl.template_id for update;
  if found then
    if filled.status is distinct from 'DRAFT' then raise exception 'Hanya draf checklist yang dapat diubah' using errcode='55000'; end if;
    if filled.versi<>p_expected_version then raise exception 'Versi draf checklist berubah' using errcode='40001'; end if;
  elsif p_expected_version<>0 then raise exception 'Versi draf checklist berubah' using errcode='40001'; end if;
  old_state:=app_private.baca_checklist_kalibrasi_iri(p_paket_id);
  if filled.pengisian_id is null then
    insert into public.checklist_pengisian(paket_id,template_id,konteks,konteks_id,tanggal,diisi_oleh,status,persen_lengkap)
      values(p_paket_id,tpl.template_id,'PAKET',p_paket_id,current_date,actor_id,'DRAFT',null) returning * into filled;
  end if;
  for entry in select value from jsonb_array_elements(p_answers) loop
    select * into item from public.checklist_item i where i.template_id=tpl.template_id and i.kode=entry->>'key';
    insert into public.checklist_jawaban(pengisian_id,item_id,jawaban,keterangan,bukti_dokumen_id)
      values(filled.pengisian_id,item.item_id,entry->>'value',case when entry ? 'note' then nullif(btrim(entry->>'note'),'') else null end,null)
      on conflict(pengisian_id,item_id) do update set jawaban=excluded.jawaban,
        keterangan=case when entry ? 'note' then excluded.keterangan else checklist_jawaban.keterangan end;
  end loop;
  update public.checklist_pengisian set versi=versi+1,updated_at=clock_timestamp()
    where pengisian_id=filled.pengisian_id returning * into filled;
  new_state:=app_private.baca_checklist_kalibrasi_iri(p_paket_id);
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
    values(actor_id,'checklist_pengisian',filled.pengisian_id::text,'SAVE_STAGE1_IRI_DRAFT',old_state,new_state,localtimestamp);
  return new_state;
end $$;

create or replace function public.baca_checklist_kalibrasi_iri(p_paket_id integer)
returns jsonb language sql security invoker set search_path='' as $$ select app_private.baca_checklist_kalibrasi_iri(p_paket_id); $$;
create or replace function public.simpan_checklist_kalibrasi_iri(p_paket_id integer,p_template_id integer,p_expected_version integer,p_answers jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select app_private.simpan_checklist_kalibrasi_iri(p_paket_id,p_template_id,p_expected_version,p_answers); $$;

revoke all on function app_private.baca_checklist_kalibrasi_iri(integer) from public,anon;
revoke all on function app_private.simpan_checklist_kalibrasi_iri(integer,integer,integer,jsonb) from public,anon;
revoke all on function public.baca_checklist_kalibrasi_iri(integer) from public,anon;
revoke all on function public.simpan_checklist_kalibrasi_iri(integer,integer,integer,jsonb) from public,anon;
grant execute on function app_private.baca_checklist_kalibrasi_iri(integer) to authenticated;
grant execute on function app_private.simpan_checklist_kalibrasi_iri(integer,integer,integer,jsonb) to authenticated;
grant execute on function public.baca_checklist_kalibrasi_iri(integer) to authenticated;
grant execute on function public.simpan_checklist_kalibrasi_iri(integer,integer,integer,jsonb) to authenticated;

commit;
