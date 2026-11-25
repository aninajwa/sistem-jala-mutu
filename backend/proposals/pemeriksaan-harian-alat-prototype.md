# Prototipe pemeriksaan harian alat — TEST/QA sahaja

**Bukan kontrak KAK atau produksi.** DDL/RPC berpasangan ada dalam
`pemeriksaan-harian-alat-prototype.sql`. Jangan jalankan SQL itu terhadap
Supabase aktif atau database bersama.

## Kontrak sementara

| Field | Maksud prototaip |
|---|---|
| `paket_id` | Dari path `:id`; backend tidak menerima nilainya dalam body. |
| `alat_id` | Alat yang ditugaskan kepada tim di paket itu pada tanggal pemeriksaan. |
| `tanggal` | Tanggal kalender pemeriksaan. |
| `item_pemeriksaan` | `GPS`, `BATERAI`, `PENYIMPANAN`, atau `BOUNCE_TEST_KELAS_I`; contoh TEST/QA, bukan senarai rasmi. |
| `hasil_pemeriksaan` | `OK`, `BERMASALAH`, atau `TIDAK_DILAKUKAN`; nilai catatan, bukan lulus/gagal QA/QC. |
| `catatan` | Teks pilihan, maksimum 2000 karakter. |
| `pencatat_id` | Diisi RPC daripada identiti Supabase; tidak boleh ditentukan pemanggil. |

Satu item per alat/paket/tanggal dibenarkan; pengulangan item yang sama pada hari
itu ditolak. Ini andaian kemudahan prototaip. Tiada hubungan ke `sesi_survei` atau
`data_segmen`, tiada kewajiban catatan, dan tiada perubahan status sesi, kelulusan,
gate, BA, atau keputusan QA/QC.

## API prototaip

- `GET /api/paket/:id/pemeriksaan-harian-alat?page=1` — READ berhalaman (50 rekod).
- `POST /api/paket/:id/pemeriksaan-harian-alat` — Penyedia Jasa pemilik paket sahaja.

Contoh body:

```json
{
  "alat_id": 801,
  "tanggal": "2026-05-20",
  "item_pemeriksaan": "GPS",
  "hasil_pemeriksaan": "OK",
  "catatan": "Fixture sintetik TEST/QA"
}
```

## Ujian SQL terasing

Sediakan database PostgreSQL **lokal kosong** bernama `jala_mutu_rpc_test`.
Dari `backend/`, jalankan:

```powershell
./tests/run-survei-rpc-isolated.ps1 -DatabaseUrl 'postgresql://USER@localhost:5432/jala_mutu_rpc_test'
```

Runner menolak host bukan loopback, nama database lain, atau skema fixture
sedia ada. Ia memuat fixture identiti/tim/alat/paket sintetik, memeriksa CREATE,
READ, akses silang, input salah dan duplikasi, kemudian `ROLLBACK` semua DDL serta
data. Jangan ganti URL dengan URL Supabase.

## Andaian yang mesti diganti/disahkan

Sahkan senarai pemeriksaan setiap jenis alat/survei, takrif dan nilai hasil,
apakah ulangan pada hari sama dibenarkan, keperluan bukti/catatan, serta siapa
yang boleh mencatat dan membaca (termasuk Ketua Tim/PIC). Sahkan juga apakah
pemeriksaan terikat pada sesi, tim, atau alat/tanggal; aturan tugas alat bertarikh
di SQL ini ialah semakan scope sementara. Selepas KAK diputuskan, semak semula
nama tabel/kolom, enum/check constraints, kunci duplikasi, scope authorization dan
retensi sebelum membuat migration produksi. Item `BOUNCE_TEST_KELAS_I` khususnya
tidak boleh dianggap terpakai umum.
