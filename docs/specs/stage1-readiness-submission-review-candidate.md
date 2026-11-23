# Stage 1 → Stage 2 → Provider/PIC handoff — source review

**State:** local implementation contract; SQL candidate only, not installed or authorized for production activation. Source: `docs/alur-qaqc/01_persiapan_kalibrasi_validasi_produksi_1791377623126.mermaid` (title cites KAK SKJ 2027), plus workflow-owner clarification from Afeeq.

## Transition table

| Actor / scope | Required records or evidence | Current state → action → resulting state | Revision / repeat behavior | Source |
|---|---|---|---|---|
| Provider → PIC Balai; one package, scoped to the package’s active declared-survey scope | Snapshot of the declared surveys and scope version, with matching package locations/teams; team/equipment assignments; calibration and rater-calibration records; team members and qualifications; persisted calibration checklists when present. IRI checklist remains one supporting record. | Package Stage 1 records → Provider requests PIC confirmation → `DIAJUKAN` with immutable versioned snapshot | Any correction is made in the existing Stage 1 draft records and requires a new submission. Stale expected version conflicts. | Owner clarification; installed declared-survey contract; K1–K8, lines 23–37; installed Stage 1 tables |
| PIC Balai; exact Balai assignment plus optional package assignment | Reads the submitted snapshot, not a changing live projection; may compare current records to the snapshot | `DIAJUKAN` → confirm suitability → `DISETUJUI`, or request correction → `PERLU_REVISI` with note | PIC cannot decide if submitted records changed after snapshot; Provider must resubmit. Stage 2 is allowed only while persisted decision is `DISETUJUI` and current snapshot still matches. | Owner clarification identifies PIC Balai as K7 authority; Stage 2 gate is the local contract |
| Provider; Stage 2 test is described per survey/team, package/Balai authorization still unspecified | Survey-specific Uji Coba scope V1–V8; comparisons H1–H4; bridge personnel check | Stage 2 test → compare against applicable criteria → D pass or fail | First failure → repeat the test. Repeated failure → open corrective-action case (diagram 04). Bridge-personnel failure → replace personnel and repeat bridge test. | V0–V8, H, H1–H4, D and JB, lines 39–72; `04_tindakan_perbaikan_koreksi_data_1791377623125.mermaid`, lines 5–22 |
| Provider → Pengguna Jasa/PIC; submission unit and Balai/package scope not specified | “Dokumen kalibrasi & validasi produksi data” and explanation of process; the chart does not enumerate a complete bundle | Successful Stage 2 checks → Provider submits documents → PIC checks documents and process | PIC clarification → return to submission (SUB). The chart does not define revision identity, versioning, response deadline, or whether a clarification creates a new submission. | SUB and CEK, lines 70–76 |
| Pengguna Jasa/PIC; approval scope not specified | Submitted evidence and process explanation; for bridges, bridge-specific permit follows | PIC accepts → BA Persetujuan Penggunaan Alat & Metode Kerja; bridge also receives Surat Izin Pemeriksaan → data collection | No rejection decision or post-acceptance resubmission behavior is stated here. | BA and NEXT, lines 75–78; diagram 02 starts from the BA, line 5 |

## Checklist and submission-unit conclusion

The IRI calibration checklist is a **supporting, per-survey Stage 1 record**, not the complete submission unit and not an approval record. The package-wide submission unit uses `paket_survei_kontrak` as its authority; observed locations and team rows do not create or expand declared survey scope. The snapshot includes that declared scope/version and only matching package locations/teams, equipment assignments, calibration/rater records, team membership/qualifications, and persisted calibration checklists where present. The source catalog has survey-specific checklists for IRI, PCI Manual/AI, Lendutan, Jembatan, Lereng, Drainase, Lalu Lintas, and RNI. No answer-count or all-“Ya” rule is applied. This Stage 1 decision is separate from the Stage 2 document/process review and BA at SUB–BA (lines 73–78).

## Existing technical boundary

- The installed IRI checklist operations read/save a versioned draft and audit the save; they do not calculate K7 readiness, submit a package, review evidence, or progress a stage (`backend/src/routes/paket.ts`; see also `docs/specs/stage1-checklist-contract.md`).
- Existing `uji_coba` submission/review is a separate Stage 2 workflow. Its RPC pattern has expected-version checks, submission snapshots and audit (`backend/db-reference/uji-coba-pengajuan-applied.sql`), but its unit is one trial and its local preconditions do not establish the chart's full survey scope or authoritative thresholds. The evaluation preview explicitly labels its threshold set DRAFT and not a submission gate (`backend/db-reference/uji-coba-evaluasi-preview.sql`, lines 3–5).
- Reuse those version/audit patterns only after a Stage 1/Stage 2 business contract is approved. Do not repurpose Tahap 0 operations, make the IRI checklist a package approval, or broaden role/scope authorization.
- Draft saves remain on their existing contracts. The approval snapshot is generated only when the Provider submits; it does not change draft-save behavior. Stage 2 trial/section/measurement/evaluation writes are guarded server-side against a current `DISETUJUI` snapshot.
- One SQL candidate is at `backend/proposals/stage1-pic-calibration-confirmation-candidate.sql`. It is not installed. Production API/UI activation also remains off until the candidate is approved, installed, and its authorization contract verified.

## Owner decisions required (maximum three)

1. **Which evidence items are mandatory for each survey’s PIC suitability review?** K1–K6 describe equipment/personnel/calibration/training/checklist categories but do not enumerate a complete required-record manifest; the 30-item IRI checklist is not a package gate. The implementation snapshots all persisted records within declared scope and leaves suitability to PIC. A separately approved survey-specific manifest is still needed before the system can report completeness or prevent confirmation for a missing item.
2. **Which controlled threshold edition gates Stage 2 validation?** Diagram 01 cites KAK SKJ 2027 (title and H1–H4, lines 52–62), whereas the available IRI evaluation preview labels its KAK 2026 thresholds DRAFT and non-gating. Do not infer readiness from the preview or hard-code these values as a production gate.

## Local verification boundary

The local UI/API contracts and SQL candidate are review-only until activation approval. No live submit, review, approval, progression, remote write, migration, RPC installation, or permission change is performed or implied.
