-- Tahap 4 (upload & pengajuan), Tahap 5 (audit berjenjang), Tahap 6 (penerimaan & termin).
-- Rules approved by the project owner on 2026-11-24 (see docs/WORKFLOW_COMPLETION_STATUS.md §8):
--  1 audit samples are entered manually by the auditor; targets shown (PIC <= 5%, Direktorat >= 1%)
--  2 Audit tingkat 1 (Penyedia): internal checklist + BA Audit Internal, no sampling
--  3 Audit tingkat 2/3 rejection auto-opens a Koreksi case (blocked_stage 'Audit tingkat N')
--  4 Termin T1-T4 (30/30/20/20) per package; PIC records BA Penerimaan; final acceptance needs Audit 3 Lulus
--  5 Upload to SMD Jalan/INVI-J/InSlope/InDrain is recorded manually (no API integration yet)
-- Errors: 42501 access, P0002 not found, PT409 stale version, 55000 bad transition, 22023 bad input.

-- ---------- reference data ----------
insert into public.sistem_tujuan(nama)
select v.nama from (values ('SMD Jalan'), ('INVI-J'), ('InSlope'), ('InDrain')) as v(nama)
where not exists (select 1 from public.sistem_tujuan s where s.nama = v.nama);

insert into public.aturan_sampling_audit(jenis_survei_id, tingkat_audit, persen_sampel, basis, arah)
select null, v.tingkat, v.persen, 'panjang', v.arah
from (values (2, 5.0, 'maksimum'), (3, 1.0, 'minimum')) as v(tingkat, persen, arah)
where not exists (select 1 from public.aturan_sampling_audit a where a.tingkat_audit = v.tingkat and a.jenis_survei_id is null);

-- ---------- schema additions ----------
create table if not exists public.tahap4_pengajuan (
  paket_id integer primary key references public.paket_kontrak(paket_id),
  versi integer not null default 0 check (versi >= 0),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'DIAJUKAN', 'PERLU_REVISI', 'DISETUJUI')),
  catatan text,
  diajukan_oleh integer references public.pengguna(pengguna_id),
  diajukan_pada timestamptz,
  direview_oleh integer references public.pengguna(pengguna_id),
  direview_pada timestamptz
);
alter table public.tahap4_pengajuan enable row level security;
revoke all on public.tahap4_pengajuan from public, anon, authenticated;

alter table public.audit
  add column if not exists versi integer not null default 0 check (versi >= 0),
  add column if not exists detail jsonb not null default '{}'::jsonb;
create unique index if not exists audit_paket_tingkat_uq on public.audit(paket_id, tingkat) where jenis_survei_id is null;
alter table public.termin add column if not exists versi integer not null default 0 check (versi >= 0);
create unique index if not exists termin_paket_nomor_uq on public.termin(paket_id, nomor);

create index if not exists upload_sistem_paket_idx on public.upload_sistem(paket_id, jenis_survei_id, upload_id desc);
create index if not exists upload_pesan_validasi_upload_idx on public.upload_pesan_validasi(upload_id);
create index if not exists sampel_audit_audit_idx on public.sampel_audit(audit_id);
create index if not exists berita_acara_paket_idx on public.berita_acara(paket_id);
create index if not exists penerimaan_data_paket_idx on public.penerimaan_data(paket_id);

-- ---------- shared helpers ----------
-- Read access: package creator (Penyedia), PIC scoped to the Balai/package, Direktorat, Admin.
create or replace function app_private.tahap_akses_baca(p_paket_id integer)
returns void language plpgsql stable security definer set search_path = ''
as $function$
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.paket_kontrak p
    join public.pengguna u on u.auth_user_id = auth.uid() and not coalesce(u.terkunci, false)
    join public.pengguna_peran pp on pp.pengguna_id = u.pengguna_id
    join public.peran r on r.peran_id = pp.peran_id
    where p.paket_id = p_paket_id and (
      (r.nama = 'penyedia_jasa' and p.created_by = u.pengguna_id) or r.nama in ('direktorat', 'admin')
      or (r.nama = 'pic_balai' and pp.scope_balai_id = p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id = p.paket_id)))
  ) then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002'; end if;
end;
$function$;

-- Opens a Koreksi case on behalf of the system when an audit is rejected (rule 3).
create or replace function app_private.koreksi_buka_otomatis(p_paket_id integer, p_tahap text, p_alasan text, p_actor integer)
returns integer language plpgsql security definer set search_path = ''
as $function$
declare v_kasus integer; v_koreksi integer; d jsonb;
begin
  d := jsonb_build_object('source', p_tahap || ' ditolak', 'blocked_stage', p_tahap, 'road', 'Sesuai sampel audit', 'stationing', '',
    'rejection_reason', p_alasan, 'severity', 'Mayor', 'owner', 'Penyedia Jasa', 'due_date', to_char(current_date + 14, 'YYYY-MM-DD'),
    'survey_type', 'IRI', 'approval', 'Draft', 'retest', 'Belum Diuji', 'verification_surveyor', false,
    'verification_team_leader', false, 'verification_balai', false, 'review_note', null, 'execution_reference', null, 'retest_reference', null);
  insert into public.kasus_temuan(paket_id, sumber_tipe, tahap_tertahan, tingkat, uraian, tenggat, status, detail, dibuat_oleh)
  values (p_paket_id, p_tahap || ' ditolak', p_tahap, 'Mayor', p_alasan, current_date + 14, 'Terbuka', d, p_actor)
  returning kasus_id into v_kasus;
  insert into public.koreksi_data(kasus_id, status, versi) values (v_kasus, 'Draft', 1) returning koreksi_id into v_koreksi;
  insert into public.tindakan_perbaikan(kasus_id, diusulkan_oleh, status_persetujuan) values (v_kasus, p_actor, 'Draft');
  insert into public.riwayat_status_kasus(kasus_id, status_lama, status_baru, oleh, waktu) values (v_kasus, null, 'Terbuka', p_actor, localtimestamp);
  return v_koreksi;
end;
$function$;

-- ---------- 4a: upload & Tahap 4 submission ----------
create or replace function app_private.tahap4_blockers(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare b jsonb := '[]'::jsonb;
begin
  if not exists (select 1 from public.lokasi_pekerjaan lp where lp.paket_id = p_paket_id and lp.ruas_id is not null) then
    b := b || jsonb_build_array(jsonb_build_object('code', 'PACKAGE_ROADS_UNDEFINED', 'message', 'Ruas wajib paket belum terdaftar.'));
  end if;
  if exists (select 1 from (select distinct ruas_id from public.lokasi_pekerjaan where paket_id = p_paket_id and ruas_id is not null) r
    where not exists (select 1 from public.validasi_lrs v where v.paket_id = p_paket_id and v.ruas_id = r.ruas_id)) then
    b := b || jsonb_build_array(jsonb_build_object('code', 'MISSING_LRS_FOR_REQUIRED_ROAD', 'message', 'Ada ruas wajib yang belum memiliki validasi LRS.'));
  end if;
  if exists (select 1 from public.validasi_lrs v where v.paket_id = p_paket_id and (v.panjang_lapangan_m is null or v.panjang_acuan_m is null)) then
    b := b || jsonb_build_array(jsonb_build_object('code', 'LENGTH_INCOMPLETE', 'message', 'Panjang lapangan/acuan belum lengkap.'));
  end if;
  if exists (select 1 from public.validasi_lrs v where v.paket_id = p_paket_id and abs(v.panjang_lapangan_m - v.panjang_acuan_m) > 30) then
    b := b || jsonb_build_array(jsonb_build_object('code', 'REMEASUREMENT_REQUIRED', 'message', 'Selisih panjang lebih 30 m: ukur ulang sebelum diajukan.'));
  end if;
  if exists (select 1 from public.validasi_lrs v where v.paket_id = p_paket_id and (coalesce(v.jumlah_error_topologi, 1) > 0
    or not coalesce(v.format_sesuai_glossary, false) or not coalesce(v.sta_konsisten_iri_pci_ldt, false))) then
    b := b || jsonb_build_array(jsonb_build_object('code', 'LRS_CRITERIA_FAILED', 'message', 'Kriteria LRS belum terpenuhi (topologi nol, format glossary, STA konsisten).'));
  end if;
  if exists (select 1 from public.paket_survei_kontrak ps where ps.paket_id = p_paket_id and coalesce((
      select u.status from public.upload_sistem u where u.paket_id = p_paket_id and u.jenis_survei_id = ps.jenis_survei_id
      order by u.upload_id desc limit 1), '') <> 'VALID') then
    b := b || jsonb_build_array(jsonb_build_object('code', 'UPLOAD_NOT_VALID', 'message', 'Ada jenis survei yang upload terakhirnya belum berstatus VALID.'));
  end if;
  return b;
end;
$function$;

create or replace function public.baca_status_validasi_lrs(p_paket_id integer)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare w public.tahap4_pengajuan; v_blockers jsonb;
begin
  perform app_private.assert_validasi_lrs_access(p_paket_id, false);
  select * into w from public.tahap4_pengajuan where paket_id = p_paket_id;
  v_blockers := app_private.tahap4_blockers(p_paket_id);
  return jsonb_build_object('paket_id', p_paket_id, 'state', coalesce(w.status, 'DRAFT'), 'workflow_version', coalesce(w.versi, 0),
    'catatan', coalesce(w.catatan, ''), 'submission_workflow_id', null,
    'gate', case when jsonb_array_length(v_blockers) = 0 then 'PASS' else 'FAIL' end,
    'progression_allowed', coalesce(w.status, 'DRAFT') = 'DISETUJUI',
    'blockers', v_blockers, 'validations', coalesce(public.baca_validasi_lrs(p_paket_id), '[]'::jsonb));
end;
$function$;

create or replace function public.ajukan_validasi_lrs(p_paket_id integer, p_expected_version integer)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; w public.tahap4_pengajuan;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh mengajukan Tahap 4' using errcode = '42501'; end if;
  insert into public.tahap4_pengajuan(paket_id) values (p_paket_id) on conflict (paket_id) do nothing;
  select * into w from public.tahap4_pengajuan where paket_id = p_paket_id for update;
  if w.versi <> p_expected_version then raise exception 'Pengajuan Tahap 4 telah berubah. Muat ulang' using errcode = 'PT409'; end if;
  if w.status not in ('DRAFT', 'PERLU_REVISI') then raise exception 'Tahap 4 tidak dapat diajukan pada status ini' using errcode = '55000'; end if;
  if jsonb_array_length(app_private.tahap4_blockers(p_paket_id)) > 0 then
    raise exception 'Masih ada syarat Tahap 4 yang belum terpenuhi' using errcode = '55000';
  end if;
  update public.tahap4_pengajuan set status = 'DIAJUKAN', versi = versi + 1, catatan = null,
    diajukan_oleh = (a->>'pengguna_id')::integer, diajukan_pada = now() where paket_id = p_paket_id;
  return public.baca_status_validasi_lrs(p_paket_id);
end;
$function$;

create or replace function public.review_validasi_lrs(p_paket_id integer, p_expected_version integer, p_keputusan text, p_catatan text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; w public.tahap4_pengajuan;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'pic')::boolean then raise exception 'Hanya PIC Balai boleh meninjau Tahap 4' using errcode = '42501'; end if;
  if p_keputusan not in ('DISETUJUI', 'PERLU_REVISI') or (p_keputusan = 'PERLU_REVISI' and btrim(coalesce(p_catatan, '')) = '') then
    raise exception 'Keputusan atau catatan tidak sah' using errcode = '22023';
  end if;
  select * into w from public.tahap4_pengajuan where paket_id = p_paket_id for update;
  if not found or w.versi <> p_expected_version then raise exception 'Pengajuan Tahap 4 telah berubah. Muat ulang' using errcode = 'PT409'; end if;
  if w.status <> 'DIAJUKAN' then raise exception 'Tahap 4 belum diajukan' using errcode = '55000'; end if;
  update public.tahap4_pengajuan set status = p_keputusan, versi = versi + 1, catatan = nullif(btrim(coalesce(p_catatan, '')), ''),
    direview_oleh = (a->>'pengguna_id')::integer, direview_pada = now() where paket_id = p_paket_id;
  return public.baca_status_validasi_lrs(p_paket_id);
end;
$function$;

create or replace function public.daftar_upload_sistem(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
begin
  perform app_private.tahap_akses_baca(p_paket_id);
  return jsonb_build_object(
    'sistem', coalesce((select jsonb_agg(to_jsonb(s) order by s.sistem_id) from public.sistem_tujuan s), '[]'::jsonb),
    'jenis_survei', coalesce((select jsonb_agg(jsonb_build_object('jenis_survei_id', j.jenis_survei_id, 'nama', j.nama) order by j.jenis_survei_id)
      from public.paket_survei_kontrak ps join public.jenis_survei j using (jenis_survei_id) where ps.paket_id = p_paket_id), '[]'::jsonb),
    'upload', coalesce((select jsonb_agg(to_jsonb(u) || jsonb_build_object('pesan', coalesce((select jsonb_agg(to_jsonb(m) order by m.pesan_id)
      from public.upload_pesan_validasi m where m.upload_id = u.upload_id), '[]'::jsonb)) order by u.upload_id desc)
      from public.upload_sistem u where u.paket_id = p_paket_id), '[]'::jsonb));
end;
$function$;

create or replace function public.catat_upload_sistem(p_paket_id integer, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_upload integer; v_status text := upper(coalesce(p_data->>'status', ''));
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh mencatat upload' using errcode = '42501'; end if;
  if v_status not in ('VALID', 'ERROR') then raise exception 'Status upload harus VALID atau ERROR' using errcode = '22023'; end if;
  if not exists (select 1 from public.paket_survei_kontrak where paket_id = p_paket_id and jenis_survei_id = (p_data->>'jenis_survei_id')::integer) then
    raise exception 'Jenis survei tidak termasuk lingkup paket' using errcode = '22023';
  end if;
  if not exists (select 1 from public.sistem_tujuan where sistem_id = (p_data->>'sistem_id')::integer) then
    raise exception 'Sistem tujuan tidak dikenal' using errcode = '22023';
  end if;
  if exists (select 1 from public.tahap4_pengajuan where paket_id = p_paket_id and status in ('DIAJUKAN', 'DISETUJUI')) then
    raise exception 'Upload dikunci karena Tahap 4 sedang ditinjau atau sudah disetujui' using errcode = '55000';
  end if;
  insert into public.upload_sistem(paket_id, jenis_survei_id, sistem_id, semester, waktu_upload, jumlah_record, status, diunggah_oleh)
  values (p_paket_id, (p_data->>'jenis_survei_id')::integer, (p_data->>'sistem_id')::integer, coalesce((p_data->>'semester')::integer, 1),
    localtimestamp, nullif(p_data->>'jumlah_record', '')::integer, v_status, (a->>'pengguna_id')::integer)
  returning upload_id into v_upload;
  insert into public.upload_pesan_validasi(upload_id, sta, kode_error, pesan, selesai)
  select v_upload, nullif(m->>'sta', '')::numeric, m->>'kode_error', m->>'pesan', false
  from jsonb_array_elements(coalesce(p_data->'pesan', '[]'::jsonb)) m where coalesce(m->>'pesan', '') <> '';
  return public.daftar_upload_sistem(p_paket_id);
end;
$function$;

-- ---------- 4b: audit berjenjang ----------
create or replace function app_private.audit_pastikan(p_paket_id integer)
returns void language plpgsql security definer set search_path = ''
as $function$
begin
  insert into public.audit(paket_id, tingkat, sampling_id, persen_sampel_rencana, status, versi, detail)
  select p_paket_id, t.tingkat, a.sampling_id, a.persen_sampel, 'Belum Dimulai', 0, '{}'::jsonb
  from (values (1), (2), (3)) as t(tingkat)
  left join public.aturan_sampling_audit a on a.tingkat_audit = t.tingkat and a.jenis_survei_id is null
  where not exists (select 1 from public.audit x where x.paket_id = p_paket_id and x.tingkat = t.tingkat and x.jenis_survei_id is null);
end;
$function$;

create or replace function public.baca_audit(p_paket_id integer)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
begin
  perform app_private.tahap_akses_baca(p_paket_id);
  perform app_private.audit_pastikan(p_paket_id);
  return jsonb_build_object(
    'paket_id', p_paket_id,
    'tahap4_disetujui', exists (select 1 from public.tahap4_pengajuan w where w.paket_id = p_paket_id and w.status = 'DISETUJUI'),
    'tingkat', (select jsonb_agg(to_jsonb(a) || jsonb_build_object(
        'sampel', coalesce((select jsonb_agg(to_jsonb(s) order by s.sampel_id) from public.sampel_audit s where s.audit_id = a.audit_id), '[]'::jsonb),
        'koreksi_terbuka', (select count(*) from public.kasus_temuan k where k.paket_id = p_paket_id
          and k.tahap_tertahan = 'Audit tingkat ' || a.tingkat and k.status <> 'Ditutup'))
      order by a.tingkat) from public.audit a where a.paket_id = p_paket_id and a.jenis_survei_id is null));
end;
$function$;

create or replace function app_private.audit_pemilik(p_tingkat integer, a jsonb)
returns boolean language sql immutable set search_path = ''
as $function$
  select case p_tingkat when 1 then (a->>'penyedia')::boolean when 2 then (a->>'pic')::boolean when 3 then (a->>'direktorat')::boolean else false end;
$function$;

-- Owner saves checklist / BA / note (and samples for level 2-3); starts or restarts the review.
create or replace function public.simpan_audit(p_paket_id integer, p_tingkat integer, p_expected_version integer, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; r public.audit; v_prev text;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not app_private.audit_pemilik(p_tingkat, a) then raise exception 'Audit tingkat ini bukan kewenangan peran Anda' using errcode = '42501'; end if;
  perform app_private.audit_pastikan(p_paket_id);
  select * into r from public.audit where paket_id = p_paket_id and tingkat = p_tingkat and jenis_survei_id is null for update;
  if r.versi <> p_expected_version then raise exception 'Audit telah berubah. Muat ulang' using errcode = 'PT409'; end if;
  if r.status = 'Lulus' then raise exception 'Audit yang sudah Lulus tidak dapat diubah' using errcode = '55000'; end if;
  if p_tingkat = 1 then
    if not exists (select 1 from public.tahap4_pengajuan w where w.paket_id = p_paket_id and w.status = 'DISETUJUI') then
      raise exception 'Audit tingkat 1 dimulai setelah Tahap 4 disetujui' using errcode = '55000';
    end if;
  else
    select status into v_prev from public.audit where paket_id = p_paket_id and tingkat = p_tingkat - 1 and jenis_survei_id is null;
    if v_prev is distinct from 'Lulus' then raise exception 'Audit tingkat sebelumnya belum Lulus' using errcode = '55000'; end if;
  end if;
  if exists (select 1 from public.kasus_temuan k where k.paket_id = p_paket_id and k.tahap_tertahan = 'Audit tingkat ' || p_tingkat and k.status <> 'Ditutup') then
    raise exception 'Tutup kasus koreksi audit ini sebelum audit diulang' using errcode = '55000';
  end if;
  update public.audit set status = 'Dalam Review', versi = versi + 1, tanggal = current_date, auditor_id = (a->>'pengguna_id')::integer,
    persen_sampel_realisasi = case when p_tingkat = 1 then 100 else nullif(p_data->>'persen_sampel_realisasi', '')::numeric end,
    alasan_penolakan = null,
    detail = detail || jsonb_strip_nulls(jsonb_build_object('checklist', p_data->'checklist', 'ba_number', p_data->>'ba_number', 'catatan', p_data->>'catatan'))
  where audit_id = r.audit_id;
  if p_tingkat > 1 and p_data ? 'sampel' then
    delete from public.sampel_audit where audit_id = r.audit_id;
    insert into public.sampel_audit(audit_id, sta_awal, sta_akhir, nilai_asli, nilai_verifikasi, selisih_persen, status)
    select r.audit_id, (s->>'sta_awal')::numeric, (s->>'sta_akhir')::numeric, (s->>'nilai_asli')::numeric, (s->>'nilai_verifikasi')::numeric,
      case when coalesce((s->>'nilai_asli')::numeric, 0) = 0 then null
        else round(abs((s->>'nilai_verifikasi')::numeric - (s->>'nilai_asli')::numeric) * 100 / abs((s->>'nilai_asli')::numeric), 2) end,
      coalesce(s->>'status', 'Sesuai')
    from jsonb_array_elements(p_data->'sampel') s;
  end if;
  return public.baca_audit(p_paket_id);
end;
$function$;

create or replace function public.putuskan_audit(p_paket_id integer, p_tingkat integer, p_expected_version integer, p_keputusan text, p_catatan text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; r public.audit;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not app_private.audit_pemilik(p_tingkat, a) then raise exception 'Audit tingkat ini bukan kewenangan peran Anda' using errcode = '42501'; end if;
  if p_keputusan not in ('Lulus', 'Ditolak') or (p_keputusan = 'Ditolak' and btrim(coalesce(p_catatan, '')) = '') then
    raise exception 'Keputusan atau alasan tidak sah' using errcode = '22023';
  end if;
  select * into r from public.audit where paket_id = p_paket_id and tingkat = p_tingkat and jenis_survei_id is null for update;
  if not found or r.versi <> p_expected_version then raise exception 'Audit telah berubah. Muat ulang' using errcode = 'PT409'; end if;
  if r.status <> 'Dalam Review' then raise exception 'Simpan pemeriksaan audit terlebih dahulu' using errcode = '55000'; end if;
  if p_keputusan = 'Lulus' then
    if coalesce(r.detail->>'ba_number', '') = '' then raise exception 'Nomor BA audit wajib diisi' using errcode = '55000'; end if;
    if p_tingkat = 1 and exists (select 1 from jsonb_each(coalesce(r.detail->'checklist', '{}'::jsonb)) c where c.value <> 'true'::jsonb) then
      raise exception 'Checklist audit internal belum lengkap' using errcode = '55000';
    end if;
    if p_tingkat > 1 and not exists (select 1 from public.sampel_audit s where s.audit_id = r.audit_id) then
      raise exception 'Catat sampel audit terlebih dahulu' using errcode = '55000';
    end if;
    if p_tingkat = 2 and coalesce(r.persen_sampel_realisasi, 0) > 5 then raise exception 'Sampel Pengguna Jasa maksimum 5%%' using errcode = '55000'; end if;
    if p_tingkat = 3 and coalesce(r.persen_sampel_realisasi, 0) < 1 then raise exception 'Sampel Direktorat minimum 1%%' using errcode = '55000'; end if;
    update public.audit set status = 'Lulus', versi = versi + 1, detail = detail || jsonb_build_object('catatan_keputusan', nullif(btrim(coalesce(p_catatan, '')), ''))
    where audit_id = r.audit_id;
    insert into public.berita_acara(paket_id, jenis, nomor, tanggal, sumber_tipe, sumber_id, status)
    values (p_paket_id, case p_tingkat when 1 then 'AUDIT_INTERNAL' when 2 then 'VERVAL_PENGGUNA_JASA' else 'VERVAL_DIREKTORAT' end,
      r.detail->>'ba_number', current_date, 'AUDIT', r.audit_id, 'SAH');
  else
    update public.audit set status = 'Ditolak', versi = versi + 1, alasan_penolakan = btrim(p_catatan) where audit_id = r.audit_id;
    if p_tingkat > 1 then
      perform app_private.koreksi_buka_otomatis(p_paket_id, 'Audit tingkat ' || p_tingkat, btrim(p_catatan), (a->>'pengguna_id')::integer);
    end if;
  end if;
  return public.baca_audit(p_paket_id);
end;
$function$;

-- ---------- 4c: termin & penerimaan ----------
create or replace function app_private.termin_pastikan(p_paket_id integer)
returns void language plpgsql security definer set search_path = ''
as $function$
declare v_tahun integer;
begin
  select coalesce(tahun_anggaran, extract(year from current_date)::integer) into v_tahun from public.paket_kontrak where paket_id = p_paket_id;
  insert into public.termin(paket_id, nomor, persen_bobot, batas_waktu, output_wajib, status, versi)
  select p_paket_id, t.nomor, t.bobot, make_date(v_tahun, t.bulan, t.hari), t.output_wajib, 'Belum', 0
  from (values
    (1, 30.0, 2, 28, 'Mobilisasi, kalibrasi & validasi, survei pendahuluan, Laporan Pendahuluan, Laporan SMKK'),
    (2, 30.0, 5, 21, 'Pengumpulan & pengolahan data Semester I, BA Hasil Validasi Semester I'),
    (3, 20.0, 6, 14, 'Upload s.d. VALID, Laporan Hasil Survei Semester I, BA Verval Direktorat & Pengguna Jasa'),
    (4, 20.0, 11, 28, 'IRI Semester II, BA Validasi IRI Semester II, Laporan Akhir')
  ) as t(nomor, bobot, bulan, hari, output_wajib)
  where not exists (select 1 from public.termin x where x.paket_id = p_paket_id and x.nomor = t.nomor);
end;
$function$;

create or replace function public.baca_penerimaan(p_paket_id integer)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
begin
  perform app_private.tahap_akses_baca(p_paket_id);
  perform app_private.termin_pastikan(p_paket_id);
  return jsonb_build_object(
    'paket_id', p_paket_id,
    'audit3_lulus', exists (select 1 from public.audit a where a.paket_id = p_paket_id and a.tingkat = 3 and a.jenis_survei_id is null and a.status = 'Lulus'),
    'termin', (select jsonb_agg(to_jsonb(t) order by t.nomor) from public.termin t where t.paket_id = p_paket_id),
    'penerimaan', coalesce((select jsonb_agg(to_jsonb(pd) || jsonb_build_object('ba', to_jsonb(b)) order by pd.penerimaan_id)
      from public.penerimaan_data pd left join public.berita_acara b on b.ba_id = pd.ba_id where pd.paket_id = p_paket_id), '[]'::jsonb),
    'berita_acara', coalesce((select jsonb_agg(to_jsonb(b) order by b.ba_id) from public.berita_acara b where b.paket_id = p_paket_id), '[]'::jsonb));
end;
$function$;

create or replace function public.catat_penerimaan(p_paket_id integer, p_termin integer, p_expected_version integer, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; t public.termin; v_ba integer; v_jenis text := upper(coalesce(p_data->>'jenis', 'PARSIAL'));
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'pic')::boolean then raise exception 'Hanya PIC Balai boleh mencatat penerimaan' using errcode = '42501'; end if;
  if v_jenis not in ('PARSIAL', 'AKHIR') or btrim(coalesce(p_data->>'nomor_ba', '')) = '' then
    raise exception 'Jenis penerimaan atau nomor BA tidak sah' using errcode = '22023';
  end if;
  perform app_private.termin_pastikan(p_paket_id);
  select * into t from public.termin where paket_id = p_paket_id and nomor = p_termin for update;
  if not found then raise exception 'Termin tidak ditemukan' using errcode = 'P0002'; end if;
  if t.versi <> p_expected_version then raise exception 'Termin telah berubah. Muat ulang' using errcode = 'PT409'; end if;
  if t.status = 'Selesai' then raise exception 'Termin sudah diterima' using errcode = '55000'; end if;
  if exists (select 1 from public.termin x where x.paket_id = p_paket_id and x.nomor < p_termin and x.status <> 'Selesai') then
    raise exception 'Termin sebelumnya belum diterima' using errcode = '55000';
  end if;
  if (p_termin >= 3 or v_jenis = 'AKHIR') and not exists (select 1 from public.audit x where x.paket_id = p_paket_id and x.tingkat = 3
      and x.jenis_survei_id is null and x.status = 'Lulus') then
    raise exception 'Penerimaan termin 3-4 dan penerimaan akhir memerlukan Audit tingkat 3 Lulus' using errcode = '55000';
  end if;
  if v_jenis = 'AKHIR' and p_termin <> 4 then raise exception 'Penerimaan akhir dicatat pada termin 4' using errcode = '22023'; end if;
  insert into public.berita_acara(paket_id, jenis, nomor, tanggal, sumber_tipe, sumber_id, status)
  values (p_paket_id, 'PENERIMAAN_' || v_jenis, btrim(p_data->>'nomor_ba'), coalesce(nullif(p_data->>'tanggal', '')::date, current_date), 'TERMIN', t.termin_id, 'SAH')
  returning ba_id into v_ba;
  insert into public.penandatangan_ba(ba_id, pengguna_id, jabatan, waktu_ttd) values (v_ba, (a->>'pengguna_id')::integer, 'PIC Balai', localtimestamp);
  insert into public.penerimaan_data(paket_id, termin_id, ba_id, jenis, volume_diterima, tanggal)
  values (p_paket_id, t.termin_id, v_ba, v_jenis, nullif(p_data->>'volume_diterima', '')::numeric, coalesce(nullif(p_data->>'tanggal', '')::date, current_date));
  update public.termin set status = 'Selesai', versi = versi + 1 where termin_id = t.termin_id;
  return public.baca_penerimaan(p_paket_id);
end;
$function$;

-- ---------- grants ----------
revoke all on function app_private.tahap_akses_baca(integer) from public, anon, authenticated;
revoke all on function app_private.koreksi_buka_otomatis(integer, text, text, integer) from public, anon, authenticated;
revoke all on function app_private.tahap4_blockers(integer) from public, anon, authenticated;
revoke all on function app_private.audit_pastikan(integer) from public, anon, authenticated;
revoke all on function app_private.audit_pemilik(integer, jsonb) from public, anon, authenticated;
revoke all on function app_private.termin_pastikan(integer) from public, anon, authenticated;
revoke all on function public.ajukan_validasi_lrs(integer, integer) from public, anon;
revoke all on function public.review_validasi_lrs(integer, integer, text, text) from public, anon;
revoke all on function public.daftar_upload_sistem(integer) from public, anon;
revoke all on function public.catat_upload_sistem(integer, jsonb) from public, anon;
revoke all on function public.baca_audit(integer) from public, anon;
revoke all on function public.simpan_audit(integer, integer, integer, jsonb) from public, anon;
revoke all on function public.putuskan_audit(integer, integer, integer, text, text) from public, anon;
revoke all on function public.baca_penerimaan(integer) from public, anon;
revoke all on function public.catat_penerimaan(integer, integer, integer, jsonb) from public, anon;
grant execute on function public.ajukan_validasi_lrs(integer, integer) to authenticated;
grant execute on function public.review_validasi_lrs(integer, integer, text, text) to authenticated;
grant execute on function public.daftar_upload_sistem(integer) to authenticated;
grant execute on function public.catat_upload_sistem(integer, jsonb) to authenticated;
grant execute on function public.baca_audit(integer) to authenticated;
grant execute on function public.simpan_audit(integer, integer, integer, jsonb) to authenticated;
grant execute on function public.putuskan_audit(integer, integer, integer, text, text) to authenticated;
grant execute on function public.baca_penerimaan(integer) to authenticated;
grant execute on function public.catat_penerimaan(integer, integer, integer, jsonb) to authenticated;
