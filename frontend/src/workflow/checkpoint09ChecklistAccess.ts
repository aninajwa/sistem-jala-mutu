import type {OperationalWorkflowState,SurveyType,WorkflowRole} from './model';
import type {SourceDocument} from './sourceDocumentModel';
const P:WorkflowRole='Penyedia Jasa / Ketua Tim',B:WorkflowRole='PIC Balai / Pengguna Jasa',D:WorkflowRole='Direktorat / Pusat';
export const CHECKLIST_STAGES:Record<string,string>={calibration:'Tahap 1',consistency:'Tahap 3B',internal:'Tahap 3B',periodic14:'Tahap 3B',staged:'Tahap 4',audit:'Tahap 5',acceptance:'Tahap 6'};
export function checklistAccess(document:SourceDocument,state:OperationalWorkflowState,auditLevel=1){
 const type=(document.survey.startsWith('PCI')?'PCI':document.survey) as SurveyType;
 const inScope=state.project.surveyTypes.includes(type),variant=type!=='PCI'||(document.survey==='PCI Manual')===(state.productionTests.PCI.pciManual!==false);
 const supplement=document.id==='ba-audit-lendutan';
 const level=document.auditLevel??auditLevel;
 const actor=document.phase==='audit'?([P,B,D][level-1]):['periodic14','acceptance'].includes(document.phase)?B:P;
 return {type,inScope,variant,supplement,level,actor,editable:inScope&&variant&&!supplement&&state.role===actor,stage:CHECKLIST_STAGES[document.phase]};
}
