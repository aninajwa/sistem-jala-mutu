import test from 'node:test';import assert from 'node:assert/strict';
import {sourceDocument} from './sourceDocumentModel';import {bridgeSamplingResult} from './sourceTechnicalEvaluation';import {switchPciMethod} from './pciMethods';import {createDemoWorkflow} from './demoScenario';import {evaluateStageGate} from './workflowGate';
test('bridge sampling evaluates exact source level differences and never guesses missing input',()=>{
 const doc=sourceDocument('Jembatan','calibration')!;
 assert.equal(bridgeSamplingResult(doc,13,2,{})?.label,'Belum dapat dinilai');
 for(const [value,expected] of [['2','Sesuai'],['3','Minor'],['4','Major'],['2.5','Belum dapat dinilai']])assert.equal(bridgeSamplingResult(doc,13,2,{'value:t13:r2:c3':'2','value:t13:r2:c4':value})?.label,expected);
});
test('PCI method drafts are independent, recover previous values and AI cannot use a legacy approval',()=>{
 const state=createDemoWorkflow('complete');state.role='Penyedia Jasa / Ketua Tim';state.productionTests.PCI.pciManual=true;state.productionTests.PCI.evidenceReference='MANUAL-REF';
 const ai=switchPciMethod(state,false);assert.equal(ai.productionTests.PCI.evidenceReference,'');ai.productionTests.PCI.evidenceReference='AI-REF';const manual=switchPciMethod(ai,true);assert.equal(manual.productionTests.PCI.evidenceReference,'MANUAL-REF');
 assert.equal(switchPciMethod(manual,false).productionTests.PCI.evidenceReference,'AI-REF');ai.productionApproval='Disetujui';assert.equal(evaluateStageGate(ai,'Tahap 3A').readyToComplete,false);
 state.role='Admin';assert.equal(switchPciMethod(state,false),state);
});

import {semesterTwoApplies,semesterTwoReadiness,termReadiness} from './flowRules';
test('Semester II IRI does not block non-IRI packages and remains required for IRI',()=>{const state=createDemoWorkflow('complete');state.project.surveyTypes=['RNI'];state.acceptance.semesterTwoRevalidation=false;assert.equal(semesterTwoApplies(state),false);assert.deepEqual(semesterTwoReadiness(state),[]);assert.deepEqual(termReadiness(state,'T4'),[]);state.project.surveyTypes=['IRI'];assert.equal(semesterTwoApplies(state),true);assert.ok(termReadiness(state,'T4').includes('Persetujuan revalidasi Semester II wajib'));});

import fs from 'node:fs';import path from 'node:path';import {normalizeWorkflowSelection} from './legacySelection';
test('UTF-8 UI source is clean and existing audit URLs remain usable',()=>{const walk=(dir:string):string[]=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):/\.tsx?$/.test(entry.name)?[path.join(dir,entry.name)]:[]);for(const file of walk('src'))assert.equal(/[\u00e2][\u20ac\u2020\u2030]|\u00c2[\u00b7\u00b2]/.test(fs.readFileSync(file,'utf8')),false,file);assert.equal(normalizeWorkflowSelection('/verification:Audit tingkat 1\u00e2\u20ac\u201c3'),'/verification:Audit tingkat 1–3');});

import {submissionInputChanged} from './submissionRevisions';
test('confirming an unchanged submission destination does not invalidate the internal audit',()=>{const state=createDemoWorkflow('complete');assert.equal(submissionInputChanged(state.submission,{targetSystems:[...state.submission.targetSystems],validationStatus:'VALID',validationMessage:'Siap'}),false);assert.equal(submissionInputChanged(state.submission,{rawFileName:'berkas lain'}),true);});

import {sourceBound,sourceScalarResult} from './sourceScalarEvaluation';
test('scalar source comparisons use exact row bounds and reject dimensions or missing values',()=>{assert.equal(sourceBound('Min. 800x600'),undefined);assert.equal(sourceBound('0,9'),undefined);assert.equal(sourceBound('0,9','Standar Minimal')?.operator,'>=');const manual=sourceDocument('PCI','consistency',true)!;assert.equal(sourceScalarResult(manual,7,2,{})?.label,'Belum dapat dinilai');assert.equal(sourceScalarResult(manual,7,2,{'value:t7:r2:c2':'5'})?.label,'Sesuai');assert.equal(sourceScalarResult(manual,7,2,{'value:t7:r2:c2':'5.1'})?.label,'Tidak Sesuai');const ai=sourceDocument('PCI','internal',false)!;assert.equal(sourceScalarResult(ai,14,2,{'value:t14:r2:c3':'0.89'})?.label,'Tidak Memenuhi');assert.equal(sourceScalarResult(ai,14,2,{'value:t14:r2:c3':'0.90'})?.label,'Memenuhi');});

import {workflowFormIssues} from './repository/workflowReconciliation';
import {sourceDocumentKey,documentQuestions} from './sourceDocumentModel';
test('legacy approval flags do not conceal missing current forms and reconciliation never resets history',()=>{const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)}});const state=createDemoWorkflow('start');state.project.surveyTypes=['RNI'];state.calibrationChecklist.RNI=true;const before=JSON.stringify(state);assert.ok(workflowFormIssues(state).some(issue=>issue.stage==='Tahap 1'));assert.equal(JSON.stringify(state),before);const doc=sourceDocument('RNI','calibration')!;memory.set(sourceDocumentKey(state.project.id,doc.id),JSON.stringify(Object.fromEntries(documentQuestions(doc).map(question=>[question.id,question.multiple?JSON.stringify(question.options):question.options[0]]))));assert.equal(workflowFormIssues(state).some(issue=>issue.stage==='Tahap 1'),false);assert.equal(JSON.stringify(state),before);});
