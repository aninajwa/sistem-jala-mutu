import type {SourceDocument} from './sourceDocumentModel';
type Bound={operator:'<='|'>='|'<'|'>';value:number;text:string};
export function sourceBound(text:string,header=''):Bound|undefined{
 const explicit=text.trim().match(/^(≤|≥|<=|>=|<|>|min\.?|maks\.?|minimal|maksimal)\s*(\d+(?:[.,]\d+)?)(.*)$/i);
 const plain=/minimal|minimum/i.test(header)&&/^\d+(?:[.,]\d+)?$/.test(text.trim());
 if(!explicit&&!plain)return undefined;
 if(explicit&&/\d/.test(explicit[3]))return undefined; // e.g. 800×600 is not one scalar.
 const token=explicit?.[1].toLowerCase()??'min',operator=token==='≤'||token==='<='||/maks/.test(token)?'<=':token==='≥'||token==='>='||/min/.test(token)?'>=':token as '<'|'>';
 return {operator,value:Number((explicit?.[2]??text).replace(',','.')),text};
}
/** Compare a reported scalar only where that exact source row states its comparator.
 * No inferred benchmark, dimension conversion, CV formula or reviewer decision. */
export function sourceScalarResult(document:SourceDocument,tableNumber:number,rowNumber:number,answers:Record<string,string>){
 const table=document.tables.find(item=>item.table===tableNumber),headers=table?.rows[0]??[],row=table?.rows[rowNumber-1];if(!row)return undefined;
 const boundIndex=headers.findIndex(label=>/^(standar(?: minimal)?|batas penerimaan)$/i.test(label.trim()));if(boundIndex<0)return undefined;
 const bound=sourceBound(row[boundIndex]??'',headers[boundIndex]);if(!bound)return undefined;
 const column=headers.findIndex(label=>/^(nilai|hasil|hasil sampel|cv\s*\(%\))$/i.test(label.trim()));if(column<0)return undefined;
 const raw=answers[`value:t${tableNumber}:r${rowNumber}:c${column+1}`]?.trim()??'';
 const number=/^-?\d+(?:[.,]\d+)?$/.test(raw)?Number(raw.replace(',','.')):NaN;
 if(!Number.isFinite(number))return {column,label:'Belum dapat dinilai',reason:`Isi nilai numerik; pembanding sumber: ${bound.text}.`};
 const pass=bound.operator==='<='?number<=bound.value:bound.operator==='>='?number>=bound.value:bound.operator==='<'?number<bound.value:number>bound.value;
 const terminology=/Memenuhi/i.test(row.join(' '));
 return {column,label:pass?(terminology?'Memenuhi':'Sesuai'):(terminology?'Tidak Memenuhi':'Tidak Sesuai'),reason:`Nilai ${raw}; batas ${bound.text}. Hasil pembandingan, bukan persetujuan.`};
}
