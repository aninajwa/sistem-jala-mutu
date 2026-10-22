import {lendutanOngoingResults} from '../sourceTechnicalEvaluation';
import {lendutanPeriodStatus} from './lendutanPeriod';
import {readLocal} from './localPersistence';
import {sourceDocument,documentQuestions,documentAnswersComplete,sourceDocumentKey} from '../sourceDocumentModel';
import {validateSourceDocument} from '../sourceFormValidation';
import type {ChecklistProjectInfo} from '../checklistProjectValues';
export function sourceInspectionStatus(packageScope:string,survey:string,phase:string,pciManual=true,projectInfo?:ChecklistProjectInfo){
 if(survey==='Lendutan'&&['internal','periodic14'].includes(phase))return lendutanPeriodStatus(packageScope,phase);
 const document=sourceDocument(survey,phase,pciManual,Number(packageScope.match(/::audit-(\d+)/)?.[1]??1));
 if(!document)return {complete:false,concerns:[],reason:`Form sumber ${survey} belum tersedia.`,sourceHash:''};
 const answers=readLocal<Record<string,string>>(sourceDocumentKey(packageScope,document.id),document.derivedFrom?readLocal(sourceDocumentKey(packageScope,document.derivedFrom),{}):{}),questions=documentQuestions(document);
 const concerns=questions.filter(question=>/^(tidak|belum|rusak|terlambat)\b/i.test(answers[question.id]??'')).map(question=>`${question.number} ${question.label}`);
 const technical=lendutanOngoingResults(document,answers);
 concerns.push(...technical.filter(item=>!item.pass).map(item=>`${item.label}: ${item.reason}`));
 const validation=projectInfo?validateSourceDocument(document,answers,projectInfo):undefined;
 const complete=(validation?.complete??documentAnswersComplete(document,answers))&&technical.every(item=>item.known);
 if(validation)concerns.push(...validation.issues.filter(issue=>issue.kind==='invalid').map(issue=>`${issue.label}: ${issue.reason}`));
 const missing=validation?.issues.filter(issue=>issue.kind==='missing').length??0;
 return {complete,concerns,reason:complete?'':missing?`Checklist sumber ${survey} masih memiliki ${missing} isian wajib kosong.`:`Checklist sumber ${survey} belum terjawab seluruhnya.`,sourceHash:document.sha256,validation};
}
