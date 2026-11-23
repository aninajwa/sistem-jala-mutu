-- CANDIDATE ONLY. Do not install without the project's explicit migration approval.
-- Declared contract surveys are separate from observed lokasi_pekerjaan rows.
-- Existing packages receive no inferred/backfilled selection: absence from the
-- version table is represented as state "unset".
--
-- Authorization policy:
--   * Provider read and edit both require paket_kontrak.created_by to equal
--     the authenticated pengguna_id, plus an assigned provider role whose
--     package and Balai scopes are either unrestricted or match this package.
--     A package-scoped assignment alone does not confer edit rights.
--   * New-package create requires an assigned provider-role row with no
--     scope_paket_id and a null/matching scope_balai_id. An assignment scoped
--     only to an existing package therefore cannot create an unrelated package
--     that the same assignment cannot subsequently read.
--   * Edit locks the package first, then calls installed
--     assert_persiapan_editable(integer), retaining its Stage 0 pending-review
--     and approved lock in addition to DRAFT and ownership/scope checks.
begin;

create table public.paket_survei_kontrak_versi (
  paket_id integer primary key references public.paket_kontrak(paket_id) on delete cascade,
  versi integer not null check (versi >= 1),
  diubah_oleh integer not null references public.pengguna(pengguna_id),
  diubah_pada timestamptz not null default now()
);

create table public.paket_survei_kontrak (
  paket_id integer not null references public.paket_kontrak(paket_id) on delete cascade,
  jenis_survei_id integer not null references public.jenis_survei(jenis_survei_id),
  primary key (paket_id, jenis_survei_id)
);

alter table public.paket_survei_kontrak_versi enable row level security;
alter table public.paket_survei_kontrak enable row level security;
revoke all on public.paket_survei_kontrak_versi from public, anon, authenticated;
revoke all on public.paket_survei_kontrak from public, anon, authenticated;

create or replace function app_private.assert_paket_scope_survei_writer(p_paket_id integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare v_actor integer; v_paket public.paket_kontrak;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
  -- Lock before reading ownership/scope/state so concurrent package edits cannot
  -- pass authorization against a stale package/Balai/status row.
  select * into v_paket from public.paket_kontrak
  where paket_id=p_paket_id for update;
  if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002'; end if;
  -- Reuse the installed Stage 0 edit boundary. It rechecks Provider authority,
  -- DRAFT state, and pending-review/approved preparation while this lock is held.
  perform app_private.assert_persiapan_editable(p_paket_id);
  select u.pengguna_id into v_actor
  from public.pengguna u
  where u.auth_user_id=auth.uid() and coalesce(u.terkunci,false)=false
    and exists (
      select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
      where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa'
    );
  if v_actor is null then raise exception 'Hanya Penyedia Jasa aktif boleh mengelola scope kontrak' using errcode='42501'; end if;
  if v_paket.created_by is distinct from v_actor or not exists (
    select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
    where pp.pengguna_id=v_actor and r.nama='penyedia_jasa'
      and (pp.scope_paket_id is null or pp.scope_paket_id=v_paket.paket_id)
      and (pp.scope_balai_id is null or pp.scope_balai_id=v_paket.balai_id)
  ) then raise exception 'Paket tidak ditemukan, bukan DRAFT, atau tidak berada dalam kewenangan penulis' using errcode='42501'; end if;
  return v_actor;
end;
$function$;

create or replace function app_private.buat_paket_draft_dengan_scope(
  p_nama_paket text,
  p_nomor_kontrak text,
  p_tahun_anggaran integer,
  p_balai_id integer,
  p_jenis_survei_ids integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare v_actor integer; v_paket public.paket_kontrak; v_ids integer[]; v_surveys jsonb;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
  select u.pengguna_id into v_actor from public.pengguna u
  where u.auth_user_id=auth.uid() and coalesce(u.terkunci,false)=false
    and exists(select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
               where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa');
  if v_actor is null then raise exception 'Hanya Penyedia Jasa boleh mencipta draft' using errcode='42501'; end if;
  if p_nama_paket is null or length(btrim(p_nama_paket)) not between 1 and 255
     or p_nomor_kontrak is null or length(btrim(p_nomor_kontrak)) not between 1 and 100
     or p_tahun_anggaran is null or p_tahun_anggaran not between 2000 and 2100
     or p_jenis_survei_ids is null or cardinality(p_jenis_survei_ids)=0
     or array_position(p_jenis_survei_ids,null) is not null
     or exists(select 1 from unnest(p_jenis_survei_ids) x where x<1) then
    raise exception 'Data paket atau pilihan jenis survei tidak valid' using errcode='22023';
  end if;
  select array_agg(distinct x order by x) into v_ids from unnest(p_jenis_survei_ids) x;
  if exists(select 1 from unnest(v_ids) x left join public.jenis_survei s on s.jenis_survei_id=x
            where s.jenis_survei_id is null or s.aktif is distinct from true) then
    raise exception 'Jenis survei tidak ditemukan atau tidak aktif' using errcode='22023';
  end if;
  if not exists(select 1 from public.balai b where b.balai_id=p_balai_id and b.aktif is true) then
    raise exception 'Balai tidak ditemukan atau tidak aktif' using errcode='22023';
  end if;
  if not exists(
    select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
    where pp.pengguna_id=v_actor and r.nama='penyedia_jasa'
      and pp.scope_paket_id is null
      and (pp.scope_balai_id is null or pp.scope_balai_id=p_balai_id)
  ) then
    raise exception 'Penugasan Penyedia Jasa tidak mengizinkan pembuatan paket baru pada Balai ini' using errcode='42501';
  end if;
  insert into public.paket_kontrak(nama_paket,nomor_kontrak,tahun_anggaran,balai_id,status,created_by)
  values(btrim(p_nama_paket),btrim(p_nomor_kontrak),p_tahun_anggaran,p_balai_id,'DRAFT',v_actor)
  returning * into v_paket;
  insert into public.paket_survei_kontrak_versi(paket_id,versi,diubah_oleh)
  values(v_paket.paket_id,1,v_actor);
  insert into public.paket_survei_kontrak(paket_id,jenis_survei_id)
  select v_paket.paket_id,x from unnest(v_ids) x;
  select coalesce(jsonb_agg(jsonb_build_object('jenis_survei_id',s.jenis_survei_id,
      'kode',s.kode,'nama',s.nama,'aktif',s.aktif) order by s.jenis_survei_id),'[]'::jsonb)
    into v_surveys from public.jenis_survei s where s.jenis_survei_id=any(v_ids);
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu)
  values(v_actor,'paket_kontrak',v_paket.paket_id::text,'CREATE_DRAFT_WITH_DECLARED_SURVEY_SCOPE',
    jsonb_build_object('paket',to_jsonb(v_paket),'versi_scope',1,'surveys',v_surveys),localtimestamp);
  return jsonb_build_object('paket_id',v_paket.paket_id,'nama_paket',v_paket.nama_paket,
    'status',v_paket.status,'declared_survey_scope',
    jsonb_build_object('paket_id',v_paket.paket_id,'state','defined','version',1,'surveys',v_surveys));
end;
$function$;

create or replace function app_private.simpan_scope_survei_kontrak(
  p_paket_id integer,
  p_expected_version integer,
  p_jenis_survei_ids integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare v_actor integer; v_paket public.paket_kontrak; v_version integer; v_ids integer[];
        v_old integer[]; v_removed integer[]; v_surveys jsonb;
begin
  v_actor:=app_private.assert_paket_scope_survei_writer(p_paket_id);
  if p_expected_version is null or p_expected_version<0
     or p_jenis_survei_ids is null or cardinality(p_jenis_survei_ids)=0
     or array_position(p_jenis_survei_ids,null) is not null
     or exists(select 1 from unnest(p_jenis_survei_ids) x where x<1) then
    raise exception 'Versi atau pilihan jenis survei tidak valid' using errcode='22023';
  end if;
  select * into v_paket from public.paket_kontrak where paket_id=p_paket_id for update;
  if not found or v_paket.status is distinct from 'DRAFT' then
    raise exception 'Paket tidak ditemukan atau bukan DRAFT' using errcode='55000';
  end if;
  select versi into v_version from public.paket_survei_kontrak_versi
    where paket_id=p_paket_id for update;
  v_version:=coalesce(v_version,0);
  if p_expected_version<>v_version then raise exception 'Scope survei telah berubah; baca ulang sebelum menyimpan' using errcode='40001'; end if;
  select array_agg(distinct x order by x) into v_ids from unnest(p_jenis_survei_ids) x;
  if exists(select 1 from unnest(v_ids) x left join public.jenis_survei s on s.jenis_survei_id=x
            where s.jenis_survei_id is null or (s.aktif is distinct from true and
              not exists(select 1 from public.paket_survei_kontrak current
                         where current.paket_id=p_paket_id and current.jenis_survei_id=x))) then
    raise exception 'Jenis survei tidak ditemukan atau tidak aktif' using errcode='22023';
  end if;
  select coalesce(array_agg(jenis_survei_id order by jenis_survei_id),'{}'::integer[])
    into v_old from public.paket_survei_kontrak where paket_id=p_paket_id;
  if v_old=v_ids then
    select coalesce(jsonb_agg(jsonb_build_object('jenis_survei_id',s.jenis_survei_id,
      'kode',s.kode,'nama',s.nama,'aktif',s.aktif) order by s.jenis_survei_id),'[]'::jsonb)
      into v_surveys from public.jenis_survei s where s.jenis_survei_id=any(v_ids);
    return jsonb_build_object('paket_id',p_paket_id,'state','defined','version',v_version,'surveys',v_surveys);
  end if;
  select coalesce(array_agg(x order by x),'{}'::integer[]) into v_removed
    from unnest(v_old) x where not (x=any(v_ids));
  -- Refuse a removal if any package work is already tied to that survey.
  if cardinality(v_removed)>0 and (
       exists(select 1 from public.tim_survei t where t.paket_id=p_paket_id and t.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.lokasi_pekerjaan l where l.paket_id=p_paket_id and l.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.uji_coba u where u.paket_id=p_paket_id and u.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.sesi_survei s where s.paket_id=p_paket_id and exists(
         select 1 from public.tim_survei t where t.tim_id=s.tim_id and t.jenis_survei_id=any(v_removed)))
    or exists(select 1 from public.data_segmen d join public.sesi_survei s using(sesi_id)
              where s.paket_id=p_paket_id and d.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.uji_konsistensi k join public.siklus_verval cycle using(siklus_id)
              where cycle.paket_id=p_paket_id and k.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.audit a where a.paket_id=p_paket_id and a.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.kasus_temuan k where k.paket_id=p_paket_id and k.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.upload_sistem u where u.paket_id=p_paket_id and u.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.checklist_pengisian q join public.checklist_template t using(template_id)
              where q.paket_id=p_paket_id and t.jenis_survei_id=any(v_removed))
    or exists(select 1 from public.kalibrasi_alat c join public.alat_survei a using(alat_id)
              where c.paket_id=p_paket_id and a.jenis_survei_id=any(v_removed))
  ) then
    raise exception 'Jenis survei tidak dapat dihapus karena sudah direferensikan data kerja paket' using errcode='23514';
  end if;
  delete from public.paket_survei_kontrak where paket_id=p_paket_id;
  insert into public.paket_survei_kontrak(paket_id,jenis_survei_id)
    select p_paket_id,x from unnest(v_ids) x;
  if v_version=0 then
    insert into public.paket_survei_kontrak_versi(paket_id,versi,diubah_oleh)
      values(p_paket_id,1,v_actor);
    v_version:=1;
  else
    v_version:=v_version+1;
    update public.paket_survei_kontrak_versi set versi=v_version,diubah_oleh=v_actor,diubah_pada=now()
      where paket_id=p_paket_id;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('jenis_survei_id',s.jenis_survei_id,
    'kode',s.kode,'nama',s.nama,'aktif',s.aktif) order by s.jenis_survei_id),'[]'::jsonb)
    into v_surveys from public.jenis_survei s where s.jenis_survei_id=any(v_ids);
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
  values(v_actor,'paket_survei_kontrak',p_paket_id::text,'UPDATE_DECLARED_SURVEY_SCOPE',
    jsonb_build_object('version',v_version-1,'jenis_survei_ids',v_old),
    jsonb_build_object('version',v_version,'jenis_survei_ids',v_ids),localtimestamp);
  return jsonb_build_object('paket_id',p_paket_id,'state','defined','version',v_version,'surveys',v_surveys);
end;
$function$;

create or replace function app_private.baca_scope_survei_kontrak(p_paket_ids integer[])
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare v_actor integer; v_ids integer[]; v_result jsonb;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
  select u.pengguna_id into v_actor from public.pengguna u
  where u.auth_user_id=auth.uid() and coalesce(u.terkunci,false)=false;
  if v_actor is null then raise exception 'Identitas aktif diperlukan' using errcode='42501'; end if;
  if p_paket_ids is null or cardinality(p_paket_ids)<1 or cardinality(p_paket_ids)>50
     or array_position(p_paket_ids,null) is not null
     or exists(select 1 from unnest(p_paket_ids) x where x<1) then
    raise exception 'Daftar paket tidak valid' using errcode='22023';
  end if;
  select array_agg(distinct x order by x) into v_ids from unnest(p_paket_ids) x;
  if exists(
    select 1 from unnest(v_ids) requested(paket_id)
    left join public.paket_kontrak p using(paket_id)
    where p.paket_id is null or not exists(
      select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id)
      join public.peran r using(peran_id)
      where u.pengguna_id=v_actor and u.auth_user_id=auth.uid()
        and coalesce(u.terkunci,false)=false
        and ((r.nama in ('admin','direktorat'))
          or (r.nama='pic_balai' and pp.scope_balai_id=p.balai_id
              and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id))
          or (r.nama='penyedia_jasa' and p.created_by=v_actor
              and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id)
              and (pp.scope_balai_id is null or pp.scope_balai_id=p.balai_id)))
    )
  ) then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'paket_id',p.paket_id,
    'state',case when ver.paket_id is null then 'unset' else 'defined' end,
    'version',ver.versi,
    'surveys',coalesce(surveys.items,'[]'::jsonb)
  ) order by p.paket_id),'[]'::jsonb) into v_result
  from public.paket_kontrak p join unnest(v_ids) requested(paket_id) using(paket_id)
  left join public.paket_survei_kontrak_versi ver using(paket_id)
  left join lateral (
    select jsonb_agg(jsonb_build_object('jenis_survei_id',s.jenis_survei_id,
      'kode',s.kode,'nama',s.nama,'aktif',s.aktif) order by s.jenis_survei_id) items
    from public.paket_survei_kontrak link join public.jenis_survei s using(jenis_survei_id)
    where link.paket_id=p.paket_id
  ) surveys on true;
  return v_result;
end;
$function$;

create or replace function public.buat_paket_draft_dengan_scope(
  p_nama_paket text,p_nomor_kontrak text,p_tahun_anggaran integer,p_balai_id integer,p_jenis_survei_ids integer[]
) returns jsonb language sql security invoker set search_path=''
as $function$ select app_private.buat_paket_draft_dengan_scope($1,$2,$3,$4,$5); $function$;
create or replace function public.simpan_scope_survei_kontrak(
  p_paket_id integer,p_expected_version integer,p_jenis_survei_ids integer[]
) returns jsonb language sql security invoker set search_path=''
as $function$ select app_private.simpan_scope_survei_kontrak($1,$2,$3); $function$;
create or replace function public.baca_scope_survei_kontrak(p_paket_ids integer[])
returns jsonb language sql stable security invoker set search_path=''
as $function$ select app_private.baca_scope_survei_kontrak($1); $function$;

revoke all on function app_private.buat_paket_draft_dengan_scope(text,text,integer,integer,integer[]) from public,anon;
revoke all on function app_private.simpan_scope_survei_kontrak(integer,integer,integer[]) from public,anon;
revoke all on function app_private.baca_scope_survei_kontrak(integer[]) from public,anon;
revoke all on function app_private.assert_paket_scope_survei_writer(integer) from public,anon,authenticated;
revoke all on function public.buat_paket_draft_dengan_scope(text,text,integer,integer,integer[]) from public,anon;
revoke all on function public.simpan_scope_survei_kontrak(integer,integer,integer[]) from public,anon;
revoke all on function public.baca_scope_survei_kontrak(integer[]) from public,anon;
grant execute on function app_private.buat_paket_draft_dengan_scope(text,text,integer,integer,integer[]) to authenticated;
grant execute on function app_private.simpan_scope_survei_kontrak(integer,integer,integer[]) to authenticated;
grant execute on function app_private.baca_scope_survei_kontrak(integer[]) to authenticated;
grant execute on function public.buat_paket_draft_dengan_scope(text,text,integer,integer,integer[]) to authenticated;
grant execute on function public.simpan_scope_survei_kontrak(integer,integer,integer[]) to authenticated;
grant execute on function public.baca_scope_survei_kontrak(integer[]) to authenticated;
commit;
