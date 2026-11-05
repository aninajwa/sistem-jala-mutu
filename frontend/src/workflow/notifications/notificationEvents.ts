import type {OperationalWorkflowState,WorkflowRole} from '../model';
import type {BaIdentity} from '../ba/documentRepository';
export const PROVIDER:WorkflowRole='Penyedia Jasa / Ketua Tim',BALAI:WorkflowRole='PIC Balai / Pengguna Jasa',CENTRE:WorkflowRole='Direktorat / Pusat';
export type Duty='lead'|'review'|'audit'|'supervise'|'administration';
export type Member={id:string;name:string;role:WorkflowRole;active:boolean;assignments:{packageId:string;balai:string;duties:Duty[]}[]};
export type Target={module:'workflow';packageId:string;selection:string;period?:number;auditLevel?:number}|{module:'correction';packageId:string;caseId:string}|{module:'document';packageId:string;identity:BaIdentity};
export type Subject={kind:'preparation'|'production'|'period'|'submission'|'audit'|'correction'|'document';id:string;period?:number;auditLevel?:number;identity?:BaIdentity};
export type NoticeEvent={id:string;type:string;packageId:string;subject:Subject;sourceVersion:string;occurredAt:string;title:string;recipientRole:WorkflowRole;duty:Duty;actionRequired:boolean;expectedState:string;target:Target;rule:string;obligationId?:string;escalationRuleId?:string};
export type Notification=Omit<NoticeEvent,'recipientRole'>&{eventId:string;recipientId:string;recipientName:string;recipientRole:WorkflowRole;readAt:string|null;relevance:'active'|'resolved'|'unavailable';delivery:'local';};
export type Obligation={id:string;packageId:string;title:string;kind:'cycle14'|'long-term'|'correction'|'calibration'|'appointment';dueDate:string;effectiveFrom?:string;reminderOffsets?:number[];completed:boolean;cancelled:boolean;role:WorkflowRole;duty:Duty;target:Target;reference:string;subject:Subject};
export type EscalationRule={id:string;enabled:boolean;obligationKind:Obligation['kind'];afterDays:number;recipientId:string;packageId:string;reference:string};
export type NotificationConfig={version:1;members:Member[];bindings:Record<string,string>;confirmedDates:Record<string,{date:string;reference:string;effectiveFrom?:string}>;escalations:EscalationRule[];caseOwners?:Record<string,string>;documentOwners?:Record<string,string[]>;appointments?:{id:string;packageId:string;title:string;date:string;effectiveFrom?:string;role:WorkflowRole;duty:Duty;target:Target;reference:string;cancelled?:boolean;completed?:boolean}[]};
export type Projection={preparation:string;production:string;periods:Record<string,{submitted:boolean;review:string}>;submission:string;audits:{status:string;requiresReview:boolean}[];corrections:Record<string,{status:string;approval:string;retest:string}>};
export type NotificationStore={version:1;records:Notification[];subjectVersions?:Record<string,string>;workflows:Record<string,{revision:number;projection:Projection}>;documents:Record<string,number>;};
export const emptyStore=():NotificationStore=>({version:1,records:[],workflows:{},documents:{}});
export const emptyConfig=():NotificationConfig=>({version:1,members:[],bindings:{},confirmedDates:{},escalations:[],appointments:[]});
export const operationalPackage=(s:OperationalWorkflowState)=>!!s?.project?.id&&!/^(__|PAKET-(DEMO|QA-))/.test(s.project.id);
export function eventId(...parts:unknown[]){return JSON.stringify(parts);}
export function projectWorkflow(s:OperationalWorkflowState):Projection{
 const periods={...s.cycleHistory,[String(s.activeCyclePeriod??1)]:s.cycle};
 return {preparation:s.project.preparation.reportApproval,production:s.productionApproval,periods:Object.fromEntries(Object.entries(periods).map(([id,c])=>[id,{submitted:c.periodCompleted,review:c.userReview??'Belum Diperiksa'}])),submission:s.submission.validationStatus,audits:s.audits.map(a=>({status:a.status,requiresReview:!!a.requiresReview})),corrections:Object.fromEntries(s.corrections.map(c=>[c.id,{status:c.status,approval:c.approval,retest:c.retest}]))};
}

export function documentIdentityKey(id:BaIdentity){return JSON.stringify({packageId:id.packageId,kind:id.kind,period:id.period,survey:id.survey,auditLevel:id.auditLevel});}

export function documentIdentityAvailable(id:BaIdentity,s:OperationalWorkflowState){
 if(!id||id.packageId!==s.project.id||!s.project.surveyTypes.includes(id.survey as never)||!['kalibrasi','konsistensi','internal','duaMingguan','bertahap','audit','penerimaan'].includes(id.kind)||![1,2,3].includes(id.auditLevel)||id.kind!=='audit'&&id.auditLevel!==1)return false;
 return ['konsistensi','internal','duaMingguan'].includes(id.kind)?Number.isSafeInteger(id.period)&&id.period>=1&&(id.period===(s.activeCyclePeriod??1)||!!s.cycleHistory?.[String(id.period)]):id.period===0;
}

export function subjectKey(e:NoticeEvent){return eventId(e.packageId,e.subject.kind,e.subject.id,e.subject.period??null,e.subject.auditLevel??null);}
