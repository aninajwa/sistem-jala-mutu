/**
 * UI journey for the server-backed Koreksi flow (writes test data; needs JM_ALLOW_WRITES=1).
 * Penyedia opens a case and submits it, PIC approves, Penyedia executes, PIC retests and closes.
 * Needs backend :5000 (CORRECTION_PRODUCTION_RPCS=true) and frontend :5173.
 * Credentials only from env: JM_PROVIDER_EMAIL/PASSWORD, JM_PIC_EMAIL/PASSWORD. JM_PACKAGE defaults to 3.
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import assert from 'node:assert/strict';

if (process.env.JM_ALLOW_WRITES !== '1') { console.error('Set JM_ALLOW_WRITES=1: this journey writes test data.'); process.exit(2); }
const base = process.env.JM_BASE_URL ?? 'http://127.0.0.1:5173';
const packageId = process.env.JM_PACKAGE ?? '3';
const shotDir = process.env.JM_SCREENSHOT_DIR;

async function session(browser: Browser, email?: string, password?: string) {
  assert.ok(email && password, 'credentials missing in env');
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  page.on('pageerror', error => { throw error; });
  await page.goto(base);
  await page.fill('#login-email', email); await page.fill('#login-password', password);
  await page.click('button[type=submit]');
  await page.waitForSelector('.app-shell', { timeout: 30000 });
  return page;
}
async function act(page: Page, action: string) {
  const button = page.getByTestId(`correction-action-${action}`);
  await button.waitFor({ timeout: 30000 });
  await button.click();
  await page.getByText(/tersimpan di server/).waitFor({ timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid^="correction-action-"]:disabled'), undefined, { timeout: 30000 });
  console.log(`✔ ${action}`);
}
const caseUrl = (id: string) => `${base}/actions?paket=${packageId}&koreksi=${id}&submodule=${encodeURIComponent('/actions:Koreksi berbukti')}`;

const browser = await chromium.launch();
try {
  const provider = await session(browser, process.env.JM_PROVIDER_EMAIL, process.env.JM_PROVIDER_PASSWORD);
  await provider.goto(`${base}/actions`);
  await provider.getByTestId('correction-create-package').selectOption(packageId);
  await provider.getByTestId('server-correction-create').waitFor({ timeout: 30000 });
  const form = provider.getByTestId('server-correction-create');
  await form.getByLabel('Ruas').fill('Ruas uji UI');
  await form.getByLabel('Alasan penolakan / temuan').fill(`UJI-UI-KOREKSI ${new Date().toISOString()}`);
  await form.getByRole('button', { name: 'Buka kasus' }).click();
  await provider.getByTestId('server-correction-workspace').waitFor({ timeout: 30000 });
  await provider.waitForURL(/koreksi=\d+/, { timeout: 30000 });
  const id = new URL(provider.url()).searchParams.get('koreksi')!;
  console.log(`✔ case opened (#${id})`);

  const ws = provider.getByTestId('server-correction-workspace');
  await ws.getByLabel('Akar masalah').selectOption('Alat');
  await ws.getByLabel('Data lapangan valid?').selectOption('Tidak');
  await ws.getByLabel('Jenis tindakan').selectOption('Kalibrasi ulang alat');
  await ws.getByLabel('Bukti / rencana').fill('Rencana kalibrasi ulang (uji UI)');
  await act(provider, 'edit');
  await act(provider, 'verify_surveyor');
  await act(provider, 'verify_team_leader');
  await act(provider, 'submit');

  const pic = await session(browser, process.env.JM_PIC_EMAIL, process.env.JM_PIC_PASSWORD);
  await pic.goto(caseUrl(id));
  await act(pic, 'verify_balai');
  await pic.getByLabel('Catatan PIC').fill('Disetujui (uji UI)');
  await act(pic, 'approve');

  await provider.goto(caseUrl(id));
  await provider.getByLabel('Referensi pelaksanaan').fill('BA pelaksanaan (uji UI)');
  await act(provider, 'execute');

  await pic.goto(caseUrl(id));
  await pic.getByLabel('Referensi uji ulang').fill('Hasil uji ulang (uji UI)');
  await act(pic, 'retest');
  await act(pic, 'close');
  await pic.getByText('Kasus sudah ditutup.').waitFor({ timeout: 30000 });
  if (shotDir) await pic.screenshot({ path: `${shotDir}/correction-closed.png` });

  await provider.goto(`${base}/actions`);
  await provider.getByText(/\d+ kasus koreksi dari server/).waitFor({ timeout: 30000 });
  await provider.getByText(new RegExp(`UJI-UI-KOREKSI|#${id}\\b`)).first().waitFor({ timeout: 30000 });
  if (shotDir) await provider.screenshot({ path: `${shotDir}/correction-list.png` });
  console.log(`correction UI journey passed (koreksi_id ${id})`);
} finally {
  await browser.close();
}
