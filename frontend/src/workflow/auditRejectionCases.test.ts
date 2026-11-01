import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveAuditRejectionRecords, hasOpenAuditRejectionCase } from './auditRejectionCases';
import type { AuditSampleUnit, DailySurveyRecord, CorrectionCase } from './model';
const record = (id:string, surveyType:'IRI'|'PCI'='IRI') => ({id,surveyType}) as DailySurveyRecord;
const unit = (id:string, sourceRecordId:string, surveyType:'IRI'|'PCI'='IRI'):AuditSampleUnit => ({id,sourceRecordId,surveyType,road:'A',unitType:'point',unitKey:id,reviewStatus:'Tidak Valid'});
test('penolakan dua rekaman membuat dua identitas, bukan kasus jenis survei generik', () => {
  assert.deepEqual(resolveAuditRejectionRecords({units:[unit('U1','R1'),unit('U2','R2')],surveyType:'IRI',records:[record('R1'),record('R2')]}).recordIds,['R1','R2']);
});
test('sampel tidak valid pada jenis lain tidak boleh berubah menjadi kasus generik', () => {
  assert.match(resolveAuditRejectionRecords({units:[unit('U1','R1')],surveyType:'PCI',records:[record('R1')]}).error ?? '',/tidak memiliki sampel/);
});
test('sampel kehilangan rekaman sumber tidak boleh menghasilkan kasus tanpa tautan', () => {
  assert.match(resolveAuditRejectionRecords({units:[unit('U1','R1')],surveyType:'IRI',records:[]}).error ?? '',/rekaman sumber/);
});
test('penolakan checklist tanpa unit tidak valid tetap dapat membuat kasus eksplisit tanpa tautan', () => {
  assert.deepEqual(resolveAuditRejectionRecords({units:[],surveyType:'IRI',records:[]}).recordIds,[undefined]);
});
test('kasus aktif hanya dideduplikasi pada rekaman dan sumber yang sama', () => {
  const cases=[{source:'Penolakan audit tingkat 2',surveyType:'IRI',linkedRecordId:'R1',status:'Terbuka'}] as CorrectionCase[];
  assert.equal(hasOpenAuditRejectionCase({cases,source:'Penolakan audit tingkat 2',surveyType:'IRI',recordId:'R1'}),true);
  assert.equal(hasOpenAuditRejectionCase({cases,source:'Penolakan audit tingkat 2',surveyType:'IRI',recordId:'R2'}),false);
});
