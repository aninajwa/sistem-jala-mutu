-- REVIEW CANDIDATE ONLY. DO NOT EXECUTE without a separately approved installation.
-- Existing public.pengguna and public.pengguna_peran RLS policies remain unchanged.
--
-- The schema has been reviewed against the live Jala Mutu schema. Use the same trusted
-- migration owner used for the already-installed SECURITY DEFINER RPCs. Deliberately do
-- not create a BYPASSRLS role, transfer ownership, or grant any table/column privileges.
-- SECURITY DEFINER runs the body as that trusted owner; the body itself performs the
-- caller check and returns only its explicit projection. Confirm at installation that
-- the owner matches the established RPC owner and has the required read access.
-- This function never returns auth_user_id; it is read only to authenticate the caller.

begin;

create function public.admin_daftar_pengguna(
  p_page integer default 1,
  p_page_size integer default 25,
  p_username_search text default null
)
returns table (
  pengguna_id integer,
  username text,
  terkunci boolean,
  peran jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_auth_user_id uuid;
  v_search text;
  v_pattern text;
begin
  v_auth_user_id := auth.uid();
  if v_auth_user_id is null then
    raise exception 'Login diperlukan' using errcode = '28000';
  end if;

  -- Authorization comes only from the live caller identity and assigned DB role.
  -- No user ID, role, or admin flag is accepted as an input parameter.
  if not exists (
    select 1
    from public.pengguna as caller
    join public.pengguna_peran as caller_assignment
      on caller_assignment.pengguna_id = caller.pengguna_id
    join public.peran as caller_role
      on caller_role.peran_id = caller_assignment.peran_id
    where caller.auth_user_id = v_auth_user_id
      and not coalesce(caller.terkunci, false)
      and caller_role.nama = 'admin'
  ) then
    raise exception 'Hanya Admin aktif boleh membaca daftar pengguna' using errcode = '42501';
  end if;

  if p_page is null or p_page < 1 or p_page > 1000000
     or p_page_size is null or p_page_size < 1 or p_page_size > 100 then
    raise exception 'Parameter halaman tidak valid' using errcode = '22023';
  end if;
  if p_username_search is not null and pg_catalog.char_length(pg_catalog.btrim(p_username_search)) > 100 then
    raise exception 'Pencarian username maksimum 100 karakter' using errcode = '22023';
  end if;

  v_search := nullif(pg_catalog.btrim(p_username_search), '');
  if v_search is not null then
    -- Treat %, _ and backslash as literal search characters, not LIKE patterns.
    v_pattern := '%' || pg_catalog.replace(
      pg_catalog.replace(
        pg_catalog.replace(v_search, E'\\', E'\\\\'),
        '%', E'\\%'
      ),
      '_', E'\\_'
    ) || '%';
  end if;

  return query
    select
      target.pengguna_id,
      target.username::text,
      coalesce(target.terkunci, false),
      coalesce(assigned_roles.peran, '[]'::jsonb)
    from public.pengguna as target
    left join lateral (
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'nama', assigned_role.nama,
          'scope_balai_id', assignment.scope_balai_id,
          'scope_paket_id', assignment.scope_paket_id
        ) order by assigned_role.nama, assignment.scope_balai_id nulls first,
          assignment.scope_paket_id nulls first
      ) as peran
      from public.pengguna_peran as assignment
      join public.peran as assigned_role
        on assigned_role.peran_id = assignment.peran_id
      where assignment.pengguna_id = target.pengguna_id
    ) as assigned_roles on true
    where v_search is null or target.username ilike v_pattern escape E'\\'
    order by target.pengguna_id asc
    limit p_page_size
    offset ((p_page - 1) * p_page_size);
end;
$function$;

revoke all on function public.admin_daftar_pengguna(integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.admin_daftar_pengguna(integer, integer, text)
  to authenticated;

commit;
