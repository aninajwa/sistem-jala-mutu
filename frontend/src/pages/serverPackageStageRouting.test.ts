import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { serverPackageStage, SERVER_STAGE3A, SERVER_STAGE3B } from './serverPackageStageRouting';
import { PACKAGE_WORKFLOW_ITEMS } from '../workflow/roleNavigation';

test('Dirah screen registry covers every package stage route', async () => {
  const source = await readFile(new URL('../workflow/OperationalWorkflowWorkspace.tsx', import.meta.url), 'utf8');
  for (const item of PACKAGE_WORKFLOW_ITEMS) assert.ok(source.includes(`"${item.selection}"`), `missing Dirah screen mapping for ${item.selection}`);
  for (const component of ['Stage0PreparationWorkspace','Stage1CalibrationWorkspace','Stage2ProductionWorkspace','LocalStage3DailyWorkspace','Stage3PeriodicWorkspace','Stage4DataPreparationWorkspace','Stage5AuditWorkspace','Stage6AcceptanceWorkspace']) {
    assert.ok(source.includes(component), `missing original Dirah component ${component}`);
  }
});

test('authenticated server package workspace renders Dirah stage presentation read-only', async () => {
  const source = await readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8');
  const stage = await readFile(new URL('../workflow/stages/Stage0PreparationWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /<OperationalWorkflowWorkspace[\s\S]*?serverReadOnly/);
  assert.match(source, /serverPreparation=\{selection === PREPARATION \?/);
  assert.match(source, /mapPreparationChecklist\(checklist\.items\)/);
  assert.match(stage, /<GateSummary[\s\S]*?Kesiapan menuju Kalibrasi & Validasi Awal/);
  assert.match(stage, /workflow-role-block provider/);
  assert.match(stage, /workflow-role-block reviewer/);
  assert.match(stage, /renderChecklist\([\s\S]*?PREPARATION_SOURCE_REVIEWS/);
  assert.match(stage, /Panel title="Pengajuan ke PIC Balai"/);
  assert.doesNotMatch(stage, /data-testid="dirah-stage0-server"|<select aria-label=\{`\$\{item\.label\} · jawapan`\}/);
  assert.match(source, /selection === OVERVIEW \?[\s\S]*?stageOne \? content :/);
  assert.match(source, /serverStatusNote=\{readOnlyNote\}/);
});

test('read-only Dirah stages suppress local draft persistence and stage action controls', async () => {
  const source = await readFile(new URL('../workflow/OperationalWorkflowWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /DraftPersistenceBoundary enabled=\{false\}/);
  assert.match(source, /inert=\{props\.serverReadOnly&&!serverStage0\}/);
  assert.match(source, /props\.serverReadOnly && props\.serverPreparation/);
  assert.match(source, /!props\.serverReadOnly&&/);
  assert.equal(serverPackageStage(SERVER_STAGE3B), 'stage3b-readonly');
});

test('authenticated tri-state checklist cards stay expanded without changing demo wrapper behavior', async () => {
  const source = await readFile(new URL('../workflow/stages/useWorkflowStage.tsx', import.meta.url), 'utf8');
  assert.match(source, /RoleWorkSection primary=\{triState \? true : !disabled\}/);
  assert.match(source, /icon=\{icon\}/);
  assert.match(source, /title=\{displayText\(title\)\}/);
  assert.match(source, /checked: triState \? triState\[item\]\?\.answer === 'Ya' : !!checked\[item\]/);
});

test('authenticated app does not load or persist demo business state', async () => {
  const [app, packageStore, demoStore] = await Promise.all([
    readFile(new URL('../App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../hooks/usePackageStore.ts', import.meta.url), 'utf8'),
    readFile(new URL('../hooks/useDemoStore.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(app, /useDemoStore\(packageStore\.activeRole, !authenticatedRole\)/);
  assert.match(app, /if \(authenticatedRole\) return;[\s\S]*return startNotificationScheduler\(\)/);
  assert.match(packageStore, /authenticatedRole\s*\?\s*\{ \.\.\.createInitialPackageStore\(\), activeRole: authenticatedRole, activePackageId: null, packages: \{\} \}/);
  assert.match(packageStore, /if \(authenticatedRole\) return;/);
  assert.match(demoStore, /enabled \? loadDemoStore\(\) : \{ surveys: \[\], findings: \[\], docs: \[\], logs: \[\] \}/);
  assert.match(demoStore, /if \(!enabled\) return;/);
});
