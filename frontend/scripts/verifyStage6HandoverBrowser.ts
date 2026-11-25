import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { createDemoWorkflow } from '../src/workflow/demoScenario';
import { PACKAGE_STORE_KEY } from '../src/workflow/packageStore';
import { stage6HandoverKey, type HandoverRecord } from '../src/workflow/stage6Handover';
import type { WorkflowRole } from '../src/workflow/model';

// Isolated browser fixture only. Never uses the user's actual package or production SMD.
const basePort = Number(process.env.STAGE6_QA_PORT || 5188);
const baseUrl = `http://127.0.0.1:${basePort}`;
const artifactDir = process.env.TEST_ARTIFACTS || fileURLToPath(new URL('../test-artifacts/stage6-handover-qa', import.meta.url));
fs.mkdirSync(artifactDir, { recursive: true });
const fixture = createDemoWorkflow('complete');
fixture.project.id = 'PAKET-STAGE6-QA-ISOLATED';
fixture.project.surveyTypes = ['IRI'];
fixture.role = 'Penyedia Jasa / Ketua Tim';
fixture.acceptance.finalAcceptance = false;
fixture.acceptance.acceptanceDecision = 'Belum Diperiksa';
fixture.acceptance.finalAcceptanceBa = '';
fixture.audits = fixture.audits.map(audit => ({ ...audit, status: 'Lulus', requiresReview: false }));
assert.ok(fixture.dailyRecords.some(record => record.surveyType === 'IRI' && record.state === 'Tercatat'), 'Fixture harus memiliki data IRI tercatat');
const server = await createServer({
  configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
  server: { host: '127.0.0.1', port: basePort, strictPort: true, watch: { ignored: ['**/test-artifacts/**'] } },
});
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await server.listen();
  browser = await chromium.launch({
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
    headless: true,
    args: process.env.CHROMIUM_EXECUTABLE ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
  });
  const context = await browser.newContext({ viewport: { width: 1365, height: 1000 } });
  await context.addInitScript(({ origin, storeKey, state }) => {
    if (location.origin !== origin || sessionStorage.getItem('stage6-qa-seeded')) return;
    sessionStorage.setItem('stage6-qa-seeded', '1');
    localStorage.setItem(storeKey, JSON.stringify({
      activePackageId: state.project.id,
      activeRole: state.role,
      packages: { [state.project.id]: state },
    }));
    localStorage.setItem('jala-mutu-demo-session-v1', 'active');
  }, { origin: baseUrl, storeKey: PACKAGE_STORE_KEY, state: fixture });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const route = baseUrl + '/reports?testRoles=1&submodule=' + encodeURIComponent('/reports:Penerimaan & termin');
  await page.goto(route);
  async function switchRole(role: WorkflowRole) {
    await page.evaluate(({ key, packageId, role }) => {
      const store = JSON.parse(localStorage.getItem(key)!);
      store.activeRole = role;
      store.packages[packageId].role = role;
      localStorage.setItem(key, JSON.stringify(store));
    }, { key: PACKAGE_STORE_KEY, packageId: fixture.project.id, role });
    await page.reload();
  }
  async function readHandover(): Promise<HandoverRecord> {
    return page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]')[0], stage6HandoverKey(fixture.project.id));
  }
  async function acceptanceSnapshot() {
    return page.evaluate(({key, id}) => {
      const state = JSON.parse(localStorage.getItem(key)!).packages[id];
      return {finalAcceptance:state.acceptance.finalAcceptance, decision:state.acceptance.acceptanceDecision, ba:state.acceptance.finalAcceptanceBa};
    }, {key:PACKAGE_STORE_KEY,id:fixture.project.id});
  }

  // 1. Penyedia: actual UI submission, not a direct call to domain helper.
  await page.getByTestId('stage6-tab-documents').click();
  const provider = page.locator('.stage6-handover');
  await provider.getByText('Cakupan data / ruas').locator('input').fill('Ruas A, segmen 01');
  await provider.getByText('Referensi data dan bukti QA/QC').locator('input').fill('BA-QA-IRI-01');
  const submit = provider.getByRole('button', { name: 'Ajukan penyerahan' });
  await assert.equal(await submit.isEnabled(), true, 'Pengajuan dengan data lengkap semestinya aktif');
  await submit.click();
  assert.equal((await readHandover()).status, 'Diajukan');
  assert.equal((await acceptanceSnapshot()).finalAcceptance, false);

  // 2. Balai returns with a reason, preserving original event.
  await switchRole('PIC Balai / Pengguna Jasa');
  const balai = page.locator('.stage6-handover');
  await balai.getByText('Alasan jika dikembalikan').locator('textarea').fill('Referensi verval perlu dilengkapi');
  await balai.getByRole('button', { name: 'Kembalikan' }).click();
  assert.equal((await readHandover()).status, 'Perlu Perbaikan');
  assert.equal((await readHandover()).events.length, 2);

  // 3. Penyedia resubmits a second version; Balai examines it.
  await switchRole('Penyedia Jasa / Ketua Tim');
  await page.getByTestId('stage6-tab-documents').click();
  const providerAgain = page.locator('.stage6-handover');
  await providerAgain.getByText('Cakupan data / ruas').locator('input').fill('Ruas A, segmen 01');
  await providerAgain.getByText('Referensi data dan bukti QA/QC').locator('input').fill('BA-QA-IRI-01-REVISI');
  await providerAgain.getByRole('button', { name: 'Ajukan ulang' }).click();
  assert.equal((await readHandover()).version, 2);
  assert.equal((await readHandover()).events.length, 3);
  await switchRole('PIC Balai / Pengguna Jasa');
  await page.locator('.stage6-handover').getByRole('button', { name: 'Tandai telah diperiksa' }).click();
  assert.equal((await readHandover()).status, 'Diperiksa');
  assert.equal((await readHandover()).events.length, 4);
  assert.equal((await acceptanceSnapshot()).finalAcceptance, false, 'Pemeriksaan tidak otomatis menerbitkan penerimaan akhir');
  assert.equal((await acceptanceSnapshot()).ba, '', 'Pemeriksaan tidak membuat BA palsu');

  // 4. The Balai rejection decision is separate from checking the handover.
  await page.getByTestId('stage6-tab-decision').click();
  await page.getByTestId('select-acceptance-decision').selectOption('Ditolak');
  await page.getByTestId('input-acceptance-rejection').fill('Bukti penerimaan akhir belum memenuhi ketentuan.');
  await page.getByTestId('button-final-acceptance').click();
  assert.equal((await acceptanceSnapshot()).finalAcceptance, false, 'Penolakan bukan penerimaan akhir');
  assert.equal((await acceptanceSnapshot()).ba, '', 'Penolakan tidak menerbitkan BA secara otomatis');

  // 5. Directorate/Admin read-only and cannot review handovers.
  await switchRole('Direktorat / Pusat');
  assert.equal(await page.getByRole('button', { name: 'Tandai telah diperiksa' }).count(), 0);
  await switchRole('Admin');
  assert.equal(await page.getByRole('button', { name: 'Ajukan penyerahan' }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Tandai telah diperiksa' }).count(), 0);
  assert.deepEqual(errors, [], `Browser errors: ${errors.join(' | ')}`);
  fs.writeFileSync(artifactDir + '/result.json', JSON.stringify({passed:true,events:4,version:2,localOnly:true,decisionTest:'rejection-not-approval'}, null, 2));
  console.log('LULUS stage6 handover browser: submit → return → resubmit → review; BA/final remains separate; permissions validated.');
} catch(error) {
  fs.writeFileSync(artifactDir + '/error.txt', String(error instanceof Error ? error.stack || error.message : error));
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
