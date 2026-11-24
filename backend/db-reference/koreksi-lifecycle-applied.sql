-- APPLIED to Jala-Mutu (vnvknmwcidberkjwtqjx) on 2026-11-24 as migration koreksi_lifecycle (approved by project owner).
-- Koreksi (correction) lifecycle — approach A (approved 2026-11-24).
-- Uses the ERD tables by meaning, adds only:
--   kasus_temuan.detail (jsonb: UI fields with no ERD column), kasus_temuan.dibuat_oleh,
--   koreksi_data.versi (optimistic concurrency, read by the frontend from koreksi_data).
-- State machine mirrors backend/tests/api.test.mjs (koreksi mock):
--   Terbuka -> Menunggu Persetujuan -> Disetujui -> Dilaksanakan -> Verifikasi Ulang -> Ditutup.
-- Error codes: 42501 access, P0002 not found, 40001 stale version, 55000 bad transition, 22023 bad input.

alter table public.kasus_temuan
  add column if not exists detail jsonb not null default '{}'::jsonb,
  add column if not exists dibuat_oleh integer references public.pengguna(pengguna_id);
alter table public.koreksi_data
  add column if not exists versi integer not null default 0 check (versi >= 0);

create index if not exists kasus_temuan_paket_id_idx on public.kasus_temuan(paket_id);
create index if not exists koreksi_data_kasus_id_idx on public.koreksi_data(kasus_id);
create index if not exists tindakan_perbaikan_kasus_id_idx on public.tindakan_perbaikan(kasus_id);
create index if not exists uji_ulang_tindakan_id_idx on public.uji_ulang(tindakan_id);
create index if not exists verifikasi_koreksi_koreksi_id_idx on public.verifikasi_koreksi(koreksi_id);
create index if not exists riwayat_status_kasus_kasus_id_idx on public.riwayat_status_kasus(kasus_id);

-- Correction action catalog used by the UI (koreksiCreateSchema action types).
insert into public.jenis_tindakan(nama)
select v.nama from (values
  ('Survei ulang sebagian ruas'), ('Survei ulang seluruh ruas'), ('Penilaian ulang (re-rating)'),
  ('Ambil ulang foto/video'), ('Pelatihan ulang personel'), ('Kalibrasi ulang alat'),
  ('Penggantian komponen alat'), ('Penggantian personel'), ('Koreksi pemrosesan dengan bukti'),
  ('Investigasi keterlambatan dan rencana tindak lanjut')
) as v(nama)
where not exists (select 1 from public.jenis_tindakan j where j.nama = v.nama);

-- Caller identity and package roles; admins are read-only (no write role here).
create or replace function app_private.koreksi_aktor(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare v jsonb; p public.paket_kontrak;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select * into p from public.paket_kontrak where paket_id = p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002'; end if;
  select jsonb_build_object(
      'pengguna_id', u.pengguna_id,
      'penyedia', coalesce(bool_or(r.nama = 'penyedia_jasa' and p.created_by = u.pengguna_id), false),
      'pic', coalesce(bool_or(r.nama = 'pic_balai' and pp.scope_balai_id = p.balai_id
        and (pp.scope_paket_id is null or pp.scope_paket_id = p.paket_id)), false),
      'direktorat', coalesce(bool_or(r.nama = 'direktorat'), false))
  into v
  from public.pengguna u
  join public.pengguna_peran pp on pp.pengguna_id = u.pengguna_id
  join public.peran r on r.peran_id = pp.peran_id
  where u.auth_user_id = auth.uid() and not coalesce(u.terkunci, false)
  group by u.pengguna_id;
  if v is null or not ((v->>'penyedia')::boolean or (v->>'pic')::boolean or (v->>'direktorat')::boolean) then
    raise exception 'Akses tidak dibenarkan' using errcode = '42501';
  end if;
  return v;
end;
$function$;

-- Lock the case rows and check the optimistic version; returns kasus_id.
create or replace function app_private.koreksi_kunci(p_paket_id integer, p_koreksi_id integer, p_expected_version integer)
returns integer language plpgsql security definer set search_path = ''
as $function$
declare v_kasus integer; v_versi integer;
begin
  select k.kasus_id, kd.versi into v_kasus, v_versi
  from public.koreksi_data kd join public.kasus_temuan k on k.kasus_id = kd.kasus_id
  where kd.koreksi_id = p_koreksi_id and k.paket_id = p_paket_id
  for update of k, kd;
  if v_kasus is null then raise exception 'Kasus koreksi tidak ditemukan' using errcode = 'P0002'; end if;
  if p_expected_version is null or v_versi <> p_expected_version then
    raise exception 'Kasus koreksi telah berubah. Baca semula' using errcode = '40001';
  end if;
  return v_kasus;
end;
$function$;

-- Apply status + detail changes, bump version and record the status history atomically.
create or replace function app_private.koreksi_simpan(p_kasus_id integer, p_koreksi_id integer, p_status text, p_detail jsonb, p_actor integer)
returns void language plpgsql security definer set search_path = ''
as $function$
declare v_old text;
begin
  select status into v_old from public.kasus_temuan where kasus_id = p_kasus_id;
  update public.kasus_temuan
  set status = p_status, detail = p_detail,
      akar_masalah = nullif(p_detail->>'root_cause', ''),
      data_lapangan_valid = case p_detail->>'field_data_valid' when 'Ya' then true when 'Tidak' then false else null end,
      ditutup_pada = case when p_status = 'Ditutup' then localtimestamp else null end
  where kasus_id = p_kasus_id;
  update public.koreksi_data
  set versi = versi + 1, status = p_detail->>'approval',
      nilai_lama = to_jsonb(coalesce(p_detail->>'original_value', '')),
      nilai_baru = to_jsonb(coalesce(p_detail->>'proposed_value', '')),
      alasan = nullif(p_detail->>'evidence', '')
  where koreksi_id = p_koreksi_id;
  update public.tindakan_perbaikan
  set jenis_tindakan_id = (select j.jenis_tindakan_id from public.jenis_tindakan j where j.nama = p_detail->>'action_type' limit 1),
      usulan = nullif(p_detail->>'evidence', ''),
      status_persetujuan = p_detail->>'approval'
  where kasus_id = p_kasus_id;
  if v_old is distinct from p_status then
    insert into public.riwayat_status_kasus(kasus_id, status_lama, status_baru, oleh, waktu)
    values (p_kasus_id, v_old, p_status, p_actor, localtimestamp);
  end if;
end;
$function$;

-- Owner of retest/closure follows the blocked stage (mock: Audit 1 Penyedia, Audit 3 Direktorat, else PIC).
create or replace function app_private.koreksi_pemilik_uji(p_detail jsonb, p_aktor jsonb)
returns boolean language sql immutable set search_path = ''
as $function$
  select case
    when (p_detail->>'blocked_stage') ~* '^Audit tingkat 1$' then (p_aktor->>'penyedia')::boolean
    when (p_detail->>'blocked_stage') ~* '^Audit tingkat 3$' then (p_aktor->>'direktorat')::boolean
    else (p_aktor->>'pic')::boolean end;
$function$;

create or replace function public.buat_koreksi(p_paket_id integer, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_survei integer; v_kasus integer; v_koreksi integer; d jsonb;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh membuka kasus koreksi' using errcode = '42501'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Data koreksi tidak valid' using errcode = '22023'; end if;
  select jenis_survei_id into v_survei from public.jenis_survei where nama = p_data->>'survey_type';
  if v_survei is null then raise exception 'Jenis survei tidak dikenal' using errcode = '22023'; end if;
  if coalesce(p_data->>'action_type', '') <> '' and not exists (select 1 from public.jenis_tindakan where nama = p_data->>'action_type') then
    raise exception 'Jenis tindakan tidak sah' using errcode = '22023';
  end if;
  d := p_data || jsonb_build_object('approval', 'Draft', 'retest', 'Belum Diuji',
    'verification_surveyor', false, 'verification_team_leader', false, 'verification_balai', false,
    'review_note', null, 'execution_reference', null, 'retest_reference', null);
  insert into public.kasus_temuan(paket_id, jenis_survei_id, sumber_tipe, tahap_tertahan, tingkat, uraian, tenggat, status, detail, dibuat_oleh)
  values (p_paket_id, v_survei, p_data->>'source', p_data->>'blocked_stage', p_data->>'severity', p_data->>'rejection_reason',
    nullif(p_data->>'due_date', '')::date, 'Terbuka', d, (a->>'pengguna_id')::integer)
  returning kasus_id into v_kasus;
  insert into public.koreksi_data(kasus_id, status, versi) values (v_kasus, 'Draft', 0) returning koreksi_id into v_koreksi;
  insert into public.tindakan_perbaikan(kasus_id, diusulkan_oleh, status_persetujuan) values (v_kasus, (a->>'pengguna_id')::integer, 'Draft');
  insert into public.riwayat_status_kasus(kasus_id, status_lama, status_baru, oleh, waktu)
  values (v_kasus, null, 'Terbuka', (a->>'pengguna_id')::integer, localtimestamp);
  -- Sync mapped ERD columns; this bumps versi to 1 for the first readable version.
  perform app_private.koreksi_simpan(v_kasus, v_koreksi, 'Terbuka', d, (a->>'pengguna_id')::integer);
  return public.baca_koreksi(p_paket_id, v_koreksi);
end;
$function$;

create or replace function public.ubah_koreksi(p_paket_id integer, p_koreksi_id integer, p_expected_version integer, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_kasus integer; d jsonb; v_status text; v_patch jsonb;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh mengubah usulan koreksi' using errcode = '42501'; end if;
  v_kasus := app_private.koreksi_kunci(p_paket_id, p_koreksi_id, p_expected_version);
  select status, detail into v_status, d from public.kasus_temuan where kasus_id = v_kasus;
  if not (v_status = 'Terbuka' or (v_status = 'Verifikasi Ulang' and d->>'retest' = 'Gagal')) then
    raise exception 'Usulan hanya boleh diubah ketika Terbuka atau selepas uji ulang Gagal' using errcode = '55000';
  end if;
  -- Only proposal fields; identity, package, decisions and actors never come from the payload.
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_patch
  from jsonb_each(coalesce(p_data, '{}'::jsonb))
  where key in ('root_cause', 'field_data_valid', 'action_type', 'evidence', 'original_value', 'proposed_value',
    'return_stage', 'linked_record_id', 'rule_scenario', 'rule_checks', 'rule_numbers', 'province_update_ba');
  if coalesce(v_patch->>'action_type', '') <> '' and not exists (select 1 from public.jenis_tindakan where nama = v_patch->>'action_type') then
    raise exception 'Jenis tindakan tidak sah' using errcode = '22023';
  end if;
  d := d || v_patch || jsonb_build_object('approval', 'Draft', 'retest', 'Belum Diuji',
    'verification_surveyor', false, 'verification_team_leader', false, 'verification_balai', false);
  perform app_private.koreksi_simpan(v_kasus, p_koreksi_id, 'Terbuka', d, (a->>'pengguna_id')::integer);
  return public.baca_koreksi(p_paket_id, p_koreksi_id);
end;
$function$;

create or replace function public.verifikasi_koreksi(p_paket_id integer, p_koreksi_id integer, p_expected_version integer, p_tahap text, p_nilai boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_kasus integer; d jsonb; v_status text;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if p_nilai is null then raise exception 'Nilai verifikasi wajib' using errcode = '22023'; end if;
  v_kasus := app_private.koreksi_kunci(p_paket_id, p_koreksi_id, p_expected_version);
  select status, detail into v_status, d from public.kasus_temuan where kasus_id = v_kasus;
  if p_tahap = 'balai' then
    if not (a->>'pic')::boolean then raise exception 'Hanya PIC Balai boleh memverifikasi tahap Balai' using errcode = '42501'; end if;
    if v_status <> 'Menunggu Persetujuan' then raise exception 'Verifikasi Balai hanya tersedia untuk usulan yang telah diajukan' using errcode = '55000'; end if;
    if p_nilai and not coalesce((d->>'verification_team_leader')::boolean, false) then raise exception 'Ikuti urutan Surveyor, Team Leader, Balai' using errcode = '55000'; end if;
    d := d || jsonb_build_object('verification_balai', p_nilai);
  elsif p_tahap in ('surveyor', 'team_leader') then
    if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh memverifikasi tahap ini' using errcode = '42501'; end if;
    if v_status <> 'Terbuka' then raise exception 'Verifikasi usulan hanya tersedia ketika kasus Terbuka' using errcode = '55000'; end if;
    if p_tahap = 'team_leader' and p_nilai and not coalesce((d->>'verification_surveyor')::boolean, false) then
      raise exception 'Ikuti urutan Surveyor, Team Leader, Balai' using errcode = '55000';
    end if;
    if p_tahap = 'surveyor' then
      d := d || jsonb_build_object('verification_surveyor', p_nilai);
      if not p_nilai then d := d || jsonb_build_object('verification_team_leader', false, 'verification_balai', false); end if;
    else
      d := d || jsonb_build_object('verification_team_leader', p_nilai);
      if not p_nilai then d := d || jsonb_build_object('verification_balai', false); end if;
    end if;
  else
    raise exception 'Tahap verifikasi tidak sah' using errcode = '22023';
  end if;
  insert into public.verifikasi_koreksi(koreksi_id, lapis, pengguna_id, keputusan, waktu)
  values (p_koreksi_id, p_tahap, (a->>'pengguna_id')::integer, case when p_nilai then 'Valid' else 'Dibatalkan' end, localtimestamp);
  if not p_nilai and v_status = 'Menunggu Persetujuan' then
    v_status := 'Terbuka'; d := d || jsonb_build_object('approval', 'Draft');
  end if;
  perform app_private.koreksi_simpan(v_kasus, p_koreksi_id, v_status, d, (a->>'pengguna_id')::integer);
  return public.baca_koreksi(p_paket_id, p_koreksi_id);
end;
$function$;

create or replace function public.ajukan_koreksi(p_paket_id integer, p_koreksi_id integer, p_expected_version integer)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_kasus integer; d jsonb; v_status text;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh mengajukan koreksi' using errcode = '42501'; end if;
  v_kasus := app_private.koreksi_kunci(p_paket_id, p_koreksi_id, p_expected_version);
  select status, detail into v_status, d from public.kasus_temuan where kasus_id = v_kasus;
  if not (v_status = 'Terbuka' or (v_status = 'Verifikasi Ulang' and d->>'retest' = 'Gagal')) then
    raise exception 'Tindakan hanya boleh diajukan dari kasus Terbuka atau uji ulang Gagal' using errcode = '55000';
  end if;
  if coalesce(d->>'root_cause', '') = '' or coalesce(d->>'field_data_valid', '') = '' or coalesce(d->>'action_type', '') = ''
    or btrim(coalesce(d->>'evidence', '')) = '' then
    raise exception 'Lengkapi usulan' using errcode = '22023';
  end if;
  if d->>'field_data_valid' = 'Ya' and d->>'action_type' <> 'Koreksi pemrosesan dengan bukti' then
    raise exception 'Data lapangan valid hanya boleh dikoreksi melalui pemrosesan berbukti' using errcode = '22023';
  end if;
  if d->>'field_data_valid' = 'Tidak' and d->>'action_type' = 'Koreksi pemrosesan dengan bukti' then
    raise exception 'Data lapangan tidak valid memerlukan tindakan lapangan' using errcode = '22023';
  end if;
  if d->>'field_data_valid' = 'Ya' and (coalesce(d->>'original_value', '') in ('', 'Belum ada nilai raw tertaut') or coalesce(d->>'proposed_value', '') = '') then
    raise exception 'Koreksi data memerlukan nilai raw dan usulan' using errcode = '22023';
  end if;
  if not coalesce((d->>'verification_surveyor')::boolean, false) or not coalesce((d->>'verification_team_leader')::boolean, false) then
    raise exception 'Surveyor dan Team Leader mesti memverifikasi bukti' using errcode = '55000';
  end if;
  if coalesce((d->>'verification_balai')::boolean, false) then
    raise exception 'Verifikasi Balai dilakukan selepas usulan dihantar' using errcode = '55000';
  end if;
  d := d || jsonb_build_object('approval', 'Diajukan');
  perform app_private.koreksi_simpan(v_kasus, p_koreksi_id, 'Menunggu Persetujuan', d, (a->>'pengguna_id')::integer);
  return public.baca_koreksi(p_paket_id, p_koreksi_id);
end;
$function$;

create or replace function public.review_koreksi(p_paket_id integer, p_koreksi_id integer, p_expected_version integer, p_keputusan text, p_catatan text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_kasus integer; d jsonb; v_status text;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'pic')::boolean then raise exception 'Hanya PIC Balai boleh memutuskan usulan koreksi' using errcode = '42501'; end if;
  if p_keputusan not in ('Disetujui', 'Perlu Revisi') or (p_keputusan = 'Perlu Revisi' and btrim(coalesce(p_catatan, '')) = '') then
    raise exception 'Keputusan atau catatan tidak sah' using errcode = '22023';
  end if;
  v_kasus := app_private.koreksi_kunci(p_paket_id, p_koreksi_id, p_expected_version);
  select status, detail into v_status, d from public.kasus_temuan where kasus_id = v_kasus;
  if v_status <> 'Menunggu Persetujuan' or d->>'approval' <> 'Diajukan' then
    raise exception 'Usulan belum diajukan atau sudah diputuskan' using errcode = '55000';
  end if;
  if p_keputusan = 'Disetujui' and not coalesce((d->>'verification_balai')::boolean, false) then
    raise exception 'Balai mesti memverifikasi bukti sebelum menyetujui' using errcode = '55000';
  end if;
  d := d || jsonb_build_object('review_note', nullif(btrim(coalesce(p_catatan, '')), ''));
  if p_keputusan = 'Disetujui' then
    d := d || jsonb_build_object('approval', 'Disetujui');
    perform app_private.koreksi_simpan(v_kasus, p_koreksi_id, 'Disetujui', d, (a->>'pengguna_id')::integer);
    update public.tindakan_perbaikan set disetujui_oleh = (a->>'pengguna_id')::integer, tgl_persetujuan = localtimestamp where kasus_id = v_kasus;
    update public.koreksi_data set keputusan_pengguna_jasa_oleh = (a->>'pengguna_id')::integer where koreksi_id = p_koreksi_id;
  else
    d := d || jsonb_build_object('approval', 'Perlu Revisi', 'retest', 'Belum Diuji',
      'verification_surveyor', false, 'verification_team_leader', false, 'verification_balai', false);
    perform app_private.koreksi_simpan(v_kasus, p_koreksi_id, 'Terbuka', d, (a->>'pengguna_id')::integer);
  end if;
  return public.baca_koreksi(p_paket_id, p_koreksi_id);
end;
$function$;

create or replace function public.laksana_koreksi(p_paket_id integer, p_koreksi_id integer, p_expected_version integer, p_execution_reference text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_kasus integer; d jsonb; v_status text;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh melaksanakan tindakan' using errcode = '42501'; end if;
  if btrim(coalesce(p_execution_reference, '')) = '' then raise exception 'Referensi pelaksanaan wajib' using errcode = '22023'; end if;
  v_kasus := app_private.koreksi_kunci(p_paket_id, p_koreksi_id, p_expected_version);
  select status, detail into v_status, d from public.kasus_temuan where kasus_id = v_kasus;
  if v_status <> 'Disetujui' or d->>'approval' <> 'Disetujui' then
    raise exception 'Tindakan belum memperoleh persetujuan Pengguna Jasa' using errcode = '55000';
  end if;
  d := d || jsonb_build_object('execution_reference', btrim(p_execution_reference));
  perform app_private.koreksi_simpan(v_kasus, p_koreksi_id, 'Dilaksanakan', d, (a->>'pengguna_id')::integer);
  update public.tindakan_perbaikan set tgl_pelaksanaan = current_date where kasus_id = v_kasus;
  return public.baca_koreksi(p_paket_id, p_koreksi_id);
end;
$function$;

create or replace function public.uji_ulang_koreksi(p_paket_id integer, p_koreksi_id integer, p_expected_version integer, p_hasil text, p_retest_reference text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_kasus integer; d jsonb; v_status text;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if p_hasil not in ('Lulus', 'Gagal') or btrim(coalesce(p_retest_reference, '')) = '' then
    raise exception 'Hasil atau referensi uji ulang tidak sah' using errcode = '22023';
  end if;
  v_kasus := app_private.koreksi_kunci(p_paket_id, p_koreksi_id, p_expected_version);
  select status, detail into v_status, d from public.kasus_temuan where kasus_id = v_kasus;
  if not app_private.koreksi_pemilik_uji(d, a) then raise exception 'Uji ulang bukan kewenangan peran ini' using errcode = '42501'; end if;
  if v_status not in ('Dilaksanakan', 'Verifikasi Ulang') then
    raise exception 'Laksanakan tindakan terlebih dahulu sebelum uji ulang' using errcode = '55000';
  end if;
  if coalesce(d->>'execution_reference', '') = '' then raise exception 'Hasil pelaksanaan belum ditautkan' using errcode = '55000'; end if;
  -- Every attempt is kept; uji_ulang is append-only.
  insert into public.uji_ulang(tindakan_id, tanggal, hasil, lulus)
  select t.tindakan_id, current_date, btrim(p_retest_reference), p_hasil = 'Lulus'
  from public.tindakan_perbaikan t where t.kasus_id = v_kasus order by t.tindakan_id limit 1;
  d := d || jsonb_build_object('retest', p_hasil, 'retest_reference', btrim(p_retest_reference));
  perform app_private.koreksi_simpan(v_kasus, p_koreksi_id, 'Verifikasi Ulang', d, (a->>'pengguna_id')::integer);
  return public.baca_koreksi(p_paket_id, p_koreksi_id);
end;
$function$;

create or replace function public.tutup_koreksi(p_paket_id integer, p_koreksi_id integer, p_expected_version integer)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_kasus integer; d jsonb; v_status text;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  v_kasus := app_private.koreksi_kunci(p_paket_id, p_koreksi_id, p_expected_version);
  select status, detail into v_status, d from public.kasus_temuan where kasus_id = v_kasus;
  if not app_private.koreksi_pemilik_uji(d, a) then raise exception 'Penutupan bukan kewenangan peran ini' using errcode = '42501'; end if;
  if v_status <> 'Verifikasi Ulang' or d->>'retest' <> 'Lulus' then
    raise exception 'Kasus hanya boleh ditutup selepas uji ulang Lulus' using errcode = '55000';
  end if;
  if not coalesce((d->>'verification_surveyor')::boolean, false) or not coalesce((d->>'verification_team_leader')::boolean, false)
    or not coalesce((d->>'verification_balai')::boolean, false) then
    raise exception 'Verifikasi Surveyor, Team Leader dan Balai belum lengkap' using errcode = '55000';
  end if;
  if btrim(coalesce(d->>'evidence', '')) = '' or coalesce(d->>'execution_reference', '') = '' or coalesce(d->>'retest_reference', '') = '' then
    raise exception 'Bukti atau rujukan belum lengkap' using errcode = '55000';
  end if;
  if d->>'field_data_valid' = 'Ya' and (coalesce(d->>'linked_record_id', '') = '' or coalesce(d->>'original_value', '') = ''
    or coalesce(d->>'proposed_value', '') = '') then
    raise exception 'Referensi raw tidak lengkap' using errcode = '55000';
  end if;
  perform app_private.koreksi_simpan(v_kasus, p_koreksi_id, 'Ditutup', d, (a->>'pengguna_id')::integer);
  return public.baca_koreksi(p_paket_id, p_koreksi_id);
end;
$function$;

revoke all on function app_private.koreksi_aktor(integer) from public, anon, authenticated;
revoke all on function app_private.koreksi_kunci(integer, integer, integer) from public, anon, authenticated;
revoke all on function app_private.koreksi_simpan(integer, integer, text, jsonb, integer) from public, anon, authenticated;
revoke all on function app_private.koreksi_pemilik_uji(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.buat_koreksi(integer, jsonb) from public, anon;
revoke all on function public.ubah_koreksi(integer, integer, integer, jsonb) from public, anon;
revoke all on function public.verifikasi_koreksi(integer, integer, integer, text, boolean) from public, anon;
revoke all on function public.ajukan_koreksi(integer, integer, integer) from public, anon;
revoke all on function public.review_koreksi(integer, integer, integer, text, text) from public, anon;
revoke all on function public.laksana_koreksi(integer, integer, integer, text) from public, anon;
revoke all on function public.uji_ulang_koreksi(integer, integer, integer, text, text) from public, anon;
revoke all on function public.tutup_koreksi(integer, integer, integer) from public, anon;
grant execute on function public.buat_koreksi(integer, jsonb) to authenticated;
grant execute on function public.ubah_koreksi(integer, integer, integer, jsonb) to authenticated;
grant execute on function public.verifikasi_koreksi(integer, integer, integer, text, boolean) to authenticated;
grant execute on function public.ajukan_koreksi(integer, integer, integer) to authenticated;
grant execute on function public.review_koreksi(integer, integer, integer, text, text) to authenticated;
grant execute on function public.laksana_koreksi(integer, integer, integer, text) to authenticated;
grant execute on function public.uji_ulang_koreksi(integer, integer, integer, text, text) to authenticated;
grant execute on function public.tutup_koreksi(integer, integer, integer) to authenticated;
