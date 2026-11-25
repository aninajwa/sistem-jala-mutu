-- Stale-version errors: SQLSTATE 40001 -> PT409 in every remaining RPC (2026-11-25).
-- PostgREST treats 40001 (serialization_failure) as retryable and retries until the client times
-- out (~20 s hang), the same bug fixed for Koreksi in 20261124010000. The backend already maps
-- PT409 to HTTP 409 for every path (services/supabase.ts), so user-facing messages do not change.
-- Mechanical rewrite: only `errcode = '40001'` inside RAISE is replaced; verified beforehand that
-- no function uses '40001' in any other context. Affects 17 functions (persiapan, kalibrasi IRI,
-- konfirmasi Tahap 1, uji coba, scope + pindaan scope, validasi LRS, dokumen persiapan, admin peran).

do $$
declare f record; v_def text; v_new text; v_count integer := 0;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'app_private') and p.prosrc ~* 'errcode\s*=\s*''40001'''
  loop
    v_def := pg_get_functiondef(f.oid);
    v_new := regexp_replace(v_def, 'errcode(\s*)=(\s*)''40001''', 'errcode\1=\2''PT409''', 'gi');
    if v_new <> v_def then
      execute v_new;
      v_count := v_count + 1;
    end if;
  end loop;
  raise notice 'PT409: % functions rewritten', v_count;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public', 'app_private') and p.prosrc like '%40001%') then
    raise exception 'Masih ada fungsi yang memakai 40001';
  end if;
end $$;
