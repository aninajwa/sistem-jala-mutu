# Stage 4 LRS migration — installed record

Read-only Supabase migration-ledger inspection on 2026-11-11 reported:

- Version: `20261111080955`
- Name: `stage4_lrs_save_read`
- State: present in the connected project's migration history (already applied)

The installed public contracts were also inspected read-only:

- `public.baca_validasi_lrs(p_paket_id integer) returns jsonb`
- `public.simpan_validasi_lrs(p_paket_id integer, p_ruas_id integer, p_expected_version integer, p_data jsonb) returns jsonb`

Both public wrappers are owned by `postgres`, use an empty `search_path`, grant EXECUTE to `authenticated`, and deny EXECUTE to `anon`. Their `app_private` implementations are `SECURITY DEFINER`, owned by `postgres`, and use an empty `search_path`. `app_private.assert_validasi_lrs_access` is not executable by `authenticated` or `anon`. The read contract returns a JSON array (currently expected empty because no validation records exist); the save contract returns one JSON object.

**Do not add this installed version to a pending migration queue or reapply SQL.** This record documents remote state only; it is not a new SQL migration and does not certify a deployment artifact's byte-for-byte identity. `backend/proposals/stage4-lrs-save-read-candidate.sql` is retained as the reviewed candidate/reference, not as a command to run.

`STAGE4_LRS_RPCS` remains `false`. The RPC's authenticated readback has not yet been exercised with an authorized user/package token.

## Guarded read-only check

`backend/scripts/stage4-lrs-readback-check.mjs` calls only `baca_validasi_lrs`; it never calls the save RPC. To run it, provide `STAGE4_READBACK_CONFIRM=YES_READ_ONLY`, `STAGE4_READBACK_EXPECTED_PROJECT_REF`, matching `STAGE4_READBACK_SUPABASE_URL`, `STAGE4_READBACK_PACKAGE_ID` for a package the signed-in user is authorized to read, `STAGE4_READBACK_PUBLISHABLE_KEY`, and that user's non-expired JWT in `STAGE4_READBACK_ACCESS_TOKEN`. It rejects service-role/anon JWT claims and project-ref mismatches, validates the response scope, and does not print credentials or row contents. No remote request was made while preparing this check.
