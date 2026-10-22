import type {OperationalWorkflowState,ProductionTest} from './model';
import {markAuditsForReview} from './workflowRevisions';
/** Each method retains its own draft. Selecting a method is not technical authorization. */
export function switchPciMethod(state:OperationalWorkflowState,manual:boolean):OperationalWorkflowState{
 if(state.role!=='Penyedia Jasa / Ketua Tim')return state;
 const current=state.productionTests.PCI,oldKey=current.pciManual===false?'ai':'manual',nextKey=manual?'manual':'ai';if(oldKey===nextKey)return state;
 const saved={...state.pciMethodDrafts,[oldKey]:structuredClone(current)};
 const empty=Object.fromEntries(Object.entries(current).map(([key,value])=>[key,typeof value==='number'?0:typeof value==='boolean'?false:typeof value==='string'?'':undefined])) as unknown as ProductionTest;
 const selected=saved[nextKey]??{...empty,pciManual:manual,productionDetails:{},referenceChecks:{},sourceMode:'Pencatatan manual' as const,evidenceReference:''};
 return {...state,pciMethodDrafts:saved,productionTests:{...state.productionTests,PCI:{...selected,pciManual:manual}},productionApproval:'Draft',productionApprovalBa:'',audits:markAuditsForReview(state,'Metode PCI berubah; keputusan sebelumnya tetap diarsipkan.'),acceptance:{...state.acceptance,finalAcceptance:false}};
}
