begin;

-- Tahap 2F mendaftarkan aturan operasi Pemeriksaan Jembatan daripada KAK 2026.
-- Angka di bawah ialah pemicu pemilihan/frekuensi pemeriksaan, bukan ambang
-- penerimaan hasil. Semua konfigurasi kekal DRAFT dan keputusan tetap manual.

do $block$
declare
  v_jembatan_id integer;
  v_ref_id integer;
  v_parameter_id integer;
  v_item record;
begin
  select jenis_survei_id into v_jembatan_id
  from public.jenis_survei
  where kode = 'JEMBATAN' and aktif is true;

  if v_jembatan_id is null then
    raise exception 'Jenis survei JEMBATAN aktif tidak ditemukan' using errcode = 'P0002';
  end if;

  select referensi_kak_id into v_ref_id
  from public.referensi_kak
  where dokumen = 'Update_KAK_2026_Rev_7552(2).docx'
    and pasal = '11.4 Survei Jembatan'
    and tahun_anggaran = 2026;

  if v_ref_id is null then
    select coalesce(max(referensi_kak_id), 0) + 1 into v_ref_id
    from public.referensi_kak;

    insert into public.referensi_kak(referensi_kak_id, dokumen, pasal, tahun_anggaran)
    values (
      v_ref_id,
      'Update_KAK_2026_Rev_7552(2).docx',
      '11.4 Survei Jembatan',
      2026
    );
  end if;

  for v_item in
    select * from (values
      ('JEMBATAN_FREKUENSI_SURVEI_TAHUN', 'Frekuensi survei kondisi jembatan', 'kali/tahun',
       'Survei Kondisi Jembatan dilaksanakan satu kali dalam satu tahun.',
       'VALIDASI_PRODUKSI', '=', 1::numeric, 1::numeric),
      ('JEMBATAN_PANJANG_PRIORITAS_M', 'Panjang minimum jembatan prioritas', 'm',
       'Batas enam meter digunakan dalam aturan prioritas jenis pemeriksaan; bukan nilai lulus hasil survei.',
       'VALIDASI_PRODUKSI', '>=', 6::numeric, null::numeric),
      ('JEMBATAN_INTERVAL_DETAIL_TAHUN', 'Interval maksimum pemeriksaan detail', 'tahun',
       'Pemeriksaan Detail dilaksanakan dalam rentang waktu maksimum lima tahun, dengan pemicu tambahan menurut kondisi lapangan.',
       'VALIDASI_PRODUKSI', '<=', null::numeric, 5::numeric),
      ('JEMBATAN_NK_DETAIL_MIN', 'Nilai kondisi pemicu pemeriksaan detail', 'NK',
       'NK 3 atau lebih tinggi menjadi salah satu pemicu Pemeriksaan Detail; keputusan tetap mengikuti konteks dan semakan manual.',
       'VALIDASI_PRODUKSI', '>=', 3::numeric, null::numeric),
      ('JEMBATAN_UMUR_DETAIL_UMUM_TAHUN', 'Umur jembatan umum pemicu pemeriksaan detail', 'tahun',
       'Umur 40 tahun atau lebih menjadi salah satu pemicu Pemeriksaan Detail apabila syarat kondisi terkait dipenuhi.',
       'VALIDASI_PRODUKSI', '>=', 40::numeric, null::numeric),
      ('JEMBATAN_UMUR_DETAIL_BAJA_TAHUN', 'Umur bangunan atas baja pemicu pemeriksaan detail', 'tahun',
       'Umur 30 tahun atau lebih bagi bangunan atas baja menjadi salah satu pemicu Pemeriksaan Detail.',
       'VALIDASI_PRODUKSI', '>=', 30::numeric, null::numeric)
    ) as x(kode, nama, satuan, keterangan, tahap, operator, nilai_min, nilai_max)
  loop
    select parameter_id into v_parameter_id
    from public.parameter_uji
    where jenis_survei_id = v_jembatan_id and kode = v_item.kode;

    if v_parameter_id is null then
      select coalesce(max(parameter_id), 0) + 1 into v_parameter_id
      from public.parameter_uji;

      insert into public.parameter_uji(
        parameter_id, jenis_survei_id, kode, nama, satuan, keterangan
      ) values (
        v_parameter_id, v_jembatan_id, v_item.kode, v_item.nama,
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
      v_jembatan_id, v_parameter_id, v_ref_id,
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
