import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const route = await readFile(new URL('../src/routes/stage4-lrs.ts', import.meta.url), 'utf8');
const schema = await readFile(new URL('../src/schemas/stage4-lrs.ts', import.meta.url), 'utf8');
const proposal = await readFile(new URL('../proposals/stage4-validation-submit-review-candidate.sql', import.meta.url), 'utf8');

test('Stage 4 status uses installed read-only RPC independently of opt-in lifecycle mutations', () => {
  assert.match(route, /process\.env\.STAGE4_WORKFLOW_RPCS/);
  assert.match(route, /stage4StatusRpcEnabled = \(\) => true/);
  assert.match(route, /status: stage4StatusRpcEnabled\(\), submit: stage4WorkflowRpcEnabled\(\), review: stage4WorkflowRpcEnabled\(\)/);
  assert.match(route, /router\.get\('\/paket\/:id\/validasi-lrs-status'/);
  assert.match(route, /rpc\/baca_status_validasi_lrs/);
  assert.match(route, /value\.progression_allowed/);
  assert.match(route, /blockers\.map\(blocker => blocker\.message\)/);
  assert.doesNotMatch(route, /router\.get\('\/paket\/:id\/validasi-lrs-status'[\s\S]*STAGE4_WORKFLOW_RPCS/);
  assert.match(proposal, /SMD_VERIFICATION_UNAVAILABLE/);
  assert.match(proposal, /technical PASS, or permission for Tahap 5/);
});

test('submit/review have expected-version strict schemas and distinct role boundaries', () => {
  assert.match(schema, /stage4WorkflowVersionSchema[\s\S]*expected_version: version/);
  assert.match(schema, /stage4WorkflowReviewSchema[\s\S]*PERLU_REVISI[\s\S]*DISETUJUI/);
  assert.match(schema, /Catatan wajib diisi apabila meminta revisi/);
  assert.match(route, /router\.post\('\/paket\/:id\/validasi-lrs\/submit'[\s\S]*role\.nama === 'penyedia_jasa'/);
  assert.match(route, /router\.post\('\/paket\/:id\/validasi-lrs\/review'[\s\S]*role\.nama === 'pic_balai'/);
  assert.match(route, /p_expected_version: parsed\.data\.expected_version/);
});

test('candidate requires atomic versioning, audit and no progression while rules are pending', () => {
  assert.match(proposal, /create table app_private\.validasi_lrs_workflow/i);
  assert.match(proposal, /unique \(paket_id, versi\)/i);
  assert.match(proposal, /for update/i);
  assert.match(proposal, /p_expected_version/);
  assert.match(proposal, /insert into public\.audit_trail[\s\S]*SUBMIT_STAGE4/);
  assert.match(proposal, /insert into public\.audit_trail[\s\S]*REVIEW_STAGE4/);
  assert.match(proposal, /EVIDENCE_POLICY_UNRESOLVED/);
  assert.match(proposal, /SMD_VERIFICATION_UNAVAILABLE/);
  assert.match(proposal, /Remeasurement_required|REMEASUREMENT_REQUIRED/i);
  assert.match(proposal, /revoke all on function public\.ajukan_validasi_lrs[\s\S]*grant execute[\s\S]*to authenticated/i);
  assert.match(proposal, /DO NOT APPLY to shared Supabase/);
});

test('candidate SQL guards nulls, serializes package versions, scopes roles, and keeps history', () => {
  assert.match(proposal, /current_user <> 'postgres'/);
  assert.match(proposal, /from \(select distinct lp\.ruas_id from public\.lokasi_pekerjaan/);
  assert.match(proposal, /LENGTH_INCOMPLETE/);
  assert.match(proposal, /abs\(v\.panjang_lapangan_m-v\.panjang_acuan_m\)>30/);
  assert.match(proposal, /p_expected_version is null or p_expected_version<0/);
  assert.match(proposal, /p_expected_version is null or p_expected_version<1/);
  assert.match(proposal, /p_keputusan is null or p_keputusan not in/);
  assert.match(proposal, /r\.nama='pic_balai'[\s\S]*pp\.scope_balai_id=v_balai[\s\S]*pp\.scope_paket_id is null or pp\.scope_paket_id=p_paket_id/);
  assert.match(proposal, /perform app_private\.assert_validasi_lrs_access\(p_paket_id,true\)/);
  for (const functionName of ['ajukan_validasi_lrs', 'review_validasi_lrs']) {
    const start = proposal.indexOf(`function public.${functionName}`);
    const end = proposal.indexOf('end $$;', start);
    const body = proposal.slice(start, end);
    const packageLock = body.indexOf('from public.paket_kontrak where paket_id=p_paket_id for update');
    assert.notEqual(packageLock, -1);
    assert.ok(packageLock < body.indexOf('app_private.stage4_actor(p_paket_id'));
    assert.match(body, /p_expected_version/);
    assert.match(body, /errcode='40001'/);
    const versionConflict = body.indexOf("errcode='40001'");
    const stateInsert = body.indexOf('insert into app_private.validasi_lrs_workflow');
    assert.ok(versionConflict >= 0 && versionConflict < stateInsert, `${functionName} must reject replay/stale versions before inserting another event`);
  }
  assert.match(proposal, /state not in \('PERLU_REVISI'\)/);
  assert.match(proposal, /v_old\.state<>'DIAJUKAN'/);
  assert.match(proposal, /unique \(paket_id, versi\)/i);
  assert.match(proposal, /state text not null check \(state in \('DIAJUKAN','PERLU_REVISI','DISETUJUI'\)\)/);
});

test('candidate audit writes share the mutation transaction and evidence/SMD uncertainty stays blocking', () => {
  assert.match(proposal, /begin;[\s\S]*commit;/);
  assert.match(proposal, /insert into public\.audit_trail\(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu\)[\s\S]*SUBMIT_STAGE4/);
  assert.match(proposal, /insert into public\.audit_trail\(pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu\)[\s\S]*REVIEW_STAGE4/);
  assert.match(proposal, /EVIDENCE_POLICY_UNRESOLVED/);
  assert.match(proposal, /MISSING_EVIDENCE/);
  assert.match(proposal, /SMD_VERIFICATION_UNAVAILABLE/);
  assert.match(proposal, /jsonb_array_length\(v_gate->'blockers'\)>0/);
  assert.match(proposal, /p_keputusan='DISETUJUI'[\s\S]*jsonb_array_length\(v_gate->'blockers'\)>0/);
  assert.doesNotMatch(proposal, /update public\.validasi_lrs|set\s+(?:status|tgl_valid)\s*=/i);
});

test('submission snapshots all required package roads and binds exact LRS identities/versions', () => {
  assert.match(proposal, /primary key \(workflow_id, ruas_id\)/);
  assert.match(proposal, /validasi_lrs_id integer not null references public\.validasi_lrs/);
  assert.match(proposal, /validasi_lrs_version integer not null/);
  assert.match(proposal, /from \(select distinct lp\.ruas_id from public\.lokasi_pekerjaan/);
  assert.match(proposal, /v\.paket_id=p_paket_id and v\.ruas_id=required\.ruas_id/);
  assert.match(proposal, /v_required_roads<>v_captured_roads/);
  assert.match(proposal, /perform app_private\.stage4_capture_submission\(p_paket_id,v_new\.workflow_id\)/);
  assert.match(proposal, /MISSING_LRS_FOR_REQUIRED_ROAD/);
  assert.match(proposal, /PACKAGE_ROADS_UNDEFINED/);
  assert.match(proposal, /on v\.paket_id=lp\.paket_id and v\.ruas_id=lp\.ruas_id[\s\S]*abs\(v\.panjang_lapangan_m-v\.panjang_acuan_m\)>30/);
  assert.doesNotMatch(proposal, /create or replace function public\.(?:baca|simpan)_validasi_lrs/);
  assert.doesNotMatch(proposal, /update public\.validasi_lrs/);
});

test('post-submit LRS or document changes stale that submission and block approval without deleting history', () => {
  assert.match(proposal, /or x\.versi is distinct from s\.validasi_lrs_version/);
  assert.match(proposal, /LRS_SNAPSHOT_STALE/);
  assert.match(proposal, /v_gate := app_private\.stage4_blockers\(p_paket_id,v_old\.workflow_id\)/);
  assert.match(proposal, /or v\.dok_versi_id is distinct from m\.source_version_id/);
  assert.match(proposal, /EVIDENCE_SNAPSHOT_STALE/);
  assert.match(proposal, /not exists \(select 1 from app_private\.validasi_lrs_workflow_evidence m[\s\S]*m\.source_record_id=d\.dokumen_id/);
  assert.match(proposal, /insert into app_private\.validasi_lrs_workflow\(paket_id,versi,state,catatan,submission_workflow_id,actor_pengguna_id\)/);
  assert.match(proposal, /DISETUJUI'[\s\S]*jsonb_array_length\(v_gate->'blockers'\)>0/);
  assert.doesNotMatch(proposal, /delete from app_private\.validasi_lrs_workflow/);
});

test('server evidence manifest links persisted document versions and never records official assertions', () => {
  assert.match(proposal, /source_type text not null check \(source_type = 'DOKUMEN'\)/);
  assert.match(proposal, /source_record_id integer not null references public\.dokumen/);
  assert.match(proposal, /source_version_id integer references public\.dokumen_versi/);
  assert.match(proposal, /evidence_type text not null/);
  assert.match(proposal, /manifest_status text not null check \(manifest_status in \('CAPTURED_UNVERIFIED','VERSION_MISSING','SOURCE_UNAVAILABLE'\)\)/);
  assert.match(proposal, /select p_workflow_id,'DOKUMEN',d\.dokumen_id,v\.dok_versi_id,d\.sumber_tipe,d\.sumber_id,d\.judul,[\s\S]*coalesce\(j\.kode,'UNCLASSIFIED'\),d\.status/);
  assert.match(proposal, /source_subtype text[\s\S]*source_context_id integer[\s\S]*source_title text/);
  assert.match(proposal, /MISSING_EVIDENCE/);
  assert.match(proposal, /SMD_VERIFICATION_UNAVAILABLE/);
  assert.doesNotMatch(proposal, /p_smd_valid|p_gate_state|manifest_status[^;]*'VALID'/i);
});

test('live status contract is validated server-side and cannot unlock pending progression', () => {
  assert.match(route, /validStates = \['PENDING_RULES', 'DRAFT', 'DIAJUKAN', 'PERLU_REVISI', 'DISETUJUI'\]/);
  assert.match(route, /validGates = \['PENDING', 'PASS', 'FAIL'\]/);
  assert.match(route, /typeof value\.progression_allowed !== 'boolean'/);
  assert.match(route, /value\.gate === 'PENDING' \|\| value\.state === 'PENDING_RULES'[\s\S]*\? false : value\.progression_allowed/);
  assert.match(route, /router\.post\('\/paket\/:id\/validasi-lrs\/submit'[\s\S]*if \(!stage4WorkflowRpcEnabled\(\)\)/);
  assert.match(route, /router\.post\('\/paket\/:id\/validasi-lrs\/review'[\s\S]*if \(!stage4WorkflowRpcEnabled\(\)\)/);
});
