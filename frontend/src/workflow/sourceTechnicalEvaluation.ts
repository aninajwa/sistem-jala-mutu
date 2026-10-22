import type {SourceDocument} from './sourceDocumentModel';
const sourceCellKey=(table:number,row:number,column:number)=>`value:t${table}:r${row}:c${column}`;
/** Exact rule printed below Jembatan M: equal; difference 1 level; difference >1 level. */
export function bridgeSamplingResult(document:SourceDocument,table:number,row:number,answers:Record<string,string>){
 const target=document.tables.find(item=>item.table===table),columns=target?.rows[0]??[];
 if(!target||!columns.some(column=>/Nilai Kondisi Tim Surveyor/i.test(column))||!columns.some(column=>/Nilai Kondisi Verifikasi/i.test(column)))return undefined;
 const rule=(document.blocks??[]).some(block=>/Minor.*perbedaan 1 tingkat.*Major.*perbedaan >1 tingkat/i.test(block.text??''));
 if(!rule)return {label:'Belum dapat dinilai',reason:'Ketentuan pembanding belum terpetakan.'};
 const read=(index:number)=>{const value=answers[sourceCellKey(table,row,index+1)]?.trim();return value!==undefined&&value!==''?Number(value):NaN;};
 const first=read(columns.findIndex(column=>/Tim Surveyor/i.test(column))),second=read(columns.findIndex(column=>/Verifikasi/i.test(column)));
 if(!Number.isFinite(first)||!Number.isFinite(second)||!Number.isInteger(first)||!Number.isInteger(second))return {label:'Belum dapat dinilai',reason:'Isi kedua nilai kondisi dalam tingkat bilangan bulat.'};
 const difference=Math.abs(first-second);return {label:difference===0?'Sesuai':difference===1?'Minor':'Major',reason:`Selisih ${difference} tingkat; Sesuai = 0, Minor = 1, Major > 1.`};
}

/** Lendutan on-going DOCX tables 14/15: minimum 3 repeats, CV <=5%. */
export function lendutanOngoingResults(document:SourceDocument,answers:Record<string,string>){
 if(document.survey!=='Lendutan'||document.phase!=='consistency')return [];
 return document.tables.flatMap(table=>table.rows.slice(1).flatMap((row,i)=>{
  const label=row.join(' '),column=table.rows[0].findIndex(value=>/^(Hasil|Keterangan)$/i.test(value));
  const cv=/Koefisien variasi/.test(label)&&/≤\s*5%/.test(label),repeats=/Jumlah pengulangan.*minimal 3x/.test(label);
  if(column<0||!cv&&!repeats)return [];
  const raw=answers[sourceCellKey(table.table,i+2,column+1)]?.trim()??'',value=/^\d+(?:[.,]\d+)?$/.test(raw)?Number(raw.replace(',','.')):NaN;
  const known=Number.isFinite(value)&&value>=0&&(!repeats||Number.isInteger(value)),pass=known&&(cv?value<=5:value>=3);
  return [{table:table.table,row:i+2,column,label:!known?'Belum dapat dinilai':pass?'Memenuhi':'Tidak Memenuhi',reason:cv?'CV ≤ 5% sesuai formulir.':'Minimal 3 pengulangan sesuai formulir.',pass,known}];
 }));
}
