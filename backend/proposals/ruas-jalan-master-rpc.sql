-- Proposal only: not applied to Supabase.
-- Ruas master write access is limited to admin or PIC Balai scoped to the
-- requested active Balai. Reads are limited to a package visible to the caller.
-- The existing public.ruas_jalan table has RLS enabled, no authenticated table
-- privileges/policies, and a unique constraint on nomor_ruas.

create or replace function app_private.baca_ruas_paket(p_paket_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor integer;
  v_package public.paket_kontrak;
begin
  select u.pengguna_id into v_actor
  from public.pengguna u
  where u.auth_user_id = auth.uid()
    and not coalesce(u.terkunci, false);
  if v_actor is null then
    raise exception 'Akses tidak dibenarkan' using errcode = '42501';
  end if;

  select * into v_package
  from public.paket_kontrak p
  where p.paket_id = p_paket_id;
  if not found then
    raise exception 'Paket tidak ditemukan' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.pengguna_peran pp
    join public.peran r using (peran_id)
    where pp.pengguna_id = v_actor
      and (
        r.nama in ('admin', 'direktorat')
        or (r.nama = 'pic_balai' and pp.scope_balai_id = v_package.balai_id
            and (pp.scope_paket_id is null or pp.scope_paket_id = v_package.paket_id))
        or (r.nama = 'penyedia_jasa' and v_package.created_by = v_actor
            and (pp.scope_paket_id is null or pp.scope_paket_id = v_package.paket_id))
      )
  ) then
    raise exception 'Akses ke paket ini ditolak' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(r) order by r.nomor_ruas, r.ruas_id)
    from public.ruas_jalan r
    where r.balai_id = v_package.balai_id
  ), '[]'::jsonb);
end;
$$;

revoke all on function app_private.baca_ruas_paket(integer) from public, anon;
grant execute on function app_private.baca_ruas_paket(integer) to authenticated;

create or replace function public.baca_ruas_paket(p_paket_id integer)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select app_private.baca_ruas_paket(p_paket_id); $$;
revoke all on function public.baca_ruas_paket(integer) from public, anon;
grant execute on function public.baca_ruas_paket(integer) to authenticated;

create or replace function app_private.buat_ruas_jalan(
  p_balai_id integer,
  p_nomor_ruas text,
  p_nama_ruas text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor integer;
  v_ruas public.ruas_jalan;
  v_nomor text := btrim(p_nomor_ruas);
  v_nama text := btrim(p_nama_ruas);
begin
  select u.pengguna_id into v_actor
  from public.pengguna u
  where u.auth_user_id = auth.uid()
    and not coalesce(u.terkunci, false);
  if v_actor is null then
    raise exception 'Akses tidak dibenarkan' using errcode = '42501';
  end if;

  if p_balai_id is null or p_balai_id < 1
     or v_nomor is null or length(v_nomor) not between 1 and 255
     or v_nama is null or length(v_nama) not between 1 and 255 then
    raise exception 'Balai, nomor ruas dan nama ruas wajib valid' using errcode = '22023';
  end if;

  if not exists (select 1 from public.balai b where b.balai_id = p_balai_id and b.aktif is true) then
    raise exception 'Balai tidak ditemukan atau tidak aktif' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.pengguna_peran pp
    join public.peran r using (peran_id)
    where pp.pengguna_id = v_actor
      and (r.nama = 'admin' or (r.nama = 'pic_balai' and pp.scope_balai_id = p_balai_id))
  ) then
    raise exception 'Hanya admin atau PIC Balai dengan scope yang sesuai boleh mendaftarkan ruas'
      using errcode = '42501';
  end if;

  insert into public.ruas_jalan (balai_id, nomor_ruas, nama_ruas)
  values (p_balai_id, v_nomor, v_nama)
  returning * into v_ruas;

  insert into public.audit_trail (pengguna_id, tabel, record_id, aksi, nilai_baru, waktu)
  values (
    v_actor,
    'ruas_jalan',
    v_ruas.ruas_id::text,
    'CREATE_RUAS_JALAN',
    jsonb_build_object('ruas_id', v_ruas.ruas_id, 'balai_id', v_ruas.balai_id,
                       'nomor_ruas', v_ruas.nomor_ruas, 'nama_ruas', v_ruas.nama_ruas),
    localtimestamp
  );

  return to_jsonb(v_ruas);
end;
$$;

revoke all on function app_private.buat_ruas_jalan(integer, text, text) from public, anon;
grant execute on function app_private.buat_ruas_jalan(integer, text, text) to authenticated;

create or replace function public.buat_ruas_jalan(
  p_balai_id integer,
  p_nomor_ruas text,
  p_nama_ruas text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select app_private.buat_ruas_jalan(p_balai_id, p_nomor_ruas, p_nama_ruas); $$;
revoke all on function public.buat_ruas_jalan(integer, text, text) from public, anon;
grant execute on function public.buat_ruas_jalan(integer, text, text) to authenticated;
