# Tahap 1 Calibration Checklist — Decision and Implementation Specification

**State:** internally accepted project draft; not an officially approved source/template, not installed, and not authorization for remote writes.  
**Scope:** Stage 1 checklist definition and draft answer persistence only. This does not define readiness, submission, PIC review, approval, or progression.

## 1. Source and provenance

### Candidate source

- Document: **CHECKLIST KALIBRASI DAN VALIDASI**, source path recorded in the local catalog as `Lampiran Checklist/checklist Survey IRI/CHECKLIST KALIBRASI DAN VALIDASI.docx`.
- Bundled asset: `frontend/public/checklist-sources/bd492d0bf8d7f96d.docx`.
- Catalog identity: `bd492d0bf8d7f96d`; survey `IRI`; phase `calibration`; SHA-256 `ab68855c227ec7ea681fcf3ff03a0b75157b14761e63a13d48bd08a5f8fd550d`.
- DOCX core properties report revision `3`, created 2025-03-10 and modified 2025-03-12. This is file metadata, **not evidence of an approved document revision**. The catalog has no official revision or page mapping. Do not assign an official revision or page numbers from this metadata.
- Stable source locations available in the DOCX/catalog are headings, tables, and printed row numbers. Page numbers are unavailable; source references below use those instead.
- Related workflow reference: `docs/alur-qaqc/01_persiapan_kalibrasi_validasi_produksi_1791377623126.mermaid`, Stage 1 K6 says checklist is “per jenis survei”; K1 describes equipment/personnel records; K7 is a workflow decision. This supports survey-specific scope but does not define who may edit/save or approve this checklist.

### Scope boundary

Project-draft decision: use the 30 IRI binary items under internal revision `CANDIDATE-IRI-CAL-01`. Section B, structured validation-result rows, and all other survey templates are deferred. This internal acceptance is not official source approval. The workflow diagram `docs/alur-qaqc/01_persiapan_kalibrasi_validasi_produksi_1791377623126.mermaid`, lines 21–29 (Tahap 1; K6: “Checklist Kalibrasi & Validasi per jenis survei”), plus catalog survey `IRI`, supports the IRI-only project draft; no other survey criteria are inferred.

### Source-backed items

All rows below have candidate answer type `choice(Ya,Tidak)` and `applicability=IRI`. `mandatory` remains **unresolved/null for every item**. The source offers a “Keterangan” column for checklist rows; the accepted draft persistence uses an optional trimmed note limited to 2,000 characters. Criteria are transcribed, not converted into automatic measurements or PASS/FAIL.

| Stable key | Source location | Source criterion |
|---|---|---|
| `IRI-CAL-2.1` | A. Checklist Kalibrasi dan Validasi Alat → 2. Kalibrasi Alat, row 2.1 | Sertifikat kalibrasi alat masih berlaku |
| `IRI-CAL-2.2` | same, row 2.2 | Kalibrasi transducer pengukur jarak (odometer) setelah pemasangan |
| `IRI-CAL-2.3` | same, row 2.3 | Kalibrasi jarak mencapai minimal 1 km |
| `IRI-CAL-2.4` | same, row 2.4 | Accelerometer diperiksa sesuai dengan prosedur pabrik |
| `IRI-CAL-2.5` | same, row 2.5 | Transducer laser dikalibrasi sesuai petunjuk pabrik |
| `IRI-CAL-2.6` | same, row 2.6 | Resolusi alat pengukur <0,1 mm |
| `IRI-CAL-2.7` | same, row 2.7 | Ketelitian pengukuran mencapai <0,1 mm |
| `IRI-CAL-2.8` | same, row 2.8 | Kalibrasi dilakukan setelah penggantian roda kendaraan |
| `IRI-CAL-2.9` | same, row 2.9 | Semua sensor berfungsi dengan baik |
| `IRI-CAL-2.10` | same, row 2.10 | Parameter kalibrasi sesuai standar SNI 3426:2022 |
| `IRI-VAL-3.1` | A. … → 3. Validasi Alat, row 3.1 | Validasi dilakukan pada minimal 3 lokasi (300 m/lokasi) |
| `IRI-VAL-3.2` | same, row 3.2 | Validasi mencakup nilai ketidakrataan <4, 4-6, dan >6 |
| `IRI-VAL-3.3` | same, row 3.3 | Pengukuran dilakukan minimal 3 kali per lajur roda |
| `IRI-VAL-3.4` | same, row 3.4 | Pengukuran dengan alat yang divalidasi dilakukan 5 kali pada 3 kecepatan berbeda |
| `IRI-VAL-3.5` | same, row 3.5 | Kecepatan validasi mencakup 40 km/jam, 50 km/jam, dan >60 km/jam |
| `IRI-VAL-3.6` | same, row 3.6 | Nilai gradien persamaan regresi (A) berada dalam rentang 0,95 ≤ A ≤ 1,05 |
| `IRI-VAL-3.7` | same, row 3.7 | Nilai intersep persamaan regresi (B) berada dalam rentang -0,25 ≤ B ≤ 0,25 m/km |
| `IRI-VAL-3.8` | same, row 3.8 | Nilai koefisien determinasi (R²) ≥ 0,95 |
| `IRI-VAL-3.9` | same, row 3.9 | Koefisien variasi (CV) dari 5 kali pengukuran ≤ 5% |
| `IRI-VAL-3.10` | same, row 3.10 | Bounce test dilakukan sebelum dan sesudah pengukuran |
| `IRI-GPS-4.1` | A. … → 4. GPS dan Pengukuran Jarak, row 4.1 | GPS memiliki ketelitian ±1m pada 90% waktu |
| `IRI-GPS-4.2` | same, row 4.2 | Odometer terkalibrasi |
| `IRI-GPS-4.3` | same, row 4.3 | Ketelitian pengukuran jarak mencapai 0,1% |
| `IRI-GPS-4.4` | same, row 4.4 | Pembacaan jarak berfungsi dengan baik |
| `IRI-GPS-4.5` | same, row 4.5 | Integrasi GPS-odometer berfungsi dengan baik |
| `IRI-DOC-5.1` | A. … → 5. Dokumentasi Kalibrasi, row 5.1 | Laporan hasil kalibrasi tersedia dan lengkap |
| `IRI-DOC-5.2` | same, row 5.2 | Foto saat kalibrasi tersedia |
| `IRI-DOC-5.3` | same, row 5.3 | Berita acara kalibrasi tersedia |
| `IRI-DOC-5.4` | same, row 5.4 | Sertifikat kalibrasi dari lembaga yang berwenang tersedia |
| `IRI-DOC-5.5` | same, row 5.5 | Data mentah hasil kalibrasi tersedia |

The source also has **1. Informasi Umum** fields (Nama Proyek, Nomor Kontrak, Lokasi, Tanggal Kalibrasi, Nama Petugas, Nama Supervisor) and **6. Hasil Validasi** with three locations and columns Nilai IRI Alat Referensi, Nilai IRI Alat yang Divalidasi, Selisih, Status. These are not yes/no checklist criteria:

- Project name and contract number can be displayed from package data, read-only, after their authoritative mapping is confirmed.
- Calibration date, location, operator/supervisor, the three validation result rows, and status have no proven mapping to installed Stage 1 records. Treat as user-entered structured fields only if the owner approves their semantics and types. Do not derive these or compute “Selisih”/`Status` automatically in this candidate.
- Do not treat the listed numeric thresholds as new acceptance rules; they are literal source text. Meaning, units, evidence, precision, and who verifies them remain owner-defined.

### Facts derived from server records (not answer rows)

Candidate response may expose a separate `context` object populated only from package-scoped authoritative data: package ID/name/contract number, linked IRI team, assigned equipment, equipment identifiers, calibration records, and personnel. These values must carry source record IDs and must not be writable through the checklist answer payload. The source document's “Nama Petugas” and “Nama Supervisor” cannot be auto-filled until the owner approves which team/personnel roles correspond. A linked calibration/equipment record is context/evidence, not an implicit “Ya” answer. No Stage 1 context mapping is asserted by this spec.

## 2. Existing schema and candidate SQL boundary

Read-only installed-schema inspection found the shared tables `public.checklist_template`, `checklist_item`, `checklist_pengisian`, and `checklist_jawaban`. Existing columns hold template identity, item code/description/section/order and nullable `wajib`, package-scoped filling/version/status, and nullable answer/note/evidence reference. The candidate adds only nullable `source_sha256` and `approval_state` metadata columns to `checklist_template`; it does not alter Stage 0 values or table grants/policies.

The installed answer constraint permits `Ya` / `Tidak` / null, which is sufficient for this explicitly narrowed binary slice. Structured rows and other answer types are deferred. `wajib` remains null. Existing filling status includes `DIAJUKAN`, `PERLU_REVISI`, and `DISETUJUI`; the candidate refuses every existing filling whose status is not exactly `DRAFT` and never updates status, conclusions, submissions, reviews, or approval fields.

The installed Tahap 0 functions are `public.baca_checklist_persiapan(integer) -> jsonb` and `public.simpan_checklist_persiapan(integer, integer, jsonb) -> jsonb`. The only installed template is `JM-PERSIAPAN-TAHAP0` / `DRAFT-01`, 25 items. These functions and template remain isolated and are not called for Stage 1.

### Installed authorization predicates used by this candidate

Read-only inspection of installed `app_private.assert_tahap_kalibrasi(integer) -> integer` confirmed: authenticated `auth.uid()` maps to an unlocked `public.pengguna`; that user must have `penyedia_jasa`; the target package must exist, have `created_by = pengguna.pengguna_id`, be `DRAFT`, and already have its Tahap 0 preparation checklist approved. Existing Stage 1 mutation RPCs call this helper before operating on package-scoped team/equipment/personnel rows. Candidate Provider reads/saves call or mirror that helper and also require null-or-matching `scope_paket_id` and null-or-matching `scope_balai_id` on the Provider role assignment.

Installed `app_private.baca_ruas_paket(integer)` has a matching role/scope pattern: Provider access requires `paket.created_by = pengguna_id` plus null-or-matching `scope_paket_id`; PIC read requires `scope_balai_id = paket.balai_id` plus null-or-matching `scope_paket_id`; unlocked identity is required. The candidate applies these explicit predicates to reads, with Provider limited to owned packages and PIC limited to scoped reads. Survey applicability is verified from `tim_survei.paket_id` joined to active `jenis_survei.kode='IRI'`; no client-supplied survey/master ID is trusted.

The first-slice candidate SQL is `backend/db-reference/stage1-iri-checklist-candidate.sql`. It reuses shared checklist tables for these 30 binary answers, adds source/internal-draft metadata, registers the internal candidate template/items, and defines isolated Stage 1 IRI RPCs. It is not installed and must not be run on shared Supabase without separate approval.

## 3. Local API contract and candidate RPC response

Names below are candidates only. Keep the existing authenticated Express/Supabase bearer-token path; no direct browser database access.

### Read

`GET /api/paket/:id/checklist-kalibrasi?survey=IRI`

Returns `{ data: { paket_id, survey: "IRI", template: { template_id, documentId, candidateRevision, officialRevision: null, sourceHash, approvalState: "INTERNAL_PROJECT_DRAFT" }, filling: { pengisian_id, version, answer_status: "DRAFT", updated_at }, items: [{ key, section, label, number, options: ["Ya","Tidak"], answerType: "choice", mandatory: null, applicability: ["IRI"] }], answers: { [key]: { value: "Ya"|"Tidak"|null, note: string|null } } } }`.

- `candidateRevision` is the internal version `CANDIDATE-IRI-CAL-01`; `officialRevision` is null. File metadata revision `3` is not an approved official revision.
- `approvalState` is `INTERNAL_PROJECT_DRAFT`; it must not be rendered as an officially approved template.
- Items include stable `key`, section, exact source label, source location, answer type/options, applicability, and `mandatory: null` until approved.
- Answers are keyed by stable item key and contain only `value` and `note`. Evidence payloads, context, and structured results are excluded from this first slice.
- Read must prove authenticated identity, active/unlocked user, access to this exact package, and applicable Balai/package scope using the installed authorization pattern. No cross-package IDs are accepted from the client.
- No write-side “create on read”; absent filling returns a filling object with `pengisian_id: null`, version `0`, `answer_status: "DRAFT"`, and `updated_at: null`, plus empty answers.

### Save draft answers

`PATCH /api/paket/:id/checklist-kalibrasi`

Candidate request:

```json
{
  "template_id": 123,
  "expected_version": 0,
  "answers": [
    { "key": "IRI-CAL-2.1", "value": "Ya", "note": null }
  ]
}
```

- Strict allowlist validation rejects unknown keys/protected fields, duplicate keys, invalid option values, wrong survey/template version, foreign package/template items, excessive note lengths, and client-supplied status/approval/context. Save supports partial drafts; null means unanswered. Structured result fields are deferred.
- Require authenticated, unlocked user and exact package access/scope. Writes require `penyedia_jasa` **and** installed ownership (`created_by = pengguna_id`) and role-scope predicates; role alone does not authorize a write. This is the inspected installed package-management relationship, not a frontend role-label inference.
- One atomic RPC locks the package/filling, checks `expected_version`, writes only answer data, increments version, updates timestamp, and writes audit in the same transaction. Stale version returns SQLSTATE `40001`, mapped to HTTP `409` with safe reload guidance. No automatic retry.
- Save response is authoritative persisted readback in the same response shape (including incremented version and only persisted values); UI reports saved only after this response. Failed save leaves local unsaved edits distinct from server answers.
- Answer persistence may create/update only a draft filling. It does not set submission/review state, `kesimpulan`, `persen_lengkap` as readiness, approval fields, or navigation/progression. Completion percentage, if displayed, is descriptive only and never a gate.

## 4. Shared-object integration notes for Anin

The candidate reuses `public.checklist_template`, `public.checklist_item`, `public.checklist_pengisian`, and `public.checklist_jawaban`, plus Stage 1-specific read/save RPCs in `public`/`app_private`. It adds only nullable template provenance/state columns; binary answers fit existing constraints. It does not alter shared grants, RLS, authentication, existing Tahap 0 functions, or Admin APIs. It namespaces template identity and predicates every lookup on exact identity plus survey/package. Section 6 is deferred.

## 5. Resolved technical defaults and remaining activation decisions

The local draft implementation chooses partial updates: only keys present in `answers` change; omitted keys retain stored values; explicit null clears a choice. Notes are trimmed, optional, and limited to 2,000 characters, matching the established checklist note constraint. No evidence field is accepted in this slice because no Stage 1 evidence-link contract was found; unknown evidence/protected fields are rejected. A stale expected version maps SQLSTATE `40001` to HTTP 409, does not retry, and preserves the caller's unsaved edits. The response after save must be server-persisted readback with the incremented version. These are technical draft-persistence conventions, not completion or approval rules.

The local implementation identifies its internal candidate as `CANDIDATE-IRI-CAL-01`, retains the source SHA-256, has no official revision, and records `INTERNAL_PROJECT_DRAFT`. The Express endpoint fails closed unless internal-draft acceptance, installed authorization contract, and explicit activation are configured. No environment setting is enabled here.

Approved project-draft decisions:

1. Use the 30 IRI binary rows in `CANDIDATE-IRI-CAL-01`; internal project draft only.
2. Defer section B, structured result rows, other surveys, PIC editing/review, and all downstream workflow actions.
3. Penyedia Jasa may edit only packages managed through verified server-side ownership/assignment plus applicable role/package scope. PIC is read-only within authorized Balai/package scope.
4. Draft answers cannot submit, approve, or progress a package. Mandatory flags remain null.

Still unresolved before production activation:

1. Official source approval and official document revision/effective date remain unresolved. This does **not** relabel or invalidate the accepted internal draft; do not represent it as official.
2. Whether rows are mandatory/conditional or remain optional. No answer-count readiness rule is authorized; candidate `wajib` stays null.
3. Runtime activation is a separate approval after candidate installation and verified database/auth checks. The project owner has approved candidate preparation, not remote installation or write testing.

Sections 1 and 6 and other survey templates are explicitly deferred from this first binary draft slice. The source's “Ya/Tidak” choices and “Keterangan” column are reflected as the draft representation, but do not imply those answers are readiness criteria. The 30 items' stable keys and source locations are generated from the source catalog table/printed row numbering. Note length 2,000, partial merge, no evidence input, and optimistic concurrency are ordinary implementation defaults.

The candidate SQL creates two nullable `checklist_template` metadata columns and checks; a versioned candidate template; its 30 nullable-mandatory item rows; two candidate-specific unique indexes; two `app_private` functions and two `public` RPC wrappers. It does not create fills on read. It encodes the installed `app_private.assert_tahap_kalibrasi` boundary plus explicit package ownership/scope predicates; it does not infer access from role alone. It adds `EXECUTE` grants only for its two new public wrappers and two new private functions to `authenticated`, revoking their default `PUBLIC`/`anon` execution. It adds no table grants, RLS policies, or helper changes. Review is required before installation.

## 6. Explicitly out of scope

No checklist submit action, PIC review/approval, readiness gate, role transition, package status mutation, or next-stage navigation is specified. Those require their own approved authoritative workflow contract and must remain blocked independently of checklist answer completeness. Tahap 0 behavior is unchanged; Stage 4 Submit/Review and Tahap 5 remain blocked; no package-specific data or package 11 behavior is changed.
