-- LOCAL-ONLY executable migration candidate. DO NOT APPLY to shared Supabase.
-- Prerequisites inspected read-only on 2026-11-11:
-- public.paket_kontrak(paket_id,balai_id,created_by), pengguna(auth_user_id,pengguna_id,terkunci),
-- pengguna_peran(pengguna_id,peran_id,scope_balai_id,scope_paket_id), peran(nama),
-- public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu),
-- installed app_private.assert_validasi_lrs_access(integer,boolean), and installed
-- public.baca_validasi_lrs(integer), app_private.validasi_lrs_version(validasi_lrs_id,versi),
-- public.lokasi_pekerjaan(paket_id,ruas_id), and document/version catalog. The
-- package road set is DISTINCT non-null lokasi_pekerjaan.ruas_id, not every road
-- in a Balai. No changes to validasi_lrs or its installed RPCs.
--
-- FAIL-CLOSED POLICY: every request currently includes EVIDENCE_POLICY_UNRESOLVED,
-- SMD_VERIFICATION_UNAVAILABLE, and unverified LRP/topology/STA items. Therefore
-- submit and approval cannot succeed today. Do not remove blockers until owners
-- approve authoritative evidence rules and verifiers. DISETUJUI is not a Berita
-- Acara, SMD VALID, technical PASS, or permission for Tahap 5 by itself.

begin;

do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Stage 4 lifecycle candidate must be installed by postgres';
  end if;
end $$;

create table app_private.validasi_lrs_workflow (
  workflow_id bigint generated always as identity primary key,
  paket_id integer not null references public.paket_kontrak(paket_id),
  versi integer not null check (versi > 0 and versi <= 2147483646),
  state text not null check (state in ('DIAJUKAN','PERLU_REVISI','DISETUJUI')),
  catatan text not null default '',
  submission_workflow_id bigint references app_private.validasi_lrs_workflow(workflow_id),
  actor_pengguna_id integer not null references public.pengguna(pengguna_id),
  dibuat_pada timestamptz not null default now(),
  unique (paket_id, versi)
);
create index validasi_lrs_workflow_latest on app_private.validasi_lrs_workflow(paket_id, versi desc);
revoke all on app_private.validasi_lrs_workflow from public, anon, authenticated;

-- Immutable-at-submit snapshot of every package road's exact LRS row/version
-- and assessed observation values. A later edit increments the installed LRS
-- version and makes the submission ineligible for approval; history is retained.
create table app_private.validasi_lrs_workflow_road_snapshot (
  workflow_id bigint not null references app_private.validasi_lrs_workflow(workflow_id),
  paket_id integer not null references public.paket_kontrak(paket_id),
  ruas_id integer not null references public.ruas_jalan(ruas_id),
  validasi_lrs_id integer not null references public.validasi_lrs(validasi_lrs_id),
  validasi_lrs_version integer not null check (validasi_lrs_version between 0 and 2147483646),
  panjang_lapangan_m numeric,
  panjang_acuan_m numeric,
  jumlah_error_topologi integer,
  format_sesuai_glossary boolean,
  sta_konsisten_iri_pci_ldt boolean,
  primary key (workflow_id, ruas_id),
  unique (workflow_id, validasi_lrs_id)
);
revoke all on app_private.validasi_lrs_workflow_road_snapshot from public, anon, authenticated;

-- Server-created inventory only: one manifest row per persisted package
-- document, linked to its exact active dokumen_versi when present. The manifest
-- does not establish sufficiency, acceptance, SMD VALID, or official PASS.
create table app_private.validasi_lrs_workflow_evidence (
  evidence_manifest_id bigint generated always as identity primary key,
  workflow_id bigint not null references app_private.validasi_lrs_workflow(workflow_id),
  source_type text not null check (source_type = 'DOKUMEN'),
  source_record_id integer not null references public.dokumen(dokumen_id),
  source_version_id integer references public.dokumen_versi(dok_versi_id),
  source_subtype text,
  source_context_id integer,
  source_title text,
  evidence_type text not null,
  source_status text,
  manifest_status text not null check (manifest_status in ('CAPTURED_UNVERIFIED','VERSION_MISSING','SOURCE_UNAVAILABLE')),
  hash_file text,
  captured_at timestamptz not null default now(),
  unique (workflow_id, source_record_id)
);
revoke all on app_private.validasi_lrs_workflow_evidence from public, anon, authenticated;

create or replace function app_private.stage4_lrs_snapshot_stale(p_workflow_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    not exists (select 1 from app_private.validasi_lrs_workflow_road_snapshot s where s.workflow_id=p_workflow_id)
    or exists (
      select 1
      from app_private.validasi_lrs_workflow_road_snapshot s
      left join public.validasi_lrs v on v.validasi_lrs_id=s.validasi_lrs_id
      left join app_private.validasi_lrs_version x on x.validasi_lrs_id=v.validasi_lrs_id
      where s.workflow_id=p_workflow_id and (
        v.validasi_lrs_id is null or v.paket_id is distinct from s.paket_id or v.ruas_id is distinct from s.ruas_id
        or x.versi is distinct from s.validasi_lrs_version
        or v.panjang_lapangan_m is distinct from s.panjang_lapangan_m
        or v.panjang_acuan_m is distinct from s.panjang_acuan_m
        or v.jumlah_error_topologi is distinct from s.jumlah_error_topologi
        or v.format_sesuai_glossary is distinct from s.format_sesuai_glossary
        or v.sta_konsisten_iri_pci_ldt is distinct from s.sta_konsisten_iri_pci_ldt
      )
    )
    or exists (
      select 1 from public.lokasi_pekerjaan lp
      where lp.paket_id=(select w.paket_id from app_private.validasi_lrs_workflow w where w.workflow_id=p_workflow_id)
        and lp.ruas_id is not null
        and not exists (select 1 from app_private.validasi_lrs_workflow_road_snapshot s
          where s.workflow_id=p_workflow_id and s.ruas_id=lp.ruas_id)
    )
    or exists (
      select 1 from app_private.validasi_lrs_workflow_road_snapshot s
      where s.workflow_id=p_workflow_id
        and not exists (select 1 from public.lokasi_pekerjaan lp
          where lp.paket_id=s.paket_id and lp.ruas_id=s.ruas_id)
    )
    or exists (
      select 1 from public.lokasi_pekerjaan lp
      join public.validasi_lrs v on v.paket_id=lp.paket_id and v.ruas_id=lp.ruas_id
      where lp.paket_id=(select w.paket_id from app_private.validasi_lrs_workflow w where w.workflow_id=p_workflow_id)
        and lp.ruas_id is not null
      group by lp.ruas_id having count(distinct v.validasi_lrs_id)>1
    );
$$;
revoke all on function app_private.stage4_lrs_snapshot_stale(bigint) from public, anon, authenticated;

create or replace function app_private.stage4_evidence_snapshot_stale(p_workflow_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    exists (
      select 1
      from app_private.validasi_lrs_workflow_evidence m
      left join public.dokumen d on d.dokumen_id=m.source_record_id
      left join public.jenis_dokumen j on j.jenis_dokumen_id=d.jenis_dokumen_id
      left join public.dokumen_versi v on v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif
      where m.workflow_id=p_workflow_id and (
        d.dokumen_id is null or d.paket_id is distinct from
          (select w.paket_id from app_private.validasi_lrs_workflow w where w.workflow_id=p_workflow_id)
        or d.status is distinct from m.source_status
        or d.sumber_tipe is distinct from m.source_subtype
        or d.sumber_id is distinct from m.source_context_id
        or d.judul is distinct from m.source_title
        or coalesce(j.kode,'UNCLASSIFIED') is distinct from m.evidence_type
        or v.dok_versi_id is distinct from m.source_version_id
        or v.hash_file is distinct from m.hash_file
      )
    )
    or exists (
      select 1 from public.dokumen d
      where d.paket_id=(select w.paket_id from app_private.validasi_lrs_workflow w where w.workflow_id=p_workflow_id)
        and not exists (select 1 from app_private.validasi_lrs_workflow_evidence m
          where m.workflow_id=p_workflow_id and m.source_record_id=d.dokumen_id)
    );
$$;
revoke all on function app_private.stage4_evidence_snapshot_stale(bigint) from public, anon, authenticated;

create or replace function app_private.stage4_capture_submission(p_paket_id integer,p_workflow_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare v_required_roads integer; v_captured_roads integer;
begin
  insert into app_private.validasi_lrs_workflow_road_snapshot(
    workflow_id,paket_id,ruas_id,validasi_lrs_id,validasi_lrs_version,
    panjang_lapangan_m,panjang_acuan_m,jumlah_error_topologi,format_sesuai_glossary,sta_konsisten_iri_pci_ldt
  )
  select p_workflow_id,p_paket_id,required.ruas_id,v.validasi_lrs_id,x.versi,
    v.panjang_lapangan_m,v.panjang_acuan_m,v.jumlah_error_topologi,v.format_sesuai_glossary,v.sta_konsisten_iri_pci_ldt
  from (select distinct lp.ruas_id from public.lokasi_pekerjaan lp where lp.paket_id=p_paket_id and lp.ruas_id is not null) required
  join public.validasi_lrs v on v.paket_id=p_paket_id and v.ruas_id=required.ruas_id
  join app_private.validasi_lrs_version x on x.validasi_lrs_id=v.validasi_lrs_id
  join public.ruas_jalan r on r.ruas_id=required.ruas_id
  join public.paket_kontrak p on p.paket_id=p_paket_id and p.balai_id=r.balai_id;

  select count(distinct lp.ruas_id) into v_required_roads from public.lokasi_pekerjaan lp
    where lp.paket_id=p_paket_id and lp.ruas_id is not null;
  select count(*) into v_captured_roads from app_private.validasi_lrs_workflow_road_snapshot s
    where s.workflow_id=p_workflow_id;
  if v_required_roads=0 or v_required_roads<>v_captured_roads then
    raise exception 'Snapshot LRS tidak mencakup seluruh ruas wajib paket' using errcode='55000';
  end if;

  insert into app_private.validasi_lrs_workflow_evidence(
    workflow_id,source_type,source_record_id,source_version_id,source_subtype,source_context_id,source_title,
    evidence_type,source_status,manifest_status,hash_file
  )
  select p_workflow_id,'DOKUMEN',d.dokumen_id,v.dok_versi_id,d.sumber_tipe,d.sumber_id,d.judul,
    coalesce(j.kode,'UNCLASSIFIED'),d.status,
    case when d.status is distinct from 'TERSEDIA' then 'SOURCE_UNAVAILABLE'
      when v.dok_versi_id is null then 'VERSION_MISSING'
      else 'CAPTURED_UNVERIFIED' end,
    v.hash_file
  from public.dokumen d
  left join public.jenis_dokumen j on j.jenis_dokumen_id=d.jenis_dokumen_id
  left join public.dokumen_versi v on v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif
  where d.paket_id=p_paket_id;
end $$;
revoke all on function app_private.stage4_capture_submission(integer,bigint) from public, anon, authenticated;

create or replace function app_private.stage4_actor(p_paket_id integer, p_action text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_actor integer; v_balai integer;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
  select p.pengguna_id into v_actor from public.pengguna p
    where p.auth_user_id=auth.uid() and not coalesce(p.terkunci,false);
  if v_actor is null then raise exception 'Profil tidak berwenang' using errcode='42501'; end if;
  select p.balai_id into v_balai from public.paket_kontrak p where p.paket_id=p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  if p_action in ('SUBMIT','RESUBMIT') then
    perform app_private.assert_validasi_lrs_access(p_paket_id,true);
    return v_actor;
  elsif p_action='REVIEW' and exists (
    select 1 from public.pengguna_peran pp join public.peran r using(peran_id)
    where pp.pengguna_id=v_actor and r.nama='pic_balai' and pp.scope_balai_id=v_balai
      and (pp.scope_paket_id is null or pp.scope_paket_id=p_paket_id)
  ) then return v_actor;
  end if;
  raise exception 'Peran atau cakupan paket/Balai tidak berwenang' using errcode='42501';
end $$;
revoke all on function app_private.stage4_actor(integer,text) from public,anon,authenticated;

create or replace function app_private.stage4_blockers(p_paket_id integer,p_snapshot_workflow_id bigint default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_rows jsonb; v_balai_id integer; v_blockers jsonb := jsonb_build_array(
  jsonb_build_object('code','EVIDENCE_POLICY_UNRESOLVED','message','Daftar bukti wajib Submit Tahap 4 dan kaitan bukti persisten belum disahkan.'),
  jsonb_build_object('code','MISSING_EVIDENCE','message','Kelengkapan bukti wajib belum dapat diverifikasi; bukti yang belum terhubung tidak dianggap tersedia.'),
  jsonb_build_object('code','SMD_VERIFICATION_UNAVAILABLE','message','Sumber otoritatif verifikasi RNI/LRS VALID SMD belum tersedia.'),
  jsonb_build_object('code','LRP_ACCURACY_UNVERIFIED','message','Ketelitian 0,1% jarak LRP belum dapat dinilai dari formulir LRS.'),
  jsonb_build_object('code','TOPOLOGY_UNVERIFIED','message','Indikator jumlah error bukan verifikasi geometri/topologi menyeluruh.'),
  jsonb_build_object('code','PIC_BA_BOUNDARY_UNRESOLVED','message','Batas review PIC dan Berita Acara Penerimaan belum disahkan.')
);
begin
  select p.balai_id into v_balai_id from public.paket_kontrak p where p.paket_id=p_paket_id;
  v_rows := public.baca_validasi_lrs(p_paket_id);
  if not exists (select 1 from public.lokasi_pekerjaan lp where lp.paket_id=p_paket_id and lp.ruas_id is not null) then
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','PACKAGE_ROADS_UNDEFINED','message','Paket belum memiliki ruas jalan yang terdaftar pada lokasi_pekerjaan.'));
  end if;
  if exists (select 1 from public.lokasi_pekerjaan lp left join public.ruas_jalan r on r.ruas_id=lp.ruas_id
    where lp.paket_id=p_paket_id and lp.ruas_id is not null and (r.ruas_id is null or r.balai_id is distinct from v_balai_id)) then
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','PACKAGE_ROAD_SCOPE_INVALID','message','Ada ruas terdaftar di luar cakupan Balai paket.'));
  end if;
  if exists (select 1 from (select distinct lp.ruas_id from public.lokasi_pekerjaan lp where lp.paket_id=p_paket_id and lp.ruas_id is not null) required
    where not exists (select 1 from public.validasi_lrs v join app_private.validasi_lrs_version x using(validasi_lrs_id)
      where v.paket_id=p_paket_id and v.ruas_id=required.ruas_id)) then
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','MISSING_LRS_FOR_REQUIRED_ROAD','message','Belum ada validasi LRS berversi untuk setiap ruas wajib dalam paket.'));
  end if;
  if exists (select 1 from public.lokasi_pekerjaan lp join public.validasi_lrs v
    on v.paket_id=lp.paket_id and v.ruas_id=lp.ruas_id
    where lp.paket_id=p_paket_id and lp.ruas_id is not null and
      (v.panjang_lapangan_m is null or v.panjang_acuan_m is null)) then
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','LENGTH_INCOMPLETE','message','Panjang lapangan/acuan belum lengkap pada ruas wajib.'));
  end if;
  if exists (select 1 from public.lokasi_pekerjaan lp join public.validasi_lrs v
    on v.paket_id=lp.paket_id and v.ruas_id=lp.ruas_id
    where lp.paket_id=p_paket_id and lp.ruas_id is not null
      and v.panjang_lapangan_m is not null and v.panjang_acuan_m is not null
      and abs(v.panjang_lapangan_m-v.panjang_acuan_m)>30) then
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','REMEASUREMENT_REQUIRED','message','Selisih panjang >30 m pada ruas yang sama: ukur ulang; jika hasil kedua mengesahkan hasil awal, maklumkan Pengguna Jasa.'));
  end if;
  if p_snapshot_workflow_id is not null and app_private.stage4_lrs_snapshot_stale(p_snapshot_workflow_id) then
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','LRS_SNAPSHOT_STALE','message','Data LRS atau cakupan ruas berubah setelah submit; pengajuan ini tidak layak disetujui. Minta revisi dan ajukan ulang.'));
  end if;
  if p_snapshot_workflow_id is not null and app_private.stage4_evidence_snapshot_stale(p_snapshot_workflow_id) then
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','EVIDENCE_SNAPSHOT_STALE','message','Inventaris dokumen atau versi bukti berubah setelah submit; pengajuan ini tidak layak disetujui. Minta revisi dan ajukan ulang.'));
  end if;
  if jsonb_typeof(v_rows)='array' then
    if jsonb_array_length(v_rows)=0 then
      v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','LRS_MISSING','message','Belum ada observasi LRS tersimpan.'));
    end if;
  end if;
  return jsonb_build_object('gate','PENDING','progression_allowed',false,'blockers',v_blockers,'validations',coalesce(v_rows,'[]'::jsonb));
end $$;
revoke all on function app_private.stage4_blockers(integer,bigint) from public,anon,authenticated;

create or replace function public.baca_status_validasi_lrs(p_paket_id integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor integer; v_state text; v_version integer; v_note text; v_workflow_id bigint; v_submission_workflow_id bigint; v_snapshot_workflow_id bigint; v_gate jsonb;
begin
  v_actor := app_private.assert_validasi_lrs_access(p_paket_id,false);
  select w.workflow_id,w.submission_workflow_id,w.state,w.versi,w.catatan into v_workflow_id,v_submission_workflow_id,v_state,v_version,v_note from app_private.validasi_lrs_workflow w
    where w.paket_id=p_paket_id order by w.versi desc limit 1;
  v_snapshot_workflow_id := case when v_state='DIAJUKAN' then v_workflow_id else v_submission_workflow_id end;
  v_gate := app_private.stage4_blockers(p_paket_id,v_snapshot_workflow_id);
  return jsonb_build_object('paket_id',p_paket_id,'state',coalesce(v_state,'PENDING_RULES'),
    'workflow_version',coalesce(v_version,0),'catatan',coalesce(v_note,''),
    'submission_workflow_id',v_snapshot_workflow_id) || v_gate;
end $$;

create or replace function public.ajukan_validasi_lrs(p_paket_id integer,p_expected_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor integer; v_paket public.paket_kontrak; v_latest app_private.validasi_lrs_workflow; v_gate jsonb; v_new app_private.validasi_lrs_workflow;
begin
  if p_expected_version is null or p_expected_version<0 or p_expected_version>2147483646 then
    raise exception 'Versi workflow tidak valid' using errcode='22023';
  end if;
  select * into v_paket from public.paket_kontrak where paket_id=p_paket_id for update;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  v_actor := app_private.stage4_actor(p_paket_id,'SUBMIT');
  select * into v_latest from app_private.validasi_lrs_workflow where paket_id=p_paket_id order by versi desc limit 1;
  if not found then
    if p_expected_version<>0 then raise exception 'Versi workflow berubah' using errcode='40001'; end if;
    v_latest.versi := 0;
  elsif p_expected_version<>v_latest.versi then raise exception 'Versi workflow berubah' using errcode='40001'; end if;
  if v_latest.versi>=2147483646 then raise exception 'Versi workflow maksimum tercapai' using errcode='22003'; end if;
  if v_latest.versi>0 and v_latest.state not in ('PERLU_REVISI') then raise exception 'Status tidak dapat diajukan ulang' using errcode='55000'; end if;
  v_gate := app_private.stage4_blockers(p_paket_id);
  if jsonb_array_length(v_gate->'blockers')>0 then raise exception 'Submit diblokir: %',v_gate->'blockers' using errcode='55000'; end if;
  insert into app_private.validasi_lrs_workflow(paket_id,versi,state,actor_pengguna_id)
    values(p_paket_id,v_latest.versi+1,'DIAJUKAN',v_actor) returning * into v_new;
  perform app_private.stage4_capture_submission(p_paket_id,v_new.workflow_id);
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
    values(v_actor,'validasi_lrs_workflow',p_paket_id::text,'SUBMIT_STAGE4',case when v_latest.versi=0 then null else to_jsonb(v_latest) end,
      to_jsonb(v_new)||jsonb_build_object('lrs_snapshot_count',(select count(*) from app_private.validasi_lrs_workflow_road_snapshot s where s.workflow_id=v_new.workflow_id),
        'evidence_manifest_count',(select count(*) from app_private.validasi_lrs_workflow_evidence e where e.workflow_id=v_new.workflow_id)),localtimestamp);
  return to_jsonb(v_new);
end $$;

create or replace function public.review_validasi_lrs(p_paket_id integer,p_expected_version integer,p_keputusan text,p_catatan text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor integer; v_paket public.paket_kontrak; v_old app_private.validasi_lrs_workflow; v_new app_private.validasi_lrs_workflow; v_gate jsonb;
begin
  if p_expected_version is null or p_expected_version<1 or p_expected_version>2147483646 then
    raise exception 'Versi workflow tidak valid' using errcode='22023';
  end if;
  if p_keputusan is null or p_keputusan not in ('DISETUJUI','PERLU_REVISI') or
    length(btrim(coalesce(p_catatan,'')))>2000 or
    (p_keputusan='PERLU_REVISI' and length(btrim(coalesce(p_catatan,'')))=0) then
    raise exception 'Keputusan review tidak valid' using errcode='22023';
  end if;
  select * into v_paket from public.paket_kontrak where paket_id=p_paket_id for update;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002'; end if;
  v_actor := app_private.stage4_actor(p_paket_id,'REVIEW');
  select * into v_old from app_private.validasi_lrs_workflow where paket_id=p_paket_id order by versi desc limit 1;
  if not found or p_expected_version<>v_old.versi then raise exception 'Versi workflow berubah' using errcode='40001'; end if;
  if v_old.versi>=2147483646 then raise exception 'Versi workflow maksimum tercapai' using errcode='22003'; end if;
  if v_old.state<>'DIAJUKAN' then raise exception 'Workflow belum diajukan' using errcode='55000'; end if;
  v_gate := app_private.stage4_blockers(p_paket_id,v_old.workflow_id);
  if p_keputusan='DISETUJUI' and jsonb_array_length(v_gate->'blockers')>0 then raise exception 'Persetujuan diblokir: %',v_gate->'blockers' using errcode='55000'; end if;
  insert into app_private.validasi_lrs_workflow(paket_id,versi,state,catatan,submission_workflow_id,actor_pengguna_id)
    values(p_paket_id,v_old.versi+1,p_keputusan,coalesce(btrim(p_catatan),''),v_old.workflow_id,v_actor) returning * into v_new;
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
    values(v_actor,'validasi_lrs_workflow',p_paket_id::text,'REVIEW_STAGE4',to_jsonb(v_old),to_jsonb(v_new),localtimestamp);
  return to_jsonb(v_new);
end $$;

alter function app_private.stage4_actor(integer,text) owner to postgres;
alter function app_private.stage4_lrs_snapshot_stale(bigint) owner to postgres;
alter function app_private.stage4_evidence_snapshot_stale(bigint) owner to postgres;
alter function app_private.stage4_capture_submission(integer,bigint) owner to postgres;
alter function app_private.stage4_blockers(integer,bigint) owner to postgres;
alter function public.baca_status_validasi_lrs(integer) owner to postgres;
alter function public.ajukan_validasi_lrs(integer,integer) owner to postgres;
alter function public.review_validasi_lrs(integer,integer,text,text) owner to postgres;

revoke all on function public.baca_status_validasi_lrs(integer) from public,anon;
revoke all on function public.ajukan_validasi_lrs(integer,integer) from public,anon;
revoke all on function public.review_validasi_lrs(integer,integer,text,text) from public,anon;
grant execute on function public.baca_status_validasi_lrs(integer) to authenticated;
grant execute on function public.ajukan_validasi_lrs(integer,integer) to authenticated;
grant execute on function public.review_validasi_lrs(integer,integer,text,text) to authenticated;

commit;
