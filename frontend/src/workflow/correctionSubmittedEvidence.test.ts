import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { submittedCorrectionEvidenceKeys } from './correctionSubmittedEvidence';
const base = 'P::correction::K::execution';
test('submitted references exclude other cases, proposals, and malformed keys', () => {
 const valid = `${base}::submission-2:documents:file-a`;
 assert.deepEqual(submittedCorrectionEvidenceKeys([valid,valid,`${base}:documents:file-b`,'P::correction::OTHER::execution:documents:x','P::correction::K:documents:x',`${base}:documents: `,`${base}oops:documents:x`,42], 'P','K'), [valid,`${base}:documents:file-b`]);
});
test('missing legacy references do not create evidence', () => {
 assert.deepEqual(submittedCorrectionEvidenceKeys(undefined,'P','K'),[]);
});

import { correctionEvidenceDigest, correctionEvidenceIntegrity, validCorrectionEvidenceDigests } from './correctionSubmittedEvidence';
test('digest binds actual bytes and distinguishes legacy from mismatch', async () => {
 const first = await correctionEvidenceDigest(new Blob(['original']));
 const other = await correctionEvidenceDigest(new Blob(['changed']));
 assert.equal(first.length,64);
 assert.equal(correctionEvidenceIntegrity(first,first),'matched');
 assert.equal(correctionEvidenceIntegrity(first,other),'mismatch');
 assert.equal(correctionEvidenceIntegrity(undefined,other),'legacy');
});
test('digest mapping requires exactly the submitted references', () => {
 const key=base+':documents:a', hash='a'.repeat(64);
 assert.equal(validCorrectionEvidenceDigests([key],{[key]:hash}),true);
 assert.equal(validCorrectionEvidenceDigests([key],{}),false);
 assert.equal(validCorrectionEvidenceDigests([key],{[key]:'fake'}),false);
 assert.equal(validCorrectionEvidenceDigests([key],{[key]:hash,extra:hash}),false);
});

import { EVIDENCE_LINK_CHANGED, updateEvidenceLink, readEvidenceLinks } from './repository/evidenceLinks';
test('evidence link edits notify listeners only after persistence, including detach', () => {
 const oldStorage = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const oldWindow = Object.getOwnPropertyDescriptor(globalThis,'window');
 const data = new Map<string,string>();
 const target = new EventTarget();
 const scope = base, key = `${scope}:documents:a`;
 try {
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}});
  Object.defineProperty(globalThis,'window',{configurable:true,value:target});
  const seen:unknown[]=[];
  target.addEventListener(EVIDENCE_LINK_CHANGED,event=>seen.push({detail:(event as CustomEvent).detail,detached:readEvidenceLinks(scope)[key]?.detached}));
  updateEvidenceLink(scope,key,{fileKey:'file-a'},'Tautkan');
  updateEvidenceLink(scope,key,{detached:true},'Lepaskan');
  assert.deepEqual(seen,[{detail:{scope,key},detached:undefined},{detail:{scope,key},detached:true}]);
  assert.equal(readEvidenceLinks(scope)[key].fileKey,'file-a');
 } finally {
  if(oldStorage)Object.defineProperty(globalThis,'localStorage',oldStorage);else Reflect.deleteProperty(globalThis,'localStorage');
  if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');
 }
});
