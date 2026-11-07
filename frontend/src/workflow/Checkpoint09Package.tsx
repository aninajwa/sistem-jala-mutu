import {useState,useRef,useEffect} from 'react';
import type {OperationalWorkflowState,SurveyType,WorkflowRole} from './model';
import {PACKAGE_WORKFLOW_ITEMS} from './roleNavigation';
import {evaluateStageGate} from './workflowGate';
import {getStageDisplayStatus,getStageDisplayLabel} from './stagePresentation';
import {workflowFormIssues} from './repository/workflowReconciliation';
import catalog from './sourceChecklistCatalog.json';
import {SourceDocumentChecklist} from './SourceDocumentChecklist';
import type {SourceDocument} from './sourceDocumentModel';
import {periodRange} from './stages/periodSchedule';
const P:WorkflowRole='Penyedia Jasa / Ketua Tim',B:WorkflowRole='PIC Balai / Pengguna Jasa',D:WorkflowRole='Direktorat / Pusat';
export {CHECKLIST_STAGES,checklistAccess} from './checkpoint09ChecklistAccess';
import {CHECKLIST_STAGES,checklistAccess} from './checkpoint09ChecklistAccess';
export function packageStageStatus(state:OperationalWorkflowState,stage:typeof PACKAGE_WORKFLOW_ITEMS[number]['code']){
 const status=getStageDisplayStatus(state,stage);
 return status==='completed'&&!evaluateStageGate(state,stage).readyToComplete?'needs-review':status;
}
export function PackageStageNavigator({state,selection,onNavigate,serverReadOnly=false}:{state:OperationalWorkflowState;selection?:string;onNavigate:(s:string)=>void;serverReadOnly?:boolean}){
 const rail=useRef<HTMLOListElement>(null);
 useEffect(()=>{const list=rail.current,active=list?.querySelector<HTMLElement>('[aria-current="step"]');if(list&&active)list.scrollLeft=Math.max(0,active.offsetLeft-list.clientWidth/2+active.offsetWidth/2);},[selection]);
 const labels=['Persiapan','Kalibrasi','Produksi','Harian','Berkala','Penyiapan','Audit','Penerimaan'];
  return <nav className="ui09-stage-nav" aria-label="Tahap 0 sampai 6 paket"><ol ref={rail}>{PACKAGE_WORKFLOW_ITEMS.map((item,index)=>{const status=packageStageStatus(state,item.code),label=serverReadOnly?'Belum terhubung ke server':status==='completed'?'Prasyarat terpenuhi':getStageDisplayLabel(status);return <li key={item.code}><button type="button" aria-current={item.selection===selection?'step':undefined} aria-label={`${item.code} · ${item.shortLabel} · ${label}`} title={`${item.label} · ${label}`} className={`ui09-stage ${serverReadOnly?'server-unavailable':status}`} onClick={()=>onNavigate(item.selection)}><span className="ui09-stage-code">{item.code.replace('Tahap ','')}</span><span>{labels[index]}</span><i aria-hidden="true"/></button></li>;})}</ol><div className="ui09-stage-caption"><span>3A & 3B berjalan paralel</span><span className="ui09-scroll-hint">Geser untuk tahap lainnya →</span></div></nav>;
}
export function StageChecklistIndex({state,selection}:{state:OperationalWorkflowState;selection:string}){
 const stage=PACKAGE_WORKFLOW_ITEMS.find(i=>i.selection===selection)?.code;
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState(''),[level,setLevel]=useState(state.role===D?3:state.role===B?2:1);
 const docs=(catalog as SourceDocument[]).filter(d=>CHECKLIST_STAGES[d.phase]===stage&&checklistAccess(d,state,level).inScope);
 const matches=docs.filter(d=>`${d.survey} ${d.source}`.toLowerCase().includes(query.toLowerCase()));
 const document=docs.find(d=>d.id===selected),access=document?checklistAccess(document,state,level):undefined;
 if(!docs.length)return null;
 const phaseLabel:Record<string,string>={calibration:'Kalibrasi',consistency:'Konsistensi',internal:'Internal',periodic14:'Dua mingguan',staged:'Bertahap',audit:'Audit',acceptance:'Penerimaan'};
 const period=state.activeCyclePeriod??1;
 const scope=document?.phase==='audit'?`${state.project.id}::audit-${access!.level}`:['consistency','internal','periodic14'].includes(document?.phase??'')&&period>1?`${state.project.id}::period-${period}`:state.project.id;
 const range=periodRange(state.project.id,period,state.project.surveyStartDate,state.project.surveyEndDate);
 return <details className="wf-panel cp09-checklists"><summary className="wf-panel-head">Checklist sumber ({docs.length})</summary><div className="wf-body"><p>Temukan formulir asli, varian metode, dan lampiran. Isian pekerjaan tetap tersedia di bawah.</p>{stage==='Tahap 5'&&<label className="wf-field">Konteks tingkat audit<select aria-label="Konteks tingkat audit indeks" value={level} onChange={e=>setLevel(Number(e.target.value))}>{[1,2,3].map(l=><option key={l} value={l}>{l}</option>)}</select></label>}<label className="wf-field ui09-source-search">Cari checklist<input aria-label="Cari checklist sumber" placeholder="Jenis survei atau nama formulir" value={query} onChange={event=>setQuery(event.target.value)}/></label><div className="cp09-checklist-list">{matches.map(d=>{const a=checklistAccess(d,state,level);return <article key={d.id}><strong>{d.survey} · {phaseLabel[d.phase]}{d.auditLevel?` · tingkat ${d.auditLevel}`:''}</strong><small>{a.supplement?'Lampiran audit umum; checklist utama Lendutan mengikuti tingkat audit.':!a.variant?'Varian metode lain · baca saja':`Isian oleh ${a.actor}`}</small><div><button type="button" className="wf-button" data-source-id={d.id} aria-label={`Buka checklist ${d.survey} ${phaseLabel[d.phase]}${d.auditLevel?` tingkat ${d.auditLevel}`:""}`} aria-expanded={selected===d.id} onClick={()=>setSelected(selected===d.id?'':d.id)}>Buka checklist</button><a className="wf-button" href={`${import.meta.env.BASE_URL}${d.asset}`} download>Unduh sumber asli</a></div></article>;})}</div>{matches.length===0&&<p role="status">Tidak ada checklist yang cocok. Ubah kata pencarian untuk menampilkan formulir lainnya.</p>}{document&&access&&<section aria-label={`Formulir terpilih ${document.id}`}><p className="wf-note">ID sumber: {document.id} · {document.phase==='audit'?`Audit ${access.level}`:`Periode ${period}`} · {access.editable?'Dapat diisi sesuai kewenangan':'Baca saja pada konteks ini'}</p><SourceDocumentChecklist key={`${document.id}:${scope}`} packageId={scope} phase={document.phase} surveyTypes={[access.type]} role={state.role} editableRoles={access.editable?[access.actor]:[]} pciManual={document.survey!=='PCI AI'} projectInfo={{...state.project,periodStart:range.start,periodEnd:range.end}} documentOverride={document} hideSurveySelector/></section>}</div></details>;
}
