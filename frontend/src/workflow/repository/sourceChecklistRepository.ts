import {sourceScalarResult} from '../sourceScalarEvaluation';
import {lendutanOngoingResults} from '../sourceTechnicalEvaluation';
import {lendutanPeriodStatus} from './lendutanPeriod';
import {readLocal} from './localPersistence';
import {sourceDocument,documentQuestions,sourceDocumentKey} from '../sourceDocumentModel';
import {validateSourceDocument,sourcePolicy} from '../sourceFormValidation';
import type {ChecklistProjectInfo} from '../checklistProjectValues';
export function sourceInspectionStatus(packageScope:string,survey:string,phase:string,pciManual=true,projectInfo?:ChecklistProjectInfo){
 if(survey==='Lendutan'&&['internal','periodic14'].includes(phase))return lendutanPeriodStatus(packageScope,phase);
 const document=sourceDocument(survey,phase,pciManual,Number(packageScope.match(/::audit-(\d+)/)?.[1]??1));
 if(!document)return {complete:false,concerns:[],reason:`Form sumber ${survey} belum tersedia.`,sourceHash:''};
 const answers=readLocal<Record<string,string>>(sourceDocumentKey(packageScope,document.id),document.derivedFrom?readLocal(sourceDocumentKey(packageScope,document.derivedFrom),{}):{}),questions=documentQuestions(document);
 const validation=validateSourceDocument(document,answers,projectInfo),active=new Set(validation.rules.map(rule=>rule.id));
 const polarity=sourcePolicy(document)?.concernValues??{};
 const concerns=questions.filter(question=>active.has(question.id)&&(polarity[question.id]?polarity[question.id].includes(answers[question.id]??''):/^(tidak(?! ada data| relevan| diperlukan)|belum|rusak|terlambat|perlu perbaikan|ditolak)\b/i.test(answers[question.id]??''))).map(question=>`${question.number} ${question.label}`);
 for(const row of new Set(validation.rules.filter(r=>r.table!==undefined).map(r=>`${r.table}:${r.row}`))){const [t,r]=row.split(':').map(Number);const scalar=sourceScalarResult(document,t,r,answers);if(scalar&&/^Tidak/.test(scalar.label))concerns.push(`${scalar.label}: ${scalar.reason}`);}
 const technical=lendutanOngoingResults(document,answers);
 concerns.push(...technical.filter(item=>!item.pass).map(item=>`${item.label}: ${item.reason}`));
 const complete=validation.complete&&technical.every(item=>item.known);
 concerns.push(...validation.issues.filter(issue=>issue.kind==='invalid').map(issue=>`${issue.label}: ${issue.reason}`));
 const missing=validation?.issues.filter(issue=>issue.kind==='missing').length??0;
 return {complete,concerns,reason:complete?'':missing?`Checklist sumber ${survey} masih memiliki ${missing} isian wajib kosong.`:`Checklist sumber ${survey} belum terjawab seluruhnya.`,sourceHash:document.sha256,validation};
}
