create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
alter table public.paket_kontrak add column created_by integer references public.pengguna(pengguna_id);
alter table public.paket_kontrak add column created_at timestamptz not null default now();
grant select on public.balai to authenticated;
create policy balai_select_untuk_paket on public.balai for select to authenticated using (
 exists (select 1 from public.pengguna p join public.pengguna_peran pp on pp.pengguna_id=p.pengguna_id join public.peran r on r.peran_id=pp.peran_id
 where p.auth_user_id=(select auth.uid()) and not coalesce(p.terkunci,false)
 and (r.nama in ('admin','direktorat','penyedia_jasa') or (r.nama='pic_balai' and pp.scope_balai_id=balai.balai_id)))
);
create function app_private.buat_paket_draft(p_nama_paket text, p_nomor_kontrak text, p_tahun_anggaran integer, p_balai_id integer)
returns public.paket_kontrak language plpgsql security definer set search_path = '' as $$
declare actor_id integer; paket public.paket_kontrak;
begin
 if auth.uid() is null then raise exception 'Login diperlukan' using errcode='42501'; end if;
 select p.pengguna_id into actor_id from public.pengguna p where p.auth_user_id=auth.uid() and not coalesce(p.terkunci,false)
 and exists (select 1 from public.pengguna_peran pp join public.peran r on r.peran_id=pp.peran_id where pp.pengguna_id=p.pengguna_id and r.nama='penyedia_jasa');
 if actor_id is null then raise exception 'Hanya Penyedia Jasa boleh mencipta draft' using errcode='42501'; end if;
 if p_nama_paket is null or length(btrim(p_nama_paket)) not between 1 and 255
 or p_nomor_kontrak is null or length(btrim(p_nomor_kontrak)) not between 1 and 100
 or p_tahun_anggaran is null or p_tahun_anggaran not between 2000 and 2100 then
 raise exception 'Nama, nomor kontrak dan tahun anggaran tidak valid' using errcode='22023'; end if;
 if not exists (select 1 from public.balai b where b.balai_id=p_balai_id and b.aktif is true) then
 raise exception 'Balai tidak ditemukan atau tidak aktif' using errcode='22023'; end if;
 insert into public.paket_kontrak(nama_paket,nomor_kontrak,tahun_anggaran,balai_id,status,created_by)
 values (btrim(p_nama_paket),btrim(p_nomor_kontrak),p_tahun_anggaran,p_balai_id,'DRAFT',actor_id) returning * into paket;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu)
 values (actor_id,'paket_kontrak',paket.paket_id::text,'CREATE_DRAFT',to_jsonb(paket),localtimestamp);
 return paket;
end $$;
revoke all on function app_private.buat_paket_draft(text,text,integer,integer) from public, anon;
grant execute on function app_private.buat_paket_draft(text,text,integer,integer) to authenticated;
create function public.buat_paket_draft(p_nama_paket text, p_nomor_kontrak text, p_tahun_anggaran integer, p_balai_id integer)
returns public.paket_kontrak language sql security invoker set search_path = '' as $$
 select app_private.buat_paket_draft(p_nama_paket,p_nomor_kontrak,p_tahun_anggaran,p_balai_id);
$$;
revoke all on function public.buat_paket_draft(text,text,integer,integer) from public, anon;
grant execute on function public.buat_paket_draft(text,text,integer,integer) to authenticated;
