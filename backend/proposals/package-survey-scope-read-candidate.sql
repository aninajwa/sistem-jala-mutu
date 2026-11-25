-- CANDIDATE ONLY — NOT INSTALLED. Read-only package survey scope RPC.
--
-- Scope concepts intentionally remain distinct:
--   * paket_kontrak has no declared survey-scope column/relation in the
--     inspected installed schema. Return declared_contract_scope as
--     not_stored; do not infer it from an empty location table.
--   * lokasi_pekerjaan(paket_id, jenis_survei_id) records observed package
--     location/survey associations. Return those rows and unique survey IDs.
--   * tim_survei, kalibrasi_alat and checklist_pengisian are work records, not
--     contract-scope declarations and are not read by this RPC.
--
-- This candidate changes no table grants, RLS policies, data, or installed
-- functions. The private SECURITY DEFINER implementation requires the
-- caller's auth.uid() and matches the installed app_private.baca_ruas_paket
-- access predicate for each requested package. The public wrapper is an
-- invoker, matching the existing checked-private-implementation pattern.
-- The installed identity schema has no separate active flag: an auth-linked,
-- unlocked public.pengguna row plus its pengguna_peran row is the existing
-- active-identity/role contract. No service-role bypass is involved.

begin;

create or replace function app_private.baca_scope_survei_paket(p_paket_ids integer[])
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor integer;
  v_requested integer[];
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;

  -- Follow the installed identity contract: auth-linked and not locked.
  select u.pengguna_id into v_actor
  from public.pengguna u
  where u.auth_user_id = auth.uid()
    and coalesce(u.terkunci, false) = false;
  if v_actor is null then
    raise exception 'Identitas aktif diperlukan' using errcode = '42501';
  end if;

  if p_paket_ids is null
     or cardinality(p_paket_ids) < 1
     or cardinality(p_paket_ids) > 50
     or array_position(p_paket_ids, null) is not null
     or exists (select 1 from unnest(p_paket_ids) x where x < 1) then
    raise exception 'Daftar paket tidak valid' using errcode = '22023';
  end if;

  select array_agg(x order by x) into v_requested
  from (select distinct unnest(p_paket_ids) as x) ids;

  -- Confirm the requested IDs exist, without returning which one is missing.
  if exists (
    select 1
    from unnest(v_requested) requested(paket_id)
    left join public.paket_kontrak p on p.paket_id = requested.paket_id
    where p.paket_id is null
  ) then
    raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002';
  end if;

  -- Match the installed app_private.baca_ruas_paket predicate independently
  -- for every package. Package-list RLS intentionally remains broader for
  -- Providers and must not authorize location/survey association reads.
  -- A mixed authorized/unauthorized batch raises before any association
  -- payload is constructed, so no authorized subset or foreign data leaks.
  if exists (
    select 1
    from unnest(v_requested) requested(paket_id)
    join public.paket_kontrak p on p.paket_id = requested.paket_id
    where not exists (
      select 1
      from public.pengguna u
      join public.pengguna_peran pp on pp.pengguna_id = u.pengguna_id
      join public.peran r on r.peran_id = pp.peran_id
      where u.pengguna_id = v_actor
        and u.auth_user_id = auth.uid()
        and coalesce(u.terkunci, false) = false
        and (
          r.nama in ('admin', 'direktorat')
          or (
            r.nama = 'pic_balai'
            and pp.scope_balai_id = p.balai_id
            and (pp.scope_paket_id is null or pp.scope_paket_id = p.paket_id)
          )
          or (
            r.nama = 'penyedia_jasa'
            and p.created_by = v_actor
            and (pp.scope_paket_id is null or pp.scope_paket_id = p.paket_id)
          )
        )
    )
  ) then
    raise exception 'Akses ke paket ini ditolak' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'paket_id', p.paket_id,
      'availability', 'available',
      'declared_contract_scope', jsonb_build_object(
        'availability', 'not_stored',
        'source', 'paket_kontrak',
        'surveys', '[]'::jsonb
      ),
      'observed_location_associations', jsonb_build_object(
        'availability', 'available',
        'source', 'lokasi_pekerjaan',
        'observation_state', case when counts.association_count = 0 then 'none_observed' else 'observed' end,
        'association_count', counts.association_count,
        'unresolved_association_count', counts.unresolved_association_count,
        'surveys', coalesce(surveys.rows, '[]'::jsonb),
        'associations', coalesce(associations.rows, '[]'::jsonb)
      )
    ) order by p.paket_id
  ), '[]'::jsonb)
  into v_result
  from public.paket_kontrak p
  cross join lateral (
    select count(*)::integer as association_count,
           count(*) filter (where lp.jenis_survei_id is null or s.jenis_survei_id is null)::integer
             as unresolved_association_count
    from public.lokasi_pekerjaan lp
    left join public.jenis_survei s on s.jenis_survei_id = lp.jenis_survei_id
    where lp.paket_id = p.paket_id
  ) counts
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
      'jenis_survei_id', catalog.jenis_survei_id,
      'kode', catalog.kode,
      'nama', catalog.nama,
      'aktif', catalog.aktif
    ) order by catalog.jenis_survei_id) as rows
    from (
      select distinct s.jenis_survei_id, s.kode, s.nama, s.aktif
      from public.lokasi_pekerjaan lp
      join public.jenis_survei s on s.jenis_survei_id = lp.jenis_survei_id
      where lp.paket_id = p.paket_id
    ) catalog
  ) surveys
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
      'lokasi_id', lp.lokasi_id,
      'jenis_survei_id', lp.jenis_survei_id,
      'survey', case when s.jenis_survei_id is null then null else jsonb_build_object(
        'jenis_survei_id', s.jenis_survei_id,
        'kode', s.kode,
        'nama', s.nama,
        'aktif', s.aktif
      ) end
    ) order by lp.lokasi_id) as rows
    from public.lokasi_pekerjaan lp
    left join public.jenis_survei s on s.jenis_survei_id = lp.jenis_survei_id
    where lp.paket_id = p.paket_id
  ) associations
  where p.paket_id = any(v_requested);

  return v_result;
end;
$function$;

create or replace function public.baca_scope_survei_paket(p_paket_ids integer[])
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select app_private.baca_scope_survei_paket(p_paket_ids);
$function$;

revoke all on function app_private.baca_scope_survei_paket(integer[]) from public, anon;
revoke all on function public.baca_scope_survei_paket(integer[]) from public, anon;
grant execute on function app_private.baca_scope_survei_paket(integer[]) to authenticated;
grant execute on function public.baca_scope_survei_paket(integer[]) to authenticated;

commit;
