import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { createDemoWorkflow } from '../src/workflow/demoScenario';
import { PACKAGE_STORE_KEY } from '../src/workflow/packageStore';

// Isolated browser context and fixture; no changes to the user's existing packages.
const id = 'PAKET-DEMO-001';
const state = createDemoWorkflow('stage4-ready');
state.project.id = id;
state.project.surveyTypes = ['RNI'];
state.project.surveyStartDate = '2027-05-01';
state.project.surveyEndDate = '2027-05-28';
state.activeCyclePeriod = 1;
state.cycleHistory = {};
state.cycle = {
  ...state.cycle,
  certificateId: 'BA-UJI-RNI-P1',
  periodCompleted: true,
  userReview: 'Sesuai',
  userReviewNote: 'Disetujui Balai untuk pengujian pergantian periode',
  surveyReviews: { RNI: { decision: 'Sesuai', note: 'Bukti uji periode 1', reviewedAt: '2027-05-14' } },
};
state.role = 'Penyedia Jasa / Ketua Tim';
const port = 5189;
const server = await createServer({
  configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
  server: { host: '127.0.0.1', port, strictPort: true },
});
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await server.listen();
  const executablePath = process.env.CHROMIUM_EXECUTABLE;
  browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    args: executablePath ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
  });
  const context = await browser.newContext();
  await context.addInitScript(({ key, data }) => {
    if (sessionStorage.getItem('jala-stage3b-test-seeded')) return;
    sessionStorage.setItem('jala-stage3b-test-seeded', '1');
    localStorage.setItem(key, JSON.stringify({ activePackageId: data.project.id, activeRole: data.role, packages: { [data.project.id]: data } }));
    localStorage.setItem('jala-mutu-demo-session-v1', 'active');
  }, { key: PACKAGE_STORE_KEY, data: state });
  const page = await context.newPage();
  const url = `http://127.0.0.1:${port}/verification?testRoles=1&submodule=${encodeURIComponent('/verification:Verval 14 hari')}`;
  await page.goto(url);
  const select = page.getByLabel('Periode pemeriksaan', { exact: true });
  await select.waitFor();
  await select.selectOption('2');
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const data = JSON.parse(raw).packages['PAKET-DEMO-001'];
    return data?.activeCyclePeriod === 2 && data?.cycleHistory?.['1']?.certificateId === 'BA-UJI-RNI-P1';
  }, PACKAGE_STORE_KEY, { timeout: 8000 });
  const read = async () => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'], PACKAGE_STORE_KEY);
  const after = await read();
  assert.equal(after.cycleHistory['1'].certificateId, 'BA-UJI-RNI-P1');
  assert.equal(after.cycleHistory['1'].userReview, 'Sesuai');
  assert.equal(after.cycle.certificateId, '');
  assert.equal(after.cycle.userReview, 'Belum Diperiksa');
  await page.reload();
  await select.waitFor();
  const persisted = await read();
  assert.equal(persisted.activeCyclePeriod, 2);
  assert.equal(persisted.cycleHistory['1'].certificateId, 'BA-UJI-RNI-P1');
  assert.equal(persisted.cycleHistory['1'].userReview, 'Sesuai');
  assert.equal(persisted.cycle.userReview, 'Belum Diperiksa');
  console.log('PASS: perpindahan periode, keputusan Balai, dan refresh browser.');
  await context.close();
} finally {
  await browser?.close();
  await server.close();
}
