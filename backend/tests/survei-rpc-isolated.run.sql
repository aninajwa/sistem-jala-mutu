-- Entry point tunggal untuk ujian lokal. Semua DDL, fixture, dan panggilan RPC
-- berlaku dalam satu transaksi dan dibatalkan pada akhir skrip.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name in ('pengguna','peran','pengguna_peran','balai','jenis_survei','paket_kontrak',
        'tim_survei','alat_survei','penugasan_alat','ruas_jalan','anggota_tim','uji_coba','sesi_survei','data_segmen')
  ) then
    raise exception 'Database ujian mesti kosong dari tabel aplikasi Tahap 3A; runner menolak mengubah skema/data yang telah ada';
  end if;
  if to_regclass('app_private.pemeriksaan_harian_alat_prototype') is not null then
    raise exception 'Database ujian mesti kosong dari tabel prototipe pemeriksaan harian alat';
  end if;
end $$;
\ir survei-rpc-fixture.sql
\ir ../proposals/survei-sesi-rpc.sql
\ir ../proposals/data-segmen-rpc.sql
\ir ../proposals/pemeriksaan-harian-alat-prototype.sql
\ir survei-rpc-isolated.test.sql
\ir data-segmen-rpc-isolated.test.sql
\ir pemeriksaan-harian-alat-prototype.test.sql
rollback;
\echo 'OK: assertion selesai; fixture dan proposal Tahap 3A prototipe telah di-rollback.'
