import { useEffect, useState } from 'react';
import { readLocal, writeLocal } from '../repository/localPersistence';
import { stage6HandoverKey, submissionProblems, canSubmitHandover, canReviewHandover, applyHandoverSubmission, applyHandoverReview, type HandoverRecord } from '../stage6Handover';
import type { OperationalWorkflowState, SurveyType } from '../model';

type Props = {state: OperationalWorkflowState; onNavigate: (route: string) => void; mode: 'provider' | 'balai'};
export function Stage6HandoverWorkspace({state,onNavigate,mode}:Props){
  const key=stage6HandoverKey(state.project.id);
  const [items,setItems]=useState<HandoverRecord[]>(()=>readLocal<HandoverRecord[]>(key,[]));
  const [survey,setSurvey]=useState<SurveyType>(state.project.surveyTypes[0] ?? 'IRI');
  const [scope,setScope]=useState('');
  const [evidence,setEvidence]=useState('');
  const [reason,setReason]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const [feedback,setFeedback]=useState('');
  useEffect(()=>{
    setItems(readLocal<HandoverRecord[]>(key,[]));
    const sync=(event: StorageEvent)=>{if(event.key===key||event.key===null)setItems(readLocal<HandoverRecord[]>(key,[]));};
    window.addEventListener('storage',sync);return ()=>window.removeEventListener('storage',sync);
  },[key, state.role]);
  const records=items.filter(item=>item.packageId===state.project.id && state.project.surveyTypes.includes(item.survey));
  const current=records.filter(r=>r.survey===survey).at(-1);
  const count=state.dailyRecords.filter(r=>r.surveyType===survey&&r.state==='Tercatat').length;
  const validAudits=state.audits.every(a=>a.status==='Lulus'&&!a.requiresReview);
  const problems=submissionProblems(survey,scope,evidence,count,validAudits);
  function persist(next:HandoverRecord[]){
    try {writeLocal(key,next);setItems(next);setFeedback('');return true;}
    catch {setFeedback('Gagal menyimpan pencatatan lokal.');return false;}
  }
  function submit(){
    if(!canSubmitHandover(state.role,problems,current)){setFeedback(problems.join(' · ')||'Penyerahan belum dapat diajukan.');return;}
    try {
      const next=applyHandoverSubmission({
        role:state.role, packageId:state.project.id, survey, scope, evidence,
        problems, previous:current, at:new Date().toISOString(),
        eventId:crypto.randomUUID(), recordId:crypto.randomUUID(),
      });
      persist(current?items.map(item=>item.id===current.id?next:item):[...items,next]);
    } catch(error) {setFeedback(error instanceof Error?error.message:'Pengajuan tidak dapat dicatat.');}
  }
  function review(record:HandoverRecord, action:'Periksa'|'Kembalikan'){
    if(!canReviewHandover(state.role,record))return;
    if(action==='Kembalikan'&&reason.trim().length<5){setFeedback('Alasan pengembalian wajib dijelaskan.');return;}
    if(action==='Periksa' && !validAudits){setFeedback('Audit tingkat 1–3 belum lulus dan berlaku.');return;}
    try {
      const updated=applyHandoverReview({role:state.role, record, action, reason, at:new Date().toISOString(), eventId:crypto.randomUUID()});
      if(persist(items.map(item=>item.id===record.id?updated:item))){setSelectedId('');setReason('');}
    } catch(error) {setFeedback(error instanceof Error?error.message:'Pemeriksaan gagal.');}
  }
  const latest=records.slice().reverse();
  return <section className="stage6-panel stage6-handover" aria-label="Penyerahan data Tahap 6">
    <div className="stage6-section-heading"><h3>{mode==='provider'?'Ajukan penyerahan data':'Penyerahan menunggu pemeriksaan'}</h3><span>{mode==='provider'?'Pencatatan lokal':'Pemeriksaan Pengguna Jasa'}</span></div>
    {mode==='provider' && <div className="stage6-handover-form">
      <div className="stage6-form-grid">
        <label>Jenis survei<select value={survey} onChange={e=>{const next=e.target.value as SurveyType;const prior=records.filter(r=>r.survey===next).at(-1);setSurvey(next);setScope(prior?.scope??'');setEvidence(prior?.evidence??'');setFeedback('');}}>{state.project.surveyTypes.map(s=><option value={s} key={s}>{s}</option>)}</select></label>
        <label>Cakupan data / ruas<input value={scope} onChange={e=>setScope(e.target.value)} placeholder="Ruas, segmen, atau periode hasil survei" /></label>
      </div>
      <label>Referensi data dan bukti QA/QC<input value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Nomor dokumen, lokasi berkas, BA audit" /></label>
      {current && <p className="stage6-handover-status">Penyerahan {survey}: <strong>{current.status}</strong> · versi {current.version}</p>}
      {problems.length>0 && <details className="stage6-inline-help"><summary>{problems.length} syarat belum lengkap</summary><ul>{problems.map(p=><li key={p}>{p}</li>)}</ul></details>}
      <div className="stage6-actions"><button type="button" className="wf-button" onClick={()=>onNavigate('/verification:Audit tingkat 1–3')}>Buka audit</button><button type="button" className="wf-button primary" disabled={!canSubmitHandover(state.role,problems,current)} onClick={submit}>{current?.status==='Perlu Perbaikan'?'Ajukan ulang':'Ajukan penyerahan'}</button></div>
      <small className="stage6-inline-muted">Pengajuan hanya tercatat di perangkat ini. Belum terkirim ke server Balai.</small>
    </div>}
    {latest.length===0?<p className="stage6-empty">Belum ada penyerahan yang dicatat untuk paket ini.</p>:<div className="stage6-handover-list">{latest.map(item=><article key={item.id} className="stage6-handover-item">
      <div className="stage6-handover-item-head"><strong>{item.survey} · {item.status}</strong><span>Versi {item.version} · {new Date(item.submittedAt).toLocaleDateString('id-ID')}</span></div>
      <div className="stage6-details-grid"><div><span>Cakupan</span><strong>{item.scope}</strong></div><div><span>Bukti QA/QC</span><strong>{item.evidence}</strong></div></div>
      {item.status==='Perlu Perbaikan'&&<div className="stage6-inline-warning">{item.events.at(-1)?.note}</div>}
      {mode==='balai'&&canReviewHandover(state.role,item)&&<div className="stage6-handover-review">
        <label>Alasan jika dikembalikan<textarea value={selectedId===item.id?reason:''} onChange={e=>{setSelectedId(item.id);setReason(e.target.value);}} rows={2} placeholder="Ketidaksesuaian dan tindak lanjut" /></label>
        <div className="stage6-actions"><button type="button" className="wf-button" onClick={()=>review(item,'Kembalikan')}>Kembalikan</button><button type="button" className="wf-button" onClick={()=>review(item,'Periksa')}>Tandai telah diperiksa</button></div>
      </div>}
      <details className="stage6-inline-help"><summary>Riwayat ({item.events.length})</summary><ol>{item.events.map(e=><li key={e.id}>{new Date(e.at).toLocaleString('id-ID')} · {e.actor} · {e.action}: {e.note}</li>)}</ol></details>
    </article>)}</div>}
    {feedback&&<p role="alert" className="stage6-error">{feedback}</p>}
    <small className="stage6-inline-muted">Pemeriksaan penyerahan bukan persetujuan akhir. Hanya Balai dapat mencatat keputusan penerimaan dan BA yang sah.</small>
  </section>;
}

/** Monitoring only; never exposes mutation controls to Directorate/Admin. */
export function Stage6HandoverStatus({packageId}:{packageId:string}){
  const key=stage6HandoverKey(packageId);
  const [items,setItems]=useState<HandoverRecord[]>(()=>readLocal<HandoverRecord[]>(key,[]));
  useEffect(()=>{
    setItems(readLocal<HandoverRecord[]>(key,[]));
    const sync=(event:StorageEvent)=>{if(event.key===key||event.key===null)setItems(readLocal<HandoverRecord[]>(key,[]));};
    window.addEventListener('storage',sync);return ()=>window.removeEventListener('storage',sync);
  },[key]);
  const scoped=items.filter(item=>item.packageId===packageId);
  return <div className="stage6-panel" aria-label="Penyerahan data tercatat">
    <div className="stage6-section-heading"><h3>Status penyerahan data</h3><span>Catatan lokal</span></div>
    {scoped.length===0?<p className="stage6-empty">Belum ada pengajuan penyerahan tercatat.</p>:
      <div className="stage6-audit-list">{scoped.map(item=><div key={item.id} className="stage6-audit-row"><div><strong>{item.survey} · {item.status}</strong><span>{item.scope}</span></div><span>Versi {item.version}</span></div>)}</div>}
  </div>;
}
