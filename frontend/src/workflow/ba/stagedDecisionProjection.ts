import type {OperationalWorkflowState,SurveyType} from '../model';
import {sourceDocument,sourceDocumentKey} from '../sourceDocumentModel';
import {readLocal} from '../repository/localPersistence';
import {stagedConclusion,type StagedConclusionStatus} from '../stagedConclusion';
import {documentRepository,type BaIdentity} from './documentRepository';
import {documentFingerprint} from './documentWorkflow';
import {BA_TEMPLATES} from './baTemplateModel';
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {baValuePresent} from './fieldValidation';
export type StagedProjection={status:StagedConclusionStatus|'Belum diputuskan'|'Perlu pemeriksaan ulang';detail:string;date:string};
/** A reviewed local BA is evidence of local review only, never an official signature.
 * A raw selection is shown but excluded from compliance until linked review is verified. */
export function stagedDecisionProjection(state:OperationalWorkflowState,survey:SurveyType):StagedProjection|undefined{
 const doc=sourceDocument(survey,'staged',state.productionTests.PCI.pciManual!==false);if(!doc)return;
 const answers=readLocal<Record<string,string>>(sourceDocumentKey(state.project.id,doc.id),{});
 const conclusion=stagedConclusion(doc,answers);
 const identity:BaIdentity={packageId:state.project.id,kind:'bertahap',period:0,survey,auditLevel:1};
 const versions=documentRepository.read(identity).versions,latest=versions.at(-1);
 const pending=(detail:string):StagedProjection=>({status:'Belum diputuskan',detail,date:''});
 const raw=conclusion?`Kesimpulan isian: ${conclusion.raw}. `:'';
 if(!latest||latest.status!=='reviewed-local')return pending(raw+'Belum ada pemeriksaan BA lokal yang berlaku.');
 const previous=versions.find(v=>v.version===latest.basedOnVersion);
 const template=BA_TEMPLATES.find(t=>t.id==='bertahap');
 if(latest.actor!=='PIC Balai / Pengguna Jasa'||previous?.actor!=='Penyedia Jasa / Ketua Tim'||previous.status!=='submitted-local'||previous.templateHash!==latest.templateHash||latest.templateHash!==template?.sha256||previous.sourceFingerprint!==latest.sourceFingerprint||!latest.sourceFingerprint||latest.sourceFingerprint!==documentFingerprint(state,identity))return {status:'Perlu pemeriksaan ulang',detail:raw+'Referensi BA atau bukti tidak lagi sesuai.',date:''};
 const sourceStatus=sourceInspectionStatus(state.project.id,survey,'staged',state.productionTests.PCI.pciManual!==false,state.project);
 if(!sourceStatus.complete)return {status:'Perlu pemeriksaan ulang',detail:raw+'Isian sumber belum lengkap atau tidak valid.',date:''};
 const narrative=latest.fields['word/document.xml:p356:m0']?.trim();
 if(!baValuePresent(narrative)|| (conclusion?.status==='Sesuai'&&sourceStatus.concerns.length) || ((sourceStatus.concerns.length||conclusion?.status!=='Sesuai')&&!latest.reviewNote?.trim()))return {status:'Perlu pemeriksaan ulang',detail:raw+'Kesimpulan atau catatan pemeriksaan belum konsisten dengan sumber.',date:''};
 if(!conclusion)return pending(narrative?`Kesimpulan BA lokal: ${narrative}. Belum ada keputusan kategori yang eksplisit.`:'Belum ada keputusan kategori yang eksplisit.');
 return {status:conclusion.status,detail:`${conclusion.raw} · BA diperiksa lokal (bukan pengesahan resmi)${narrative?` · ${narrative}`:''}`,date:latest.createdAt};
}
