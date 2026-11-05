-- JALA MUTU — proposal CREATE awal siklus Verval dengan allowlist TEST/QA.
-- Bergantung pada app_private.siklus_verval_testqa_allowlist.
-- Jangan deploy ke produksi tanpa pengesahan kebijakan periode produksi.
-- Hanya membuat siklus pertama. Siklus berikutnya menunggu pengesahan aturan
-- tanggal acuan Verval terakhir. Tidak menetapkan status atau jatuh tempo.

create or replace function app_private.buat_siklus_verval_testqa(p_paket_id integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor integer;
  v_user public.pengguna;
  v_package public.paket_kontrak;
  v_allowlist app_private.siklus_verval_testqa_allowlist;
  v_tanggal_awal date;
  v_result public.siklus_verval;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;

  select * into v_user
  from public.pengguna
  where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if not found or not exists (
    select 1
    from public.pengguna_peran pp
    join public.peran r using (peran_id)
    where pp.pengguna_id = v_user.pengguna_id and r.nama = 'penyedia_jasa'
  ) then
    raise exception 'Hanya Penyedia Jasa aktif boleh membuat siklus Verval' using errcode = '42501';
  end if;
  v_actor := v_user.pengguna_id;

  -- Lock paket untuk menserialkan permintaan CREATE konkuren pada paket yang sama.
  select * into v_package
  from public.paket_kontrak
  where paket_id = p_paket_id
  for update;
  if not found then raise exception 'Paket tidak ditemukan' using errcode = 'P0002'; end if;
  if v_package.created_by is distinct from v_actor then
    raise exception 'Akses ke paket ini ditolak' using errcode = '42501';
  end if;

  -- Kunci baris allowlist agar perubahan aktif/nonaktif menunggu transaksi ini.
  -- Administrator tetap harus memakai transaksi/operasi terkelola; ini tidak
  -- mengklaim melindungi dari perubahan langsung di luar penguncian PostgreSQL.
  select * into v_allowlist
  from app_private.siklus_verval_testqa_allowlist a
  where a.paket_id = p_paket_id
    and a.aktif is true
    and length(btrim(a.tujuan_pengujian)) > 0
  for share;
  if not found then
    raise exception 'Paket tidak terdaftar aktif untuk pengujian Verval TEST/QA' using errcode = '42501';
  end if;

  -- Setelah lock, permintaan bersamaan kedua melihat siklus yang telah dibuat.
  if exists (select 1 from public.siklus_verval s where s.paket_id = p_paket_id) then
    raise exception 'Siklus Verval pertama untuk paket ini sudah ada' using errcode = '23505';
  end if;

  select min(s.tanggal) into v_tanggal_awal
  from public.sesi_survei s
  where s.paket_id = p_paket_id;
  if v_tanggal_awal is null then
    raise exception 'Sesi survei bertanggal belum tersedia untuk menetapkan awal periode TEST/QA' using errcode = '55000';
  end if;

  insert into public.siklus_verval(
    paket_id, siklus_ke, periode_mulai, periode_selesai,
    jatuh_tempo, panjang_periode_km, status
  ) values (
    p_paket_id, 1, v_tanggal_awal, v_tanggal_awal + 13,
    null, null, null
  ) returning * into v_result;

  return to_jsonb(v_result);
end;
$$;

revoke all on function app_private.buat_siklus_verval_testqa(integer) from public, anon;
grant execute on function app_private.buat_siklus_verval_testqa(integer) to authenticated;

create or replace function public.buat_siklus_verval_testqa(p_paket_id integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select app_private.buat_siklus_verval_testqa(p_paket_id);
$$;

revoke all on function public.buat_siklus_verval_testqa(integer) from public, anon;
grant execute on function public.buat_siklus_verval_testqa(integer) to authenticated;
