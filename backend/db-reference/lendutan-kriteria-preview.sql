begin;

-- Tahap 2E mendaftarkan syarat operasi survei Lendutan daripada KAK 2026.
-- Tiada ambang penerimaan nilai lendutan direka. Semua konfigurasi kekal DRAFT,
-- belum menerima data SMD, dan tidak boleh meluluskan survei secara automatik.

do $block$
declare
  v_lendutan_id integer;
  v_ref_id integer;
  v_parameter_id integer;
  v_item record;
begin
  select jenis_survei_id into v_lendutan_id
  from public.jenis_survei
  where kode = 'LENDUTAN' and aktif is true;

  if v_lendutan_id is null then
    raise exception 'Jenis survei LENDUTAN aktif tidak ditemukan' using errcode = 'P0002';
  end if;

  select referensi_kak_id into v_ref_id
  from public.referensi_kak
  where dokumen = 'Update_KAK_2026_Rev_7552(2).docx'
    and pasal = '11.3 Survei Kekuatan Struktur Perkerasan Jalan Lendutan'
    and tahun_anggaran = 2026;

  if v_ref_id is null then
    select coalesce(max(referensi_kak_id), 0) + 1 into v_ref_id
    from public.referensi_kak;

    insert into public.referensi_kak(referensi_kak_id, dokumen, pasal, tahun_anggaran)
    values (
      v_ref_id,
      'Update_KAK_2026_Rev_7552(2).docx',
      '11.3 Survei Kekuatan Struktur Perkerasan Jalan Lendutan',
      2026
    );
  end if;

  for v_item in
    select * from (values
      ('LENDUTAN_INTERVAL_UJI_KM', 'Interval pengukuran lendutan', 'km',
       'Pengukuran dilakukan setiap 500 meter secara zigzag antara dua lajur berdekatan.',
       'VALIDASI_PRODUKSI', '=', 0.5::numeric, 0.5::numeric),
      ('LENDUTAN_DIAMETER_PLATE_MM', 'Diameter loading plate', 'mm',
       'Berlaku untuk kaedah yang menggunakan loading plate; tidak dipaksakan kepada Benkelman Beam.',
       'KALIBRASI_VALIDASI_AWAL', '=', 300::numeric, 300::numeric),
      ('LENDUTAN_DURASI_BEBAN_MS', 'Durasi pembebanan', 'ms',
       'Durasi pembebanan yang dipersyaratkan KAK ialah 25 hingga 35 milliseconds.',
       'KALIBRASI_VALIDASI_AWAL', 'BETWEEN', 25::numeric, 35::numeric),
      ('LENDUTAN_KALIBRASI_REFERENSI_BULAN', 'Umur maksimum kalibrasi referensi', 'bulan',
       'Kalibrasi referensi tahunan mesti masih berlaku ketika survei dilakukan.',
       'KALIBRASI_VALIDASI_AWAL', '<=', null::numeric, 12::numeric),
      ('LENDUTAN_INTERVAL_REPEATABILITY_HARI', 'Interval maksimum pemeriksaan repeatability', 'hari',
       'Pemeriksaan repeatability diulang setiap 30 hari selama survei.',
       'VALIDASI_PRODUKSI', '<=', null::numeric, 30::numeric)
    ) as x(kode, nama, satuan, keterangan, tahap, operator, nilai_min, nilai_max)
  loop
    select parameter_id into v_parameter_id
    from public.parameter_uji
    where jenis_survei_id = v_lendutan_id and kode = v_item.kode;

    if v_parameter_id is null then
      select coalesce(max(parameter_id), 0) + 1 into v_parameter_id
      from public.parameter_uji;

      insert into public.parameter_uji(
        parameter_id, jenis_survei_id, kode, nama, satuan, keterangan
      ) values (
        v_parameter_id, v_lendutan_id, v_item.kode, v_item.nama,
        v_item.satuan, v_item.keterangan
      );
    else
      update public.parameter_uji
      set nama = v_item.nama,
          satuan = v_item.satuan,
          keterangan = v_item.keterangan
      where parameter_id = v_parameter_id;
    end if;

    insert into public.ambang_batas(
      ambang_id, jenis_survei_id, parameter_id, referensi_kak_id,
      tahap, operator, nilai_min, nilai_max, berlaku_mulai, status
    ) values (
      (select coalesce(max(ambang_id), 0) + 1 from public.ambang_batas),
      v_lendutan_id, v_parameter_id, v_ref_id,
      v_item.tahap, v_item.operator, v_item.nilai_min, v_item.nilai_max,
      null, 'DRAFT'
    )
    on conflict (jenis_survei_id, parameter_id, tahap, status) do update
    set referensi_kak_id = excluded.referensi_kak_id,
        operator = excluded.operator,
        nilai_min = excluded.nilai_min,
        nilai_max = excluded.nilai_max;
  end loop;
end;
$block$;

commit;
