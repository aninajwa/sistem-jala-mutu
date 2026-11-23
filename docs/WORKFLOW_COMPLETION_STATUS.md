# Status Penyelesaian Jala Mutu

Disusun ulang 2026-11-23 dengan membaca kode di branch `integrasi-backend` (commit `1094da4` + perubahan lokal pada `frontend/src/auth/config.ts`). Klaim di sini berasal dari kode dan test yang dijalankan, **bukan dari catatan lama**.

Tiga hal berbeda:

- **Kode ada** — route/UI tersedia di repo.
- **RPC terpasang** — fungsi sudah ada di database Supabase. Ini tidak diperiksa ulang dalam audit ini; lihat `backend/db-reference/*-applied.sql` untuk yang tercatat terpasang.
- **Terverifikasi E2E** — sudah dicoba login sungguhan di browser dan datanya terbaca kembali. **Belum ada tahap yang tercatat terverifikasi E2E.**

## 1. Peta per tahap

"Server" artinya UI memanggil `/api` dan data tersimpan di Supabase. "Demo lokal" artinya data hanya ada di localStorage browser.

| Tahap | Submodul UI | Frontend (mode login) | Backend + RPC | Gate |
|---|---|---|---|---|
| Login & identitas | — | Server (`AuthGate.tsx`, `/api/me`) | `authenticated_identity_self` | — |
| Paket | `/packages:Ringkasan Paket` | Server: daftar, detail, buat (`CreatePackageDialog`), edit draft, scope survei, amandemen scope, ruas paket | `buat_paket_draft_dengan_scope`, `ubah_paket_draft`, `baca/simpan_scope_survei_kontrak`, `*_pindaan_scope_survei`, `*_ruas_paket` | ruas: `PACKAGE_ROAD_ASSIGNMENT_*` |
| **0** Persiapan | `/entry:Persiapan & SPMK` | Server: checklist, unggah/tautkan PDF, ajukan, review PIC | `baca/simpan_checklist_persiapan`, `tautkan_bukti_persiapan`, `ajukan_persiapan`, `review_persiapan`, dokumen + Storage `dokumen-persiapan` | — |
| **1** Kalibrasi & personel | `/documents:Kalibrasi & personel` | Server (`ServerStage1DirahWorkspace`): tim, alat, personel, kualifikasi, sertifikat, checklist IRI, konfirmasi PIC | `daftar_tim_survei`, `daftar_alat_tim`, `simpan_kalibrasi_alat`, `daftar_personel_tim`, `*_checklist_kalibrasi_iri`, `*_konfirmasi_kalibrasi_tahap1` | IRI: `STAGE1_IRI_*`; konfirmasi: `STAGE1_PIC_CONFIRMATION_*` |
| **2** Validasi produksi | `/entry:Validasi produksi` | Server (`ServerStage2Workspace`): uji coba, seksi, pengukuran, evaluasi IRI, ajukan, review | `simpan_uji_coba*`, `ajukan_uji_coba`, `review_uji_coba`, `*_evaluasi_uji_coba`, `baca_kriteria_uji_coba` | — |
| **3A** Survei harian | `/entry:Survei harian` | Server (`ServerStage3DailyWorkspace`): sesi survei, data segmen, pemeriksaan harian alat | `simpan/baca_sesi_survei`, `simpan/baca_data_segmen`, `*_pemeriksaan_harian_alat_prototype` | — (pemeriksaan harian alat diberi label *prototype*) |
| **3B** Verval 14 hari | `/verification:Verval 14 hari` | Server (`ServerVervalWorkspace`) jika gate aktif | `*_siklus_verval`, `*_uji_konsistensi_verval` | `STAGE3B_PRODUCTION_RPCS` |
| **4** Gerbang RNI/LRS | `/entry:Gerbang RNI/LRS` | Server (`ServerStage4Workspace`) | `baca/simpan_validasi_lrs`, `baca_status_validasi_lrs`, `ajukan/review_validasi_lrs` | `STAGE4_LRS_RPCS`; ajukan/review: `STAGE4_WORKFLOW_RPCS` |
| **5** Audit tingkat 1–3 | `/verification:Audit tingkat 1–3` | **Demo baca saja.** `OperationalWorkflowWorkspace` dengan `serverReadOnly`, nilai tidak berasal dari server, tombol aksi dinonaktifkan | Tidak ada | — |
| **6** Penerimaan & termin | `/reports:Penerimaan & termin` | **Demo baca saja**, seperti Tahap 5 | Tidak ada | — |
| Koreksi | `/actions` | Server (`ServerCorrectionDashboard`) | 10 RPC `*_koreksi`; mutasi belum tentu terpasang | `CORRECTION_PRODUCTION_RPCS` |
| Admin | `/audit` (role Admin) | Server: pengguna, hak akses, jejak aktivitas | `admin_daftar_pengguna`, `admin_daftar_jejak_aktivitas`, RPC penugasan peran | `ADMIN_ROLE_*` |

### Halaman umum (di luar workspace paket)

| Halaman | Sumber data |
|---|---|
| Dashboard `/` | Campuran: `useServerDashboard` (paket + koreksi) dan blok lokal (review per jenis survei). Kartu "Penerimaan akhir" tertulis *Belum tersedia dari server*. Ada banner "Dashboard umum masih pratinjau lokal". |
| Dokumen `/documents` | Untuk PIC: server (`ServerPicDocuments`). Katalog BA/arsip lampiran: lokal (`documentRepository`, `attachmentRepository`). |
| Data Master, Entry, Verifikasi, Kepatuhan, Laporan, Notifikasi | Demo lokal (`useDemoStore`, `demoData.ts`). Penjadwal notifikasi hanya berjalan di mode demo. |

## 2. Konfigurasi lokal saat ini (perhatian)

Nilai di bawah dibaca dari `.env` lokal (bukan template). Nilai rahasia tidak dibaca.

- `backend/.env` dan `frontend/.env` mengarah ke proyek **utama** `vnvknmwcidberkjwtqjx`, bukan Sandbox.
- Gate yang `true`: `STAGE1_IRI_*`, `STAGE1_PIC_CONFIRMATION_*`, `PACKAGE_ROAD_ASSIGNMENT_*`, `STAGE4_LRS_RPCS`.
- Gate yang `false` atau tidak diisi: `STAGE4_WORKFLOW_RPCS`, `STAGE3B_PRODUCTION_RPCS`, `CORRECTION_PRODUCTION_RPCS`, `ADMIN_ROLE_*`.
- Perubahan lokal yang belum di-commit di `frontend/src/auth/config.ts` menambahkan URL proyek utama ke allowlist login. Sebelumnya hanya Sandbox yang diizinkan.

Akibatnya: setiap simpan/ajukan dari dev lokal **menulis ke database utama**.

**Keputusan (2026-11-23):** proyek `Jala-Mutu` (`vnvknmwcidberkjwtqjx`) dipakai untuk pengembangan; Sandbox tidak dipakai. Pemeriksaan baca-saja via Supabase MCP menunjukkan isinya data uji, bukan produksi:

- 8 paket, semuanya bernama `UJIAN …`, `UJI ALUR …`, `PW-TEST-…` atau `JM_E2E_TEST …`, berstatus `DRAFT`.
- 36 akun: admin 1, direktorat 1, pic_balai 33, penyedia_jasa 1. Peran `pimpinan` belum ada di tabel `peran`.
- 51 migrasi terpasang (terakhir `add_authenticated_identity_self`).

### RPC yang dipanggil backend tetapi belum terpasang (17 dari 83)

| Area | RPC hilang | Gate |
|---|---|---|
| Koreksi | `buat_koreksi`, `ubah_koreksi`, `verifikasi_koreksi`, `ajukan_koreksi`, `review_koreksi`, `laksana_koreksi`, `uji_ulang_koreksi`, `tutup_koreksi` | `CORRECTION_PRODUCTION_RPCS` |
| Amandemen scope paket | `ajukan_pindaan_scope_survei`, `baca_pindaan_scope_survei`, `review_pindaan_scope_survei` | **tidak ada gate**, jadi endpoint mengembalikan 503 "Fungsi database … belum tersedia" |
| Tahap 4 | `ajukan_validasi_lrs`, `review_validasi_lrs` | `STAGE4_WORKFLOW_RPCS` |
| Tahap 3B | `buat_siklus_verval`, `simpan_uji_konsistensi_verval` (yang terpasang: `buat_siklus_verval_testqa`) | `STAGE3B_PRODUCTION_RPCS` |
| Tahap 3A | `baca_senarai_pemeriksaan_harian_alat_prototype`, `catat_pemeriksaan_harian_alat_prototype` | — |

Tabel ERD untuk Tahap 5–6 (`audit`, `sampel_audit`, `upload_sistem`, `upload_pesan_validasi`, `berita_acara`, `penandatangan_ba`, `penerimaan_data`, `termin`) dan Koreksi (`kasus_temuan`, `tindakan_perbaikan`, `uji_ulang`, `koreksi_data`, `verifikasi_koreksi`, `riwayat_status_kasus`) sudah ada, tetapi masih kosong. Tabel referensi `aturan_sampling_audit`, `aturan_koreksi` dan `jenis_tindakan` juga kosong.

## 3. Hasil pemeriksaan otomatis (2026-11-23)

| Perintah | Hasil |
|---|---|
| `backend: npm run typecheck` | Lulus |
| `backend: node --test tests/*.test.mjs` | 283/283 lulus setelah perbaikan Fase 1 (sebelumnya 233 lulus / 50 gagal) |
| `frontend: npm run typecheck` | Lulus |
| `frontend: npm run test:domain` | 240/240 lulus |
| `frontend: npm run test:permissions` | 9/9 lulus |
| `frontend: npm run test:auth` | 4/4 lulus |

Ke-50 kegagalan berasal dari test yang tertinggal dari kode. Tidak ada kode route yang diubah. Perbaikan di Fase 1:

- **`tests/api.test.mjs`:**
  - server test sekarang dijalankan dengan gate `CORRECTION_PRODUCTION_RPCS`, `STAGE3B_PRODUCTION_RPCS` dan `STAGE1_PIC_CONFIRMATION_*`;
  - mock ditambah `baca_konfirmasi_kalibrasi_tahap1` (status `DISETUJUI`), yang menjadi syarat Tahap 2/3A;
  - mock pembuatan paket memakai `buat_paket_draft_dengan_scope` + `jenis_survei_ids`;
  - test create Verval memakai kontrak produksi (`request_id`).
- **Test kontrak:**
  - penanda header SQL admin disamakan dengan header baru (`CANDIDATE ONLY; … never in shared databases`);
  - test audit trail menormalkan CRLF (sebelumnya gagal hanya di checkout Windows);
  - test Verval/OpenAPI disesuaikan dengan route produksi yang di-gate.
- **Belum dijalankan:** test unit `backend/src/**/*.test.ts` (tidak masuk `npm test`) dan `tests/admin-role-management-runtime.pg.mjs` (butuh PostgreSQL 17, jalan di CI).

Skrip Playwright frontend (`test:browser`, `test:journey`, dan lainnya) tidak dijalankan.

## 4. Utang teknis yang terlihat di kode

- **Dua jalur UI hidup berdampingan:**
  - jalur demo lokal (`useDemoStore`, `usePackageStore`, `OperationalWorkflowWorkspace`, `PackageDetailPage`);
  - jalur server (`ServerPackageWorkspace` dan `Server*Workspace`).

  `App.tsx` memilih jalurnya berdasarkan `authenticatedRole`.
- **Komponen yang terlalu besar:** `ServerPackageWorkspace.tsx` 1.284 baris, `App.tsx` 617 baris.
- **File cadangan yang ikut ter-commit:** `frontend/src/workflow/OperationalWorkflowWorkspace.tsx.backup-20261015-091606`.
- **`backend/openapi.yaml` (31 path) tidak lengkap** dibanding ~110 handler route. `backend/API-INTEGRASI-FRONTEND.md` juga hanya mencakup sebagian.
- **`backend/migrations/` hanya berisi satu file** (`Migration_4E_4G_QAQC.sql`). Riwayat skema yang sebenarnya tersebar di `db-reference/` dan `proposals/`.

## 5. Dokumen lain dan statusnya

| File | Status |
|---|---|
| `frontend/PANDUAN-LOGIN.md` | **Usang.** Menyebut workspace workflow masih lokal, padahal Tahap 0–4 sudah server-backed. |
| `docs/laporan-v2.1/*` | Laporan historis 5 Nov 2026 (rilis V2.1). Bukan status terkini. |
| `docs/agent-notes/*` | Catatan desain 17 Okt 2026 (sampling, urutan audit, acuan survei). Masih relevan sebagai aturan domain. |
| `docs/specs/*`, `backend/proposals/*.md` | Spesifikasi/rancangan per fitur. Rujuk saat mengerjakan fitur terkait. |
| `docs/admin-sandbox-auth-setup.md` | Panduan menyiapkan akun di Sandbox untuk QA Admin. |
| `backend/API-INTEGRASI-FRONTEND.md` | Sebagian. Kode di `backend/src/routes/` adalah sumber kebenaran. |

## 6. Keputusan yang masih diperlukan (dari kode yang ada)

- **Koreksi:** siapa yang boleh membuat, memverifikasi, mereview dan menutup kasus; transisi status; versi/konkurensi. `backend/proposals/koreksi-rpc-proposal.sql` masih rancangan.
- **Tahap 5–6:** belum ada kontrak RPC, aturan peran, maupun lifecycle sama sekali.
- **Tahap 3B dan Tahap 4 (ajukan/review):** perlu verifikasi RPC di Sandbox sebelum gate dinyalakan.
- **Proyek Supabase untuk pengembangan:** proyek utama atau Sandbox (lihat bagian 2).

## 7. Pembaruan Fase 2 (2026-11-23, branch `integrasi-ui-dirah`)

- **UI:** branch `dirah-fe` sudah digabung (commit `1001daf`). Tampilan memakai desain Dirah, dan semua sambungan server dipasang ulang.
- **Backend:**
  - `GET /api/review-queue` mengembalikan status pengajuan Tahap 0 (persiapan), Tahap 1 (konfirmasi kalibrasi) dan Tahap 2 (uji coba) untuk semua paket yang bisa dibaca pengguna. Paket yang gagal dibaca dilewati dan ditandai `partial: true`.
  - Amandemen scope dikunci dengan gate `PACKAGE_SCOPE_AMENDMENT_RPCS` (default mati) dan punya endpoint `GET /api/paket/:id/scope-amendment-capabilities`.
  - `requireAuth` menyimpan identitas per token selama 15 detik (hanya identitas yang diterima) dan menjalankan dua lookup secara paralel.
  - Timeout klien Supabase naik dari 10 ke 20 detik.
  - Kegagalan upstream dicatat ke log tanpa token.
- **Frontend:**
  - Antrean pemeriksaan PIC/Direktorat/Admin di Beranda, Verifikasi dan Paket diambil dari server.
  - Rail tahap menandai tahap yang selesai menurut server.
  - Panel amandemen scope disembunyikan saat gate mati.
  - Dashboard dan Paket Saya memakai paket server, bukan paket demo.
- **Pengujian:**
  - `npm run test:server-journey` adalah alur Playwright baca-saja untuk login Penyedia dan PIC sampai Tahap 0–4. Kredensial hanya dibaca dari env.
  - Hasil: 3/3 lulus setelah perbaikan di atas.

### Temuan database yang perlu persetujuan

- Beberapa baca kena statement timeout role `authenticated` (8 detik, kode `57014`) saat sekitar 10 request paralel per halaman.
- RPC terberat:

  | RPC | Rata-rata |
  |---|---|
  | `baca_konfirmasi_kalibrasi_tahap1` | ~480 ms |
  | `baca_pengajuan_persiapan` | ~240 ms |
  | `baca_checklist_persiapan` | ~225 ms |

  Penyebabnya policy RLS bertingkat per baris.
- Advisor mencatat 142 foreign key tanpa indeks.
- Perbaikan yang diusulkan (indeks + penyederhanaan policy) adalah migrasi baru, jadi belum dijalankan.
- Migrasi kandidat `backend/proposals/migrations/20261118120000_package_survey_scope_amendment.sql` juga belum dipasang.
