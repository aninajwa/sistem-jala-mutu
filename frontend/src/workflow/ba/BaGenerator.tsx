import {useState} from 'react';
import type {OperationalWorkflowState,SurveyType} from '../model';
import {BA_TEMPLATES,type BaKind} from './docxEngine';
import type {BaIdentity} from './documentRepository';
import {BaDocumentEditor} from './BaDocumentEditor';
import {readLocal,localPersistence} from '../repository/localPersistence';
export function BaGenerator({state,period=1,onNavigate}:{state:OperationalWorkflowState;period?:number;onNavigate?:(selection:string)=>void}){
 const navigation=readLocal<{packageId?:string;kind?:BaKind;period?:number}>('jala-ba-navigation-v2',{});
 const requested=navigation.packageId===state.project.id?navigation:{};
 const [kind,setKind]=useState<BaKind>(BA_TEMPLATES.some(t=>t.id===requested.kind)?requested.kind!:'kalibrasi'),[survey,setSurvey]=useState<SurveyType>(state.project.surveyTypes[0]??'IRI'),[activePeriod,setPeriod]=useState(requested.period||period),[auditLevel,setLevel]=useState<1|2|3>(1);
 const periodic=['konsistensi','internal','duaMingguan'].includes(kind);
 const identity:BaIdentity={packageId:state.project.id,kind,period:periodic?activePeriod:0,survey,auditLevel:kind==='audit'?auditLevel:1};
 const back=localPersistence.getItem('jala-ba-return-to')||'/packages:Ringkasan Paket';
 return <div className="ba-workspace"><div className="wf-head"><div><div className="wf-eyebrow">DOKUMEN MUTU</div><h1 className="wf-title">Berita acara dan dokumen pemeriksaan</h1><p className="wf-subtitle">Paket, jenis survei dan periode menentukan sumber data dokumen.</p></div></div><section className="wf-panel"><div className="wf-body wf-fields"><div className="wf-field"><label>Format sumber</label><select aria-label="Format BA" value={kind} onChange={e=>setKind(e.target.value as BaKind)}>{BA_TEMPLATES.map(t=><option value={t.id} key={t.id}>{t.title}</option>)}</select></div><div className="wf-field"><label>Jenis survei</label><select aria-label="Jenis survei BA" value={survey} onChange={e=>setSurvey(e.target.value as SurveyType)}>{state.project.surveyTypes.map(type=><option key={type}>{type}</option>)}</select></div>{periodic&&<div className="wf-field"><label>Periode dokumen</label><input aria-label="Periode BA" type="number" min={1} value={activePeriod} onChange={e=>setPeriod(Math.max(1,Number(e.target.value)||1))}/></div>}{kind==='audit'&&<div className="wf-field"><label>Tingkat audit</label><select aria-label="Tingkat audit BA" value={auditLevel} onChange={e=>setLevel(Number(e.target.value) as 1|2|3)}>{[1,2,3].map(i=><option key={i} value={i}>Audit tingkat {i}</option>)}</select></div>}</div></section><BaDocumentEditor key={JSON.stringify(identity)} state={state} identity={identity} onBack={()=>onNavigate?.(back)}/></div>;
}
