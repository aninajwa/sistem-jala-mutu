-- berita_acara.nomor is UNIQUE across the whole database. A reused BA number used to pass at
-- submission time and only fail later (PIC accept / decision / acceptance) with a generic 23505,
-- leaving the record stuck. Check availability up front with a clear message instead.

create or replace function app_private.assert_nomor_ba_tersedia(p_nomor text)
returns void language plpgsql stable security definer set search_path = ''
as $function$
begin
  if exists (select 1 from public.berita_acara where nomor = btrim(p_nomor)) then
    raise exception 'Nomor BA % sudah dipakai. Gunakan nomor BA lain', btrim(p_nomor) using errcode = '22023';
  end if;
end;
$function$;
revoke all on function app_private.assert_nomor_ba_tersedia(text) from public, anon, authenticated;

-- Verval: check when the Penyedia submits (the BA is inserted when the PIC accepts).
create or replace function public.ajukan_verval(p_paket_id integer, p_siklus_id integer, p_expected_version integer, p_nomor_ba text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare a jsonb; c public.siklus_verval; v_missing integer; v_bad integer;
begin
  a := app_private.koreksi_aktor(p_paket_id);
  if not (a->>'penyedia')::boolean then raise exception 'Hanya Penyedia Jasa boleh mengajukan BA Verval' using errcode = '42501'; end if;
  if btrim(coalesce(p_nomor_ba, '')) = '' then raise exception 'Nomor BA Verval 2-Mingguan wajib diisi' using errcode = '22023'; end if;
  perform app_private.assert_nomor_ba_tersedia(p_nomor_ba);
  if exists (select 1 from public.siklus_verval s where s.paket_id = p_paket_id and s.siklus_id <> p_siklus_id and s.nomor_ba = btrim(p_nomor_ba)) then
    raise exception 'Nomor BA % sudah dipakai siklus lain. Gunakan nomor BA lain', btrim(p_nomor_ba) using errcode = '22023';
  end if;
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

-- Audit: check when the auditor saves the BA number (the BA is inserted on "Lulus").
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
  if btrim(coalesce(p_data->>'ba_number', '')) <> '' then
    perform app_private.assert_nomor_ba_tersedia(p_data->>'ba_number');
    if exists (select 1 from public.audit x where x.audit_id <> r.audit_id and x.detail->>'ba_number' = btrim(p_data->>'ba_number')) then
      raise exception 'Nomor BA % sudah dipakai audit lain. Gunakan nomor BA lain', btrim(p_data->>'ba_number') using errcode = '22023';
    end if;
  end if;
  update public.audit set status = 'Dalam Review', versi = versi + 1, tanggal = current_date, auditor_id = (a->>'pengguna_id')::integer,
    persen_sampel_realisasi = case when p_tingkat = 1 then 100 else nullif(p_data->>'persen_sampel_realisasi', '')::numeric end,
    alasan_penolakan = null,
    detail = detail || jsonb_strip_nulls(jsonb_build_object('checklist', p_data->'checklist', 'ba_number', btrim(p_data->>'ba_number'), 'catatan', p_data->>'catatan'))
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

-- Acceptance: catat_penerimaan inserts the BA immediately, so a clear pre-check is enough.
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
  perform app_private.assert_nomor_ba_tersedia(p_data->>'nomor_ba');
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
  if v_jenis = 'AKHIR' then
    update public.paket_kontrak set status = 'SELESAI' where paket_id = p_paket_id;
  end if;
  return public.baca_penerimaan(p_paket_id);
end;
$function$;
