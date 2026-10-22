import {projectChecklistValue,type ChecklistProjectInfo} from './checklistProjectValues';
import {documentQuestions,sourceKeyValueTable,sourceQuestionAnswered,type SourceDocument,type SourceQuestion} from './sourceDocumentModel';

export type SourceFieldKind='choice'|'text'|'number'|'date';
export type SourceFieldRule={id:string;label:string;kind:SourceFieldKind;required:boolean;conditional:boolean;table?:number;row?:number;column?:number;question?:SourceQuestion;projectLabel?:string;min?:number;max?:number;integer?:boolean};
export type SourceFieldIssue={id:string;label:string;reason:string;kind:'missing'|'invalid'};
export type SourceDocumentValidation={complete:boolean;required:number;completed:number;issues:SourceFieldIssue[];rules:SourceFieldRule[]};

const conditionalText=/\b(bila|jika|apabila)\b.*\b(ada|dilakukan|diperlukan|digunakan|berlaku)|\bopsional\b|\blainnya\b/i;
const noteLike=/\b(catatan|keterangan|remarks?|komentar|rekomendasi|alasan|uraian|temuan|tindak lanjut|mitigasi|risiko|dokumentasi|foto|bukti|referensi|lampiran)\b/i;
const officialLike=/\b(tanda tangan|ttd|paraf|nip\.?|pengesahan|ditandatangani)\b/i;
const statusLike=/^(status|hasil sistem|valid\/tidak valid|terverifikasi\/tidak terverifikasi)$/i;
const numericLike=/\b(nilai|jumlah|persentase|panjang|lebar|tinggi|kedalaman|jarak|koefisien|deviasi|cv|skor|precision|recall|f1 score|average precision|mean average precision|titik|panel|bentang|km|meter|mm|cm|%|tahun|pengulangan|durasi)\b/i;
const integerLike=/\b(jumlah|titik|panel|bentang|tahun|pengulangan|ulangan|menit|orang)\b/i;
const dateLike=/\b(tanggal|berlaku hingga|awal survei|akhir survei|periode mulai|periode selesai)\b/i;
const identityLike=/\b(nama\/judul kegiatan|nama (?:proyek|project|paket|pekerjaan|kontrak|penyedia jasa)|nomor kontrak|no\.? kontrak|waktu pelaksanaan|lokasi|ruas jalan|nomor ruas|panjang ruas|tanggal kalibrasi\/validasi|jenis survei|metode|alat|nomor seri|tahun|petugas|personel|operator|periode|penanggung jawab)\b/i;
const resultSection=/\b(hasil|pengukuran|pengujian|pemeriksaan|validasi|verifikasi|kalibrasi|konsistensi|sampling|sampel|audit|penerimaan|evaluasi|kinerja)\b/i;
const resultColumn=/^(jenis|parameter|alat|nomor seri|tahun|metode|lokasi|sta|ruas|jembatan|nilai(?: .*)?|jumlah(?: .*)?|persentase(?: .*)?|panjang(?: .*)?|lebar(?: .*)?|tinggi(?: .*)?|kedalaman(?: .*)?|tanggal(?: .*)?|periode(?: .*)?|pengulangan(?: .*)?|koefisien(?: .*)?|deviasi(?: .*)?|cv|precision|recall|f1 score|average precision|mean average precision)$/i;

const clean=(value:string)=>value.replace(/[□☐☑✓]/g,'').trim();
const cellKey=(table:number,row:number,column:number)=>`value:t${table}:r${row}:c${column}`;
const paragraphMatchKey=(id:string,index:number)=>`paragraph:${id}:m${index}`;
const paragraphTextKey=(id:string)=>`paragraph:${id}:text`;
const conditional=(...values:(string|undefined)[])=>conditionalText.test(values.filter(Boolean).join(' '));
const classify=(label:string):Pick<SourceFieldRule,'kind'|'min'|'max'|'integer'>=>{
 if(dateLike.test(label))return {kind:'date'};
 if(numericLike.test(label))return {kind:'number',min:0,max:/persentase|%|skor/i.test(label)?100:undefined,integer:integerLike.test(label)};
 return {kind:'text'};
};
const sourceCellEditable=(value:string)=>!value.trim()||/^(\[.*\]|\.{3,}|_{3,}|—|-|:|%)$/.test(value.trim());

function questionRules(document:SourceDocument):SourceFieldRule[]{
 return documentQuestions(document).map(question=>({id:question.id,label:[question.number,question.label].filter(Boolean).join(' '),kind:'choice',required:!conditional(question.label),conditional:conditional(question.label),table:question.table,row:question.row,question}));
}

function tableRules(document:SourceDocument):SourceFieldRule[]{
 const rules:SourceFieldRule[]=[];
 const questionIds=new Set(documentQuestions(document).map(question=>`${question.table}:${question.row}`));
 for(const table of document.tables){
  const sourceKeyValue=sourceKeyValueTable(table.rows);
  const headerPair=table.rows.length>1&&table.rows.every(row=>row.length===2)&&/^(uraian|informasi|field)$/i.test(clean(table.rows[0]?.[0]??''))&&/^(keterangan|isi|nilai)$/i.test(clean(table.rows[0]?.[1]??''));
  const keyValue=sourceKeyValue||headerPair,headers=sourceKeyValue?[]:table.rows[0]??[];
  if(!keyValue){
   const choiceHeaders=headers.filter(header=>/^(ya|tidak|n\/?a|sesuai|tidak sesuai|memenuhi|tidak memenuhi|valid|tidak valid|terverifikasi|tidak terverifikasi)$/i.test(clean(header)));
   if(choiceHeaders.length>=2)continue;
  }
  const start=sourceKeyValue?0:1;
  table.rows.slice(start).forEach((row,offset)=>{
   const rowNumber=start+offset+1,rowText=row.join(' '),rowLabel=clean(row[0]??'');
   row.forEach((cell,columnIndex)=>{
    const column=columnIndex+1;if(!sourceCellEditable(cell))return;
    if(!keyValue&&questionIds.has(`${table.table}:${rowNumber}`)&&/[□☐]/.test(cell))return;
    const header=clean(headers[columnIndex]??'');
    const label=keyValue?rowLabel:[rowLabel,header].filter(Boolean).join(' · ');
    if(!label||officialLike.test(label)||(!keyValue&&noteLike.test(header)))return;
    const context=`${table.chapter??''} ${table.heading??''} ${rowText} ${header}`;
    const isConditional=conditional(context);
    const identity=identityLike.test(label)&&/informasi|identitas|data umum|data proyek|data kegiatan|persiapan/i.test(`${table.chapter??''} ${table.heading??''} ${rowText}`);
    const statusInput=/^status pemenuhan$/i.test(header)&&!!clean(row[1]??'');
    if(statusLike.test(header)&&!statusInput)return;
    const result=statusInput||(resultSection.test(`${table.chapter??''} ${table.heading??''}`)&&resultColumn.test(header));
    // A blank source cell is not automatically mandatory. Only identifiers explicitly present in general information
    // and structured result columns are promoted to required fields; notes/evidence/signatures remain separate.
    const required=!isConditional&&(identity||result);
    if(!required)return;
    rules.push({id:cellKey(table.table,rowNumber,column),label,required:true,conditional:false,table:table.table,row:rowNumber,column,...classify(label),projectLabel:keyValue?rowLabel:undefined});
   });
  });
 }
 return rules;
}

function paragraphRules(document:SourceDocument):SourceFieldRule[]{
 const rules:SourceFieldRule[]=[];
 for(const block of document.blocks??[]){
  if(block.kind!=='paragraph'||!block.id||!block.text)continue;
  const text=block.text;if(/[□☐]/.test(text))continue;
  const matches=[...text.matchAll(/\[([^\]]+)\]/g)];
  if(matches.length&&!/^\[.*\]$/.test(text.trim()))matches.forEach((match,index)=>{
   const label=match[1].trim();if(!label||officialLike.test(label)||noteLike.test(label))return;
   const isConditional=conditional(text,label);if(isConditional)return;
   rules.push({id:paragraphMatchKey(block.id!,index),label,required:true,conditional:false,...classify(label)});
  });
  else if(/^\[.*\]$/.test(text.trim())||/_{3,}|\.{3,}/.test(text)){
   const label=(/^\s*[^:]+:/.test(text)?text.split(':')[0]:block.heading)||'Keterangan';
   if(!conditional(text,label)&&!noteLike.test(label)&&!officialLike.test(label)&&identityLike.test(label))rules.push({id:paragraphTextKey(block.id),label,required:true,conditional:false,...classify(label)});
  }
 }
 return rules;
}

export function sourceFieldRules(document:SourceDocument):SourceFieldRule[]{
 const all=[...questionRules(document),...tableRules(document),...paragraphRules(document)];
 return [...new Map(all.map(rule=>[rule.id,rule])).values()];
}

function storedValue(rule:SourceFieldRule,answers:Record<string,string>,project?:ChecklistProjectInfo){
 const projectValue=rule.projectLabel?projectChecklistValue(rule.projectLabel,project):undefined;
 return (projectValue??answers[rule.id]??'').trim();
}

function validateRule(rule:SourceFieldRule,value:string):string|undefined{
 if(rule.kind==='choice')return rule.question&&sourceQuestionAnswered(rule.question,value)?undefined:'pilihan wajib belum dijawab';
 if(!value)return 'isian wajib belum diisi';
 if(rule.kind==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'tanggal belum valid';
 if(rule.kind==='number'){
  const normalized=value.replace(',','.');if(!/^-?\d+(?:\.\d+)?$/.test(normalized))return 'nilai harus berupa angka';
  const number=Number(normalized);if(!Number.isFinite(number))return 'nilai harus berupa angka';
  if(rule.min!==undefined&&number<rule.min)return `nilai minimum ${rule.min}`;
  if(rule.max!==undefined&&number>rule.max)return `nilai maksimum ${rule.max}`;
  if(rule.integer&&!Number.isInteger(number))return 'nilai harus bilangan bulat';
 }
 return undefined;
}

export function validateSourceDocument(document:SourceDocument,answers:Record<string,string>,project?:ChecklistProjectInfo):SourceDocumentValidation{
 const rules=sourceFieldRules(document).filter(rule=>rule.required);
 // Compatibility for non-UI/domain callers that do not have package identity: continue validating choices,
 // while actual stage gates pass project data and therefore validate information-general/result fields too.
 const effective=project?rules:rules.filter(rule=>rule.kind==='choice');
 const issues:SourceFieldIssue[]=[];let completed=0;
 for(const rule of effective){const value=storedValue(rule,answers,project);const reason=validateRule(rule,value);if(reason)issues.push({id:rule.id,label:rule.label,reason,kind:value?'invalid':'missing'});else completed++;}
 return {complete:effective.length>0&&issues.length===0,required:effective.length,completed,issues,rules:effective};
}
