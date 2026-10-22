import {sourceScalarResult} from './sourceScalarEvaluation';
import {projectChecklistValue,type ChecklistProjectInfo} from './checklistProjectValues';
import {sourceKeyValueTable,type SourceDocument} from './sourceDocumentModel';
import {bridgeSamplingResult,lendutanOngoingResults} from './sourceTechnicalEvaluation';
export function sourceCellEditable(value:string){return !value.trim()||/^(\[.*\]|\.{3,}|_{3,}|—|-|:|%)$/.test(value.trim());}
export const sourceCellKey=(table:number,row:number,column:number)=>`value:t${table}:r${row}:c${column}`;
export function SourceResultTables({document,answers,editable,onChange,projectInfo,onlyTable}:{projectInfo?:ChecklistProjectInfo;document:SourceDocument;answers:Record<string,string>;editable:boolean;onChange:(id:string,value:string)=>void;onlyTable?:number}){
 return <>{document.tables.filter(table=>onlyTable===undefined||table.table===onlyTable).map(table=>{
 if(sourceKeyValueTable(table.rows))return <div className="source-key-values" key={table.table}>{table.rows.map((row,index)=>{const label=row[0],cell=row[1]??'',id=sourceCellKey(table.table,index+1,2),known=projectChecklistValue(label,projectInfo);if(/[□☐]/.test(cell))return null;const isInput=sourceCellEditable(cell);return <label key={id}>{label}{known?<span>{known}</span>:isInput?<input aria-label={`${document.survey}, ${label}`} disabled={!editable} value={answers[id]??''} type={/tanggal/i.test(label)?'date':'text'} onChange={e=>onChange(id,e.target.value)} placeholder="Belum diisi"/>:<span>{cell.replace(/^:\s*/,'')}</span>}</label>;})}</div>;
 const rows=table.rows.slice(1),columns=table.rows[0]??[];
 const choices=columns.filter(column=>/^(Ya|Tidak|N\/A|Sesuai|Tidak Sesuai|Memenuhi|Tidak Memenuhi)$/i.test(column.trim()));
 if(choices.length>=2||!rows.some(row=>row.some(sourceCellEditable)))return null;
 return <div className="wf-table-wrap" key={table.table}><table className="wf-table"><thead><tr>{columns.map((column,i)=><th key={i}>{column}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>{
 const known=j>0?projectChecklistValue(row[0]??'',projectInfo):undefined;
 const id=sourceCellKey(table.table,i+2,j+1),label=columns[j]??'',value=answers[id]??'';
 const scalar=sourceScalarResult(document,table.table,i+2,answers);
 const result=bridgeSamplingResult(document,table.table,i+2,answers)??lendutanOngoingResults(document,answers).find(item=>item.table===table.table&&item.row===i+2)??scalar;
 const type=scalar?.column===j?'number':/tanggal|berlaku hingga|awal survei|akhir survei/i.test(label)?'date':/nilai kondisi|persentase|panjang|jumlah|\(km\)|\(m\)|\(tahun\)|\(%\)/i.test(label)?'number':'text';
 return <td key={j}>{/tanda tangan/i.test(label)?<small>Belum disahkan · rujuk dokumen persetujuan</small>:result&&/status/i.test(label)?<span title={result.reason}><small>Hasil sistem</small><strong>{result.label}</strong><small>{result.reason}</small></span>:sourceCellEditable(cell)?known!==undefined&&known!==''?<span>{known}</span>:editable?<input aria-label={`${table.heading??document.survey}, ${row[0]||i+1}, ${label}`} type={type} step={type==='number'?'any':undefined} value={value} placeholder={/foto|dokumen|gambar/i.test(label)?'Referensi Dokumen & Lampiran':'Belum diisi'} onChange={e=>onChange(id,e.target.value)}/>:<span>{value||'Belum diisi'}</span>:/[□☐]/.test(cell)?<small>Pilihan dicatat pada pemeriksaan di atas</small>:<span>{cell}</span>}{scalar?.column===j&&!columns.some(column=>/status/i.test(column))&&<small title={scalar.reason}>Hasil sistem: {scalar.label} · {scalar.reason}</small>}</td>;
 })}</tr>)}</tbody></table></div>;
 })}</>;
}
