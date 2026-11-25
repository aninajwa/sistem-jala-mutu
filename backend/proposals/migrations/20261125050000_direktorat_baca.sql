-- Direktorat (and Admin) read access + audit facts for the Direktorat "Audit Tingkat 3" page (2026-11-25).
-- 1. assert_survei_read / assert_validasi_lrs_access(read): also allow direktorat and admin.
--    Both are used only by read RPCs (sesi survei, data segmen, siklus verval, validasi LRS);
--    writes keep their own Penyedia/PIC checks. Before this Direktorat got 404 on Tahap 3A/3B/4 pages.
-- 2. baca_tahap_paket_saya also returns per-package audit status, Tahap 4 status and the
--    level-3 rejection reason, open corrections and survey session count (dashboard KPIs),
--    so the Direktorat queue and the dashboard need no per-package calls.

create or replace function app_private.assert_survei_read(p_paket_id integer)
returns void language plpgsql security definer set search_path = ''
as $function$
declare v_user public.pengguna; v_package public.paket_kontrak;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select * into v_user from public.pengguna where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if not found then raise exception 'Profil tidak berwenang' using errcode = '42501'; end if;
  select * into v_package from public.paket_kontrak where paket_id = p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan' using errcode = 'P0002'; end if;
  if not (
    (v_package.created_by = v_user.pengguna_id and exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = v_user.pengguna_id and r.nama = 'penyedia_jasa'))
    or exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = v_user.pengguna_id and r.nama = 'pic_balai' and pp.scope_balai_id = v_package.balai_id
        and (pp.scope_paket_id is null or pp.scope_paket_id = p_paket_id))
    or exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = v_user.pengguna_id and r.nama in ('direktorat', 'admin'))
  ) then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002'; end if;
end;
$function$;

create or replace function app_private.assert_validasi_lrs_access(p_paket_id integer, p_write boolean)
returns integer language plpgsql security definer set search_path = ''
as $function$
declare u public.pengguna; p public.paket_kontrak;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select * into u from public.pengguna where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if not found then raise exception 'Profil tidak berwenang' using errcode = '42501'; end if;
  select * into p from public.paket_kontrak where paket_id = p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002'; end if;
  if p_write then
    if p.created_by is distinct from u.pengguna_id or not exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
        where pp.pengguna_id = u.pengguna_id and r.nama = 'penyedia_jasa') then
      raise exception 'Hanya Penyedia Jasa pemilik paket boleh menyimpan validasi LRS' using errcode = '42501';
    end if;
  elsif not (
    (p.created_by = u.pengguna_id and exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = u.pengguna_id and r.nama = 'penyedia_jasa'))
    or exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = u.pengguna_id and r.nama = 'pic_balai' and pp.scope_balai_id = p.balai_id
        and (pp.scope_paket_id is null or pp.scope_paket_id = p_paket_id))
    or exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = u.pengguna_id and r.nama in ('direktorat', 'admin'))
  ) then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002'; end if;
  return u.pengguna_id;
end;
$function$;

create or replace function public.baca_tahap_paket_saya()
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare v_user integer;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select pengguna_id into v_user from public.pengguna where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if v_user is null then raise exception 'Profil tidak berwenang' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('paket_id', x.paket_id, 'status_paket', x.status, 'tahap', x.tahap, 'keterangan', x.keterangan,
      'tahap4', x.tahap4, 'audit', x.audit, 'alasan_audit3', x.alasan_audit3, 'koreksi_terbuka', x.koreksi_terbuka, 'jumlah_sesi', x.jumlah_sesi, 'sesi', x.sesi) order by x.paket_id)
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
          when not f.t4 then 'Gerbang RNI/LRS' when not f.t5 then 'Audit tingkat 1–3' else 'Penerimaan & termin' end as keterangan,
        coalesce((select w.status from public.tahap4_pengajuan w where w.paket_id = p.paket_id), 'DRAFT') as tahap4,
        coalesce((select jsonb_object_agg(a.tingkat::text, a.status) from public.audit a where a.paket_id = p.paket_id and a.jenis_survei_id is null), '{}'::jsonb) as audit,
        (select a.alasan_penolakan from public.audit a where a.paket_id = p.paket_id and a.tingkat = 3 and a.jenis_survei_id is null) as alasan_audit3,
        (select count(*) from public.kasus_temuan k where k.paket_id = p.paket_id and k.status <> 'Ditutup') as koreksi_terbuka,
        (select count(*) from public.sesi_survei s where s.paket_id = p.paket_id) as jumlah_sesi,
        coalesce((select jsonb_agg(jsonb_build_object('sesi_id', s.sesi_id, 'tanggal', s.tanggal, 'jam_mulai', s.jam_mulai, 'jenis_kode', j.kode,
          'ruas', coalesce(r.nomor_ruas || ' ', '') || coalesce(r.nama_ruas, ''), 'panjang_km', s.panjang_tercapai_km, 'lajur', s.lajur, 'arah', s.arah, 'cuaca', s.cuaca) order by s.tanggal desc)
          from public.sesi_survei s left join public.tim_survei t on t.tim_id = s.tim_id left join public.jenis_survei j on j.jenis_survei_id = t.jenis_survei_id
          left join public.ruas_jalan r on r.ruas_id = s.ruas_id where s.paket_id = p.paket_id), '[]'::jsonb) as sesi
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

-- 3. Berita Acara of a package for the "Dokumen Mutu" page (all package roles incl. Direktorat).
--    Read-only; unlike baca_penerimaan it never creates termin rows.
create or replace function public.baca_berita_acara_paket(p_paket_id integer)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
begin
  perform app_private.tahap_akses_baca(p_paket_id);
  return coalesce((select jsonb_agg(jsonb_build_object('ba_id', b.ba_id, 'jenis', b.jenis, 'nomor', b.nomor, 'tanggal', b.tanggal,
      'sumber_tipe', b.sumber_tipe, 'sumber_id', b.sumber_id, 'status', b.status, 'dokumen_id', b.dokumen_id,
      'penandatangan', coalesce((select jsonb_agg(jsonb_build_object('jabatan', t.jabatan, 'waktu', t.waktu_ttd)) from public.penandatangan_ba t where t.ba_id = b.ba_id), '[]'::jsonb))
    order by b.tanggal desc, b.ba_id desc) from public.berita_acara b where b.paket_id = p_paket_id), '[]'::jsonb);
end;
$function$;
revoke all on function public.baca_berita_acara_paket(integer) from public, anon;
grant execute on function public.baca_berita_acara_paket(integer) to authenticated;
