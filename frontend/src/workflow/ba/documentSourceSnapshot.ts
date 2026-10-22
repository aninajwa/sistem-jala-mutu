import {readLendutanPeriod} from '../repository/lendutanPeriod';
import {attachmentRepository} from '../repository/attachmentRepository';
import {STAGE3B_DOCX_CANDIDATES} from '../stage3bChecklistData.docx-candidate';
import type {OperationalWorkflowState} from '../model';
import type {BaIdentity} from './documentRepository';
import {sourceDocument,sourceDocumentKey} from '../sourceDocumentModel';
import {readLocal} from '../repository/localPersistence';
export function documentSourceSnapshot(state:OperationalWorkflowState,identity:BaIdentity){
 const phase=identity.kind==='audit'?'audit':identity.kind==='bertahap'?'staged':identity.kind==='kalibrasi'?'calibration':identity.kind==='duaMingguan'?'periodic14':identity.kind==='internal'?'internal':identity.kind==='konsistensi'?'consistency':undefined;
 const document=phase?sourceDocument(identity.survey,phase,state.productionTests.PCI.pciManual!==false,identity.auditLevel):undefined;
 const scope=identity.kind==='audit'?`${identity.packageId}::audit-${identity.auditLevel}`:identity.packageId;
 const periodScope=identity.period===1?identity.packageId:`${identity.packageId}::period-${identity.period}`;
 const phase3b=identity.kind==='duaMingguan'?'periodic14':identity.kind==='internal'?'internal':'consistency';
 const template=STAGE3B_DOCX_CANDIDATES.find(item=>item.survey===(identity.survey==='PCI'?'PCI Manual':identity.survey)&&item.phase===phase3b);
 const periodAnswers=identity.period>0?readLocal<Record<string,string>>(`jala-mutu-stage3b-docx-${periodScope}-v1`,{}):{};
 const documentScope=['periodic14','internal','consistency'].includes(phase??'')?periodScope:scope;
 const answers=document?readLocal(sourceDocumentKey(documentScope,document.id),document.derivedFrom?readLocal(sourceDocumentKey(documentScope,document.derivedFrom),{}):{}):Object.fromEntries(Object.entries(periodAnswers).filter(([key])=>template&&key.includes(`::${template.id}::`)));
 const stagePrefix=identity.kind==='kalibrasi'?'stage1-':identity.kind==='bertahap'?'stage4-':identity.kind==='audit'?'stage5-':identity.kind==='penerimaan'?'stage6-':'stage3b-';
 const attachmentLinks={form:document?readLocal(`${documentScope}:form-${document.id}:documents:links`,{}):{},lendutan:identity.survey==='Lendutan'?readLocal(`${periodScope}:lendutan-${phase}:documents:links`,{}):{},ba:readLocal(`${identity.packageId}:ba-${identity.kind}-p${identity.period}-${identity.survey}-audit${identity.auditLevel}:documents:links`,{})};
 const referencedAttachments=Object.fromEntries(Object.values(attachmentLinks).flatMap(value=>Object.values(value as Record<string,{fileKey?:string;detached?:boolean}>)).filter(link=>!!link.fileKey&&!link.detached).map(link=>[link.fileKey!,attachmentRepository.metadata()[link.fileKey!]??null]));
 const isDetached=(key:string)=>Object.values(attachmentLinks).some(value=>(value as Record<string,{detached?:boolean}>)[key]?.detached);
 const attachments=Object.fromEntries(Object.entries(attachmentRepository.metadata()).filter(([key])=>!isDetached(key)&&(key.startsWith(`${documentScope}:form-${document?.id}:documents:`)||key.startsWith(`${identity.packageId}:ba-${identity.kind}-p${identity.period}-${identity.survey}-audit${identity.auditLevel}:documents:`)||(identity.period>0?key.startsWith(`${periodScope}:${template?.id}:`)||key.startsWith(`${identity.packageId}:${stagePrefix}`)&&key.endsWith(`-${identity.period}`):key.startsWith(`${identity.packageId}:${stagePrefix}`)))).map(([key,value])=>[key,{name:value.name,size:value.size,mimeType:value.mimeType,digest:value.digest}]));

 const lendutanPeriod=identity.survey==='Lendutan'&&['internal','periodic14'].includes(phase??'')?readLendutanPeriod(periodScope,phase!):undefined;
 return {lendutanPeriod,referencedAttachments,attachmentLinks,sourceTemplateHash:document?.sha256,answers,legacyAnswers:Object.fromEntries(Object.entries(periodAnswers).filter(([key])=>template&&key.includes(`::${template.id}::`))),attachments};
}
