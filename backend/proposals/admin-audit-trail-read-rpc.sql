-- LOCAL PROPOSAL ONLY. Do not apply without database-owner/security review.
-- `trail_id` is returned as decimal text: PostgreSQL bigint can exceed the exact
-- integer range of JavaScript Number, and PostgREST JSON numbers would lose precision.
-- `waktu` is timestamp without time zone. The API serializes it unchanged as a timezone-free local timestamp string; no UTC/browser timezone interpretation is implied.
-- The output contains only a small allowlist of event metadata/categories.
-- It never returns record_id, ip_address, auth IDs, nilai_lama, nilai_baru,
-- credentials, or raw JSON. Existing audit_trail RLS/grants are not altered.

begin;

-- Installation must run with the trusted postgres role because the definer
-- function is intentionally owned by postgres and reads through its privileges.
do $installer_check$
begin
  if current_user <> 'postgres' then
    raise exception 'Install this proposal as the trusted postgres role';
  end if;
end;
$installer_check$;

create or replace function public.admin_daftar_jejak_aktivitas(
  p_page integer,
  p_page_size integer,
  p_search text
)
returns table (
  trail_id text,
  waktu timestamp without time zone,
  pengguna_id integer,
  tabel text,
  aksi text,
  ringkasan text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_search text;
  v_pattern text;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.pengguna as caller
    join public.pengguna_peran as assignment
      on assignment.pengguna_id = caller.pengguna_id
    join public.peran as role_catalog
      on role_catalog.peran_id = assignment.peran_id
    where caller.auth_user_id = auth.uid()
      and not coalesce(caller.terkunci, false)
      and role_catalog.nama = 'admin'
  ) then
    raise exception 'Hanya Admin aktif boleh membaca jejak aktivitas'
      using errcode = '42501';
  end if;

  if p_page is null or p_page < 1 or p_page > 1000000
     or p_page_size is null or p_page_size < 1 or p_page_size > 100 then
    raise exception 'Parameter halaman tidak valid' using errcode = '22023';
  end if;
  if (p_page::bigint - 1) * p_page_size::bigint > 2147483647 then
    raise exception 'Offset halaman tidak valid' using errcode = '22023';
  end if;

  v_search := nullif(btrim(p_search), '');
  if length(v_search) > 100 then
    raise exception 'Pencarian tidak valid' using errcode = '22023';
  end if;
  if v_search is not null then
    v_pattern := '%' || replace(replace(replace(v_search, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%';
  end if;

  return query
    with safe_events as (
      select
        event.trail_id::bigint as trail_id,
        event.waktu as waktu,
        event.pengguna_id::integer as pengguna_id,
        case event.tabel::text
          when 'pengguna' then 'Pengguna'
          when 'pengguna_peran' then 'Penugasan peran'
          when 'paket_kontrak' then 'Paket kontrak'
          when 'penyedia_jasa' then 'Penyedia jasa'
          when 'tim_survei' then 'Tim survei'
          when 'alat_survei' then 'Alat survei'
          when 'penugasan_alat' then 'Penugasan alat'
          when 'kalibrasi_alat' then 'Kalibrasi alat'
          when 'personel' then 'Personel'
          when 'anggota_tim' then 'Keanggotaan tim'
          when 'kualifikasi_personel' then 'Kualifikasi personel'
          when 'checklist_pengisian' then 'Checklist persiapan'
          when 'dokumen' then 'Dokumen'
          when 'dokumen_versi' then 'Versi dokumen'
          else 'Data aplikasi lain'
        end as tabel,
        case event.aksi::text
          when 'CREATE_PROVIDER' then 'Buat penyedia'
          when 'LINK_PROVIDER' then 'Tautkan penyedia'
          when 'CREATE_SURVEY_TEAM' then 'Buat tim survei'
          when 'CREATE_EQUIPMENT' then 'Buat alat survei'
          when 'ASSIGN_EQUIPMENT' then 'Tugaskan alat survei'
          when 'CREATE_CALIBRATION_DRAFT' then 'Buat draf kalibrasi'
          when 'UPDATE_CALIBRATION_DRAFT' then 'Ubah draf kalibrasi'
          when 'UPLOAD_CALIBRATION_CERTIFICATE' then 'Unggah sertifikat kalibrasi'
          when 'CREATE_PERSONNEL' then 'Buat data personel'
          when 'ASSIGN_PERSONNEL' then 'Tugaskan personel'
          when 'CREATE_PERSONNEL_QUALIFICATION' then 'Buat kualifikasi personel'
          when 'SAVE_DRAFT' then 'Simpan draf checklist'
          when 'SUBMIT_PREPARATION' then 'Ajukan persiapan'
          when 'REVIEW_PREPARATION' then 'Tinjau persiapan'
          when 'LINK_EVIDENCE' then 'Tautkan bukti'
          when 'UNLINK_EVIDENCE' then 'Lepaskan bukti'
          when 'VERSION_EVIDENCE' then 'Versikan bukti'
          when 'UPLOAD_DOCUMENT' then 'Unggah dokumen'
          when 'UPLOAD_DOCUMENT_VERSION' then 'Unggah versi dokumen'
          when 'ASSIGN_ROLE' then 'Tetapkan peran'
          when 'CHANGE_ROLE_SCOPE' then 'Ubah cakupan peran'
          when 'REVOKE_ROLE' then 'Cabut peran'
          else 'Aktivitas lain'
        end as aksi
      from public.audit_trail as event
    )
    select
      safe_events.trail_id::text,
      safe_events.waktu,
      safe_events.pengguna_id,
      safe_events.tabel,
      safe_events.aksi,
      'Aktivitas ' || lower(safe_events.aksi) || ' pada ' || lower(safe_events.tabel)
    from safe_events
    where v_search is null
      or safe_events.pengguna_id::text ilike v_pattern escape E'\\'
      or safe_events.tabel ilike v_pattern escape E'\\'
      or safe_events.aksi ilike v_pattern escape E'\\'
    order by safe_events.waktu desc nulls last, safe_events.trail_id desc
    limit p_page_size
    offset ((p_page::bigint - 1) * p_page_size::bigint);
end;
$function$;

alter function public.admin_daftar_jejak_aktivitas(integer, integer, text) owner to postgres;
revoke all on function public.admin_daftar_jejak_aktivitas(integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.admin_daftar_jejak_aktivitas(integer, integer, text)
  to authenticated;

commit;
