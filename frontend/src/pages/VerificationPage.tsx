import {
  Activity, AlertTriangle, Check, CheckCircle2, ClipboardCheck, Clock3, FileCheck2,
  RotateCcw, SlidersHorizontal,
} from 'lucide-react';

import {
  Chart, KPI, PageHeading, Section, Status, SurveyTable,
} from '../components/app/AppComponents';
import type { PageProps } from '../types';
import { canRole } from '../workflow/workflowConfig';

export default function VerificationPage(p:PageProps){
 const pending=p.scoped.filter(s=>s.status==='Verifikasi'||s.status==='Perlu Perbaikan');
 return <><PageHeading label="Alur verifikasi bertingkat" detail="Pemeriksaan berlapis dari penyedia jasa, balai, hingga direktorat" action={<button className="btn primary" onClick={()=>p.setActiveTab(p.activeTab==='Semua'?'Audit sampling':'Semua')} data-testid="button-start-verification"><ClipboardCheck size={13}/>Mulai verifikasi</button>}/>
 <div className="stage-row" style={{marginBottom:12}}>{[['1','Tingkat 1 — Penyedia jasa','Self-audit kelengkapan data','100%'],['2','Tingkat 2 — Pengguna jasa','Sampling dan verifikasi hasil','78%'],['3','Tingkat 3 — Direktorat','Audit lanjutan independen','60%']].map(s=><div className="stage" key={s[0]} style={{background:'white'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><div className="stage-num">{s[0]}</div><div className="stage-title" style={{margin:0}}>{s[1]}<div className="subtle">{s[2]}</div></div></div><div className="stage-bar"><i style={{width:s[3],background:s[0]==='1'?'#15a078':'#1989ca'}}/></div><div className="subtle" style={{textAlign:'right'}}>{s[3]} · data diaudit</div></div>)}</div>
 <div className="grid-two"><Section title="Aspek mutu yang diperiksa" icon={CheckCircle2}><div className="panel-body">{['Kelengkapan dokumen','Metode survei','Kalibrasi alat','Konsistensi hasil','Kelengkapan ruas','Kewajaran nilai'].map((x,i)=><div className="quality-check" key={x}><span style={{display:'flex',gap:8,alignItems:'center'}}><CheckCircle2 size={14} color={i===4?'#d89520':'#15996f'}/>{x}</span><Status value={i===4?'Perlu review':'Sesuai'}/></div>)}</div></Section>
 <Section title="Status hasil verifikasi" icon={Activity}><div className="panel-body kpi-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',margin:0}}><KPI icon={Clock3} label="Menunggu audit" value={`${pending.length+16}`} note="butuh tinjauan" testId="kpi-verification-wait"/><KPI icon={CheckCircle2} label="Lulus" value="64" note="sesuai standar" tone="green" testId="kpi-verification-pass"/><KPI icon={AlertTriangle} label="Perlu perbaikan" value="15" note="tindak lanjut" tone="red" testId="kpi-verification-rework"/></div><Chart/></Section></div>
 <div className="grid-even"><Section title="Daftar sampel untuk diverifikasi" icon={FileCheck2} extra={<div className="toolbar"><button className="btn sm" onClick={()=>p.setActiveTab(p.activeTab==='Prioritas tinggi'?'Semua':'Prioritas tinggi')} data-testid="button-filter-priority"><SlidersHorizontal size={12}/>Prioritas</button></div>}><SurveyTable surveys={pending.length?pending:p.scoped.slice(0,4)} onEdit={p.beginEdit} onStatus={p.updateStatus} canEdit={canRole(p.workflow.role,'reviewValidation')}/></Section>
 <Section title="Tinjauan keputusan" icon={ClipboardCheck}><div className="panel-body"><div className="field"><label>Catatan pemeriksa</label><textarea placeholder="Tuliskan alasan ketidaksesuaian atau rekomendasi..." data-testid="textarea-verification-note"/></div><div className="form-actions">{canRole(p.workflow.role,'reviewValidation')?<><button className="btn danger" onClick={()=>{const first=pending[0];if(first)p.updateStatus('survey',first.id,'Perlu Perbaikan');else p.setNotice('Tidak ada data yang menunggu perbaikan')}} data-testid="button-return-revision"><RotateCcw size={13}/>Kembalikan</button><button className="btn primary" onClick={()=>{const first=pending[0];if(first)p.updateStatus('survey',first.id,'Lulus');else p.setNotice('Tidak ada sampel menunggu verifikasi')}} data-testid="button-approve-verification"><Check size={13}/>Setujui hasil</button></>:<span className="subtle">Keputusan review tersedia untuk PIC Balai / Pengguna Jasa, Direktorat / Pusat, atau Admin pada demo frontend.</span>}</div></div></Section></div>
 </>;
}
