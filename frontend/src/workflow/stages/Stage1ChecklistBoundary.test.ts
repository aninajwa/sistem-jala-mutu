import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const src = new URL('../../', import.meta.url);
const [checklist, stage1, policy, routes, activation, editor, dirah, editorApi, stage2Workspace] = await Promise.all([
  readFile(new URL('workflow/SourceDocumentChecklist.tsx', src), 'utf8'),
  readFile(new URL('workflow/stages/Stage1CalibrationWorkspace.tsx', src), 'utf8'),
  readFile(new URL('workflow/stages/stageSupport.tsx', src), 'utf8'),
  readFile(new URL('../../../../backend/src/routes/paket.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../../../backend/src/services/stage1-iri-checklist-policy.ts', import.meta.url), 'utf8'),
  readFile(new URL('pages/Stage1IriDraftChecklist.tsx', src), 'utf8'),
  readFile(new URL('pages/ServerStage1DirahWorkspace.tsx', src), 'utf8'),
  readFile(new URL('pages/stage1IriChecklist.ts', src), 'utf8'),
  readFile(new URL('pages/ServerStage2Workspace.tsx', src), 'utf8'),
]);

test('legacy Stage 1 source-alignment checklist stays read-only without a server contract', () => {
  assert.match(policy, /checklistWrite:\s*false/);
  assert.match(policy, /localPersistence:\s*false/);
  assert.match(stage1, /editableRoles=\{serverReadOnly\s*&&\s*!SERVER_STAGE1_MUTATION_POLICY\.checklistWrite\s*\?\s*\[\]\s*:/);
  assert.match(stage1, /useLocalPersistence=\{localDraftsEnabled\}/);
  assert.match(stage1, /serverReadOnly\s*&&\s*!SERVER_STAGE1_MUTATION_POLICY\.checklistWrite\s*\|\|\s*!sourceCompletion/);
  assert.match(stage1, /Checklist kalibrasi: Belum terhubung ke server/);
  assert.match(checklist, /Baca saja · penyimpanan jawaban server belum tersedia\./);
  assert.match(checklist, /!useLocalPersistence&&<p className="stage-readonly-note">Checklist dan lampiran: Belum terhubung ke server\.<\/p>/);
});

test('installed IRI draft editor is Provider-enabled only and never exposes a submission/review action', () => {
  assert.match(stage1, /enabled=\{state\.role === "Penyedia Jasa \/ Ketua Tim"\}/);
  assert.match(editor, /enabled = false/);
  assert.match(editor, /disabled=\{!enabled \|\| saving\}/);
  assert.match(editor, /disabled=\{saving \|\| conflict \|\| !Object\.keys\(dirty\)\.length\}/);
  assert.match(editor, /Muat ulang versi server sebelum menggabungkan/);
  assert.match(editorApi, /Versi checklist berubah di server/);
  assert.match(dirah, /stage1-provider-pic-confirmation-flow/);
  assert.match(dirah, /Stage1PicConfirmationPanel/);
  assert.match(dirah, /Checklist IRI adalah rekod pendukung per survei, bukan pengajuan atau persetujuan lengkap Tahap 1/);
  assert.match(dirah, /K1–K6/);
  assert.match(dirah, /K7–K8/);
  assert.match(dirah, /V0–V8, H1–H4, D/);
  assert.match(dirah, /SUB–BA/);
  assert.match(dirah, /termasuk semua jawaban “Ya”—tidak menetapkan keputusan K7/);
  assert.match(dirah, /onNavigate=\{onNavigate\}/);
  assert.match(dirah, /Lanjut ke Tahap 2/);
  assert.match(stage2Workspace, /stage2Allowed/);
  assert.match(stage1, /if \(serverReadOnly\) return false/);
  assert.match(stage1, /Status kesiapan per jenis survei belum disediakan oleh server; belum dinilai/);
});

test('Tahap 0 routes remain isolated and Stage 1 candidate routes fail closed behind approval/authorization gates', () => {
  assert.match(routes, /router\.get\('\/paket\/:id\/checklist-persiapan'[\s\S]*baca_checklist_persiapan/);
  assert.match(routes, /router\.patch\('\/paket\/:id\/checklist-persiapan'[\s\S]*simpan_checklist_persiapan/);
  assert.match(routes, /router\.get\('\/paket\/:id\/checklist-kalibrasi/);
  assert.match(activation, /projectDraftAccepted !== 'true'[\s\S]*authorizationInstalled !== 'true'/);
  assert.match(routes, /baca_checklist_kalibrasi_iri/);
  assert.match(routes, /simpan_checklist_kalibrasi_iri/);
  assert.match(routes, /stage1ConfirmationRouter/);
});
