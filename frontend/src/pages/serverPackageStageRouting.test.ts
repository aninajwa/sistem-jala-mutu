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

test('stage rail selection is navigation only and never marks a stage complete', async () => {
  const source = await readFile(new URL('../workflow/Checkpoint09Package.tsx', import.meta.url), 'utf8');
  assert.match(source, /const selected=item\.selection===selection/);
  assert.match(source, /const tile=stageTilePresentation\(item\.code,labels\[index\],fact,selected\)/);
  assert.match(source, /aria-current=\{tile\.ariaCurrent\}/);
  assert.match(source, /onClick=\{\(\)=>onNavigate\(item\.selection\)\}/);
  assert.match(source, /serverStageFactFor\(item\.code,serverStageStatuses\)/);
});

test('stage rail renders centered number/name only and keeps completion accessible', async () => {
  const source = await readFile(new URL('../workflow/Checkpoint09Package.tsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../workflow/ui09.css', import.meta.url), 'utf8');
  assert.match(source, /ui09-stage-number-row/);
  assert.match(source, /ui09-stage-label/);
  assert.match(source, /tile\.showCompletionIcon&&<CheckCircle2/);
  assert.match(source, /aria-label=\{tile\.accessibleLabel\}/);
  assert.doesNotMatch(source, /ui09-stage-fact|tile\.visibleFact/);
  assert.match(styles, /\.ui09-workspace \.ui09-stage\{align-items:center;text-align:center/);
  assert.match(styles, /\.ui09-workspace \.ui09-stage-number-row\{display:grid/);
  assert.match(styles, /\.ui09-workspace \.ui09-stage-label\{[^}]*text-wrap:balance/);
  assert.match(styles, /\.ui09-workspace \.ui09-stage:focus-visible\{outline:3px solid/);
});

test('server stage facts reload for every package page and after review without replacing the active page', async () => {
  const [workspace, stage1Panel, stage2Panel] = await Promise.all([
    readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8'),
    readFile(new URL('./Stage1PicConfirmationPanel.tsx', import.meta.url), 'utf8'),
    readFile(new URL('./ServerStage2Workspace.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(workspace, /getStage1Confirmation\(packageId, apiRequest, controller\.signal\)/);
  assert.match(workspace, /\}, \[packageId, serverStageFactsRevision\]\)/);
  assert.doesNotMatch(workspace, /if \(selection !== OVERVIEW\) return;/);
  assert.match(workspace, /getStage1Confirmation\(packageId, apiRequest, controller\.signal\)/);
  assert.match(workspace, /getStage2PackageCompletion\(packageId, apiRequest, controller\.signal\)/);
  assert.match(workspace, /stage2PackageFact\(\{[\s\S]*?completion: stage2Completion/);
  assert.match(stage1Panel, /jalamutu:package-stage-facts-refresh/);
  assert.match(stage2Panel, /jalamutu:package-stage-facts-refresh/);
  assert.match(stage2Panel, /stage2-package-completion/);
  assert.match(stage2Panel, /packageCompletion\?\.label/);
  assert.match(workspace, /serverStageStatuses=\{serverStageStatuses\}/);
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
  assert.match(source, /selection === OVERVIEW \?[\s\S]*?stageOne \|\| selection === '\/entry:Gerbang RNI\/LRS' \? content :/);
  assert.match(source, /selection === '\/entry:Gerbang RNI\/LRS' \? <ServerStage4Workspace packageId=\{packageId\} role=\{role\} \/>/);
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
