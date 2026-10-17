-- Rujukan fungsi yang telah dipasang; bukan bootstrap dan jangan dijalankan ulang.
create function public.baca_detail_dokumen_persiapan(p_paket_id integer,p_dokumen_id integer,p_page integer default 1)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare d public.dokumen; metadata jsonb; active_file jsonb; history jsonb; total bigint;
begin
 if p_page is null or p_page not between 1 and 1000000 then raise exception 'page tidak valid' using errcode='22023';end if;
 if not exists(select 1 from public.paket_kontrak where paket_id=p_paket_id) then raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode='P0002';end if;
 select * into d from public.dokumen where dokumen_id=p_dokumen_id and paket_id=p_paket_id and sumber_tipe='PERSIAPAN' and status='TERSEDIA';
 if not found then raise exception 'Dokumen tidak ditemukan atau tidak boleh diakses' using errcode='P0002';end if;
 select jsonb_build_object('dokumen_id',d.dokumen_id,'paket_id',d.paket_id,'judul',d.judul,'status',d.status,
 'versi_aktif',d.versi_aktif,'diunggah_oleh',d.diunggah_oleh,'diunggah_pada',d.diunggah_pada,
 'jenis_dokumen',jsonb_build_object('kode',j.kode,'nama',j.nama)) into metadata from public.jenis_dokumen j where j.jenis_dokumen_id=d.jenis_dokumen_id;
 select jsonb_build_object('dok_versi_id',v.dok_versi_id,'versi_ke',v.versi_ke,'nama_file',v.nama_file,'mime_type',v.mime_type,
 'ukuran_byte',v.ukuran_byte,'hash_file',v.hash_file,'dibuat_pada',v.dibuat_pada,'aktif',true)
 into active_file from public.dokumen_versi v where v.dokumen_id=d.dokumen_id and v.versi_ke=d.versi_aktif;
 select count(*) into total from public.dokumen_versi where dokumen_id=d.dokumen_id;
 select coalesce(jsonb_agg(jsonb_build_object('dok_versi_id',v.dok_versi_id,'versi_ke',v.versi_ke,'nama_file',v.nama_file,'mime_type',v.mime_type,
 'ukuran_byte',v.ukuran_byte,'hash_file',v.hash_file,'dibuat_pada',v.dibuat_pada,'aktif',v.versi_ke=d.versi_aktif) order by v.versi_ke desc),'[]'::jsonb)
 into history from (select * from public.dokumen_versi where dokumen_id=d.dokumen_id order by versi_ke desc limit 50 offset (p_page-1)*50) v;
 return jsonb_build_object('dokumen',metadata,'versi_aktif',active_file,'riwayat_versi',history,
 'pagination',jsonb_build_object('page',p_page,'page_size',50,'total',total,'total_pages',ceil(total/50.0),'has_next',p_page::bigint*50<total));
end $$;
revoke all on function public.baca_detail_dokumen_persiapan(integer,integer,integer) from public,anon;
grant execute on function public.baca_detail_dokumen_persiapan(integer,integer,integer) to authenticated;
comment on function public.baca_detail_dokumen_persiapan(integer,integer,integer) is 'Metadata dan riwayat versi melalui RLS; 50 versi setiap halaman, urutan terbaru dahulu. Versi aktif dikembalikan berasingan pada setiap halaman. Tidak membaca atau mengesahkan isi/kewujudan fail Storage.';
