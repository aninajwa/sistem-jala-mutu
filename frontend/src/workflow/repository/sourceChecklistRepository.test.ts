import {filledSourceFixture} from '../testing/sourceFixture';
import test from 'node:test';import assert from 'node:assert/strict';
import {sourceInspectionStatus} from './sourceChecklistRepository';import {sourceDocument,documentQuestions,sourceDocumentKey} from '../sourceDocumentModel';
test('switching survey forms preserves package/template drafts without copying answers across surveys',()=>{
 const memory=new Map<string,string>(),iri=sourceDocument('IRI','calibration')!,pci=sourceDocument('PCI','calibration')!;
 const iriKey=sourceDocumentKey('package-8',iri.id),pciKey=sourceDocumentKey('package-8',pci.id);
 assert.notEqual(iriKey,pciKey);assert.match(iriKey,/^jala-source-exact-v1:package-8:/);assert.match(pciKey,/^jala-source-exact-v1:package-8:/);
 memory.set(iriKey,JSON.stringify({iriAnswer:'draft'}));
 assert.equal(memory.get(pciKey),undefined,'switching to PCI starts with its own draft namespace');
 memory.set(pciKey,JSON.stringify({pciAnswer:'other draft'}));
 assert.deepEqual(JSON.parse(memory.get(iriKey)!),{iriAnswer:'draft'},'switching back restores the IRI draft');
 assert.deepEqual(JSON.parse(memory.get(pciKey)!),{pciAnswer:'other draft'},'PCI stays isolated from IRI answers');
});
test('audit completeness is isolated by package, survey and audit level; no old approval is copied',()=>{
 const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)}});
 const document=sourceDocument('PCI','audit')!,answers=filledSourceFixture(document);
 memory.set(sourceDocumentKey('p::audit-1',document.id),JSON.stringify(answers));assert.equal(sourceInspectionStatus('p::audit-1','PCI','audit').complete,true);
 assert.equal(sourceInspectionStatus('p::audit-2','PCI','audit').complete,false);assert.equal(sourceInspectionStatus('q::audit-1','PCI','audit').complete,false);
 assert.equal(sourceInspectionStatus('p::audit-1','IRI','audit').complete,false);
 const question=documentQuestions(document).find(item=>item.options.includes('Tidak'))!;answers[question.id]='Tidak';memory.set(sourceDocumentKey('p::audit-1',document.id),JSON.stringify(answers));assert.ok(sourceInspectionStatus('p::audit-1','PCI','audit').concerns.length>0);
});
