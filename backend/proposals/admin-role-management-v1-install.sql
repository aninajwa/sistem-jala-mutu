-- COHERENT V1 INSTALLATION CANDIDATE ONLY. DO NOT EXECUTE.
-- PostgreSQL 17 target. Combines the proposed Admin assignment read RPC and
-- pic_balai-only add/scope-change/revoke RPCs with uniqueness/version safeguards.
-- No endpoint is registered by this SQL. No direct table grants or RLS changes.
-- Installation requires explicit DBA/security/product approval and isolated PG17
-- runtime tests. Review audit_trail nullability/types and deployed role/table DDL.
-- Existing mutation/read proposal files are superseded as install sources; do not
-- install those separately or install duplicate definitions out of this package.

begin;

do $installer_guard$
begin
  if current_user <> 'postgres' then
    raise exception 'Install candidate as postgres';
  end if;
end;
$installer_guard$;

-- Dependency 0 / preflight: stop before any DDL if old nullable tuples duplicate.
do $duplicate_preflight$
begin
  if exists (
    select 1
    from public.pengguna_peran
    group by pengguna_id, peran_id, scope_balai_id, scope_paket_id
    having count(*) > 1
  ) then
    raise exception 'Resolve duplicate pengguna_peran natural-key groups before installation'
      using errcode = '23505', constraint = 'pengguna_peran_assignment_nulls_not_distinct_uq';
  end if;
end;
$duplicate_preflight$;

-- Dependency 1: revision column. Preserve existing assignment rows; default initializes
-- their revision to 1. Every later UPDATE is versioned by the trigger below.
alter table public.pengguna_peran
  add column mutation_version bigint not null default 1;

-- PostgreSQL 17 supports NULLS NOT DISTINCT. This is the database-enforced duplicate
-- guarantee across *all* writers, unlike advisory locks which protect RPC callers only.
create unique index pengguna_peran_assignment_nulls_not_distinct_uq
  on public.pengguna_peran (pengguna_id, peran_id, scope_balai_id, scope_paket_id)
  nulls not distinct;

create or replace function public.admin_role_assignment_bump_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.mutation_version = 9223372036854775807 then
    raise exception 'Assignment version exhausted' using errcode = '22003';
  end if;
  new.mutation_version := old.mutation_version + 1;
  return new;
end;
$function$;
alter function public.admin_role_assignment_bump_version() owner to postgres;
revoke all on function public.admin_role_assignment_bump_version() from public, anon, authenticated;

create trigger pengguna_peran_bump_mutation_version
  before update on public.pengguna_peran
  for each row execute function public.admin_role_assignment_bump_version();

-- Internal authorization helper. It is not executable by API roles directly;
-- caller RPCs execute as postgres and invoke this helper under that owner.
create or replace function public.admin_role_mutation_authorize()
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare v_actor integer;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;
  select actor.pengguna_id into v_actor
  from public.pengguna as actor
  where actor.auth_user_id = auth.uid()
    and not coalesce(actor.terkunci, false)
    and exists (
      select 1
      from public.pengguna_peran as assignment
      join public.peran as role_catalog using (peran_id)
      where assignment.pengguna_id = actor.pengguna_id
        and role_catalog.nama = 'admin'
    );
  if v_actor is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return v_actor;
end;
$function$;

-- Admin-only allow-list for callers that need a peran_id. Return the approved
-- assignable role by stable name; clients must not embed catalog numeric IDs.
create or replace function public.admin_daftar_peran_dapat_ditugaskan()
returns table (peran_id integer, nama_peran text)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  perform public.admin_role_mutation_authorize();
  return query
    select role_catalog.peran_id, role_catalog.nama::text
    from public.peran as role_catalog
    where role_catalog.nama = 'pic_balai'
    order by role_catalog.nama;
end;
$function$;

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

-- Admin-only read projection. The bigint revision is serialized as decimal text.
create or replace function public.admin_daftar_penugasan_peran(p_pengguna_id integer)
returns table (
  pp_id integer, pengguna_id integer, peran_id integer, nama_peran text,
  scope_balai_id integer, scope_paket_id integer, mutation_version text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  perform public.admin_role_mutation_authorize();
  if p_pengguna_id is null or p_pengguna_id < 1 then
    raise exception 'INVALID_TARGET' using errcode = '22023';
  end if;
  if not exists (select 1 from public.pengguna target where target.pengguna_id = p_pengguna_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;
  return query
    select assignment.pp_id, assignment.pengguna_id, assignment.peran_id,
      role_catalog.nama::text, assignment.scope_balai_id, assignment.scope_paket_id,
      assignment.mutation_version::text
    from public.pengguna_peran assignment
    join public.peran role_catalog using (peran_id)
    where assignment.pengguna_id = p_pengguna_id
    order by assignment.pp_id;
end;
$function$;

create or replace function public.admin_tambah_penugasan_peran(
  p_pengguna_id integer, p_peran_id integer,
  p_scope_balai_id integer, p_scope_paket_id integer
)
returns table (
  pp_id integer, pengguna_id integer, peran_id integer,
  scope_balai_id integer, scope_paket_id integer, mutation_version text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare v_actor integer; v_role_name text; v_locked boolean; v_pp_id integer; v_version bigint;
begin
  v_actor := public.admin_role_mutation_authorize();
  if p_pengguna_id is null or p_pengguna_id < 1 or p_peran_id is null then
    raise exception 'INVALID_REQUEST' using errcode = '22023';
  end if;
  -- Same lock among package RPCs; unique index remains the cross-writer guarantee.
  perform pg_catalog.pg_advisory_xact_lock(74192031, 1);
  select target.terkunci into v_locked from public.pengguna target
    where target.pengguna_id = p_pengguna_id for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  if coalesce(v_locked, false) then raise exception 'TARGET_LOCKED' using errcode = '42501'; end if;
  if p_pengguna_id = v_actor then raise exception 'SELF_CHANGE_FORBIDDEN' using errcode = '42501'; end if;

  select role_catalog.nama into v_role_name from public.peran role_catalog
    where role_catalog.peran_id = p_peran_id;
  if v_role_name is null then raise exception 'ROLE_NOT_FOUND' using errcode = '22023'; end if;
  if v_role_name <> 'pic_balai' then raise exception 'ROLE_MUTATION_FORBIDDEN' using errcode = '42501'; end if;
  perform public.admin_role_validate_pic_scope(p_scope_balai_id, p_scope_paket_id);

  insert into public.pengguna_peran(pengguna_id, peran_id, scope_balai_id, scope_paket_id)
    values (p_pengguna_id, p_peran_id, p_scope_balai_id, p_scope_paket_id)
    returning public.pengguna_peran.pp_id, public.pengguna_peran.mutation_version
      into v_pp_id, v_version;
  insert into public.audit_trail(pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu)
    values (v_actor, 'pengguna_peran', v_pp_id::text, 'ASSIGN_ROLE', null,
      pg_catalog.jsonb_build_object('target_pengguna_id', p_pengguna_id, 'peran_id', p_peran_id,
        'nama_peran', v_role_name, 'scope_balai_id', p_scope_balai_id,
        'scope_paket_id', p_scope_paket_id), localtimestamp);
  return query select v_pp_id, p_pengguna_id, p_peran_id,
    p_scope_balai_id, p_scope_paket_id, v_version::text;
end;
$function$;

create or replace function public.admin_ubah_penugasan_peran(
  p_pengguna_id integer, p_pp_id integer, p_expected_version bigint,
  p_scope_balai_id integer, p_scope_paket_id integer
)
returns table (
  pp_id integer, pengguna_id integer, peran_id integer,
  scope_balai_id integer, scope_paket_id integer, mutation_version text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor integer; v_user integer; v_role integer; v_role_name text;
  v_old_balai integer; v_old_package integer; v_version bigint; v_locked boolean;
begin
  v_actor := public.admin_role_mutation_authorize();
  perform pg_catalog.pg_advisory_xact_lock(74192031, 1);
  select assignment.pengguna_id, assignment.peran_id, assignment.scope_balai_id,
    assignment.scope_paket_id, assignment.mutation_version, role_catalog.nama
    into v_user, v_role, v_old_balai, v_old_package, v_version, v_role_name
    from public.pengguna_peran assignment
    join public.peran role_catalog using (peran_id)
    where assignment.pp_id = p_pp_id for update of assignment;
  if not found or v_user <> p_pengguna_id then
    raise exception 'ASSIGNMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_user = v_actor then raise exception 'SELF_CHANGE_FORBIDDEN' using errcode = '42501'; end if;
  if v_role_name <> 'pic_balai' then raise exception 'ROLE_MUTATION_FORBIDDEN' using errcode = '42501'; end if;
  select coalesce(target.terkunci, false) into v_locked from public.pengguna target
    where target.pengguna_id = v_user for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_locked then raise exception 'TARGET_LOCKED' using errcode = '42501'; end if;
  if p_expected_version is null or p_expected_version <> v_version then
    raise exception 'STALE_ASSIGNMENT' using errcode = '40001';
  end if;
  perform public.admin_role_validate_pic_scope(p_scope_balai_id, p_scope_paket_id);

  update public.pengguna_peran assignment
    set scope_balai_id = p_scope_balai_id, scope_paket_id = p_scope_paket_id
    where assignment.pp_id = p_pp_id
    returning assignment.mutation_version into v_version;
  -- BEFORE UPDATE trigger increments the version for every writer, including this RPC.
  insert into public.audit_trail(pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu)
    values (v_actor, 'pengguna_peran', p_pp_id::text, 'CHANGE_ROLE_SCOPE',
      pg_catalog.jsonb_build_object('target_pengguna_id', v_user, 'peran_id', v_role,
        'nama_peran', v_role_name, 'scope_balai_id', v_old_balai, 'scope_paket_id', v_old_package),
      pg_catalog.jsonb_build_object('target_pengguna_id', v_user, 'peran_id', v_role,
        'nama_peran', v_role_name, 'scope_balai_id', p_scope_balai_id, 'scope_paket_id', p_scope_paket_id),
      localtimestamp);
  return query select p_pp_id, v_user, v_role, p_scope_balai_id, p_scope_paket_id, v_version::text;
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
  v_actor integer; v_user integer; v_role integer; v_role_name text;
  v_balai integer; v_package integer; v_version bigint;
begin
  v_actor := public.admin_role_mutation_authorize();
  perform pg_catalog.pg_advisory_xact_lock(74192031, 1);
  select assignment.pengguna_id, assignment.peran_id, assignment.scope_balai_id,
    assignment.scope_paket_id, assignment.mutation_version, role_catalog.nama
    into v_user, v_role, v_balai, v_package, v_version, v_role_name
    from public.pengguna_peran assignment join public.peran role_catalog using (peran_id)
    where assignment.pp_id = p_pp_id for update of assignment;
  if not found or v_user <> p_pengguna_id then
    raise exception 'ASSIGNMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_user = v_actor then raise exception 'SELF_CHANGE_FORBIDDEN' using errcode = '42501'; end if;
  if v_role_name <> 'pic_balai' then raise exception 'ROLE_MUTATION_FORBIDDEN' using errcode = '42501'; end if;
  if p_expected_version is null or p_expected_version <> v_version then
    raise exception 'STALE_ASSIGNMENT' using errcode = '40001';
  end if;
  delete from public.pengguna_peran assignment where assignment.pp_id = p_pp_id;
  insert into public.audit_trail(pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu)
    values (v_actor, 'pengguna_peran', p_pp_id::text, 'REVOKE_ROLE',
      pg_catalog.jsonb_build_object('target_pengguna_id', v_user, 'peran_id', v_role,
        'nama_peran', v_role_name, 'scope_balai_id', v_balai, 'scope_paket_id', v_package),
      null, localtimestamp);
  return query select p_pp_id, true;
end;
$function$;

-- All callable RPCs share trusted owner/fixed search_path. Internal helpers and
-- trigger function are never executable by PUBLIC/anon/authenticated directly.
alter function public.admin_role_mutation_authorize() owner to postgres;
alter function public.admin_daftar_peran_dapat_ditugaskan() owner to postgres;
alter function public.admin_role_validate_pic_scope(integer, integer) owner to postgres;
alter function public.admin_daftar_penugasan_peran(integer) owner to postgres;
alter function public.admin_tambah_penugasan_peran(integer, integer, integer, integer) owner to postgres;
alter function public.admin_ubah_penugasan_peran(integer, integer, bigint, integer, integer) owner to postgres;
alter function public.admin_cabut_penugasan_peran(integer, integer, bigint) owner to postgres;

revoke all on function public.admin_role_mutation_authorize() from public, anon, authenticated;
revoke all on function public.admin_daftar_peran_dapat_ditugaskan() from public, anon, authenticated;
revoke all on function public.admin_role_validate_pic_scope(integer, integer) from public, anon, authenticated;
revoke all on function public.admin_role_assignment_bump_version() from public, anon, authenticated;
revoke all on function public.admin_daftar_penugasan_peran(integer) from public, anon, authenticated;
revoke all on function public.admin_tambah_penugasan_peran(integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_ubah_penugasan_peran(integer, integer, bigint, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_cabut_penugasan_peran(integer, integer, bigint) from public, anon, authenticated;

grant execute on function public.admin_daftar_penugasan_peran(integer) to authenticated;
grant execute on function public.admin_daftar_peran_dapat_ditugaskan() to authenticated;
grant execute on function public.admin_tambah_penugasan_peran(integer, integer, integer, integer) to authenticated;
grant execute on function public.admin_ubah_penugasan_peran(integer, integer, bigint, integer, integer) to authenticated;
grant execute on function public.admin_cabut_penugasan_peran(integer, integer, bigint) to authenticated;

commit;
