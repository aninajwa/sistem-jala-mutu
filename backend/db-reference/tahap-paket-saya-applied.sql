-- Current stage of every package the caller may read, in ONE call (dashboard + package list).
-- Before this the dashboard derived the stage from Dirah's local demo state, which is empty for
-- server packages, so every package showed "Tahap 0" even when it was finished.
-- The active stage is the first stage not yet complete, using the same server facts as the rail:
--   Tahap 0  checklist JM-PERSIAPAN-TAHAP0 DISETUJUI
--   Tahap 1  stage1_pic_konfirmasi DISETUJUI
--   Tahap 2  every contracted survey type has an approved uji_coba
--   Tahap 3A at least one survey session          Tahap 3B at least one DITERIMA verval cycle, none open
--   Tahap 4  tahap4_pengajuan DISETUJUI           Tahap 5  audit level 3 Lulus
--   Tahap 6  final acceptance recorded -> "Selesai"

create or replace function public.baca_tahap_paket_saya()
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare v_user integer;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select pengguna_id into v_user from public.pengguna where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if v_user is null then raise exception 'Profil tidak berwenang' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('paket_id', x.paket_id, 'status_paket', x.status, 'tahap', x.tahap, 'keterangan', x.keterangan) order by x.paket_id)
    from (
      select p.paket_id, p.status,
        case
          when f.akhir then 'Selesai'
          when not f.t0 then 'Tahap 0' when not f.t1 then 'Tahap 1' when not f.t2 then 'Tahap 2'
          when not f.t3a then 'Tahap 3A' when not f.t3b and not f.t4 then 'Tahap 3B'
          when not f.t4 then 'Tahap 4' when not f.t5 then 'Tahap 5' else 'Tahap 6' end as tahap,
        case
          when f.akhir then 'Penerimaan akhir tercatat'
          when not f.t0 then 'Persiapan & SPMK' when not f.t1 then 'Kalibrasi & personel' when not f.t2 then 'Validasi produksi'
          when not f.t3a then 'Survei harian' when not f.t3b and not f.t4 then 'Verval 14 hari'
          when not f.t4 then 'Gerbang RNI/LRS' when not f.t5 then 'Audit tingkat 1–3' else 'Penerimaan & termin' end as keterangan
      from public.paket_kontrak p
      cross join lateral (select
        exists (select 1 from public.checklist_pengisian c join public.checklist_template t using (template_id)
          where c.paket_id = p.paket_id and t.no_dokumen = 'JM-PERSIAPAN-TAHAP0' and c.status = 'DISETUJUI') as t0,
        exists (select 1 from public.stage1_pic_konfirmasi k where k.paket_id = p.paket_id and k.status = 'DISETUJUI') as t1,
        exists (select 1 from public.paket_survei_kontrak ps where ps.paket_id = p.paket_id)
          and not exists (select 1 from public.paket_survei_kontrak ps where ps.paket_id = p.paket_id
            and not exists (select 1 from public.uji_coba u where u.paket_id = p.paket_id and u.jenis_survei_id = ps.jenis_survei_id and u.status = 'DISETUJUI')) as t2,
        exists (select 1 from public.sesi_survei s where s.paket_id = p.paket_id) as t3a,
        exists (select 1 from public.siklus_verval v where v.paket_id = p.paket_id and v.status = 'DITERIMA')
          and not exists (select 1 from public.siklus_verval v where v.paket_id = p.paket_id and v.status <> 'DITERIMA') as t3b,
        exists (select 1 from public.tahap4_pengajuan w where w.paket_id = p.paket_id and w.status = 'DISETUJUI') as t4,
        exists (select 1 from public.audit a where a.paket_id = p.paket_id and a.tingkat = 3 and a.jenis_survei_id is null and a.status = 'Lulus') as t5,
        exists (select 1 from public.penerimaan_data pd where pd.paket_id = p.paket_id and pd.jenis = 'AKHIR') as akhir
      ) f
      where exists (
        select 1 from public.pengguna_peran pp join public.peran r on r.peran_id = pp.peran_id
        where pp.pengguna_id = v_user and (
          (r.nama = 'penyedia_jasa' and p.created_by = v_user) or r.nama in ('direktorat', 'admin')
          or (r.nama = 'pic_balai' and pp.scope_balai_id = p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id = p.paket_id))))
    ) x), '[]'::jsonb);
end;
$function$;

revoke all on function public.baca_tahap_paket_saya() from public, anon;
grant execute on function public.baca_tahap_paket_saya() to authenticated;
