import {sourceScalarResult} from './sourceScalarEvaluation';
import {bridgeSamplingResult} from './sourceTechnicalEvaluation';
import {sourceParagraphSlots} from './sourceParagraphFields';
import semantics from './sourceFormSemantics.json';
import {projectChecklistValue,type ChecklistProjectInfo} from './checklistProjectValues';
import {documentQuestions,sourceKeyValueTable,sourceChoiceHeader,sourceQuestionAnswered,type SourceDocument,type SourceQuestion} from './sourceDocumentModel';
import {sourceCellEditable,sourceCellKey} from './sourceInputs';

export type SourceFieldKind='choice'|'text'|'number'|'date';
export type SourceCondition={label:string;key?:string;answer?:string;values?:string[]};
type TablePolicy={mode:string;heading:string};
type Policy={sha256:string;tables:Record<string,TablePolicy>;conditions:Record<string,SourceCondition>;fieldConditions?:Record<string,SourceCondition>;concernValues?:Record<string,string[]>};
export type SourceFieldRule={id:string;label:string;kind:SourceFieldKind;required:boolean;conditional:boolean;table?:number;row?:number;column?:number;question?:SourceQuestion;projectLabel?:string;min?:number;max?:number;integer?:boolean;conditions?:SourceCondition[];rowKeys?:string[];detailFor?:string;source?:string;computed?:boolean};
export type SourceFieldIssue={id:string;label:string;reason:string;kind:'missing'|'invalid'};
export type SourceDocumentValidation={complete:boolean;required:number;completed:number;issues:SourceFieldIssue[];rules:SourceFieldRule[]};
const clean=(value:string)=>value.replace(/[□☐☑✓]/g,'').trim();
const noteHeader=/^(catatan|keterangan|remarks?|komentar)$/i;
const signature=/tanda tangan|ttd|paraf/i;
const schema=semantics as Record<string,Policy>;
export const sourcePolicy=(document:SourceDocument)=>schema[document.id];
export function sourceConditions(document:SourceDocument):SourceCondition[]{return Object.values(sourcePolicy(document)?.conditions??{}).filter(c=>!!c.key);}

/** A type is a representation constraint, never an inferred acceptance threshold.
 * In particular CV, differences, scores and years receive no universal 0..100 bound. */
function classify(label:string,header:string,placeholder=''):Pick<SourceFieldRule,'kind'|'min'|'max'|'integer'>{
 const text=/^(hasil|hasil sampel|hasil pengukuran|lokasi\/hasil|keterangan)$/i.test(header)?label:header||label;
 if(/(?:lat|lintang):.*(?:long|bujur):/i.test(placeholder))return {kind:'text'};
 if(/dd\s*\/\s*mm\s*\/\s*yyyy/i.test(placeholder)||/^(tanggal(?:\b|:)|berlaku hingga$|awal survei$|akhir survei$)/i.test(text)&&!/s\/d|s\.d\.|periode/i.test(text))return {kind:'date'};
 if(/\bNilai\s*\(1-5\)/i.test(text))return {kind:'number',min:1,max:5,integer:true};
 if(/koordinat|lintang|bujur|\blat\b|\blong\b|sta\b|nomor|kode|nama|periode|waktu|lokasi|jenis|metode|personel|operator|penanggung|petugas|pihak/i.test(text))return {kind:'text'};
 if(/^(jumlah|pengulangan|jml\b|tahun(?: pembuatan| pembangunan)?$|perkiraan tahun pembangunan$)|^(true positive|false positive|true negative|false negative)/i.test(text))return {kind:'number',integer:true};
 if(/nilai|persentase|%|panjang|lebar|tinggi|kedalaman|jarak|precision|recall|f1[ -]score|\bcv\b|deviasi|selisih|rata-rata|pengukuran [123]|skor|simpangan|kemiringan|\bnk\b|koefisien|indeks kappa|\(km\)|\(m\)|\(mm\)|\(tahun\)|\(unit\)/i.test(text))return {kind:'number'};
 return {kind:'text'};
}
function conditionsFor(policy:Policy|undefined,table:number,row:number,values=false):SourceCondition[]{
 const c=policy?.conditions??{};return [c[`t${table}`],c[`t${table}:r${row}`],values?c[`t${table}:r${row}:values`]:undefined].filter((v):v is SourceCondition=>!!v);
}
export function sourceFieldRules(document:SourceDocument):SourceFieldRule[]{
 const policy=sourcePolicy(document),questions=documentQuestions(document),rules:SourceFieldRule[]=[];
 for(const question of questions){
  const mode=policy?.tables[String(question.table)]?.mode;
  if(mode==='approval'||mode==='reference')continue;
  const conditions=[...conditionsFor(policy,question.table,question.row),...(policy?.fieldConditions?.[question.id]?[policy.fieldConditions[question.id]]:[])];
  rules.push({id:question.id,label:[question.number,question.label].filter(Boolean).join(' '),kind:'choice',required:true,conditional:conditions.length>0||mode==='optional'||mode==='repeat',conditions,table:question.table,row:question.row,question,source:`T${question.table}/R${question.row}`});
  if(question.options.some(o=>/^Lainnya\s*:/i.test(o)))rules.push({id:`detail:${question.id}`,label:`Uraian lainnya: ${question.label}`,kind:'text',required:true,conditional:true,conditions,table:question.table,row:question.row,detailFor:question.id,source:`T${question.table}/R${question.row}`});
 }
 for(const table of document.tables){
  const mode=policy?.tables[String(table.table)]?.mode;
  if(mode==='approval'||mode==='reference')continue;
  const keyValue=sourceKeyValueTable(table.rows)||mode==='identity';
  const start=sourceKeyValueTable(table.rows)?0:1,headers=table.rows[0]??[];
  // Explicit vertical alternatives are represented by one source choice above.
  if(questions.some(q=>q.table===table.table&&q.id.endsWith(':selection')))continue;
  table.rows.slice(start).forEach((row,offset)=>{
   const rowNumber=start+offset+1;
   // Merged subheadings, section labels and dotted extension rows are not observations.
   if(!keyValue&&(/^(?:\.{3}|…)$/.test(row[0]?.trim()??'')||/^no\.?$/i.test(headers[0])&&((row.slice(1).every(cell=>!cell.trim())&&row[0]&&!/^\d+[.)]?$/.test(row[0].trim()))||/:$/.test(row[1]?.trim()??'')&&row.slice(2).every(cell=>!cell.trim()))))return;
   row.forEach((cell,j)=>{
    if(!sourceCellEditable(cell)||/[□☐]/.test(cell))return;
    const header=clean(headers[j]??''),label=keyValue?clean(row[0]??''):[clean(row[1]&&/^no\.?$/i.test(headers[0])?row[1]:row[0]??''),header].filter(Boolean).join(' · ');
    if(!label||keyValue&&j!==1||!keyValue&&(/^no\.?$/i.test(header)||sourceChoiceHeader.test(header))||signature.test(label))return;
    const computed=!keyValue&&/status/i.test(header)&&!!(bridgeSamplingResult(document,table.table,rowNumber,{})??sourceScalarResult(document,table.table,rowNumber,{}));
    const context=keyValue?label:header;
    // Plain notes have no blanket obligation. An explicit placeholder (e.g. Nilai: ___)
    // remains an input, even in a Keterangan column.
    const note=noteHeader.test(context)&&!cell.trim();
    const id=sourceCellKey(table.table,rowNumber,j+1);
    const conditions=[...conditionsFor(policy,table.table,rowNumber,true),...(policy?.fieldConditions?.[id]?[policy.fieldConditions[id]]:[])];
    rules.push({id,label,required:!note,computed,conditional:conditions.length>0||mode==='optional'||mode==='repeat',table:table.table,row:rowNumber,column:j+1,conditions,...classify(label,!keyValue&&/^Nilai\s*:/i.test(cell)?'Nilai':keyValue?label:header,cell),projectLabel:keyValue?row[0]:undefined,source:`T${table.table}/R${rowNumber}/C${j+1}`});
   });
  });
 }
 for(const block of document.blocks??[]){
  if(block.kind!=='paragraph'||!block.id||!block.text||/[□☐]/.test(block.text))continue;
  const text=block.text,heading=block.heading??'';
  if(signature.test(text)||/persetujuan|pengesahan|tanda tangan|lampiran/i.test(heading))continue;
  const optional=!/kesimpulan/i.test(text+' '+heading)&&/catatan|rekomendasi|temuan|tindak lanjut|komentar|lampirkan|tanggapan/i.test(text+' '+heading);
  for(const slot of sourceParagraphSlots(block)){
   const identity=/no\.? dokumen|nomor|tanggal|lokasi|tim|nama|periode|pelaksana|validator|panjang/i.test(slot.label);
   const required=!optional&&(identity||/kesimpulan/i.test(heading));
   rules.push({id:slot.id,label:slot.label,required,conditional:optional,...classify(slot.label,slot.label,slot.placeholder),source:block.id});
  }
 }
 // A repeating/optional row is an atomic observation. Blank spare rows do not block;
 // once any of its input/choice cells is used, all its contracted fields are validated.
 for(const rule of rules){
  const mode=rule.table===undefined?undefined:policy?.tables[String(rule.table)]?.mode;
  if(mode==='repeat'||mode==='optional')rule.rowKeys=rules.filter(r=>r.table===rule.table&&r.row===rule.row).map(r=>r.id);
 }
 return [...new Map(rules.map(rule=>[rule.id,rule])).values()];
}
export function sourceRuleValue(rule:SourceFieldRule,answers:Record<string,string>,project?:ChecklistProjectInfo,document?:SourceDocument){
 if(rule.computed&&document&&rule.table!==undefined&&rule.row!==undefined){const result=bridgeSamplingResult(document,rule.table,rule.row,answers)??sourceScalarResult(document,rule.table,rule.row,answers);return result&&result.label!=='Belum dapat dinilai'?result.label:'';}
 const known=rule.projectLabel?projectChecklistValue(rule.projectLabel,project):undefined;
 return (known?.trim()?known:answers[rule.id]??'').trim();
}
const notApplicable=/^(N\/?A|Tidak Relevan|Tidak Diperlukan|Tidak Ada Data (?:Historis|Sebelumnya))$/i;
export function sourceRuleActive(rule:SourceFieldRule,answers:Record<string,string>,allRules:SourceFieldRule[]=[],project?:ChecklistProjectInfo):boolean{
 if(rule.rowKeys&&!rule.rowKeys.some(key=>!!answers[key]?.trim()))return false;
 if(rule.detailFor&&!/^Lainnya\s*:/i.test(answers[rule.detailFor]??''))return false;
 return (rule.conditions??[]).every(c=>{
  if(c.answer)return !!c.values?.includes(answers[c.answer]??'');
  if(c.key&&answers[c.key]==='no')return false;
  if(c.key&&answers[c.key]==='yes')return true;
  // Stored, applicable answers activate the corresponding source condition too.
  return allRules.some(r=>r.conditions?.some(x=>x.key===c.key)&&!r.detailFor&&!!sourceRuleValue(r,answers,project)&&!notApplicable.test(sourceRuleValue(r,answers,project)));
 });
}
function validateRule(rule:SourceFieldRule,value:string):string|undefined{
 if(rule.kind==='choice')return rule.question&&sourceQuestionAnswered(rule.question,value)?undefined:'pilihan wajib belum dijawab';
 if(!value||/^(?:[_ .]+|\[[^\]]*\]|BELUM DIISI)$/i.test(value))return 'isian wajib belum diisi';
 if(rule.kind==='date'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'tanggal belum valid';
  const [year,month,day]=value.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day));
  if(year<100||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return 'tanggal belum valid';
 }
 if(rule.kind==='number'){
  if(!/^-?\d+(?:[.,]\d+)?$/.test(value))return 'nilai harus berupa angka';
  const n=Number(value.replace(',','.'));if(!Number.isFinite(n))return 'nilai harus berupa angka';
  if(rule.min!==undefined&&n<rule.min)return `nilai minimum ${rule.min}`;
  if(rule.max!==undefined&&n>rule.max)return `nilai maksimum ${rule.max}`;
  if(rule.integer&&!Number.isInteger(n))return 'nilai harus bilangan bulat';
 }
 return undefined;
}
export function validateSourceDocument(document:SourceDocument,answers:Record<string,string>,project?:ChecklistProjectInfo):SourceDocumentValidation{
 const all=sourceFieldRules(document),rules=all.filter(r=>r.required&&sourceRuleActive(r,answers,all,project)),issues:SourceFieldIssue[]=[];let completed=0;
 // Known catalog identities must match their reviewed source revision.
 const policy=sourcePolicy(document);
 if(policy&&policy.sha256!==document.sha256)issues.push({id:'source-revision',label:'Revisi sumber',reason:'SHA256 formulir berbeda dari skema yang diaudit',kind:'invalid'});
 for(const rule of rules){const value=sourceRuleValue(rule,answers,project,document),reason=rule.kind==='choice'&&notApplicable.test(value)&&rule.conditions?.some(c=>c.answer&&c.values?.includes(answers[c.answer]??''))?'pilihan tidak relevan bertentangan dengan pemicu yang aktif':validateRule(rule,value);if(reason)issues.push({id:rule.id,label:rule.label,reason,kind:value?'invalid':'missing'});else completed++;}
 for(const [n,t] of Object.entries(policy?.tables??{}))if(t.mode==='repeat'){
  const tableRules=all.filter(r=>r.table===Number(n)&&r.required);
  if(tableRules.length&&!tableRules.some(r=>sourceRuleActive(r,answers,all,project)))issues.push({id:`table:${n}`,label:t.heading,reason:'isi sekurangnya satu baris hasil; baris cadangan boleh kosong',kind:'missing'});
 }
 return {complete:rules.length>0&&issues.length===0,required:rules.length,completed,issues,rules};
}
