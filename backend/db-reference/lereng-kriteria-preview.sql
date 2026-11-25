begin;

-- Tahap 2G mendaftarkan aturan operasi Survei Kondisi Lereng daripada KAK 2026.
-- Semua konfigurasi kekal DRAFT, belum menerima hasil In-Slope, dan tidak
-- boleh digunakan untuk meluluskan survei secara automatik.

do $block$
declare
  v_lereng_id integer;
  v_ref_id integer;
  v_parameter_id integer;
  v_item record;
begin
  select jenis_survei_id into v_lereng_id
  from public.jenis_survei
  where kode = 'LERENG' and aktif is true;

  if v_lereng_id is null then
    raise exception 'Jenis survei LERENG aktif tidak ditemukan' using errcode = 'P0002';
  end if;

  select referensi_kak_id into v_ref_id
  from public.referensi_kak
  where dokumen = 'Update_KAK_2026_Rev_7552(2).docx'
    and pasal = '11.5 Survei Kondisi Lereng'
    and tahun_anggaran = 2026;

  if v_ref_id is null then
    select coalesce(max(referensi_kak_id), 0) + 1 into v_ref_id
    from public.referensi_kak;

    insert into public.referensi_kak(referensi_kak_id, dokumen, pasal, tahun_anggaran)
    values (
      v_ref_id,
      'Update_KAK_2026_Rev_7552(2).docx',
      '11.5 Survei Kondisi Lereng',
      2026
    );
  end if;

  for v_item in
    select * from (values
      ('LERENG_FREKUENSI_SURVEI_TAHUN', 'Frekuensi survei kondisi lereng', 'kali/tahun',
       'Survei Kondisi Lereng dilaksanakan satu kali dalam satu tahun.',
       'VALIDASI_PRODUKSI', '=', 1::numeric, 1::numeric),
      ('LERENG_PERIODE_SURVEI_BULAN', 'Periode pelaksanaan survei lereng', 'bulan kalender',
       'Survei dilaksanakan dalam periode Februari hingga Oktober.',
       'VALIDASI_PRODUKSI', 'BETWEEN', 2::numeric, 10::numeric),
      ('LERENG_TINGGI_INVENTARISASI_M', 'Tinggi lereng untuk inventarisasi', 'm',
       'Inventarisasi umumnya dilakukan pada lereng lebih dari 5 meter; lereng lebih rendah tetap diperiksa jika terlihat runtuh atau menunjukkan gejala keruntuhan.',
       'VALIDASI_PRODUKSI', '>', 5::numeric, null::numeric),
      ('LERENG_JUMLAH_KATEGORI_RISIKO', 'Jumlah kategori tingkat risiko lereng', 'kategori',
       'Hasil In-Slope mengklasifikasikan risiko menjadi sangat tinggi, tinggi, sedang, dan rendah.',
       'VALIDASI_PRODUKSI', '=', 4::numeric, 4::numeric)
    ) as x(kode, nama, satuan, keterangan, tahap, operator, nilai_min, nilai_max)
  loop
    select parameter_id into v_parameter_id
    from public.parameter_uji
    where jenis_survei_id = v_lereng_id and kode = v_item.kode;

    if v_parameter_id is null then
      select coalesce(max(parameter_id), 0) + 1 into v_parameter_id
      from public.parameter_uji;

      insert into public.parameter_uji(
        parameter_id, jenis_survei_id, kode, nama, satuan, keterangan
      ) values (
        v_parameter_id, v_lereng_id, v_item.kode, v_item.nama,
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
      v_lereng_id, v_parameter_id, v_ref_id,
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
