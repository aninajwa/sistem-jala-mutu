import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_WORKFLOW, type WorkflowRole} from './model';
import {getNextWorkflowAction} from './WorkflowNextAction';

const fixture=(role:WorkflowRole)=>({ ...structuredClone(INITIAL_WORKFLOW), role });
const provider:WorkflowRole='Penyedia Jasa / Ketua Tim';
const balai:WorkflowRole='PIC Balai / Pengguna Jasa';
const directorate:WorkflowRole='Direktorat / Pusat';

test('Admin next action opens administration instead of legacy package submodule',()=>{
  const action=getNextWorkflowAction(fixture('Admin'));
  assert.equal(action.selection,'/audit:Pengguna');
});
test('Directorate is never redirected to provider forms by incomplete inputs',()=>{
  const state=fixture(directorate);
  state.project.preparation.documents={...state.project.preparation.documents, ['Laporan Pendahuluan']:false};
  const action=getNextWorkflowAction(state);
  assert.equal(action.selection,'/verification:Audit tingkat 1–3');
  assert.notEqual(action.title,'Periksa ulang kelengkapan formulir');
});
test('Balai next action does not misidentify provider form gaps as its review duty',()=>{
  const state=fixture(balai);
  state.project.preparation.documents={...state.project.preparation.documents, ['Laporan Pendahuluan']:false};
  const action=getNextWorkflowAction(state);
  assert.notEqual(action.title,'Periksa ulang kelengkapan formulir');
  if(action.title==='Pantau paket dan pemeriksaan yang menunggu review') assert.equal(action.selection,'/packages:Ringkasan Paket');
});
test('Provider still receives an actionable workflow destination',()=>{
  const action=getNextWorkflowAction(fixture(provider));
  assert.ok(action.selection.startsWith('/'));
  assert.ok(action.title.trim());
});
