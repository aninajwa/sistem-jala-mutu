-- Rujukan perubahan yang sudah dipasang; bukan bootstrap dan jangan dijalankan ulang.
create function public.baca_ringkasan_persiapan(p_paket_id integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare state jsonb; total integer; yes_count integer; no_count integer; linked integer; documents integer;
begin
 -- Reuse the checklist reader: inaccessible/missing packages raise P0002 through RLS.
 state := public.baca_checklist_persiapan(p_paket_id);
 select count(*),count(*) filter(where item->>'jawaban'='Ya'),
 count(*) filter(where item->>'jawaban'='Tidak'),
 count(*) filter(where item->>'bukti_dokumen_id' is not null)
 into total,yes_count,no_count,linked from jsonb_array_elements(state->'items') as rows(item);
 -- Count all visible registered preparation documents, without the list endpoint's 100-row limit.
 select count(*) into documents from public.dokumen d
 where d.paket_id=p_paket_id and d.sumber_tipe='PERSIAPAN' and d.status='TERSEDIA';
 return jsonb_build_object('paket_id',p_paket_id,'template',state->'template','pengisian',state->'pengisian',
 'checklist',jsonb_build_object('jumlah_item',total,'jumlah_ya',yes_count,'jumlah_tidak',no_count,
 'jumlah_terjawab',yes_count+no_count,'jumlah_belum_dijawab',total-yes_count-no_count,
 'persen_terisi',state#>'{ringkasan,persen_terisi}','jumlah_item_dengan_pautan_bukti',linked),
 'dokumen',jsonb_build_object('jumlah_tersedia',documents),'syarat_submit_aktif',false);
end $$;
revoke all on function public.baca_ringkasan_persiapan(integer) from public,anon;
grant execute on function public.baca_ringkasan_persiapan(integer) to authenticated;
comment on function public.baca_ringkasan_persiapan(integer) is 'Ringkasan data persiapan melalui RLS. Jumlah dokumen menghitung rekod TERSEDIA/PERSIAPAN, bukan pengesahan isi atau kewujudan fail Storage. Pautan bukti bukan jawapan Ya atau kelulusan.';
