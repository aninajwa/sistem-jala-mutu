-- Stage rail facts for Tahap 4-6 and package completion (2026-11-25).
-- 1. Final acceptance (BA Penerimaan AKHIR) marks the package SELESAI.
-- 2. baca_progres_tahap_akhir: one cheap read-only call for the Tahap 4/5/6 rail tiles
--    (no inserts, so it is safe to call on every package page).
-- 3. Backfill: packages that already have a final acceptance become SELESAI.

create or replace function public.baca_progres_tahap_akhir(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
begin
  perform app_private.tahap_akses_baca(p_paket_id);
  return jsonb_build_object(
    'paket_id', p_paket_id,
    'status_paket', (select status from public.paket_kontrak where paket_id = p_paket_id),
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

-- Same body as 20261124020000 plus the package status update for AKHIR.
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
  if v_jenis = 'AKHIR' then
    update public.paket_kontrak set status = 'SELESAI' where paket_id = p_paket_id;
  end if;
  return public.baca_penerimaan(p_paket_id);
end;
$function$;

update public.paket_kontrak p set status = 'SELESAI'
where exists (select 1 from public.penerimaan_data pd where pd.paket_id = p.paket_id and pd.jenis = 'AKHIR');

revoke all on function public.baca_progres_tahap_akhir(integer) from public, anon;
grant execute on function public.baca_progres_tahap_akhir(integer) to authenticated;
