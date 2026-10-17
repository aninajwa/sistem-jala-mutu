-- Rujukan perubahan yang sudah dipasang. Bukan bootstrap dan jangan dijalankan ulang.
alter table public.checklist_pengisian add column paket_id integer not null references public.paket_kontrak(paket_id);
alter table public.checklist_pengisian add column status text not null default 'DRAFT' check (status in ('DRAFT','DIAJUKAN','PERLU_REVISI','DISETUJUI'));
alter table public.checklist_pengisian add column versi integer not null default 0 check (versi>=0);
alter table public.checklist_pengisian add column updated_at timestamptz not null default now();
alter table public.checklist_pengisian add constraint checklist_pengisian_paket_template_unique unique(paket_id,template_id);
alter table public.checklist_jawaban add constraint checklist_jawaban_item_unique unique(pengisian_id,item_id);
alter table public.checklist_jawaban add constraint checklist_jawaban_nilai_check check (jawaban is null or jawaban in ('Ya','Tidak'));
alter table public.checklist_jawaban add constraint checklist_jawaban_catatan_check check (length(coalesce(keterangan,''))<=2000);
comment on column public.checklist_pengisian.persen_lengkap is 'Peratus item dengan jawapan Ya/Tidak; bukan ukuran pematuhan atau kelayakan submit.';
comment on column public.checklist_item.wajib is 'NULL pada template kerja Tahap 0: syarat wajib dan keberlakuan bersyarat belum diaktifkan.';
with template as (
 insert into public.checklist_template(jenis,no_dokumen,revisi) values ('SURVEI_PENDAHULUAN','JM-PERSIAPAN-TAHAP0','DRAFT-01') returning template_id
)
insert into public.checklist_item(template_id,bagian,kode,uraian,wajib,urutan)
select t.template_id,v.bagian,v.kode,v.uraian,null,v.urutan from template t cross join (values
('Telaah data awal','AWAL-01','Survei tahun sebelumnya',1),
('Telaah data awal','AWAL-02','BA verval jembatan 2024–2026',2),
('Telaah data awal','AWAL-03','PHO/FHO penanganan',3),
('Telaah data awal','AWAL-04','Peta dan dataset lereng',4),
('Rencana lapangan','LAP-01','Kondisi konstruksi berjalan',5),
('Rencana lapangan','LAP-02','Perubahan geometri/trase',6),
('Rencana lapangan','LAP-03','Titik awal-akhir dan POI',7),
('Rencana lapangan','LAP-04','Kebutuhan survei detail dan lokasi PCI manual',8),
('Rencana lapangan','LAP-05','Rencana validasi per 200 km',9),
('Koordinasi','KOOR-01','Satker P2JN',10),
('Koordinasi','KOOR-02','Satker PJN',11),
('Koordinasi','KOOR-03','Penilik Jalan',12),
('Koordinasi','KOOR-04','BKJTK untuk jembatan khusus',13),
('Koordinasi','KOOR-05','Uji coba aplikasi AI, GPS, dan penyimpanan',14),
('Dokumen persiapan','DOK-01','Laporan Pendahuluan',15),
('Dokumen persiapan','DOK-02','Daftar peralatan yang akan digunakan',16),
('Dokumen persiapan','DOK-03','Sertifikat kalibrasi & metodologi validasi',17),
('Dokumen persiapan','DOK-04','Laporan uji coba pemeriksaan jembatan (bila ada)',18),
('Dokumen persiapan','DOK-05','Rencana validasi per 200 km',19),
('Dokumen persiapan','DOK-06','Metodologi survei',20),
('Dokumen persiapan','DOK-07','Sumber daya & jadwal kerja',21),
('Dokumen persiapan','DOK-08','Format-format survei',22),
('Dokumen persiapan','DOK-09','Program Mutu / Quality Management Plan',23),
('Dokumen persiapan','DOK-10','RKK / SMKK',24),
('Dokumen persiapan','DOK-11','RMLLP / pengaturan lalu lintas bila diperlukan',25)
) as v(bagian,kode,uraian,urutan);
revoke all privileges on public.checklist_template,public.checklist_item,public.checklist_pengisian,public.checklist_jawaban from anon,authenticated;
grant select on public.checklist_template,public.checklist_item,public.checklist_pengisian,public.checklist_jawaban to authenticated;
create policy checklist_template_read_persiapan on public.checklist_template for select to authenticated using (
 no_dokumen='JM-PERSIAPAN-TAHAP0' and revisi='DRAFT-01' and exists (
 select 1 from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran r on r.peran_id=pp.peran_id
 where p.auth_user_id=(select auth.uid()) and not coalesce(p.terkunci,false) and r.nama in ('penyedia_jasa','pic_balai','direktorat','admin'))
);
create policy checklist_item_read_template on public.checklist_item for select to authenticated using (
 exists(select 1 from public.checklist_template t where t.template_id=checklist_item.template_id)
);
create policy checklist_pengisian_read_paket on public.checklist_pengisian for select to authenticated using (
 exists(select 1 from public.paket_kontrak p
 join public.pengguna u on u.auth_user_id=(select auth.uid())
 join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id
 join public.peran r on r.peran_id=pp.peran_id
 where p.paket_id=checklist_pengisian.paket_id and not coalesce(u.terkunci,false)
 and (r.nama in ('penyedia_jasa','direktorat','admin')
 or (r.nama='pic_balai' and pp.scope_balai_id=p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id))))
);
create policy checklist_jawaban_read_pengisian on public.checklist_jawaban for select to authenticated using (
 exists(select 1 from public.checklist_pengisian q
 join public.paket_kontrak p on p.paket_id=q.paket_id
 join public.pengguna u on u.auth_user_id=(select auth.uid())
 join public.pengguna_peran pp on pp.pengguna_id=u.pengguna_id
 join public.peran r on r.peran_id=pp.peran_id
 where q.pengisian_id=checklist_jawaban.pengisian_id and not coalesce(u.terkunci,false)
 and (r.nama in ('penyedia_jasa','direktorat','admin')
 or (r.nama='pic_balai' and pp.scope_balai_id=p.balai_id and (pp.scope_paket_id is null or pp.scope_paket_id=p.paket_id))))
);
create function public.baca_checklist_persiapan(p_paket_id integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare tpl public.checklist_template; filled public.checklist_pengisian; items jsonb; total integer; answered integer;
begin
 if not exists(select 1 from public.paket_kontrak p where p.paket_id=p_paket_id) then
 raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002';end if;
 select * into tpl from public.checklist_template t where t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01';
 if not found then raise exception 'Template persiapan belum tersedia' using errcode='55000';end if;
 select * into filled from public.checklist_pengisian q where q.paket_id=p_paket_id and q.template_id=tpl.template_id;
 select count(*),count(j.jawaban),coalesce(jsonb_agg(jsonb_build_object(
 'item_id',i.item_id,'kode',i.kode,'bagian',i.bagian,'uraian',i.uraian,'wajib',i.wajib,'urutan',i.urutan,
 'jawaban',j.jawaban,'keterangan',j.keterangan,'bukti_dokumen_id',j.bukti_dokumen_id) order by i.urutan),'[]'::jsonb)
 into total,answered,items from public.checklist_item i left join public.checklist_jawaban j on j.item_id=i.item_id and j.pengisian_id=filled.pengisian_id where i.template_id=tpl.template_id;
 return jsonb_build_object('paket_id',p_paket_id,'template',to_jsonb(tpl),'pengisian',
 jsonb_build_object('pengisian_id',filled.pengisian_id,'status',coalesce(filled.status,'DRAFT'),'versi',coalesce(filled.versi,0),'tanggal',filled.tanggal,'diisi_oleh',filled.diisi_oleh,'updated_at',filled.updated_at),
 'ringkasan',jsonb_build_object('jumlah_item',total,'jumlah_terjawab',answered,'persen_terisi',case when total=0 then 0 else round(answered*100.0/total,2) end,'syarat_submit_aktif',false),
 'items',items);
end $$;
revoke all on function public.baca_checklist_persiapan(integer) from public,anon;
grant execute on function public.baca_checklist_persiapan(integer) to authenticated;
create function app_private.simpan_checklist_persiapan(p_paket_id integer,p_expected_version integer,p_jawaban jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; paket public.paket_kontrak; tpl public.checklist_template; filled public.checklist_pengisian; entry jsonb; item_key text; old_state jsonb; new_state jsonb; total integer; answered integer;
begin
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501';end if;
 select p.pengguna_id into actor_id from public.pengguna p where p.auth_user_id=auth.uid() and not coalesce(p.terkunci,false)
 and exists(select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=p.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh mengisi checklist' using errcode='42501';end if;
 select * into paket from public.paket_kontrak p where p.paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if paket.status is distinct from 'DRAFT' then raise exception 'Checklist persiapan hanya boleh diisi ketika paket DRAFT' using errcode='55000';end if;
 select * into tpl from public.checklist_template t where t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01';
 if not found then raise exception 'Template persiapan belum tersedia' using errcode='55000';end if;
 if p_expected_version is null or p_expected_version<0 or p_jawaban is null or jsonb_typeof(p_jawaban)<>'array' then
 raise exception 'Versi dan senarai jawapan tidak valid' using errcode='22023';end if;
 if jsonb_array_length(p_jawaban) not between 1 and 25 then raise exception 'Hantar 1 hingga 25 jawapan' using errcode='22023';end if;
 for entry in select value from jsonb_array_elements(p_jawaban) loop
  if jsonb_typeof(entry)<>'object' then raise exception 'Jawapan tidak valid' using errcode='22023';end if;
  for item_key in select jsonb_object_keys(entry) loop
   if item_key not in ('item_id','jawaban','keterangan') then raise exception 'Kolum jawapan tidak dibenarkan' using errcode='22023';end if;
  end loop;
  if not(entry ? 'item_id') or not(entry ? 'jawaban') or jsonb_typeof(entry->'item_id')<>'number' then raise exception 'Item dan jawapan diperlukan' using errcode='22023';end if;
  if (entry->>'item_id')::numeric<1 or (entry->>'item_id')::numeric>2147483647 or trunc((entry->>'item_id')::numeric)<>(entry->>'item_id')::numeric then raise exception 'ID item tidak valid' using errcode='22023';end if;
  if not exists(select 1 from public.checklist_item i where i.item_id=(entry->>'item_id')::numeric::integer and i.template_id=tpl.template_id) then raise exception 'Item bukan milik template persiapan' using errcode='22023';end if;
  if entry->'jawaban'<>'null'::jsonb and (jsonb_typeof(entry->'jawaban')<>'string' or entry->>'jawaban' not in ('Ya','Tidak')) then raise exception 'Jawapan mesti Ya, Tidak atau null' using errcode='22023';end if;
  if entry ? 'keterangan' and (jsonb_typeof(entry->'keterangan')<>'string' or length(entry->>'keterangan')>2000) then raise exception 'Catatan mesti teks maksimum 2000 aksara' using errcode='22023';end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(p_jawaban) e group by (e->>'item_id')::numeric having count(*)>1) then raise exception 'Item berulang dalam permintaan' using errcode='22023';end if;
 select * into filled from public.checklist_pengisian q where q.paket_id=p_paket_id and q.template_id=tpl.template_id for update;
 if found then
  if filled.status<>'DRAFT' then raise exception 'Checklist bukan berstatus DRAFT' using errcode='55000';end if;
  if filled.versi<>p_expected_version then raise exception 'Checklist telah berubah. Baca semula sebelum menyimpan' using errcode='40001';end if;
 else
  if p_expected_version<>0 then raise exception 'Checklist telah berubah. Baca semula sebelum menyimpan' using errcode='40001';end if;
 end if;
 old_state:=public.baca_checklist_persiapan(p_paket_id);
 if filled.pengisian_id is null then
  insert into public.checklist_pengisian(paket_id,template_id,konteks,konteks_id,tanggal,diisi_oleh,status,persen_lengkap)
  values(p_paket_id,tpl.template_id,'PAKET',p_paket_id,current_date,actor_id,'DRAFT',0) returning * into filled;
 end if;
 for entry in select value from jsonb_array_elements(p_jawaban) loop
  insert into public.checklist_jawaban(pengisian_id,item_id,jawaban,keterangan)
  values(filled.pengisian_id,(entry->>'item_id')::numeric::integer,entry->>'jawaban',case when entry ? 'keterangan' then entry->>'keterangan' else null end)
  on conflict(pengisian_id,item_id) do update set jawaban=excluded.jawaban,
  keterangan=case when entry ? 'keterangan' then excluded.keterangan else checklist_jawaban.keterangan end;
 end loop;
 select count(*),count(j.jawaban) into total,answered from public.checklist_item i left join public.checklist_jawaban j on j.item_id=i.item_id and j.pengisian_id=filled.pengisian_id where i.template_id=tpl.template_id;
 update public.checklist_pengisian set persen_lengkap=case when total=0 then 0 else round(answered*100.0/total,2) end,versi=versi+1,updated_at=clock_timestamp() where pengisian_id=filled.pengisian_id;
 new_state:=public.baca_checklist_persiapan(p_paket_id);
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(actor_id,'checklist_pengisian',filled.pengisian_id::text,'SAVE_DRAFT',old_state,new_state,localtimestamp);
 return new_state;
end $$;
revoke all on function app_private.simpan_checklist_persiapan(integer,integer,jsonb) from public,anon;
grant execute on function app_private.simpan_checklist_persiapan(integer,integer,jsonb) to authenticated;
create function public.simpan_checklist_persiapan(p_paket_id integer,p_expected_version integer,p_jawaban jsonb)
returns jsonb language sql security invoker set search_path='' as $$
 select app_private.simpan_checklist_persiapan(p_paket_id,p_expected_version,p_jawaban);
$$;
revoke all on function public.simpan_checklist_persiapan(integer,integer,jsonb) from public,anon;
grant execute on function public.simpan_checklist_persiapan(integer,integer,jsonb) to authenticated;
