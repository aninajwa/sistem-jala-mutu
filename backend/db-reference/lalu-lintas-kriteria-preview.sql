begin;

-- Tahap 2I mendaftarkan aturan operasi Survei Lalu Lintas daripada KAK 2026.
-- KAK tidak menetapkan perlakuan tepat LHRT = 5000; kes itu kekal manual.

do $block$
declare
  v_survey_id integer;
  v_ref_id integer;
  v_parameter_id integer;
  v_item record;
begin
  select jenis_survei_id into v_survey_id from public.jenis_survei
  where kode = 'LALU_LINTAS' and aktif is true;
  if v_survey_id is null then
    raise exception 'Jenis survei LALU_LINTAS aktif tidak ditemukan' using errcode = 'P0002';
  end if;

  select referensi_kak_id into v_ref_id from public.referensi_kak
  where dokumen = 'Update_KAK_2026_Rev_7552(2).docx'
    and pasal = '11.8 Survei Lalu Lintas' and tahun_anggaran = 2026;
  if v_ref_id is null then
    select coalesce(max(referensi_kak_id), 0) + 1 into v_ref_id from public.referensi_kak;
    insert into public.referensi_kak(referensi_kak_id, dokumen, pasal, tahun_anggaran)
    values (v_ref_id, 'Update_KAK_2026_Rev_7552(2).docx', '11.8 Survei Lalu Lintas', 2026);
  end if;

  for v_item in select * from (values
    ('LALU_LINTAS_DURASI_LHRT_RENDAH_HARI', 'Durasi survei untuk LHRT di bawah 5000', 'hari',
     'Metode 3 x 24 jam digunakan untuk ruas dengan LHRT kurang daripada 5000.',
     'VALIDASI_PRODUKSI', '=', 3::numeric, 3::numeric),
    ('LALU_LINTAS_DURASI_LHRT_TINGGI_HARI', 'Durasi survei untuk LHRT di atas 5000', 'hari',
     'Metode 7 x 24 jam digunakan untuk ruas dengan LHRT lebih daripada 5000; KAK tidak menetapkan kes tepat 5000.',
     'VALIDASI_PRODUKSI', '=', 7::numeric, 7::numeric),
    ('LALU_LINTAS_PEMANTAUAN_AI_HARI', 'Durasi pemantauan AI pengganti survei konvensional', 'hari',
     'Survei konvensional tidak perlu diulang jika lokasi telah dipantau CCTV berbasis AI selama 365 hari pada tahun tersebut.',
     'VALIDASI_PRODUKSI', '=', 365::numeric, 365::numeric),
    ('LALU_LINTAS_FRAME_RATE_MIN_FPS', 'Frame rate minimum kamera', 'fps',
     'Kamera perekam mempunyai frame rate minimum 24 frame per second.',
     'KALIBRASI_VALIDASI_AWAL', '>=', 24::numeric, null::numeric),
    ('LALU_LINTAS_TINGGI_TRIPOD_MIN_M', 'Ketinggian minimum tripod', 'm',
     'Tripod teleskopik mempunyai ketinggian minimum 5 meter.',
     'KALIBRASI_VALIDASI_AWAL', '>=', 5::numeric, null::numeric),
    ('LALU_LINTAS_RESOLUSI_LEBAR_MIN_PX', 'Lebar minimum resolusi rekaman', 'px',
     'Perangkat rekaman mempunyai resolusi minimum 800 x 600 piksel.',
     'KALIBRASI_VALIDASI_AWAL', '>=', 800::numeric, null::numeric),
    ('LALU_LINTAS_RESOLUSI_TINGGI_MIN_PX', 'Tinggi minimum resolusi rekaman', 'px',
     'Perangkat rekaman mempunyai resolusi minimum 800 x 600 piksel.',
     'KALIBRASI_VALIDASI_AWAL', '>=', 600::numeric, null::numeric)
  ) as x(kode, nama, satuan, keterangan, tahap, operator, nilai_min, nilai_max)
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
