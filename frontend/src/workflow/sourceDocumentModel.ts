import catalog from './sourceChecklistCatalog.json';
export type SourceBlock={kind:string;id?:string;text?:string;table?:number;chapter?:string;heading?:string};
export type SourceDocument={id:string;survey:string;phase:string;derivedFrom?:string;auditLevel?:number;source:string;asset:string;sha256:string;tables:{table:number;heading?:string;chapter?:string;rows:string[][]}[];blocks?:SourceBlock[]};
export type SourceQuestion={id:string;number:string;label:string;options:string[];multiple?:boolean;table:number;row:number;paragraph?:string};
const choice=/^(ya|tidak|n\/?a|sesuai|tidak sesuai|sesuai standar|tidak sesuai standar|memenuhi|tidak memenuhi|diterapkan|tidak diterapkan|ada|tidak ada|lengkap|tidak lengkap|baik|tidak baik|terverifikasi|tidak terverifikasi|valid|tidak valid)$/i;
export const sourceKeyValueTable=(rows:string[][])=>rows.length>1&&rows.every(row=>row.length===2)&&rows.some(row=>/^\s*:/.test(row[1]??''));
const clean=(value:string)=>value.replace(/[□☐☑✓]/g,'').trim();
/** Exact source options and row order. Informational/numeric tables are not silently turned into Yes/No. */
export function documentQuestions(document:SourceDocument):SourceQuestion[]{
 const questions:SourceQuestion[]=[];
 for(const table of document.tables){
  const header=sourceKeyValueTable(table.rows)?[]:table.rows[0]??[];
  const columns=header.flatMap((label,index)=>choice.test(clean(label))?[{label:clean(label),index}]:[]);
  const offset=sourceKeyValueTable(table.rows)?0:1;
  table.rows.slice(offset).forEach((cells,index)=>{
   const number=/^(?:[A-Z]\.)?\d+(\.\d+)*[.)]?$/.test((cells[0]??'').trim())?cells[0].trim():'';
   const fixed=cells.filter((cell,i)=>!columns.some(column=>column.index===i)&&!/[□☐]/.test(cell)&&cell.trim()&&!/^\[.*\]$/.test(cell.trim()));
   const label=[...new Set(fixed.filter(cell=>cell!==number))].join(' · ');
   if(columns.length>=2&&label&&columns.some(column=>/^[□☐\s]*$/.test(cells[column.index]??''))){
    questions.push({id:`t${table.table}:r${index+offset+1}`,number,label,options:columns.map(column=>column.label),table:table.table,row:index+offset+1});
   }
   cells.forEach((cell,column)=>{
    if(!/[□☐]/.test(cell))return;
    const options=cell.split(/[□☐]/).slice(1).map(option=>option.trim()).filter(Boolean);
    if(options.length<2)return;
    questions.push({id:`t${table.table}:r${index+offset+1}:c${column+1}`,number,label:[label,header[column]].filter(Boolean).join(' · '),options,multiple:options.includes('Data Mentah')&&options.includes('Data Terproses'),table:table.table,row:index+offset+1});
   });
  });
 }
 for(const block of document.blocks??[]){if(block.kind!=='paragraph'||!block.text||!/[□☐]/.test(block.text))continue;
  const options=block.text.split(/[□☐]/).slice(1).map(value=>value.trim()).filter(Boolean);
  if(options.length>1)questions.push({id:`paragraph:${block.id}`,number:'',label:block.heading??'Hasil pemeriksaan',options,table:-1,row:0,paragraph:block.id});
 }
 return questions;
}
export function sourceDocument(survey:string,phase:string,pciManual=true,auditLevel=1):SourceDocument|undefined{
 const variant=survey==='PCI'?(pciManual?'PCI Manual':'PCI AI'):survey;
 const candidates=(catalog as SourceDocument[]).filter(document=>document.survey===variant&&document.phase===phase);
 return candidates.find(document=>document.auditLevel===auditLevel)??candidates.find(document=>document.auditLevel===undefined);
}
export function sourceQuestionSelection(question:SourceQuestion,value:string):string[]{
 if(!question.multiple)return question.options.includes(value)?[value]:[];
 try{const selected=JSON.parse(value);return Array.isArray(selected)&&selected.every(option=>question.options.includes(option))?[...new Set<string>(selected)]:[];}catch{return [];}
}
export const sourceQuestionAnswered=(question:SourceQuestion,value:string)=>{const selected=sourceQuestionSelection(question,value);return question.multiple?selected.includes('Data Mentah')&&selected.includes('Data Terproses'):selected.length>0;};
export function documentAnswersComplete(document:SourceDocument,answers:Record<string,string>){const questions=documentQuestions(document);return questions.length>0&&questions.every(question=>sourceQuestionAnswered(question,answers[question.id]??''));}

export const sourceDocumentKey=(packageId:string,documentId:string)=>`jala-source-exact-v1:${packageId}:${documentId}`;
