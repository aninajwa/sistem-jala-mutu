-- SUPERSEDED INSTALL-SOURCE FRAGMENT. NOT INSTALLED OR EXECUTED.
-- Use backend/proposals/admin-role-management-v1-install.sql as the single coherent
-- package; do not install this duplicate function definition separately.
-- Prerequisite: the separately reviewed mutation_version bigint column must exist.
-- This file does not ALTER tables, policies, RLS, or table grants. Installing this
-- function/grant requires separate approval; it is not an active API route.

begin;

do $installer_guard$
begin
  if current_user <> 'postgres' then
    raise exception 'Install candidate as postgres';
  end if;
end;
$installer_guard$;

create or replace function public.admin_daftar_penugasan_peran(p_pengguna_id integer)
returns table (
  pp_id integer,
  pengguna_id integer,
  peran_id integer,
  nama_peran text,
  scope_balai_id integer,
  scope_paket_id integer,
  mutation_version text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  -- Authorization is derived only from the authenticated subject and current
  -- database assignment; no target/caller role flags are trusted from the request.
  if not exists (
    select 1
    from public.pengguna as actor
    join public.pengguna_peran as actor_assignment
      on actor_assignment.pengguna_id = actor.pengguna_id
    join public.peran as actor_role
      on actor_role.peran_id = actor_assignment.peran_id
    where actor.auth_user_id = auth.uid()
      and not coalesce(actor.terkunci, false)
      and actor_role.nama = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_pengguna_id is null or p_pengguna_id < 1 then
    raise exception 'INVALID_TARGET' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.pengguna as target
    where target.pengguna_id = p_pengguna_id
  ) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  return query
    select
      assignment.pp_id,
      assignment.pengguna_id,
      assignment.peran_id,
      role_catalog.nama::text,
      assignment.scope_balai_id,
      assignment.scope_paket_id,
      assignment.mutation_version::text
    from public.pengguna_peran as assignment
    join public.peran as role_catalog
      on role_catalog.peran_id = assignment.peran_id
    where assignment.pengguna_id = p_pengguna_id
    order by assignment.pp_id;
end;
$function$;

alter function public.admin_daftar_penugasan_peran(integer) owner to postgres;
revoke all on function public.admin_daftar_penugasan_peran(integer)
  from public, anon, authenticated;
grant execute on function public.admin_daftar_penugasan_peran(integer)
  to authenticated;

commit;
