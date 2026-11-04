-- Entry point tunggal untuk ujian lokal. Semua DDL, fixture, dan panggilan RPC
-- berlaku dalam satu transaksi dan dibatalkan pada akhir skrip.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name in ('pengguna','paket_kontrak','tim_survei','alat_survei','penugasan_alat',
        'ruas_jalan','uji_coba','sesi_survei','jenis_survei','data_segmen')
  ) then
    raise exception 'Database ujian mesti kosong dari tabel aplikasi Tahap 3A; runner menolak mengubah skema/data yang telah ada';
  end if;
end $$;
\ir survei-rpc-fixture.sql
\ir ../proposals/survei-sesi-rpc.sql
\ir ../proposals/data-segmen-rpc.sql
\ir survei-rpc-isolated.test.sql
\ir data-segmen-rpc-isolated.test.sql
rollback;
\echo 'OK: assertion selesai; fixture, kedua proposal, sesi, dan data segmen telah di-rollback.'
