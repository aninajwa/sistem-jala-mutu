-- Server notifications (2026-11-25): active tasks per role, derived from live workflow data in ONE call.
-- Nothing is stored; each row disappears as soon as the underlying task is done.
-- nada: action (must act), warning (due soon / sent back), danger (overdue / held), success (finished).
-- tautan: package workspace selection to open.

create or replace function public.baca_notifikasi_saya()
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare v_user integer; v_provider boolean; v_pic boolean; v_dir boolean;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select pengguna_id into v_user from public.pengguna where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if v_user is null then raise exception 'Profil tidak berwenang' using errcode = '42501'; end if;
  select bool_or(r.nama = 'penyedia_jasa'), bool_or(r.nama = 'pic_balai'), bool_or(r.nama = 'direktorat')
    into v_provider, v_pic, v_dir
  from public.pengguna_peran pp join public.peran r using (peran_id) where pp.pengguna_id = v_user;

  return coalesce((select jsonb_agg(n order by (n->>'urutan')::integer, n->>'tenggat' nulls last, (n->>'paket_id')::integer) from (
    with pk as (
      select p.*, (v_provider and p.created_by = v_user) as mine,
        (v_pic and exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id) where pp.pengguna_id = v_user
          and r.nama = 'pic_balai' and pp.scope_balai_id = p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id = p.paket_id))) as scoped
      from public.paket_kontrak p
    ),
    t as (
      -- Penyedia: sent back for revision
      select pk.paket_id, 'Persiapan perlu revisi' judul, 'PIC Balai meminta revisi checklist persiapan Tahap 0.' pesan, 'warning' nada, '/entry:Persiapan & SPMK' tautan, null::date tenggat, 2 urutan
        from pk join public.checklist_pengisian c on c.paket_id = pk.paket_id join public.checklist_template tp using (template_id)
        where pk.mine and tp.no_dokumen = 'JM-PERSIAPAN-TAHAP0' and c.status = 'PERLU_REVISI'
      union all select pk.paket_id, 'Konfirmasi kalibrasi perlu revisi', 'PIC Balai meminta koreksi pengajuan kalibrasi Tahap 1.', 'warning', '/documents:Kalibrasi & personel', null, 2
        from pk join public.stage1_pic_konfirmasi k on k.paket_id = pk.paket_id where pk.mine and k.status = 'PERLU_REVISI'
      union all select pk.paket_id, 'Uji coba produksi perlu revisi', 'PIC Balai meminta revisi uji coba Tahap 2.', 'warning', '/entry:Validasi produksi', null, 2
        from pk where pk.mine and exists (select 1 from public.uji_coba u where u.paket_id = pk.paket_id and u.status = 'PERLU_REVISI')
      union all select pk.paket_id, 'Tahap 4 perlu revisi', 'PIC Balai meminta revisi pengajuan Gerbang RNI/LRS.', 'warning', '/entry:Gerbang RNI/LRS', null, 2
        from pk join public.tahap4_pengajuan w on w.paket_id = pk.paket_id where pk.mine and w.status = 'PERLU_REVISI'
      union all select pk.paket_id,
          case when v.status = 'DITAHAN' then 'Data verval ditahan' when v.status = 'PERLU_PERBAIKAN' then 'Verval perlu perbaikan'
            when current_date > v.jatuh_tempo then 'Verval 14 hari terlambat' else 'Verval 14 hari berjalan' end,
          'Siklus ke-' || v.siklus_ke || ' (' || to_char(v.periode_mulai, 'DD Mon') || ' – ' || to_char(v.periode_selesai, 'DD Mon YYYY') || '): catat uji konsistensi dan ajukan BA Verval.',
          case when v.status = 'DITAHAN' or current_date > v.jatuh_tempo then 'danger' when v.status = 'PERLU_PERBAIKAN' or v.jatuh_tempo - current_date <= 7 then 'warning' else 'action' end,
          '/verification:Verval 14 hari', v.jatuh_tempo, 1
        from pk join public.siklus_verval v on v.paket_id = pk.paket_id where pk.mine and v.status in ('BERJALAN', 'DITAHAN', 'PERLU_PERBAIKAN')
      union all select pk.paket_id, 'Kasus koreksi perlu ditindaklanjuti', 'Kasus #' || k.kasus_id || ' (' || coalesce(k.tahap_tertahan, '-') || '): ' || left(coalesce(k.uraian, ''), 140),
          case when k.tenggat < current_date then 'danger' else 'action' end, '/actions:Koreksi berbukti', k.tenggat, 1
        from pk join public.kasus_temuan k on k.paket_id = pk.paket_id where pk.mine and k.status in ('Terbuka', 'Disetujui')
      union all select pk.paket_id, 'Audit tingkat 1 siap dikerjakan', 'Tahap 4 disetujui. Lengkapi checklist audit internal dan BA Audit Internal.', 'action', '/verification:Audit tingkat 1–3', null, 1
        from pk where pk.mine and exists (select 1 from public.tahap4_pengajuan w where w.paket_id = pk.paket_id and w.status = 'DISETUJUI')
          and not exists (select 1 from public.audit a where a.paket_id = pk.paket_id and a.tingkat = 1 and a.jenis_survei_id is null and a.status = 'Lulus')
      -- PIC Balai: waiting for review
      union all select pk.paket_id, 'Persiapan menunggu pemeriksaan', 'Penyedia mengajukan checklist persiapan Tahap 0.', 'action', '/entry:Persiapan & SPMK', null, 1
        from pk join public.checklist_pengisian c on c.paket_id = pk.paket_id join public.checklist_template tp using (template_id)
        where pk.scoped and tp.no_dokumen = 'JM-PERSIAPAN-TAHAP0' and c.status = 'DIAJUKAN'
      union all select pk.paket_id, 'Konfirmasi kalibrasi menunggu pemeriksaan', 'Penyedia mengajukan konfirmasi kalibrasi Tahap 1.', 'action', '/documents:Kalibrasi & personel', null, 1
        from pk join public.stage1_pic_konfirmasi k on k.paket_id = pk.paket_id where pk.scoped and k.status = 'DIAJUKAN'
      union all select pk.paket_id, 'Uji coba produksi menunggu pemeriksaan', 'Penyedia mengajukan uji coba Tahap 2.', 'action', '/entry:Validasi produksi', null, 1
        from pk where pk.scoped and exists (select 1 from public.uji_coba u where u.paket_id = pk.paket_id and u.status = 'DIAJUKAN')
      union all select pk.paket_id, 'BA Verval menunggu pemeriksaan', 'Siklus ke-' || v.siklus_ke || ' · BA ' || coalesce(v.nomor_ba, '-') || ' diajukan Penyedia.', 'action', '/verification:Verval 14 hari', v.jatuh_tempo, 1
        from pk join public.siklus_verval v on v.paket_id = pk.paket_id where pk.scoped and v.status = 'DIAJUKAN'
      union all select pk.paket_id, 'Tahap 4 menunggu persetujuan', 'Penyedia mengajukan Gerbang RNI/LRS dan upload VALID.', 'action', '/entry:Gerbang RNI/LRS', null, 1
        from pk join public.tahap4_pengajuan w on w.paket_id = pk.paket_id where pk.scoped and w.status = 'DIAJUKAN'
      union all select pk.paket_id, 'Koreksi menunggu keputusan', 'Kasus #' || k.kasus_id || ' (' || coalesce(k.tahap_tertahan, '-') || ') menunggu verifikasi/persetujuan Balai.', 'action', '/actions:Koreksi berbukti', k.tenggat, 1
        from pk join public.kasus_temuan k on k.paket_id = pk.paket_id where pk.scoped and k.status in ('Menunggu Persetujuan', 'Dilaksanakan', 'Verifikasi Ulang')
      union all select pk.paket_id, 'Audit tingkat 2 siap dikerjakan', 'Audit tingkat 1 Lulus. Lakukan penilaian ulang acak (maks. 5%).', 'action', '/verification:Audit tingkat 1–3', null, 1
        from pk where pk.scoped and exists (select 1 from public.audit a where a.paket_id = pk.paket_id and a.tingkat = 1 and a.jenis_survei_id is null and a.status = 'Lulus')
          and not exists (select 1 from public.audit a where a.paket_id = pk.paket_id and a.tingkat = 2 and a.jenis_survei_id is null and a.status = 'Lulus')
      union all select pk.paket_id, 'Penerimaan termin dapat dicatat', 'Termin T' || tm.nomor || ' (' || tm.persen_bobot || '%) siap dicatat BA Penerimaan.',
          case when tm.batas_waktu < current_date then 'warning' else 'action' end, '/reports:Penerimaan & termin', tm.batas_waktu, 1
        from pk join public.termin tm on tm.paket_id = pk.paket_id where pk.scoped and tm.status <> 'Selesai'
          and not exists (select 1 from public.termin x where x.paket_id = pk.paket_id and x.nomor < tm.nomor and x.status <> 'Selesai')
          and (tm.nomor < 3 or exists (select 1 from public.audit a where a.paket_id = pk.paket_id and a.tingkat = 3 and a.jenis_survei_id is null and a.status = 'Lulus'))
          and exists (select 1 from public.tahap4_pengajuan w where w.paket_id = pk.paket_id and w.status = 'DISETUJUI')
      -- Direktorat
      union all select pk.paket_id, 'Audit tingkat 3 siap dikerjakan', 'Audit tingkat 2 Lulus. Lakukan penilaian ulang acak min. 1%.', 'action', '/verification:Audit tingkat 1–3', null, 1
        from pk where v_dir and exists (select 1 from public.audit a where a.paket_id = pk.paket_id and a.tingkat = 2 and a.jenis_survei_id is null and a.status = 'Lulus')
          and not exists (select 1 from public.audit a where a.paket_id = pk.paket_id and a.tingkat = 3 and a.jenis_survei_id is null and a.status = 'Lulus')
      -- Everyone involved: finished packages
      union all select pk.paket_id, 'Paket selesai', 'Penerimaan akhir tercatat. Seluruh tahap 0–6 selesai.', 'success', '/reports:Penerimaan & termin', null, 9
        from pk where (pk.mine or pk.scoped or v_dir) and exists (select 1 from public.penerimaan_data pd where pd.paket_id = pk.paket_id and pd.jenis = 'AKHIR')
    )
    select jsonb_build_object('paket_id', t.paket_id, 'nama_paket', pk.nama_paket, 'judul', t.judul, 'pesan', t.pesan, 'nada', t.nada,
      'tautan', t.tautan, 'tenggat', t.tenggat, 'urutan', t.urutan) n
    from t join pk using (paket_id)
  ) q), '[]'::jsonb);
end;
$function$;

revoke all on function public.baca_notifikasi_saya() from public, anon;
grant execute on function public.baca_notifikasi_saya() to authenticated;
