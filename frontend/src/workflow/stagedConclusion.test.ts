import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceDocument,documentQuestions} from './sourceDocumentModel';
import {stagedConclusion,stagedDecisionPanelQuestion} from './stagedConclusion';
import {sourceFieldRules} from './sourceFormValidation';
const cases=[['IRI',true,'t14:r2:c2','Diterima','Sesuai'],['Jembatan',true,'t16:r10:c2','Perlu perbaikan','Temuan'],['Drainase',true,'t13:r9:c2','DITERIMA DENGAN CATATAN','Diterima dengan catatan'],['Lereng',true,'t24:selection','Diterima bersyarat','Diterima bersyarat'],['Lereng',true,'t24:selection','Ditolak sebagian','Ditolak sebagian'],['PCI',false,'paragraph:p62','TIDAK DITERIMA','Temuan'],['RNI',true,'paragraph:p36','Disetujui tanpa catatan','Sesuai']] as const;
for(const [survey,manual,key,raw,status] of cases)test(`${survey}: ${raw}`,()=>{const doc=sourceDocument(survey,'staged',manual)!;assert.ok(documentQuestions(doc).find(q=>q.id===key)?.options.includes(raw));assert.ok(sourceFieldRules(doc).some(r=>r.id===key&&r.required));assert.deepEqual(stagedConclusion(doc,{[key]:raw}),{raw,status});assert.equal(stagedConclusion(doc,{[key]:'arbitrary'}),undefined);});
test('Traffic overall Lanjut must not hide adverse or missing aspect decisions',()=>{const d=sourceDocument('Lalu Lintas','staged')!,answers=Object.fromEntries([2,3,4,5,6,7].map(i=>[`t20:r${i}:c4`,'Lanjut']));assert.equal(stagedConclusion(d,answers)?.status,'Sesuai');answers['t20:r3:c4']='Ulang';assert.equal(stagedConclusion(d,answers)?.status,'Temuan');delete answers['t20:r3:c4'];assert.equal(stagedConclusion(d,answers),undefined);});
test('PCI Manual never invents overall decision from arbitrary field',()=>{assert.equal(stagedConclusion(sourceDocument('PCI','staged',true)!,{'paragraph:p62':'DITERIMA'}),undefined);});

test('visible decision panel uses the original PCI AI and RNI answer IDs, without inventing PCI Manual decisions',()=>{
 const ai=sourceDocument('PCI','staged',false)!;
 const q=stagedDecisionPanelQuestion(ai)!;
 assert.equal(q.id,'paragraph:p62');
 assert.deepEqual(q.options,['DITERIMA','DITERIMA DENGAN CATATAN','TIDAK DITERIMA']);
 assert.ok(ai.blocks!.findIndex(b=>b.id===q.paragraph)>ai.blocks!.findIndex(b=>b.kind==='heading'&&b.text==='LAMPIRAN'));
 assert.equal(documentQuestions(ai).filter(item=>item.id===q.id).length,1);
 const rni=sourceDocument('RNI','staged')!;
 const r=stagedDecisionPanelQuestion(rni)!;
 assert.equal(r.id,'paragraph:p36');
 assert.deepEqual(r.options,['Disetujui tanpa catatan','Disetujui dengan catatan (perbaikan minor)','Ditolak (memerlukan perbaikan mayor)']);
 assert.equal(documentQuestions(rni).filter(item=>item.id===r.id).length,1);
 assert.equal(stagedDecisionPanelQuestion(sourceDocument('PCI','staged',true)!),undefined);
 assert.equal(stagedDecisionPanelQuestion(sourceDocument('RNI','periodic14')!),undefined);
});
