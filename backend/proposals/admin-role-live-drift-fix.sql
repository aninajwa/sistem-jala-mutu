-- PROPOSAL ONLY. Do not execute until reviewed and explicitly approved.
-- Target project: Jala-Mutu-Admin-Sandbox (yehwlrlbtcxtlogenahw) ONLY.
-- Never execute against the primary project (vnvknmwcidberkjwtqjx).
-- Replaces exactly two existing function bodies. No table, index, trigger,
-- RLS, ownership, or EXECUTE permission changes are included.
-- CREATE OR REPLACE preserves the existing function owner and ACL; verify both
-- against the Sandbox before deployment, along with the definitions/signatures.

begin;

create or replace function public.admin_role_validate_pic_scope(
  p_scope_balai_id integer, p_scope_paket_id integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_scope_balai_id is null or p_scope_balai_id < 1 then
    raise exception 'INVALID_SCOPE' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.balai as office
    where office.balai_id = p_scope_balai_id
  ) then
    raise exception 'SCOPE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.balai as office
    where office.balai_id = p_scope_balai_id and office.aktif is true
  ) then
    raise exception 'BALAI_INACTIVE' using errcode = '23514', constraint = 'pengguna_peran_pic_balai_active_scope_ck';
  end if;dk
  if p_scope_paket_id is not null and not exists (
    select 1 from public.paket_kontrak as package
    where package.paket_id = p_scope_paket_id
  ) then
    raise exception 'SCOPE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if p_scope_paket_id is not null and not exists (
    select 1 from public.paket_kontrak as package
    where package.paket_id = p_scope_paket_id
      and package.balai_id = p_scope_balai_id
  ) then
    raise exception 'SCOPE_RELATION_CONFLICT' using errcode = '23514', constraint = 'pengguna_peran_pic_balai_package_scope_ck';
  end if;
end;
$function$;

create or replace function public.admin_cabut_penugasan_peran(
  p_pengguna_id integer, p_pp_id integer, p_expected_version bigint
)
returns table (pp_id integer, revoked boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor integer; v_user integer; v_role integer; v_role_name text; v_locked boolean;
  v_balai integer; v_package integer; v_version bigint;
begin
  v_actor := public.admin_role_mutation_authorize();
  perform pg_catalog.pg_advisory_xact_lock(74192031, 1);
  select assignment.pengguna_id, assignment.peran_id, assignment.scope_balai_id,
    assignment.scope_paket_id, assignment.mutation_version, role_catalog.nama
    into v_user, v_role, v_balai, v_package, v_version, v_role_name
    from public.pengguna_peran assignment
    join public.peran role_catalog using (peran_id)
    where assignment.pp_id = p_pp_id
    for update of assignment;
  if not found or v_user <> p_pengguna_id then
    raise exception 'ASSIGNMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_user = v_actor then
    raise exception 'SELF_CHANGE_FORBIDDEN' using errcode = '42501';
  end if;
  if v_role_name <> 'pic_balai' then
    raise exception 'ROLE_MUTATION_FORBIDDEN' using errcode = '42501';
  end if;

  select coalesce(target.terkunci, false) into v_locked
    from public.pengguna target
    where target.pengguna_id = v_user
    for update;
  if not found then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_locked then
    raise exception 'TARGET_LOCKED' using errcode = '42501';
  end if;
  if p_expected_version is null or p_expected_version <> v_version then
    raise exception 'STALE_ASSIGNMENT' using errcode = '40001';
  end if;

  delete from public.pengguna_peran assignment
    where assignment.pp_id = p_pp_id;
  insert into public.audit_trail(pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu)
    values (v_actor, 'pengguna_peran', p_pp_id::text, 'REVOKE_ROLE',
      pg_catalog.jsonb_build_object('target_pengguna_id', v_user, 'peran_id', v_role,
        'nama_peran', v_role_name, 'scope_balai_id', v_balai, 'scope_paket_id', v_package),
      null, localtimestamp);
  return query select p_pp_id, true;
end;
$function$;

commit;
