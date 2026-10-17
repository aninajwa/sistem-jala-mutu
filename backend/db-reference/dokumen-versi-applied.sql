-- Rujukan fungsi yang sudah dipasang. Jangan dijalankan ulang.
create function app_private.tambah_versi_dokumen_persiapan(p_paket_id integer,p_dokumen_id integer,p_expected_version integer,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id integer; package_status text; d public.dokumen; v public.dokumen_versi; old_d jsonb; q public.checklist_pengisian; changed jsonb:='[]'::jsonb;
begin
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501';end if;
 select u.pengguna_id into actor_id from public.pengguna u where u.auth_user_id=auth.uid() and not coalesce(u.terkunci,false)
 and exists(select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=u.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh upload versi dokumen' using errcode='42501';end if;
 select status into package_status from public.paket_kontrak where paket_id=p_paket_id for update;
 if not found then raise exception 'Paket tidak ditemukan' using errcode='P0002';end if;
 if package_status is distinct from 'DRAFT' then raise exception 'Versi dokumen hanya boleh ditambah ketika paket DRAFT' using errcode='55000';end if;
 select * into d from public.dokumen where dokumen_id=p_dokumen_id and paket_id=p_paket_id and sumber_tipe='PERSIAPAN' and status='TERSEDIA' for update;
 if not found then raise exception 'Dokumen tidak ditemukan' using errcode='P0002';end if;
 if not exists(select 1 from public.jenis_dokumen j where j.jenis_dokumen_id=d.jenis_dokumen_id and j.kode in ('LAPORAN_PENDAHULUAN','PROGRAM_MUTU')) then raise exception 'Jenis dokumen tidak disokong' using errcode='22023';end if;
 if p_expected_version is null or p_expected_version not between 1 and 2147483646
 or p_nama_file is null or length(p_nama_file) not between 5 and 255 or p_nama_file !~* '\.pdf$' or p_nama_file ~ '[[:cntrl:]/\\]'
 or p_ukuran is null or p_ukuran not between 1 and 10485760 or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$'
 or p_object_path is null or split_part(p_object_path,'/',1)<>p_paket_id::text or p_object_path !~ '^[1-9][0-9]{0,9}/[0-9a-f-]{36}\.pdf$' then
 raise exception 'Maklumat versi dokumen tidak valid' using errcode='22023';end if;
 -- Registered-path retries are idempotent, but cannot claim an object belonging to another document.
 select * into v from public.dokumen_versi where object_path=p_object_path;
 if found then
  if v.dokumen_id<>d.dokumen_id or v.versi_ke<>p_expected_version+1 or v.hash_file<>p_sha256 or v.ukuran_byte<>p_ukuran or v.nama_file<>p_nama_file then raise exception 'Fail telah digunakan' using errcode='22023';end if;
  return jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v),'checklist_dikemas_kini',changed);
 end if;
 if d.versi_aktif is distinct from p_expected_version then raise exception 'Versi dokumen telah berubah. Baca senarai dokumen semula' using errcode='40001';end if;
 -- Lock any draft checklist whose evidence will now resolve to the new active file.
 for q in select c.* from public.checklist_pengisian c where exists(select 1 from public.checklist_jawaban a where a.pengisian_id=c.pengisian_id and a.bukti_dokumen_id=p_dokumen_id) order by c.pengisian_id for update loop
  if q.paket_id<>p_paket_id or q.status<>'DRAFT' then raise exception 'Bukti checklist bukan DRAFT tidak boleh diganti' using errcode='55000';end if;
  if q.versi>=2147483647 then raise exception 'Had versi checklist telah dicapai' using errcode='55000';end if;
 end loop;
 if not exists(select 1 from storage.buckets where id='dokumen-persiapan' and public is false) then raise exception 'Bucket private dokumen-persiapan belum tersedia' using errcode='55000';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='dokumen-persiapan' and o.name=p_object_path and o.owner_id=auth.uid()::text and o.metadata->>'size'=p_ukuran::text and o.metadata->>'mimetype'='application/pdf') then raise exception 'Fail upload belum tersedia atau metadata tidak sepadan' using errcode='22023';end if;
 old_d:=to_jsonb(d);
 insert into public.dokumen_versi(dokumen_id,versi_ke,hash_file,ukuran_byte,dibuat_pada,bucket_id,object_path,nama_file,mime_type)
 values(d.dokumen_id,p_expected_version+1,p_sha256,p_ukuran,localtimestamp,'dokumen-persiapan',p_object_path,p_nama_file,'application/pdf') returning * into v;
 update public.dokumen set versi_aktif=v.versi_ke where dokumen_id=d.dokumen_id returning * into d;
 for q in select c.* from public.checklist_pengisian c where exists(select 1 from public.checklist_jawaban a where a.pengisian_id=c.pengisian_id and a.bukti_dokumen_id=p_dokumen_id) order by c.pengisian_id loop
  update public.checklist_pengisian set versi=versi+1,updated_at=clock_timestamp() where pengisian_id=q.pengisian_id;
  changed:=changed||jsonb_build_array(jsonb_build_object('pengisian_id',q.pengisian_id,'versi',q.versi+1));
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
  values(actor_id,'checklist_pengisian',q.pengisian_id::text,'VERSION_EVIDENCE',to_jsonb(q),to_jsonb(q)||jsonb_build_object('versi',q.versi+1,'dokumen_id',d.dokumen_id,'versi_dokumen',v.versi_ke),localtimestamp);
 end loop;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)
 values(actor_id,'dokumen',d.dokumen_id::text,'UPLOAD_DOCUMENT_VERSION',old_d,jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v)),localtimestamp);
 return jsonb_build_object('dokumen',to_jsonb(d),'versi',to_jsonb(v),'checklist_dikemas_kini',changed);
end $$;
revoke all on function app_private.tambah_versi_dokumen_persiapan(integer,integer,integer,text,text,bigint,text) from public,anon;
grant execute on function app_private.tambah_versi_dokumen_persiapan(integer,integer,integer,text,text,bigint,text) to authenticated;
create function public.tambah_versi_dokumen_persiapan(p_paket_id integer,p_dokumen_id integer,p_expected_version integer,p_object_path text,p_nama_file text,p_ukuran bigint,p_sha256 text)
returns jsonb language sql security invoker set search_path='' as $$
 select app_private.tambah_versi_dokumen_persiapan(p_paket_id,p_dokumen_id,p_expected_version,p_object_path,p_nama_file,p_ukuran,p_sha256);
$$;
revoke all on function public.tambah_versi_dokumen_persiapan(integer,integer,integer,text,text,bigint,text) from public,anon;
grant execute on function public.tambah_versi_dokumen_persiapan(integer,integer,integer,text,text,bigint,text) to authenticated;
