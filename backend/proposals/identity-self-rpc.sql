-- REVIEW CANDIDATE ONLY. DO NOT EXECUTE without explicit approval.
-- Replaces requireAuth's three caller-scoped PostgREST table reads when installed.
-- Does not add table SELECT policies or expose other users' identity data.
-- Install with the same trusted SECURITY DEFINER owner used by the existing RPCs;
-- verify that owner and its required read privileges before installation.

begin;

create function public.authenticated_identity_self()
returns table (
  pengguna_id integer,
  auth_user_id uuid,
  username text,
  terkunci boolean,
  penugasan jsonb,
  peran jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_auth_user_id uuid;
  v_pengguna_id integer;
  v_locked boolean;
begin
  v_auth_user_id := auth.uid();
  if v_auth_user_id is null then
    raise exception 'Login diperlukan' using errcode = '28000';
  end if;

  select u.pengguna_id, coalesce(u.terkunci, false)
    into v_pengguna_id, v_locked
    from public.pengguna as u
   where u.auth_user_id = v_auth_user_id;

  if not found then
    return;
  end if;
  if v_locked then
    raise exception 'Akaun terkunci' using errcode = '42501';
  end if;

  return query
  select u.pengguna_id,
         u.auth_user_id,
         u.username::text,
         coalesce(u.terkunci, false),
         coalesce(assigned.assignments, '[]'::jsonb),
         coalesce(assigned.roles, '[]'::jsonb)
    from public.pengguna as u
    left join lateral (
      select
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'peran_id', a.peran_id,
            'scope_balai_id', a.scope_balai_id,
            'scope_paket_id', a.scope_paket_id
          ) order by a.peran_id, a.scope_balai_id nulls first, a.scope_paket_id nulls first
        ) as assignments,
        pg_catalog.jsonb_agg(distinct pg_catalog.jsonb_build_object(
          'peran_id', r.peran_id,
          'nama', r.nama
        )) as roles
      from public.pengguna_peran as a
      join public.peran as r on r.peran_id = a.peran_id
      where a.pengguna_id = u.pengguna_id
    ) as assigned on true
   where u.pengguna_id = v_pengguna_id
     and u.auth_user_id = v_auth_user_id
     and not coalesce(u.terkunci, false);
end;
$function$;

revoke all on function public.authenticated_identity_self() from public, anon, authenticated;
grant execute on function public.authenticated_identity_self() to authenticated;

commit;
