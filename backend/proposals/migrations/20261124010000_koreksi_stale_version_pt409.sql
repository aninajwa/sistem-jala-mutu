-- APPLIED 2026-11-24 as migration koreksi_stale_version_pt409. PostgREST retries SQLSTATE 40001 (serialization failure) until the client
-- times out, so a stale-version error never reaches the API. Signal it with PT409 (HTTP 409);
-- the backend maps PT409 to the same 409 conflict as 40001.
create or replace function app_private.koreksi_kunci(p_paket_id integer, p_koreksi_id integer, p_expected_version integer)
returns integer language plpgsql security definer set search_path = ''
as $function$
declare v_kasus integer; v_versi integer;
begin
  select k.kasus_id, kd.versi into v_kasus, v_versi
  from public.koreksi_data kd join public.kasus_temuan k on k.kasus_id = kd.kasus_id
  where kd.koreksi_id = p_koreksi_id and k.paket_id = p_paket_id
  for update of k, kd;
  if v_kasus is null then raise exception 'Kasus koreksi tidak ditemukan' using errcode = 'P0002'; end if;
  if p_expected_version is null or v_versi <> p_expected_version then
    raise exception 'Kasus koreksi telah berubah. Baca semula' using errcode = 'PT409';
  end if;
  return v_kasus;
end;
$function$;
revoke all on function app_private.koreksi_kunci(integer, integer, integer) from public, anon, authenticated;
