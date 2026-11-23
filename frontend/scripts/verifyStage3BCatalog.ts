import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { CALIBRATION_REVIEW_SUBJECTS, calibrationSourceSignature } from '../src/workflow/calibrationReview';
import { createDemoWorkflow } from '../src/workflow/demoScenario';
import { SURVEY_TYPES, type SurveyType } from '../src/workflow/model';
import { PACKAGE_STORE_KEY } from '../src/workflow/packageStore';
import { sourceDocument, sourceDocumentKey } from '../src/workflow/sourceDocumentModel';
import { dailyChecks, evaluateDailySurvey } from '../src/workflow/surveyStandards';
import { withCompleteDailyRecord } from '../src/workflow/testing/dailyRecordFixture';
import { withProductionReferences } from '../src/workflow/testing/productionFixture';
import { lendutanOngoingResults } from '../src/workflow/sourceTechnicalEvaluation';
import { evaluateStageGate } from '../src/workflow/workflowGate';
import { sourceFormFixture } from '../src/workflow/testing/sourceFormFixture';

const output = process.env.TEST_ARTIFACTS || 'test-artifacts/stage3b-catalog';
fs.mkdirSync(output, { recursive: true });
const variants = SURVEY_TYPES.flatMap(type => type === 'PCI'
  ? [{ type, manual: true }, { type, manual: false }]
  : [{ type, manual: true }]);
const port = Number(process.env.JALA_CATALOG_PORT ?? 5194);
const server = await createServer({
  configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
  server: { host: '127.0.0.1', port, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const results: string[] = [];

function fixture(type: SurveyType, manual: boolean) {
  const state = withProductionReferences(createDemoWorkflow('complete'));
  state.role = 'Penyedia Jasa / Ketua Tim';
  state.project.surveyTypes = [type];
  state.project.surveyStartDate = '2026-12-22';
  state.project.surveyEndDate = '2027-01-08';
  state.productionTests.PCI.pciManual = manual;
  state.corrections = [];
  state.activeCyclePeriod = 1;
  state.cycleHistory = {};
  const record = state.dailyRecords.find(row => row.surveyType === type) ?? {
    ...state.dailyRecords[0], surveyType: type, id: `REKAMAN-${type}`,
  };
  const metadata = {
    PCI: { pciMethod: manual ? 'Manual' : 'AI', pci: '80', sampleUnit: 'UJI-1', distressForm: 'FORM-PCI' },
    Jembatan: { inspection: 'Detail', condition: '1', elementForm: 'FORM-JEMBATAN' },
    Lereng: { activity: 'Inventarisasi baru', kmStart: '1', kmEnd: '2', middleCoordinate: '98.7,3.4', endCoordinate: '98.8,3.4', riskForm: 'FORM-LERENG' },
    'Lalu Lintas': { trafficMethod: 'Durasi pendek', classification: 'Klasifikasi uji', plannedMinutes: '60', maxGap: '0', logbook: 'FORM-LALIN' },
    Drainase: { drainageForm: 'FORM-DRAINASE' },
  };
  const daily = { ...record, date: '2026-12-30', state: 'Tercatat' as const };
  if (type === 'IRI' || type === 'RNI' || type === 'Lendutan') {
    state.dailyRecords = [withCompleteDailyRecord(daily)];
  } else {
    const technicalData = { assetId: 'UJI-1', longitude: '98.6', latitude: '3.4', evidence: 'BUKTI-UJI', ...metadata[type] };
    const updated = { ...daily, technicalData, trafficDurationMinutes: 60, slopeFailureType: 'Longsoran', surfaceDry: true, glareFree: true };
    updated.dailyToolCheck = Object.fromEntries(dailyChecks(updated).map(check => [check, true]));
    assert.deepEqual(evaluateDailySurvey(updated), [], type);
    state.dailyRecords = [updated];
  }
  state.cycle = {
    ...state.cycle, selectedTypes: [type], periodCompleted: false,
    submittedRecordIds: undefined, certificateId: '', userReview: 'Belum Diperiksa',
    surveyReviews: {}, reviewPendingTypes: [], requiresReview: false,
  };
  state.calibrations = [{
    ...state.calibrations[0], surveyType: type, condition: 'Baik',
    qualificationValid: true, trainingVerified: true, dueDate: '2099-01-01',
  }];
  state.calibrationChecklist[type] = true;
  const calibration = sourceDocument(type, 'calibration', manual);
  const values = calibration ? sourceFormFixture(calibration, state.project) : {};
  if (calibration && type === 'Lendutan') {
    for (const result of lendutanOngoingResults(calibration, values)) {
      values[`value:t${result.table}:r${result.row}:c${result.column + 1}`] = result.reason.includes('pengulangan') ? '3' : '2';
    }
  }
  const answers = calibration ? { [sourceDocumentKey(state.project.id, calibration.id)]: JSON.stringify(values) } : {};
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: keyof typeof answers) => answers[key] ?? null } });
  const signature = calibrationSourceSignature(state, type);
  const section = {
    result: 'Sesuai' as const, note: 'Kalibrasi uji telah diperiksa', evidenceReference: '',
    reviewer: 'PIC Balai / Pengguna Jasa' as const, reviewedAt: state.simulationDate, sourceSignature: signature,
  };
  state.calibrationReviews = { ...state.calibrationReviews, [type]: {
    ...section, subject: CALIBRATION_REVIEW_SUBJECTS[0],
    sections: Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject => [subject, section])),
  } };
  const gate = evaluateStageGate(state, 'Tahap 2');
  if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
  else Reflect.deleteProperty(globalThis, 'localStorage');
  assert.equal(gate.readyToComplete, true, `${type}: ${gate.blockers.join(' | ')}`);
  return { state, answers };
}

try {
  for (const { type, manual } of variants) {
    if (process.env.JALA_CATALOG_TYPE && process.env.JALA_CATALOG_TYPE !== type) continue;
    if (process.env.JALA_BEFORE && type !== 'IRI' && type !== 'RNI') continue;
    const title = type === 'PCI' ? `PCI ${manual ? 'Manual' : 'AI'}` : type;
    const name = title.replaceAll(' ', '-');
    const { state, answers } = fixture(type, manual);
    const context = await browser.newContext();
    await context.addInitScript(({ state, answers, key }) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', 'yes');
      localStorage.setItem(key, JSON.stringify({
        activePackageId: state.project.id, activeRole: state.role, packages: { [state.project.id]: state },
      }));
      localStorage.setItem('jala-mutu-demo-session-v1', 'active');
      for (const [id, value] of Object.entries(answers)) localStorage.setItem(id, value);
    }, { state, answers, key: PACKAGE_STORE_KEY });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = `http://127.0.0.1:${port}/verification?testRoles=1&submodule=` + encodeURIComponent('/verification:Verval 14 hari');
    await page.goto(url);
    const work = page.locator('.stage3b-workspace');
    const task = (label: string) => work.getByRole('button', { name: label, exact: true }).click();
    const actor = async (role: string, delivered?: 'confirmed' | 'legacy' | 'incomplete') => {
      await page.evaluate(({ key, role, delivered }) => {
        const store = JSON.parse(localStorage.getItem(key)!);
        const current = store.packages[store.activePackageId];
        store.activeRole = current.role = role;
        if (delivered) {
          current.cycle.periodCompleted = true;
          current.cycle.submittedRecordIds = delivered === 'confirmed'
            ? current.dailyRecords.map((row: { id: string }) => row.id)
            : delivered === 'incomplete' ? ['rekaman-tidak-dikenal'] : undefined;
        }
        localStorage.setItem(key, JSON.stringify(store));
      }, { key: PACKAGE_STORE_KEY, role, delivered });
      await page.reload();
    };
    const form = work.locator('.source-exact-checklist');
    const checkForm = async (phase: string) => {
      if (type === 'Lendutan' && phase !== 'consistency') {
        await work.locator('.lendutan-period-review').getByRole('heading', {
          name: phase === 'internal' ? 'Lendutan · V&V Internal' : 'Lendutan · V&V Bersama / 2-Mingguan',
        }).waitFor();
        return;
      }
      const doc = sourceDocument(type, phase, manual);
      assert.ok(doc, `${title} / ${phase}`);
      await form.getByRole('heading', { name: `Formulir pemeriksaan ${title}`, exact: true }).waitFor();
      assert.equal(await form.getAttribute('data-source-document-id'), doc.id);
    };
    const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), title);
    await page.setViewportSize({ width: 390, height: 844 });
    await checkForm('consistency');
    await noOverflow();
    const period = work.getByLabel('Periode pemeriksaan', { exact: true });
    assert.match(await period.locator('option').nth(0).innerText(), /2026.*2027/);
    assert.match(await period.locator('option').nth(1).innerText(), /5–8 Jan(?:uari)? 2027/);
    if (process.env.JALA_BEFORE) {
      await page.screenshot({ path: `${output}/${name}-mobile-awal.png` });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({ path: `${output}/${name}-desktop-awal.png` });
      await context.close();
      continue;
    }
    await page.screenshot({ path: `${output}/${name}-mobile-awal.png` });
    const shortcut = form.getByRole('button', { name: 'Ke isian yang perlu diperiksa' });
    await shortcut.click();
    assert.ok(await page.evaluate(() => /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '')), title);
    await noOverflow();
    await page.screenshot({ path: `${output}/${name}-mobile-konsistensi-kosong.png` });
    await task('V&V Internal');
    await checkForm('internal');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: `${output}/${name}-desktop-internal.png` });
    await task('Penyerahan ke Balai');
    assert.equal(await work.getByTestId('button-cycle-submit').isDisabled(), true);
    if (type === 'IRI') {
      for (const archive of ['legacy', 'incomplete'] as const) {
        await actor('PIC Balai / Pengguna Jasa', archive);
        await work.getByText('Daftar rekaman penyerahan tidak dapat dipastikan.', { exact: false }).waitFor();
        assert.equal(await work.getByRole('table', { name: 'Rekaman survei harian' }).count(), 0);
        await task('Pemeriksaan Bersama');
        assert.equal(await form.count(), 0);
        await page.screenshot({ path: `${output}/IRI-arsip-${archive}.png` });
      }
    }
    await actor('PIC Balai / Pengguna Jasa', 'confirmed');
    await task('Pemeriksaan Bersama');
    await checkForm('periodic14');
    await task('BA');
    assert.equal(await work.getByTestId('button-cycle-complete').isDisabled(), true);
    await page.screenshot({ path: `${output}/${name}-desktop-balai-ba.png` });
    await actor('Direktorat / Pusat');
    await work.getByRole('heading', { name: 'Pemantauan pemeriksaan' }).waitFor();
    await actor('Admin');
    await work.getByRole('heading', { name: 'Status administrasi' }).waitFor();
    assert.equal(await work.getByTestId('button-cycle-complete').count(), 0);
    assert.deepEqual(errors, []);
    results.push(`${title}: Konsistensi kosong, lompat isian, V&V Internal, penyerahan diblokir, V&V Bersama, BA diblokir, Direktorat dan Admin`);
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
    console.log(results.at(-1));
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
