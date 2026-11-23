-- SUPERSEDED V1 MUTATION FRAGMENT. NOT INSTALLED OR EXECUTED.
-- Use backend/proposals/admin-role-management-v1-install.sql as the single coherent
-- installation package; do not execute this duplicate/older schema proposal.
-- Fail-closed role scope policy: only pic_balai currently has an approved mutation
-- scope rule in repository evidence. Other non-admin roles deliberately return 22023.
-- No direct table grants or RLS changes are made. Existing FK definitions are assumed
-- as supplied by the owner; inspect audit nullability and all other writers first.

begin;
do $guard$ begin if current_user <> 'postgres' then raise exception 'Install as postgres'; end if; end $guard$;

alter table public.pengguna_peran add column if not exists mutation_version bigint not null default 1;

create or replace function public.admin_role_mutation_authorize()
returns integer language plpgsql security definer set search_path = '' as $f$
declare v_actor integer;
begin
 if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
 select u.pengguna_id into v_actor from public.pengguna u
 where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false)
 and exists(select 1 from public.pengguna_peran a join public.peran r using(peran_id)
  where a.pengguna_id=u.pengguna_id and r.nama='admin');
 if v_actor is null then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 return v_actor;
end $f$;

create or replace function public.admin_role_validate_scope(p_role text,p_balai integer,p_paket integer)
returns void language plpgsql security definer set search_path = '' as $f$
begin
 if p_role <> 'pic_balai' then raise exception 'ROLE_SCOPE_RULE_UNRESOLVED' using errcode='22023'; end if;
 if p_balai is null then raise exception 'INVALID_SCOPE' using errcode='22023'; end if;
 if not exists(select 1 from public.balai b where b.balai_id=p_balai) then raise exception 'SCOPE_NOT_FOUND' using errcode='P0002'; end if;
 if not exists(select 1 from public.balai b where b.balai_id=p_balai and b.aktif is true) then raise exception 'BALAI_INACTIVE' using errcode='23503'; end if;
 if p_paket is not null and not exists(select 1 from public.paket_kontrak p where p.paket_id=p_paket and p.balai_id=p_balai)
 then raise exception 'SCOPE_RELATION_CONFLICT' using errcode='23503'; end if;
end $f$;

-- Read-only Admin assignment projection. BIGINT revision is returned as text to
-- avoid JavaScript number precision loss in PostgREST/JSON clients.
create or replace function public.admin_daftar_penugasan_peran(p_pengguna_id integer)
returns table(pp_id integer,pengguna_id integer,peran_id integer,nama_peran text,
 scope_balai_id integer,scope_paket_id integer,mutation_version text)
language plpgsql stable security definer set search_path = '' as $f$
begin
 if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
 if not exists(select 1 from public.pengguna u join public.pengguna_peran a using(pengguna_id)
  join public.peran r using(peran_id) where u.auth_user_id=auth.uid()
  and not coalesce(u.terkunci,false) and r.nama='admin')
 then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if not exists(select 1 from public.pengguna u where u.pengguna_id=p_pengguna_id)
 then raise exception 'USER_NOT_FOUND' using errcode='P0002'; end if;
 return query select a.pp_id,a.pengguna_id,a.peran_id,r.nama::text,a.scope_balai_id,a.scope_paket_id,a.mutation_version::text
 from public.pengguna_peran a join public.peran r using(peran_id)
 where a.pengguna_id=p_pengguna_id order by a.pp_id;
end $f$;

create or replace function public.admin_tambah_penugasan_peran(p_pengguna_id integer,p_peran_id integer,p_scope_balai_id integer,p_scope_paket_id integer)
returns table(pp_id integer,pengguna_id integer,peran_id integer,scope_balai_id integer,scope_paket_id integer,version bigint)
language plpgsql security definer set search_path = '' as $f$
declare v_actor integer; v_name text; v_locked boolean; v_id integer; v_version bigint;
begin
 v_actor:=public.admin_role_mutation_authorize();
 if p_pengguna_id is null or p_peran_id is null then raise exception 'INVALID_REQUEST' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(74192031,1);
 select u.terkunci into v_locked from public.pengguna u where u.pengguna_id=p_pengguna_id for update;
 if not found then raise exception 'USER_NOT_FOUND' using errcode='P0002'; end if;
 if coalesce(v_locked,false) then raise exception 'TARGET_LOCKED' using errcode='42501'; end if;
 if p_pengguna_id=v_actor then raise exception 'SELF_CHANGE_FORBIDDEN' using errcode='42501'; end if;
 select r.nama into v_name from public.peran r where r.peran_id=p_peran_id and r.nama<>'admin';
 if v_name is null then raise exception 'ROLE_NOT_ASSIGNABLE' using errcode='22023'; end if;
 perform public.admin_role_validate_scope(v_name,p_scope_balai_id,p_scope_paket_id);
 if exists(select 1 from public.pengguna_peran a where a.pengguna_id=p_pengguna_id and a.peran_id=p_peran_id
 and a.scope_balai_id is not distinct from p_scope_balai_id and a.scope_paket_id is not distinct from p_scope_paket_id)
 then raise exception 'ASSIGNMENT_EXISTS' using errcode='23505'; end if;
 insert into public.pengguna_peran(pengguna_id,peran_id,scope_balai_id,scope_paket_id)
 values(p_pengguna_id,p_peran_id,p_scope_balai_id,p_scope_paket_id) returning public.pengguna_peran.pp_id,public.pengguna_peran.mutation_version into v_id,v_version;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(v_actor,'pengguna_peran',v_id::text,'ASSIGN_ROLE',null,pg_catalog.jsonb_build_object('target_pengguna_id',p_pengguna_id,'peran_id',p_peran_id,'nama_peran',v_name,'scope_balai_id',p_scope_balai_id,'scope_paket_id',p_scope_paket_id),localtimestamp);
 return query select v_id,p_pengguna_id,p_peran_id,p_scope_balai_id,p_scope_paket_id,v_version;
end $f$;

create or replace function public.admin_ubah_penugasan_peran(p_pengguna_id integer,p_pp_id integer,p_expected_version bigint,p_scope_balai_id integer,p_scope_paket_id integer)
returns table(pp_id integer,pengguna_id integer,peran_id integer,scope_balai_id integer,scope_paket_id integer,version bigint)
language plpgsql security definer set search_path = '' as $f$
declare v_actor integer; v_user integer; v_role integer; v_name text; v_old_balai integer; v_old_paket integer; v_version bigint; v_locked boolean;
begin
 v_actor:=public.admin_role_mutation_authorize(); perform pg_catalog.pg_advisory_xact_lock(74192031,1);
 select a.pengguna_id,a.peran_id,a.scope_balai_id,a.scope_paket_id,a.mutation_version,r.nama
 into v_user,v_role,v_old_balai,v_old_paket,v_version,v_name from public.pengguna_peran a join public.peran r using(peran_id)
 where a.pp_id=p_pp_id for update of a;
 if not found or v_user<>p_pengguna_id then raise exception 'ASSIGNMENT_NOT_FOUND' using errcode='P0002'; end if;
 if v_user=v_actor then raise exception 'SELF_CHANGE_FORBIDDEN' using errcode='42501'; end if;
 select coalesce(u.terkunci,false) into v_locked from public.pengguna u where u.pengguna_id=v_user for update;
 if v_locked then raise exception 'TARGET_LOCKED' using errcode='42501'; end if;
  if v_name<>'pic_balai' then raise exception 'ROLE_MUTATION_FORBIDDEN' using errcode='42501'; end if;
 if p_expected_version is null or p_expected_version<>v_version then raise exception 'STALE_ASSIGNMENT' using errcode='40001'; end if;
 perform public.admin_role_validate_scope(v_name,p_scope_balai_id,p_scope_paket_id);
 if exists(select 1 from public.pengguna_peran a where a.pengguna_id=v_user and a.peran_id=v_role and a.pp_id<>p_pp_id
 and a.scope_balai_id is not distinct from p_scope_balai_id and a.scope_paket_id is not distinct from p_scope_paket_id)
 then raise exception 'ASSIGNMENT_EXISTS' using errcode='23505'; end if;
 update public.pengguna_peran a set scope_balai_id=p_scope_balai_id,scope_paket_id=p_scope_paket_id,mutation_version=a.mutation_version+1 where a.pp_id=p_pp_id returning a.mutation_version into v_version;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(v_actor,'pengguna_peran',p_pp_id::text,'CHANGE_ROLE_SCOPE',pg_catalog.jsonb_build_object('target_pengguna_id',v_user,'peran_id',v_role,'nama_peran',v_name,'scope_balai_id',v_old_balai,'scope_paket_id',v_old_paket),pg_catalog.jsonb_build_object('target_pengguna_id',v_user,'peran_id',v_role,'nama_peran',v_name,'scope_balai_id',p_scope_balai_id,'scope_paket_id',p_scope_paket_id),localtimestamp);
 return query select p_pp_id,v_user,v_role,p_scope_balai_id,p_scope_paket_id,v_version;
end $f$;

create or replace function public.admin_cabut_penugasan_peran(p_pengguna_id integer,p_pp_id integer,p_expected_version bigint)
returns table(pp_id integer,revoked boolean)
language plpgsql security definer set search_path = '' as $f$
declare v_actor integer; v_user integer; v_role integer; v_name text; v_balai integer; v_paket integer; v_version bigint;
begin
 v_actor:=public.admin_role_mutation_authorize(); perform pg_catalog.pg_advisory_xact_lock(74192031,1);
 select a.pengguna_id,a.peran_id,a.scope_balai_id,a.scope_paket_id,a.mutation_version,r.nama
 into v_user,v_role,v_balai,v_paket,v_version,v_name from public.pengguna_peran a join public.peran r using(peran_id) where a.pp_id=p_pp_id for update of a;
 if not found or v_user<>p_pengguna_id then raise exception 'ASSIGNMENT_NOT_FOUND' using errcode='P0002'; end if;
 if v_user=v_actor then raise exception 'SELF_CHANGE_FORBIDDEN' using errcode='42501'; end if;
  if v_name<>'pic_balai' then raise exception 'ROLE_MUTATION_FORBIDDEN' using errcode='42501'; end if;
 if p_expected_version is null or p_expected_version<>v_version then raise exception 'STALE_ASSIGNMENT' using errcode='40001'; end if;
 delete from public.pengguna_peran a where a.pp_id=p_pp_id;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(v_actor,'pengguna_peran',p_pp_id::text,'REVOKE_ROLE',pg_catalog.jsonb_build_object('target_pengguna_id',v_user,'peran_id',v_role,'nama_peran',v_name,'scope_balai_id',v_balai,'scope_paket_id',v_paket),null,localtimestamp);
 return query select p_pp_id,true;
end $f$;

alter function public.admin_role_mutation_authorize() owner to postgres;
alter function public.admin_role_validate_scope(text,integer,integer) owner to postgres;
alter function public.admin_daftar_penugasan_peran(integer) owner to postgres;
alter function public.admin_tambah_penugasan_peran(integer,integer,integer,integer) owner to postgres;
alter function public.admin_ubah_penugasan_peran(integer,integer,bigint,integer,integer) owner to postgres;
alter function public.admin_cabut_penugasan_peran(integer,integer,bigint) owner to postgres;
revoke all on function public.admin_role_mutation_authorize() from public,anon,authenticated;
revoke all on function public.admin_role_validate_scope(text,integer,integer) from public,anon,authenticated;
revoke all on function public.admin_daftar_penugasan_peran(integer) from public,anon,authenticated;
revoke all on function public.admin_tambah_penugasan_peran(integer,integer,integer,integer) from public,anon,authenticated;
revoke all on function public.admin_ubah_penugasan_peran(integer,integer,bigint,integer,integer) from public,anon,authenticated;
revoke all on function public.admin_cabut_penugasan_peran(integer,integer,bigint) from public,anon,authenticated;
grant execute on function public.admin_tambah_penugasan_peran(integer,integer,integer,integer) to authenticated;
grant execute on function public.admin_daftar_penugasan_peran(integer) to authenticated;
grant execute on function public.admin_ubah_penugasan_peran(integer,integer,bigint,integer,integer) to authenticated;
grant execute on function public.admin_cabut_penugasan_peran(integer,integer,bigint) to authenticated;
commit;
