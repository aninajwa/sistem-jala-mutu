begin;

-- Tahap 2H mendaftarkan aturan operasi Survei Kondisi Drainase Jalan.
-- Semua konfigurasi kekal DRAFT dan hasil InDrain tidak direka oleh backend.

do $block$
declare
  v_survey_id integer;
  v_ref_id integer;
  v_parameter_id integer;
  v_item record;
begin
  select jenis_survei_id into v_survey_id from public.jenis_survei
  where kode = 'DRAINASE' and aktif is true;
  if v_survey_id is null then
    raise exception 'Jenis survei DRAINASE aktif tidak ditemukan' using errcode = 'P0002';
  end if;

  select referensi_kak_id into v_ref_id from public.referensi_kak
  where dokumen = 'Update_KAK_2026_Rev_7552(2).docx'
    and pasal = '11.6 Survei Kondisi Drainase Jalan' and tahun_anggaran = 2026;
  if v_ref_id is null then
    select coalesce(max(referensi_kak_id), 0) + 1 into v_ref_id from public.referensi_kak;
    insert into public.referensi_kak(referensi_kak_id, dokumen, pasal, tahun_anggaran)
    values (v_ref_id, 'Update_KAK_2026_Rev_7552(2).docx', '11.6 Survei Kondisi Drainase Jalan', 2026);
  end if;

  for v_item in select * from (values
    ('DRAINASE_FREKUENSI_SURVEI_TAHUN', 'Frekuensi inspeksi cepat drainase', 'kali/tahun',
     'Survei kondisi drainase dilaksanakan satu kali dalam satu tahun.',
     'VALIDASI_PRODUKSI', '=', 1::numeric, 1::numeric),
    ('DRAINASE_PERIODE_SURVEI_BULAN', 'Periode pelaksanaan survei drainase', 'bulan kalender',
     'Inspeksi cepat dilaksanakan dalam periode Februari hingga Mei.',
     'VALIDASI_PRODUKSI', 'BETWEEN', 2::numeric, 5::numeric),
    ('DRAINASE_JUMLAH_KATEGORI_KONDISI', 'Jumlah kategori kondisi drainase', 'kategori',
     'InDrain mengklasifikasikan kondisi menjadi sangat baik, baik, sedang, rusak ringan, dan rusak berat.',
     'VALIDASI_PRODUKSI', '=', 5::numeric, 5::numeric)
  ) as x(kode, nama, satuan, keterangan, tahap, operator, nilai_min, nilai_max)
  loop
    select parameter_id into v_parameter_id from public.parameter_uji
    where jenis_survei_id = v_survey_id and kode = v_item.kode;
    if v_parameter_id is null then
      select coalesce(max(parameter_id), 0) + 1 into v_parameter_id from public.parameter_uji;
      insert into public.parameter_uji(parameter_id, jenis_survei_id, kode, nama, satuan, keterangan)
      values (v_parameter_id, v_survey_id, v_item.kode, v_item.nama, v_item.satuan, v_item.keterangan);
    else
      update public.parameter_uji set nama=v_item.nama, satuan=v_item.satuan, keterangan=v_item.keterangan
      where parameter_id=v_parameter_id;
    end if;
    insert into public.ambang_batas(ambang_id, jenis_survei_id, parameter_id, referensi_kak_id, tahap, operator, nilai_min, nilai_max, berlaku_mulai, status)
    values ((select coalesce(max(ambang_id),0)+1 from public.ambang_batas), v_survey_id, v_parameter_id, v_ref_id, v_item.tahap, v_item.operator, v_item.nilai_min, v_item.nilai_max, null, 'DRAFT')
    on conflict (jenis_survei_id, parameter_id, tahap, status) do update
    set referensi_kak_id=excluded.referensi_kak_id, operator=excluded.operator, nilai_min=excluded.nilai_min, nilai_max=excluded.nilai_max;
  end loop;
end;
$block$;

commit;
