-- Ujian prototaip sahaja. Dipanggil dalam transaksi terasing; runner rollback.
do $$ declare v_created jsonb; v_list jsonb; begin
  v_created := public.catat_pemeriksaan_harian_alat_prototype(
    301, 801, date '2026-05-20', 'GPS', 'OK', 'Fixture sintetik sahaja'
  );
  if v_created->>'paket_id' <> '301'
    or v_created->>'alat_id' <> '801'
    or v_created->>'pencatat_id' <> '101'
    or v_created->>'item_pemeriksaan' <> 'GPS'
    or v_created->>'hasil_pemeriksaan' <> 'OK' then
    raise exception 'FAIL respons pemeriksaan prototype tidak mengikat actor/paket/alat: %', v_created;
  end if;

  v_list := public.baca_senarai_pemeriksaan_harian_alat_prototype(301, 1);
  if jsonb_typeof(v_list) <> 'array' or not exists (
    select 1 from jsonb_array_elements(v_list) as r(item)
    where item->>'pemeriksaan_id' = v_created->>'pemeriksaan_id'
      and item->>'paket_id' = '301'
  ) then
    raise exception 'FAIL READ pemeriksaan prototype tidak memuat rekod: %', v_list;
  end if;
end $$;

select app_private.t3a_test_expect_error('23505', 'duplikasi alat/item/tanggal',
  $$select public.catat_pemeriksaan_harian_alat_prototype(301,801,date '2026-05-20','GPS','OK',null)$$,
  'sudah dicatat');
select app_private.t3a_test_expect_error('42501', 'paket milik pengguna lain',
  $$select public.catat_pemeriksaan_harian_alat_prototype(302,801,date '2026-05-20','GPS','OK',null)$$,
  'Akses ke paket ini ditolak');
select app_private.t3a_test_expect_error('22023', 'alat tidak ditugaskan pada paket',
  $$select public.catat_pemeriksaan_harian_alat_prototype(301,802,date '2026-05-20','GPS','OK',null)$$,
  'Alat tidak ditugaskan');
select app_private.t3a_test_expect_error('22023', 'item tidak dibenarkan',
  $$select public.catat_pemeriksaan_harian_alat_prototype(301,801,date '2026-05-20','KAMERA','OK',null)$$);
select app_private.t3a_test_expect_error('P0002', 'READ paket luar scope',
  $$select public.baca_senarai_pemeriksaan_harian_alat_prototype(999,1)$$);
