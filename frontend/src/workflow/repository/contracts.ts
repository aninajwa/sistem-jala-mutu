import type { OperationalWorkflowState, SurveyType, WorkflowRole } from '../model';
export type EntityIdentity={packageId:string;periodId?:string;auditLevel?:1|2|3;templateVersion?:string;surveyType?:SurveyType};
export type Principal={id:string;role:WorkflowRole;packageIds:string[];balaiIds:string[];source:'local-test'|'server';};
export type Decision='Diajukan'|'Disetujui'|'Perlu Revisi'|'Ditolak';
export type ApiProblem={code:'FORBIDDEN'|'GATE_BLOCKED'|'VERSION_CONFLICT'|'VALIDATION_ERROR'|'UNAVAILABLE';message:string;fieldErrors?:Record<string,string>;};
export interface Versioned<T>{data:T;version:number;authority:'local-draft'|'server-recorded';}
export interface WorkflowRepository{
 listPackages(principal:Principal):Promise<Versioned<OperationalWorkflowState>[]>;
 getPackage(id:string):Promise<Versioned<OperationalWorkflowState>>;
 saveDraft(id:string,state:OperationalWorkflowState,expectedVersion:number):Promise<Versioned<OperationalWorkflowState>>;
 saveChecklist(identity:EntityIdentity,templateId:string,answers:Record<string,unknown>,expectedVersion:number):Promise<void>;
 setPeriod(identity:EntityIdentity):Promise<void>;
 submit(identity:EntityIdentity,stage:string,expectedVersion:number):Promise<void>;
 review(identity:EntityIdentity,stage:string,decision:Decision,note:string,expectedVersion:number):Promise<void>;
 audit(identity:EntityIdentity,level:1|2|3,payload:unknown,expectedVersion:number):Promise<void>;
 followUp(identity:EntityIdentity,payload:unknown,expectedVersion:number):Promise<void>;
 document(identity:EntityIdentity,payload:unknown,expectedVersion:number):Promise<void>;
}
