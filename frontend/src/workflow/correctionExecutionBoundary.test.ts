import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWorkflow } from './demoScenario';
import { correctionExecutionErrors, type CorrectionExecution } from './correctionFormEngine';
import { correctionMutationError } from './checkpoint09Corrections';
import { requiresLayeredCorrectionVerification } from './correctionActionPolicy';
const s=createDemoWorkflow('verval-finding');
const c={...s.corrections[0],status:'Disetujui' as const,approval:'Disetujui' as const};
const result:CorrectionExecution={date:'2026-11-25',summary:'Hasil survei ulang',sourceReference:'NEW',period:String(c.cyclePeriod??1),lane:'1',equipment:'IRI-1',verificationReference:'TEST',actionFields:{coverage:'STA 0+000–0+100',newRecord:'NEW'},evidenceKeys:[`${s.project.id}::correction::${c.id}::execution:documents:1`],evidenceNote:''};
test('execution requires structured result and rejects text only',()=>{const before={...s,role:'Penyedia Jasa / Ketua Tim' as const,corrections:[c]};const after={...before,corrections:[{...c,status:'Dilaksanakan' as const,executionReference:'NEW'}]};assert.ok(correctionMutationError(before,after));assert.equal(correctionMutationError(before,{...after,corrections:[{...after.corrections[0],executionResult:result}]}),undefined);});
test('bridge resurvey does not require lane or instrument',()=>{assert.deepEqual(correctionExecutionErrors({...c,surveyType:'Jembatan'}, {...result,lane:'',equipment:''},s.project.id),[]);});
test('wrong cycle attachment and missing action field rejected',()=>{assert.ok(correctionExecutionErrors(c,result,s.project.id,2).length);assert.ok(correctionExecutionErrors(c,{...result,actionFields:{}},s.project.id).length);});
test('layered verification only for processing correction',()=>{assert.equal(requiresLayeredCorrectionVerification(c),false);assert.equal(requiresLayeredCorrectionVerification({...c,actionType:'Koreksi pemrosesan dengan bukti'}),true);});
test('PCI execution domain requires method-specific reference',()=>{
  const pci={...c,surveyType:'PCI' as const};
  const values={coverage:'STA 0+000–0+100',newRecord:'NEW'};
  const validate=(actionFields:Record<string,string>)=>correctionExecutionErrors(pci,{...result,actionFields},s.project.id);
  assert.ok(validate(values).length);
  assert.ok(validate({...values,pciMethod:'unknown'}).length);
  assert.ok(validate({...values,pciMethod:'Manual',pciDetectionReference:'AI'}).length);
  assert.ok(validate({...values,pciMethod:'AI',pciRaterReference:'MANUAL'}).length);
  assert.deepEqual(validate({...values,pciMethod:'Manual',pciRaterReference:'MANUAL'}),[]);
  assert.deepEqual(validate({...values,pciMethod:'AI',pciDetectionReference:'AI'}),[]);
});

test('captured production PCI method cannot be replaced at execution',()=>{
 const pci={...c,surveyType:'PCI' as const,originPciMethod:'AI' as const};
 const fields={coverage:'STA 0+000–0+100',newRecord:'NEW'};
 const validate=(actionFields:Record<string,string>)=>correctionExecutionErrors(pci,{...result,actionFields},s.project.id);
 assert.ok(validate({...fields,pciMethod:'Manual',pciRaterReference:'DOC',pciDetectionReference:'DOC'}).length);
 assert.ok(validate({...fields,pciMethod:'AI',pciRaterReference:'DOC'}).length);
 assert.deepEqual(validate({...fields,pciMethod:'AI',pciDetectionReference:'DOC'}),[]);
});

test('execution rejects empty and duplicate attachment identifiers',()=>{
 const key=result.evidenceKeys[0];
 for(const evidenceKeys of [[key.slice(0,-1)],[key.slice(0,-1)+'   '],[key,key],[key+' ']]) {
  assert.ok(correctionExecutionErrors(c,{...result,evidenceKeys},s.project.id).length);
 }
 assert.deepEqual(correctionExecutionErrors(c,{...result,evidenceKeys:[key,key+'2']},s.project.id),[]);
});

test('historical linked PCI method constrains execution without guessing package settings',()=>{
 const record={...s.dailyRecords[0],surveyType:'PCI' as const,technicalData:{pciMethod:'AI'}};
 const pci={...c,surveyType:'PCI' as const,road:record.road,linkedRecordId:record.id};
 const before={...s,role:'Penyedia Jasa / Ketua Tim' as const,dailyRecords:[record],corrections:[pci]};
 const submit=(actionFields:Record<string,string>)=>correctionMutationError(before,{...before,corrections:[{...pci,status:'Dilaksanakan',executionReference:'NEW',executionResult:{...result,actionFields}}]});
 const fields={coverage:'STA 0+000–0+100',newRecord:'NEW'};
 assert.ok(submit({...fields,pciMethod:'Manual',pciRaterReference:'DOC'}));
 assert.equal(submit({...fields,pciMethod:'AI',pciDetectionReference:'DOC'}),undefined);
});

test('execution validates supplied digest mapping and preserves legacy references',()=>{
 const key=result.evidenceKeys[0];
 assert.deepEqual(correctionExecutionErrors(c,{...result,evidenceDigests:{[key]:'a'.repeat(64)}},s.project.id),[]);
 assert.ok(correctionExecutionErrors(c,{...result,evidenceDigests:{}},s.project.id).length);
 assert.ok(correctionExecutionErrors(c,{...result,evidenceDigests:{[key]:'invalid'}},s.project.id).length);
});

test('execution and retest cannot proceed with inconsistent approval',()=>{
 const invalid={...c,approval:'Perlu Revisi' as const};
 const before={...s,role:'Penyedia Jasa / Ketua Tim' as const,corrections:[invalid]};
 assert.ok(correctionMutationError(before,{...before,corrections:[{...invalid,status:'Dilaksanakan',executionReference:'NEW',executionResult:result}]}));
 const executed={...invalid,status:'Dilaksanakan' as const,executionReference:'NEW',executionResult:result};
 const review={...s,role:'PIC Balai / Pengguna Jasa' as const,corrections:[executed]};
 assert.ok(correctionMutationError(review,{...review,corrections:[{...executed,status:'Verifikasi Ulang',retest:'Lulus',retestReference:'REVIEW'}]}));
});
