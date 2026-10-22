import catalog from './sourceChecklistCatalog.json';
import {useState} from 'react';
import type {OperationalWorkflowState} from './model';
import {PACKAGE_WORKFLOW_ITEMS} from './roleNavigation';
export function SourceReferencePanel({state,selection}:{state:OperationalWorkflowState;selection:string}){
 const stage=PACKAGE_WORKFLOW_ITEMS.find(item=>item.selection===selection)?.code;
 const phases=stage==='Tahap 1'||stage==='Tahap 2'?['calibration']:stage==='Tahap 3B'?['consistency','internal','periodic14']:stage==='Tahap 4'?['staged']:stage==='Tahap 5'?['audit']:[];
 const [selected,setSelected]=useState('');
 const docs=catalog.filter(doc=>phases.includes(doc.phase)&&state.project.surveyTypes.some(type=>doc.survey===(type==='PCI'?'PCI Manual':type)));
 if(!docs.length)return null;const current=docs.find(doc=>doc.id===selected)??docs[0];
 return <details className="wf-panel source-reference"><summary className="wf-panel-head">Acuan asli dan keterlacakan checklist ({docs.length} dokumen)</summary><div className="wf-body"><p className="wf-note">Tabel berikut disalin dari DOCX sumber untuk pemeriksaan silang. Isi referensi bukan jawaban dan tidak mengubah status kelengkapan. Pemetaan teknis per item yang belum terverifikasi dicatat pada matriks keterlacakan.</p><select aria-label="Dokumen checklist sumber" value={current.id} onChange={e=>setSelected(e.target.value)}>{docs.map(doc=><option key={doc.id} value={doc.id}>{doc.survey} — {doc.title}</option>)}</select><p><a href={`${import.meta.env.BASE_URL}${current.asset}`} download>Unduh DOCX sumber</a> · {current.source}</p>{current.tables.map(table=><details key={table.table}><summary>Tabel {table.table}</summary><div className="wf-table-wrap"><table className="wf-table"><tbody>{table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></details>)}</div></details>;
}
