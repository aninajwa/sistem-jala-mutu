# Jala Mutu workflow completion status

Repository code reviewed: 2026-11-18  
The working tree contains extensive staged, unstaged, and untracked changes. Local implementation status describes this checkout only. Database and workflow statements below are labeled by evidence source and are not inferred from proposal SQL or UI state.

This document separates local implementation, installed database support, and authenticated browser verification. A route or UI in the working tree does not prove that its RPC is installed, its feature gate is enabled, or that a live workflow was proven.

## Status snapshot

**Stage 1 handoff (2026-11-18):** Local code now recovers an ambiguous PIC review response through the authoritative GET and blocks another decision until status is rechecked if the result remains uncertain. Focused local tests and both typechecks passed. **Authenticated GET after this change is not verified in this session.** The user reports that the installed RPCs returned package 3 as `DIAJUKAN`, version 1, `pengajuan_trail_id` 217, matching snapshot, and no PIC decision; this remains user-reported evidence until Provider and authorized PIC GETs confirm it. The previously recorded `BELUM_DIAJUKAN`/version 0 read is older and conflicts with that report, so it is not treated as current.

**Next verification:** Use an already-authenticated Provider session and an authorized PIC session to GET package 3 after refresh, compare status/version/snapshot, and confirm `stage2_allowed=false`. No credential was read or used and no mutation was attempted in this update.

| Area | Code status | Database status | Authenticated browser status | Current evidence / gap |
|---|---|---|---|---|
| Authentication and package creation | Supabase login, `/api/me`, package list/detail, and create flow are implemented locally | The 2026-11-09 inspection found a package-draft RPC; current code calls `buat_paket_draft_dengan_scope`, whose availability/signature must be verified in isolated QA | Not end-to-end verified | Frontend roles come from the authenticated backend identity. Current local changes still need an authenticated create/readback check. |
| Tahap 0 preparation | Implemented locally: checklist, evidence link, PDF registration/upload, submit and PIC review routes/adapters | Required RPCs and private Storage bucket were verified previously; active project contains non-test records | Not end-to-end verified | Need an isolated test project and explicitly authorized writes to prove persistence. |
| Tahap 1 Provider/PIC confirmation | Local API adds the route-only `aktif` field; exact bigint audit IDs are preserved; Provider submit and PIC review recover ambiguous mutation responses only through GET. Unresolved outcomes set refresh-required and do not retry. | Prior installation/readback reports exist, including the user-reported package 3 version-1 submission; not rechecked live in this session. | No authenticated browser GET after the response-recovery changes | Focused local tests cover malformed/lost response recovery, version checks and no retry. Next proof: Provider and scoped PIC GET package 3 after refresh. Survey-specific mandatory evidence remains unresolved; PIC suitability is not inferred from answer counts. |
| Tahap 2 production validation | Server adapter and UI operations implemented locally | Required RPC contracts were previously verified present | Not end-to-end verified | Real persistence/review remains untested against an isolated database. |
| Tahap 3A survey sessions/segments | Server-backed input UI and adapters implemented locally | RPC contracts were previously verified present | Not end-to-end verified | Real authenticated writes and readback remain untested. |
| Tahap 3B periodic Verval | Workspace and API contracts exist locally; production calls are disabled unless `STAGE3B_PRODUCTION_RPCS=true` | 2026-11-09 inspection found read RPCs and a test/QA allowlisted create RPC; no production lifecycle RPCs | Not end-to-end verified | Production cycle creation, review, submission, and consistency writes still require installed, verified contracts. |
| Corrections | UI and Express route contracts exist locally; read/write calls are disabled unless `CORRECTION_PRODUCTION_RPCS=true` | 2026-11-09 inspection found only `baca_senarai_koreksi` and `baca_koreksi`; mutation RPCs were absent | Not end-to-end verified | Do not enable the feature gate. Authorization, state transitions, closure, and concurrency rules remain unresolved. |
| Tahap 4–6 preparation/audit/acceptance | Tahap 4 LRS read/write code exists behind `STAGE4_LRS_RPCS`; submit/review are behind `STAGE4_WORKFLOW_RPCS`. Tahap 5–6 UI remains local/demo. | LRS and workflow gates are off in the QA template; candidate contracts/migrations are not proof of installation. The 2026-11-09 inspection found no approved Tahap 4–6 lifecycle RPCs. | Not end-to-end verified | Stage 4 LRS persistence and submit/review need QA verification and approved rules. Stage 5–6 need server contracts, authorization, and lifecycle definitions. |

## Correction investigation (priority blocker)

Read-only catalog inspection of project `Jala-Mutu` found these correction RPCs installed:

- `baca_senarai_koreksi(p_paket_id integer)`
- `baca_koreksi(p_paket_id integer, p_koreksi_id integer)`

The following RPCs are called by `backend/src/routes/koreksi.ts` but were not found in the active public function catalog:

- `buat_koreksi`, `ubah_koreksi`, `verifikasi_koreksi`, `ajukan_koreksi`,
- `review_koreksi`, `laksana_koreksi`, `uji_ulang_koreksi`, `tutup_koreksi`.

The read RPCs are `SECURITY DEFINER`, have a fixed empty `search_path`, and grant `EXECUTE` to `authenticated` (not `anon`).

Repository SQL under `backend/proposals/koreksi-rpc-proposal.sql` is explicitly a design proposal, not a ready migration. Active schema inspection confirms only PK/FK constraints for the correction lifecycle tables; mutation tables do not expose a version column. The route schemas currently require `expected_version`, so this cannot provide database-enforced optimistic concurrency without an approved schema/business contract. The proposal also explicitly leaves provider ownership scope, surveyor/team-leader identity, PIC/revision semantics, retest authority/history, and close conditions unconfirmed.

**Safe conclusion:** do not generate/deploy write RPCs yet. Required business decisions are listed in “Human decisions required”.

## Tahap 3B and Tahap 4–6 inventory

- `backend/src/routes/siklus-verval.ts` contains production list/detail/consistency and create/write contracts, but production calls fail closed unless `STAGE3B_PRODUCTION_RPCS=true`. The 2026-11-09 database inspection found read RPCs and a test-only create RPC, not a complete production lifecycle. The current proposal migration must be reviewed and verified in QA before enabling the gate.
- The authenticated Tahap 3B workspace is `frontend/src/pages/ServerVervalWorkspace.tsx`; the original periodic workflow in `frontend/src/workflow/stages/Stage3PeriodicWorkspace.tsx` remains local/demo state and is not proof of server persistence.
- The current working tree includes authenticated Tahap 4 LRS endpoints/UI, but reads and writes fail closed unless `STAGE4_LRS_RPCS=true`. Submit/review is separately gated by `STAGE4_WORKFLOW_RPCS`; neither gate should be enabled based only on local code or candidate SQL. Tahap 5–6 authenticated lifecycle endpoints/contracts remain unavailable in the inspected implementation.
- Related database tables do not define transition rules or authorization. Do not add direct table writes; use approved, tested RPC contracts for lifecycle changes.

## Environment and verification limits

- The configured Supabase project has previously been described as containing existing package, checklist, document and approval records; it is not treated as an isolated test fixture. Its current environment classification has not been established here.
- No remote mutation, Storage upload, migration, or deployment was performed during this investigation.
- Local tests/typechecks do not prove authenticated server persistence. No authenticated browser journey was run for the Stage 1 status update.
- The focused correction read-RPC contract tests passed (2/2) when rerun outside the sandbox after Node's test runner failed with `spawn EPERM` inside it.
- `git diff --check` reported a pre-existing extra blank line at EOF in the already-modified `frontend/src/pages/serverStage3Data.test.ts`; that unrelated file was left untouched.

## Human decisions required before correction write RPCs

1. Which role owns each verification layer (surveyor, team leader, Balai) and how those identities map to authenticated profiles/assignments.
2. Whether the provider is authorized by `paket_kontrak.created_by`, `penyedia_id`, or another assignment relation.
3. Authoritative allowed values/mappings for `sumber_tipe`, `sumber_id`, `tahap_tertahan`, severity, action type, and correction status.
4. Whether PIC “Perlu Revisi” returns the case to draft, clears which verification records, and which actor may resubmit.
5. Whether retests are append-only attempts and who may record/review each attempt.
6. Who may close a correction at each blocked stage and the exact evidence/verification conditions for closure.
7. Concurrency strategy: approve adding version metadata/migration, or remove expected-version behavior in favor of an explicitly accepted locking/version mechanism.

## Smallest safe next sequence

1. Obtain the correction decisions above, especially authorization, state transitions, closure and concurrency.
2. Write and test local correction SQL migrations against an isolated database branch; do not apply them to the shared configured project.
3. Add contract tests for every RPC signature, role/state rejection, atomic history, version conflicts and returned readback shape.
4. Deploy only after a separate review/approval, then verify authenticated correction writes on an isolated test fixture.
5. In parallel after the business owner confirms scope, define Stage 1 readiness rules and Tahap 4–6 transition contracts before exposing those workflows as server-backed.

