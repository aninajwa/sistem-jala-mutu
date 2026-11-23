# Server Review Queue and Phase 2 UI Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four defects found in the authenticated walkthrough of the merged Dirah UI. Then lock the flow in with a Playwright journey that runs against the real API.

**Architecture:**
- The backend gets one aggregate read endpoint, `GET /api/review-queue`. It returns server submission states as rows shaped like Dirah's `BalaiReviewItem`, so the Dirah dashboard, verification page and package catalog can render server truth instead of local projections.
- The scope-amendment routes get a fail-closed feature gate and a capabilities endpoint, so the UI hides the panel instead of showing a 503.
- The stage rail receives completed stages from the server stage facts.

**Tech Stack:** Express 5 + zod (backend, `node --test` with a mocked Supabase), React 19 + wouter (frontend, `node --import tsx --test`), Playwright 1.64 (journey script).

**Spec:** findings in the 2026-11-23 session walkthrough. They are also recorded in `docs/WORKFLOW_COMPLETION_STATUS.md` §1–§3.

## Global Constraints

- The backend calls Supabase only through `supabaseRequest` with the caller's token. No service-role key. No direct table writes.
- New feature gates are fail-closed: the value must be exactly `'true'`.
- Admin stays read-only on workflow writes (`denyAdminWorkflowWrites`).
- The UI copy is Indonesian.
- Playwright credentials come only from the environment variables `JM_PROVIDER_EMAIL`, `JM_PROVIDER_PASSWORD`, `JM_PIC_EMAIL` and `JM_PIC_PASSWORD`. They are never written to files.
- The journey script is read-only: no POST, PATCH or DELETE.

## Review Focus

1. **A PIC with zero packages in scope.** The queue returns `[]` with status 200, and the dashboard shows the empty state, not an error.
2. **One package's RPC fails, for example 403 on a package outside the caller's scope.** The endpoint still returns the other packages' rows and sets `partial: true`. It must not return a 500.
3. **The Stage 1 confirmation gate is disabled.** No Tahap 1 row is emitted and nothing throws 503.
4. **The scope-amendment gate is off.** `GET /paket/:id/scope-amendment-capabilities` returns `{enabled:false}`, the other scope-amendment routes return 503, and the panel renders nothing.
5. **Provider login.** The review queue still loads, but the PIC-only queue UI is not shown to providers.

---

### Task 1: Backend `GET /api/review-queue`

**Files:**
- Create: `backend/src/services/review-queue.ts`
- Create: `backend/src/routes/review-queue.ts`
- Modify: `backend/src/routes/paket.ts` (mount the router after `requireAuth`)
- Test: `backend/tests/api.test.mjs` (mock and tests)

**Interfaces:**
- Produces: `GET /api/review-queue` → `{ data: ReviewQueueRow[], partial: boolean }`, where
  `ReviewQueueRow = { paket_id:number; nama_paket:string; balai_id:number|null; tahap:'Tahap 0'|'Tahap 1'|'Tahap 2'; jenis:string; status:string; uji_coba_id?:number }`.
- `buildReviewQueue(token: string, request = supabaseRequest): Promise<{rows: ReviewQueueRow[]; partial: boolean}>` in `services/review-queue.ts`.
  - It reads up to 20 pages of `paket_kontrak` with the same select as `GET /paket`.
  - Per package it calls `baca_pengajuan_persiapan` (→ Tahap 0, jenis `Review persiapan`).
  - Per package it calls `baca_konfirmasi_kalibrasi_tahap1`, but only when `stage1ConfirmationEnabled()` (→ Tahap 1, jenis `Konfirmasi kalibrasi`).
  - Per package it calls `ambil_senarai_uji_coba` (→ one Tahap 2 row per trial, jenis `Uji coba #<id>`).
  - Package calls run with at most 8 packages concurrently. A failing call for one package sets `partial` and skips that package.

- [ ] Step 1: Write failing tests in `api.test.mjs`:
  - `review queue returns server submission rows for each visible package`: as reviewer → 200. Rows include `{paket_id:3,tahap:'Tahap 0',status:<mock persiapan status>}`, `{paket_id:3,tahap:'Tahap 1',status:'DISETUJUI'}` and a Tahap 2 row per mocked trial.
  - `review queue requires login`: no token → 401.
  - `review queue marks partial when one package read fails`: a mocked package whose `baca_pengajuan_persiapan` returns 403 is skipped and `partial === true`.
- [ ] Step 2: Run `cd backend && npm test`. Expected: the three new tests fail with 404.
- [ ] Step 3: Implement the service and route, and mount the route in `paket.ts`.
- [ ] Step 4: Run `npm test` and `npm run typecheck`. Expected: all pass.
- [ ] Step 5: Commit `feat(backend): aggregate review queue endpoint`.

### Task 2: Scope-amendment gate (backend and frontend)

**Files:**
- Modify: `backend/src/routes/package-scope-amendment.ts`
- Modify: `backend/.env copy.example`
- Modify: `README.md` (gate table)
- Modify: `frontend/src/pages/packageScopeAmendmentData.ts`
- Modify: `frontend/src/pages/PackageScopeAmendmentPanel.tsx`
- Test: `backend/tests/api.test.mjs`, `frontend/src/pages/packageScopeAmendmentData.test.ts`

**Interfaces:**
- Gate: `PACKAGE_SCOPE_AMENDMENT_RPCS`.
- `GET /paket/:id/scope-amendment-capabilities` → `{data:{enabled:boolean}}`. It is always 200.
- When the gate is not exactly `'true'`, the GET, POST and review routes return 503 with the message `Penambahan jenis survei belum diaktifkan; migrasi pindaan scope belum dipasang.`
- Frontend: `getScopeAmendmentCapabilities(packageId: string, request?): Promise<{enabled:boolean}>`. The panel returns `null` when `enabled === false`.

- [ ] Step 1: Failing backend tests:
  - With the gate off: capabilities → `{enabled:false}` and the GET → 503.
  - With the gate on: the existing scope-amendment behaviour holds. The test server env sets the gate to `'true'`, and a second server instance runs with the gate off.
- [ ] Step 2: Failing frontend test: `getScopeAmendmentCapabilities` parses `{data:{enabled:false}}` and rejects malformed bodies.
- [ ] Step 3: Implement both sides.
- [ ] Step 4: Run `backend npm test` and `frontend npm run test:domain` (add the new test file to the script). Both must pass.
- [ ] Step 5: Commit `feat: gate package scope amendment until its migration is installed`.

### Task 3: Frontend uses the server review queue in auth mode

**Files:**
- Create: `frontend/src/pages/serverReviewQueue.ts` (fetch, parse and map)
- Create: `frontend/src/pages/serverReviewQueue.test.ts`
- Modify: `frontend/src/types.ts` (`PageProps.serverReviewQueue?: BalaiReviewItem[]`)
- Modify: `frontend/src/App.tsx`. When authenticated and the role is PIC, Direktorat or Admin, load the queue once per session and pass it in `pageProps`.
- Modify: `frontend/src/pages/DashboardPage.tsx:785`, `PackagesPage.tsx:69` and `VerificationPage.tsx:59`. Each becomes `p.serverReviewQueue ?? balaiReviewQueue(packages)`.
- Modify: `frontend/package.json` (`test:domain` includes the new test)

**Interfaces:**
- Consumes: Task 1's response.
- `parseReviewQueue(body: unknown): {rows: ReviewQueueRow[]; partial: boolean}`. It throws `Error('Format antrean pemeriksaan tidak sesuai.')` when the body is malformed.
- `reviewQueueToBalaiItems(rows: ReviewQueueRow[], balaiName: (id:number|null)=>string): BalaiReviewItem[]`.
  - Status maps `DIAJUKAN`→`'Perlu Review'`, `PERLU_REVISI`→`'Perlu Perbaikan'`, `DISETUJUI`→`'Selesai/Lulus'`, anything else→`'Menunggu'`.
  - Selection comes from `PACKAGE_WORKFLOW_ITEMS` by `tahap`. `packageId` is `String(paket_id)`.

- [ ] Step 1: Failing tests:
  - The mapping table above.
  - The malformed body throws.
  - The `id` is unique per `paket_id`, `tahap` and `uji_coba_id`.
- [ ] Step 2: Implement, then wire into App and the three pages.
- [ ] Step 3: Run typecheck and `test:domain`. Both must pass.
- [ ] Step 4: Commit `feat(frontend): render the PIC review queue from the server`.

### Task 4: Stage rail marks server-completed stages

**Files:**
- Modify: `frontend/src/design/b/StageNavigator.tsx` (optional prop `completedStages?: ReadonlySet<string>`; a stage is done if it is in the set, otherwise the existing `process`-based logic applies)
- Modify: `frontend/src/workflow/PackageHub.tsx` (in server mode pass a set built from `serverStageStatuses` entries whose `state === 'complete'`)
- Test: `frontend/src/design/b/presentation.test.ts` or a new `stageNavigatorCompletion.test.ts` (render via source assertion or a pure helper `stageDone(code, process, completed?)`)

- [ ] Step 1: Failing test for the pure helper `stageDone(code: string, process: string, completed?: ReadonlySet<string>): boolean`.
- [ ] Step 2: Implement the helper, use it in `StageNavigator`, and pass `completedStages` from `PackageHub`.
- [ ] Step 3: Run the tests and typecheck. Both must pass.
- [ ] Step 4: Commit `fix(frontend): stage rail shows stages completed on the server`.

### Task 5: Stage 1 duplicate reads

**Files:**
- Modify: `frontend/src/pages/ServerStage1DirahWorkspace.tsx` (and any panel that refetches the same team resources on mount)

- [ ] Step 1: Use systematic-debugging. Record the exact duplicate calls with Playwright (`/tim/10/personel`, `/tim/10/alat`, `/kualifikasi`) and find their call sites.
- [ ] Step 2: Remove the redundant load: either share the parent's loaded data with the child panel, or remove the second effect trigger.
- [ ] Step 3: Re-run the capture. Each team resource must be fetched once per mount.
- [ ] Step 4: Commit `perf(frontend): load Stage 1 team resources once`.

### Task 6: Playwright server journey

**Files:**
- Create: `frontend/scripts/verifyServerJourney.ts`
- Modify: `frontend/package.json` (`"test:server-journey": "node --import tsx scripts/verifyServerJourney.ts"`)

**Behaviour:** the script requires the backend on :5000 and the frontend on :5173.
- For the provider and the PIC in turn, it:
  - logs in and asserts the Dirah home renders;
  - asserts `/packages` shows at least one `package-card-*`;
  - opens package `JM_PACKAGE` (default `3`) at Tahap 0, 1, 2, 3A and 4, and asserts each stage heading appears within 15 s.
- For the PIC, it also asserts the dashboard queue counts come from `/api/review-queue`: the response was received and no `Menunggu 30`-style local counts appear.
- Throughout, it fails on any 5xx API response, any `pageerror`, or any non-GET API request.
- It writes screenshots to `JM_SCREENSHOT_DIR` when that variable is set.

- [ ] Step 1: Write the script.
- [ ] Step 2: Run it with the credentials exported in the shell. It must exit with code 0.
- [ ] Step 3: Commit `test(frontend): authenticated read-only server journey`.

### Task 7 (needs user approval): Install the scope-amendment migration

`backend/proposals/migrations/20261118120000_package_survey_scope_amendment.sql` is marked "CANDIDATE FOR REVIEW ONLY". Installing it changes the shared Jala-Mutu database. **Do not run it without an explicit yes from the user.** After approval:

- [ ] Apply it via Supabase `apply_migration`.
- [ ] Run the security advisors.
- [ ] Set `PACKAGE_SCOPE_AMENDMENT_RPCS=true` in the local `.env`.
- [ ] Verify the panel with the Playwright journey.
