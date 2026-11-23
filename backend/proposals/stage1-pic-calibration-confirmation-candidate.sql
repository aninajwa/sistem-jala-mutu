-- REVIEW CANDIDATE ONLY. DO NOT INSTALL OR RUN.
-- Stage 1 package-scoped PIC confirmation before Stage 2.
-- Uses installed tables only: paket_kontrak, paket_survei_kontrak,
-- paket_survei_kontrak_versi, lokasi_pekerjaan, tim_survei,
-- penugasan_alat, alat_survei, kalibrasi_alat, kalibrasi_rater,
-- anggota_tim, personel, kualifikasi_personel, checklist_pengisian,
-- checklist_template/item/jawaban, dokumen/dokumen_versi and audit_trail.
-- It neither changes Stage 1 draft-save RPCs nor Tahap 0/Stage 4/Tahap 5.

begin;

create table public.stage1_pic_konfirmasi (
  paket_id integer primary key references public.paket_kontrak(paket_id),
  status text not null check (status in ('DIAJUKAN', 'PERLU_REVISI', 'DISETUJUI')),
  versi integer not null check (versi >= 1),
  snapshot_pengajuan jsonb not null,
  pengajuan_trail_id bigint not null references public.audit_trail(trail_id),
  diajukan_oleh integer not null references public.pengguna(pengguna_id),
  diajukan_pada timestamptz not null,
  review_trail_id bigint references public.audit_trail(trail_id),
  direview_oleh integer references public.pengguna(pengguna_id),
  direview_pada timestamptz,
  catatan_review text,
  updated_at timestamptz not null default now(),
  check (catatan_review is null or length(catatan_review) <= 2000),
  check (status <> 'PERLU_REVISI' or nullif(btrim(catatan_review), '') is not null),
  check ((status = 'DIAJUKAN' and direview_oleh is null and direview_pada is null and review_trail_id is null)
      or (status in ('PERLU_REVISI', 'DISETUJUI') and direview_oleh is not null and direview_pada is not null and review_trail_id is not null))
);

alter table public.stage1_pic_konfirmasi enable row level security;
revoke all on public.stage1_pic_konfirmasi from public, anon, authenticated;

create or replace function app_private.assert_stage1_confirmation_access(
  p_paket_id integer,
  p_action text
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor integer;
  v_package public.paket_kontrak;
  v_provider boolean;
  v_pic boolean;
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

  select * into v_package
  from public.paket_kontrak p
  where p.paket_id = p_paket_id;
  if not found then
    raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002';
  end if;

  select
    exists (
      select 1 from public.pengguna_peran pp
      join public.peran r using (peran_id)
      where pp.pengguna_id = v_actor
        and r.nama = 'penyedia_jasa'
        and v_package.created_by = v_actor
        and (pp.scope_paket_id is null or pp.scope_paket_id = p_paket_id)
        and (pp.scope_balai_id is null or pp.scope_balai_id = v_package.balai_id)
    ),
    exists (
      select 1 from public.pengguna_peran pp
      join public.peran r using (peran_id)
      where pp.pengguna_id = v_actor
        and r.nama = 'pic_balai'
        and pp.scope_balai_id = v_package.balai_id
        and (pp.scope_paket_id is null or pp.scope_paket_id = p_paket_id)
    )
  into v_provider, v_pic;

  if (p_action = 'provider' and not v_provider)
     or (p_action = 'pic' and not v_pic)
     or (p_action = 'read' and not (v_provider or v_pic)) then
    raise exception 'Akses konfirmasi kalibrasi untuk paket/Balai ini ditolak' using errcode = '42501';
  end if;
  if p_action not in ('provider', 'pic', 'read') then
    raise exception 'Aksi konfirmasi tidak valid' using errcode = '22023';
  end if;
  return v_actor;
end;
$function$;

create or replace function app_private.snapshot_stage1_calibration(p_paket_id integer)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'paket_id', p_paket_id,
    'declared_scope_version', coalesce((
      select v.versi from public.paket_survei_kontrak_versi v
      where v.paket_id = p_paket_id
    ), 0),
    'blockers', case
      when not exists (
        select 1 from public.paket_survei_kontrak ps
        where ps.paket_id = p_paket_id
      ) then jsonb_build_array('DECLARED_SCOPE_UNSET')
      when not exists (
        select 1 from public.paket_survei_kontrak_versi v
        where v.paket_id = p_paket_id and v.versi > 0
      ) then jsonb_build_array('DECLARED_SCOPE_VERSION_MISSING')
      when exists (
        select 1
        from public.paket_survei_kontrak ps
        left join public.jenis_survei s on s.jenis_survei_id = ps.jenis_survei_id
        where ps.paket_id = p_paket_id and coalesce(s.aktif, false) is not true
      ) then jsonb_build_array('DECLARED_SURVEY_INACTIVE')
      else '[]'::jsonb
    end,
    'applicable_surveys', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'jenis_survei', jsonb_build_object(
            'jenis_survei_id', s.jenis_survei_id, 'kode', s.kode, 'nama', s.nama,
            'aktif', s.aktif
          ),
          'locations', coalesce((
            select jsonb_agg(to_jsonb(l) order by l.lokasi_id)
            from public.lokasi_pekerjaan l
            where l.paket_id = p_paket_id and l.jenis_survei_id = s.jenis_survei_id
          ), '[]'::jsonb),
          'teams', coalesce((
            select jsonb_agg(to_jsonb(t) order by t.tim_id)
            from public.tim_survei t
            where t.paket_id = p_paket_id and t.jenis_survei_id = s.jenis_survei_id
          ), '[]'::jsonb)
        ) order by s.jenis_survei_id
      )
      from public.paket_survei_kontrak ps
      join public.jenis_survei s on s.jenis_survei_id = ps.jenis_survei_id
      where ps.paket_id = p_paket_id
    ), '[]'::jsonb),
    'equipment_assignments', coalesce((
      select jsonb_agg(
        jsonb_build_object('assignment', to_jsonb(pa), 'equipment', to_jsonb(a), 'team', to_jsonb(t))
        order by t.tim_id, pa.penugasan_id
      )
      from public.penugasan_alat pa
      join public.tim_survei t on t.tim_id = pa.tim_id and t.paket_id = p_paket_id
      join public.paket_survei_kontrak ps
        on ps.paket_id = p_paket_id and ps.jenis_survei_id = t.jenis_survei_id
      join public.jenis_survei s on s.jenis_survei_id = t.jenis_survei_id and s.aktif is true
      join public.alat_survei a on a.alat_id = pa.alat_id
    ), '[]'::jsonb),
    'calibration_records', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'record', to_jsonb(k),
          'equipment', to_jsonb(a),
          'document', case when d.dokumen_id is null then null else jsonb_build_object(
            'dokumen_id', d.dokumen_id, 'judul', d.judul, 'status', d.status,
            'versi_aktif', d.versi_aktif,
            'file_version', (
              select jsonb_build_object(
                'versi_ke', dv.versi_ke, 'hash_file', dv.hash_file,
                'ukuran_byte', dv.ukuran_byte, 'nama_file', dv.nama_file, 'mime_type', dv.mime_type
              )
              from public.dokumen_versi dv
              where dv.dokumen_id = d.dokumen_id and dv.versi_ke = d.versi_aktif
            )
          ) end
        ) order by k.kalibrasi_id
      )
      from public.kalibrasi_alat k
      join public.alat_survei a on a.alat_id = k.alat_id
      left join public.dokumen d on d.dokumen_id = k.dokumen_id and d.paket_id = p_paket_id
      where k.paket_id = p_paket_id
        and exists (
          select 1 from public.penugasan_alat pa
          join public.tim_survei t on t.tim_id = pa.tim_id and t.paket_id = p_paket_id
          join public.paket_survei_kontrak ps
            on ps.paket_id = p_paket_id and ps.jenis_survei_id = t.jenis_survei_id
          where pa.alat_id = k.alat_id
        )
    ), '[]'::jsonb),
    'team_members_and_qualifications', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'membership', to_jsonb(m),
          'personnel', to_jsonb(pe),
          'qualifications', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'record', to_jsonb(q),
                'document', case when d.dokumen_id is null then null else jsonb_build_object(
                  'dokumen_id', d.dokumen_id, 'judul', d.judul, 'status', d.status,
                  'versi_aktif', d.versi_aktif,
                  'file_version', (
                    select jsonb_build_object(
                      'versi_ke', dv.versi_ke, 'hash_file', dv.hash_file,
                      'ukuran_byte', dv.ukuran_byte, 'nama_file', dv.nama_file, 'mime_type', dv.mime_type
                    )
                    from public.dokumen_versi dv
                    where dv.dokumen_id = d.dokumen_id and dv.versi_ke = d.versi_aktif
                  )
                ) end
              ) order by q.kualifikasi_id
            )
            from public.kualifikasi_personel q
            left join public.dokumen d on d.dokumen_id = q.dokumen_id and d.paket_id = p_paket_id
            where q.personel_id = pe.personel_id
          ), '[]'::jsonb)
        ) order by t.tim_id, m.anggota_id
      )
      from public.anggota_tim m
      join public.tim_survei t on t.tim_id = m.tim_id and t.paket_id = p_paket_id
      join public.paket_survei_kontrak ps
        on ps.paket_id = p_paket_id and ps.jenis_survei_id = t.jenis_survei_id
      join public.jenis_survei s on s.jenis_survei_id = t.jenis_survei_id and s.aktif is true
      join public.personel pe on pe.personel_id = m.personel_id
    ), '[]'::jsonb),
    'rater_calibrations', coalesce((
      select jsonb_agg(to_jsonb(kr) order by kr.kal_rater_id)
      from public.kalibrasi_rater kr
      where exists (
        select 1
        from public.anggota_tim m
        join public.tim_survei t on t.tim_id = m.tim_id and t.paket_id = p_paket_id
        join public.paket_survei_kontrak ps
          on ps.paket_id = p_paket_id and ps.jenis_survei_id = t.jenis_survei_id
        join public.jenis_survei s on s.jenis_survei_id = t.jenis_survei_id and s.aktif is true
        where m.personel_id = kr.personel_id and t.jenis_survei_id = kr.jenis_survei_id
      )
    ), '[]'::jsonb),
    'calibration_checklists', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'filling', to_jsonb(q),
          'template', jsonb_build_object(
            'template_id', t.template_id, 'jenis_survei_id', t.jenis_survei_id,
            'jenis', t.jenis, 'no_dokumen', t.no_dokumen, 'revisi', t.revisi,
            'source_sha256', t.source_sha256, 'approval_state', t.approval_state
          ),
          'answers', coalesce((
            select jsonb_agg(jsonb_build_object(
              'answer', to_jsonb(j),
              'document', case when d.dokumen_id is null then null else jsonb_build_object(
                'dokumen_id', d.dokumen_id, 'versi_aktif', d.versi_aktif, 'status', d.status,
                'file_version', (
                  select jsonb_build_object('versi_ke', dv.versi_ke, 'hash_file', dv.hash_file, 'nama_file', dv.nama_file)
                  from public.dokumen_versi dv
                  where dv.dokumen_id = d.dokumen_id and dv.versi_ke = d.versi_aktif
                )
              ) end
            ) order by i.urutan, i.item_id)
            from public.checklist_jawaban j
            join public.checklist_item i on i.item_id = j.item_id
            left join public.dokumen d on d.dokumen_id = j.bukti_dokumen_id and d.paket_id = p_paket_id
            where j.pengisian_id = q.pengisian_id
          ), '[]'::jsonb)
        ) order by q.pengisian_id
      )
      from public.checklist_pengisian q
      join public.checklist_template t on t.template_id = q.template_id
      where q.paket_id = p_paket_id
        and t.jenis_survei_id in (
          select ps.jenis_survei_id from public.paket_survei_kontrak ps
          where ps.paket_id = p_paket_id
        )
        and coalesce(t.jenis, '') ilike '%KALIBRASI%'
    ), '[]'::jsonb)
  );
$function$;

create or replace function app_private.baca_konfirmasi_kalibrasi_tahap1(p_paket_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_current jsonb;
  v_state public.stage1_pic_konfirmasi;
  v_matches boolean;
begin
  perform app_private.assert_stage1_confirmation_access(p_paket_id, 'read');
  v_current := app_private.snapshot_stage1_calibration(p_paket_id);
  select * into v_state from public.stage1_pic_konfirmasi c where c.paket_id = p_paket_id;
  if not found then
    return jsonb_build_object(
      'paket_id', p_paket_id, 'status', 'BELUM_DIAJUKAN', 'versi', 0,
      'snapshot_saat_ini', v_current, 'pengajuan', null, 'review', null,
      'snapshot_sesuai', false, 'stage2_allowed', false
    );
  end if;
  v_matches := v_state.snapshot_pengajuan = v_current;
  return jsonb_build_object(
    'paket_id', p_paket_id, 'status', v_state.status, 'versi', v_state.versi,
    'snapshot_saat_ini', v_current,
    'pengajuan', jsonb_build_object(
      'audit_id', v_state.pengajuan_trail_id, 'versi', v_state.versi,
      'diajukan_oleh', v_state.diajukan_oleh, 'diajukan_pada', v_state.diajukan_pada,
      'snapshot', v_state.snapshot_pengajuan
    ),
    'review', case when v_state.direview_oleh is null then null else jsonb_build_object(
      'audit_id', v_state.review_trail_id, 'pengguna_id', v_state.direview_oleh,
      'keputusan', v_state.status, 'catatan', v_state.catatan_review, 'waktu', v_state.direview_pada
    ) end,
    'snapshot_sesuai', v_matches,
    'stage2_allowed', v_state.status = 'DISETUJUI' and v_matches
  );
end;
$function$;

create or replace function app_private.ajukan_konfirmasi_kalibrasi_tahap1(
  p_paket_id integer,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor integer;
  v_state public.stage1_pic_konfirmasi;
  v_current jsonb;
  v_before jsonb;
  v_after jsonb;
  v_next_version integer;
  v_submitted_at timestamptz := clock_timestamp();
  v_trail bigint;
begin
  perform 1 from public.paket_kontrak p where p.paket_id = p_paket_id for update;
  if not found then raise exception 'Paket tidak ditemukan' using errcode = 'P0002'; end if;
  -- Serialize before authorization; the role, owner and scopes are checked
  -- by the authoritative helper against this locked package row.
  v_actor := app_private.assert_stage1_confirmation_access(p_paket_id, 'provider');
  if p_expected_version is null or p_expected_version not between 0 and 2147483646 then
    raise exception 'Versi pengajuan tidak valid' using errcode = '22023';
  end if;
  -- Reuse the installed Stage 1 precondition: active Provider ownership,
  -- DRAFT package, and approved Stage 0 preparation.
  perform app_private.assert_tahap_kalibrasi(p_paket_id);
  select * into v_state from public.stage1_pic_konfirmasi c where c.paket_id = p_paket_id for update;
  if found then
    if v_state.versi <> p_expected_version then
      raise exception 'Status konfirmasi berubah. Muat ulang sebelum mengajukan' using errcode = '40001';
    end if;
  elsif p_expected_version <> 0 then
    raise exception 'Status konfirmasi berubah. Muat ulang sebelum mengajukan' using errcode = '40001';
  end if;

  v_current := app_private.snapshot_stage1_calibration(p_paket_id);
  if jsonb_array_length(v_current->'applicable_surveys') = 0
     or jsonb_array_length(v_current->'blockers') > 0 then
    raise exception 'Scope survei kontrak belum ditetapkan atau memuat survei nonaktif' using errcode = '55000';
  end if;
  if v_state.paket_id is not null and v_state.status = 'DIAJUKAN'
     and v_state.snapshot_pengajuan = v_current then
    raise exception 'Snapshot yang sama sudah menunggu keputusan PIC' using errcode = '55000';
  end if;
  if v_state.paket_id is not null and v_state.status = 'DISETUJUI'
     and v_state.snapshot_pengajuan = v_current then
    raise exception 'Snapshot ini sudah dikonfirmasi PIC' using errcode = '55000';
  end if;

  v_next_version := coalesce(v_state.versi, 0) + 1;
  v_before := case when v_state.paket_id is null then jsonb_build_object(
    'paket_id', p_paket_id, 'status', 'BELUM_DIAJUKAN', 'versi', 0
  ) else to_jsonb(v_state) end;
  v_after := jsonb_build_object(
    'paket_id', p_paket_id, 'status', 'DIAJUKAN', 'versi', v_next_version,
    'diajukan_oleh', v_actor, 'diajukan_pada', v_submitted_at, 'snapshot', v_current
  );
  insert into public.audit_trail(pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu)
  values (v_actor, 'stage1_pic_konfirmasi', p_paket_id::text, 'AJUKAN_KONFIRMASI_KALIBRASI_TAHAP1', v_before, v_after, localtimestamp)
  returning trail_id into v_trail;

  insert into public.stage1_pic_konfirmasi(
    paket_id, status, versi, snapshot_pengajuan, pengajuan_trail_id,
    diajukan_oleh, diajukan_pada, review_trail_id, direview_oleh, direview_pada, catatan_review, updated_at
  ) values (
    p_paket_id, 'DIAJUKAN', v_next_version, v_current, v_trail,
    v_actor, v_submitted_at, null, null, null, null, clock_timestamp()
  )
  on conflict (paket_id) do update set
    status = excluded.status, versi = excluded.versi, snapshot_pengajuan = excluded.snapshot_pengajuan,
    pengajuan_trail_id = excluded.pengajuan_trail_id, diajukan_oleh = excluded.diajukan_oleh,
    diajukan_pada = excluded.diajukan_pada, review_trail_id = null, direview_oleh = null,
    direview_pada = null, catatan_review = null, updated_at = excluded.updated_at;
  return app_private.baca_konfirmasi_kalibrasi_tahap1(p_paket_id);
end;
$function$;

create or replace function app_private.review_konfirmasi_kalibrasi_tahap1(
  p_paket_id integer,
  p_expected_version integer,
  p_keputusan text,
  p_catatan text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor integer;
  v_state public.stage1_pic_konfirmasi;
  v_current jsonb;
  v_before jsonb;
  v_after jsonb;
  v_reviewed_at timestamptz := clock_timestamp();
  v_trail bigint;
begin
  perform 1 from public.paket_kontrak p where p.paket_id = p_paket_id for update;
  if not found then raise exception 'Paket tidak ditemukan' using errcode = 'P0002'; end if;
  -- Serialize before authorization; the role, Balai and package scope are
  -- checked by the authoritative helper against this locked package row.
  v_actor := app_private.assert_stage1_confirmation_access(p_paket_id, 'pic');
  if p_expected_version is null or p_expected_version not between 1 and 2147483646
     or p_keputusan not in ('DISETUJUI', 'PERLU_REVISI')
     or p_catatan is null or length(p_catatan) > 2000
     or (p_keputusan = 'PERLU_REVISI' and nullif(btrim(p_catatan), '') is null) then
    raise exception 'Keputusan atau catatan review tidak valid' using errcode = '22023';
  end if;
  select * into v_state
  from public.stage1_pic_konfirmasi c
  where c.paket_id = p_paket_id
  for update;
  if not found or v_state.status <> 'DIAJUKAN' then
    raise exception 'Tidak ada pengajuan konfirmasi yang menunggu PIC' using errcode = '55000';
  end if;
  if v_state.diajukan_oleh = v_actor then
    raise exception 'Pengaju tidak boleh menyemak pengajuannya sendiri' using errcode = '42501';
  end if;
  if v_state.versi <> p_expected_version then
    raise exception 'Pengajuan berubah. Muat ulang sebelum memberi keputusan' using errcode = '40001';
  end if;
  v_current := app_private.snapshot_stage1_calibration(p_paket_id);
  if v_state.snapshot_pengajuan <> v_current then
    raise exception 'Rekod Stage 1 berubah selepas pengajuan. Provider perlu menghantar semula snapshot terkini' using errcode = '40001';
  end if;

  v_before := to_jsonb(v_state);
  v_after := jsonb_build_object(
    'paket_id', p_paket_id, 'status', p_keputusan, 'versi', v_state.versi + 1,
    'pengajuan_trail_id', v_state.pengajuan_trail_id, 'snapshot', v_state.snapshot_pengajuan,
    'direview_oleh', v_actor, 'direview_pada', v_reviewed_at,
    'catatan_review', nullif(btrim(p_catatan), '')
  );
  insert into public.audit_trail(pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu)
  values (v_actor, 'stage1_pic_konfirmasi', p_paket_id::text, 'REVIEW_KONFIRMASI_KALIBRASI_TAHAP1', v_before, v_after, localtimestamp)
  returning trail_id into v_trail;

  update public.stage1_pic_konfirmasi
  set status = p_keputusan,
      versi = versi + 1,
      review_trail_id = v_trail,
      direview_oleh = v_actor,
      direview_pada = v_reviewed_at,
      catatan_review = nullif(btrim(p_catatan), ''),
      updated_at = clock_timestamp()
  where paket_id = p_paket_id;
  return app_private.baca_konfirmasi_kalibrasi_tahap1(p_paket_id);
end;
$function$;

create or replace function app_private.assert_stage1_pic_confirmation_current(p_paket_id integer)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_state public.stage1_pic_konfirmasi;
begin
  perform 1 from public.paket_kontrak p where p.paket_id = p_paket_id for update;
  if not found then raise exception 'Paket tidak ditemukan' using errcode = 'P0002'; end if;
  select * into v_state
  from public.stage1_pic_konfirmasi c
  where c.paket_id = p_paket_id;
  if not found or v_state.status <> 'DISETUJUI'
     or v_state.snapshot_pengajuan <> app_private.snapshot_stage1_calibration(p_paket_id) then
    raise exception 'Tahap 2 terkunci: konfirmasi PIC belum berlaku untuk rekod Stage 1 terkini'
      using errcode = '55000';
  end if;
end;
$function$;

create or replace function app_private.guard_stage2_pic_confirmation()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_paket_id integer;
  v_uji_coba_id integer;
  v_seksi_id integer;
begin
  if tg_table_name = 'uji_coba' then
    if tg_op <> 'INSERT' then perform app_private.assert_stage1_pic_confirmation_current(old.paket_id); end if;
    if tg_op <> 'DELETE' then perform app_private.assert_stage1_pic_confirmation_current(new.paket_id); end if;
  elsif tg_table_name = 'uji_coba_seksi' then
    if tg_op <> 'INSERT' then
      select u.paket_id into v_paket_id from public.uji_coba u where u.uji_coba_id = old.uji_coba_id;
      perform app_private.assert_stage1_pic_confirmation_current(v_paket_id);
    end if;
    if tg_op <> 'DELETE' then
      select u.paket_id into v_paket_id from public.uji_coba u where u.uji_coba_id = new.uji_coba_id;
      perform app_private.assert_stage1_pic_confirmation_current(v_paket_id);
    end if;
  elsif tg_table_name = 'uji_coba_pengukuran' then
    if tg_op <> 'INSERT' then
      select u.paket_id into v_paket_id
      from public.uji_coba_seksi s join public.uji_coba u using (uji_coba_id)
      where s.seksi_id = old.seksi_id;
      perform app_private.assert_stage1_pic_confirmation_current(v_paket_id);
    end if;
    if tg_op <> 'DELETE' then
      select u.paket_id into v_paket_id
      from public.uji_coba_seksi s join public.uji_coba u using (uji_coba_id)
      where s.seksi_id = new.seksi_id;
      perform app_private.assert_stage1_pic_confirmation_current(v_paket_id);
    end if;
  elsif tg_table_name = 'hasil_parameter' then
    if tg_op <> 'INSERT' and old.konteks = 'UJI_COBA' then
      select u.paket_id into v_paket_id
      from public.uji_coba u where u.uji_coba_id = old.konteks_id;
      perform app_private.assert_stage1_pic_confirmation_current(v_paket_id);
    end if;
    if tg_op <> 'DELETE' and new.konteks = 'UJI_COBA' then
      select u.paket_id into v_paket_id
      from public.uji_coba u where u.uji_coba_id = new.konteks_id;
      perform app_private.assert_stage1_pic_confirmation_current(v_paket_id);
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

create trigger stage1_confirmation_gate_uji_coba
before insert or update or delete on public.uji_coba
for each row execute function app_private.guard_stage2_pic_confirmation();
create trigger stage1_confirmation_gate_uji_coba_seksi
before insert or update or delete on public.uji_coba_seksi
for each row execute function app_private.guard_stage2_pic_confirmation();
create trigger stage1_confirmation_gate_uji_coba_pengukuran
before insert or update or delete on public.uji_coba_pengukuran
for each row execute function app_private.guard_stage2_pic_confirmation();
create trigger stage1_confirmation_gate_hasil_parameter
before insert or update or delete on public.hasil_parameter
for each row execute function app_private.guard_stage2_pic_confirmation();

create or replace function public.baca_konfirmasi_kalibrasi_tahap1(p_paket_id integer)
returns jsonb language sql security invoker set search_path to ''
as $function$ select app_private.baca_konfirmasi_kalibrasi_tahap1(p_paket_id); $function$;
create or replace function public.ajukan_konfirmasi_kalibrasi_tahap1(p_paket_id integer, p_expected_version integer)
returns jsonb language sql security invoker set search_path to ''
as $function$ select app_private.ajukan_konfirmasi_kalibrasi_tahap1(p_paket_id, p_expected_version); $function$;
create or replace function public.review_konfirmasi_kalibrasi_tahap1(p_paket_id integer, p_expected_version integer, p_keputusan text, p_catatan text)
returns jsonb language sql security invoker set search_path to ''
as $function$ select app_private.review_konfirmasi_kalibrasi_tahap1(p_paket_id, p_expected_version, p_keputusan, p_catatan); $function$;

revoke all on function app_private.assert_stage1_confirmation_access(integer, text) from public, anon, authenticated;
revoke all on function app_private.snapshot_stage1_calibration(integer) from public, anon, authenticated;
revoke all on function app_private.baca_konfirmasi_kalibrasi_tahap1(integer) from public, anon, authenticated;
revoke all on function app_private.ajukan_konfirmasi_kalibrasi_tahap1(integer, integer) from public, anon, authenticated;
revoke all on function app_private.review_konfirmasi_kalibrasi_tahap1(integer, integer, text, text) from public, anon, authenticated;
revoke all on function app_private.assert_stage1_pic_confirmation_current(integer) from public, anon, authenticated;
revoke all on function app_private.guard_stage2_pic_confirmation() from public, anon, authenticated;
revoke all on function public.baca_konfirmasi_kalibrasi_tahap1(integer) from public, anon;
revoke all on function public.ajukan_konfirmasi_kalibrasi_tahap1(integer, integer) from public, anon;
revoke all on function public.review_konfirmasi_kalibrasi_tahap1(integer, integer, text, text) from public, anon;
grant execute on function app_private.baca_konfirmasi_kalibrasi_tahap1(integer) to authenticated;
grant execute on function app_private.ajukan_konfirmasi_kalibrasi_tahap1(integer, integer) to authenticated;
grant execute on function app_private.review_konfirmasi_kalibrasi_tahap1(integer, integer, text, text) to authenticated;
grant execute on function public.baca_konfirmasi_kalibrasi_tahap1(integer) to authenticated;
grant execute on function public.ajukan_konfirmasi_kalibrasi_tahap1(integer, integer) to authenticated;
grant execute on function public.review_konfirmasi_kalibrasi_tahap1(integer, integer, text, text) to authenticated;

commit;
