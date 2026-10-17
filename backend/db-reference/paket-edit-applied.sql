-- Reference: applied to Jala-Mutu by the assistant. Do not rerun manually.
create function app_private.ubah_paket_draft(p_paket_id integer, p_patch jsonb)
returns public.paket_kontrak language plpgsql security definer set search_path = '' as $$
declare actor_id integer; old_paket public.paket_kontrak; new_paket public.paket_kontrak; item_key text;
begin
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
 select p.pengguna_id into actor_id from public.pengguna p
 where p.auth_user_id=auth.uid() and not coalesce(p.terkunci,false)
 and exists (select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=p.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh mengubah draft' using errcode='42501'; end if;
 if p_patch is null or jsonb_typeof(p_patch)<>'object' or p_patch='{}'::jsonb then
  raise exception 'Perubahan paket tidak valid atau kosong' using errcode='22023'; end if;
 for item_key in select jsonb_object_keys(p_patch) loop
  if item_key not in ('nama_paket','nomor_kontrak','tahun_anggaran','nama_ppk','tgl_spmk') then
   raise exception 'Kolum perubahan tidak dibenarkan' using errcode='22023'; end if;
 end loop;
 select * into old_paket from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002'; end if;
 if old_paket.status is distinct from 'DRAFT' then
  raise exception 'Hanya paket berstatus DRAFT boleh diubah' using errcode='55000'; end if;
 new_paket:=old_paket;
 if p_patch ? 'nama_paket' then
  if jsonb_typeof(p_patch->'nama_paket')<>'string' or length(btrim(p_patch->>'nama_paket')) not between 1 and 255 then
   raise exception 'Nama paket tidak valid' using errcode='22023'; end if;
  new_paket.nama_paket:=btrim(p_patch->>'nama_paket');
 end if;
 if p_patch ? 'nomor_kontrak' then
  if jsonb_typeof(p_patch->'nomor_kontrak')<>'string' or length(btrim(p_patch->>'nomor_kontrak')) not between 1 and 100 then
   raise exception 'Nomor kontrak tidak valid' using errcode='22023'; end if;
  new_paket.nomor_kontrak:=btrim(p_patch->>'nomor_kontrak');
 end if;
 if p_patch ? 'tahun_anggaran' then
  if jsonb_typeof(p_patch->'tahun_anggaran')<>'number' then raise exception 'Tahun tidak valid' using errcode='22023';end if;
  if (p_patch->>'tahun_anggaran')::numeric not between 2000 and 2100 or trunc((p_patch->>'tahun_anggaran')::numeric)<>(p_patch->>'tahun_anggaran')::numeric then
   raise exception 'Tahun tidak valid' using errcode='22023';end if;
  new_paket.tahun_anggaran:=(p_patch->>'tahun_anggaran')::numeric::integer;
 end if;
 if p_patch ? 'nama_ppk' then
  if jsonb_typeof(p_patch->'nama_ppk') not in ('string','null') or length(btrim(p_patch->>'nama_ppk'))>255 then
   raise exception 'Nama PPK tidak valid' using errcode='22023'; end if;
  new_paket.nama_ppk:=nullif(btrim(p_patch->>'nama_ppk'),'');
 end if;
 if p_patch ? 'tgl_spmk' then
  if p_patch->'tgl_spmk'='null'::jsonb then new_paket.tgl_spmk:=null;
  else
   if jsonb_typeof(p_patch->'tgl_spmk')<>'string' or (p_patch->>'tgl_spmk') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Tarikh SPMK mesti YYYY-MM-DD atau null' using errcode='22023';end if;
   begin new_paket.tgl_spmk:=(p_patch->>'tgl_spmk')::date;
   exception when invalid_datetime_format or datetime_field_overflow then
    raise exception 'Tarikh SPMK tidak valid' using errcode='22023';end;
  end if;
 end if;
 if to_jsonb(new_paket)=to_jsonb(old_paket) then return old_paket;end if;
 update public.paket_kontrak set nama_paket=new_paket.nama_paket,nomor_kontrak=new_paket.nomor_kontrak,
 tahun_anggaran=new_paket.tahun_anggaran,nama_ppk=new_paket.nama_ppk,tgl_spmk=new_paket.tgl_spmk
 where paket_id=p_paket_id returning * into new_paket;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values (actor_id,'paket_kontrak',p_paket_id::text,'UPDATE_DRAFT',to_jsonb(old_paket),to_jsonb(new_paket),localtimestamp);
 return new_paket;
end $$;
revoke all on function app_private.ubah_paket_draft(integer,jsonb) from public,anon;
grant execute on function app_private.ubah_paket_draft(integer,jsonb) to authenticated;
create function public.ubah_paket_draft(p_paket_id integer, p_patch jsonb)
returns public.paket_kontrak language sql security invoker set search_path = '' as $$
 select app_private.ubah_paket_draft(p_paket_id,p_patch);
$$;
revoke all on function public.ubah_paket_draft(integer,jsonb) from public,anon;
grant execute on function public.ubah_paket_draft(integer,jsonb) to authenticated;
