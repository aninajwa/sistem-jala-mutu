/**
 * UI journey Tahap 3B (Verval 14 hari) on the server (writes test data; needs JM_ALLOW_WRITES=1).
 * Penyedia opens the next cycle, records an inconsistent IRI test (preview shows "Tidak konsisten"),
 * retests consistently, submits the BA Verval; the PIC accepts the 14-day data.
 * Needs backend :5000 (STAGE3B_PRODUCTION_RPCS=true) and frontend :5173.
 * Credentials only from env: JM_PROVIDER_EMAIL/PASSWORD, JM_PIC_EMAIL/PASSWORD. JM_PACKAGE defaults to 3.
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import assert from 'node:assert/strict';

if (process.env.JM_ALLOW_WRITES !== '1') { console.error('Set JM_ALLOW_WRITES=1: this journey writes test data.'); process.exit(2); }
const base = process.env.JM_BASE_URL ?? 'http://127.0.0.1:5173';
const packageId = process.env.JM_PACKAGE ?? '3';
const shotDir = process.env.JM_SCREENSHOT_DIR;
const T = { timeout: 45000 };
const STAGE3B = '/verification:Verval 14 hari';
const url = `${base}/verification?paket=${packageId}&submodule=${encodeURIComponent(STAGE3B)}`;

async function session(browser: Browser, who: string, email?: string, password?: string) {
  assert.ok(email && password, `${who} credentials missing in env`);
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  page.on('pageerror', error => { throw error; });
  await page.goto(base);
  await page.fill('#login-email', email); await page.fill('#login-password', password);
  await page.click('button[type=submit]');
  await page.waitForSelector('.app-shell', { timeout: 30000 });
  return page;
}
async function idle(page: Page) { await page.locator('[data-testid="server-stage3b-workspace"][data-refreshing="false"]').waitFor(T); }
async function fillRepeats(page: Page, values: string[]) {
  await idle(page);
  for (const [index, value] of values.entries()) await page.getByLabel(`Nilai ulangan ${index + 1}`).fill(value);
}
/** Waits for the success message; fails fast with the UI's own error text if an alert appears instead. */
async function saved(page: Page, text: string | RegExp) {
  const ok = page.getByRole('status').filter({ hasText: text }).first();
  const failed = page.locator('[data-testid="server-stage3b-workspace"] [role="alert"]').first();
  await Promise.race([ok.waitFor(T), failed.waitFor(T)]);
  if (await failed.isVisible()) throw new Error(`UI error: ${await failed.innerText()}`);
}
const runId = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

const browser = await chromium.launch();
try {
  const provider = await session(browser, 'Penyedia', process.env.JM_PROVIDER_EMAIL, process.env.JM_PROVIDER_PASSWORD);
  await provider.goto(url);
  await provider.getByTestId('server-stage3b-workspace').locator('.wf-kpis').waitFor(T);
  const open = provider.getByTestId('verval-open');
  if (await open.count()) { await open.click(); await saved(provider, 'Siklus verval baru dibuka.'); console.log('✔ cycle opened'); }
  await provider.getByTestId('verval-cycle-detail').waitFor(T);
  const pic = await session(browser, 'PIC', process.env.JM_PIC_EMAIL, process.env.JM_PIC_PASSWORD);
  const chip = provider.getByTestId('verval-cycle-detail').locator('.wf-panel-head .wf-status').first();
  if ((await chip.innerText()).trim() === 'Menunggu PIC') {
    // Resume a cycle left submitted by an earlier run: the PIC sends it back, the Penyedia resubmits.
    await pic.goto(url);
    await pic.getByLabel('Catatan pemeriksaan Verval').fill('Ajukan ulang dengan nomor BA baru (uji UI)');
    await pic.getByTestId('verval-request-fix').click(T);
    await saved(pic, 'Siklus dikembalikan ke Penyedia untuk perbaikan.');
    await provider.goto(url);
    await provider.getByTestId('verval-cycle-detail').waitFor(T);
    console.log('• earlier submitted cycle sent back by PIC');
  }

  await fillRepeats(provider, ['3.0', '4.5', '3.2']);
  await provider.getByTestId('verval-preview').getByText('Tidak konsisten').waitFor(T);
  await provider.getByTestId('verval-save-test').click();
  await saved(provider, 'Uji konsistensi tersimpan di server.');
  await provider.getByTestId('verval-tests').getByText('Tidak Konsisten').first().waitFor(T);
  console.log('✔ inconsistent test recorded (KV > 5%)');

  await fillRepeats(provider, ['3.20', '3.25', '3.30']);
  await provider.getByTestId('verval-preview').getByText('Konsisten', { exact: true }).waitFor(T);
  await provider.getByTestId('verval-save-test').click();
  await saved(provider, 'Uji konsistensi tersimpan di server.');
  console.log('✔ consistent retest recorded');

  await idle(provider);
  await provider.getByLabel('Nomor BA Verval').fill(`UJI-BA-VERVAL-${runId}`);
  await provider.getByTestId('verval-submit').click();
  await saved(provider, /BA Verval diajukan/);
  const cycleNo = (await provider.getByTestId('verval-cycle-detail').locator('h4').first().innerText()).match(/ke-(\d+)/)?.[1];
  await provider.getByTestId(`verval-status-${cycleNo}`).getByText('Menunggu PIC').waitFor(T);
  if (shotDir) await provider.screenshot({ path: `${shotDir}/verval-submitted.png`, fullPage: true });
  console.log(`✔ BA submitted (cycle ${cycleNo})`);

  await pic.goto(url);
  await pic.getByTestId('verval-accept').click(T);
  await saved(pic, 'Siklus diterima. BA Verval 2-Mingguan tercatat.');
  await pic.getByTestId(`verval-status-${cycleNo}`).getByText('Diterima').waitFor(T);
  if (shotDir) await pic.screenshot({ path: `${shotDir}/verval-accepted.png`, fullPage: true });
  console.log(`✔ PIC accepted cycle ${cycleNo}`);

  await provider.goto(url);
  await provider.getByTestId('verval-open').waitFor(T);
  console.log('✔ next cycle can be opened');
  console.log(`verval UI journey passed (paket ${packageId}, cycle ${cycleNo})`);
} finally {
  await browser.close();
}
