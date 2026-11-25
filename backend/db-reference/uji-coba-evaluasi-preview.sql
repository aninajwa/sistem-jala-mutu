begin;

-- Tahap 2C menyimpan hasil evaluasi IRI sebagai PRATINJAU sahaja.
-- Ambang KAK 2026 masih berstatus DRAFT, jadi hasil ini tidak menggantikan
-- keputusan manual PIC Balai dan belum menjadi gate pengajuan.

create unique index if not exists uq_hasil_parameter_konteks
  on public.hasil_parameter(konteks, konteks_id, parameter_id);

create or replace function app_private.baca_evaluasi_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_uji public.uji_coba;
  v_hasil jsonb;
  v_jumlah integer;
  v_semua_lulus boolean;
begin
  perform app_private.ambil_detail_uji_coba(p_paket_id, p_uji_coba_id);

  select * into v_uji
  from public.uji_coba
  where paket_id = p_paket_id
    and uji_coba_id = p_uji_coba_id;

  if not found then
    raise exception 'Uji coba tidak ditemukan' using errcode = 'P0002';
  end if;

  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'hasil_id', hp.hasil_id,
        'parameter_id', pu.parameter_id,
        'kode', pu.kode,
        'nama', pu.nama,
        'satuan', pu.satuan,
        'nilai', hp.nilai,
        'operator', ab.operator,
        'nilai_min', ab.nilai_min,
        'nilai_max', ab.nilai_max,
        'lulus', hp.lulus,
        'dihitung_pada', hp.dihitung_pada
      ) order by pu.parameter_id
    ), '[]'::jsonb),
    count(*)::integer,
    case when count(*) = 4 then bool_and(hp.lulus) else null end
  into v_hasil, v_jumlah, v_semua_lulus
  from public.hasil_parameter hp
  join public.parameter_uji pu on pu.parameter_id = hp.parameter_id
  join public.ambang_batas ab on ab.ambang_id = hp.ambang_id
  where hp.konteks = 'UJI_COBA'
    and hp.konteks_id = p_uji_coba_id
    and pu.jenis_survei_id = v_uji.jenis_survei_id;

  return jsonb_build_object(
    'paket_id', p_paket_id,
    'uji_coba_id', p_uji_coba_id,
    'versi', v_uji.versi,
    'jenis_survei_id', v_uji.jenis_survei_id,
    'hasil', v_hasil,
    'lengkap', v_jumlah = 4,
    'semua_lulus', v_semua_lulus,
    'aturan', jsonb_build_object(
      'mode', 'PRATINJAU_KAK_2026',
      'status_ambang', 'DRAFT',
      'boleh_mengunci_pengajuan', false,
      'keputusan_pic_tetap_manual', true,
      'catatan', 'Nilai A, B, R2 dan CV dimasukkan oleh Penyedia Jasa; backend hanya membandingkan dengan ambang DRAFT.'
    )
  );
end;
$function$;

create or replace function app_private.simpan_evaluasi_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer,
  p_expected_version integer,
  p_hasil jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor integer;
  v_uji public.uji_coba;
  v_item jsonb;
  v_kode text;
  v_nilai numeric;
  v_parameter public.parameter_uji;
  v_ambang public.ambang_batas;
  v_lulus boolean;
  v_seen text[] := array[]::text[];
  v_before jsonb;
  v_result jsonb;
begin
  v_actor := app_private.assert_tahap_kalibrasi(p_paket_id);

  if p_expected_version is null
     or p_expected_version not between 0 and 2147483646 then
    raise exception 'Versi tidak valid' using errcode = '22023';
  end if;

  if jsonb_typeof(p_hasil) <> 'array' or jsonb_array_length(p_hasil) <> 4 then
    raise exception 'Empat parameter IRI wajib dihantar' using errcode = '22023';
  end if;

  select * into v_uji
  from public.uji_coba
  where paket_id = p_paket_id
    and uji_coba_id = p_uji_coba_id
  for update;

  if not found then
    raise exception 'Uji coba tidak ditemukan' using errcode = 'P0002';
  end if;

  if v_uji.status <> 'DRAFT' then
    raise exception 'Evaluasi hanya boleh diubah ketika uji coba masih DRAFT'
      using errcode = '55000';
  end if;

  if v_uji.versi <> p_expected_version then
    raise exception 'Uji coba telah berubah. Baca semula sebelum menyimpan evaluasi'
      using errcode = '40001';
  end if;

  if not exists (
    select 1 from public.jenis_survei js
    where js.jenis_survei_id = v_uji.jenis_survei_id
      and js.kode = 'IRI'
  ) then
    raise exception 'Evaluasi automatik Tahap 2C hanya tersedia untuk IRI'
      using errcode = '22023';
  end if;

  v_before := app_private.baca_evaluasi_uji_coba(p_paket_id, p_uji_coba_id);

  for v_item in select value from jsonb_array_elements(p_hasil)
  loop
    if jsonb_typeof(v_item) <> 'object'
       or not (v_item ? 'kode')
       or not (v_item ? 'nilai')
       or (select count(*) from jsonb_object_keys(v_item)) <> 2
       or jsonb_typeof(v_item -> 'nilai') <> 'number' then
      raise exception 'Bentuk parameter evaluasi tidak valid' using errcode = '22023';
    end if;

    v_kode := v_item ->> 'kode';
    if v_kode not in ('IRI_A', 'IRI_B', 'IRI_R2', 'IRI_CV')
       or v_kode = any(v_seen) then
      raise exception 'Parameter evaluasi tidak valid atau berulang' using errcode = '22023';
    end if;
    v_seen := array_append(v_seen, v_kode);
    v_nilai := (v_item ->> 'nilai')::numeric;

    select * into strict v_parameter
    from public.parameter_uji
    where jenis_survei_id = v_uji.jenis_survei_id
      and kode = v_kode;

    select * into strict v_ambang
    from public.ambang_batas
    where jenis_survei_id = v_uji.jenis_survei_id
      and parameter_id = v_parameter.parameter_id
      and tahap = 'VALIDASI_PRODUKSI'
      and status = 'DRAFT';

    v_lulus := case v_ambang.operator
      when 'BETWEEN' then v_nilai between v_ambang.nilai_min and v_ambang.nilai_max
      when '>=' then v_nilai >= v_ambang.nilai_min
      when '<=' then v_nilai <= v_ambang.nilai_max
      else null
    end;

    if v_lulus is null then
      raise exception 'Operator ambang IRI belum didukung' using errcode = '22023';
    end if;

    insert into public.hasil_parameter(
      konteks, konteks_id, parameter_id, ambang_id, nilai, lulus, dihitung_pada
    ) values (
      'UJI_COBA', p_uji_coba_id, v_parameter.parameter_id,
      v_ambang.ambang_id, v_nilai, v_lulus, localtimestamp
    )
    on conflict (konteks, konteks_id, parameter_id) do update
    set ambang_id = excluded.ambang_id,
        nilai = excluded.nilai,
        lulus = excluded.lulus,
        dihitung_pada = excluded.dihitung_pada;
  end loop;

  update public.uji_coba
  set versi = versi + 1
  where uji_coba_id = p_uji_coba_id;

  v_result := app_private.baca_evaluasi_uji_coba(p_paket_id, p_uji_coba_id);

  insert into public.audit_trail(
    pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu
  ) values (
    v_actor, 'uji_coba', p_uji_coba_id::text, 'SAVE_EVALUASI_UJI_COBA',
    v_before, v_result, localtimestamp
  );

  return v_result;
exception
  when no_data_found or too_many_rows then
    raise exception 'Konfigurasi parameter atau ambang IRI belum lengkap dan unik'
      using errcode = '55000';
end;
$function$;

create or replace function public.baca_evaluasi_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer
)
returns jsonb
language sql
stable
security invoker
set search_path to ''
as $function$
  select app_private.baca_evaluasi_uji_coba(p_paket_id, p_uji_coba_id);
$function$;

create or replace function public.simpan_evaluasi_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer,
  p_expected_version integer,
  p_hasil jsonb
)
returns jsonb
language sql
security invoker
set search_path to ''
as $function$
  select app_private.simpan_evaluasi_uji_coba(
    p_paket_id, p_uji_coba_id, p_expected_version, p_hasil
  );
$function$;

revoke all on function app_private.baca_evaluasi_uji_coba(integer, integer) from public, anon;
revoke all on function app_private.simpan_evaluasi_uji_coba(integer, integer, integer, jsonb) from public, anon;
grant execute on function app_private.baca_evaluasi_uji_coba(integer, integer) to authenticated;
grant execute on function app_private.simpan_evaluasi_uji_coba(integer, integer, integer, jsonb) to authenticated;

revoke all on function public.baca_evaluasi_uji_coba(integer, integer) from public, anon;
revoke all on function public.simpan_evaluasi_uji_coba(integer, integer, integer, jsonb) from public, anon;
grant execute on function public.baca_evaluasi_uji_coba(integer, integer) to authenticated, service_role;
grant execute on function public.simpan_evaluasi_uji_coba(integer, integer, integer, jsonb) to authenticated, service_role;

commit;
