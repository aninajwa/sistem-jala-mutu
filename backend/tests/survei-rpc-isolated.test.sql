-- Isi ujian runtime. Dipanggil oleh survei-rpc-isolated.run.sql dalam satu transaksi.
-- Seluruh perubahan fixture/proposal/data akan di-rollback oleh runner.
create or replace function app_private.t3a_test_expect_error(p_code text, p_label text, p_statement text, p_message text default null)
returns void language plpgsql as $$
declare v_code text; v_message text;
begin
  begin
    execute p_statement;
  exception when others then
    get stacked diagnostics v_code = returned_sqlstate, v_message = message_text;
    if v_code = p_code and (p_message is null or position(p_message in v_message) > 0) then return; end if;
    if v_code = p_code then
      raise exception 'FAIL %: SQLSTATE benar (%), tetapi pesan tak mengandung "%"; aktual: %', p_label, p_code, p_message, v_message;
    end if;
    raise exception 'FAIL %: diharapkan SQLSTATE %, mendapat %', p_label, p_code, v_code;
  end;
  raise exception 'FAIL %: seharusnya gagal dengan SQLSTATE %', p_label, p_code;
end $$;
grant execute on function app_private.t3a_test_expect_error(text,text,text,text) to authenticated;

set local role authenticated;

-- Auth user synthetic yang memiliki paket 301.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);

-- Persetujuan Tahap 2 tepat: insert berjaya dan hasil ialah objek JSON sesi.
do $$ declare v_result jsonb; begin
  v_result := public.simpan_sesi_survei(301,
    '{"tim_id":601,"ruas_id":1001,"alat_id":801,"tanggal":"2026-05-20"}'::jsonb);
  if jsonb_typeof(v_result) <> 'object' or v_result->>'paket_id' <> '301'
     or v_result->>'tim_id' <> '601' or v_result->>'alat_id' <> '801'
     or v_result->>'ruas_id' <> '1001' or v_result->>'tanggal' <> '2026-05-20' then
    raise exception 'FAIL kontrak respons RPC sukses: %', v_result;
  end if;
  perform set_config('jala_test.sesi_id', v_result->>'sesi_id', true);
end $$;

do $$ declare v_list jsonb; v_detail jsonb; v_session_id integer; begin
  v_session_id := current_setting('jala_test.sesi_id')::integer;
  v_list := public.baca_senarai_sesi_survei(301);
  if jsonb_typeof(v_list) <> 'array' then
    raise exception 'FAIL kontrak respons RPC list: %', v_list;
  end if;
  if not exists (
    select 1 from jsonb_array_elements(v_list) as a(item)
    where item->>'sesi_id' = v_session_id::text
  ) then
    raise exception 'FAIL list tidak memuat sesi yang baru dibuat: %', v_list;
  end if;
  v_detail := public.baca_sesi_survei(301, v_session_id);
  if jsonb_typeof(v_detail) <> 'object' or (v_detail->>'sesi_id')::integer <> v_session_id
     or v_detail->>'paket_id' <> '301' or v_detail->>'tim_id' <> '601'
     or v_detail->>'alat_id' <> '801' or v_detail->>'ruas_id' <> '1001' then
    raise exception 'FAIL kontrak respons RPC detail: %', v_detail;
  end if;
end $$;

select set_config('request.jwt.claim.sub', '', true);
select app_private.t3a_test_expect_error('42501', 'tanpa login',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":801,"tanggal":"2026-05-20"}'::jsonb)$$);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
select app_private.t3a_test_expect_error('42501', 'paket milik pengguna lain',
  $$select public.simpan_sesi_survei(302, '{"tim_id":601,"ruas_id":1001,"alat_id":801,"tanggal":"2026-05-20"}'::jsonb)$$);

select app_private.t3a_test_expect_error('55000', 'Tahap 2 belum DISETUJUI',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":804,"tanggal":"2026-05-20"}'::jsonb)$$,
  'Uji coba untuk tim, jenis survei, alat dan ruas ini belum disetujui');

select app_private.t3a_test_expect_error('22023', 'alat dari penyedia lain',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":802,"tanggal":"2026-05-20"}'::jsonb)$$);
select app_private.t3a_test_expect_error('22023', 'alat jenis survei lain',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":803,"tanggal":"2026-05-20"}'::jsonb)$$);
select app_private.t3a_test_expect_error('22023', 'tim tidak berada dalam paket',
  $$select public.simpan_sesi_survei(301, '{"tim_id":999,"ruas_id":1001,"alat_id":801,"tanggal":"2026-05-20"}'::jsonb)$$);
select app_private.t3a_test_expect_error('22023', 'ruas bukan milik balai paket',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1002,"alat_id":801,"tanggal":"2026-05-20"}'::jsonb)$$);

select app_private.t3a_test_expect_error('22023', 'tanggal wajib',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":801}'::jsonb)$$);
select app_private.t3a_test_expect_error('22023', 'ID pecahan',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601.5,"ruas_id":1001,"alat_id":801,"tanggal":"2026-05-20"}'::jsonb)$$);
select app_private.t3a_test_expect_error('22023', 'nilai tanggal tidak valid',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":801,"tanggal":"2026-02-30"}'::jsonb)$$);
select app_private.t3a_test_expect_error('22023', 'jam invalid',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":801,"tanggal":"2026-05-20","jam_mulai":"25:00"}'::jsonb)$$);
select app_private.t3a_test_expect_error('22023', 'teks bukan string',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":801,"tanggal":"2026-05-20","lajur":42}'::jsonb)$$);
select app_private.t3a_test_expect_error('22023', 'kolom tambahan tidak dibenarkan',
  $$select public.simpan_sesi_survei(301, '{"tim_id":601,"ruas_id":1001,"alat_id":801,"tanggal":"2026-05-20","status":"SELESAI"}'::jsonb)$$);
