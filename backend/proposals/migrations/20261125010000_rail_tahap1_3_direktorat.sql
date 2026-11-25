-- Stage rail for Tahap 1, 3A and 3B (2026-11-25, rules approved by the project owner).
-- 1. Direktorat and Admin may READ the Tahap 1 PIC confirmation (submit/review stay Penyedia/PIC only).
--    Before this, the read raised 42501 for Direktorat, so its package header showed an error.
-- 2. baca_progres_tahap_akhir also returns the survey session and verval cycle counts.
--    Rule: 3A/3B are complete once Tahap 4 is DISETUJUI ("periode survei selesai", flowchart 03);
--    before that they are in progress when sessions / cycles exist.

create or replace function app_private.assert_stage1_confirmation_access(p_paket_id integer, p_action text)
returns integer language plpgsql security definer set search_path = ''
as $function$
declare v_actor integer; v_package public.paket_kontrak; v_provider boolean; v_pic boolean; v_reader boolean;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select u.pengguna_id into v_actor from public.pengguna u where u.auth_user_id = auth.uid() and not coalesce(u.terkunci, false);
  if v_actor is null then raise exception 'Identitas aktif diperlukan' using errcode = '42501'; end if;
  select * into v_package from public.paket_kontrak p where p.paket_id = p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002'; end if;
  select
    exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = v_actor and r.nama = 'penyedia_jasa' and v_package.created_by = v_actor
        and (pp.scope_paket_id is null or pp.scope_paket_id = p_paket_id)
        and (pp.scope_balai_id is null or pp.scope_balai_id = v_package.balai_id)),
    exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = v_actor and r.nama = 'pic_balai' and pp.scope_balai_id = v_package.balai_id
        and (pp.scope_paket_id is null or pp.scope_paket_id = p_paket_id)),
    exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = v_actor and r.nama in ('direktorat', 'admin'))
  into v_provider, v_pic, v_reader;
  if (p_action = 'provider' and not v_provider) or (p_action = 'pic' and not v_pic)
     or (p_action = 'read' and not (v_provider or v_pic or v_reader)) then
    raise exception 'Akses konfirmasi kalibrasi untuk paket/Balai ini ditolak' using errcode = '42501';
  end if;
  if p_action not in ('provider', 'pic', 'read') then raise exception 'Aksi konfirmasi tidak valid' using errcode = '22023'; end if;
  return v_actor;
end;
$function$;

create or replace function public.baca_progres_tahap_akhir(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
begin
  perform app_private.tahap_akses_baca(p_paket_id);
  return jsonb_build_object(
    'paket_id', p_paket_id,
    'status_paket', (select status from public.paket_kontrak where paket_id = p_paket_id),
    'jumlah_sesi_survei', (select count(*) from public.sesi_survei s where s.paket_id = p_paket_id),
    'jumlah_siklus_verval', (select count(*) from public.siklus_verval v where v.paket_id = p_paket_id),
    'tahap4', coalesce((select status from public.tahap4_pengajuan where paket_id = p_paket_id), 'DRAFT'),
    'audit', coalesce((select jsonb_object_agg(a.tingkat::text, a.status) from public.audit a
      where a.paket_id = p_paket_id and a.jenis_survei_id is null), '{}'::jsonb),
    'koreksi_audit_terbuka', (select count(*) from public.kasus_temuan k where k.paket_id = p_paket_id
      and k.tahap_tertahan like 'Audit tingkat %' and k.status <> 'Ditutup'),
    'termin_selesai', (select count(*) from public.termin t where t.paket_id = p_paket_id and t.status = 'Selesai'),
    'termin_total', 4,
    'penerimaan_akhir', exists (select 1 from public.penerimaan_data pd where pd.paket_id = p_paket_id and pd.jenis = 'AKHIR'));
end;
$function$;
