-- Langkah 12: pendaftaran personel dan metadata kualifikasi. Tiada keputusan kelayakan automatik.
alter table public.personel enable row level security;
alter table public.anggota_tim enable row level security;
alter table public.kualifikasi_personel enable row level security;
revoke insert,update,delete on public.personel,public.anggota_tim,public.kualifikasi_personel from anon,authenticated;
grant select on public.personel,public.anggota_tim,public.kualifikasi_personel to authenticated;
create index anggota_tim_personel_idx on public.anggota_tim(personel_id);
create unique index anggota_tim_period_unique on public.anggota_tim(tim_id,personel_id,coalesce(mulai,'-infinity'::date),coalesce(selesai,'infinity'::date));
create unique index personel_nik_internal_unique on public.personel(penyedia_id,lower(btrim(nik_internal))) where nullif(btrim(nik_internal),'') is not null;
create unique index kualifikasi_nomor_unique on public.kualifikasi_personel(personel_id,lower(btrim(jenis)),lower(btrim(nomor)));
alter table public.personel add constraint personel_pengalaman_nonnegative check(pengalaman_tahun is null or pengalaman_tahun>=0);
alter table public.anggota_tim add constraint anggota_tim_dates_valid check(selesai is null or (mulai is not null and selesai>=mulai));
create policy anggota_tim_read_scope on public.anggota_tim for select to authenticated using(exists(select 1 from public.tim_survei t where t.tim_id=anggota_tim.tim_id));
create policy personel_read_scope on public.personel for select to authenticated using(
 exists(select 1 from public.pengguna u join public.pengguna_peran pp using(pengguna_id) join public.peran r using(peran_id) where u.auth_user_id=(select auth.uid()) and not coalesce(u.terkunci,false) and r.nama in ('penyedia_jasa','direktorat','admin'))
 or exists(select 1 from public.anggota_tim a where a.personel_id=personel.personel_id)
);
create policy kualifikasi_personel_read_scope on public.kualifikasi_personel for select to authenticated using(exists(select 1 from public.personel p where p.personel_id=kualifikasi_personel.personel_id));

create function app_private.daftar_personel_tim(p_paket_id integer,p_tim_id integer,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; team public.tim_survei; person public.personel; member public.anggota_tim; org integer; existing boolean; key text; start_date date; end_date date;
begin
 actor:=app_private.assert_tahap_kalibrasi(p_paket_id);
 select * into team from public.tim_survei where tim_id=p_tim_id and paket_id=p_paket_id for update;
 if not found then raise exception 'Tim tidak ditemukan dalam paket ini' using errcode='P0002';end if;
 select penyedia_id into org from public.paket_kontrak where paket_id=p_paket_id;
 if org is null then raise exception 'Paket belum mempunyai organisasi penyedia' using errcode='55000';end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Data personel tidak valid' using errcode='22023';end if;
 existing:=p_data ? 'personel_id';
 for key in select jsonb_object_keys(p_data) loop
  if (existing and key not in ('personel_id','peran','mulai','selesai')) or (not existing and key not in ('nama','nik_internal','pendidikan','pengalaman_tahun','peran','mulai','selesai')) then raise exception 'Kolum personel tidak dibenarkan' using errcode='22023';end if;
 end loop;
 if jsonb_typeof(p_data->'peran') is distinct from 'string' or length(btrim(p_data->>'peran')) not between 1 and 255 then raise exception 'Peran dalam tim diperlukan' using errcode='22023';end if;
 foreach key in array array['mulai','selesai'] loop
  if p_data ? key and p_data->key<>'null'::jsonb then
   if jsonb_typeof(p_data->key)<>'string' or p_data->>key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Tarikh mesti YYYY-MM-DD' using errcode='22023';end if;
   begin
    if key='mulai' then start_date:=(p_data->>key)::date;else end_date:=(p_data->>key)::date;end if;
   exception when invalid_datetime_format or datetime_field_overflow then raise exception 'Tarikh tidak valid' using errcode='22023';end;
  end if;
 end loop;
 if end_date is not null and (start_date is null or end_date<start_date) then raise exception 'Tarikh selesai memerlukan mulai dan tidak boleh lebih awal' using errcode='22023';end if;
 if existing then
  if jsonb_typeof(p_data->'personel_id') is distinct from 'number' or (p_data->>'personel_id')::numeric not between 1 and 2147483647 or trunc((p_data->>'personel_id')::numeric)<>(p_data->>'personel_id')::numeric then raise exception 'ID personel tidak valid' using errcode='22023';end if;
  select * into person from public.personel where personel_id=(p_data->>'personel_id')::numeric::integer for update;
  if not found or person.penyedia_id is distinct from org then raise exception 'Personel tidak ditemukan atau penyedia tidak sepadan' using errcode='22023';end if;
 else
  if jsonb_typeof(p_data->'nama') is distinct from 'string' or length(btrim(p_data->>'nama')) not between 1 and 255 then raise exception 'Nama personel diperlukan' using errcode='22023';end if;
  foreach key in array array['nik_internal','pendidikan'] loop
   if p_data ? key and (jsonb_typeof(p_data->key) not in ('string','null') or length(btrim(p_data->>key))>255) then raise exception 'Maklumat personel tidak valid' using errcode='22023';end if;
  end loop;
  if p_data ? 'pengalaman_tahun' and p_data->'pengalaman_tahun'<>'null'::jsonb then
   if jsonb_typeof(p_data->'pengalaman_tahun')<>'number' or (p_data->>'pengalaman_tahun')::numeric not between 0 and 2147483647 or trunc((p_data->>'pengalaman_tahun')::numeric)<>(p_data->>'pengalaman_tahun')::numeric then raise exception 'Pengalaman mesti bilangan tahun bulat bukan negatif' using errcode='22023';end if;
  end if;
  insert into public.personel(penyedia_id,nama,nik_internal,pendidikan,pengalaman_tahun)
  values(org,btrim(p_data->>'nama'),nullif(btrim(p_data->>'nik_internal'),''),nullif(btrim(p_data->>'pendidikan'),''),(p_data->>'pengalaman_tahun')::numeric::integer) returning * into person;
  insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu) values(actor,'personel',person.personel_id::text,'CREATE_PERSONNEL',to_jsonb(person),localtimestamp);
 end if;
 insert into public.anggota_tim(tim_id,personel_id,peran,mulai,selesai) values(team.tim_id,person.personel_id,btrim(p_data->>'peran'),start_date,end_date) returning * into member;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu) values(actor,'anggota_tim',member.anggota_id::text,'ASSIGN_PERSONNEL',to_jsonb(member),localtimestamp);
 return jsonb_build_object('personel',to_jsonb(person),'anggota',to_jsonb(member),'kelayakan_belum_dinilai',true);
end $$;
revoke all on function app_private.daftar_personel_tim(integer,integer,jsonb) from public,anon;
grant execute on function app_private.daftar_personel_tim(integer,integer,jsonb) to authenticated;
create function public.daftar_personel_tim(p_paket_id integer,p_tim_id integer,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.daftar_personel_tim(p_paket_id,p_tim_id,p_data);$$;
revoke all on function public.daftar_personel_tim(integer,integer,jsonb) from public,anon;
grant execute on function public.daftar_personel_tim(integer,integer,jsonb) to authenticated;

create function app_private.daftar_kualifikasi_personel(p_paket_id integer,p_tim_id integer,p_personel_id integer,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor integer; qualification public.kualifikasi_personel; key text; expiry date;
begin
 actor:=app_private.assert_tahap_kalibrasi(p_paket_id);
 perform 1 from public.tim_survei where tim_id=p_tim_id and paket_id=p_paket_id for update;
 if not found then raise exception 'Tim tidak ditemukan dalam paket ini' using errcode='P0002';end if;
 perform 1 from public.personel p join public.paket_kontrak k on k.penyedia_id=p.penyedia_id where k.paket_id=p_paket_id and p.personel_id=p_personel_id and exists(select 1 from public.anggota_tim a where a.tim_id=p_tim_id and a.personel_id=p.personel_id) for update of p;
 if not found then raise exception 'Personel tidak ditemukan dalam tim atau penyedia tidak sepadan' using errcode='P0002';end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Data kualifikasi tidak valid' using errcode='22023';end if;
 for key in select jsonb_object_keys(p_data) loop
  if key not in ('jenis','nomor','jenjang','berlaku_sd') then raise exception 'Kolum kualifikasi tidak dibenarkan' using errcode='22023';end if;
 end loop;
 if jsonb_typeof(p_data->'jenis') is distinct from 'string' or p_data->>'jenis' not in ('SKA','SKK','PELATIHAN_QA_QC_DJBM') then raise exception 'Jenis kualifikasi tidak valid' using errcode='22023';end if;
 if jsonb_typeof(p_data->'nomor') is distinct from 'string' or length(btrim(p_data->>'nomor')) not between 1 and 255 then raise exception 'Nomor kualifikasi diperlukan' using errcode='22023';end if;
 if p_data ? 'jenjang' and (jsonb_typeof(p_data->'jenjang') not in ('string','null') or length(btrim(p_data->>'jenjang'))>255) then raise exception 'Jenjang tidak valid' using errcode='22023';end if;
 if p_data ? 'berlaku_sd' and p_data->'berlaku_sd'<>'null'::jsonb then
  if jsonb_typeof(p_data->'berlaku_sd')<>'string' or p_data->>'berlaku_sd' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Tarikh mesti YYYY-MM-DD' using errcode='22023';end if;
  begin expiry:=(p_data->>'berlaku_sd')::date;exception when invalid_datetime_format or datetime_field_overflow then raise exception 'Tarikh tidak valid' using errcode='22023';end;
 end if;
 insert into public.kualifikasi_personel(personel_id,jenis,nomor,jenjang,berlaku_sd,dokumen_id) values(p_personel_id,p_data->>'jenis',btrim(p_data->>'nomor'),nullif(btrim(p_data->>'jenjang'),''),expiry,null) returning * into qualification;
 insert into public.audit_trail(pengguna_id,tabel,record_id,aksi,nilai_baru,waktu) values(actor,'kualifikasi_personel',qualification.kualifikasi_id::text,'CREATE_PERSONNEL_QUALIFICATION',jsonb_build_object('paket_id',p_paket_id,'tim_id',p_tim_id,'kualifikasi',to_jsonb(qualification)),localtimestamp);
 return jsonb_build_object('kualifikasi',to_jsonb(qualification),'kelayakan_belum_dinilai',true);
end $$;
revoke all on function app_private.daftar_kualifikasi_personel(integer,integer,integer,jsonb) from public,anon;
grant execute on function app_private.daftar_kualifikasi_personel(integer,integer,integer,jsonb) to authenticated;
create function public.daftar_kualifikasi_personel(p_paket_id integer,p_tim_id integer,p_personel_id integer,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.daftar_kualifikasi_personel(p_paket_id,p_tim_id,p_personel_id,p_data);$$;
revoke all on function public.daftar_kualifikasi_personel(integer,integer,integer,jsonb) from public,anon;
grant execute on function public.daftar_kualifikasi_personel(integer,integer,integer,jsonb) to authenticated;
