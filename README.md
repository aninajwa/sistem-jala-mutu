# JALA-MUTU — Dashboard QA/QC Survei Kondisi Jalan

Dashboard untuk mengawal mutu (QA/QC) paket kontrak survei kondisi jalan, mengacu KAK SKJ TA 2027 Bab 11.10. Alur kerjanya Tahap 0–6 ditambah Tindakan Perbaikan/Koreksi (diagram di `docs/alur-qaqc/`).

Status setiap tahap — mana yang sudah tersambung ke server dan mana yang masih demo — ada di **[docs/WORKFLOW_COMPLETION_STATUS.md](docs/WORKFLOW_COMPLETION_STATUS.md)**. Dokumen itu disusun dari kode, bukan dari catatan lama.

## Struktur repo

| Folder | Isi | Teknologi |
|---|---|---|
| `frontend/` | SPA dashboard, port 5173 | React 19, Vite 7, Tailwind 4, Radix UI, wouter, React Query, Leaflet, Recharts, `@supabase/supabase-js` |
| `backend/` | REST API di `/api`, port 5000 | Express 5, TypeScript, zod, pino, multer; build dengan esbuild |
| `docs/` | Diagram alur, status, spec, laporan lama | Markdown, Mermaid |
| `.github/workflows/` | CI: test manajemen peran admin pada PostgreSQL 17 sungguhan | GitHub Actions |

## Arsitektur singkat

```
Browser ──login──▶ Supabase Auth
   │  Bearer token
   ▼
Frontend (Vite, proxy /api) ──▶ Backend Express /api
                                   │  requireAuth: /auth/v1/user + RPC authenticated_identity_self
                                   │  zod validation, cek peran, feature gate
                                   ▼
                          Supabase PostgREST RPC  (token pengguna, publishable key)
                          Supabase Storage (bucket private, PDF)
```

- **Backend tidak memakai service-role key.** Semua panggilan ke Supabase memakai token pengguna dan publishable key, jadi otorisasi akhir ada pada RPC (`SECURITY DEFINER`) dan RLS di database.
- **Backend tidak menulis tabel secara langsung.** Semua baca/tulis lewat RPC `/rest/v1/rpc/*` (lihat `backend/src/routes/`).
- **Drizzle hanya placeholder.** `backend/src/db/schema` kosong. **Jangan jalankan `npm run db:push`.**
- Kode SQL ada di tiga tempat:
  - `backend/db-reference/*-applied.sql` — salinan RPC yang tercatat sudah dipasang;
  - `*-preview.sql` / `*-candidate.sql` — belum dipasang;
  - `backend/proposals/` — rancangan, bukan migrasi siap pakai.

## Peran

Peran diambil dari database (`peran` + `penugasan`), bukan dipilih bebas di UI (`frontend/src/auth/identity.ts`).

| Kode DB | Nama di UI | Catatan |
|---|---|---|
| `penyedia_jasa` | Penyedia Jasa / Ketua Tim | Membuat paket, mengisi dan mengajukan setiap tahap |
| `pic_balai` | PIC Balai / Pengguna Jasa | Mereview/menyetujui, membuat master ruas untuk Balai-nya |
| `direktorat` | Direktorat / Pusat | Pemantauan dan audit |
| `pimpinan` | Pimpinan | Hanya daftar 50 paket pertama, baca saja (`LeadershipHome` di `AuthGate.tsx`) |
| `admin` | Admin | Kelola pengguna, peran dan jejak audit. **Ditolak untuk semua penulisan workflow** (`middleware/workflow-write.ts`) |

Akun dengan beberapa peran memilih peran setelah login. Akun yang punya peran admin langsung masuk ke area Admin.

## Menjalankan lokal

Prasyarat: Node.js ≥ 22 untuk backend, Node.js ≥ 20 untuk frontend.

```bash
# Terminal 1 — backend
cp "backend/.env copy.example" backend/.env   # isi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY
cd backend && npm install && npm run dev     # build lalu jalankan di http://localhost:5000
# health check: http://localhost:5000/api/healthz

# Terminal 2 — frontend
cp frontend/.env.example frontend/.env       # isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY (proyek yang sama)
cd frontend && npm install && npm run dev    # http://localhost:5173, /api diproxy ke :5000
```

### Proyek Supabase yang diizinkan

- **Frontend** hanya menerima dua URL (`frontend/src/auth/config.ts`):
  - Jala-Mutu utama: `vnvknmwcidberkjwtqjx`;
  - Jala-Mutu-Admin-Sandbox: `yehwlrlbtcxtlogenahw`.

  Secret atau service-role key ditolak.
- **Backend** dengan `ADMIN_SANDBOX_QA=true` akan menolak start kecuali `SUPABASE_URL` adalah Sandbox (`backend/src/config/supabase.ts`).
- Pengembangan memakai proyek `Jala-Mutu`. Isinya saat ini data uji (lihat dokumen status), tetapi penulisan dari lokal tetap mengubah database bersama itu.

### Feature gate backend

Gate di bawah ini fail-closed: kalau nilainya tidak `true`, endpoint terkait mengembalikan 503. Nyalakan hanya setelah RPC terkait terpasang dan diverifikasi.

| Variabel | Membuka |
|---|---|
| `STAGE1_IRI_CHECKLIST_ENABLED`, `STAGE1_IRI_PROJECT_DRAFT_ACCEPTED`, `STAGE1_IRI_AUTHORIZATION_CONTRACT_INSTALLED` | Checklist kalibrasi IRI Tahap 1 (ketiganya harus `true`) |
| `STAGE1_PIC_CONFIRMATION_ENABLED`, `_APPROVED`, `_AUTHORIZATION_INSTALLED` | Pengajuan/review konfirmasi kalibrasi Tahap 1 |
| `PACKAGE_ROAD_ASSIGNMENT_ENABLED`, `_APPROVED`, `_AUTHORIZATION_INSTALLED` | Penetapan ruas jalan ke paket |
| `STAGE3B_PRODUCTION_RPCS` | Siklus Verval 14 hari (Tahap 3B): buka siklus, uji konsistensi, ajukan BA, review PIC. Butuh migrasi `20261125020000` |
| `STAGE4_LRS_RPCS` | Baca/simpan validasi LRS Tahap 4 |
| `STAGE4_WORKFLOW_RPCS` | Ajukan/review Tahap 4. Butuh migrasi `20261124020000` |
| `AUDIT_ACCEPTANCE_RPCS` | Catatan upload ke SMD/INVI-J/InSlope/InDrain, Audit berjenjang (Tahap 5), Termin dan penerimaan (Tahap 6). Butuh migrasi `20261124020000` |
| `CORRECTION_PRODUCTION_RPCS` | Semua endpoint Koreksi |
| `PACKAGE_SCOPE_AMENDMENT_RPCS` | Penambahan jenis survei (pindaan scope). Butuh migrasi `20261118120000`. Saat mati, panel disembunyikan |
| `ADMIN_ROLE_READS_ENABLED`, `ADMIN_ROLE_MANAGEMENT_ENABLED` | Baca/ubah penugasan peran oleh Admin |

Di frontend, `VITE_ADMIN_ROLE_MUTATIONS_ENABLED` menampilkan aksi ubah peran.

### Mode demo

`?testRoles=1` (atau `VITE_ENABLE_ROLE_TESTING=true`) hanya berjalan di `npm run dev`. Mode ini melewati login dan memakai paket demo `PAKET-DEMO-00x` yang disimpan di browser. Tidak ada yang dikirim ke server.

## Test

```bash
cd backend
npm run typecheck   # tsc
npm test            # build + node --test tests/*.test.mjs (Supabase di-mock)

cd frontend
npm run typecheck
npm run test:domain       # aturan workflow, adapter server, dashboard
npm run test:permissions  # vitest: matriks izin
npm run test:auth
# test:browser, test:journey, test:login, dll. = skrip Playwright (butuh app berjalan)
```

Hasil terakhir (2026-11-23): kedua typecheck lulus, test backend 283/283 lulus, dan test unit frontend lulus.

## Aturan penting

- Jangan commit `.env`. Jangan taruh secret/service-role key di frontend.
- Jangan jalankan `npm run db:push`.
- Perubahan database dilakukan lewat migrasi SQL yang sudah direview, diuji dulu di Sandbox/branch terisolasi, baru dipasang.
- Jangan nyalakan feature gate hanya karena kodenya sudah ada. RPC-nya harus terpasang dan terverifikasi.
