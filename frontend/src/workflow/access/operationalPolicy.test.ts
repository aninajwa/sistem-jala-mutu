import test from 'node:test';
import assert from 'node:assert/strict';
import {mayOperate,STAGE_POLICY,type StageOperation} from './operationalPolicy';
import type {WorkflowRole} from '../model';
import {INITIAL_WORKFLOW} from '../model';
import {localPrincipal,canViewPackage} from './packageAccess';
const roles:WorkflowRole[]=['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'];
const operations:StageOperation[]=['view','draft','submit','comment','approve','revise','reject','baDraft','recordDecision'];
test('matrix 4 role x 8 tahap x 9 tindakan; Admin hanya membaca',()=>{
 for(const stage of Object.keys(STAGE_POLICY) as (keyof typeof STAGE_POLICY)[]){
  for(const role of roles){for(const action of operations){const allowed=mayOperate(role,stage,action);if(action==='view')assert.equal(allowed,true);if(role==='Admin'&&action!=='view')assert.equal(allowed,false);if(stage==='Tahap 3A'&&['approve','reject','revise','submit','recordDecision'].includes(action))assert.equal(allowed,false);}}
 }
});
test('audit 1/2/3 hanya oleh actor pada tingkat masing-masing',()=>{
 for(const role of roles)for(const level of [1,2,3] as const)assert.equal(mayOperate(role,'Tahap 5','approve',level),roles[level-1]===role);
});
test('penugasan lokal menolak membuka paket di luar cakupan',()=>{
 const one=structuredClone(INITIAL_WORKFLOW);one.project.id='PAKET-DEMO-001';const other=structuredClone(one);other.project.id='PAKET-OTHER';
 const principal=localPrincipal(roles[0],{'PAKET-DEMO-001':one,'PAKET-OTHER':other});assert.equal(canViewPackage(principal,one),true);assert.equal(canViewPackage(principal,other),false);
});
