# Jala Mutu — Panduan Integrasi Frontend dengan Backend

**Status:** Draf dokumentasi integrasi (21 Oktober 2026)  
**Sasaran:** Dirah (React/Vite), Afeeq & Anin (Express/TypeScript)  
**Sumber:** Deklarasi route dan konfigurasi backend yang dibagikan dalam sesi, serta respons Postman yang telah diuji.  
**Penting:** Kewujudan route tidak bermaksud endpoint sudah diuji sepenuhnya atau siap untuk production.

## 1. Konfigurasi development

| Komponen | Alamat |
|---|---|
| React/Vite (lokal) | `http://localhost:5173` |
| Express API (lokal) | `http://localhost:5000/api` |
| Health check | `http://localhost:5000/api/healthz` |

CORS backend menggunakan `FRONTEND_ORIGIN` dengan default `http://localhost:5173`.

**Komputer berbeza:** `localhost` merujuk kepada komputer masing-masing. Jika Dirah menjalankan frontend pada komputernya, backend perlu dijalankan pada komputer Dirah juga, atau gunakan alamat backend yang boleh dicapai melalui rangkaian/deployment. URL `localhost:5000` di komputer Dirah **tidak** mengakses backend di komputer Afeeq.

Contoh environment variable yang *dicadangkan* untuk Vite (belum disahkan wujud dalam projek frontend):

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://vnvknmwcidberkjwtqjx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Nama `VITE_*` perlu dipadankan dengan kod frontend sebenar. **Jangan masukkan Supabase secret key/service role key ke frontend atau commit fail `.env` yang mengandungi rahsia.**

## 2. Authentication

- `GET /api/healthz` tidak memerlukan login.
- Route lain di bawah `paketRouter` menggunakan middleware `requireAuth`.
- Backend mengharapkan header `Authorization: Bearer <access_token>` daripada Supabase Auth.
- Middleware menyemak token melalui Supabase `/auth/v1/user`, mendapatkan profil daripada `pengguna`, serta peranan dan penugasan yang boleh dibaca pengguna.
- Login React yang ditunjukkan sebelum ini masih berbentuk pratinjau peranan/dummy. **Login Supabase sebenar belum disahkan terintegrasi.**
- `@supabase/supabase-js` belum disenaraikan dalam `frontend/package.json` yang diperiksa.

Contoh request React **selepas** frontend memperoleh `access_token` melalui Supabase Auth:

```ts
const response = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const result = await response.json();
```

Jangan gunakan role yang dipilih sendiri pada UI sebagai bukti hak akses. Gunakan peranan yang dipulangkan backend dan pastikan backend tetap menguatkuasakan autorisasi.

## 3. Inventori endpoint

**Prefix semua route:** `/api`. `:id`, `:timId`, dan sebagainya ialah parameter URL yang perlu diganti dengan ID sebenar.

### Kesihatan, pengguna dan paket

| Method | Laluan relatif kepada `/api` | Kegunaan |
|---|---|---|
| GET | `/healthz` | Semak server |
| GET | `/me` | Profil, peranan, penugasan pengguna login |
| GET | `/balai` | Senarai balai |
| GET | `/paket` | Senarai paket; pernah diuji dengan `page` dan `page_size` |
| POST | `/paket` | Cipta paket |
| GET | `/paket/:id` | Detail paket |
| PATCH | `/paket/:id` | Kemas kini paket |

### Persiapan

| Method | Laluan relatif kepada `/api` | Kegunaan |
|---|---|---|
| GET | `/paket/:id/ringkasan-persiapan` | Ringkasan persiapan |
| GET | `/paket/:id/checklist-persiapan` | Baca checklist |
| PATCH | `/paket/:id/checklist-persiapan` | Kemas kini checklist |
| PATCH | `/paket/:id/checklist-persiapan/bukti` | Kemas kini bukti checklist |
| GET | `/paket/:id/pengajuan-persiapan` | Baca pengajuan |
| POST | `/paket/:id/pengajuan-persiapan` | Hantar pengajuan |
| POST | `/paket/:id/pengajuan-persiapan/review` | Review pengajuan; kod yang diperiksa menyekat kepada `pic_balai` |

### Dokumen

| Method | Laluan relatif kepada `/api` | Kegunaan |
|---|---|---|
| GET | `/jenis-dokumen` | Senarai jenis dokumen |
| GET | `/paket/:id/dokumen` | Senarai dokumen paket |
| GET | `/paket/:id/dokumen/:dokumenId` | Detail dokumen |
| POST | `/paket/:id/dokumen` | Upload dokumen |
| POST | `/paket/:id/dokumen/:dokumenId/versi` | Upload versi baharu |
| GET | `/paket/:id/dokumen/:dokumenId/download` | Download dokumen |
| GET | `/paket/:id/dokumen/:dokumenId/versi/:versi/download` | Download versi tertentu |

### Kalibrasi asas, tim dan alat

| Method | Laluan relatif kepada `/api` | Kegunaan |
|---|---|---|
| GET | `/jenis-survei` | Senarai jenis survei |
| GET | `/penyedia` | Senarai penyedia |
| POST | `/penyedia` | Cipta penyedia |
| GET | `/paket/:id/tim` | Senarai tim survei |
| POST | `/paket/:id/tim` | Tambah tim |
| GET | `/paket/:id/tim/:timId/alat` | Senarai alat tim |
| POST | `/paket/:id/tim/:timId/alat` | Tambah alat |

### Rekod kalibrasi

| Method | Laluan relatif kepada `/api` | Kegunaan |
|---|---|---|
| GET | `/paket/:id/kalibrasi-alat` | Senarai kalibrasi |
| GET | `/paket/:id/kalibrasi-alat/:kalibrasiId` | Detail kalibrasi |
| POST | `/paket/:id/kalibrasi-alat` | Tambah kalibrasi |
| PATCH | `/paket/:id/kalibrasi-alat/:kalibrasiId` | Kemas kini kalibrasi |
| POST | `/paket/:id/kalibrasi-alat/:kalibrasiId/sertifikat` | Upload sertifikat |
| GET | `/paket/:id/kalibrasi-alat/:kalibrasiId/sertifikat/download` | Download sertifikat |
| GET | `/paket/:id/kalibrasi-alat/:kalibrasiId/sertifikat/versi/:versi/download` | Download versi sertifikat |

### Personel dan kualifikasi

| Method | Laluan relatif kepada `/api` | Kegunaan |
|---|---|---|
| GET | `/paket/:id/tim/:timId/personel` | Senarai personel |
| POST | `/paket/:id/tim/:timId/personel` | Tambah personel |
| GET | `/paket/:id/tim/:timId/personel/:personelId/kualifikasi` | Senarai kualifikasi |
| POST | `/paket/:id/tim/:timId/personel/:personelId/kualifikasi` | Tambah kualifikasi |
| GET | `/paket/:id/tim/:timId/personel/:personelId/kualifikasi/:kualifikasiId/bukti` | Senarai bukti kualifikasi |
| POST | `/paket/:id/tim/:timId/personel/:personelId/kualifikasi/:kualifikasiId/bukti` | Upload bukti |
| GET | `/paket/:id/tim/:timId/personel/:personelId/kualifikasi/:kualifikasiId/bukti/download` | Download bukti |
| GET | `/paket/:id/tim/:timId/personel/:personelId/kualifikasi/:kualifikasiId/bukti/versi/:versi/download` | Download versi bukti |

### Uji Coba — Tahap 2

| Method | Laluan relatif kepada `/api` | Kegunaan |
|---|---|---|
| GET | `/paket/:id/uji-coba` | Senarai uji coba |
| POST | `/paket/:id/uji-coba` | Cipta uji coba |
| GET | `/paket/:id/uji-coba/:ujiCobaId` | Detail uji coba dan data berkaitan |
| POST | `/paket/:id/uji-coba/:ujiCobaId/seksi` | Tambah seksi |
| POST | `/paket/:id/uji-coba/:ujiCobaId/seksi/:seksiId/pengukuran` | Tambah pengukuran |
| GET | `/paket/:id/uji-coba/:ujiCobaId/evaluasi` | Baca pratinjau evaluasi parameter IRI |
| POST | `/paket/:id/uji-coba/:ujiCobaId/evaluasi` | Simpan A, B, R² dan CV untuk dibandingkan dengan ambang DRAFT KAK 2026 |
| GET | `/paket/:id/uji-coba/:ujiCobaId/pengajuan` | Baca status, versi, snapshot pengajuan, dan keputusan PIC |
| POST | `/paket/:id/uji-coba/:ujiCobaId/pengajuan` | Penyedia mengajukan uji coba DRAFT yang sudah mempunyai seksi dan pengukuran |
| POST | `/paket/:id/uji-coba/:ujiCobaId/pengajuan/review` | PIC Balai memberi keputusan `PERLU_REVISI` atau `DISETUJUI` |

Semakan Tahap 2 masih manual. Endpoint evaluasi hanya menghasilkan **pratinjau** perbandingan empat parameter IRI dengan ambang KAK 2026 yang masih berstatus `DRAFT`; pratinjau tidak mengunci pengajuan dan tidak menggantikan keputusan PIC. Nilai statistik dimasukkan oleh Penyedia Jasa dan belum dikira daripada data mentah oleh backend. Jika keputusan `PERLU_REVISI`, rekod percobaan lama kekal sebagai sejarah dan Penyedia membuat uji coba baharu dengan `percobaan_ke` seterusnya.

**Belum tersedia/disahkan untuk alur Tahap 2:** berita acara dan kelulusan automatik. Jangan paparkan sebagai fungsi siap.

## 4. Respons sebenar yang sudah diuji

### `GET /api/healthz`

```json
{"status":"ok"}
```

### `GET /api/me` — akaun ujian `penyedia.jasa`

Contoh ringkas daripada respons sebenar (ID Auth dan email tidak diperlukan untuk contoh integrasi):

```json
{
  "data": {
    "pengguna_id": 3,
    "username": "penyedia.jasa",
    "terkunci": false,
    "peran": [{ "peran_id": 3, "nama": "penyedia_jasa" }],
    "penugasan": [
      { "peran_id": 3, "scope_balai_id": null, "scope_paket_id": null }
    ]
  }
}
```

**Nota:** Respons sebenar turut mengandungi `auth_user_id` dan `email`; kedua-duanya sengaja tidak ditunjukkan dalam contoh ringkas ini.

### `GET /api/paket?page=1&page_size=50` — akaun ujian `penyedia.jasa`

```json
{
  "data": [
    {
      "paket_id": 3,
      "nama_paket": "UJIAN - Survei Jalan DKI Jakarta-Jawa Barat",
      "nomor_kontrak": "UJIAN-2026-001",
      "tahun_anggaran": 2026,
      "balai_id": 1,
      "status": "DRAFT",
      "created_by": 3,
      "created_at": "2026-10-17T08:46:35.029477+00:00"
    }
  ],
  "page": 1,
  "page_size": 50
}
```

Contoh di atas ialah data ujian, **bukan data production**.

## 5. Status pengujian dan batasan

| Bahagian | Status yang diketahui |
|---|---|
| Health API | Diuji dan berjaya |
| `GET /me` sebagai penyedia.jasa | Diuji dan berjaya |
| `GET /paket` sebagai penyedia.jasa | Diuji dan berjaya |
| POST uji coba, seksi, pengukuran | Pernah diuji berjaya |
| GET senarai/detail uji coba | Pernah diuji berjaya; akses berbeza ikut peranan telah diuji untuk detail |
| Beberapa operasi paket, dokumen, kalibrasi, personel | Pernah dibangunkan/diuji secara berasingan; perlu regression test sebelum integrasi penuh |
| Login React → Supabase Auth → Express | Belum diuji |
| Semua kombinasi role dan endpoint | Belum diuji |
| Pratinjau parameter IRI Tahap 2 | API tersedia; membandingkan A, B, R² dan CV dengan ambang DRAFT tanpa auto-approval |
| Keputusan validasi muktamad Tahap 2 dan BA | Belum dibina/disahkan sebagai alur lengkap |

Untuk operasi POST/PATCH/upload, **jangan meneka body request** daripada jadual route. Rujuk schema Zod, implementasi route dan Postman collection berkaitan sebelum Dirah membina form.

## 6. Cadangan urutan integrasi pertama

1. Dirah selesai dan push UI terkini; selaraskan branch melalui alur Git pasukan.
2. Konfigurasi Supabase Auth pada frontend (jangan beri pengguna kebolehan memilih role sebenar sendiri).
3. Selepas login, gunakan access token untuk `GET /api/me`.
4. Gunakan token sama untuk `GET /api/paket?page=1&page_size=50`.
5. Paparkan senarai paket daripada respons `data[]`.
6. Uji loading, 401, 403, dan keadaan senarai kosong sebelum sambung modul lain.

**Peringatan:** Fungsi SQL/RPC yang dibuat terus dalam Supabase tidak automatik masuk ke Git bersama kod backend. Perlu diurus sebagai migrasi/dokumentasi database untuk deployment pada masa depan.

## 7. Rujukan fail kod

- `backend/src/app.ts` — prefix `/api`, CORS, middleware Express.
- `backend/src/middleware/auth.ts` — Bearer token dan identiti.
- `backend/src/routes/index.ts` — router utama.
- `backend/src/routes/paket.ts` — route paket dan mount modul.
- `backend/src/routes/{health,dokumen,kalibrasi-asas,kalibrasi,personel,kualifikasi-bukti,uji-coba}.ts` — deklarasi endpoint.
- `backend/src/schemas/` — validasi body request.
- `backend/postman/` — koleksi ujian sedia ada.

---

Dokumen ini ialah **panduan integrasi awal**, bukan spesifikasi API muktamad. Kemas kini apabila kontrak request/response, aturan akses, atau route berubah.
