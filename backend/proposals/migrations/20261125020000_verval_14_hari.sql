-- Tahap 3B: Verval berkala mandiri Penyedia tiap 14 hari (flowchart 02, KAK 11.10.4-11.10.8).
-- Rules approved by the project owner on 2026-11-25:
--  * Cycle N covers 14 consecutive days: cycle 1 starts at the first survey session date (or today),
--    cycle N+1 starts the day after cycle N ends. Due date = last day of the period.
--  * The next cycle may be opened as soon as the previous one is DITERIMA (no calendar wait);
--    an overdue cycle (today > jatuh_tempo while not yet submitted) is flagged "terlambat".
--  * Penyedia records consistency tests (>= 2 repetitions). The server computes mean, SD and KV:
--    PCI passes when SD <= 8 with distinct raters; every other survey type passes when KV <= 5%.
--  * Submitting (BA Verval 2-Mingguan) needs a test for every contracted survey type.
--    If the latest test of any type is inconsistent, the cycle is DITAHAN and a Koreksi case opens
--    (tahap tertahan 'Verval 14 hari'); after the case closes the Penyedia retests and resubmits.
--  * PIC reviews a submitted cycle: DITERIMA or PERLU_PERBAIKAN (note required).
--  * Tahap 4 cannot be submitted while a cycle is open, nor without at least one DITERIMA cycle.
-- Status: BERJALAN -> DIAJUKAN -> DITERIMA | PERLU_PERBAIKAN (-> DIAJUKAN); BERJALAN -> DITAHAN (-> DIAJUKAN).
-- Errors: 42501 access, P0002 not found, PT409 stale version, 55000 bad transition, 22023 bad input.

-- ---------- schema ----------
alter table public.siklus_verval
  add column if not exists versi integer not null default 0 check (versi >= 0),
  add column if not exists nomor_ba text,
  add column if not exists catatan_review text,
  add column if not exists request_id uuid,
  add column if not exists diajukan_oleh integer references public.pengguna(pengguna_id),
  add column if not exists diajukan_pada timestamptz,
  add column if not exists direview_oleh integer references public.pengguna(pengguna_id),
  add column if not exists direview_pada timestamptz;
update public.siklus_verval set status = 'BERJALAN' where status is null;
create unique index if not exists siklus_verval_paket_ke_uq on public.siklus_verval(paket_id, siklus_ke);
create unique index if not exists siklus_verval_request_uq on public.siklus_verval(paket_id, request_id) where request_id is not null;

alter table public.uji_konsistensi
  add column if not exists request_id uuid,
  add column if not exists rata_rata numeric,
  add column if not exists simpangan_baku numeric,
  add column if not exists kv_persen numeric,
  add column if not exists dibuat_pada timestamptz default now();
create unique index if not exists uji_konsistensi_request_uq on public.uji_konsistensi(siklus_id, request_id) where request_id is not null;
create index if not exists uji_konsistensi_siklus_idx on public.uji_konsistensi(siklus_id, jenis_survei_id, konsistensi_id desc);
create index if not exists uji_konsistensi_ulangan_konsistensi_idx on public.uji_konsistensi_ulangan(konsistensi_id);

-- ---------- helpers ----------
create or replace function app_private.verval_siklus_json(p_siklus public.siklus_verval)
returns jsonb language sql stable security definer set search_path = ''
as $function$
  select to_jsonb(p_siklus) || jsonb_build_object(
    'panjang_km', coalesce((select sum(s.panjang_tercapai_km) from public.sesi_survei s
      where s.paket_id = p_siklus.paket_id and s.tanggal between p_siklus.periode_mulai and p_siklus.periode_selesai), 0),
    'jumlah_sesi', (select count(*) from public.sesi_survei s
      where s.paket_id = p_siklus.paket_id and s.tanggal between p_siklus.periode_mulai and p_siklus.periode_selesai),
    'terlambat', p_siklus.status in ('BERJALAN', 'DITAHAN', 'PERLU_PERBAIKAN') and current_date > p_siklus.jatuh_tempo,
    'koreksi_terbuka', (select count(*) from public.kasus_temuan k where k.paket_id = p_siklus.paket_id
      and k.tahap_tertahan = 'Verval 14 hari' and k.status <> 'Ditutup'),
    'uji', coalesce((select jsonb_agg(to_jsonb(k) || jsonb_build_object(
        'jenis_kode', j.kode,
        'ulangan', coalesce((select jsonb_agg(to_jsonb(u) order by u.ulangan_ke) from public.uji_konsistensi_ulangan u
          where u.konsistensi_id = k.konsistensi_id), '[]'::jsonb)) order by k.konsistensi_id)
      from public.uji_konsistensi k join public.jenis_survei j using (jenis_survei_id) where k.siklus_id = p_siklus.siklus_id), '[]'::jsonb));
$function$;

-- Latest test per contracted survey type: null = missing, otherwise its status.
create or replace function app_private.verval_hasil_terakhir(p_paket_id integer, p_siklus_id integer)
returns table(jenis_survei_id integer, status text) language sql stable security definer set search_path = ''
as $function$
  select ps.jenis_survei_id, (select k.status from public.uji_konsistensi k where k.siklus_id = p_siklus_id
    and k.jenis_survei_id = ps.jenis_survei_id order by k.konsistensi_id desc limit 1)::text
  from public.paket_survei_kontrak ps where ps.paket_id = p_paket_id;
$function$;

-- ---------- read (one call for the whole 3B page) ----------
create or replace function public.baca_verval_paket(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare v_open public.siklus_verval; v_tahap4 text;
begin
  perform app_private.tahap_akses_baca(p_paket_id);
  select * into v_open from public.siklus_verval where paket_id = p_paket_id and status <> 'DITERIMA' order by siklus_ke limit 1;
  select status into v_tahap4 from public.tahap4_pengajuan where paket_id = p_paket_id;
  return jsonb_build_object(
    'paket_id', p_paket_id,
    'tahap4', coalesce(v_tahap4, 'DRAFT'),
    'boleh_buka', v_open.siklus_id is null and coalesce(v_tahap4, 'DRAFT') in ('DRAFT', 'PERLU_REVISI'),
    'alasan_tidak_boleh_buka', case
      when v_open.siklus_id is not null then 'Selesaikan siklus ke-' || v_open.siklus_ke || ' (status ' || v_open.status || ') sebelum membuka siklus berikutnya.'
      when coalesce(v_tahap4, 'DRAFT') not in ('DRAFT', 'PERLU_REVISI') then 'Periode survei sudah ditutup karena Tahap 4 telah diajukan.'
      else null end,
    'siklus', coalesce((select jsonb_agg(app_private.verval_siklus_json(s) order by s.siklus_ke) from public.siklus_verval s where s.paket_id = p_paket_id), '[]'::jsonb),
    'opsi', jsonb_build_object(
      'jenis_survei', coalesce((select jsonb_agg(jsonb_build_object('jenis_survei_id', j.jenis_survei_id, 'kode', j.kode, 'nama', j.nama) order by j.jenis_survei_id)
        from public.paket_survei_kontrak ps join public.jenis_survei j using (jenis_survei_id) where ps.paket_id = p_paket_id), '[]'::jsonb),
      'tim', coalesce((select jsonb_agg(jsonb_build_object('tim_id', t.tim_id, 'nama_tim', t.nama_tim, 'jenis_survei_id', t.jenis_survei_id) order by t.tim_id)
        from public.tim_survei t where t.paket_id = p_paket_id), '[]'::jsonb),
      'ruas', coalesce((select jsonb_agg(distinct jsonb_build_object('ruas_id', r.ruas_id, 'nomor_ruas', r.nomor_ruas, 'nama_ruas', r.nama_ruas))
        from public.lokasi_pekerjaan lp join public.ruas_jalan r using (ruas_id) where lp.paket_id = p_paket_id), '[]'::jsonb),
      'personel', coalesce((select jsonb_agg(jsonb_build_object('personel_id', p.personel_id, 'nama', p.nama) order by p.nama)
        from public.personel p where p.penyedia_id = (select penyedia_id from public.paket_kontrak where paket_id = p_paket_id)), '[]'::jsonb)));
end;
$function$;

-- ---------- writes ----------
create or replace function public.buat_siklus_verval(p_paket_id integer, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; v_existing public.siklus_verval; v_prev public.siklus_verval; v_open public.siklus_verval; v_mulai date; v_new public.siklus_verval;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh membuka siklus Verval' using errcode = '42501'; end if;
  perform 1 from public.paket_kontrak where paket_id = p_paket_id for update;
  select * into v_existing from public.siklus_verval where paket_id = p_paket_id and request_id = p_request_id;
  if found then return app_private.verval_siklus_json(v_existing); end if;
  if exists (select 1 from public.tahap4_pengajuan where paket_id = p_paket_id and status in ('DIAJUKAN', 'DISETUJUI')) then
    raise exception 'Periode survei sudah ditutup karena Tahap 4 telah diajukan' using errcode = '55000';
  end if;
  select * into v_open from public.siklus_verval where paket_id = p_paket_id and status <> 'DITERIMA' order by siklus_ke limit 1;
  if found then raise exception 'Selesaikan siklus ke-% sebelum membuka siklus berikutnya', v_open.siklus_ke using errcode = '55000'; end if;
  select * into v_prev from public.siklus_verval where paket_id = p_paket_id order by siklus_ke desc limit 1;
  v_mulai := case when v_prev.siklus_id is null
    then coalesce((select min(tanggal) from public.sesi_survei where paket_id = p_paket_id), current_date)
    else v_prev.periode_selesai + 1 end;
  insert into public.siklus_verval(paket_id, siklus_ke, periode_mulai, periode_selesai, jatuh_tempo, status, versi, request_id)
  values (p_paket_id, coalesce(v_prev.siklus_ke, 0) + 1, v_mulai, v_mulai + 13, v_mulai + 13, 'BERJALAN', 0, p_request_id)
  returning * into v_new;
  update public.siklus_verval set panjang_periode_km = (app_private.verval_siklus_json(v_new)->>'panjang_km')::numeric where siklus_id = v_new.siklus_id
  returning * into v_new;
  return app_private.verval_siklus_json(v_new);
end;
$function$;

create or replace function public.simpan_uji_konsistensi_verval(p_paket_id integer, p_siklus_id integer, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; c public.siklus_verval; p public.paket_kontrak; v_id integer; v_kode text; v_n integer;
  v_mean numeric; v_sd numeric; v_kv numeric; v_status text; v_request uuid := nullif(p_data->>'request_id', '')::uuid;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh mencatat uji konsistensi' using errcode = '42501'; end if;
  select * into p from public.paket_kontrak where paket_id = p_paket_id;
  select * into c from public.siklus_verval where siklus_id = p_siklus_id and paket_id = p_paket_id for update;
  if not found then raise exception 'Siklus Verval tidak ditemukan dalam paket ini' using errcode = 'P0002'; end if;
  if v_request is not null then
    select konsistensi_id into v_id from public.uji_konsistensi where siklus_id = p_siklus_id and request_id = v_request;
    if found then return jsonb_build_object('konsistensi_id', v_id, 'siklus_id', p_siklus_id, 'versi', c.versi); end if;
  end if;
  if c.versi <> (p_data->>'expected_version')::integer then raise exception 'Siklus Verval telah berubah. Muat ulang' using errcode = 'PT409'; end if;
  if c.status not in ('BERJALAN', 'DITAHAN', 'PERLU_PERBAIKAN') then raise exception 'Siklus ini sudah diajukan atau diterima' using errcode = '55000'; end if;
  select j.kode into v_kode from public.paket_survei_kontrak ps join public.jenis_survei j using (jenis_survei_id)
  where ps.paket_id = p_paket_id and ps.jenis_survei_id = (p_data->>'jenis_survei_id')::integer;
  if v_kode is null then raise exception 'Jenis survei tidak termasuk lingkup paket' using errcode = '22023'; end if;
  if not exists (select 1 from public.tim_survei where tim_id = (p_data->>'tim_id')::integer and paket_id = p_paket_id) then
    raise exception 'Tim tidak terdaftar pada paket ini' using errcode = '22023'; end if;
  if not exists (select 1 from public.lokasi_pekerjaan where paket_id = p_paket_id and ruas_id = (p_data->>'ruas_id')::integer) then
    raise exception 'Ruas tidak termasuk lokasi pekerjaan paket' using errcode = '22023'; end if;
  if (p_data->>'sta_akhir')::numeric <= (p_data->>'sta_awal')::numeric then raise exception 'STA akhir harus lebih besar dari STA awal' using errcode = '22023'; end if;
  v_n := jsonb_array_length(coalesce(p_data->'ulangan', '[]'::jsonb));
  if v_n < 2 then raise exception 'Uji konsistensi memerlukan minimal 2 ulangan' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_array_elements(p_data->'ulangan') u where not exists (select 1 from public.personel x
      where x.personel_id = (u->>'rater_personel_id')::integer and x.penyedia_id = p.penyedia_id)) then
    raise exception 'Rater bukan personel Penyedia paket ini' using errcode = '22023'; end if;
  if v_kode in ('PCI', 'DRAINASE') and (select count(distinct u->>'rater_personel_id') from jsonb_array_elements(p_data->'ulangan') u) < v_n then
    raise exception 'Uji % memerlukan rater yang berbeda untuk setiap ulangan', v_kode using errcode = '22023'; end if;
  select avg((u->>'nilai')::numeric), stddev_samp((u->>'nilai')::numeric) into v_mean, v_sd from jsonb_array_elements(p_data->'ulangan') u;
  v_kv := case when v_mean = 0 then null else round(v_sd * 100 / abs(v_mean), 2) end;
  v_status := case when v_kode = 'PCI' then case when v_sd <= 8 then 'Konsisten' else 'Tidak Konsisten' end
    else case when v_kv is not null and v_kv <= 5 then 'Konsisten' else 'Tidak Konsisten' end end;
  insert into public.uji_konsistensi(siklus_id, jenis_survei_id, tim_id, ruas_id, sta_awal, sta_akhir, jumlah_ulangan, status,
    request_id, rata_rata, simpangan_baku, kv_persen)
  values (p_siklus_id, (p_data->>'jenis_survei_id')::integer, (p_data->>'tim_id')::integer, (p_data->>'ruas_id')::integer,
    (p_data->>'sta_awal')::numeric, (p_data->>'sta_akhir')::numeric, v_n, v_status, v_request, round(v_mean, 3), round(v_sd, 3), v_kv)
  returning konsistensi_id into v_id;
  insert into public.uji_konsistensi_ulangan(konsistensi_id, ulangan_ke, rater_personel_id, nilai)
  select v_id, (u->>'ulangan_ke')::integer, (u->>'rater_personel_id')::integer, (u->>'nilai')::numeric from jsonb_array_elements(p_data->'ulangan') u;
  update public.siklus_verval set versi = versi + 1 where siklus_id = p_siklus_id returning versi into c.versi;
  return jsonb_build_object('konsistensi_id', v_id, 'siklus_id', p_siklus_id, 'versi', c.versi, 'status', v_status, 'kv_persen', v_kv,
    'simpangan_baku', round(v_sd, 3), 'rata_rata', round(v_mean, 3));
end;
$function$;

create or replace function public.ajukan_verval(p_paket_id integer, p_siklus_id integer, p_expected_version integer, p_nomor_ba text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; c public.siklus_verval; v_missing integer; v_bad integer;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh mengajukan BA Verval' using errcode = '42501'; end if;
  if btrim(coalesce(p_nomor_ba, '')) = '' then raise exception 'Nomor BA Verval 2-Mingguan wajib diisi' using errcode = '22023'; end if;
  select * into c from public.siklus_verval where siklus_id = p_siklus_id and paket_id = p_paket_id for update;
  if not found then raise exception 'Siklus Verval tidak ditemukan dalam paket ini' using errcode = 'P0002'; end if;
  if c.versi <> p_expected_version then raise exception 'Siklus Verval telah berubah. Muat ulang' using errcode = 'PT409'; end if;
  if c.status not in ('BERJALAN', 'DITAHAN', 'PERLU_PERBAIKAN') then raise exception 'Siklus ini sudah diajukan atau diterima' using errcode = '55000'; end if;
  select count(*) filter (where h.status is null), count(*) filter (where h.status = 'Tidak Konsisten')
    into v_missing, v_bad from app_private.verval_hasil_terakhir(p_paket_id, p_siklus_id) h;
  if v_missing > 0 then raise exception 'Catat uji konsistensi untuk setiap jenis survei paket sebelum mengajukan' using errcode = '55000'; end if;
  if exists (select 1 from public.kasus_temuan k where k.paket_id = p_paket_id and k.tahap_tertahan = 'Verval 14 hari' and k.status <> 'Ditutup') then
    raise exception 'Tutup kasus koreksi Verval terlebih dahulu, lalu uji ulang' using errcode = '55000';
  end if;
  if v_bad > 0 then
    update public.siklus_verval set status = 'DITAHAN', versi = versi + 1, nomor_ba = btrim(p_nomor_ba) where siklus_id = p_siklus_id returning * into c;
    perform app_private.koreksi_buka_otomatis(p_paket_id, 'Verval 14 hari',
      'Uji konsistensi siklus ke-' || c.siklus_ke || ' tidak konsisten; data 14 hari terakhir ditahan.', (a->>'pengguna_id')::integer);
    return app_private.verval_siklus_json(c);
  end if;
  update public.siklus_verval set status = 'DIAJUKAN', versi = versi + 1, nomor_ba = btrim(p_nomor_ba), catatan_review = null,
    diajukan_oleh = (a->>'pengguna_id')::integer, diajukan_pada = now() where siklus_id = p_siklus_id returning * into c;
  return app_private.verval_siklus_json(c);
end;
$function$;

create or replace function public.review_verval(p_paket_id integer, p_siklus_id integer, p_expected_version integer, p_keputusan text, p_catatan text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; c public.siklus_verval;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'pic')::boolean then raise exception 'Hanya PIC Balai boleh memeriksa siklus Verval' using errcode = '42501'; end if;
  if p_keputusan not in ('DITERIMA', 'PERLU_PERBAIKAN') or (p_keputusan = 'PERLU_PERBAIKAN' and btrim(coalesce(p_catatan, '')) = '') then
    raise exception 'Keputusan atau catatan tidak sah' using errcode = '22023';
  end if;
  select * into c from public.siklus_verval where siklus_id = p_siklus_id and paket_id = p_paket_id for update;
  if not found then raise exception 'Siklus Verval tidak ditemukan dalam paket ini' using errcode = 'P0002'; end if;
  if c.versi <> p_expected_version then raise exception 'Siklus Verval telah berubah. Muat ulang' using errcode = 'PT409'; end if;
  if c.status <> 'DIAJUKAN' then raise exception 'Siklus belum diajukan' using errcode = '55000'; end if;
  update public.siklus_verval set status = p_keputusan, versi = versi + 1, catatan_review = nullif(btrim(coalesce(p_catatan, '')), ''),
    direview_oleh = (a->>'pengguna_id')::integer, direview_pada = now() where siklus_id = p_siklus_id returning * into c;
  if p_keputusan = 'DITERIMA' and coalesce(btrim(c.nomor_ba), '') <> '' then
    insert into public.berita_acara(paket_id, jenis, nomor, tanggal, sumber_tipe, sumber_id, status)
    values (p_paket_id, 'VERVAL_2_MINGGUAN', c.nomor_ba, current_date, 'SIKLUS_VERVAL', c.siklus_id, 'SAH');
  end if;
  return app_private.verval_siklus_json(c);
end;
$function$;

-- ---------- Tahap 4 gate: verval must be settled ----------
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
  if not exists (select 1 from public.siklus_verval s where s.paket_id = p_paket_id and s.status = 'DITERIMA') then
    b := b || jsonb_build_array(jsonb_build_object('code', 'VERVAL_MISSING', 'message', 'Belum ada siklus Verval 14 hari yang diterima PIC.'));
  end if;
  if exists (select 1 from public.siklus_verval s where s.paket_id = p_paket_id and s.status <> 'DITERIMA') then
    b := b || jsonb_build_array(jsonb_build_object('code', 'VERVAL_OPEN', 'message', 'Masih ada siklus Verval 14 hari yang belum diterima PIC.'));
  end if;
  return b;
end;
$function$;

-- ---------- rail: 3B progress ----------
create or replace function public.baca_progres_tahap_akhir(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
begin
  perform app_private.tahap_akses_baca(p_paket_id);
  return jsonb_build_object(
    'paket_id', p_paket_id,
    'status_paket', (select status from public.paket_kontrak where paket_id = p_paket_id),
    'jumlah_sesi_survei', (select count(*) from public.sesi_survei s where s.paket_id = p_paket_id),
    'jumlah_siklus_verval', (select count(*) from public.siklus_verval v where v.paket_id = p_paket_id),
    'verval_diterima', (select count(*) from public.siklus_verval v where v.paket_id = p_paket_id and v.status = 'DITERIMA'),
    'verval_ditahan', (select count(*) from public.siklus_verval v where v.paket_id = p_paket_id and v.status in ('DITAHAN', 'PERLU_PERBAIKAN')),
    'tahap4', coalesce((select status from public.tahap4_pengajuan where paket_id = p_paket_id), 'DRAFT'),
    'audit', coalesce((select jsonb_object_agg(a.tingkat::text, a.status) from public.audit a
      where a.paket_id = p_paket_id and a.jenis_survei_id is null), '{}'::jsonb),
    'koreksi_audit_terbuka', (select count(*) from public.kasus_temuan k where k.paket_id = p_paket_id
      and k.tahap_tertahan like 'Audit tingkat %' and k.status <> 'Ditutup'),
    'termin_selesai', (select count(*) from public.termin t where t.paket_id = p_paket_id and t.status = 'Selesai'),
    'termin_total', 4,
    'penerimaan_akhir', exists (select 1 from public.penerimaan_data pd where pd.paket_id = p_paket_id and pd.jenis = 'AKHIR'));
end;
$function$;

-- ---------- grants ----------
revoke all on function app_private.verval_siklus_json(public.siklus_verval) from public, anon, authenticated;
revoke all on function app_private.verval_hasil_terakhir(integer, integer) from public, anon, authenticated;
revoke all on function public.baca_verval_paket(integer) from public, anon;
revoke all on function public.buat_siklus_verval(integer, uuid) from public, anon;
revoke all on function public.simpan_uji_konsistensi_verval(integer, integer, jsonb) from public, anon;
revoke all on function public.ajukan_verval(integer, integer, integer, text) from public, anon;
revoke all on function public.review_verval(integer, integer, integer, text, text) from public, anon;
grant execute on function public.baca_verval_paket(integer) to authenticated;
grant execute on function public.buat_siklus_verval(integer, uuid) to authenticated;
grant execute on function public.simpan_uji_konsistensi_verval(integer, integer, jsonb) to authenticated;
grant execute on function public.ajukan_verval(integer, integer, integer, text) to authenticated;
grant execute on function public.review_verval(integer, integer, integer, text, text) to authenticated;
