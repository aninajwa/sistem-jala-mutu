import type {OperationalWorkflowState,WorkflowRole} from '../model';
import type {Principal} from '../repository/contracts';
import {readLocal} from '../repository/localPersistence';
export const isRoleTestMode=()=>import.meta.env.DEV&&(new URLSearchParams(window.location.search).get('testRoles')==='1'||import.meta.env.VITE_ENABLE_ROLE_TESTING==='true');
export function localPrincipal(role:WorkflowRole,packages:Record<string,OperationalWorkflowState>):Principal{
 const ids=Object.keys(packages);const primary=ids.includes('PAKET-DEMO-001')?'PAKET-DEMO-001':ids.find(id=>!id.includes('DEMO-002'))??ids[0];
 const assignments=readLocal<Record<string,string[]>>('jala-local-assignments-v1',{});
 const id=`local:${role}`;
 const packageIds=assignments[id]??(role==='Admin'||role==='Direktorat / Pusat'?ids:primary?[primary]:[]);
 return {id,role,packageIds,balaiIds:[],source:'local-test'};
}
export function canViewPackage(principal:Principal,state:OperationalWorkflowState){return principal.packageIds.includes(state.project.id);}
export function visiblePackages(packages:Record<string,OperationalWorkflowState>,principal:Principal){return Object.fromEntries(Object.entries(packages).filter(([,state])=>canViewPackage(principal,state)));}
export function isLegacyExample(state:OperationalWorkflowState){return /^PAKET-(DEMO-|QA-)/.test(state.project.id)&&state.project.id!=='PAKET-DEMO-001';}
