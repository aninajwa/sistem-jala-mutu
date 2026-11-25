# Sambungan login frontend Jala Mutu

## Apa yang sudah disambungkan

- Login email/password menggunakan Supabase Auth pada proyek yang sama dengan backend.
- Setelah login, frontend mengirim token Bearer ke GET /api/me.
- Peran ditentukan dari peran + penugasan server, bukan pilihan bebas atau data demo.
- Satu peran: langsung masuk. Beberapa peran: pilih hanya dari peran akun.
- Sesi dipulihkan dan identitas diverifikasi ulang setelah refresh. SDK memperbarui token.
- Logout, pesan salah password, backend tidak terhubung, akun terkunci, dan profil tanpa peran.
- Penyedia Jasa, PIC Balai, validator, dan Admin memakai tampilan yang sudah ada.
- Pimpinan mendapat daftar paket server baca saja, maksimal 50 paket pertama; belum dashboard lengkap.
- Data pratinjau lokal dipisahkan per akun agar tidak tercampur saat berganti akun.

## Batas pekerjaan ini

Login sudah diimplementasikan. Workspace workflow untuk empat peran lama MASIH LOKAL, dengan banner penjelasan. Daftar paket, checklist, dokumen, pengajuan, dan review pada workspace tersebut belum dihubungkan ke endpoint backend. Mengeditnya belum mengubah database. Adapter HTTP lama masih berupa rancangan dan tidak diaktifkan; kontraknya perlu disesuaikan sebelum integrasi workflow.

Tidak ada perubahan backend, database, RLS, akun, atau password dalam pembaruan ini. Backend tetap wajib memeriksa hak akses setiap endpoint. Status login UI tidak menggantikan pemeriksaan backend.

## Pasang pada proyek komputer kamu

1. Backup atau commit perubahan frontend kamu dahulu.
2. Salin file frontend dari ZIP ini ke frontend proyek kamu. Jangan hapus `.env` lokal yang sudah ada. Folder backend tidak berubah.
3. Di terminal folder frontend, jalankan `npm install`.
4. Jika belum ada `frontend/.env`, salin `.env.example` menjadi `.env`.
5. Isi/tambahkan:

```dotenv
VITE_API_PROXY_TARGET=http://localhost:5000
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://PROJECT_KAMU.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=ISI_PUBLISHABLE_KEY_KAMU
VITE_ENABLE_ROLE_TESTING=false
```

Ambil nilai URL dan publishable key dari `backend/.env` di komputer kamu (SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY), supaya kedua aplikasi memakai proyek yang sama. Jangan gunakan service_role atau secret key. Jangan commit `.env`. Tidak perlu kirim password kepada siapa pun.

6. Terminal backend: `npm run dev`.
7. Terminal frontend: `npm run dev`.
8. Buka `http://localhost:5173/` tanpa `?testRoles=1`.
9. Masuk memakai EMAIL akun Supabase yang biasa dipakai di Postman, bukan nama pendek seperti `pic.kalteng` kecuali itu memang alamat email lengkap akun tersebut.

Jika frontend memakai port lain, sesuaikan FRONTEND_ORIGIN di backend/.env lalu restart backend. Restart frontend setelah mengubah VITE_*.

## Uji manual akun asli

- Password salah: tetap di halaman login dengan pesan kesalahan.
- Penyedia Jasa/PIC: tampil peran yang sesuai; tidak tersedia tombol memilih Admin.
- Refresh: tetap login setelah identitas dicek ulang ke backend.
- Keluar lalu login akun lain: peran berubah sesuai akun; data lokal dipisahkan.
- Profil terkunci/tidak ditautkan: workspace tidak dibuka.
- Backend mati: tampil pesan koneksi dan tombol Coba lagi.
- Pimpinan: daftar paket server baca saja.

## Build dan hosting

`npm run build` melakukan pemeriksaan TypeScript dan build Vite.
Proxy Vite hanya berlaku pada `npm run dev`. Untuk hosting atau `npm run preview`, gunakan reverse proxy `/api` atau set VITE_API_BASE_URL ke alamat backend lengkap (contoh `https://backend.example.com/api`) SEBELUM build. Sesuaikan CORS/FRONTEND_ORIGIN backend dengan origin frontend. Gunakan HTTPS pada hosting.

Mode demo hanya boleh aktif dalam development: `http://localhost:5173/?testRoles=1`. Mode ini bukan login dan tidak boleh dipakai untuk memverifikasi hak akses akun asli. Build production mengabaikan flag demo.

## Pengujian otomatis

- `npm run test:auth`: mapping peran, peran tanpa penugasan, profil terkunci, identitas tidak cocok, Pimpinan.
- `npm run test:login`: uji browser dengan respons Auth/API tiruan. Memerlukan browser Playwright (`npx playwright install chromium`), atau CHROMIUM_EXECUTABLE yang valid. Tidak memakai atau mengubah akun asli.

Referensi implementasi: https://supabase.com/docs/reference/javascript/auth-signinwithpassword dan https://supabase.com/docs/reference/javascript/auth-onauthstatechange.

## Hasil verifikasi pada pembaruan ini

Build TypeScript/Vite lulus. Tiga tes mapping identitas/peran lulus. Uji browser dengan Auth/API tiruan lulus: password salah, pengiriman Bearer, peran PIC, refresh, logout, profil terkunci, Pimpinan baca saja, dan sesi ditolak (401). Login akun asli belum diuji karena konfigurasi/kredensial lokal tidak disertakan. Build masih memberi peringatan ukuran bundle yang sudah besar.
