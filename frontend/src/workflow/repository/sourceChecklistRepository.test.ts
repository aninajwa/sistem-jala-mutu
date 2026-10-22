import test from 'node:test';import assert from 'node:assert/strict';
import {sourceInspectionStatus} from './sourceChecklistRepository';import {sourceDocument,documentQuestions,sourceDocumentKey} from '../sourceDocumentModel';
test('audit completeness is isolated by package, survey and audit level; no old approval is copied',()=>{
 const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)}});
 const document=sourceDocument('PCI','audit')!,answers=Object.fromEntries(documentQuestions(document).map(item=>[item.id,item.multiple?JSON.stringify([item.options[0]]):item.options[0]]));
 memory.set(sourceDocumentKey('p::audit-1',document.id),JSON.stringify(answers));assert.equal(sourceInspectionStatus('p::audit-1','PCI','audit').complete,true);
 assert.equal(sourceInspectionStatus('p::audit-2','PCI','audit').complete,false);assert.equal(sourceInspectionStatus('q::audit-1','PCI','audit').complete,false);
 assert.equal(sourceInspectionStatus('p::audit-1','IRI','audit').complete,false);
 const question=documentQuestions(document).find(item=>item.options.includes('Tidak'))!;answers[question.id]='Tidak';memory.set(sourceDocumentKey('p::audit-1',document.id),JSON.stringify(answers));assert.ok(sourceInspectionStatus('p::audit-1','PCI','audit').concerns.length>0);
});
