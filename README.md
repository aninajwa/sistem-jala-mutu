# JALA-MUTU — Dashboard QA/QC Survei Jalan

Repo ini dipisah menjadi dua aplikasi mandiri:

| Folder | Isi | Stack | Port dev |
|---|---|---|---|
| `frontend/` | Dashboard QA/QC (UI) | React 19, Vite 7, Tailwind 4, Radix UI | 5173 |
| `backend/`  | REST API | Express 5, Drizzle ORM, PostgreSQL, Pino | 5000 |
| `docs/`     | Diagram alur QA/QC (mermaid), catatan domain, logo | – | – |

Masing-masing punya `package.json` sendiri dan **tidak lagi memakai pnpm workspace**
(`workspace:*` dan `catalog:` sudah diganti versi konkret). Bisa pakai npm, pnpm, atau yarn.

## Menjalankan (development)

Terminal 1 — backend:
```bash
cd backend
cp .env.example .env        # isi DATABASE_URL bila perlu
npm install
export $(grep -v '^#' .env | xargs)   # atau set variabel env dengan cara lain
npm run dev                 # http://localhost:5000/api/healthz
```

Terminal 2 — frontend:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Saat development, request `/api/*` dari frontend otomatis di-proxy ke backend
(lihat `server.proxy` di `frontend/vite.config.ts`).

## Build produksi

```bash
cd backend  && npm run build && npm start        # dist/index.mjs
cd frontend && npm run build                     # dist/ (static files)
```

## Status saat ini (penting)

- **Frontend belum memanggil backend untuk workflow.** Data workflow, paket demo,
  sesi demo, notifikasi, bukti, dan periode aktif masih disimpan di `localStorage`
  browser. Autentikasi frontend masih pemilihan peran demo lokal; ini bukan kontrol akses.
- **Backend memiliki API Supabase terbatas** untuk health check, profil/peran,
  daftar Balai/paket, draft paket, checklist persiapan, dan upload/download dokumen.
  API tersebut belum menjadi persistence workflow frontend.
- **Fitur workflow P0 belum memiliki API atau model database backend** untuk transisi
  status/approval, pemilihan dan verifikasi sampel, submit survei, koreksi nilai harian,
  evidence gate Tahap 0/4/5/6, atau periode aktif Tahap 3B. Guard dan data lokal pada
  frontend karena itu tidak memberikan otorisasi atau validasi server-side.
- Skema Drizzle (`backend/src/db/schema`) masih kosong. Migration dan SQL referensi
  memakai tabel `public.*` Supabase/Postgres yang tidak dimodelkan di Drizzle; sebelum
  mengintegrasikan workflow perlu memastikan skema aktual Supabase dan menyiapkan
  migration non-destruktif yang sesuai.

## Perubahan dari repo asli (`aninajwa/jala-mutu-test`)

- `artifacts/road-survey-qaqc` → `frontend/`
- `artifacts/api-server` → `backend/`
- `lib/db` → `backend/src/db/`
- `lib/api-zod` → `backend/src/lib/api-zod/` ; `lib/api-spec/openapi.yaml` → `backend/openapi.yaml`
  (`npm run codegen` di backend meng-generate ulang schema Zod)
- Dibuang: `lib/api-client-react` (tidak dipakai frontend), `artifacts/mockup-sandbox`,
  `scripts/`, `main.py`, `pyproject.toml`, `uv.lock`, `.replit*`, `replit.md`, plugin `@replit/*`,
  semua `patch-*.ps1` / `fix-*.ps1` / `generate-stage1-full.mjs`
- `attached_assets/` (157 MB; PDF materi & PPTX) **tidak dibawa**. Hanya diagram mermaid dan logo
  yang dipindah ke `docs/`.
