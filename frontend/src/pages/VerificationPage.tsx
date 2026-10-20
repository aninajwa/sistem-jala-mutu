import { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, Check, CheckCircle2, ClipboardCheck, Clock3, FileCheck2,
  RotateCcw, X,
} from 'lucide-react';

import {
  Chart, KPI, PageHeading, Section, Status,
} from '../components/app/AppComponents';
import type { SurveyDecision } from '../lib/statusTransitions';
import type { PageProps } from '../types';
import { canRole } from '../workflow/workflowConfig';

export default function VerificationPage(p:PageProps){
 // Hanya sampel berstatus Verifikasi yang menunggu keputusan. Sampel yang
 // dikembalikan (Perlu Perbaikan) menunggu perbaikan Penyedia, bukan keputusan baru.
 const pending=p.scoped.filter(s=>s.status==='Verifikasi');
 const canReview=canRole(p.workflow.role,'reviewValidation');
 const [selectedId,setSelectedId]=useState('');
 const [decision,setDecision]=useState<SurveyDecision|null>(null);
 const selected=pending.find(s=>s.id===selectedId)??null;
 const note=selected?selected.verificationNoteDraft??selected.reviewNote??'':'';

 const selectSample=(id:string)=>{
  setSelectedId(id);
  setDecision(null);
 };
 const setNote=(value:string)=>{
  if(!selected)return;
  p.saveReviewDraft(selected.id,value);
 };
 const requestDecision=(value:SurveyDecision)=>{
  if(!selected){
   p.setNotice('Pilih sampel yang akan diverifikasi terlebih dahulu.');
   window.setTimeout(()=>p.setNotice(''),2600);
   return;
  }
  if(value==='Perlu Perbaikan'&&!note.trim()){
   p.setNotice('Catatan pemeriksa wajib diisi sebelum sampel dikembalikan.');
   window.setTimeout(()=>p.setNotice(''),3000);
   return;
  }
  setDecision(value);
 };
 const confirmDecision=()=>{
  if(!selected||!decision)return;
  const saved=p.reviewSurvey(selected.id,decision,note);
  if(!saved)return;
  setSelectedId('');
  setDecision(null);
 };
 const startVerification=()=>{
  if(!canReview){
   p.setNotice(`Peran ${p.workflow.role} tidak berwenang memberi keputusan review.`);
   window.setTimeout(()=>p.setNotice(''),3200);
   return;
  }
  const first=pending[0];
  if(!first){
   p.setNotice('Tidak ada sampel yang menunggu verifikasi.');
   window.setTimeout(()=>p.setNotice(''),2600);
   return;
  }
  selectSample(first.id);
  window.setTimeout(()=>{
   document.getElementById('verification-review')?.scrollIntoView?.({behavior:'smooth',block:'start'});
  },0);
 };

 useEffect(()=>{
  if(!decision)return;
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==='Escape')setDecision(null);
  };
  window.addEventListener('keydown',onKeyDown);
  return()=>window.removeEventListener('keydown',onKeyDown);
 },[decision]);

 return <><PageHeading label="Alur verifikasi bertingkat" detail="Pemeriksaan berlapis dari penyedia jasa, balai, hingga direktorat" action={<button className="btn primary" onClick={startVerification} data-testid="button-start-verification"><ClipboardCheck size={13}/>Mulai verifikasi</button>}/>
 <div className="stage-row" style={{marginBottom:12}}>{[['1','Tingkat 1 â€” Penyedia jasa','Self-audit kelengkapan data','100%'],['2','Tingkat 2 â€” Pengguna jasa','Sampling dan verifikasi hasil','78%'],['3','Tingkat 3 â€” Direktorat','Audit lanjutan independen','60%']].map(s=><div className="stage" key={s[0]} style={{background:'white'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><div className="stage-num">{s[0]}</div><div className="stage-title" style={{margin:0}}>{s[1]}<div className="subtle">{s[2]}</div></div></div><div className="stage-bar"><i style={{width:s[3],background:s[0]==='1'?'#15a078':'#1989ca'}}/></div><div className="subtle" style={{textAlign:'right'}}>{s[3]} Â· data diaudit</div></div>)}</div>
 <div className="grid-two"><Section title="Aspek mutu yang diperiksa" icon={CheckCircle2}><div className="panel-body">{['Kelengkapan dokumen','Metode survei','Kalibrasi alat','Konsistensi hasil','Kelengkapan ruas','Kewajaran nilai'].map((x,i)=><div className="quality-check" key={x}><span style={{display:'flex',gap:8,alignItems:'center'}}><CheckCircle2 size={14} color={i===4?'#d89520':'#15996f'}/>{x}</span><Status value={i===4?'Perlu review':'Sesuai'}/></div>)}</div></Section>
 <Section title="Status hasil verifikasi" icon={Activity}><div className="panel-body kpi-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',margin:0}}><KPI icon={Clock3} label="Menunggu audit" value={`${pending.length+16}`} note="butuh tinjauan" testId="kpi-verification-wait"/><KPI icon={CheckCircle2} label="Lulus" value="64" note="sesuai standar" tone="green" testId="kpi-verification-pass"/><KPI icon={AlertTriangle} label="Perlu perbaikan" value="15" note="tindak lanjut" tone="red" testId="kpi-verification-rework"/></div><Chart/></Section></div>
 <div className="grid-even">
  <Section title="Daftar sampel untuk diverifikasi" icon={FileCheck2} extra={<span className="subtle" data-testid="verification-sample-count">{pending.length} sampel menunggu keputusan</span>}>
   <div className="table-wrap"><table data-testid="table-verification-samples"><thead><tr><th>Pilih</th><th>ID / Tanggal</th><th>Ruas</th><th>Jenis</th><th>Hasil awal</th><th>Status</th></tr></thead><tbody>{pending.map(s=><tr key={s.id} data-testid={`row-verification-${s.id}`} style={{background:selectedId===s.id?'#f2f8fc':undefined}}><td><input type="radio" name="verification-sample" checked={selectedId===s.id} onChange={()=>selectSample(s.id)} aria-label={`Pilih sampel ${s.id}`} data-testid={`radio-verification-${s.id}`}/></td><td><strong>{s.id}</strong><div className="subtle">{s.tanggal}</div></td><td>{s.ruas}</td><td>{s.jenis}</td><td>{s.hasil}</td><td><Status value={s.status}/></td></tr>)}{pending.length===0&&<tr><td colSpan={6}><div className="empty"><FileCheck2 size={20}/><div>Tidak ada sampel berstatus Verifikasi pada filter ini.</div></div></td></tr>}</tbody></table></div>
  </Section>
  <Section id="verification-review" title="Tinjauan keputusan" icon={ClipboardCheck}>
   {selected?<div className="panel-body">
    <div className="quality-check"><span>Sampel terpilih</span><strong>{selected.id} Â· {selected.ruas}</strong></div>
    <div className="quality-check"><span>Status saat ini</span><Status value={selected.status}/></div>
    {selected.reviewNote&&<div className="notice" data-testid="verification-saved-note"><CheckCircle2 size={14}/>Catatan tersimpan: {selected.reviewNote}</div>}
    <div className="field"><label>Catatan pemeriksa {decision==='Perlu Perbaikan'?'(wajib)':''}</label><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Tuliskan alasan ketidaksesuaian atau rekomendasi..." disabled={!canReview} data-testid="textarea-verification-note"/></div>
    <div className="subtle" style={{marginTop:6}}>Catatan disimpan bersama sampel dan tidak hilang saat berpindah halaman.</div>
    <div className="form-actions">{canReview?<><button className="btn danger" onClick={()=>requestDecision('Perlu Perbaikan')} data-testid="button-return-revision" disabled={!selected}><RotateCcw size={13}/>Kembalikan</button><button className="btn primary" onClick={()=>requestDecision('Lulus')} data-testid="button-approve-verification" disabled={!selected}><Check size={13}/>Setujui hasil</button></>:<span className="subtle">Keputusan review tersedia untuk PIC Balai / Pengguna Jasa, Direktorat / Pusat, atau Admin pada demo frontend.</span>}</div>
   </div>:<div className="panel-body"><div className="empty" data-testid="verification-empty-selection"><ClipboardCheck size={21}/><div>Pilih satu sampel pada daftar untuk mencatat keputusan.</div></div></div>}
  </Section>
 </div>
 {decision&&selected&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setDecision(null)}}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="verification-confirm-title"><div className="dialog-head"><h2 id="verification-confirm-title">{decision==='Lulus'?'Setujui hasil verifikasi':'Kembalikan sampel untuk perbaikan'}</h2><button className="btn sm" onClick={()=>setDecision(null)} aria-label="Tutup konfirmasi" data-testid="button-close-verification-confirm"><X size={15}/></button></div><div className="dialog-content">
  <div className="quality-check"><span>Sampel</span><strong>{selected.id} Â· {selected.ruas}</strong></div>
  <div className="quality-check"><span>Keputusan</span><Status value={decision}/></div>
  <div className="quality-check"><span>Catatan</span><span style={{maxWidth:320,textAlign:'right'}}>{note||'Tanpa catatan'}</span></div>
  <div className="notice">{decision==='Lulus'?'Status sampel akan menjadi Lulus dan tercatat pada log audit.':'Status sampel akan menjadi Perlu Perbaikan dan catatan wajib tersimpan.'}</div>
  <div className="form-actions"><button className="btn" onClick={()=>setDecision(null)} data-testid="button-cancel-verification">Batal</button><button className={`btn ${decision==='Lulus'?'primary':'danger'}`} onClick={confirmDecision} data-testid="button-confirm-verification">Konfirmasi {decision}</button></div>
 </div></div></div>}
 </>;
}
