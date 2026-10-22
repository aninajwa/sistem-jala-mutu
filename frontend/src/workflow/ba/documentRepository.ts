import {readLocal,writeLocal} from '../repository/localPersistence';
import type {BaKind} from './docxEngine';
export type BaIdentity={packageId:string;kind:BaKind;period:number;survey:string;auditLevel:number};
export type BaVersion={id:string;version:number;createdAt:string;actor:string;templateHash:string;status:'local-draft'|'submitted-local'|'decision-recorded-local'|'revision-requested-local'|'rejected-local'|'reviewed-local';sourceSnapshot?:unknown;sourceFingerprint?:string;reviewNote?:string;basedOnVersion?:number;fields:Record<string,string>;officiallySigned:false;};
export const baKey=(id:BaIdentity)=>`jala-ba-source-v1:${id.packageId}:${id.kind}:${id.period}:${id.survey}:${id.auditLevel}`;
export const documentRepository={
 read:(identity:BaIdentity)=>readLocal<{draft:Record<string,string>;versions:BaVersion[]}>(baKey(identity),{draft:{},versions:[]}),
 saveDraft(identity:BaIdentity,draft:Record<string,string>){const old=this.read(identity);writeLocal(baKey(identity),{...old,draft});},
 addVersion(identity:BaIdentity,value:Omit<BaVersion,'id'|'version'|'createdAt'|'officiallySigned'>){const old=this.read(identity);const next:BaVersion={...value,id:crypto.randomUUID(),version:old.versions.length+1,createdAt:new Date().toISOString(),officiallySigned:false};writeLocal(baKey(identity),{draft:old.draft,versions:[...old.versions,next]});return next;},
};
