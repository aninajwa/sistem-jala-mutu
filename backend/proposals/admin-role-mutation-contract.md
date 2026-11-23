# Admin role assignment mutation (local contract only)

**Status:** Express catalog/read/write routes exist. The read route is default-off behind `ADMIN_ROLE_READS_ENABLED`; all writes are fail-closed unless `ADMIN_ROLE_MANAGEMENT_ENABLED=true`. The consolidated SQL below is the source under runtime test; do not point this test package at a shared sandbox. The Hak Akses UI must remain preview-only until runtime evidence and separate activation approval.

## Existing contract facts

- Identity is Supabase Bearer JWT. Express `requireAuth` resolves `/auth/v1/user`, the matching unlocked `public.pengguna`, assignments, and joined role catalog. Admin is the existing exact `public.peran.nama = 'admin'` identifier.
- The installed `admin_daftar_pengguna(integer, integer, text)` returns `pengguna_id`, `username`, `terkunci`, and assigned role names plus nullable `scope_balai_id`/`scope_paket_id`.
- `pengguna_peran` is represented locally with `pp_id`, `pengguna_id`, `peran_id`, `scope_balai_id`, `scope_paket_id`. The `peran_id` is the catalog identifier; clients must obtain it from the Admin-only role catalog, never hardcode IDs. Read policies elsewhere equate `pic_balai.scope_balai_id` to `paket_kontrak.balai_id`; a non-null package scope must identify a package in that Balai.
- Audit writes elsewhere use `audit_trail(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu)`. The read RPC deliberately redacts raw snapshots and record IDs.
- Live schema facts supplied for this review: `pp_id` identity PK; integer FK columns; Balai/package FKs; `paket_kontrak.balai_id`; audit identity and documented payload columns. There is no assignment uniqueness constraint.

## API (registered; mutation gate remains off)

All requests require `Authorization: Bearer <Supabase user access token>`, `requireAuth`, and server-side `identity.roles.some(r => r.nama === 'admin')`. Pass the same user's JWT to PostgREST RPC. The database independently resolves `auth.uid()` and checks the caller's unlocked `pengguna` row and current `admin` assignment. Never accept actor ID, caller role, admin booleans, or use service-role credentials.

- `admin_daftar_peran_dapat_ditugaskan()` is the Admin-only role-catalog RPC in the consolidated install candidate. It independently authorizes via `auth.uid()` and returns only the approved assignable role `pic_balai` with its current `peran_id`; consumers must fetch it and never hardcode numeric role IDs. `GET /admin/users` remains the authorized user source.
- Proposed read-only API: `GET /api/admin/users/:pengguna_id/roles` (OpenAPI path `/admin/users/{pengguna_id}/roles`) calls `admin_daftar_penugasan_peran(p_pengguna_id)` using the same caller JWT. Response is `{ "data": [{ "pp_id": 41, "pengguna_id": 17, "peran_id": 8, "nama_peran": "pic_balai", "scope_balai_id": 4, "scope_paket_id": null, "mutation_version": "1" }] }`; empty assignments return `{"data":[]}`. `pp_id` identifies each assignment. `mutation_version` is SQL `bigint` serialized as decimal text, never a JS number.
- `POST /admin/users/{pengguna_id}/roles` body `{ "scope_balai_id": 3, "scope_paket_id": null }` adds one assignment. The server resolves `pic_balai` from the Admin-only catalog; callers cannot select a role ID. Returns 201 and the created assignment.
- `PATCH /admin/users/{pengguna_id}/roles/{pp_id}` requires `If-Match: "<version>"`; body `{ "scope_balai_id": 3, "scope_paket_id": 345 }` changes scope only (it cannot change `peran_id`). Returns 200 and the new assignment/version.
- `DELETE /admin/users/{pengguna_id}/roles/{pp_id}` requires `If-Match: "<version>"`; revokes exactly that assignment and returns 204. The precondition is a header, not a DELETE body.

V1 mutations are limited to `pic_balai` assignment tuples. Adding, changing, or revoking `admin`, `direktorat`, and `penyedia_jasa` assignments is prohibited; other catalog roles fail closed. PATCH changes only scope, never role. Reject all self-changes. Locked targets are rejected for add and scope change; revocation of another user's existing `pic_balai` assignment is allowed. No last-Admin rule applies because Admin assignment revocation is disabled. All UI changes remain local previews marked “Belum disimpan”; frontend writes must not be enabled before the database runtime matrix passes and activation is separately approved. Routes fail-closed by default; they never fall back to service-role or direct table access.

### V1 role/scope matrix

| Role | Candidate status | Scope rule |
|---|---|---|
| `admin` | All V1 mutations forbidden | Not applicable |
| `pic_balai` | Supported | Balai required and `balai.aktif IS TRUE`. Optional package must exist and `paket_kontrak.balai_id` must equal the chosen Balai. Null package means all packages in that Balai. |
| `penyedia_jasa`, `direktorat` | Forbidden in V1 | Not applicable |
| Other catalog names (including `pimpinan`) | Unresolved; rejected | No authoritative assignment-scope rule established |

Never infer scope semantics from display labels or read access alone. Candidate helper fails closed for all unresolved roles.

## RPC shape and transaction requirements

Proposed SQL RPCs (names/signatures, not installed):

```sql
-- admin_daftar_peran_dapat_ditugaskan() returns only the approved pic_balai ID
-- after Admin authorization. Frontend must fetch it; never hardcode role IDs.

public.admin_daftar_penugasan_peran(p_pengguna_id integer)
 returns table(pp_id integer, pengguna_id integer, peran_id integer,
   nama_peran text, scope_balai_id integer, scope_paket_id integer, mutation_version text)

public.admin_tambah_penugasan_peran(
 p_pengguna_id integer, p_peran_id integer,
 p_scope_balai_id integer, p_scope_paket_id integer
 ) returns table(pp_id integer, pengguna_id integer, peran_id integer,
   scope_balai_id integer, scope_paket_id integer, mutation_version text)

public.admin_ubah_penugasan_peran(
 p_pengguna_id integer, p_pp_id integer, p_expected_version bigint,
 p_scope_balai_id integer, p_scope_paket_id integer
 ) returns same as tambah

public.admin_cabut_penugasan_peran(
 p_pengguna_id integer, p_pp_id integer, p_expected_version bigint
 ) returns table(pp_id integer, revoked boolean)
```

The single install source is `backend/proposals/admin-role-management-v1-install.sql`. It consolidates the read function and PIC-only mutation RPCs with schema safeguards. The earlier `admin-role-assignment-read-rpc.sql` and `admin-role-mutation-v1-candidate.sql` are superseded fragments; do not install them separately. The read function checks `auth.uid()`, an unlocked `pengguna`, and an assigned exact `admin` role before target lookup; invalid/missing target maps to 400/404, absent identity 401, non-Admin 403. It returns deterministic rows ordered by `pp_id`, with bigint serialized as decimal text. SECURITY DEFINER uses fixed empty `search_path`, trusted `postgres` ownership, and EXECUTE only for `authenticated`; no RLS or table permission changes. The existing user-list RPC is unchanged.

Every mutation is one PostgreSQL transaction: acquire a transaction advisory lock, lock target/assignment rows (`FOR UPDATE`), recheck actor/Admin, compare expected version, validate target role and scope, mutate, then insert audit before commit. Audit failure rolls back the mutation. Audit `tabel='pengguna_peran'`, `record_id=pp_id::text`, actions `ASSIGN_ROLE`/`CHANGE_ROLE_SCOPE`/`REVOKE_ROLE`; snapshots contain only target ID, role identifier/name, and scopes. `waktu=localtimestamp` matches existing audit convention. Read RPC is SECURITY DEFINER, independently checks active Admin and returns bigint version as text.

Self-protection: reject any add/change/revoke where target user is the acting Admin. Reject mutations whose existing or requested assignment role is not `pic_balai`. No final-Admin revocation feature exists in V1.

Concurrency: package adds `mutation_version bigint NOT NULL DEFAULT 1`, a PostgreSQL 17 `UNIQUE NULLS NOT DISTINCT` index over `(pengguna_id, peran_id, scope_balai_id, scope_paket_id)`, and a `BEFORE UPDATE` trigger that replaces the version with `OLD.mutation_version + 1` for every row update, regardless of writer. RPCs compare `expected_version` under row lock; direct updates also advance the token, making prior reads stale. The unique index, not the advisory lock, is the cross-writer duplicate guarantee and treats NULL scope values as equal. An advisory transaction lock serializes this package's writes only. It does not constrain external writers, but database uniqueness/version trigger protect their inserts/updates too. Reviewed SQL search found test-only direct writes in `backend/tests/persiapan-akses.sql` and fixture seeding; no deployed-writer completeness can be inferred from this checkout. Existing table grants/RLS are unchanged.

## One-package installation order and recovery

Use only `backend/proposals/admin-role-management-v1-install.sql` after approval. Dependency graph:

1. Verify baseline `pengguna`, `peran`, `pengguna_peran`, `balai`, `paket_kontrak`, `audit_trail`, Supabase `auth.uid()`, ownership and existing ACL/RLS contracts.
2. In the candidate transaction, duplicate preflight groups all four assignment-key columns (including NULLs); stop if any group duplicates.
3. Add `mutation_version` with default 1; create the NULLS NOT DISTINCT unique index.
4. Install the all-writer version trigger and its private trigger function.
5. Install private authorization/scope helpers, then Admin read and three PIC-only mutation RPCs.
6. Set trusted owner, revoke PUBLIC/anon/authenticated from helpers, grant EXECUTE only on user-facing RPCs to authenticated; commit.
7. Run the isolated PG17 runtime matrix below. API route activation is a separate reviewed deployment and remains disabled here.

The SQL wraps DDL in one transaction; any error before COMMIT should roll back the complete installation. Verify actual deployment tooling/transaction behavior before use. After a successful commit, prefer forward-fix. If a security issue is found, immediately revoke EXECUTE from the four public RPCs and leave schema safeguards in place while repairing. Do not drop the version column/trigger/index or attempt to reverse audit/business changes automatically. Correct assignment rows only through a separately approved, audited repair. Dropping safeguards requires a separate maintenance plan and confirmation all writers are stopped.

### Isolated PostgreSQL 17 runtime test plan (not executed)

Use a disposable schema/database and synthetic users only; do not copy production identities, assignments, JWTs, or secrets. Test: (a) no JWT→28000; non-Admin, locked, or unlinked actor→42501; active Admin can read; (b) nonexistent target→P0002 and existing target with no assignments→empty result; returned `pp_id` distinguishes rows and maximum-safe bigint version remains exact text; (c) add valid PIC Balai-wide and package-scoped assignment; reject role names/IDs for Admin, Direktorat, Penyedia Jasa and other roles; reject self-add/change/revoke; reject locked target for add/change; (d) reject inactive/nonexistent Balai, nonexistent package and cross-Balai package; (e) duplicate tuples with NULL package rejected on sequential and concurrent inserts; (f) version advances on update via Admin RPC and direct SQL writer, stale version rejected, concurrent compare-and-swap allows one winner; (g) force `audit_trail` insert failure and prove add/change/revoke each fully roll back; (h) inspect function owners, `prosecdef`, `proconfig` search_path, grants, and confirm no table grant/RLS/policy changes. These are planned tests, not results.

Minimum runtime fixture: disposable PostgreSQL 17 database initialized with the required `auth.uid()` behavior and Supabase roles (`anon`, `authenticated`), plus synthetic compatible `pengguna`, `peran`, `pengguna_peran`, `balai`, `paket_kontrak`, and `audit_trail` tables. Install the single V1 package only in that disposable database; run all assertions in one transaction ending with `ROLLBACK`. The audit-failure case may use a transaction-local test trigger in this database only. For concurrency, use two independent sessions against that same disposable database; sequential SQL in one session is not evidence of a race test. Do not point the runner at either shared Jala Mutu sandbox.

Without PostgreSQL, the local, no-database checks are:

```powershell
node --test tests/admin-role-management-route.test.mjs tests/admin-role-mutation-contract.test.mjs tests/admin-role-mutation-v1-candidate.test.mjs
node --test --test-name-pattern="shared write flag remains off|test-only read gate permits" tests/api.test.mjs
```

These verify source contracts and mocked HTTP behavior only; they do not establish PostgreSQL transaction, trigger, lock, or audit-rollback behavior.

## Response contract

Envelope: errors `{ "error": "...", "code": "..." }`; successful reads/writes use `{ "data": ... }`. `DELETE` returns 204 with no body. Set `Cache-Control: private, no-store`.

| HTTP | Codes / meaning |
|---|---|
| 400 | `INVALID_REQUEST`, `ROLE_SCOPE_RULE_UNRESOLVED`, malformed IDs/body, unknown/nonassignable role, invalid scope shape |
| 401 | `UNAUTHENTICATED`, absent/invalid/expired JWT |
| 403 | `FORBIDDEN`, non-Admin/locked/unlinked actor, self-change, locked target for add/scope change, or forbidden role mutation |
| 404 | `USER_NOT_FOUND`, `ASSIGNMENT_NOT_FOUND`, `SCOPE_NOT_FOUND` (auth checked first) |
| 409 | `ASSIGNMENT_EXISTS`, `STALE_ASSIGNMENT`, `BALAI_INACTIVE`, `SCOPE_RELATION_CONFLICT` |
| 200 | scope change applied; returns updated assignment and version |
| 201 | assignment created |
| 204 | assignment revoked |

Do not expose raw Postgres error text. Map `28000`→401, `42501`→403, `22023`→400, missing rows→404, unique/version/invariant failures→409; unknown failures→500.

## Installation blockers

Before installation: resolve any duplicates; verify PostgreSQL 17 exact DDL, audit insert constraints, function/table owner privileges, and version-trigger behavior under each role used by other workflows. Use the Admin-authorized `admin_daftar_peran_dapat_ditugaskan()` read RPC to resolve `pic_balai`'s current `peran_id`; never hardcode the ID in frontend code. Confirm grants remain unchanged and define installation/rollback owner. Run the isolated matrix above. No PostgreSQL runtime PASS is established; `psql` and Docker are unavailable in the current environment. Express write routes remain registered but fail-closed unless `ADMIN_ROLE_MANAGEMENT_ENABLED=true`; do not enable this flag before the isolated matrix passes.

### Read-only assignment consumption

After controlled RPC installation and a separately reviewed read-gate activation, Hak Akses may fetch assignments for the selected user from the registered GET route. Render each assignment keyed by `pp_id`; use `mutation_version` only as a concurrency precondition, not as authorization. Keep the existing `/admin/users` RPC for user search/listing. Until the read path is approved and tested, the UI must continue to show only existing authorized list data and local “Belum disimpan” previews; mutation calls remain unavailable in the UI.
