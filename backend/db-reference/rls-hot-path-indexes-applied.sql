-- APPLIED to Jala-Mutu (vnvknmwcidberkjwtqjx) on 2026-11-23 as migration rls_hot_path_indexes.
-- Indexes for columns used by RLS policies and hot read RPCs (statement timeouts 57014 under parallel page loads).
create index if not exists paket_kontrak_balai_id_idx on public.paket_kontrak(balai_id);
create index if not exists paket_kontrak_created_by_idx on public.paket_kontrak(created_by);
create index if not exists pengguna_peran_peran_id_idx on public.pengguna_peran(peran_id);
create index if not exists checklist_pengisian_template_id_idx on public.checklist_pengisian(template_id);
create index if not exists checklist_jawaban_item_id_idx on public.checklist_jawaban(item_id);
create index if not exists checklist_item_template_urutan_idx on public.checklist_item(template_id, urutan);
create index if not exists dokumen_paket_id_idx on public.dokumen(paket_id);
create index if not exists persetujuan_dokumen_dokumen_id_idx on public.persetujuan_dokumen(dokumen_id);
create index if not exists uji_coba_paket_id_idx on public.uji_coba(paket_id);
create index if not exists tim_survei_paket_id_idx on public.tim_survei(paket_id);
create index if not exists sesi_survei_paket_id_idx on public.sesi_survei(paket_id);
create index if not exists lokasi_pekerjaan_paket_id_idx on public.lokasi_pekerjaan(paket_id);
