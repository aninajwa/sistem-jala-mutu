-- JALA MUTU — proposal RPC READ siklus Verval Tahap 3B.
-- Proposal sahaja: jangan jalankan sebelum semakan dan ujian staging.
-- Tidak membuat tabel, status, relasi, atau aturan siklus baru.

create or replace function app_private.baca_senarai_siklus_verval(p_paket_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;
  perform app_private.assert_survei_read(p_paket_id);
  return coalesce((
    select jsonb_agg(to_jsonb(s) order by s.siklus_ke nulls last, s.siklus_id)
    from public.siklus_verval s
    where s.paket_id = p_paket_id
  ), '[]'::jsonb);
end;
$$;

create or replace function app_private.baca_siklus_verval(p_paket_id integer, p_siklus_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan' using errcode = '42501';
  end if;
  perform app_private.assert_survei_read(p_paket_id);
  select to_jsonb(s) into v_result
  from public.siklus_verval s
  where s.paket_id = p_paket_id and s.siklus_id = p_siklus_id;
  if v_result is null then
    raise exception 'Siklus Verval tidak ditemukan dalam paket ini' using errcode = 'P0002';
  end if;
  return v_result;
end;
$$;

revoke all on function app_private.baca_senarai_siklus_verval(integer) from public, anon;
revoke all on function app_private.baca_siklus_verval(integer, integer) from public, anon;
grant execute on function app_private.baca_senarai_siklus_verval(integer) to authenticated;
grant execute on function app_private.baca_siklus_verval(integer, integer) to authenticated;

create or replace function public.baca_senarai_siklus_verval(p_paket_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.baca_senarai_siklus_verval(p_paket_id);
$$;

create or replace function public.baca_siklus_verval(p_paket_id integer, p_siklus_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.baca_siklus_verval(p_paket_id, p_siklus_id);
$$;

revoke all on function public.baca_senarai_siklus_verval(integer) from public, anon;
revoke all on function public.baca_siklus_verval(integer, integer) from public, anon;
grant execute on function public.baca_senarai_siklus_verval(integer) to authenticated;
grant execute on function public.baca_siklus_verval(integer, integer) to authenticated;
