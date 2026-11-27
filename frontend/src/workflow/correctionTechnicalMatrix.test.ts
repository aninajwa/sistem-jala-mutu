import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCorrectionForm,validateCorrectionExecutionFields,correctionExecutionContext} from './correctionFormEngine';
import type {CorrectionCase} from './model';
const surveys=[['IRI',undefined],['PCI','Manual'],['PCI','AI'],['Lendutan',undefined],['RNI',undefined],['Jembatan',undefined],['Lereng',undefined],['Drainase',undefined],['Lalu Lintas',undefined]] as const;
const actions=[
 ['Survei ulang sebagian ruas',['coverage','newRecord']],
 ['Penilaian ulang (re-rating)',['evaluatedObject','comparison']],
 ['Ambil ulang foto/video',['mediaObject','mediaReference']],
 ['Pelatihan ulang personel',['participants','trainingEvaluation']],
 ['Kalibrasi ulang alat',['instrumentId','calibrationEvidence']],
 ['Penggantian komponen alat',['instrumentId','postReplacement']],
 ['Penggantian personel',['assignment','competence']],
 ['Koreksi pemrosesan dengan bukti',['rawReference','cleanedReference','processingMethod']],
 ['Investigasi keterlambatan dan rencana tindak lanjut',['investigation']],
] as const;
// Structural contract only: does not assert every action is authorized for every finding.
for(const [survey,method] of surveys)for(const [actionType,base] of actions)test(`${survey} ${method??''}: ${actionType}`,()=>{
 const c={surveyType:survey,originPciMethod:method,actionType,source:'Verval 14 hari',blockedStage:'Verval 14 hari',rejectionReason:'Temuan uji'} as CorrectionCase;
 const extra=method&&/^(Survei ulang|Penilaian ulang)/.test(actionType)?['pciMethod',method==='Manual'?'pciRaterReference':'pciDetectionReference']:[];
 const ids=[...base,...extra];const form=resolveCorrectionForm(c,method?{pciMethod:method}:{});
 assert.deepEqual(form.fields.map(f=>f.id),ids);assert.equal(new Set(ids).size,ids.length);
 const values=Object.fromEntries(ids.map(k=>[k,k==='pciMethod'?method!:'REF-UJI']));
 assert.deepEqual(validateCorrectionExecutionFields(form,values),[]);
 for(const k of ids){const missing={...values,[k]:'  '};assert.equal(validateCorrectionExecutionFields(form,missing).length,1,k);}
 if(extra.length){assert.equal(form.fields.find(f=>f.id==='pciMethod')?.fixedValue,method);assert.equal(validateCorrectionExecutionFields(form,{...values,pciMethod:method==='Manual'?'AI':'Manual'}).length,1);}
 const context=correctionExecutionContext(c);assert.equal(context.lane,actionType.startsWith('Survei ulang')&&survey==='IRI');assert.equal(context.equipment,actionType.startsWith('Survei ulang')&&['IRI','Lendutan'].includes(survey));
});
