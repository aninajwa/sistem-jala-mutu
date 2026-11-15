#!/usr/bin/env node
// Local authenticated, read-only Stage 4 UI smoke check. No save controls are clicked.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { chromium } from '@playwright/test';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const projectRef = 'vnvknmwcidberkjwtqjx';
const packageId = 11;
const baseURL = process.env.JALA_STAGE4_BASE_URL ?? 'http://127.0.0.1:5173';

async function main() {
  const [e2eText, frontendText] = await Promise.all([
    readFile(resolve(root, 'frontend/.env.e2e.local'), 'utf8'), readFile(resolve(root, 'frontend/.env'), 'utf8'),
  ]);
  const e2e = parseEnv(e2eText);
  const frontend = parseEnv(frontendText);
  assert.equal(e2e.JALA_T0_TEST_ENVIRONMENT, 'authorized-shared-dev');
  assert.equal(e2e.JALA_T0_EXPECTED_PROJECT_REF, projectRef);
  assert.equal(e2e.JALA_T0_BALAI_ID, '1');
  assert.equal(e2e.JALA_T0_RESUME_PACKAGE_ID, String(packageId));
  assert.ok(e2e.JALA_T0_PROVIDER_EMAIL && e2e.JALA_T0_PROVIDER_PASSWORD, 'Penyedia credentials must be present');
  const configuredUrl = new URL(frontend.VITE_SUPABASE_URL);
  assert.equal(configuredUrl.hostname, `${projectRef}.supabase.co`);
  assert.ok(frontend.VITE_SUPABASE_PUBLISHABLE_KEY, 'Publishable key must be present');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const unexpectedWrites = [];
  const stage4Responses = [];
  const stage4Requests = [];
  page.on('response', response => {
    const url = new URL(response.url());
    if (/\/api\/paket\/11\/(?:validasi-lrs(?:-capabilities|-status|-workflow-capabilities)?|ruas-jalan)/.test(url.pathname)) {
      stage4Responses.push({ method: response.request().method(), path: url.pathname, status: response.status(), body: response.json().catch(() => null) });
    }
  });
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.includes('/api/paket/11/')) stage4Requests.push(`${request.method()} ${url.pathname}`);
    if (/\/api\/paket\/11\/validasi-lrs(?:\/|$)/.test(url.pathname) && !['GET', 'OPTIONS'].includes(request.method())) {
      unexpectedWrites.push(request.method());
    }
  });

  try {
    await page.goto(baseURL);
    await page.getByLabel('Email').fill(e2e.JALA_T0_PROVIDER_EMAIL);
    await page.getByLabel('Password').fill(e2e.JALA_T0_PROVIDER_PASSWORD);
    const authResponsePromise = page.waitForResponse(response =>
      response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/auth/v1/token'));
    const identityResponsePromise = page.waitForResponse(response =>
      response.request().method() === 'GET' && new URL(response.url()).pathname.endsWith('/api/me'));
    await page.getByRole('button', { name: 'Masuk' }).click();
    const authResponse = await authResponsePromise;
    assert.equal(authResponse.status(), 200, 'Penyedia login succeeded');
    const identityResponse = await identityResponsePromise;
    assert.equal(identityResponse.status(), 200, 'Authenticated profile/role lookup succeeded');
    const identity = (await identityResponse.json()).data;
    assert.ok(identity.peran.some(role => role.nama === 'penyedia_jasa'), 'Signed-in account has Penyedia role');
    if (await page.getByRole('heading', { name: 'Pilih peran akun' }).isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Penyedia Jasa / Ketua Tim', exact: true }).click();
    }

    await page.goto(`${baseURL}/packages`);
    const card = page.getByTestId(`package-card-${packageId}`);
    await card.waitFor({ state: 'visible' });
    await card.getByRole('button', { name: 'Buka paket' }).click();
    await page.waitForURL(/paket=11/);
    await page.getByTestId('dirah-server-package-detail').waitFor({ state: 'visible' });
    assert.equal(new URL(page.url()).searchParams.get('paket'), String(packageId));
    assert.equal(await page.getByRole('button', { name: 'Buka Tahap 0' }).count(), 1,
      'Overview action is the expected read-only fallback, not evidence of legacy routing');
    const stage4Button = page.getByRole('button', { name: /^Tahap 4 · Persiapan Data ·/ });
    await stage4Button.waitFor({ state: 'visible' });
    await stage4Button.click();
    try { await page.getByTestId('server-stage4-workspace').waitFor({ state: 'visible', timeout: 15_000 }); }
    catch {
      const diagnostic = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(-800);
      throw new Error(`Stage 4 rail click did not render server panel; url=${new URL(page.url()).pathname}${new URL(page.url()).search}; body=${diagnostic}`);
    }
    await page.getByRole('form', { name: 'Simpan validasi RNI LRS' }).waitFor({ state: 'visible' });
    const workflowPanel = page.getByTestId('stage4-workflow');
    await workflowPanel.getByText('Gerbang teknis: Menunggu aturan terkonfirmasi').waitFor({ state: 'visible' });
    const workflowCapabilitiesRecord = stage4Responses.find(item => item.method === 'GET' && item.path.endsWith('/validasi-lrs-workflow-capabilities'));
    assert.ok(workflowCapabilitiesRecord, 'Stage 4 requests read-only status and lifecycle capabilities');
    assert.equal(workflowCapabilitiesRecord.status, 200);
    const workflowCapabilities = (await workflowCapabilitiesRecord.body)?.data;
    assert.deepEqual(workflowCapabilities, {
      status: true, submit: false, review: false,
      reason: 'Kontrak submit/review Stage 4 belum dipasang dan aturan bisnis belum disahkan.',
    });
    const statusRecord = stage4Responses.find(item => item.method === 'GET' && item.path.endsWith('/validasi-lrs-status'));
    assert.ok(statusRecord, `Stage 4 requests installed status RPC through authenticated API; responses: ${stage4Responses.map(item => `${item.method} ${item.path} ${item.status}`).join('; ') || 'none'}; requests: ${stage4Requests.join('; ') || 'none'}`);
    assert.equal(statusRecord.status, 200, 'Installed status RPC returned 200 through authenticated route');
    const statusEnvelope = await statusRecord.body;
    assert.equal(statusEnvelope?.data?.paket_id, packageId);
    assert.equal(statusEnvelope?.data?.state, 'PENDING_RULES');
    assert.equal(statusEnvelope?.data?.workflow_version, 0);
    assert.equal(statusEnvelope?.data?.gate, 'PENDING');
    assert.equal(statusEnvelope?.data?.progression_allowed, false);
    assert.ok(statusEnvelope.data.blockers.some(item => item.code === 'EVIDENCE_POLICY_UNRESOLVED'));
    assert.ok(statusEnvelope.data.blockers.some(item => item.code === 'TOPOLOGY_UNVERIFIED'),
      'Installed RPC blocker proves this is not the legacy local fallback payload');
    assert.ok(statusEnvelope.data.validations.some(row => row.paket_id === packageId && row.versi === 1));
    const serverRemeasurement = statusEnvelope.data.blockers.some(item => item.code === 'REMEASUREMENT_REQUIRED');
    const technicalPanel = page.getByTestId('stage4-kak-assessment');
    await technicalPanel.getByText('REMEASUREMENT_REQUIRED', { exact: false }).waitFor({ state: 'visible' });
    assert.ok(serverRemeasurement || await technicalPanel.getByText('REMEASUREMENT_REQUIRED', { exact: false }).isVisible(),
      'Remeasurement is surfaced by a server blocker or separate read-only KAK finding');
    assert.equal(await workflowPanel.getByRole('button', { name: 'Ajukan ke pemeriksa' }).isDisabled(), true);
    assert.equal(await workflowPanel.getByRole('button', { name: 'Ajukan ulang ke pemeriksa' }).count(), 0);
    assert.match(await workflowPanel.innerText(), /Tahap 5 tetap terkunci/);
    const capabilityRecord = stage4Responses.find(item => item.method === 'GET' && item.path.endsWith('/validasi-lrs-capabilities'));
    assert.ok(capabilityRecord, `Stage 4 must request capabilities; observed: ${stage4Responses.map(item => `${item.method} ${item.path} ${item.status}`).join('; ') || 'none'}`);
    assert.equal(capabilityRecord.status, 200, 'Local capabilities endpoint returned 200');
    const capabilityEnvelope = await capabilityRecord.body;
    assert.ok(capabilityEnvelope, `Capabilities response was not JSON (HTTP ${capabilityRecord.status})`);
    const capabilityBody = capabilityEnvelope.data;
    assert.deepEqual(capabilityBody, { read: true, write: true, reason: null });

    const lrsPanel = page.getByLabel('Validasi RNI/LRS tersimpan');
    await lrsPanel.waitFor({ state: 'visible' });
    await lrsPanel.getByText('1 ruas', { exact: true }).waitFor({ state: 'visible' });
    const lrsRecord = stage4Responses.find(item => item.method === 'GET' && item.path.endsWith('/validasi-lrs'));
    assert.ok(lrsRecord, 'Stage 4 should read persisted LRS rows');
    assert.equal(lrsRecord.status, 200, 'Authenticated persisted LRS read returned 200');
    const lrsEnvelope = await lrsRecord.body;
    assert.ok(lrsEnvelope, `LRS read response was not JSON (HTTP ${lrsRecord.status})`);
    const lrsRows = lrsEnvelope.data;
    assert.ok(Array.isArray(lrsRows) && lrsRows.length === 1, 'Package 11 retains exactly one persisted TEST/QA LRS row');
    assert.equal(lrsRows[0].versi, 1, 'Existing QA row remains version 1');
    assert.equal(lrsRows[0].panjang_lapangan_m, 1234);
    assert.equal(lrsRows[0].panjang_acuan_m, 1200);
    assert.equal(lrsRows[0].jumlah_error_topologi, 2);
    assert.equal(lrsRows[0].format_sesuai_glossary, false);
    assert.equal(lrsRows[0].sta_konsisten_iri_pci_ldt, false);
    assert.equal(lrsRows[0].deviasi_m, null);
    assert.equal(lrsRows[0].status, null);
    assert.equal(lrsRows[0].tgl_valid, null);
    await page.getByLabel('Ruas validasi').waitFor({ state: 'visible' });
    const roadOptions = await page.getByLabel('Ruas validasi').locator('option').count();
    const roadsRecord = stage4Responses.find(item => item.method === 'GET' && item.path.endsWith('/ruas-jalan'));
    assert.ok(roadsRecord, 'Package-eligible road endpoint was requested');
    assert.equal(roadsRecord.status, 200, 'Package-eligible road endpoint returned 200');
    assert.ok(roadOptions > 0, 'At least one package-eligible road is selectable');
    await page.getByText('(versi 1)', { exact: false }).waitFor({ state: 'visible' });
    await technicalPanel.getByText('34', { exact: true }).waitFor({ state: 'visible' });
    await technicalPanel.getByText(/bukan PASS\/FAIL workflow/).waitFor({ state: 'visible' });

    const form = page.getByRole('form', { name: 'Simpan validasi RNI LRS' });
    const fieldSummary = await form.evaluate(element => ({
      numberFields: element.querySelectorAll('input[type="number"]').length,
      booleanChecks: [...element.querySelectorAll('select')].filter(select =>
        [...select.options].some(option => option.value === 'true') && [...select.options].some(option => option.value === 'false')).length,
      hasRequiredObservations: element.querySelectorAll('[required]').length === 5,
      validWithPersistedValues: element.checkValidity(),
      requiredValidationMessagePresent: Boolean(element.querySelector('input[required]')?.validationMessage),
      saveEnabled: !element.querySelector('button[type="submit"]')?.disabled,
    }));
    assert.equal(fieldSummary.numberFields, 3);
    assert.equal(fieldSummary.booleanChecks, 2);
    assert.equal(fieldSummary.hasRequiredObservations, true);
    assert.equal(fieldSummary.validWithPersistedValues, true, 'Existing persisted observations hydrate valid form fields');
    assert.equal(fieldSummary.requiredValidationMessagePresent, false);
    assert.equal(fieldSummary.saveEnabled, true, 'Save is enabled for the selected eligible road but will not be clicked');

    // Exercise navigation and browser refresh without writing; persisted row must remain unchanged.
    await page.reload();
    await page.getByRole('button', { name: /^Tahap 4 · Persiapan Data ·/ }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /^Tahap 4 · Persiapan Data ·/ }).click();
    await page.getByTestId('server-stage4-workspace').waitFor({ state: 'visible' });
    await page.getByTestId('stage4-workflow').getByText('Gerbang teknis: Menunggu aturan terkonfirmasi').waitFor({ state: 'visible' });
    const refreshedStatusRecord = stage4Responses.filter(item => item.method === 'GET' && item.path.endsWith('/validasi-lrs-status')).at(-1);
    assert.ok(refreshedStatusRecord && refreshedStatusRecord.status === 200, 'Status RPC is fetched again after browser refresh');
    const refreshedStatus = (await refreshedStatusRecord.body)?.data;
    assert.equal(refreshedStatus?.state, statusEnvelope.data.state);
    assert.equal(refreshedStatus?.workflow_version, statusEnvelope.data.workflow_version);
    assert.deepEqual(refreshedStatus?.blockers, statusEnvelope.data.blockers);
    assert.equal(refreshedStatus?.progression_allowed, false);
    await page.getByTestId('stage4-kak-assessment').getByText('REMEASUREMENT_REQUIRED', { exact: false }).waitFor({ state: 'visible' });
    const refreshedLrsRecord = stage4Responses.filter(item => item.method === 'GET' && item.path.endsWith('/validasi-lrs')).at(-1);
    assert.ok(refreshedLrsRecord && refreshedLrsRecord.status === 200);
    const refreshedRows = (await refreshedLrsRecord.body)?.data;
    assert.equal(refreshedRows?.length, 1);
    assert.equal(refreshedRows[0].versi, 1);
    assert.equal(refreshedRows[0].panjang_lapangan_m, 1234);
    assert.equal(refreshedRows[0].panjang_acuan_m, 1200);
    assert.equal(refreshedRows[0].jumlah_error_topologi, 2);
    assert.equal(refreshedRows[0].format_sesuai_glossary, false);
    assert.equal(refreshedRows[0].sta_konsisten_iri_pci_ldt, false);
    await page.getByRole('button', { name: 'Ringkasan', exact: true }).click();
    await form.waitFor({ state: 'detached' });
    await page.getByRole('button', { name: /^Tahap 4 · Persiapan Data ·/ }).click();
    await page.getByTestId('server-stage4-workspace').waitFor({ state: 'visible' });
    await page.getByRole('form', { name: 'Simpan validasi RNI LRS' }).waitFor({ state: 'visible' });
    assert.deepEqual(unexpectedWrites, [], 'No LRS write/submit request was issued');
    console.log(`PASS: authenticated Dirah overview → Stage 4; installed status RPC state=${statusEnvelope.data.state}, workflow_version=${statusEnvelope.data.workflow_version}, blocker_codes=${statusEnvelope.data.blockers.map(item => item.code).join(',')} unchanged after refresh; 34 m REMEASUREMENT_REQUIRED visible in read-only KAK assessment; submit/review disabled, Tahap 5 locked; TEST/QA LRS row count=1 version=1; no write request issued.`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(error => {
  console.error(`FAIL: Stage 4 local UI check failed (${error instanceof Error ? error.message : 'unknown error'}). Credentials and tokens were not printed.`);
  process.exitCode = 1;
});
