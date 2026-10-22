import {baFieldErrors} from './fieldValidation';
import type {SurveyType} from '../model';
import {documentSourceSnapshot} from './documentSourceSnapshot';
import type {OperationalWorkflowState} from '../model';
import {documentRepository,type BaIdentity} from './documentRepository';
import {documentActors,documentActionErrors,documentFingerprint,type DocumentAction} from './documentWorkflow';
/** Frontend-only transaction boundary. Every transition checks actor, state, version and gate again. */
export function transitionDocument(state:OperationalWorkflowState,identity:BaIdentity,action:DocumentAction,fields:Record<string,string>,templateHash:string,missing:number,note:string,expectedVersion:number){
 const stored=documentRepository.read(identity),latest=stored.versions.at(-1);
 if((latest?.version??0)!==expectedVersion)throw new Error('Dokumen berubah di tab lain. Muat ulang sebelum melanjutkan.');
 const schemaErrors=action==='submit'?baFieldErrors(identity.kind,identity.survey as SurveyType,fields):action==='approve'?baFieldErrors(identity.kind,identity.survey as SurveyType,latest?.fields??{}):[];
 const errors=documentActionErrors(state,identity,action,latest,Math.max(missing,schemaErrors.length),note);if(errors.length)throw new Error(errors.join(' '));
 const status=({submit:'submitted-local',revise:'revision-requested-local',reject:'rejected-local',approve:'reviewed-local',reopen:'local-draft'} as const)[action];
 return documentRepository.addVersion(identity,{actor:state.role,templateHash,status,fields:action==='submit'||action==='reopen'?fields:latest!.fields,sourceFingerprint:documentFingerprint(state,identity),sourceSnapshot:action==='submit'||action==='reopen'?documentSourceSnapshot(state,identity):latest?.sourceSnapshot,reviewNote:note.trim(),basedOnVersion:latest?.version});
}
export function saveDocumentDraft(state:OperationalWorkflowState,identity:BaIdentity,fields:Record<string,string>){
 if(!documentActors(identity).authors.includes(state.role))throw new Error('Peran Anda hanya dapat membaca draft ini.');
 const latest=documentRepository.read(identity).versions.at(-1);
 if(latest?.status==='submitted-local'||latest?.status==='reviewed-local')throw new Error('Revisi ini terkunci. Buka revisi baru setelah pemeriksaan.');
 documentRepository.saveDraft(identity,fields);
}
