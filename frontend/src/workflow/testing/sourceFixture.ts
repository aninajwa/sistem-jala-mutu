import {sourceFieldRules} from '../sourceFormValidation';
import type {SourceDocument} from '../sourceDocumentModel';
/** Synthetic representation fixture, not evidence of engineering acceptance. */
export function filledSourceFixture(document:SourceDocument):Record<string,string>{
 const answers:Record<string,string>={};
 for(const r of sourceFieldRules(document))answers[r.id]=r.kind==='choice'?(r.question!.multiple?JSON.stringify(r.question!.options):r.question!.options[0]):r.kind==='date'?'2026-10-01':r.kind==='number'?'1':'Data uji terisi';
 return answers;
}
