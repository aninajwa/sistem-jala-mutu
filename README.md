# JALA-MUTU — Dashboard QA/QC Survei Jalan

Repo ini berisi dua aplikasi yang dijalankan terpisah:

| Folder | Isi | Teknologi | Port lokal |
|---|---|---|---|
| `frontend/` | Dashboard dan ruang kerja QA/QC | React 19, Vite 7, Tailwind 4 | 5173 |
| `backend/` | REST API | Express 5, TypeScript | 5000 |
| `docs/` | Diagram alur dan catatan implementasi | Markdown, Mermaid | — |

Frontend memakai Supabase Auth untuk login dan mengirim access token sebagai Bearer token ke backend. Backend memeriksa identiti/peranan pengguna dan membaca atau menulis data melalui Supabase. **Tidak semua halaman lama/demo memakai API**; beberapa alur lokal masih menyimpan data di browser. Lihat [status penyelesaian workflow](docs/WORKFLOW_COMPLETION_STATUS.md) sebelum menganggap suatu tahap siap dipakai.

## Prasyarat

- Node.js 20 atau lebih baru untuk frontend.
- Node.js 22 atau lebih baru untuk backend.
- Kredensial proyek QA Supabase yang sesuai. Jangan gunakan service-role/secret key di frontend.

## Menjalankan lokal

Salin fail contoh environment, lalu isi nilai proyek QA yang benar. Jalankan perintah dari root repo.

Terminal 1 — backend:

```bash
cp "backend/.env copy.example" backend/.env
```

Isi `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, dan `DATABASE_URL` di `backend/.env`. Nilai fitur yang berakhiran `_ENABLED`/`_RPCS` hendaklah kekal `false` kecuali kontrak database berkaitan telah disemak, dipasang dan disahkan di QA. Kemudian:

```bash
cd backend
npm install
npm run dev
```

`npm run dev` membina backend kemudian menjalankannya di `http://localhost:5000`. Health check: `http://localhost:5000/api/healthz`.

Terminal 2 — frontend:

```bash
cp frontend/.env.example frontend/.env
```

Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dengan proyek QA yang sama. Template mengarahkan `VITE_API_BASE_URL` ke `http://localhost:5000/api`. Alternatifnya, kosongkan/hapus nilai itu agar frontend memakai `/api` melalui proxy Vite. Jika mengganti alamat API, pastikan path `/api` tetap disertakan. Kemudian:

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173`. Proxy development meneruskan `/api/*` ke `http://localhost:5000` secara default. `VITE_API_PROXY_TARGET` dapat dipakai untuk mengubah alamat tujuan proxy.

## Build

Jalankan dalam folder aplikasi masing-masing:

```bash
cd backend
npm run build
npm start
```

```bash
cd frontend
npm run build
```

Frontend menghasilkan fail statik di `frontend/dist/`; backend menghasilkan `backend/dist/`.

## Status dan batasan penting

- Login Supabase, pemuatan identiti/peranan melalui `/api/me`, senarai/butiran paket, dan beberapa operasi workflow telah mempunyai implementasi server-backed di working tree.
- Keberadaan implementasi atau RPC dalam kontrak belum membuktikan ia berfungsi hujung-ke-hujung pada browser dengan database QA. Status verifikasi dan batas setiap tahap dicatat dalam [dokumen status workflow](docs/WORKFLOW_COMPLETION_STATUS.md).
- Sebahagian fungsi Tahap 1, Tahap 3B, Tahap 4–6 dan pembetulan masih berupa kandidat, read-only, dibatasi feature flag, atau menunggu keputusan aturan bisnis/pemasangan RPC.
- Jangan jalankan `npm run db:push`: skema Drizzle bukan sumber skema aplikasi Supabase dan dinyatakan sebagai placeholder. Perubahan Supabase perlu melalui migrasi yang disemak dan diuji di proyek QA.
- Jangan commit fail `.env` atau masukkan Supabase secret/service-role key ke frontend.

Mode uji pemilihan peranan hanya tersedia dalam development melalui `?testRoles=1`; ia menggunakan alur demo lokal dan bukan autentikasi produksi.

## Susunan repo

- `frontend/src/auth/` — login Supabase dan klien API.
- `frontend/src/pages/` — halaman serta ruang kerja paket server-backed.
- `backend/src/routes/` — route API Express.
- `backend/src/services/` — integrasi Supabase dan polisi feature gate.
- `backend/proposals/` dan `backend/db-reference/` — kandidat SQL/kontrak; fail di sini tidak bermakna migrasi sudah dipasang.
- `docs/` — spesifikasi dan status implementasi.
