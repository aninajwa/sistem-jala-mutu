-- Additional real-account permission checks, all within rollback.
begin;
do $$
declare provider_auth uuid; provider_id integer; pid integer; balai integer; qid integer; version integer; report integer; item integer; state jsonb; r record; visible boolean; approval_id integer; pic_user integer; pic_auth uuid; pic_role integer;
begin
 select u.pengguna_id,u.auth_user_id into provider_id,provider_auth from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) where pr.nama='penyedia_jasa' limit 1;
 select d.dokumen_id,d.paket_id,p.balai_id into report,pid,balai from public.dokumen d join public.jenis_dokumen j using(jenis_dokumen_id) join public.paket_kontrak p using(paket_id) where j.kode='LAPORAN_PENDAHULUAN' and d.status='TERSEDIA' order by d.dokumen_id limit 1;
 select i.item_id into item from public.checklist_item i join public.checklist_template t using(template_id) where i.kode='DOK-01' and t.no_dokumen='JM-PERSIAPAN-TAHAP0';
 select u.pengguna_id,u.auth_user_id,pr.peran_id into pic_user,pic_auth,pic_role from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) where pr.nama='pic_balai' and pp.scope_balai_id=balai and pp.scope_paket_id is null limit 1;
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 state:=public.baca_pengajuan_persiapan(pid);version:=(state->>'versi')::int;
 state:=public.tautkan_bukti_persiapan(pid,version,item,report);version:=(state#>>'{pengisian,versi}')::int;
 state:=public.ajukan_persiapan(pid,version);version:=(state->>'versi')::int;qid:=(state->>'pengisian_id')::int;
 execute 'reset role';perform set_config('request.jwt.claim.sub',pic_auth::text,true);execute 'set local role authenticated';
 state:=public.review_persiapan(pid,version,'PERLU_REVISI','Permission fixture');version:=(state->>'versi')::int;approval_id:=(state#>>'{review,persetujuan_id}')::int;
 execute 'reset role';
 for r in select u.auth_user_id,u.pengguna_id,pr.nama,pp.scope_balai_id,pp.scope_paket_id from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran pr using(peran_id) loop
  perform set_config('request.jwt.claim.sub',r.auth_user_id::text,true);execute 'set local role authenticated';
  select exists(select 1 from public.paket_kontrak where paket_id=pid) into visible;
  if visible then
   if public.baca_pengajuan_persiapan(pid)#>>'{review,persetujuan_id}'<>approval_id::text then raise exception 'Visible user cannot see decision';end if;
  else
   begin perform public.baca_pengajuan_persiapan(pid);raise exception 'Foreign user reads submission';exception when no_data_found then null;end;
  end if;
  if (select count(*) from public.persetujuan_dokumen where persetujuan_id=approval_id)<>(case when visible then 1 else 0 end) then raise exception 'Approval table RLS failed';end if;
  if r.nama<>'penyedia_jasa' then
   begin perform public.ajukan_persiapan(pid,version);raise exception 'Non-provider submits';exception when insufficient_privilege then null;end;
  end if;
  if r.nama='pic_balai' and r.scope_balai_id=balai and (r.scope_paket_id is null or r.scope_paket_id=pid) then
   begin perform public.review_persiapan(pid,version,'DISETUJUI','');raise exception 'Decision outside pending status';exception when object_not_in_prerequisite_state then null;end;
  else
   begin perform public.review_persiapan(pid,version,'DISETUJUI','');raise exception 'Unassigned role reviews';exception when insufficient_privilege then null;end;
  end if;
  if has_table_privilege(current_user,'public.persetujuan_dokumen','INSERT') or has_table_privilege(current_user,'public.checklist_pengisian','UPDATE') then raise exception 'Direct workflow writes granted';end if;
  execute 'reset role';
 end loop;
 -- Package scope is enforced in addition to Balai scope.
 insert into public.paket_kontrak(paket_id,balai_id,nama_paket,status) overriding system value values(2100000009,balai,'Temporary scope fixture','DRAFT');
 update public.pengguna_peran set scope_paket_id=2100000009 where pengguna_id=pic_user and peran_id=pic_role;
 perform set_config('request.jwt.claim.sub',pic_auth::text,true);execute 'set local role authenticated';
 begin perform public.review_persiapan(pid,version,'DISETUJUI','');raise exception 'Wrong package scope reviewed';exception when insufficient_privilege then null;end;
 begin perform public.baca_pengajuan_persiapan(pid);raise exception 'Wrong package scope reads snapshot';exception when no_data_found then null;end;
 execute 'reset role';update public.pengguna_peran set scope_paket_id=null where pengguna_id=pic_user and peran_id=pic_role;
 update public.pengguna set terkunci=true where pengguna_id=pic_user;
 execute 'set local role authenticated';
 begin perform public.review_persiapan(pid,version,'DISETUJUI','');raise exception 'Locked PIC reviewed';exception when insufficient_privilege then null;end;
 execute 'reset role';
 -- Even a user with both roles cannot approve their own submission.
 perform set_config('request.jwt.claim.sub',provider_auth::text,true);execute 'set local role authenticated';
 state:=public.ajukan_persiapan(pid,version);version:=(state->>'versi')::int;
 execute 'reset role';
 insert into public.pengguna_peran(pengguna_id,peran_id,scope_balai_id) values(provider_id,pic_role,balai);
 execute 'set local role authenticated';
 begin perform public.review_persiapan(pid,version,'DISETUJUI','');raise exception 'Self-review allowed';exception when insufficient_privilege then null;end;
 execute 'reset role';
end $$;
rollback;
select 'PASS: all linked accounts submission and review roles, decision RLS, direct-write denial, additional package scope, locked PIC, dual-role self-review denial; all fixtures restored.' as verification;
