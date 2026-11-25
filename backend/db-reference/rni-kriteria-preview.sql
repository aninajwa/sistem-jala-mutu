begin;

-- Tahap 2J mendaftarkan aturan operasi Survei Inventori Jaringan Jalan (RNI).
-- Semua konfigurasi kekal DRAFT dan tidak menggantikan pemeriksaan SMD/LRS.

do $block$
declare
  v_survey_id integer;
  v_ref_id integer;
  v_parameter_id integer;
  v_item record;
begin
  select jenis_survei_id into v_survey_id from public.jenis_survei
  where kode = 'RNI' and aktif is true;
  if v_survey_id is null then
    raise exception 'Jenis survei RNI aktif tidak ditemukan' using errcode = 'P0002';
  end if;

  select referensi_kak_id into v_ref_id from public.referensi_kak
  where dokumen = 'Update_KAK_2026_Rev_7552(2).docx'
    and pasal = '11.9 Survei Inventori Jaringan Jalan (RNI)' and tahun_anggaran = 2026;
  if v_ref_id is null then
    select coalesce(max(referensi_kak_id),0)+1 into v_ref_id from public.referensi_kak;
    insert into public.referensi_kak(referensi_kak_id,dokumen,pasal,tahun_anggaran)
    values(v_ref_id,'Update_KAK_2026_Rev_7552(2).docx','11.9 Survei Inventori Jaringan Jalan (RNI)',2026);
  end if;

  for v_item in select * from (values
    ('RNI_INTERVAL_PEMUTAKHIRAN_TAHUN', 'Interval umum pemutakhiran RNI', 'tahun',
     'Survei deskripsi ruas dan inventori penampang melintang umumnya dilakukan setiap lima tahun atau ketika terdapat perubahan.',
     'VALIDASI_PRODUKSI', '<=', null::numeric, 5::numeric),
    ('RNI_KETELITIAN_JARAK_PERSEN', 'Batas ketelitian pengukuran jarak', '%',
     'Alat ukur jarak mempunyai ketelitian 0.1 persen panjang pengukuran atau lebih baik.',
     'KALIBRASI_VALIDASI_AWAL', '<=', null::numeric, 0.1::numeric),
    ('RNI_AKURASI_GPS_M', 'Batas ketelitian koordinat GPS', 'm',
     'Koordinat diukur dengan ketelitian 6 meter pada sekurang-kurangnya 90 persen waktu pengukuran.',
     'VALIDASI_PRODUKSI', '<=', null::numeric, 6::numeric),
    ('RNI_CAKUPAN_AKURASI_GPS_PERSEN', 'Cakupan minimum ketelitian GPS', '%',
     'Ketelitian GPS 6 meter perlu dicapai pada minimum 90 persen waktu pengukuran.',
     'VALIDASI_PRODUKSI', '>=', 90::numeric, null::numeric),
    ('RNI_INTERVAL_KOORDINAT_M', 'Interval maksimum data koordinat sumbu jalan', 'm',
     'Data koordinat sumbu jalan diserahkan dengan interval tidak lebih daripada 10 meter.',
     'VALIDASI_PRODUKSI', '<=', null::numeric, 10::numeric),
    ('RNI_TOLERANSI_SELISIH_JARAK_M', 'Toleransi selisih pengukuran jarak per ruas', 'm',
     'Kesalahan pengukuran jarak yang ditoleransi ialah 30 meter bagi setiap ruas jalan.',
     'VALIDASI_PRODUKSI', '<=', null::numeric, 30::numeric),
    ('RNI_KETELITIAN_DIMENSI_M', 'Ketelitian pengukuran dimensi inventori', 'm',
     'Lebar penampang dan drainase diukur hingga ketelitian 10 sentimeter.',
     'VALIDASI_PRODUKSI', '<=', null::numeric, 0.1::numeric)
  ) as x(kode,nama,satuan,keterangan,tahap,operator,nilai_min,nilai_max)
  loop
    select parameter_id into v_parameter_id from public.parameter_uji
    where jenis_survei_id=v_survey_id and kode=v_item.kode;
    if v_parameter_id is null then
      select coalesce(max(parameter_id),0)+1 into v_parameter_id from public.parameter_uji;
      insert into public.parameter_uji(parameter_id,jenis_survei_id,kode,nama,satuan,keterangan)
      values(v_parameter_id,v_survey_id,v_item.kode,v_item.nama,v_item.satuan,v_item.keterangan);
    else
      update public.parameter_uji set nama=v_item.nama,satuan=v_item.satuan,keterangan=v_item.keterangan where parameter_id=v_parameter_id;
    end if;
    insert into public.ambang_batas(ambang_id,jenis_survei_id,parameter_id,referensi_kak_id,tahap,operator,nilai_min,nilai_max,berlaku_mulai,status)
    values((select coalesce(max(ambang_id),0)+1 from public.ambang_batas),v_survey_id,v_parameter_id,v_ref_id,v_item.tahap,v_item.operator,v_item.nilai_min,v_item.nilai_max,null,'DRAFT')
    on conflict (jenis_survei_id,parameter_id,tahap,status) do update
    set referensi_kak_id=excluded.referensi_kak_id,operator=excluded.operator,nilai_min=excluded.nilai_min,nilai_max=excluded.nilai_max;
  end loop;
end;
$block$;

commit;
