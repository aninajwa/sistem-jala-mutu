import {describe,it,expect} from 'vitest';
import {checklistAccess} from './checkpoint09ChecklistAccess';
import {workflowMutationError} from './workflowMutationPermissions';
import {createDemoWorkflow} from './demoScenario';
import catalog from './sourceChecklistCatalog.json';
import {SURVEY_TYPES,type WorkflowRole} from './model';
import type {SourceDocument} from './sourceDocumentModel';
const roles:WorkflowRole[]=['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'];
describe('Checkpoint 09 boundary and original source access',()=>{
 it('all 55 sources remain mapped and only the source actor may edit the active method',()=>{
  expect(catalog.length).toBe(55);const state=createDemoWorkflow('complete');state.project.surveyTypes=[...SURVEY_TYPES];
  for(const pciManual of [true,false])for(const role of roles)for(const doc of catalog as SourceDocument[]){state.role=role;state.productionTests.PCI.pciManual=pciManual;const access=checklistAccess(doc,state,3);const actor=doc.phase==='audit'?roles[(doc.auditLevel??3)-1]:['periodic14','acceptance'].includes(doc.phase)?roles[1]:roles[0];const variant=!doc.survey.startsWith('PCI')||(doc.survey==='PCI Manual')===pciManual;expect(access.inScope).toBe(true);expect(access.stage).toBeTruthy();expect(access.editable).toBe(role===actor&&variant&&doc.id!=='ba-audit-lendutan');}
 });
 it('removing a survey only makes its source unavailable for editing, never renumbers IDs',()=>{const state=createDemoWorkflow('complete');state.project.surveyTypes=[];for(const doc of catalog as SourceDocument[])expect(checklistAccess(doc,state).editable).toBe(false);});
 it('central actions transaction rejects unauthorized correction mutations and case deletion',()=>{for(const role of roles){const before=createDemoWorkflow('verval-finding');before.role=role;expect(workflowMutationError(before,{...before,corrections:[]},'/actions:Koreksi berbukti')).toBeTruthy();}const s=createDemoWorkflow('verval-finding');s.role=roles[2];const after={...s,corrections:s.corrections.map(c=>({...c,owner:'Direktorat'}))};expect(workflowMutationError(s,after,'/actions:Koreksi berbukti')).toBeTruthy();});
});
