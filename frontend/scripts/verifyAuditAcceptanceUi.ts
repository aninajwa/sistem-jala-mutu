/**
 * UI journey Tahap 4 → 6 on the server (writes test data; needs JM_ALLOW_WRITES=1).
 * Penyedia: LRS + upload VALID + submit Tahap 4 → PIC approves → Audit 1 (Penyedia) → Audit 2 (PIC) →
 * Audit 3 (Direktorat) → PIC records BA Penerimaan T1-T4 (T4 final) → package SELESAI.
 * Each step is skipped when the server already shows it done, so the journey can resume.
 * Needs backend :5000 (STAGE4_WORKFLOW_RPCS, AUDIT_ACCEPTANCE_RPCS = true) and frontend :5173.
 * Credentials only from env: JM_PROVIDER_*, JM_PIC_*, JM_DIRECTOR_EMAIL/PASSWORD. JM_PACKAGE defaults to 3.
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import assert from 'node:assert/strict';

if (process.env.JM_ALLOW_WRITES !== '1') { console.error('Set JM_ALLOW_WRITES=1: this journey writes test data.'); process.exit(2); }
const base = process.env.JM_BASE_URL ?? 'http://127.0.0.1:5173';
const packageId = process.env.JM_PACKAGE ?? '3';
const shotDir = process.env.JM_SCREENSHOT_DIR;
const stamp = new Date().toISOString().slice(0, 10);
const T = { timeout: 45000 };

const STAGE4 = '/entry:Gerbang RNI/LRS';
const AUDIT = '/verification:Audit tingkat 1–3';
const ACCEPTANCE = '/reports:Penerimaan & termin';
const url = (selection: string) => `${base}${selection.split(':')[0]}?paket=${packageId}&submodule=${encodeURIComponent(selection)}`;

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
const shot = async (page: Page, name: string) => { if (shotDir) await page.screenshot({ path: `${shotDir}/${name}.png`, fullPage: true }); };
const stage4State = async (page: Page) => (await page.getByTestId('stage4-workflow').locator('.wf-panel-head span').first().innerText()).trim();

async function stage4(provider: Page, pic: Page) {
  await provider.goto(url(STAGE4));
  const workflow = provider.getByTestId('stage4-workflow');
  await workflow.getByText(/^(DRAFT|DIAJUKAN|PERLU_REVISI|DISETUJUI)$/).waitFor(T);
  if (await stage4State(provider) !== 'DISETUJUI') {
    if (['DRAFT', 'PERLU_REVISI'].includes(await stage4State(provider))) {
      const lrs = provider.getByRole('form', { name: 'Simpan validasi RNI LRS' });
      await lrs.waitFor(T);
      await lrs.getByLabel('Panjang lapangan (m)').fill('1000');
      await lrs.getByLabel('Panjang acuan (m)').fill('1012');
      await lrs.getByLabel('Jumlah error topologi').fill('0');
      await lrs.getByLabel('Format sesuai glossary').selectOption('true');
      await lrs.getByLabel('STA konsisten IRI/PCI/LDT').selectOption('true');
      await lrs.getByRole('button', { name: /Simpan validasi LRS/ }).click();
      await provider.getByText(/Validasi LRS tersimpan/).waitFor(T);
      console.log('✔ LRS saved');

      const upload = provider.getByTestId('server-upload-panel');
      await upload.getByLabel('Status validasi sistem').selectOption('VALID');
      await upload.getByLabel('Jumlah record').fill('512');
      await upload.getByRole('button', { name: 'Catat upload' }).click();
      await upload.getByText('Upload VALID tercatat di server.').waitFor(T);
      await upload.getByText('Semua jenis survei VALID').waitFor(T);
      console.log('✔ upload VALID recorded');

      const submit = workflow.getByRole('button', { name: /Ajukan (ulang )?ke pemeriksa/ });
      await provider.waitForFunction(() => {
        const button = [...document.querySelectorAll('[data-testid="stage4-workflow"] button')].find(b => /Ajukan/.test(b.textContent ?? ''));
        return button && !(button as HTMLButtonElement).disabled;
      }, undefined, T);
      await shot(provider, 'stage4-ready');
      await submit.click();
      await workflow.getByText('DIAJUKAN', { exact: true }).waitFor(T);
      console.log('✔ Tahap 4 submitted');
    }
    await pic.goto(url(STAGE4));
    const review = pic.getByTestId('stage4-workflow');
    await review.getByRole('button', { name: 'Setujui pengajuan' }).click(T);
    await review.getByText('DISETUJUI', { exact: true }).waitFor(T);
    console.log('✔ Tahap 4 approved by PIC');
  } else console.log('• Tahap 4 already approved');
}

async function auditLevel(page: Page, level: 1 | 2 | 3) {
  await page.goto(url(AUDIT));
  const card = page.getByTestId(`audit-level-${level}`);
  await card.waitFor(T);
  const status = page.getByTestId(`audit-status-${level}`);
  if ((await status.innerText()).trim() === 'Lulus') { console.log(`• Audit ${level} already Lulus`); return; }
  if (level === 1) {
    for (const box of await card.locator('fieldset input[type=checkbox]').all()) await box.check();
  } else {
    await card.getByLabel('Realisasi sampel').fill(level === 2 ? '3' : '1.5');
    await card.getByLabel('nilai_asli 1').fill('3.20');
    await card.getByLabel('nilai_verifikasi 1').fill('3.31');
  }
  await card.getByLabel('Nomor BA audit').fill(`UJI-BA-AUDIT${level}-${stamp}`);
  await card.getByLabel('Catatan pemeriksaan').fill(`Pemeriksaan tingkat ${level} (uji UI)`);
  await card.getByTestId(`audit-save-${level}`).click();
  await card.getByText('Pemeriksaan tersimpan di server.', { exact: false }).waitFor(T);
  await page.getByTestId(`audit-pass-${level}`).click();
  await page.getByTestId(`audit-status-${level}`).getByText('Lulus').waitFor(T);
  console.log(`✔ Audit ${level} Lulus`);
}

async function acceptance(pic: Page) {
  await pic.goto(url(ACCEPTANCE));
  await pic.getByTestId('server-acceptance-workspace').locator('table').waitFor(T);
  for (const term of [1, 2, 3, 4]) {
    const row = pic.getByTestId(`termin-${term}`);
    if (await row.getByText('Diterima').count()) { console.log(`• T${term} already accepted`); continue; }
    await pic.getByTestId(`termin-open-${term}`).click(T);
    await pic.getByLabel(`Nomor BA termin ${term}`).fill(`UJI-BA-T${term}-${stamp}`);
    await pic.getByTestId(`termin-save-${term}`).click();
    await pic.getByTestId(`termin-${term}`).getByText('Diterima').waitFor(T);
    console.log(`✔ T${term} accepted`);
  }
  await pic.getByTestId('acceptance-status').getByText('SELESAI').waitFor(T);
  await shot(pic, 'acceptance-done');
}

const browser = await chromium.launch();
try {
  const provider = await session(browser, 'Penyedia', process.env.JM_PROVIDER_EMAIL, process.env.JM_PROVIDER_PASSWORD);
  const pic = await session(browser, 'PIC', process.env.JM_PIC_EMAIL, process.env.JM_PIC_PASSWORD);
  const director = await session(browser, 'Direktorat', process.env.JM_DIRECTOR_EMAIL, process.env.JM_DIRECTOR_PASSWORD);
  await stage4(provider, pic);
  await auditLevel(provider, 1);
  await auditLevel(pic, 2);
  await auditLevel(director, 3);
  await shot(director, 'audit-done');
  await acceptance(pic);
  console.log(`audit & acceptance UI journey passed (paket ${packageId})`);
} finally {
  await browser.close();
}
