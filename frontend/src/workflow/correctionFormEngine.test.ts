import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveCorrectionForm, validateCorrectionExecutionFields } from './correctionFormEngine';
import type { CorrectionCase } from './model';
const caseFor = (actionType: string, surveyType: CorrectionCase['surveyType'] = 'IRI'): CorrectionCase => ({
  id: 'CASE-TEST', actionType, surveyType, source: 'Verval 14 hari', blockedStage: 'Verval 14 hari',
  rejectionReason: 'Bukti belum memenuhi',
} as CorrectionCase);
const cases = [
  ['Survei ulang sebagian ruas', 'coverage'],
  ['Penilaian ulang (re-rating)', 'comparison'],
  ['Ambil ulang foto/video', 'mediaReference'],
  ['Pelatihan ulang personel', 'trainingEvaluation'],
  ['Kalibrasi ulang alat', 'calibrationEvidence'],
  ['Penggantian komponen alat', 'postReplacement'],
  ['Penggantian personel', 'competence'],
  ['Koreksi pemrosesan dengan bukti', 'rawReference'],
  ['Investigasi keterlambatan dan rencana tindak lanjut', 'investigation'],
];
for (const [action, field] of cases) {
  test(`resolver ${action}`, () => {
    const result = resolveCorrectionForm(caseFor(action));
    assert.ok(result.fields.some(f => f.id === field));
    assert.ok(validateCorrectionExecutionFields(result, {}).length > 0);
    assert.deepEqual(validateCorrectionExecutionFields(result, Object.fromEntries(result.fields.map(f => [f.id, 'Dokumen uji']))), []);
  });
}
test('Lendutan does not receive IRI context', () => {
  const result = resolveCorrectionForm(caseFor('Kalibrasi ulang alat', 'Lendutan'));
  assert.match(result.surveyContext, /FWD\/BB\/LWD/);
  assert.doesNotMatch(result.surveyContext, /raw IRI/);
});

for (const [survey, expected] of Object.entries({ IRI: /STA/, PCI: /Manual\/AI/, Lendutan: /FWD\/BB\/LWD/, Jembatan: /jenis pemeriksaan/, Lereng: /koordinat/, Drainase: /jenis saluran/, "Lalu Lintas": /periode pencacahan/, RNI: /inventarisasi/ })) {
  test(`scope labels follow ${survey} checklist`, () => {
    const type = survey as CorrectionCase['surveyType'];
    assert.match(resolveCorrectionForm(caseFor('Survei ulang sebagian ruas', type)).fields[0].label, expected);
    assert.match(resolveCorrectionForm(caseFor('Penilaian ulang', type)).fields[0].label, expected);
    assert.equal(resolveCorrectionForm(caseFor('Pelatihan ulang', type)).fields[0].id, 'participants');
  });
}
test('required execution text rejects malformed JSON values', () => {
  const spec = resolveCorrectionForm(caseFor('Survei ulang'));
  for (const bad of [true, 42, {}, [], ['text'], '   ']) {
    assert.equal(validateCorrectionExecutionFields(spec, {coverage: bad, newRecord: 'NEW'} as Record<string,string>).length, 1);
  }
});

test('PCI method requires distinct evidence and rejects unknown methods', () => {
  for (const action of ['Survei ulang', 'Penilaian ulang']) {
    const c = caseFor(action, 'PCI');
    const base = {coverage:'STA 1',newRecord:'NEW',evaluatedObject:'STA 1',comparison:'CMP'};
    for (const method of ['', 'unknown']) {
      const values = {...base,pciMethod:method};
      assert.ok(validateCorrectionExecutionFields(resolveCorrectionForm(c, values), values).length);
    }
    for (const [method, key, other] of [['Manual','pciRaterReference','pciDetectionReference'], ['AI','pciDetectionReference','pciRaterReference']]) {
      const values = {...base,pciMethod:method,[other]:'WRONG'};
      const form = resolveCorrectionForm(c, values);
      assert.ok(form.fields.some(f=>f.id===key));
      assert.ok(!form.fields.some(f=>f.id===other));
      assert.ok(validateCorrectionExecutionFields(form, values).length);
      assert.deepEqual(validateCorrectionExecutionFields(form, {...values,[key]:'DOC'}), []);
    }
  }
});

import { correctionExecutionSummary, correctionResultReference, correctionProposalTechnicalSummary, type CorrectionExecution } from './correctionFormEngine';
const resultFor = (overrides: Partial<CorrectionExecution> = {}): CorrectionExecution => ({date:'2026-11-25', summary:'Hasil uji', sourceReference:'REC-01', period:'', lane:'', equipment:'', verificationReference:'', actionFields:{}, evidenceKeys:[], evidenceNote:'', ...overrides});
test('technical result summary displays recorded FWD measurements, not unrelated fields', () => {
  const c = {...caseFor('Survei ulang', 'Lendutan'),ruleScenario:'Beban FWD',executionResult:resultFor({scenarioChecks:{'Pengujian ulang dilakukan':true,'Data temperatur tidak dimodifikasi':false,'internal':true},scenarioNumbers:{'Beban hasil uji ulang (kN)':40,'internal':99}})};
  const rows=Object.fromEntries(correctionExecutionSummary(c).map(r=>[r.label,r.value]));
  assert.equal(rows['Beban hasil uji ulang (kN)'],'40');
  assert.equal(rows['Pengujian ulang dilakukan'],'Ya');
  assert.equal(rows['Data temperatur tidak dimodifikasi'],'Tidak');
  assert.equal(rows.internal,undefined);
});
test('reference summary uses structured reference and preserves legacy only when necessary', () => {
  const c={...caseFor('Survei ulang'),executionReference:'Uraian panjang lama',executionResult:resultFor()};
  assert.equal(correctionResultReference(c),'REC-01');
  assert.equal(correctionResultReference({...c,executionResult:undefined}),'Uraian panjang lama');
  assert.equal(correctionResultReference({...c,executionResult:resultFor({sourceReference:''})}),'');
});
test('missing or invalid technical result is not fabricated as zero or false', () => {
  const c={...caseFor('Survei ulang','Lendutan'),ruleScenario:'Beban FWD',executionResult:resultFor({scenarioNumbers:{'Beban hasil uji ulang (kN)':NaN}})};
  const rows=correctionExecutionSummary(c);
  assert.equal(rows.some(r=>r.label==='Beban hasil uji ulang (kN)'||r.label==='Pengujian ulang dilakukan'),false);
});

test('proposal technical summary does not misrepresent future execution or optional comparisons', () => {
 const pending={...caseFor('Survei ulang','Lendutan'),ruleScenario:'Beban FWD',ruleNumbers:{'Beban hasil uji ulang (kN)':40}};
 assert.deepEqual(correctionProposalTechnicalSummary(pending),[{label:'Skenario teknis',value:'Beban FWD'}]);
 const pci={...caseFor('Koreksi pemrosesan dengan bukti','PCI'),ruleScenario:'Macet / kendaraan parkir',ruleChecks:{'Kondisi lokasi ditinjau dan dicatat':true,'Menggunakan IRI sebagai pembanding':false,'IRI pada STA yang sama':true}};
 const rows=Object.fromEntries(correctionProposalTechnicalSummary(pci).map(r=>[r.label,r.value]));
 assert.equal(rows['Kondisi lokasi ditinjau dan dicatat'],'Ya');
 assert.equal(rows['Menggunakan IRI sebagai pembanding'],'Tidak');
 assert.equal(rows['IRI pada STA yang sama'],undefined);
});
