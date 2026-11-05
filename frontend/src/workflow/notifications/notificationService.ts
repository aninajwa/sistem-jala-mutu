import type {OperationalWorkflowState} from '../model';
import type {Principal} from '../repository/contracts';
import {readLocal,localPersistence} from '../repository/localPersistence';
import {PACKAGE_STORE_KEY,type WorkflowPackageStore} from '../packageStore';
import type {BaIdentity,BaVersion} from '../ba/documentRepository';
import {subjectKey,documentIdentityAvailable,documentIdentityKey,eventId,projectWorkflow,operationalPackage,type Notification,type NotificationConfig,type NotificationStore,type NoticeEvent,type Obligation} from './notificationEvents';
import {canAccessNotification,documentEvents,recipients,stateMatches,viewerMember,assigned,SELECTION} from './notificationRules';
import {readConfig,readNotificationStore,saveNotificationStore,NOTIFICATION_CHANGED} from './notificationRepository';
import {jakartaDay,sourceObligations,obligationsFor,reminderEvents,validDate,days} from './notificationSchedule';
export const NOTIFICATION_ERROR='jala-notification-error';
let lastError='';
export function notificationError(){return lastError;}
function fail(error:unknown){lastError=error instanceof Error?error.message:String(error);if(typeof window!=='undefined')window.dispatchEvent(new Event(NOTIFICATION_ERROR));}
function sourceStore(){return readLocal<WorkflowPackageStore>(PACKAGE_STORE_KEY,{activeRole:'Admin',activePackageId:null,packages:{}});}
function addEvents(store:NotificationStore,events:NoticeEvent[],packages:Record<string,OperationalWorkflowState>,cfg:NotificationConfig){
 const ids=new Set(store.records.map(n=>n.id));for(const e of events){const s=packages[e.packageId];if(!s||!operationalPackage(s))continue;if(!e.obligationId&&e.subject.kind!=='document'){store.subjectVersions??={};store.subjectVersions[subjectKey(e)]=e.sourceVersion;}for(const m of recipients(e,s,cfg)){const id=eventId(e.id,m.id,m.role);if(ids.has(id))continue;store.records.push({...e,id,eventId:e.id,recipientId:m.id,recipientName:m.name,recipientRole:m.role,readAt:null,relevance:'active',delivery:'local'});ids.add(id);}}
}
/** Called only after the source repository has persisted successfully. Atomic local cursor+inbox write. */
export function captureWorkflowCommit(before:WorkflowPackageStore|undefined,after:WorkflowPackageStore,at=new Date().toISOString()){
 try{const cfg=readConfig().config,store=readNotificationStore();for(const s of Object.values(after.packages)){if(!operationalPackage(s))continue;const id=s.project.id,next=projectWorkflow(s),cursor=store.workflows[id],old=cursor?.projection??(before?.packages[id]?projectWorkflow(before.packages[id]):next);
  if(JSON.stringify(old)!==JSON.stringify(next)){const revision=(cursor?.revision??0)+1;addEvents(store,workflowEventsSafe(old,s,revision,at),after.packages,cfg);store.workflows[id]={revision,projection:next};}else if(!cursor)store.workflows[id]={revision:0,projection:next};}
 saveIfChanged(store);lastError='';}catch(error){fail(error);}
}
import {workflowEvents as workflowEventsSafe} from './notificationRules';
function saveIfChanged(store:NotificationStore){if(JSON.stringify(readNotificationStore())!==JSON.stringify(store))saveNotificationStore(store);}
function readDocuments(){const out:{identity:BaIdentity;versions:BaVersion[]}[]=[];for(const key of localPersistence.keys?.()??[]){if(!key.startsWith('jala-ba-source-v1:'))continue;const match=/^jala-ba-source-v1:(.+):([^:]+):(\d+):([^:]+):([123])$/.exec(key);if(!match||!['kalibrasi','konsistensi','internal','duaMingguan','bertahap','audit','penerimaan'].includes(match[2]))continue;const d=readLocal<{versions:BaVersion[]}>(key,{versions:[]});if(!Array.isArray(d.versions))continue;out.push({identity:{packageId:match[1],kind:match[2] as BaIdentity['kind'],period:Number(match[3]),survey:match[4],auditLevel:Number(match[5])},versions:d.versions});}return out;}
export function captureDocumentCommit(identity:BaIdentity,version:BaVersion,previousVersion:number){
 try{const store=readNotificationStore(),packages=sourceStore().packages,s=packages[identity.packageId],cfg=readConfig().config,key=documentIdentityKey(identity!);if(!s||!operationalPackage(s))return;
  if((store.documents[key]??previousVersion)<version.version){addEvents(store,documentEvents(identity,version,s),packages,cfg);store.documents[key]=version.version;saveIfChanged(store);}lastError='';
 }catch(error){fail(error);}
}
/** Polling catches missed local delivery, but never fabricates historic transition times on first install. */
export function reconcileNotifications(at=new Date().toISOString()){
 try{const source=sourceStore(),cfg=readConfig().config,store=readNotificationStore();for(const s of Object.values(source.packages)){if(!operationalPackage(s))continue;const next=projectWorkflow(s),cursor=store.workflows[s.project.id];if(cursor&&JSON.stringify(cursor.projection)!==JSON.stringify(next)){const revision=cursor.revision+1;addEvents(store,workflowEventsSafe(cursor.projection,s,revision,at),source.packages,cfg);store.workflows[s.project.id]={revision,projection:next};}else if(!cursor)store.workflows[s.project.id]={revision:0,projection:next};}
  for(const d of readDocuments()){const key=documentIdentityKey(d.identity!),last=store.documents[key],latest=d.versions.at(-1)?.version??0;if(last!==undefined){const s=source.packages[d.identity.packageId];if(s)for(const v of d.versions.filter(v=>v.version>last))addEvents(store,documentEvents(d.identity,v,s),source.packages,cfg);}store.documents[key]=latest;}
  for(const o of obligationsFor(source.packages,cfg)){const s=source.packages[o.packageId];addEvents(store,reminderEvents(o,s,cfg,jakartaDay(new Date(at)),at),source.packages,cfg);}
  saveIfChanged(store);lastError='';
 }catch(error){fail(error);}
}
export function startNotificationScheduler(){reconcileNotifications();if(typeof window==='undefined')return ()=>{};const tick=()=>{reconcileNotifications();window.dispatchEvent(new Event(NOTIFICATION_CHANGED));};const id=window.setInterval(tick,60000);window.addEventListener('focus',tick);return ()=>{window.clearInterval(id);window.removeEventListener('focus',tick);};}
function latestDoc(id:BaIdentity){return readDocuments().find(d=>documentIdentityKey(d.identity!)===documentIdentityKey(id!))?.versions.at(-1);}
export function accessibleAgenda(packages:Record<string,OperationalWorkflowState>,cfg:NotificationConfig,p:Principal){const m=viewerMember(cfg,p);if(!m||p.role==='Admin')return [];
 return obligationsFor(packages,cfg).filter(o=>p.packageIds.includes(o.packageId)).filter(o=>{const s=packages[o.packageId];return (assigned(m,s,o.role,o.duty)&&(o.kind!=='correction'||cfg.caseOwners?.[`${o.packageId}:${o.subject.id}`]===m.id))||(o.kind!=='appointment'&&m.role==='PIC Balai / Pengguna Jasa'&&assigned(m,s,m.role,'supervise'));});
}
export function notificationView(packages:Record<string,OperationalWorkflowState>,p:Principal,at=new Date()){const cfg=readConfig().config,store=readNotificationStore(),obligations=obligationsFor(packages,cfg);
 return store.records.filter(n=>canAccessNotification(n,packages[n.packageId],cfg,p)).map(n=>{const s=packages[n.packageId],o=n.obligationId?obligations.find(o=>o.id===n.obligationId&&o.dueDate===n.sourceVersion):undefined;const remaining=o?days(jakartaDay(at),o.dueDate):0;const currentReminder=n.type.startsWith('H-')?remaining===Number(n.type.slice(2))&&(!o?.reminderOffsets||o.reminderOffsets.includes(remaining)):n.type==='due'?remaining===0:n.type==='overdue'||n.type==='supervision.overdue'?remaining<0:n.type==='escalation'?cfg.escalations.some(r=>r.id===n.escalationRuleId&&r.enabled&&remaining<0&&-remaining>=r.afterDays):false;const relevant=n.obligationId?!!o&&!o.completed&&!o.cancelled&&currentReminder:(n.subject.kind==='document'||store.subjectVersions?.[subjectKey(n)]===n.sourceVersion)&&stateMatches(n,s,n.subject.identity?latestDoc(n.subject.identity):undefined);const valid=targetAvailable(n.target,s);return {...n,relevance:!valid?'unavailable':relevant?'active':'resolved'} as Notification;}).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));
}
export function targetAvailable(target:Notification['target'],s:OperationalWorkflowState){if(!s||target.packageId!==s.project.id)return false;if(target.module==='correction')return s.corrections.some(c=>c.id===target.caseId);if(target.module==='document'){return documentIdentityAvailable(target.identity,s);}return Object.values(SELECTION).includes(target.selection)&&(!target.auditLevel||[1,2,3].includes(target.auditLevel))&&(!target.period||Number.isSafeInteger(target.period)&&target.period>0&&(target.period===(s.activeCyclePeriod??1)||!!s.cycleHistory?.[String(target.period)]||sourceObligations(s).some(o=>o.kind==='cycle14'&&o.subject.period===target.period)));}
export function resolveNotification(id:string,packages:Record<string,OperationalWorkflowState>,p:Principal){const n=notificationView(packages,p).find(n=>n.id===id);if(!n||n.relevance==='unavailable')throw new Error('Pekerjaan tidak tersedia atau penugasan berubah. Muat ulang daftar; tidak ada hak akses yang ditambahkan.');return n;}
