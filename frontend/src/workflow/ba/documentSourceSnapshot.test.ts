import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_WORKFLOW} from '../model';
import {STAGE3B_DOCX_CANDIDATES} from '../stage3bChecklistData.docx-candidate';
import {documentSourceSnapshot} from './documentSourceSnapshot';
import type {BaIdentity} from './documentRepository';
test('snapshot BA PCI AI mengikuti checklist AI, bukan checklist Manual',()=>{
 const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}});
 const state=structuredClone(INITIAL_WORKFLOW);state.project.id='isolated';state.productionTests.PCI.pciManual=false;
 const joint:BaIdentity={packageId:'isolated',kind:'duaMingguan',period:1,survey:'PCI',auditLevel:1};
 const ai=STAGE3B_DOCX_CANDIDATES.find(t=>t.survey==='PCI AI'&&t.phase==='periodic14')!;const manual=STAGE3B_DOCX_CANDIDATES.find(t=>t.survey==='PCI Manual'&&t.phase==='periodic14')!;
 const key='jala-mutu-stage3b-docx-isolated-v1';const before=documentSourceSnapshot(state,joint);
 localStorage.setItem(key,JSON.stringify({[`isolated::${manual.id}::test`]:'manual'}));assert.deepEqual(documentSourceSnapshot(state,joint),before);
 localStorage.setItem(key,JSON.stringify({[`isolated::${ai.id}::test`]:'ai'}));assert.notDeepEqual(documentSourceSnapshot(state,joint),before);
 assert.deepEqual(Object.values(documentSourceSnapshot(state,joint).legacyAnswers),['ai']);
});
