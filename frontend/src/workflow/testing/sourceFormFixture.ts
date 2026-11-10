import {documentQuestions,type SourceDocument} from '../sourceDocumentModel';
import {sourceFieldRules,sourceRuleActive,sourceRuleValue,validateSourceDocument,type SourceFieldRule} from '../sourceFormValidation';
import type {ChecklistProjectInfo} from '../checklistProjectValues';
/** Synthetic source values for isolated tests, never imported by the application. */
export function fixtureValue(rule:SourceFieldRule):string {
 if(rule.kind==='choice')return rule.question!.multiple?JSON.stringify([rule.question!.options[0]]):rule.question!.options[0];
 if(rule.kind==='date')return '2027-05-01';
 if(rule.kind==='number')return String(rule.min??1);
 return 'Referensi uji terisolasi';
}
export function sourceFormFixture(doc:SourceDocument,project?:ChecklistProjectInfo){
 const rules=sourceFieldRules(doc),answers:Record<string,string>={};
 for(const q of documentQuestions(doc))answers[q.id]=q.multiple?JSON.stringify([q.options[0]]):q.options[0];
 // Activate the first observation only; unused spare rows stay empty.
 const firstRows=new Map<number,number>();
 for(const r of rules)if(r.rowKeys&&r.table!==undefined&&r.row!==undefined&&!firstRows.has(r.table))firstRows.set(r.table,r.row);
 for(const r of rules)if(r.rowKeys&&firstRows.get(r.table!)===r.row)answers[r.id]=fixtureValue(r);
 for(let pass=0;pass<3;pass++)for(const r of rules)if(r.required&&sourceRuleActive(r,answers,rules,project)&&!sourceRuleValue(r,answers,project,doc))answers[r.id]=fixtureValue(r);
 const result=validateSourceDocument(doc,answers,project);
 if(!result.complete)throw new Error(`Invalid ${doc.id} fixture: ${JSON.stringify(result.issues)}`);
 return answers;
}
