-- JALA MUTU — proposal RPC READ uji konsistensi Tahap 3B.
-- Proposal sahaja: jangan jalankan sebelum semakan dan ujian staging.
-- Tidak membuat tabel, kolom, status, gate, atau relasi baru.

create or replace function app_private.baca_uji_konsistensi_verval(
  p_paket_id integer,
  p_siklus_id integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;

  perform app_private.assert_survei_read(p_paket_id);

  if not exists (
    select 1
    from public.siklus_verval s
    where s.siklus_id = p_siklus_id and s.paket_id = p_paket_id
  ) then
    raise exception 'Siklus Verval tidak ditemukan dalam paket ini' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'konsistensi_id', k.konsistensi_id,
      'siklus_id', k.siklus_id,
      'jenis_survei_id', k.jenis_survei_id,
      'tim_id', k.tim_id,
      'ruas_id', k.ruas_id,
      'sta_awal', k.sta_awal,
      'sta_akhir', k.sta_akhir,
      'jumlah_ulangan', k.jumlah_ulangan,
      'status', k.status,
      'ulangan', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'ulangan_id', u.ulangan_id,
            'konsistensi_id', u.konsistensi_id,
            'rater_personel_id', u.rater_personel_id,
            'ulangan_ke', u.ulangan_ke,
            'nilai', u.nilai
          ) order by u.ulangan_ke nulls last, u.ulangan_id
        )
        from public.uji_konsistensi_ulangan u
        where u.konsistensi_id = k.konsistensi_id
      ), '[]'::jsonb)
    ) order by k.konsistensi_id
  ), '[]'::jsonb)
  into v_result
  from public.uji_konsistensi k
  where k.siklus_id = p_siklus_id;

  return v_result;
end;
$$;

revoke all on function app_private.baca_uji_konsistensi_verval(integer, integer) from public, anon;
grant execute on function app_private.baca_uji_konsistensi_verval(integer, integer) to authenticated;

create or replace function public.baca_uji_konsistensi_verval(p_paket_id integer, p_siklus_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.baca_uji_konsistensi_verval(p_paket_id, p_siklus_id);
$$;

revoke all on function public.baca_uji_konsistensi_verval(integer, integer) from public, anon;
grant execute on function public.baca_uji_konsistensi_verval(integer, integer) to authenticated;
