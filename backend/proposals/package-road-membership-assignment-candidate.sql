-- CANDIDATE ONLY — NOT INSTALLED. Review and approve separately.
-- Adds only two authenticated RPC contracts for PIC Balai package-road setup.
-- No table grants, RLS changes, Admin API, Provider assignment, deletes,
-- reassignment, existing function replacement, or automatic package 11 data.
--
-- Exact installed location columns: lokasi_id (sequence-backed PK), paket_id,
-- jenis_survei_id, ruas_id, jembatan_id, lereng_id, jenis_pemeriksaan,
-- target_volume, semester, lampiran. The mutation inserts only package, road,
-- active survey type and explicitly supplied semester; other location fields
-- remain NULL. Semester is nullable in the installed schema and has no lookup
-- table/check constraint. A non-NULL value is therefore accepted only if that
-- integer already appears on another lokasi_pekerjaan row in this same package.
-- This avoids inventing semester codes. Active survey types come from the
-- installed jenis_survei catalog. Existing location rows are never changed.
--
-- Proposed required execute permissions after approval/installation:
--   authenticated: public.daftar_opsi_ruas_paket(integer)
--   authenticated: public.tambah_lokasi_ruas_paket(integer,integer,integer,integer)
--   authenticated: corresponding app_private implementation functions below
--   public/anon: no execute on these new functions
-- No authenticated table DML permissions are added. Functions are postgres-owned
-- SECURITY DEFINER with empty search_path; callers must use the RPC wrappers.

begin;

create or replace function app_private.assert_pic_package_road_scope(
  p_actor integer,
  p_paket_id integer,
  p_balai_id integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_scope_balai_id integer;
  v_scope_paket_id integer;
begin
  if p_actor is null or p_paket_id is null or p_balai_id is null then
    raise exception 'Identitas, paket dan Balai aktif diperlukan' using errcode = '42501';
  end if;

  -- Caller first locks the package (SHARE for listing, UPDATE for addition).
  -- Lock this role row second so authorization cannot be revoked mid-operation.
  select pp.scope_balai_id, pp.scope_paket_id
    into v_scope_balai_id, v_scope_paket_id
  from public.pengguna_peran pp
  join public.peran r using (peran_id)
  where pp.pengguna_id = p_actor
    and r.nama = 'pic_balai'
    and pp.scope_balai_id = p_balai_id
    and (pp.scope_paket_id is null or pp.scope_paket_id = p_paket_id)
  order by pp.pp_id
  limit 1
  for share of pp;

  if not found then
    raise exception 'PIC Balai tidak ditugaskan pada Balai dan paket ini'
      using errcode = '42501';
  end if;
  return p_actor;
end;
$function$;

create or replace function app_private.daftar_opsi_ruas_paket(p_paket_id integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor integer;
  v_package public.paket_kontrak;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;
  select u.pengguna_id into v_actor
  from public.pengguna u
  where u.auth_user_id = auth.uid()
    and not coalesce(u.terkunci, false);
  if v_actor is null then
    raise exception 'Identitas aktif diperlukan' using errcode = '42501';
  end if;

  -- Protect one package snapshot before scope authorization and use that same
  -- Balai/package row throughout this read. Concurrent Balai edits wait.
  select * into v_package
  from public.paket_kontrak p
  where p.paket_id = p_paket_id
  for share;
  if not found then
    raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002';
  end if;
  perform app_private.assert_pic_package_road_scope(
    v_actor, v_package.paket_id, v_package.balai_id
  );

  return jsonb_build_object(
    'paket_id', v_package.paket_id,
    'balai_id', v_package.balai_id,
    'survei', coalesce((
      select jsonb_agg(jsonb_build_object(
        'jenis_survei_id', s.jenis_survei_id, 'kode', s.kode, 'nama', s.nama
      ) order by s.kode, s.jenis_survei_id)
      from public.jenis_survei s
      where s.aktif is true
    ), '[]'::jsonb),
    'semester_tersedia', coalesce((
      select jsonb_agg(x.semester order by x.semester)
      from (
        select distinct lp.semester
        from public.lokasi_pekerjaan lp
        where lp.paket_id = v_package.paket_id
          and lp.semester is not null
      ) x
    ), '[]'::jsonb),
    'ruas_tersedia', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.nomor_ruas, r.ruas_id)
      from public.ruas_jalan r
      where r.balai_id = v_package.balai_id
    ), '[]'::jsonb),
    'lokasi_ditetapkan', coalesce((
      select jsonb_agg(jsonb_build_object(
        'lokasi', to_jsonb(lp),
        'ruas', case when r.ruas_id is null then null else to_jsonb(r) end,
        'survei', case when s.jenis_survei_id is null then null else jsonb_build_object(
          'jenis_survei_id', s.jenis_survei_id, 'kode', s.kode, 'nama', s.nama
        ) end
      ) order by lp.lokasi_id)
      from public.lokasi_pekerjaan lp
      left join public.ruas_jalan r
        on r.ruas_id = lp.ruas_id and r.balai_id = v_package.balai_id
      left join public.jenis_survei s on s.jenis_survei_id = lp.jenis_survei_id
      where lp.paket_id = v_package.paket_id
    ), '[]'::jsonb)
  );
end;
$function$;

create or replace function app_private.tambah_lokasi_ruas_paket(
  p_paket_id integer,
  p_ruas_id integer,
  p_jenis_survei_id integer,
  p_semester integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor integer;
  v_package public.paket_kontrak;
  v_road public.ruas_jalan;
  v_location public.lokasi_pekerjaan;
  v_roads jsonb;
  v_lock_key bigint;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;
  select u.pengguna_id into v_actor
  from public.pengguna u
  where u.auth_user_id = auth.uid()
    and not coalesce(u.terkunci, false);
  if v_actor is null then
    raise exception 'Identitas aktif diperlukan' using errcode = '42501';
  end if;
  if p_paket_id is null or p_ruas_id is null or p_jenis_survei_id is null then
    raise exception 'Paket, ruas dan jenis survei wajib dipilih' using errcode = '22023';
  end if;

  -- Take the strongest package lock before touching the role assignment. This
  -- avoids a SHARE-to-UPDATE lock upgrade and holds the checked Balai stable.
  select * into v_package
  from public.paket_kontrak p
  where p.paket_id = p_paket_id
  for update;
  if not found then
    raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002';
  end if;

  v_actor := app_private.assert_pic_package_road_scope(
    v_actor, v_package.paket_id, v_package.balai_id
  );

  -- Serialize additions within the exact nullable survey/semester scope.
  -- Package-first, role-second locks are already held by this transaction.
  v_lock_key := hashtextextended(
    concat_ws(':', p_paket_id::text, p_ruas_id::text, p_jenis_survei_id::text,
      coalesce(p_semester::text, '<NULL>')),
    0
  );
  perform pg_advisory_xact_lock(v_lock_key);

  if not exists (
    select 1 from public.jenis_survei s
    where s.jenis_survei_id = p_jenis_survei_id and s.aktif is true
  ) then
    raise exception 'Jenis survei tidak aktif atau tidak ditemukan' using errcode = '22023';
  end if;
  if p_semester is not null and not exists (
    select 1 from public.lokasi_pekerjaan lp
    where lp.paket_id = p_paket_id and lp.semester = p_semester
  ) then
    raise exception 'Semester belum tersedia pada lokasi paket ini; pilih nilai yang sudah tercatat atau tanpa semester'
      using errcode = '22023';
  end if;

  -- Hide whether a foreign-Balai road exists.
  select * into v_road
  from public.ruas_jalan r
  where r.ruas_id = p_ruas_id and r.balai_id = v_package.balai_id
  for share;
  if not found then
    raise exception 'Ruas tidak tersedia dalam Balai paket ini' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.lokasi_pekerjaan lp
    where lp.paket_id = p_paket_id
      and lp.ruas_id = p_ruas_id
      and lp.jenis_survei_id = p_jenis_survei_id
      and lp.semester is not distinct from p_semester
  ) then
    raise exception 'Ruas sudah ditambahkan untuk jenis survei dan semester ini'
      using errcode = '23505';
  end if;

  insert into public.lokasi_pekerjaan(
    lokasi_id, paket_id, jenis_survei_id, ruas_id, semester
  ) values (
    nextval('public.lokasi_pekerjaan_lokasi_id_seq'::regclass),
    p_paket_id, p_jenis_survei_id, p_ruas_id, p_semester
  )
  returning * into v_location;

  insert into public.audit_trail(pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu)
  values (
    v_actor, 'lokasi_pekerjaan', v_location.lokasi_id::text,
    'ASSIGN_PACKAGE_ROAD',
    null,
    jsonb_build_object(
      'lokasi_id', v_location.lokasi_id,
      'paket_id', v_location.paket_id,
      'ruas_id', v_location.ruas_id,
      'jenis_survei_id', v_location.jenis_survei_id,
      'semester', v_location.semester
    ),
    localtimestamp
  );

  -- Reuse the same installed official package-road read as Provider/Stage 4.
  v_roads := app_private.baca_ruas_paket(p_paket_id);
  if not exists (
    select 1 from jsonb_array_elements(v_roads) as road_item(value)
    where (road_item.value->>'ruas_id')::integer = p_ruas_id
  ) then
    raise exception 'Bacaan ulang keanggotaan ruas paket tidak mengesahkan penambahan'
      using errcode = '55000';
  end if;

  return jsonb_build_object('lokasi', to_jsonb(v_location), 'ruas_paket', v_roads);
end;
$function$;

create or replace function public.daftar_opsi_ruas_paket(p_paket_id integer)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select app_private.daftar_opsi_ruas_paket(p_paket_id);
$function$;

create or replace function public.tambah_lokasi_ruas_paket(
  p_paket_id integer,
  p_ruas_id integer,
  p_jenis_survei_id integer,
  p_semester integer
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select app_private.tambah_lokasi_ruas_paket(
    p_paket_id, p_ruas_id, p_jenis_survei_id, p_semester
  );
$function$;

revoke all on function app_private.assert_pic_package_road_scope(integer, integer, integer) from public, anon, authenticated;
revoke all on function app_private.daftar_opsi_ruas_paket(integer) from public, anon;
revoke all on function app_private.tambah_lokasi_ruas_paket(integer, integer, integer, integer) from public, anon;
revoke all on function public.daftar_opsi_ruas_paket(integer) from public, anon;
revoke all on function public.tambah_lokasi_ruas_paket(integer, integer, integer, integer) from public, anon;
grant execute on function app_private.daftar_opsi_ruas_paket(integer) to authenticated;
grant execute on function app_private.tambah_lokasi_ruas_paket(integer, integer, integer, integer) to authenticated;
grant execute on function public.daftar_opsi_ruas_paket(integer) to authenticated;
grant execute on function public.tambah_lokasi_ruas_paket(integer, integer, integer, integer) to authenticated;

commit;
