-- USULAN RPC BACA KOREKSI — BELUM DIJALANKAN.
-- Menggunakan tabel yang sudah ada. Sengaja hanya mereferensikan kolom yang
-- telah diverifikasi: kasus_temuan.{kasus_id,paket_id,status,uraian,tingkat,pic_id}
-- dan enam relasi yang dikonfirmasi. Kolom lain dikembalikan via to_jsonb(row).
--
-- Kontrak respons:
-- baca_senarai_koreksi -> JSON array; setiap elemen berisi kasus_temuan,
--   tindakan_perbaikan (tiap item memuat uji_ulang), koreksi_data (tiap item
--   memuat verifikasi_koreksi), dan riwayat_status_kasus. baca_koreksi
--   mempertahankan seluruh konteks kasus, tetapi koreksi_data hanya berisi
--   koreksi_id yang diminta (array satu elemen agar bentuk GET tetap konsisten).
-- baca_koreksi -> satu objek dengan bentuk yang sama untuk satu koreksi_id.
-- GET route membungkus hasil RPC sebagai { data: ... } tanpa transformasi.
--
-- Security definer diperlukan sebab RLS aktif tetapi tabel tidak memiliki policy
-- dan tidak memberikan SELECT langsung kepada authenticated. Otorisasi dilakukan
-- eksplisit memakai auth.uid() pengguna aktif, role Jala Mutu, dan scope paket;
-- tidak memakai service_role.
-- Akses penyedia_jasa dibatasi ke paket yang dibuat pengguna aktif
-- (paket_kontrak.created_by = pengguna.pengguna_id). Direktorat/Admin mengikuti
-- policy baca paket yang sudah ada; PIC Balai dibatasi scope balai/paket.
-- PK terverifikasi: kasus_id, tindakan_id, koreksi_id, uji_ulang_id,
-- verif_id, dan riwayat_id.

create or replace function public.baca_senarai_koreksi(p_paket_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.paket_kontrak p
    join public.pengguna u on u.auth_user_id = auth.uid()
    join public.pengguna_peran pp on pp.pengguna_id = u.pengguna_id
    join public.peran r on r.peran_id = pp.peran_id
    where p.paket_id = p_paket_id
      and not coalesce(u.terkunci, false)
      and (
        (r.nama = 'penyedia_jasa' and p.created_by = u.pengguna_id)
        or r.nama in ('direktorat', 'admin')
        or (r.nama = 'pic_balai' and pp.scope_balai_id = p.balai_id
            and (pp.scope_paket_id is null or pp.scope_paket_id = p.paket_id))
      )
  ) then
    raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'kasus_temuan', to_jsonb(k),
      'tindakan_perbaikan', coalesce((
        select jsonb_agg(jsonb_build_object(
          'tindakan_perbaikan', to_jsonb(t),
          'uji_ulang', coalesce((
            select jsonb_agg(to_jsonb(uu) order by uu.uji_ulang_id)
            from public.uji_ulang uu
            where uu.tindakan_id = t.tindakan_id
          ), '[]'::jsonb)
        ) order by t.tindakan_id)
        from public.tindakan_perbaikan t
        where t.kasus_id = k.kasus_id
      ), '[]'::jsonb),
      'koreksi_data', coalesce((
        select jsonb_agg(jsonb_build_object(
          'koreksi_data', to_jsonb(kd),
          'verifikasi_koreksi', coalesce((
            select jsonb_agg(to_jsonb(vk) order by vk.verif_id)
            from public.verifikasi_koreksi vk
            where vk.koreksi_id = kd.koreksi_id
          ), '[]'::jsonb)
        ) order by kd.koreksi_id)
        from public.koreksi_data kd
        where kd.kasus_id = k.kasus_id
      ), '[]'::jsonb),
      'riwayat_status_kasus', coalesce((
        select jsonb_agg(to_jsonb(rs) order by rs.riwayat_id)
        from public.riwayat_status_kasus rs
        where rs.kasus_id = k.kasus_id
      ), '[]'::jsonb)
    )
  ), '[]'::jsonb order by k.kasus_id)
  into result
  from public.kasus_temuan k
  where k.paket_id = p_paket_id
    and exists (
      select 1
      from public.koreksi_data kd
      where kd.kasus_id = k.kasus_id
    );

  return result;
end;
$$;

create or replace function public.baca_koreksi(p_paket_id integer, p_koreksi_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'kasus_temuan', to_jsonb(k),
    'tindakan_perbaikan', coalesce((
      select jsonb_agg(jsonb_build_object(
        'tindakan_perbaikan', to_jsonb(t),
        'uji_ulang', coalesce((
          select jsonb_agg(to_jsonb(uu) order by uu.uji_ulang_id)
          from public.uji_ulang uu
          where uu.tindakan_id = t.tindakan_id
        ), '[]'::jsonb)
      ) order by t.tindakan_id)
      from public.tindakan_perbaikan t
      where t.kasus_id = k.kasus_id
    ), '[]'::jsonb),
    'koreksi_data', coalesce((
      select jsonb_agg(jsonb_build_object(
        'koreksi_data', to_jsonb(kd),
        'verifikasi_koreksi', coalesce((
          select jsonb_agg(to_jsonb(vk) order by vk.verif_id)
          from public.verifikasi_koreksi vk
          where vk.koreksi_id = kd.koreksi_id
        ), '[]'::jsonb)
      ) order by kd.koreksi_id)
      from public.koreksi_data kd
      where kd.kasus_id = k.kasus_id
        and kd.koreksi_id = p_koreksi_id
    ), '[]'::jsonb),
    'riwayat_status_kasus', coalesce((
      select jsonb_agg(to_jsonb(rs) order by rs.riwayat_id)
      from public.riwayat_status_kasus rs
      where rs.kasus_id = k.kasus_id
    ), '[]'::jsonb)
  )
  into result
  from public.koreksi_data target
  join public.kasus_temuan k on k.kasus_id = target.kasus_id
  join public.paket_kontrak p on p.paket_id = k.paket_id
  where target.koreksi_id = p_koreksi_id
    and k.paket_id = p_paket_id
    and exists (
      select 1
      from public.pengguna u
      join public.pengguna_peran pp on pp.pengguna_id = u.pengguna_id
      join public.peran r on r.peran_id = pp.peran_id
      where u.auth_user_id = auth.uid()
        and not coalesce(u.terkunci, false)
        and (
          (r.nama = 'penyedia_jasa' and p.created_by = u.pengguna_id)
          or r.nama in ('direktorat', 'admin')
          or (r.nama = 'pic_balai' and pp.scope_balai_id = p.balai_id
              and (pp.scope_paket_id is null or pp.scope_paket_id = p.paket_id))
        )
    );

  if result is null then
    raise exception 'Kasus koreksi tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

revoke all on function public.baca_senarai_koreksi(integer) from public, anon;
revoke all on function public.baca_koreksi(integer, integer) from public, anon;
grant execute on function public.baca_senarai_koreksi(integer) to authenticated;
grant execute on function public.baca_koreksi(integer, integer) to authenticated;
