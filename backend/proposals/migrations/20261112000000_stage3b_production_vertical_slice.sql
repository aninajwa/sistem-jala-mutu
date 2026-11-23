-- REVIEW-ONLY MIGRATION PROPOSAL. NOT PART OF A CANONICAL MIGRATION CHAIN.
-- DO NOT APPLY until schema, policy and business rules below are approved and
-- this file has been exercised on a disposable PostgreSQL QA project.
-- Prerequisites: current public tables/columns/FKs as read-only inspected;
-- app_private.assert_survei_read(integer) from the Stage 3A proposal; and the
-- current public.audit_trail layout documented in db-reference.
-- No RLS policy or existing account/role is changed here.
--
-- Business assumptions requiring owner approval:
-- * A cycle is 14 calendar days; cycle 1 starts on the earliest Stage 3A
--   sesi_survei.tanggal; each later cycle starts the day after the prior end.
-- * A cycle may open only when a session falls within that 14-day window.
-- * One provider-authored consistency record per cycle/survey/team/road/STA
--   tuple; repeat numbers are contiguous from 1, with 1..20 observations.
-- * Raters must be members of the selected team for the complete cycle interval.
-- * No LULUS/approval status is computed or written by these RPCs.
-- * A version is scoped to the cycle and advances once per accepted consistency
--   write. request_id makes retries of that exact mutation idempotent.

begin;

-- Preflight before applying: resolve existing duplicate non-null cycle numbers
-- and complete consistency identities; these indexes intentionally fail closed.
create unique index if not exists siklus_verval_package_number_uq
  on public.siklus_verval(paket_id,siklus_ke) where paket_id is not null and siklus_ke is not null;
create unique index if not exists uji_konsistensi_cycle_identity_uq
  on public.uji_konsistensi(siklus_id,jenis_survei_id,tim_id,ruas_id,sta_awal,sta_akhir)
  where siklus_id is not null and jenis_survei_id is not null and tim_id is not null
    and ruas_id is not null and sta_awal is not null and sta_akhir is not null;

create table if not exists app_private.siklus_verval_write_state (
  siklus_id integer primary key references public.siklus_verval(siklus_id) on delete cascade,
  versi integer not null default 0 check (versi between 0 and 2147483646)
);
revoke all on app_private.siklus_verval_write_state from public, anon, authenticated;
insert into app_private.siklus_verval_write_state(siklus_id, versi)
select siklus_id, 0 from public.siklus_verval
on conflict (siklus_id) do nothing;

create table if not exists app_private.siklus_verval_request (
  pengguna_id integer not null references public.pengguna(pengguna_id),
  paket_id integer not null references public.paket_kontrak(paket_id),
  request_id uuid not null,
  operasi text not null check (operasi in ('CREATE_CYCLE','ADD_CONSISTENCY')),
  payload_hash text not null,
  response jsonb not null,
  dibuat_pada timestamptz not null default now(),
  primary key (pengguna_id, paket_id, operasi, request_id)
);
revoke all on app_private.siklus_verval_request from public, anon, authenticated;

create or replace function app_private.assert_siklus_verval_access(p_paket_id integer, p_write boolean)
returns integer language plpgsql security definer set search_path = '' as $$
declare u public.pengguna; p public.paket_kontrak;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
  select * into u from public.pengguna where auth_user_id=auth.uid() and not coalesce(terkunci,false);
  if not found then raise exception 'Profil tidak berwenang' using errcode='42501'; end if;
  select * into p from public.paket_kontrak where paket_id=p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  if p_write then
    if p.created_by is distinct from u.pengguna_id or not exists (
      select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
      where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa'
    ) then raise exception 'Hanya Penyedia Jasa pemilik paket boleh menulis' using errcode='42501'; end if;
  elsif not (
    (p.created_by=u.pengguna_id and exists(select 1 from public.pengguna_peran pp join public.peran r using(peran_id) where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa'))
    or exists(select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
      where pp.pengguna_id=u.pengguna_id and r.nama='pic_balai' and pp.scope_balai_id=p.balai_id
        and (pp.scope_paket_id is null or pp.scope_paket_id=p_paket_id))
  ) then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  return u.pengguna_id;
end $$;
revoke all on function app_private.assert_siklus_verval_access(integer,boolean) from public,anon;
grant execute on function app_private.assert_siklus_verval_access(integer,boolean) to authenticated;

create or replace function public.baca_senarai_siklus_verval(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.assert_siklus_verval_access(p_paket_id,false);
  return coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('versi',coalesce(v.versi,0)) order by s.siklus_ke,s.siklus_id)
    from public.siklus_verval s left join app_private.siklus_verval_write_state v using(siklus_id)
    where s.paket_id=p_paket_id),'[]'::jsonb);
end $$;

create or replace function public.baca_siklus_verval(p_paket_id integer,p_siklus_id integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform app_private.assert_siklus_verval_access(p_paket_id,false);
  select to_jsonb(s)||jsonb_build_object('versi',coalesce(v.versi,0)) into result
    from public.siklus_verval s left join app_private.siklus_verval_write_state v using(siklus_id)
    where s.paket_id=p_paket_id and s.siklus_id=p_siklus_id;
  if result is null then raise exception 'Siklus tidak ditemukan dalam paket' using errcode='P0002'; end if;
  return result;
end $$;

create or replace function public.baca_uji_konsistensi_verval(p_paket_id integer,p_siklus_id integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.assert_siklus_verval_access(p_paket_id,false);
  if not exists(select 1 from public.siklus_verval where siklus_id=p_siklus_id and paket_id=p_paket_id)
    then raise exception 'Siklus tidak ditemukan dalam paket' using errcode='P0002'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'konsistensi_id',k.konsistensi_id,'siklus_id',k.siklus_id,'jenis_survei_id',k.jenis_survei_id,
    'tim_id',k.tim_id,'ruas_id',k.ruas_id,'sta_awal',k.sta_awal,'sta_akhir',k.sta_akhir,
    'jumlah_ulangan',k.jumlah_ulangan,'status',k.status,'ulangan',coalesce((
      select jsonb_agg(jsonb_build_object('ulangan_id',u.ulangan_id,'konsistensi_id',u.konsistensi_id,
        'ulangan_ke',u.ulangan_ke,'rater_personel_id',u.rater_personel_id,'nilai',u.nilai)
        order by u.ulangan_ke,u.ulangan_id) from public.uji_konsistensi_ulangan u where u.konsistensi_id=k.konsistensi_id
    ),'[]'::jsonb)) order by k.konsistensi_id)
    from public.uji_konsistensi k where k.siklus_id=p_siklus_id),'[]'::jsonb);
end $$;

create or replace function public.buat_siklus_verval(p_paket_id integer,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor integer; p public.paket_kontrak; previous public.siklus_verval; created public.siklus_verval;
  start_on date; end_on date; request_hash text; prior jsonb;
begin
  actor:=app_private.assert_siklus_verval_access(p_paket_id,true);
  if p_request_id is null then raise exception 'request_id wajib' using errcode='22023'; end if;
  select * into p from public.paket_kontrak where paket_id=p_paket_id for update;
  request_hash:=md5(p_paket_id::text||':CREATE_CYCLE');
  select q.response into prior from app_private.siklus_verval_request q where q.pengguna_id=actor and q.paket_id=p_paket_id and q.operasi='CREATE_CYCLE' and q.request_id=p_request_id;
  if found then return prior; end if;
  select * into previous from public.siklus_verval where paket_id=p_paket_id order by siklus_ke desc nulls last,siklus_id desc limit 1 for update;
  if found then start_on:=previous.periode_selesai+1; else
    select min(tanggal) into start_on from public.sesi_survei where paket_id=p_paket_id;
  end if;
  if start_on is null then raise exception 'Sesi survei bertanggal diperlukan sebelum membuka siklus' using errcode='55000'; end if;
  end_on:=start_on+13;
  if not exists(select 1 from public.sesi_survei where paket_id=p_paket_id and tanggal between start_on and end_on)
    then raise exception 'Belum ada sesi survei dalam periode siklus' using errcode='55000'; end if;
  insert into public.siklus_verval(paket_id,siklus_ke,periode_mulai,periode_selesai)
    values(p_paket_id,coalesce(previous.siklus_ke,0)+1,start_on,end_on) returning * into created;
  insert into app_private.siklus_verval_write_state(siklus_id,versi) values(created.siklus_id,0);
  insert into app_private.siklus_verval_request values(actor,p_paket_id,p_request_id,'CREATE_CYCLE',request_hash,to_jsonb(created)||jsonb_build_object('versi',0),now());
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu)
    values(actor,'siklus_verval',created.siklus_id::text,'CREATE_CYCLE',to_jsonb(created),localtimestamp);
  return to_jsonb(created)||jsonb_build_object('versi',0);
end $$;

create or replace function public.simpan_uji_konsistensi_verval(p_paket_id integer,p_siklus_id integer,p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor integer; cyc public.siklus_verval; team public.tim_survei; parent public.uji_konsistensi;
  vers integer; current_version integer; repeat_count integer; item jsonb; rater integer; payload_hash text; request_id uuid; prior app_private.siklus_verval_request;
  survey_id integer; team_id integer; road_id integer; sta0 numeric; sta1 numeric;
begin
  actor:=app_private.assert_siklus_verval_access(p_paket_id,true);
  if p_data is null or jsonb_typeof(p_data) is distinct from 'object'
    then raise exception 'Payload konsistensi tidak sesuai kontrak' using errcode='22023'; end if;
  if (select count(*) from jsonb_object_keys(p_data))<>8
    or not (p_data ?& array['request_id','expected_version','jenis_survei_id','tim_id','ruas_id','sta_awal','sta_akhir','ulangan'])
    then raise exception 'Payload konsistensi tidak sesuai kontrak' using errcode='22023'; end if;
  begin request_id:=(p_data->>'request_id')::uuid; survey_id:=(p_data->>'jenis_survei_id')::integer;
    team_id:=(p_data->>'tim_id')::integer; road_id:=(p_data->>'ruas_id')::integer;
    sta0:=(p_data->>'sta_awal')::numeric; sta1:=(p_data->>'sta_akhir')::numeric; vers:=(p_data->>'expected_version')::integer;
  exception when others then raise exception 'ID, versi atau STA tidak valid' using errcode='22023'; end;
  if request_id is null or vers not between 0 and 2147483646 or survey_id is null or team_id is null or road_id is null
    or survey_id<1 or team_id<1 or road_id<1 or sta0 is null or sta1 is null or sta0<0 or sta1<=sta0
    or jsonb_typeof(p_data->'expected_version') is distinct from 'number'
    or jsonb_typeof(p_data->'jenis_survei_id') is distinct from 'number'
    or jsonb_typeof(p_data->'tim_id') is distinct from 'number'
    or jsonb_typeof(p_data->'ruas_id') is distinct from 'number'
    or jsonb_typeof(p_data->'sta_awal') is distinct from 'number'
    or jsonb_typeof(p_data->'sta_akhir') is distinct from 'number'
    or jsonb_typeof(p_data->'ulangan') is distinct from 'array'
    or (p_data->>'sta_awal') in ('NaN','Infinity','-Infinity') or (p_data->>'sta_akhir') in ('NaN','Infinity','-Infinity')
    then raise exception 'ID, versi, STA atau daftar ulangan tidak valid' using errcode='22023'; end if;
  repeat_count:=jsonb_array_length(p_data->'ulangan');
  if repeat_count<1 or repeat_count>20 then raise exception 'Jumlah ulangan mesti 1 sampai 20' using errcode='22023'; end if;
  -- Lock the cycle before idempotency lookup, so concurrent exact retries serialize.
  select * into cyc from public.siklus_verval where siklus_id=p_siklus_id and paket_id=p_paket_id for update;
  if not found then raise exception 'Siklus tidak ditemukan dalam paket' using errcode='P0002'; end if;
  payload_hash:=md5(p_data::text);
  select * into prior from app_private.siklus_verval_request q where q.pengguna_id=actor and q.paket_id=p_paket_id and q.operasi='ADD_CONSISTENCY' and q.request_id=request_id;
  if found then
    if prior.payload_hash<>payload_hash then raise exception 'request_id telah dipakai untuk payload lain' using errcode='23505'; end if;
    return prior.response;
  end if;
  insert into app_private.siklus_verval_write_state(siklus_id,versi) values(p_siklus_id,0) on conflict do nothing;
  select versi into current_version from app_private.siklus_verval_write_state where siklus_id=p_siklus_id for update;
  if current_version<>vers then raise exception 'Versi siklus berubah; baca ulang sebelum menyimpan' using errcode='40001'; end if;
  select * into team from public.tim_survei where tim_id=team_id and paket_id=p_paket_id and jenis_survei_id=survey_id for share;
  if not found then raise exception 'Tim dan jenis survei tidak cocok dengan paket' using errcode='22023'; end if;
  if not exists(select 1 from public.ruas_jalan r join public.paket_kontrak p on p.balai_id=r.balai_id where p.paket_id=p_paket_id and r.ruas_id=road_id)
    then raise exception 'Ruas bukan milik Balai paket' using errcode='22023'; end if;
  if not exists(select 1 from public.sesi_survei s where s.paket_id=p_paket_id and s.tim_id=team_id
      and s.ruas_id=road_id and s.tanggal between cyc.periode_mulai and cyc.periode_selesai)
    then raise exception 'Tidak ada sesi dalam periode untuk paket/tim/ruas ini' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(p_data->'ulangan') loop
    if jsonb_typeof(item) is distinct from 'object' then raise exception 'Baris ulangan tidak sesuai kontrak' using errcode='22023'; end if;
    if (select count(*) from jsonb_object_keys(item))<>3 or not(item ?& array['ulangan_ke','rater_personel_id','nilai'])
      then raise exception 'Baris ulangan tidak sesuai kontrak' using errcode='22023'; end if;
    if jsonb_typeof(item->'ulangan_ke') is distinct from 'number'
      or jsonb_typeof(item->'rater_personel_id') is distinct from 'number'
      or jsonb_typeof(item->'nilai') is distinct from 'number'
      or (item->>'ulangan_ke')::integer < 1 or (item->>'ulangan_ke')::integer > repeat_count
      or (item->>'rater_personel_id')::integer < 1 or (item->>'nilai') in ('NaN','Infinity','-Infinity')
      then raise exception 'Nomor ulangan, rater atau nilai tidak valid' using errcode='22023'; end if;
    rater:=(item->>'rater_personel_id')::integer;
    if not exists(select 1 from public.anggota_tim a where a.tim_id=team_id and a.personel_id=rater
      and (a.mulai is null or a.mulai<=cyc.periode_mulai) and (a.selesai is null or a.selesai>=cyc.periode_selesai))
      then raise exception 'Rater bukan anggota tim pada periode siklus' using errcode='22023'; end if;
  end loop;
  if (select count(distinct (value->>'ulangan_ke')::integer) from jsonb_array_elements(p_data->'ulangan'))<>repeat_count
    or (select min((value->>'ulangan_ke')::integer) from jsonb_array_elements(p_data->'ulangan'))<>1
    or (select max((value->>'ulangan_ke')::integer) from jsonb_array_elements(p_data->'ulangan'))<>repeat_count
    then raise exception 'Nomor ulangan mesti unik dan berurutan mulai dari 1' using errcode='22023'; end if;
  if exists(select 1 from public.uji_konsistensi k where k.siklus_id=p_siklus_id and k.jenis_survei_id=survey_id
      and k.tim_id=team_id and k.ruas_id=road_id and k.sta_awal=sta0 and k.sta_akhir=sta1)
    then raise exception 'Konsistensi untuk siklus/survei/tim/ruas/STA ini sudah ada' using errcode='23505'; end if;
  insert into public.uji_konsistensi(siklus_id,jenis_survei_id,tim_id,ruas_id,sta_awal,sta_akhir,jumlah_ulangan)
    values(p_siklus_id,survey_id,team_id,road_id,sta0,sta1,repeat_count) returning * into parent;
  for item in select value from jsonb_array_elements(p_data->'ulangan') loop
    insert into public.uji_konsistensi_ulangan(konsistensi_id,ulangan_ke,rater_personel_id,nilai)
      values(parent.konsistensi_id,(item->>'ulangan_ke')::integer,(item->>'rater_personel_id')::integer,(item->>'nilai')::numeric);
  end loop;
  update app_private.siklus_verval_write_state set versi=versi+1 where siklus_id=p_siklus_id returning versi into vers;
  insert into app_private.siklus_verval_request values(actor,p_paket_id,request_id,'ADD_CONSISTENCY',payload_hash,
    to_jsonb(parent)||jsonb_build_object('ulangan',p_data->'ulangan','versi',vers),now());
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu)
    values(actor,'uji_konsistensi',parent.konsistensi_id::text,'CREATE_CONSISTENCY',to_jsonb(parent)||jsonb_build_object('ulangan',p_data->'ulangan'),localtimestamp);
  return to_jsonb(parent)||jsonb_build_object('ulangan',p_data->'ulangan','versi',vers);
end $$;

revoke all on function public.baca_senarai_siklus_verval(integer) from public,anon;
revoke all on function public.baca_siklus_verval(integer,integer) from public,anon;
revoke all on function public.baca_uji_konsistensi_verval(integer,integer) from public,anon;
revoke all on function public.buat_siklus_verval(integer,uuid) from public,anon;
revoke all on function public.simpan_uji_konsistensi_verval(integer,integer,jsonb) from public,anon;
grant execute on function public.baca_senarai_siklus_verval(integer) to authenticated;
grant execute on function public.baca_siklus_verval(integer,integer) to authenticated;
grant execute on function public.baca_uji_konsistensi_verval(integer,integer) to authenticated;
grant execute on function public.buat_siklus_verval(integer,uuid) to authenticated;
grant execute on function public.simpan_uji_konsistensi_verval(integer,integer,jsonb) to authenticated;

commit;
