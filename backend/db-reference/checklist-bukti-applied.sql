-- Rujukan perubahan yang telah dipasang; jangan jalankan semula.
alter table public.checklist_item add column jenis_bukti_kode text references public.jenis_dokumen(kode);
update public.checklist_item i set jenis_bukti_kode=case i.kode when 'DOK-01' then 'LAPORAN_PENDAHULUAN' when 'DOK-09' then 'PROGRAM_MUTU' end
from public.checklist_template t where i.template_id=t.template_id and t.no_dokumen='JM-PERSIAPAN-TAHAP0' and t.revisi='DRAFT-01' and i.kode in ('DOK-01','DOK-09');
create or replace function public.baca_checklist_persiapan(p_paket_id integer)
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
 'jenis_bukti_kode',i.jenis_bukti_kode,'jawaban',j.jawaban,'keterangan',j.keterangan,'bukti_dokumen_id',j.bukti_dokumen_id) order by i.urutan),'[]'::jsonb)
 into total,answered,items from public.checklist_item i left join public.checklist_jawaban j on j.item_id=i.item_id and j.pengisian_id=filled.pengisian_id where i.template_id=tpl.template_id;
 return jsonb_build_object('paket_id',p_paket_id,'template',to_jsonb(tpl),'pengisian',
 jsonb_build_object('pengisian_id',filled.pengisian_id,'status',coalesce(filled.status,'DRAFT'),'versi',coalesce(filled.versi,0),'tanggal',filled.tanggal,'diisi_oleh',filled.diisi_oleh,'updated_at',filled.updated_at),
 'ringkasan',jsonb_build_object('jumlah_item',total,'jumlah_terjawab',answered,'persen_terisi',case when total=0 then 0 else round(answered*100.0/total,2) end,'syarat_submit_aktif',false),
 'items',items);
end $$;

create function app_private.tautkan_bukti_persiapan(p_paket_id integer,p_expected_version integer,p_item_id integer,p_dokumen_id integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; paket public.paket_kontrak; tpl public.checklist_template; filled public.checklist_pengisian; expected_kind text; old_state jsonb; new_state jsonb; old_document integer;
begin
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501';end if;
 select u.pengguna_id into actor_id from public.pengguna u where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false)
 and exists(select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh mengubah bukti checklist' using errcode='42501';end if;
 select * into paket from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if paket.status is distinct from 'DRAFT' then raise exception 'Pautan bukti hanya boleh diubah ketika paket DRAFT' using errcode='55000';end if;
 if p_expected_version is null or p_expected_version<0 or p_expected_version>=2147483647 or p_item_id is null or p_item_id<1 or (p_dokumen_id is not null and p_dokumen_id<1) then
 raise exception 'ID atau versi tidak valid' using errcode='22023';end if;
 select * into tpl from public.checklist_template where no_dokumen='JM-PERSIAPAN-TAHAP0' and revisi='DRAFT-01';
 if not found then raise exception 'Template persiapan belum tersedia' using errcode='55000';end if;
 select i.jenis_bukti_kode into expected_kind from public.checklist_item i where i.item_id=p_item_id and i.template_id=tpl.template_id;
 if expected_kind is null then raise exception 'Item ini belum mempunyai padanan jenis bukti' using errcode='22023';end if;
 select * into filled from public.checklist_pengisian q where q.paket_id=p_paket_id and q.template_id=tpl.template_id for update;
 if found then
  if filled.status<>'DRAFT' then raise exception 'Checklist bukan berstatus DRAFT' using errcode='55000';end if;
  if filled.versi<>p_expected_version then raise exception 'Checklist telah berubah. Baca semula sebelum menyimpan' using errcode='40001';end if;
 else
  if p_expected_version<>0 then raise exception 'Checklist telah berubah. Baca semula sebelum menyimpan' using errcode='40001';end if;
 end if;
 if p_dokumen_id is not null then
  if not exists(select 1 from public.dokumen d join public.jenis_dokumen j on j.jenis_dokumen_id=d.jenis_dokumen_id
   join public.dokumen_versi v on v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif
   join storage.objects o on o.bucket_id=v.bucket_id and o.name=v.object_path
   where d.dokumen_id=p_dokumen_id and d.paket_id=p_paket_id and d.status='TERSEDIA' and d.sumber_tipe='PERSIAPAN' and j.kode=expected_kind
   and v.bucket_id='dokumen-persiapan' and o.metadata->>'size'=v.ukuran_byte::text and o.metadata->>'mimetype'='application/pdf') then
   raise exception 'Dokumen tidak tersedia, bukan paket yang sama atau jenis bukti tidak sepadan' using errcode='22023';end if;
 end if;
 old_state:=public.baca_checklist_persiapan(p_paket_id);
 select bukti_dokumen_id into old_document from public.checklist_jawaban where pengisian_id=filled.pengisian_id and item_id=p_item_id;
 if old_document is not distinct from p_dokumen_id then return old_state;end if;
 if filled.pengisian_id is null then
  insert into public.checklist_pengisian(paket_id,template_id,konteks,konteks_id,tanggal,diisi_oleh,status,persen_lengkap)
  values(p_paket_id,tpl.template_id,'PAKET',p_paket_id,current_date,actor_id,'DRAFT',0) returning * into filled;
 end if;
 insert into public.checklist_jawaban(pengisian_id,item_id,bukti_dokumen_id) values(filled.pengisian_id,p_item_id,p_dokumen_id)
 on conflict(pengisian_id,item_id) do update set bukti_dokumen_id=excluded.bukti_dokumen_id;
 update public.checklist_pengisian set versi=versi+1,updated_at=clock_timestamp() where pengisian_id=filled.pengisian_id;
 new_state:=public.baca_checklist_persiapan(p_paket_id);
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(actor_id,'checklist_pengisian',filled.pengisian_id::text,case when p_dokumen_id is null then 'UNLINK_EVIDENCE' else 'LINK_EVIDENCE' end,old_state,new_state,localtimestamp);
 return new_state;
end $$;
revoke all on function app_private.tautkan_bukti_persiapan(integer,integer,integer,integer) from public,anon;
grant execute on function app_private.tautkan_bukti_persiapan(integer,integer,integer,integer) to authenticated;
create function public.tautkan_bukti_persiapan(p_paket_id integer,p_expected_version integer,p_item_id integer,p_dokumen_id integer)
returns jsonb language sql security invoker set search_path='' as $$
 select app_private.tautkan_bukti_persiapan(p_paket_id,p_expected_version,p_item_id,p_dokumen_id);
$$;
revoke all on function public.tautkan_bukti_persiapan(integer,integer,integer,integer) from public,anon;
grant execute on function public.tautkan_bukti_persiapan(integer,integer,integer,integer) to authenticated;
