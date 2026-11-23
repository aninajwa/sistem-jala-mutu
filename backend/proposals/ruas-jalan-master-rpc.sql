-- Proposal only: not applied to Supabase.
-- Stage 4 package-road contract correction. The connected database was inspected
-- read-only: public.baca_ruas_paket(integer)->jsonb and
-- public.simpan_validasi_lrs(integer,integer,integer,jsonb)->jsonb are installed.
-- This patch changes only their postgres-owned app_private implementations;
-- it preserves signatures, SECURITY DEFINER, empty search_path, authorization,
-- public wrappers, ownership and existing EXECUTE grants. Do not execute without
-- a separately approved migration and deployment review.
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

  -- The package's official road set is lokasi_pekerjaan, not the Balai master.
  -- IN over distinct road IDs plus the ruas_jalan PK returns each road once.
  -- An empty association therefore returns [] (no Balai-wide fallback).
  return coalesce((
    select jsonb_agg(to_jsonb(r) order by r.nomor_ruas, r.ruas_id)
    from public.ruas_jalan r
    where r.balai_id = v_package.balai_id
      and r.ruas_id in (
        select distinct lp.ruas_id
        from public.lokasi_pekerjaan lp
        where lp.paket_id = v_package.paket_id
          and lp.ruas_id is not null
      )
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

-- Replace the installed app_private implementation without changing its
-- signature, grants, owner, authorization helper, validation, audit, versioning
-- or JSON response. The association row is locked against removal/update for
-- the duration of the save transaction.
create or replace function app_private.simpan_validasi_lrs(
  p_paket_id integer,
  p_ruas_id integer,
  p_expected_version integer,
  p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor integer;
  p public.paket_kontrak;
  r public.ruas_jalan;
  current_row public.validasi_lrs;
  record_id integer;
  current_version integer;
  next_version integer;
  before_value jsonb;
  after_value jsonb;
  field_length numeric;
  reference_length numeric;
  topology_count integer;
  glossary_ok boolean;
  sta_ok boolean;
begin
  actor := app_private.assert_validasi_lrs_access(p_paket_id, true);
  if p_ruas_id is null or p_ruas_id < 1 or p_expected_version is null or p_expected_version < 0
    or p_expected_version > 2147483646 then
    raise exception 'Paket, ruas, atau versi tidak valid' using errcode = '22023';
  end if;
  if p_data is null or jsonb_typeof(p_data) is distinct from 'object' then
    raise exception 'Data validasi LRS mesti berupa objek' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_object_keys(p_data)) <> 5 or not (p_data ?& array[
    'panjang_lapangan_m', 'panjang_acuan_m', 'jumlah_error_topologi',
    'format_sesuai_glossary', 'sta_konsisten_iri_pci_ldt']) then
    raise exception 'Data validasi LRS tidak sesuai kontrak' using errcode = '22023';
  end if;
  if jsonb_typeof(p_data->'panjang_lapangan_m') is distinct from 'number'
    or jsonb_typeof(p_data->'panjang_acuan_m') is distinct from 'number'
    or jsonb_typeof(p_data->'jumlah_error_topologi') is distinct from 'number'
    or jsonb_typeof(p_data->'format_sesuai_glossary') is distinct from 'boolean'
    or jsonb_typeof(p_data->'sta_konsisten_iri_pci_ldt') is distinct from 'boolean' then
    raise exception 'Panjang/topologi mesti numerik dan pemeriksaan mesti boolean' using errcode = '22023';
  end if;
  begin
    field_length := (p_data->>'panjang_lapangan_m')::numeric;
    reference_length := (p_data->>'panjang_acuan_m')::numeric;
    topology_count := (p_data->>'jumlah_error_topologi')::integer;
    glossary_ok := (p_data->>'format_sesuai_glossary')::boolean;
    sta_ok := (p_data->>'sta_konsisten_iri_pci_ldt')::boolean;
  exception when others then
    raise exception 'Nilai validasi LRS tidak sah atau di luar rentang' using errcode = '22023';
  end;
  if field_length < 0 or reference_length < 0 or topology_count < 0
    or topology_count::numeric <> (p_data->>'jumlah_error_topologi')::numeric then
    raise exception 'Panjang dan jumlah error tidak boleh negatif; jumlah error mesti integer' using errcode = '22023';
  end if;

  select * into p from public.paket_kontrak where paket_id = p_paket_id for share;
  select * into r from public.ruas_jalan where ruas_id = p_ruas_id and balai_id = p.balai_id for share;
  if not found then
    raise exception 'Ruas tidak ditemukan dalam Balai paket' using errcode = '22023';
  end if;
  perform 1 from public.lokasi_pekerjaan lp
    where lp.paket_id = p_paket_id and lp.ruas_id = p_ruas_id
    for share;
  if not found then
    raise exception 'Ruas tidak terdaftar pada lokasi pekerjaan paket' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_paket_id::text || ':' || p_ruas_id::text, 0));
  select * into current_row from public.validasi_lrs
    where paket_id = p_paket_id and ruas_id = p_ruas_id for update;
  if found then
    record_id := current_row.validasi_lrs_id;
    insert into app_private.validasi_lrs_version(validasi_lrs_id, versi)
      values (record_id, 0) on conflict do nothing;
    select versi into current_version from app_private.validasi_lrs_version
      where validasi_lrs_id = record_id for update;
    if current_version <> p_expected_version then
      raise exception 'Versi validasi LRS berubah; muat ulang sebelum menyimpan' using errcode = '40001';
    end if;
    before_value := to_jsonb(current_row) || jsonb_build_object('versi', current_version);
    if current_version >= 2147483646 then raise exception 'Versi maksimum tercapai' using errcode = '22003'; end if;
    next_version := current_version + 1;
    update public.validasi_lrs set
      panjang_lapangan_m = field_length, panjang_acuan_m = reference_length,
      jumlah_error_topologi = topology_count, format_sesuai_glossary = glossary_ok,
      sta_konsisten_iri_pci_ldt = sta_ok, deviasi_m = null, status = null, tgl_valid = null
      where validasi_lrs_id = record_id returning * into current_row;
    update app_private.validasi_lrs_version set versi = next_version where validasi_lrs_id = record_id;
  else
    if p_expected_version <> 0 then raise exception 'Validasi LRS belum ada; versi awal harus 0' using errcode = '40001'; end if;
    record_id := nextval('public.validasi_lrs_validasi_lrs_id_seq'::regclass);
    next_version := 1;
    insert into public.validasi_lrs(
      validasi_lrs_id, paket_id, ruas_id, panjang_lapangan_m, panjang_acuan_m,
      deviasi_m, jumlah_error_topologi, format_sesuai_glossary,
      sta_konsisten_iri_pci_ldt, status, tgl_valid)
    values (record_id, p_paket_id, p_ruas_id, field_length, reference_length,
      null, topology_count, glossary_ok, sta_ok, null, null)
    returning * into current_row;
    insert into app_private.validasi_lrs_version(validasi_lrs_id, versi) values (record_id, next_version);
  end if;
  after_value := to_jsonb(current_row) || jsonb_build_object('versi', next_version);
  insert into public.audit_trail(trail_id, pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu)
  values (nextval('public.audit_trail_trail_id_seq'::regclass), actor, 'validasi_lrs', record_id::text,
    case when before_value is null then 'CREATE' else 'UPDATE' end, before_value, after_value, localtimestamp);
  return after_value;
end;
$$;

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
