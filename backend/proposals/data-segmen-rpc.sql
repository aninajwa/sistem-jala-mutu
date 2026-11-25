-- JALA MUTU — proposal RPC pencatatan dan pembacaan hasil data segmen Tahap 3A.
-- Proposal sahaja; tidak membuat tabel dan tidak menetapkan QC/versi atau metrik survei.
-- Dependency: app_private.assert_survei_read(integer) dari proposal RPC sesi survei.

create or replace function app_private.simpan_data_segmen(
  p_paket_id integer,
  p_sesi_id integer,
  p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor integer;
  v_user public.pengguna;
  v_package public.paket_kontrak;
  v_session public.sesi_survei;
  v_team public.tim_survei;
  v_road public.ruas_jalan;
  v_survey_type public.jenis_survei;
  v_result public.data_segmen;
  v_survey_type_id integer;
  v_sta_awal numeric;
  v_sta_akhir numeric;
  v_value numeric;
  v_lat numeric;
  v_lon numeric;
  v_lane text;
  v_attributes jsonb;
  v_key text;
  v_has_payload boolean := false;
begin
  if auth.uid() is null then raise exception 'Login diperlukan' using errcode = '42501'; end if;
  select * into v_user from public.pengguna
  where auth_user_id = auth.uid() and not coalesce(terkunci, false);
  if not found or not exists (
    select 1 from public.pengguna_peran pp join public.peran r using (peran_id)
    where pp.pengguna_id = v_user.pengguna_id and r.nama = 'penyedia_jasa'
  ) then raise exception 'Hanya Penyedia Jasa aktif boleh mencatat data segmen' using errcode = '42501'; end if;
  v_actor := v_user.pengguna_id;

  select * into v_package from public.paket_kontrak
  where paket_id = p_paket_id for share;
  if not found then raise exception 'Paket tidak ditemukan' using errcode = 'P0002'; end if;
  if v_package.created_by is distinct from v_actor then raise exception 'Akses ke paket ini ditolak' using errcode = '42501'; end if;

  select * into v_session from public.sesi_survei
  where sesi_id = p_sesi_id and paket_id = p_paket_id for share;
  if not found then raise exception 'Sesi survei tidak ditemukan dalam paket ini' using errcode = 'P0002'; end if;
  if v_session.ruas_id is null or v_session.tim_id is null then
    raise exception 'Sesi survei tidak memiliki relasi ruas atau tim yang sah' using errcode = '22023';
  end if;

  select * into v_team from public.tim_survei
  where tim_id = v_session.tim_id and paket_id = p_paket_id for share;
  if not found or v_team.jenis_survei_id is null then
    raise exception 'Jenis survei sesi tidak ditemukan' using errcode = '22023';
  end if;
  select * into v_road from public.ruas_jalan
  where ruas_id = v_session.ruas_id and balai_id = v_package.balai_id for share;
  if not found then raise exception 'Ruas sesi tidak berada pada Balai paket' using errcode = '22023'; end if;
  select * into v_survey_type from public.jenis_survei
  where jenis_survei_id = v_team.jenis_survei_id for share;
  if not found then raise exception 'Jenis survei sesi tidak ditemukan' using errcode = '22023'; end if;

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'Data segmen mesti berupa objek JSON' using errcode = '22023';
  end if;
  for v_key in select jsonb_object_keys(p_data) loop
    if v_key not in ('jenis_survei_id','sta_awal','sta_akhir','lajur','nilai_utama','atribut_detail','lat','lon') then
      raise exception 'Kolom data segmen tidak dibenarkan' using errcode = '22023';
    end if;
  end loop;
  if jsonb_typeof(p_data->'jenis_survei_id') is distinct from 'number' then
    raise exception 'jenis_survei_id wajib berupa integer' using errcode = '22023';
  end if;
  begin v_survey_type_id := (p_data->>'jenis_survei_id')::integer;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'jenis_survei_id tidak valid' using errcode = '22023';
  end;
  if v_survey_type_id < 1 or v_survey_type_id <> (p_data->>'jenis_survei_id')::numeric then
    raise exception 'jenis_survei_id mesti integer positif' using errcode = '22023';
  end if;
  if v_survey_type_id <> v_team.jenis_survei_id then
    raise exception 'Jenis survei data tidak sama dengan jenis survei sesi' using errcode = '22023';
  end if;

  foreach v_key in array array['sta_awal','sta_akhir','nilai_utama','lat','lon'] loop
    if p_data ? v_key and p_data->v_key <> 'null'::jsonb then
      if jsonb_typeof(p_data->v_key) is distinct from 'number' then
        raise exception 'Atribut numerik mesti berupa angka atau null' using errcode = '22023';
      end if;
      begin
        if v_key = 'sta_awal' then v_sta_awal := (p_data->>v_key)::numeric;
        elsif v_key = 'sta_akhir' then v_sta_akhir := (p_data->>v_key)::numeric;
        elsif v_key = 'nilai_utama' then v_value := (p_data->>v_key)::numeric;
        elsif v_key = 'lat' then v_lat := (p_data->>v_key)::numeric;
        else v_lon := (p_data->>v_key)::numeric;
        end if;
      exception when invalid_text_representation or numeric_value_out_of_range then
        raise exception 'Atribut numerik di luar rentang yang didukung' using errcode = '22023';
      end;
      v_has_payload := true;
    elsif p_data ? v_key and p_data->v_key = 'null'::jsonb then
      null;
    end if;
  end loop;
  if p_data ? 'lajur' and p_data->'lajur' <> 'null'::jsonb then
    if jsonb_typeof(p_data->'lajur') is distinct from 'string' then
      raise exception 'lajur mesti berupa teks atau null' using errcode = '22023';
    end if;
    v_lane := p_data->>'lajur';
    v_has_payload := true;
  end if;
  if p_data ? 'atribut_detail' and p_data->'atribut_detail' <> 'null'::jsonb then
    v_attributes := p_data->'atribut_detail';
    v_has_payload := true;
  end if;
  if not v_has_payload then raise exception 'Sekurang-kurangnya satu atribut data segmen mesti diisi' using errcode = '22023'; end if;

  insert into public.data_segmen(
    sesi_id,jenis_survei_id,ruas_id,sta_awal,sta_akhir,lajur,nilai_utama,atribut_detail,lat,lon
  ) values (
    v_session.sesi_id,v_survey_type.jenis_survei_id,v_road.ruas_id,
    v_sta_awal,v_sta_akhir,v_lane,v_value,v_attributes,v_lat,v_lon
  ) returning * into v_result;
  return to_jsonb(v_result);
exception
  when string_data_right_truncation or numeric_value_out_of_range then
    raise exception 'Data segmen tidak valid' using errcode = '22023';
end;
$$;

create or replace function app_private.baca_senarai_data_segmen(p_paket_id integer, p_sesi_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app_private.assert_survei_read(p_paket_id);
  if not exists (select 1 from public.sesi_survei s where s.sesi_id = p_sesi_id and s.paket_id = p_paket_id) then
    raise exception 'Sesi survei tidak ditemukan dalam paket ini' using errcode = 'P0002';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(d) order by d.data_id)
    from public.data_segmen d
    join public.sesi_survei s on s.sesi_id = d.sesi_id and s.paket_id = p_paket_id
    join public.tim_survei t on t.tim_id = s.tim_id and t.paket_id = s.paket_id
    join public.paket_kontrak p on p.paket_id = s.paket_id
    join public.ruas_jalan r on r.ruas_id = s.ruas_id and r.ruas_id = d.ruas_id and r.balai_id = p.balai_id
    join public.jenis_survei j on j.jenis_survei_id = t.jenis_survei_id and j.jenis_survei_id = d.jenis_survei_id
    where s.sesi_id = p_sesi_id), '[]'::jsonb);
end;
$$;

create or replace function app_private.baca_data_segmen(p_paket_id integer, p_sesi_id integer, p_data_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_result jsonb;
begin
  perform app_private.assert_survei_read(p_paket_id);
  if not exists (select 1 from public.sesi_survei s where s.sesi_id = p_sesi_id and s.paket_id = p_paket_id) then
    raise exception 'Sesi survei tidak ditemukan dalam paket ini' using errcode = 'P0002';
  end if;
  select to_jsonb(d) into v_result from public.data_segmen d
  join public.sesi_survei s on s.sesi_id = d.sesi_id and s.paket_id = p_paket_id
  join public.tim_survei t on t.tim_id = s.tim_id and t.paket_id = s.paket_id
  join public.paket_kontrak p on p.paket_id = s.paket_id
  join public.ruas_jalan r on r.ruas_id = s.ruas_id and r.ruas_id = d.ruas_id and r.balai_id = p.balai_id
  join public.jenis_survei j on j.jenis_survei_id = t.jenis_survei_id and j.jenis_survei_id = d.jenis_survei_id
  where d.data_id = p_data_id and s.sesi_id = p_sesi_id;
  if v_result is null then raise exception 'Data segmen tidak ditemukan dalam sesi ini' using errcode = 'P0002'; end if;
  return v_result;
end;
$$;

revoke all on function app_private.simpan_data_segmen(integer,integer,jsonb) from public, anon;
revoke all on function app_private.baca_senarai_data_segmen(integer,integer) from public, anon;
revoke all on function app_private.baca_data_segmen(integer,integer,bigint) from public, anon;
grant execute on function app_private.simpan_data_segmen(integer,integer,jsonb) to authenticated;
grant execute on function app_private.baca_senarai_data_segmen(integer,integer) to authenticated;
grant execute on function app_private.baca_data_segmen(integer,integer,bigint) to authenticated;

create or replace function public.simpan_data_segmen(p_paket_id integer, p_sesi_id integer, p_data jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select app_private.simpan_data_segmen(p_paket_id,p_sesi_id,p_data);
$$;
create or replace function public.baca_senarai_data_segmen(p_paket_id integer, p_sesi_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.baca_senarai_data_segmen(p_paket_id,p_sesi_id);
$$;
create or replace function public.baca_data_segmen(p_paket_id integer, p_sesi_id integer, p_data_id bigint)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.baca_data_segmen(p_paket_id,p_sesi_id,p_data_id);
$$;
revoke all on function public.simpan_data_segmen(integer,integer,jsonb) from public, anon;
revoke all on function public.baca_senarai_data_segmen(integer,integer) from public, anon;
revoke all on function public.baca_data_segmen(integer,integer,bigint) from public, anon;
grant execute on function public.simpan_data_segmen(integer,integer,jsonb) to authenticated;
grant execute on function public.baca_senarai_data_segmen(integer,integer) to authenticated;
grant execute on function public.baca_data_segmen(integer,integer,bigint) to authenticated;
