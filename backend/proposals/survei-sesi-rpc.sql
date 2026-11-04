-- JALA MUTU — proposal RPC sesi survei Tahap 3A.
-- Proposal sahaja: jangan jalankan sebelum semakan, ujian staging dan persetujuan.
-- Tidak membuat/ mengubah tabel. Status sesi tidak ditetapkan kerana kontrak
-- tabel yang diperiksa belum mendefinisikan nilai awal atau lifecycle status.

create or replace function app_private.assert_survei_read(p_paket_id integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.pengguna;
  v_package public.paket_kontrak;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;
  select * into v_user from public.pengguna
  where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if not found then raise exception 'Profil tidak berwenang' using errcode = '42501'; end if;
  select * into v_package from public.paket_kontrak where paket_id = p_paket_id;
  if not found then raise exception 'Paket tidak ditemukan' using errcode = 'P0002'; end if;
  if not (
    (v_package.created_by = v_user.pengguna_id and exists (
      select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
      where pp.pengguna_id = v_user.pengguna_id and r.nama = 'penyedia_jasa'
    )) or exists (
    select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
    where pp.pengguna_id = v_user.pengguna_id and r.nama = 'pic_balai'
      and pp.scope_balai_id = v_package.balai_id
      and (pp.scope_paket_id is null or pp.scope_paket_id = p_paket_id)
  )) then
    raise exception 'Paket tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function app_private.baca_senarai_sesi_survei(p_paket_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app_private.assert_survei_read(p_paket_id);
  return coalesce((select jsonb_agg(to_jsonb(s) order by s.sesi_id)
    from public.sesi_survei s where s.paket_id = p_paket_id), '[]'::jsonb);
end;
$$;

create or replace function app_private.baca_sesi_survei(p_paket_id integer, p_sesi_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_result jsonb;
begin
  perform app_private.assert_survei_read(p_paket_id);
  select to_jsonb(s) into v_result from public.sesi_survei s
    where s.paket_id = p_paket_id and s.sesi_id = p_sesi_id;
  if v_result is null then raise exception 'Sesi survei tidak ditemukan atau tidak boleh diakses' using errcode = 'P0002'; end if;
  return v_result;
end;
$$;

create or replace function app_private.simpan_sesi_survei(p_paket_id integer, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor integer;
  v_user public.pengguna;
  v_package public.paket_kontrak;
  v_team public.tim_survei;
  v_session public.sesi_survei;
  v_date date;
  v_start time without time zone;
  v_end time without time zone;
  v_tim_id integer;
  v_ruas_id integer;
  v_alat_id integer;
  v_operator_id integer;
  v_pengemudi_id integer;
  v_number numeric;
  v_length numeric;
  v_lane text;
  v_direction text;
  v_weather text;
  v_surface text;
  v_video text;
  v_key text;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select * into v_user from public.pengguna where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if not found or not exists (
    select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
    where pp.pengguna_id = v_user.pengguna_id and r.nama = 'penyedia_jasa'
  ) then raise exception 'Hanya Penyedia Jasa aktif boleh membuat sesi survei' using errcode = '42501'; end if;
  v_actor := v_user.pengguna_id;
  select * into v_package from public.paket_kontrak where paket_id = p_paket_id for update;
  if not found then raise exception 'Paket tidak ditemukan' using errcode = 'P0002'; end if;
  if v_package.created_by is distinct from v_actor then raise exception 'Akses ke paket ini ditolak' using errcode = '42501'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Data sesi survei tidak valid' using errcode = '22023'; end if;
  for v_key in select jsonb_object_keys(p_data) loop
    if v_key not in ('tim_id','ruas_id','alat_id','operator_id','pengemudi_id','tanggal','jam_mulai','jam_selesai','lajur','arah','cuaca','kondisi_permukaan','panjang_tercapai_km','link_video') then
      raise exception 'Kolom sesi survei tidak dibenarkan' using errcode = '22023';
    end if;
  end loop;
  foreach v_key in array array['tim_id','ruas_id','alat_id'] loop
    if jsonb_typeof(p_data->v_key) is distinct from 'number' then
      raise exception 'Tim, ruas dan alat wajib berupa ID angka' using errcode = '22023';
    end if;
    v_number := (p_data->>v_key)::numeric;
    if v_number < 1 or v_number > 2147483647 or v_number <> trunc(v_number) then
      raise exception 'ID tim, ruas atau alat di luar rentang integer positif' using errcode = '22023';
    end if;
    if v_key = 'tim_id' then v_tim_id := v_number::integer;
    elsif v_key = 'ruas_id' then v_ruas_id := v_number::integer;
    else v_alat_id := v_number::integer;
    end if;
  end loop;

  if jsonb_typeof(p_data->'tanggal') is distinct from 'string'
     or p_data->>'tanggal' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
     or left(p_data->>'tanggal', 4) = '0000' then
    raise exception 'Tanggal wajib menggunakan format YYYY-MM-DD' using errcode = '22023';
  end if;
  begin v_date := (p_data->>'tanggal')::date;
  exception when invalid_text_representation or datetime_field_overflow then
    raise exception 'Tanggal tidak valid' using errcode = '22023';
  end;
  if to_char(v_date, 'YYYY-MM-DD') <> p_data->>'tanggal' then
    raise exception 'Tanggal tidak valid' using errcode = '22023';
  end if;
  foreach v_key in array array['operator_id','pengemudi_id'] loop
    if p_data ? v_key and p_data->v_key <> 'null'::jsonb then
      if jsonb_typeof(p_data->v_key) is distinct from 'number' then
        raise exception 'ID operator atau pengemudi mesti integer' using errcode = '22023';
      end if;
      v_number := (p_data->>v_key)::numeric;
      if v_number < 1 or v_number > 2147483647 or v_number <> trunc(v_number) then
        raise exception 'ID operator atau pengemudi di luar rentang integer positif' using errcode = '22023';
      end if;
      if v_key = 'operator_id' then v_operator_id := v_number::integer;
      else v_pengemudi_id := v_number::integer;
      end if;
    end if;
  end loop;

  foreach v_key in array array['jam_mulai','jam_selesai'] loop
    if p_data ? v_key and p_data->v_key <> 'null'::jsonb then
      if jsonb_typeof(p_data->v_key) is distinct from 'string'
         or p_data->>v_key !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' then
        raise exception 'Jam mesti menggunakan format HH:MM atau HH:MM:SS' using errcode = '22023';
      end if;
      if v_key = 'jam_mulai' then v_start := (p_data->>v_key)::time;
      else v_end := (p_data->>v_key)::time;
      end if;
    end if;
  end loop;

  foreach v_key in array array['lajur','arah','cuaca','kondisi_permukaan','link_video'] loop
    if p_data ? v_key and p_data->v_key <> 'null'::jsonb then
      if jsonb_typeof(p_data->v_key) is distinct from 'string' then
        raise exception 'Kolom teks sesi survei mesti berupa teks atau null' using errcode = '22023';
      end if;
      if v_key = 'link_video' then
        if length(btrim(p_data->>v_key)) > 2000 then raise exception 'Link video terlalu panjang' using errcode = '22023'; end if;
        v_video := btrim(p_data->>v_key);
      else
        if length(btrim(p_data->>v_key)) > 255 then raise exception 'Teks sesi survei melebihi 255 karakter' using errcode = '22023'; end if;
        if v_key = 'lajur' then v_lane := btrim(p_data->>v_key);
        elsif v_key = 'arah' then v_direction := btrim(p_data->>v_key);
        elsif v_key = 'cuaca' then v_weather := btrim(p_data->>v_key);
        else v_surface := btrim(p_data->>v_key);
        end if;
      end if;
    end if;
  end loop;

  if p_data ? 'panjang_tercapai_km' and p_data->'panjang_tercapai_km' <> 'null'::jsonb then
    if jsonb_typeof(p_data->'panjang_tercapai_km') is distinct from 'number' then
      raise exception 'Panjang tercapai mesti berupa angka atau null' using errcode = '22023';
    end if;
    v_length := (p_data->>'panjang_tercapai_km')::numeric;
    if v_length < 0 or v_length > '1.7976931348623157e308'::numeric then
      raise exception 'Panjang tercapai di luar rentang angka yang didukung' using errcode = '22023';
    end if;
  end if;

  select * into v_team from public.tim_survei
    where tim_id = v_tim_id and paket_id = p_paket_id for share;
  if not found then raise exception 'Tim tidak ditemukan dalam paket ini' using errcode = '22023'; end if;
  perform 1 from public.penugasan_alat pa join public.alat_survei a using (alat_id)
    where pa.tim_id = v_team.tim_id and pa.alat_id = v_alat_id
      and a.jenis_survei_id = v_team.jenis_survei_id and a.penyedia_id = v_package.penyedia_id
      and (pa.mulai is null or pa.mulai <= v_date) and (pa.selesai is null or pa.selesai >= v_date)
    for share of pa, a;
  if not found then raise exception 'Alat tidak ditugaskan kepada tim, jenis survei atau penyedia paket ini' using errcode = '22023'; end if;
  perform 1 from public.ruas_jalan r where r.ruas_id = v_ruas_id and r.balai_id = v_package.balai_id for share;
  if not found then raise exception 'Ruas tidak ditemukan pada Balai paket ini' using errcode = '22023'; end if;
  if v_operator_id is not null then
    perform 1 from public.anggota_tim m where m.tim_id = v_team.tim_id and m.personel_id = v_operator_id
      and (m.mulai is null or m.mulai <= v_date) and (m.selesai is null or m.selesai >= v_date) for share;
    if not found then raise exception 'Operator bukan anggota tim pada tanggal sesi' using errcode = '22023'; end if;
  end if;
  if v_pengemudi_id is not null then
    perform 1 from public.anggota_tim m where m.tim_id = v_team.tim_id and m.personel_id = v_pengemudi_id
      and (m.mulai is null or m.mulai <= v_date) and (m.selesai is null or m.selesai >= v_date) for share;
    if not found then raise exception 'Pengemudi bukan anggota tim pada tanggal sesi' using errcode = '22023'; end if;
  end if;
  perform 1 from public.uji_coba u where u.paket_id = p_paket_id and u.tim_id = v_team.tim_id
      and u.jenis_survei_id = v_team.jenis_survei_id and u.alat_id = v_alat_id
      and u.ruas_id = v_ruas_id and u.status = 'DISETUJUI'
    limit 1 for share;
  if not found then raise exception 'Uji coba untuk tim, jenis survei, alat dan ruas ini belum disetujui' using errcode = '55000'; end if;

  insert into public.sesi_survei(
    paket_id,tim_id,ruas_id,alat_id,operator_id,pengemudi_id,tanggal,jam_mulai,jam_selesai,lajur,arah,cuaca,kondisi_permukaan,panjang_tercapai_km,link_video
  ) values (
    p_paket_id,v_team.tim_id,v_ruas_id,v_alat_id,v_operator_id,v_pengemudi_id,v_date,
    v_start,v_end,v_lane,v_direction,v_weather,v_surface,v_length,v_video
  ) returning * into v_session;
  return to_jsonb(v_session);
exception
  when invalid_text_representation or datetime_field_overflow or invalid_datetime_format or numeric_value_out_of_range or string_data_right_truncation then
    raise exception 'Data sesi survei tidak valid' using errcode = '22023';
end;
$$;

revoke all on function app_private.assert_survei_read(integer) from public, anon;
revoke all on function app_private.baca_senarai_sesi_survei(integer) from public, anon;
revoke all on function app_private.baca_sesi_survei(integer, integer) from public, anon;
revoke all on function app_private.simpan_sesi_survei(integer, jsonb) from public, anon;
grant execute on function app_private.assert_survei_read(integer) to authenticated;
grant execute on function app_private.baca_senarai_sesi_survei(integer) to authenticated;
grant execute on function app_private.baca_sesi_survei(integer, integer) to authenticated;
grant execute on function app_private.simpan_sesi_survei(integer, jsonb) to authenticated;

create or replace function public.baca_senarai_sesi_survei(p_paket_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.baca_senarai_sesi_survei(p_paket_id);
$$;
create or replace function public.baca_sesi_survei(p_paket_id integer, p_sesi_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.baca_sesi_survei(p_paket_id, p_sesi_id);
$$;
create or replace function public.simpan_sesi_survei(p_paket_id integer, p_data jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select app_private.simpan_sesi_survei(p_paket_id, p_data);
$$;
revoke all on function public.baca_senarai_sesi_survei(integer) from public, anon;
revoke all on function public.baca_sesi_survei(integer, integer) from public, anon;
revoke all on function public.simpan_sesi_survei(integer, jsonb) from public, anon;
grant execute on function public.baca_senarai_sesi_survei(integer) to authenticated;
grant execute on function public.baca_sesi_survei(integer, integer) to authenticated;
grant execute on function public.simpan_sesi_survei(integer, jsonb) to authenticated;
