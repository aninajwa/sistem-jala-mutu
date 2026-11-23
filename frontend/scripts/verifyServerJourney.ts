/**
 * Read-only authenticated journey against the real API.
 *
 * Requires: backend on :5000 and frontend on :5173 (or JM_BASE_URL).
 * Credentials come only from env: JM_PROVIDER_EMAIL / JM_PROVIDER_PASSWORD and
 * JM_PIC_EMAIL / JM_PIC_PASSWORD. Optional: JM_PACKAGE (default 3), JM_SCREENSHOT_DIR.
 * Fails on any 5xx API response, any page error, or any non-GET API request.
 */
import { chromium, type Page } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.JM_BASE_URL ?? 'http://127.0.0.1:5173';
const packageId = process.env.JM_PACKAGE ?? '3';
const shotDir = process.env.JM_SCREENSHOT_DIR;

const STAGES: Array<[code: string, selection: string, heading: RegExp]> = [
  ['0', '/entry:Persiapan & SPMK', /Survei pendahuluan & persiapan QA\/QC/i],
  ['1', '/documents:Kalibrasi & personel', /Kalibrasi & Validasi Awal/i],
  ['2', '/entry:Validasi produksi', /Validasi Produksi Data/i],
  ['3A', '/entry:Survei harian', /Pelaksanaan Survei Harian/i],
  ['4', '/entry:Gerbang RNI\/LRS', /Penyiapan data & gerbang RNI\/LRS/i],
];

type Account = { tag: string; email?: string; password?: string; reviewer: boolean };
const accounts: Account[] = [
  { tag: 'penyedia', email: process.env.JM_PROVIDER_EMAIL, password: process.env.JM_PROVIDER_PASSWORD, reviewer: false },
  { tag: 'pic', email: process.env.JM_PIC_EMAIL, password: process.env.JM_PIC_PASSWORD, reviewer: true },
];

async function shot(page: Page, name: string) {
  if (shotDir) await page.screenshot({ path: `${shotDir}/journey-${name}.png` });
}

async function runAccount(account: Account) {
  assert.ok(account.email && account.password, `Set credentials for ${account.tag} in the environment.`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const failures: string[] = [];
  let reviewQueueStatus: number | undefined;
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('request', request => {
    if (request.url().includes('/api/') && request.method() !== 'GET') failures.push(`non-GET API request: ${request.method()} ${request.url()}`);
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;
    if (url.pathname === '/api/review-queue') reviewQueueStatus = response.status();
    if (response.status() >= 500) failures.push(`${response.status()} ${url.pathname}`);
  });
  try {
    await page.goto(base);
    await page.fill('#login-email', account.email!);
    await page.fill('#login-password', account.password!);
    // Reviewer dashboards request the server queue right after login; it can take several seconds.
    const queueResponse = account.reviewer
      ? page.waitForResponse(response => new URL(response.url()).pathname === '/api/review-queue', { timeout: 45000 })
      : null;
    await page.click('button[type=submit]');
    const rolePicker = page.getByText('Pilih peran akun');
    await page.waitForSelector('.app-shell, .auth-card h1', { timeout: 20000 });
    if (await rolePicker.count()) await page.locator('.auth-card button').first().click();
    await page.waitForSelector('.app-shell', { timeout: 20000 });
    await page.locator('.auth-local-notice').waitFor({ timeout: 10000 });
    await page.getByText(/\d+ paket dari server/).waitFor({ timeout: 20000 });
    if (queueResponse) {
      assert.equal((await queueResponse).status(), 200, 'reviewer dashboard must load /api/review-queue');
      await page.waitForTimeout(500);
    }
    await shot(page, `${account.tag}-home`);

    if (account.reviewer) {
      assert.equal(reviewQueueStatus, 200, 'reviewer dashboard must load /api/review-queue');
      const body = await page.locator('main').innerText();
      assert.doesNotMatch(body, /Menunggu\s+30\b/, 'queue counts must come from the server, not local demo state');
    } else {
      assert.equal(reviewQueueStatus, undefined, 'providers must not load the Balai review queue');
    }

    await page.goto(`${base}/packages`);
    await page.locator('[data-testid^="package-card-"]').first().waitFor({ timeout: 20000 });
    assert.ok(await page.locator(`[data-testid="package-card-${packageId}"]`).count(), `package ${packageId} must be visible`);
    await shot(page, `${account.tag}-packages`);

    await page.goto(`${base}/packages?paket=${packageId}&submodule=${encodeURIComponent('/packages:Ringkasan Paket')}`);
    await page.getByText('FAKTA TAHAP DARI SERVER').waitFor({ timeout: 20000 });
    // Wait until stage facts finished loading before judging the rail.
    await page.waitForFunction(() => !document.body.innerText.includes('Memuat status'), undefined, { timeout: 20000 });
    assert.ok(await page.locator('.jm-stage-stepper button.is-done').count() > 0, 'stage rail must mark server-completed stages');
    assert.equal(await page.getByText('Permohonan penambahan jenis survei').count(), 0, 'scope amendment panel stays hidden while gated off');
    await shot(page, `${account.tag}-overview`);

    for (const [code, selection, heading] of STAGES) {
      await page.goto(`${base}${selection.split(':')[0]}?paket=${packageId}&submodule=${encodeURIComponent(selection)}`);
      await page.getByText(heading).first().waitFor({ timeout: 15000 });
      await shot(page, `${account.tag}-tahap${code}`);
    }
  } finally {
    await browser.close();
  }
  assert.deepEqual(failures, [], `${account.tag}: ${failures.join(' | ')}`);
  console.log(`✔ ${account.tag} journey`);
}

for (const account of accounts) await runAccount(account);
console.log('server journey passed');
