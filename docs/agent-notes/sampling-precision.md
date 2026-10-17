---
name: Presisi sampling panjang
description: Batas akurasi sampling panjang jalan selama data belum menyimpan STA tiap segmen.
---

Nyatakan sampling berbasis total panjang rekaman sebagai estimasi. Jangan mengklaim cakupan atau kepatuhan STA/segmen yang presisi sampai model data menyimpan STA tiap segmen dan generator sampel memakai interval itu.

**Why:** Data survei pada prototipe tidak mengidentifikasi batas STA untuk setiap potongan panjang, sehingga pemilihan berdasarkan total panjang tidak dapat membuktikan lokasi segmen yang tepat.

**How to apply:** Pertahankan peringatan ini pada audit sampling; saat data STA per segmen ditambahkan, bangun ulang aturan dan verifikasi contoh sampel sebelum menghapus batasan.
