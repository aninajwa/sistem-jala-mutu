begin;

alter table public.uji_coba
  alter column status set default 'DRAFT';

update public.uji_coba
set status = 'DRAFT'
where status is null;

alter table public.uji_coba
  alter column status set not null;

alter table public.uji_coba
  add column if not exists versi integer not null default 0,
  add column if not exists pengajuan_trail_id bigint,
  add column if not exists snapshot_pengajuan jsonb,
  add column if not exists diajukan_oleh integer,
  add column if not exists diajukan_pada timestamptz,
  add column if not exists direview_oleh integer,
  add column if not exists direview_pada timestamptz,
  add column if not exists catatan_review text;

do $block$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.uji_coba'::regclass
      and conname = 'uji_coba_status_workflow_check'
  ) then
    alter table public.uji_coba
      add constraint uji_coba_status_workflow_check
      check (status in ('DRAFT', 'DIAJUKAN', 'PERLU_REVISI', 'DISETUJUI'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.uji_coba'::regclass
      and conname = 'uji_coba_versi_check'
  ) then
    alter table public.uji_coba
      add constraint uji_coba_versi_check
      check (versi between 0 and 2147483647);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.uji_coba'::regclass
      and conname = 'uji_coba_pengajuan_trail_id_fkey'
  ) then
    alter table public.uji_coba
      add constraint uji_coba_pengajuan_trail_id_fkey
      foreign key (pengajuan_trail_id) references public.audit_trail(trail_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.uji_coba'::regclass
      and conname = 'uji_coba_diajukan_oleh_fkey'
  ) then
    alter table public.uji_coba
      add constraint uji_coba_diajukan_oleh_fkey
      foreign key (diajukan_oleh) references public.pengguna(pengguna_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.uji_coba'::regclass
      and conname = 'uji_coba_direview_oleh_fkey'
  ) then
    alter table public.uji_coba
      add constraint uji_coba_direview_oleh_fkey
      foreign key (direview_oleh) references public.pengguna(pengguna_id);
  end if;
end
$block$;

create index if not exists idx_uji_coba_pengajuan_trail
  on public.uji_coba(pengajuan_trail_id)
  where pengajuan_trail_id is not null;

create index if not exists idx_uji_coba_diajukan_oleh
  on public.uji_coba(diajukan_oleh)
  where diajukan_oleh is not null;

create index if not exists idx_uji_coba_direview_oleh
  on public.uji_coba(direview_oleh)
  where direview_oleh is not null;

create or replace function app_private.baca_pengajuan_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_uji public.uji_coba;
  v_review jsonb;
begin
  perform app_private.ambil_detail_uji_coba(p_paket_id, p_uji_coba_id);

  select * into v_uji
  from public.uji_coba
  where paket_id = p_paket_id
    and uji_coba_id = p_uji_coba_id;

  if v_uji.uji_coba_id is null then
    raise exception 'Uji coba tidak ditemukan'
      using errcode = 'P0002';
  end if;

  if v_uji.direview_oleh is not null then
    v_review := jsonb_build_object(
      'pengguna_id', v_uji.direview_oleh,
      'keputusan', v_uji.status,
      'catatan', v_uji.catatan_review,
      'waktu', v_uji.direview_pada
    );
  end if;

  return jsonb_build_object(
    'paket_id', v_uji.paket_id,
    'uji_coba_id', v_uji.uji_coba_id,
    'status', v_uji.status,
    'versi', v_uji.versi,
    'pengajuan', case
      when v_uji.pengajuan_trail_id is null then null
      else jsonb_build_object(
        'pengajuan_id', v_uji.pengajuan_trail_id,
        'diajukan_oleh', v_uji.diajukan_oleh,
        'diajukan_pada', v_uji.diajukan_pada,
        'snapshot', v_uji.snapshot_pengajuan
      )
    end,
    'review', v_review,
    'aturan', jsonb_build_object(
      'mode', 'SEMAKAN_MANUAL_PIC',
      'validasi_ambang_otomatis_aktif', false,
      'revisi_membuat_percobaan_baru', true
    )
  );
end;
$function$;

create or replace function app_private.ajukan_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor integer;
  v_uji public.uji_coba;
  v_detail jsonb;
  v_snapshot jsonb;
  v_submitted_at timestamptz;
  v_trail bigint;
begin
  v_actor := app_private.assert_tahap_kalibrasi(p_paket_id);

  if p_expected_version is null
     or p_expected_version not between 0 and 2147483646 then
    raise exception 'Versi tidak valid' using errcode = '22023';
  end if;

  select * into v_uji
  from public.uji_coba
  where paket_id = p_paket_id
    and uji_coba_id = p_uji_coba_id
  for update;

  if not found then
    raise exception 'Uji coba tidak ditemukan' using errcode = 'P0002';
  end if;

  if v_uji.status <> 'DRAFT' then
    raise exception 'Hanya uji coba DRAFT boleh diajukan' using errcode = '55000';
  end if;

  if v_uji.versi <> p_expected_version then
    raise exception 'Uji coba telah berubah. Baca semula sebelum mengajukan'
      using errcode = '40001';
  end if;

  if not exists (
    select 1
    from public.uji_coba_seksi s
    where s.uji_coba_id = v_uji.uji_coba_id
  ) or not exists (
    select 1
    from public.uji_coba_seksi s
    join public.uji_coba_pengukuran p using (seksi_id)
    where s.uji_coba_id = v_uji.uji_coba_id
  ) then
    raise exception 'Tambah sekurang-kurangnya satu seksi dan satu pengukuran sebelum mengajukan'
      using errcode = '22023';
  end if;

  v_detail := app_private.ambil_detail_uji_coba(p_paket_id, p_uji_coba_id);
  v_submitted_at := clock_timestamp();
  v_snapshot := jsonb_build_object(
    'detail', jsonb_set(
      jsonb_set(v_detail, '{uji_coba,status}', '"DIAJUKAN"'::jsonb),
      '{uji_coba,versi}', to_jsonb(v_uji.versi + 1)
    ),
    'versi_saat_dikirim', v_uji.versi + 1,
    'diajukan_oleh', v_actor,
    'diajukan_pada', v_submitted_at,
    'mode', 'SEMAKAN_MANUAL_PIC',
    'validasi_ambang_otomatis_aktif', false
  );

  insert into public.audit_trail(
    pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu
  ) values (
    v_actor,
    'uji_coba',
    v_uji.uji_coba_id::text,
    'SUBMIT_UJI_COBA',
    jsonb_build_object('status', v_uji.status, 'versi', v_uji.versi),
    v_snapshot,
    localtimestamp
  ) returning trail_id into v_trail;

  update public.uji_coba
  set status = 'DIAJUKAN',
      versi = versi + 1,
      pengajuan_trail_id = v_trail,
      snapshot_pengajuan = v_snapshot,
      diajukan_oleh = v_actor,
      diajukan_pada = v_submitted_at,
      direview_oleh = null,
      direview_pada = null,
      catatan_review = null
  where uji_coba_id = v_uji.uji_coba_id;

  return app_private.baca_pengajuan_uji_coba(p_paket_id, p_uji_coba_id);
end;
$function$;

create or replace function app_private.review_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer,
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
  v_uji public.uji_coba;
  v_before jsonb;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;

  select u.pengguna_id into v_actor
  from public.pengguna u
  join public.pengguna_peran pp using (pengguna_id)
  join public.peran r using (peran_id)
  join public.paket_kontrak pk on pk.paket_id = p_paket_id
  where u.auth_user_id = auth.uid()
    and not coalesce(u.terkunci, false)
    and r.nama = 'pic_balai'
    and pp.scope_balai_id = pk.balai_id
    and (pp.scope_paket_id is null or pp.scope_paket_id = pk.paket_id)
  limit 1;

  if v_actor is null then
    raise exception 'Hanya PIC Balai yang ditugaskan boleh menyemak uji coba'
      using errcode = '42501';
  end if;

  perform 1
  from public.paket_kontrak
  where paket_id = p_paket_id
    and status = 'DRAFT'
  for update;

  if not found then
    raise exception 'Paket bukan berstatus DRAFT' using errcode = '55000';
  end if;

  if p_expected_version is null
     or p_expected_version not between 0 and 2147483646
     or p_keputusan is null
     or p_keputusan not in ('PERLU_REVISI', 'DISETUJUI')
     or p_catatan is null
     or length(p_catatan) > 2000
     or (p_keputusan = 'PERLU_REVISI' and length(btrim(p_catatan)) = 0) then
    raise exception 'Keputusan atau catatan tidak valid; revisi memerlukan catatan'
      using errcode = '22023';
  end if;

  select * into v_uji
  from public.uji_coba
  where paket_id = p_paket_id
    and uji_coba_id = p_uji_coba_id
  for update;

  if not found
     or v_uji.status <> 'DIAJUKAN'
     or v_uji.snapshot_pengajuan is null
     or v_uji.pengajuan_trail_id is null then
    raise exception 'Uji coba belum diajukan atau sudah diputuskan'
      using errcode = '55000';
  end if;

  if v_uji.diajukan_oleh = v_actor then
    raise exception 'Pengirim tidak boleh menyemak pengajuannya sendiri'
      using errcode = '42501';
  end if;

  if v_uji.versi <> p_expected_version then
    raise exception 'Uji coba telah berubah. Baca semula sebelum menyemak'
      using errcode = '40001';
  end if;

  v_before := app_private.baca_pengajuan_uji_coba(p_paket_id, p_uji_coba_id);

  update public.uji_coba
  set status = p_keputusan,
      versi = versi + 1,
      direview_oleh = v_actor,
      direview_pada = clock_timestamp(),
      catatan_review = nullif(btrim(p_catatan), '')
  where uji_coba_id = v_uji.uji_coba_id;

  v_result := app_private.baca_pengajuan_uji_coba(p_paket_id, p_uji_coba_id);

  insert into public.audit_trail(
    pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, waktu
  ) values (
    v_actor,
    'uji_coba',
    v_uji.uji_coba_id::text,
    'REVIEW_UJI_COBA',
    v_before,
    v_result,
    localtimestamp
  );

  return v_result;
end;
$function$;

create or replace function public.baca_pengajuan_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer
)
returns jsonb
language sql
stable
set search_path to ''
as $function$
  select app_private.baca_pengajuan_uji_coba(p_paket_id, p_uji_coba_id);
$function$;

create or replace function public.ajukan_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer,
  p_expected_version integer
)
returns jsonb
language sql
set search_path to ''
as $function$
  select app_private.ajukan_uji_coba(
    p_paket_id,
    p_uji_coba_id,
    p_expected_version
  );
$function$;

create or replace function public.review_uji_coba(
  p_paket_id integer,
  p_uji_coba_id integer,
  p_expected_version integer,
  p_keputusan text,
  p_catatan text
)
returns jsonb
language sql
set search_path to ''
as $function$
  select app_private.review_uji_coba(
    p_paket_id,
    p_uji_coba_id,
    p_expected_version,
    p_keputusan,
    p_catatan
  );
$function$;

revoke all on function app_private.baca_pengajuan_uji_coba(integer, integer) from public, anon;
revoke all on function app_private.ajukan_uji_coba(integer, integer, integer) from public, anon;
revoke all on function app_private.review_uji_coba(integer, integer, integer, text, text) from public, anon;
grant execute on function app_private.baca_pengajuan_uji_coba(integer, integer) to authenticated;
grant execute on function app_private.ajukan_uji_coba(integer, integer, integer) to authenticated;
grant execute on function app_private.review_uji_coba(integer, integer, integer, text, text) to authenticated;

revoke all on function public.baca_pengajuan_uji_coba(integer, integer) from public, anon;
revoke all on function public.ajukan_uji_coba(integer, integer, integer) from public, anon;
revoke all on function public.review_uji_coba(integer, integer, integer, text, text) from public, anon;
grant execute on function public.baca_pengajuan_uji_coba(integer, integer) to authenticated, service_role;
grant execute on function public.ajukan_uji_coba(integer, integer, integer) to authenticated, service_role;
grant execute on function public.review_uji_coba(integer, integer, integer, text, text) to authenticated, service_role;

commit;
