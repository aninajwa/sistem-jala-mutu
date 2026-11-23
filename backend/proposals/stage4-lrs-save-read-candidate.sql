-- HISTORICAL IMPLEMENTATION CANDIDATE. The connected project's Supabase
-- migration ledger now reports 20261111080955_stage4_lrs_save_read as applied.
-- Do not apply or reapply this file. The local install record is
-- stage4-lrs-installed-migration-record.md; this candidate is not an authoritative
-- byte-for-byte copy of the installed migration.
--
-- READ-ONLY CATALOG FACTS (cross-checked against the connected project):
-- validasi_lrs has validasi_lrs_id int PK, paket_id int,
-- ruas_id int, panjang_lapangan_m numeric, panjang_acuan_m numeric, deviasi_m
-- numeric, jumlah_error_topologi int, format_sesuai_glossary bool,
-- sta_konsisten_iri_pci_ldt bool, status varchar, tgl_valid date. Only PK and
-- package/road FKs exist; no table unique key, row-version column, trigger or
-- policy was found. RLS is enabled. The owned ID sequence exists but is not a
-- column default. It currently has zero rows. audit_trail has trail_id bigint, pengguna_id int, tabel,
-- record_id, aksi, nilai_lama/nilai_baru jsonb, waktu default current_timestamp;
-- its owned ID sequence exists but trail_id has no default.
--
-- OWNER DECISIONS THAT MUST BE APPROVED BEFORE APPLYING:
-- 1) This candidate treats (paket_id,ruas_id) as one current validation identity.
--    Existing duplicates make the unique index fail closed and must be reconciled.
-- 2) Writer is an unlocked Penyedia Jasa who created the package. Reader is that
--    provider or PIC Balai scoped to package/Balai. Other role access is excluded.
-- 3) Expected version 0 means create; versions advance on each update. Existing
--    rows are seeded version 0. Version state lives in app_private, not public.
-- 4) Inputs are observations/checks only. This does NOT compute deviasi_m, status,
--    or tgl_valid and does not decide tolerance, PASS, or approval. New rows have
--    these values NULL; updates clear them to avoid retaining stale derived state.
--    Approval of that reset behavior is required.
-- 5) Numeric lengths/topology count must be non-negative; zero is accepted.
--    No RNI/LRS tolerance or status criterion is inferred.
-- 6) Save/read are the only operations included. Submit/review and external
--    system upload remain outside this contract.
-- 7) SECURITY DEFINER functions are explicitly owned by postgres, matching the
--    installed RPC owner; auth.uid() continues to read the caller JWT context.
--    postgres has BYPASSRLS. Public wrappers are SECURITY INVOKER; only the
--    authenticated role receives their EXECUTE grant. Never grant anon/PUBLIC.

begin;

-- SECURITY DEFINER ownership is part of the security boundary. Require the
-- Supabase migration owner observed on installed RPCs; abort rather than install
-- functions owned by an unexpected deployer role. postgres has BYPASSRLS here.
do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Run this reviewed candidate as postgres so RPC ownership/RLS behavior is predictable';
  end if;
end $$;

-- Fail closed if old data violates the proposed one-current-row-per-package/road
-- key. Review duplicates before any dedicated QA application.
create unique index validasi_lrs_paket_ruas_uq
  on public.validasi_lrs(paket_id,ruas_id)
  where paket_id is not null and ruas_id is not null;

create table app_private.validasi_lrs_version (
  validasi_lrs_id integer primary key references public.validasi_lrs(validasi_lrs_id) on delete cascade,
  versi integer not null check (versi between 0 and 2147483646)
);
alter table app_private.validasi_lrs_version owner to postgres;
insert into app_private.validasi_lrs_version(validasi_lrs_id,versi)
select validasi_lrs_id,0 from public.validasi_lrs
on conflict (validasi_lrs_id) do nothing;
alter table app_private.validasi_lrs_version enable row level security;
revoke all on table app_private.validasi_lrs_version from public,anon,authenticated;

create or replace function app_private.assert_validasi_lrs_access(p_paket_id integer,p_write boolean)
returns integer language plpgsql security definer set search_path = '' as $$
declare u public.pengguna; p public.paket_kontrak;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
  select * into u from public.pengguna where auth_user_id=auth.uid() and not coalesce(terkunci,false);
  if not found then raise exception 'Profil tidak berwenang' using errcode='42501'; end if;
  select * into p from public.paket_kontrak where paket_id=p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  if p_write then
    if p.created_by is distinct from u.pengguna_id or not exists(
      select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
      where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa'
    ) then raise exception 'Hanya Penyedia Jasa pemilik paket boleh menyimpan validasi LRS' using errcode='42501'; end if;
  elsif not (
    (p.created_by=u.pengguna_id and exists(select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
      where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa'))
    or exists(select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
      where pp.pengguna_id=u.pengguna_id and r.nama='pic_balai' and pp.scope_balai_id=p.balai_id
        and (pp.scope_paket_id is null or pp.scope_paket_id=p_paket_id))
  ) then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  return u.pengguna_id;
end $$;
revoke all on function app_private.assert_validasi_lrs_access(integer,boolean) from public,anon,authenticated;

create or replace function app_private.baca_validasi_lrs(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.assert_validasi_lrs_access(p_paket_id,false);
  return coalesce((select jsonb_agg(to_jsonb(v)||jsonb_build_object('versi',coalesce(x.versi,0)) order by v.ruas_id,v.validasi_lrs_id)
    from public.validasi_lrs v left join app_private.validasi_lrs_version x using(validasi_lrs_id)
    join public.paket_kontrak p on p.paket_id=v.paket_id
    join public.ruas_jalan r on r.ruas_id=v.ruas_id and r.balai_id=p.balai_id
    where v.paket_id=p_paket_id),'[]'::jsonb);
end $$;

create or replace function app_private.simpan_validasi_lrs(
  p_paket_id integer,p_ruas_id integer,p_expected_version integer,p_data jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor integer; p public.paket_kontrak; r public.ruas_jalan; current_row public.validasi_lrs;
  record_id integer; current_version integer; next_version integer; before_value jsonb; after_value jsonb;
  field_length numeric; reference_length numeric; topology_count integer;
  glossary_ok boolean; sta_ok boolean;
begin
  actor:=app_private.assert_validasi_lrs_access(p_paket_id,true);
  if p_ruas_id is null or p_ruas_id<1 or p_expected_version is null or p_expected_version<0
    or p_expected_version>2147483646 then raise exception 'Paket, ruas, atau versi tidak valid' using errcode='22023'; end if;
  if p_data is null or jsonb_typeof(p_data) is distinct from 'object'
    then raise exception 'Data validasi LRS mesti berupa objek' using errcode='22023'; end if;
  if (select count(*) from jsonb_object_keys(p_data))<>5 or not(p_data ?& array[
    'panjang_lapangan_m','panjang_acuan_m','jumlah_error_topologi',
    'format_sesuai_glossary','sta_konsisten_iri_pci_ldt'])
    then raise exception 'Data validasi LRS tidak sesuai kontrak' using errcode='22023'; end if;
  if jsonb_typeof(p_data->'panjang_lapangan_m') is distinct from 'number'
    or jsonb_typeof(p_data->'panjang_acuan_m') is distinct from 'number'
    or jsonb_typeof(p_data->'jumlah_error_topologi') is distinct from 'number'
    or jsonb_typeof(p_data->'format_sesuai_glossary') is distinct from 'boolean'
    or jsonb_typeof(p_data->'sta_konsisten_iri_pci_ldt') is distinct from 'boolean'
    then raise exception 'Panjang/topologi mesti numerik dan pemeriksaan mesti boolean' using errcode='22023'; end if;
  begin
    field_length:=(p_data->>'panjang_lapangan_m')::numeric;
    reference_length:=(p_data->>'panjang_acuan_m')::numeric;
    topology_count:=(p_data->>'jumlah_error_topologi')::integer;
    glossary_ok:=(p_data->>'format_sesuai_glossary')::boolean;
    sta_ok:=(p_data->>'sta_konsisten_iri_pci_ldt')::boolean;
  exception when others then raise exception 'Nilai validasi LRS tidak sah atau di luar rentang' using errcode='22023'; end;
  if field_length<0 or reference_length<0 or topology_count<0
    or topology_count::numeric<>(p_data->>'jumlah_error_topologi')::numeric
    then raise exception 'Panjang dan jumlah error tidak boleh negatif; jumlah error mesti integer' using errcode='22023'; end if;

  select * into p from public.paket_kontrak where paket_id=p_paket_id for share;
  select * into r from public.ruas_jalan where ruas_id=p_ruas_id and balai_id=p.balai_id for share;
  if not found then raise exception 'Ruas tidak ditemukan dalam Balai paket' using errcode='22023'; end if;
  -- Transaction-scoped lock serializes create/update for this logical key even
  -- before the row exists. Hash collisions only serialize unrelated keys.
  perform pg_advisory_xact_lock(hashtextextended(p_paket_id::text||':'||p_ruas_id::text,0));
  select * into current_row from public.validasi_lrs where paket_id=p_paket_id and ruas_id=p_ruas_id for update;
  if found then
    record_id:=current_row.validasi_lrs_id;
    insert into app_private.validasi_lrs_version(validasi_lrs_id,versi) values(record_id,0) on conflict do nothing;
    select versi into current_version from app_private.validasi_lrs_version where validasi_lrs_id=record_id for update;
    if current_version<>p_expected_version then raise exception 'Versi validasi LRS berubah; muat ulang sebelum menyimpan' using errcode='40001'; end if;
    before_value:=to_jsonb(current_row)||jsonb_build_object('versi',current_version);
    if current_version>=2147483646 then raise exception 'Versi maksimum tercapai' using errcode='22003'; end if;
    next_version:=current_version+1;
    update public.validasi_lrs set
      panjang_lapangan_m=field_length,panjang_acuan_m=reference_length,
      jumlah_error_topologi=topology_count,format_sesuai_glossary=glossary_ok,
      sta_konsisten_iri_pci_ldt=sta_ok,deviasi_m=null,status=null,tgl_valid=null
      where validasi_lrs_id=record_id returning * into current_row;
    update app_private.validasi_lrs_version set versi=next_version where validasi_lrs_id=record_id;
  else
    if p_expected_version<>0 then raise exception 'Validasi LRS belum ada; versi awal harus 0' using errcode='40001'; end if;
    record_id:=nextval('public.validasi_lrs_validasi_lrs_id_seq'::regclass);
    next_version:=1;
    insert into public.validasi_lrs(validasi_lrs_id,paket_id,ruas_id,panjang_lapangan_m,panjang_acuan_m,
      deviasi_m,jumlah_error_topologi,format_sesuai_glossary,sta_konsisten_iri_pci_ldt,status,tgl_valid)
      values(record_id,p_paket_id,p_ruas_id,field_length,reference_length,null,topology_count,glossary_ok,sta_ok,null,null)
      returning * into current_row;
    insert into app_private.validasi_lrs_version(validasi_lrs_id,versi) values(record_id,next_version);
  end if;
  after_value:=to_jsonb(current_row)||jsonb_build_object('versi',next_version);
  insert into public.audit_trail(trail_id,pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
    values(nextval('public.audit_trail_trail_id_seq'::regclass),actor,'validasi_lrs',record_id::text,
      case when before_value is null then 'CREATE' else 'UPDATE' end,before_value,after_value,localtimestamp);
  return after_value;
end $$;

create or replace function public.baca_validasi_lrs(p_paket_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.baca_validasi_lrs(p_paket_id);
$$;
create or replace function public.simpan_validasi_lrs(
  p_paket_id integer,p_ruas_id integer,p_expected_version integer,p_data jsonb
) returns jsonb language sql security invoker set search_path = '' as $$
  select app_private.simpan_validasi_lrs(p_paket_id,p_ruas_id,p_expected_version,p_data);
$$;

-- Fix definer identity, do not rely on whichever role happens to run the DDL.
alter function app_private.assert_validasi_lrs_access(integer,boolean) owner to postgres;
alter function app_private.baca_validasi_lrs(integer) owner to postgres;
alter function app_private.simpan_validasi_lrs(integer,integer,integer,jsonb) owner to postgres;
alter function public.baca_validasi_lrs(integer) owner to postgres;
alter function public.simpan_validasi_lrs(integer,integer,integer,jsonb) owner to postgres;

-- Keep the shared access helper callable only by its postgres-owned definer
-- functions. The authenticated role needs execute on the two data RPCs because
-- the public invoker wrappers call them; it cannot bypass their checks.
revoke all on function app_private.assert_validasi_lrs_access(integer,boolean) from public,anon,authenticated;
revoke all on function app_private.baca_validasi_lrs(integer) from public,anon,authenticated,service_role;
revoke all on function app_private.simpan_validasi_lrs(integer,integer,integer,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.baca_validasi_lrs(integer) from public,anon,authenticated,service_role;
revoke all on function public.simpan_validasi_lrs(integer,integer,integer,jsonb) from public,anon,authenticated,service_role;
grant execute on function app_private.assert_validasi_lrs_access(integer,boolean) to postgres;
grant execute on function app_private.baca_validasi_lrs(integer) to authenticated;
grant execute on function app_private.simpan_validasi_lrs(integer,integer,integer,jsonb) to authenticated;
grant execute on function public.baca_validasi_lrs(integer) to authenticated;
grant execute on function public.simpan_validasi_lrs(integer,integer,integer,jsonb) to authenticated;

commit;
