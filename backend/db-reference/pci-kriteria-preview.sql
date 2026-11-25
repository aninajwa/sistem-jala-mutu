begin;

-- Tahap 2D hanya mendaftarkan kriteria PCI daripada KAK 2026 sebagai DRAFT.
-- Nilai belum diterima daripada SMD dan belum boleh meluluskan uji coba secara automatik.

create unique index if not exists uq_parameter_uji_jenis_kode
  on public.parameter_uji(jenis_survei_id, kode);

create unique index if not exists uq_ambang_batas_parameter_tahap_status
  on public.ambang_batas(jenis_survei_id, parameter_id, tahap, status);

create unique index if not exists uq_lingkup_uji_jenis_tahap
  on public.lingkup_uji_minimum(jenis_survei_id, tahap);

do $block$
declare
  v_pci_id integer;
  v_ref_id integer;
  v_parameter_id integer;
  v_item record;
begin
  select jenis_survei_id into v_pci_id
  from public.jenis_survei
  where kode = 'PCI' and aktif is true;

  if v_pci_id is null then
    raise exception 'Jenis survei PCI aktif tidak ditemukan' using errcode = 'P0002';
  end if;

  select referensi_kak_id into v_ref_id
  from public.referensi_kak
  where dokumen = 'Update_KAK_2026_Rev_7552(2).docx'
    and pasal = '11.2.6 Penerimaan PCI'
    and tahun_anggaran = 2026;

  if v_ref_id is null then
    select coalesce(max(referensi_kak_id), 0) + 1 into v_ref_id
    from public.referensi_kak;

    insert into public.referensi_kak(referensi_kak_id, dokumen, pasal, tahun_anggaran)
    values (v_ref_id, 'Update_KAK_2026_Rev_7552(2).docx', '11.2.6 Penerimaan PCI', 2026);
  end if;

  for v_item in
    select * from (values
      ('PCI_DEKAT_ACUAN_5', 'Segmen dengan selisih PCI maksimal 5 poin', '%',
       'Lebih dari 50% segmen evaluasi berada dalam selisih 5 poin dari ground truth.',
       '>', 50::numeric, null::numeric),
      ('PCI_MENYIMPANG_15', 'Segmen dengan selisih PCI minimal 15 poin', '%',
       'Tidak lebih dari 12% segmen evaluasi mempunyai selisih minimal 15 poin.',
       '<=', null::numeric, 12::numeric),
      ('PCI_STANDAR_DEVIASI', 'Standar deviasi lima pengujian', null,
       'Konsistensi lima pengujian pada seksi yang sama.',
       '<=', null::numeric, 8::numeric),
      ('PCI_MAP', 'Mean Average Precision model AI', null,
       'Metrik model AI; belum bersumber daripada SMD.',
       '>=', 0.9::numeric, null::numeric),
      ('PCI_F1_PRA_QA', 'F1-Score sebelum quality assurance', null,
       'Ambang teknologi AI sebelum perbaikan quality assurance.',
       '>=', 0.8::numeric, null::numeric),
      ('PCI_F1_PASCA_QA', 'F1-Score setelah quality assurance', null,
       'Ambang teknologi AI setelah perbaikan quality assurance.',
       '>=', 0.9::numeric, null::numeric)
    ) as x(kode, nama, satuan, keterangan, operator, nilai_min, nilai_max)
  loop
    select parameter_id into v_parameter_id
    from public.parameter_uji
    where jenis_survei_id = v_pci_id and kode = v_item.kode;

    if v_parameter_id is null then
      select coalesce(max(parameter_id), 0) + 1 into v_parameter_id
      from public.parameter_uji;

      insert into public.parameter_uji(
        parameter_id, jenis_survei_id, kode, nama, satuan, keterangan
      ) values (
        v_parameter_id, v_pci_id, v_item.kode, v_item.nama,
        v_item.satuan, v_item.keterangan
      );
    else
      update public.parameter_uji
      set nama = v_item.nama,
          satuan = v_item.satuan,
          keterangan = v_item.keterangan
      where parameter_id = v_parameter_id;
    end if;

    insert into public.ambang_batas(
      ambang_id, jenis_survei_id, parameter_id, referensi_kak_id,
      tahap, operator, nilai_min, nilai_max, berlaku_mulai, status
    ) values (
      (select coalesce(max(ambang_id), 0) + 1 from public.ambang_batas),
      v_pci_id, v_parameter_id, v_ref_id,
      'UJI_COBA', v_item.operator, v_item.nilai_min, v_item.nilai_max,
      null, 'DRAFT'
    )
    on conflict (jenis_survei_id, parameter_id, tahap, status) do update
    set referensi_kak_id = excluded.referensi_kak_id,
        operator = excluded.operator,
        nilai_min = excluded.nilai_min,
        nilai_max = excluded.nilai_max;
  end loop;

  insert into public.lingkup_uji_minimum(
    lingkup_id, jenis_survei_id, tahap, panjang_min_km,
    jumlah_lokasi_min, jumlah_ulangan, rater_berbeda, interval_hari
  ) values (
    (select coalesce(max(lingkup_id), 0) + 1 from public.lingkup_uji_minimum),
    v_pci_id, 'UJI_COBA', null, 6, 5, false, null
  )
  on conflict (jenis_survei_id, tahap) do update
  set panjang_min_km = excluded.panjang_min_km,
      jumlah_lokasi_min = excluded.jumlah_lokasi_min,
      jumlah_ulangan = excluded.jumlah_ulangan,
      rater_berbeda = excluded.rater_berbeda,
      interval_hari = excluded.interval_hari;
end;
$block$;

create or replace function app_private.baca_kriteria_uji_coba(
  p_paket_id integer,
  p_jenis_survei_id integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_actor integer;
  v_jenis public.jenis_survei;
  v_parameter jsonb;
  v_lingkup jsonb;
begin
  select u.pengguna_id into v_actor
  from public.pengguna u
  where u.auth_user_id = auth.uid()
    and not coalesce(u.terkunci, false);

  if v_actor is null then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.paket_kontrak pk
    where pk.paket_id = p_paket_id
      and exists (
        select 1
        from public.pengguna_peran pp
        join public.peran r on r.peran_id = pp.peran_id
        where pp.pengguna_id = v_actor
          and (
            r.nama in ('admin', 'direktorat')
            or (r.nama = 'penyedia_jasa' and pk.created_by = v_actor
                and (pp.scope_paket_id is null or pp.scope_paket_id = pk.paket_id))
            or (r.nama = 'pic_balai' and pp.scope_balai_id = pk.balai_id
                and (pp.scope_paket_id is null or pp.scope_paket_id = pk.paket_id))
          )
      )
  ) then
    raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002';
  end if;

  select * into v_jenis
  from public.jenis_survei
  where jenis_survei_id = p_jenis_survei_id and aktif is true;

  if not found then
    raise exception 'Jenis survei tidak aktif atau tidak ditemukan' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'parameter_id', pu.parameter_id,
      'kode', pu.kode,
      'nama', pu.nama,
      'satuan', pu.satuan,
      'keterangan', pu.keterangan,
      'ambang_id', ab.ambang_id,
      'operator', ab.operator,
      'nilai_min', ab.nilai_min,
      'nilai_max', ab.nilai_max,
      'status', ab.status,
      'tahap', ab.tahap
    ) order by pu.parameter_id
  ), '[]'::jsonb)
  into v_parameter
  from public.parameter_uji pu
  join public.ambang_batas ab on ab.parameter_id = pu.parameter_id
    and ab.jenis_survei_id = pu.jenis_survei_id
  where pu.jenis_survei_id = p_jenis_survei_id
    and ab.status = 'DRAFT';

  select jsonb_build_object(
    'tahap', l.tahap,
    'panjang_min_km', l.panjang_min_km,
    'jumlah_lokasi_min', l.jumlah_lokasi_min,
    'jumlah_ulangan', l.jumlah_ulangan,
    'rater_berbeda', l.rater_berbeda,
    'interval_hari', l.interval_hari
  ) into v_lingkup
  from public.lingkup_uji_minimum l
  where l.jenis_survei_id = p_jenis_survei_id
    and l.tahap = 'UJI_COBA';

  return jsonb_build_object(
    'paket_id', p_paket_id,
    'jenis_survei', jsonb_build_object(
      'jenis_survei_id', v_jenis.jenis_survei_id,
      'kode', v_jenis.kode,
      'nama', v_jenis.nama
    ),
    'parameter', v_parameter,
    'lingkup', v_lingkup,
    'aturan', jsonb_build_object(
      'mode', 'PRATINJAU_KAK_2026',
      'sumber_nilai', 'BELUM_TERSAMBUNG_SMD',
      'status_ambang', 'DRAFT',
      'boleh_mengunci_pengajuan', false,
      'keputusan_pic_tetap_manual', true,
      'catatan_lokasi_pci', case when v_jenis.kode = 'PCI'
        then 'Enam seksi perlu mewakili kondisi Good, Fair dan Poor; komposisinya tetap disemak manual.'
        else null end
    )
  );
end;
$function$;

create or replace function public.baca_kriteria_uji_coba(
  p_paket_id integer,
  p_jenis_survei_id integer
)
returns jsonb
language sql
stable
security invoker
set search_path to ''
as $function$
  select app_private.baca_kriteria_uji_coba(p_paket_id, p_jenis_survei_id);
$function$;

revoke all on function app_private.baca_kriteria_uji_coba(integer, integer) from public, anon;
grant execute on function app_private.baca_kriteria_uji_coba(integer, integer) to authenticated;
revoke all on function public.baca_kriteria_uji_coba(integer, integer) from public, anon;
grant execute on function public.baca_kriteria_uji_coba(integer, integer) to authenticated, service_role;

commit;
