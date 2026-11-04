-- Ujian alur positif/negatif data segmen setelah sesi dibuat oleh ujian sebelumnya.
-- Berjalan pada transaksi yang sama; runner membatalkan seluruh perubahan.

do $$ declare
  v_created jsonb;
  v_list jsonb;
  v_detail jsonb;
  v_data_id bigint;
  v_session_id integer := current_setting('jala_test.sesi_id')::integer;
begin
  v_created := public.simpan_data_segmen(301, v_session_id,
    '{"jenis_survei_id":701,"sta_awal":1.25,"sta_akhir":2.5,"lajur":"Sintetik","nilai_utama":42.75,"atribut_detail":{"fixture":"synthetic"},"lat":-6.2,"lon":106.8}'::jsonb);

  if jsonb_typeof(v_created) <> 'object'
     or v_created->>'sesi_id' <> v_session_id::text
     or v_created->>'ruas_id' <> '1001'
     or v_created->>'jenis_survei_id' <> '701'
     or v_created->>'nilai_utama' <> '42.75'
     or v_created->>'status_qc' is not null
     or v_created->>'versi_aktif' is not null then
    raise exception 'FAIL respons simpan data segmen atau relasi hasil: %', v_created;
  end if;
  v_data_id := (v_created->>'data_id')::bigint;

  v_list := public.baca_senarai_data_segmen(301, v_session_id);
  if jsonb_typeof(v_list) <> 'array' or not exists (
    select 1 from jsonb_array_elements(v_list) as a(item)
    where item->>'data_id' = v_data_id::text
      and item->>'sesi_id' = v_session_id::text
      and item->>'ruas_id' = '1001'
      and item->>'jenis_survei_id' = '701'
  ) then
    raise exception 'FAIL respons senarai data segmen / hubungan tidak sepadan: %', v_list;
  end if;

  v_detail := public.baca_data_segmen(301, v_session_id, v_data_id);
  if jsonb_typeof(v_detail) <> 'object'
     or v_detail->>'data_id' <> v_data_id::text
     or v_detail->>'sesi_id' <> v_session_id::text
     or v_detail->>'ruas_id' <> '1001'
     or v_detail->>'jenis_survei_id' <> '701'
     or v_detail->'atribut_detail'->>'fixture' <> 'synthetic' then
    raise exception 'FAIL respons detail data segmen: %', v_detail;
  end if;
end $$;

select app_private.t3a_test_expect_error('42501', 'data segmen untuk paket milik orang lain',
  format('select public.simpan_data_segmen(302, %s, ''{"jenis_survei_id":701,"nilai_utama":1}''::jsonb)', current_setting('jala_test.sesi_id')::integer),
  'Akses ke paket ini ditolak');
select app_private.t3a_test_expect_error('P0002', 'sesi tidak berada dalam paket yang diberikan',
  $$select public.simpan_data_segmen(301, 999, '{"jenis_survei_id":701,"nilai_utama":1}'::jsonb)$$,
  'Sesi survei tidak ditemukan dalam paket ini');
select app_private.t3a_test_expect_error('22023', 'jenis survei tidak cocok dengan sesi',
  format('select public.simpan_data_segmen(301, %s, ''{"jenis_survei_id":702,"nilai_utama":1}''::jsonb)', current_setting('jala_test.sesi_id')::integer),
  'Jenis survei data tidak sama dengan jenis survei sesi');
