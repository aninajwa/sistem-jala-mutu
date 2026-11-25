-- JALA MUTU — allowlist database-side untuk CREATE siklus Verval TEST/QA.
-- Proposal sahaja: jangan deploy ke Supabase aktif tanpa persetujuan.
-- Tidak memasukkan Paket #9 atau paket lain. Aktivasi dilakukan terpisah oleh
-- administrator database setelah verifikasi tujuan pengujian.

create schema if not exists app_private;

create table if not exists app_private.siklus_verval_testqa_allowlist (
  paket_id integer primary key references public.paket_kontrak(paket_id),
  aktif boolean not null default false,
  tujuan_pengujian text not null,
  constraint siklus_verval_testqa_tujuan_nonempty
    check (length(btrim(tujuan_pengujian)) > 0)
);

alter table app_private.siklus_verval_testqa_allowlist enable row level security;
revoke all on table app_private.siklus_verval_testqa_allowlist from public, anon, authenticated;

comment on table app_private.siklus_verval_testqa_allowlist is
  'Allowlist TEST/QA dikelola administrator database; tidak ada seed otomatis.';
