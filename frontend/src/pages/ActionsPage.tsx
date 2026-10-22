import {
  AlertCircle, AlertTriangle, CheckCircle2, ClipboardList, Clock3, ListChecks, Pencil,
  Plus, RotateCcw, TrendingUp, Wrench,
} from 'lucide-react';

import {
  FilterToolbar, KPI, PageHeading, Section, Status,
} from '../components/app/AppComponents';
import type { PageProps } from '../types';
import type { Finding } from '../types';
import { canRole } from '../workflow/workflowConfig';

function FindingTable({p,items}:{p:PageProps;items:Finding[]}){
 const canManage=canRole(p.workflow.role,'manageFindings');
 return <div className="table-wrap"><table data-testid="table-findings"><thead><tr><th>ID Temuan</th><th>Ruas</th><th>Jenis temuan</th><th>Prioritas</th><th>PIC</th><th>Jatuh tempo</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{items.map(f=><tr key={f.id} data-testid={`row-finding-${f.id}`}><td><strong>{f.id}</strong></td><td>{f.ruas}</td><td>{f.jenis}</td><td><Status value={f.prioritas}/></td><td>{f.pic}</td><td>{f.due}</td><td><Status value={f.status}/></td><td>{canManage?<div className="toolbar"><button className="btn sm" onClick={()=>p.beginEdit('finding',f.id)} data-testid={`button-edit-finding-${f.id}`} aria-label={`Edit temuan ${f.id}`}><Pencil size={12}/></button><select value={f.status} onChange={e=>p.updateStatus('finding',f.id,e.target.value)} data-testid={`select-status-finding-${f.id}`} style={{fontSize:9,border:'1px solid #d5e0e8',borderRadius:4,padding:4}}>{['Diusulkan','Disetujui','Dilaksanakan','Verifikasi Ulang','Selesai'].map(s=><option key={s}>{s}</option>)}</select></div>:<span className="subtle">Lihat saja</span>}</td></tr>)}</tbody></table>{items.length===0&&<div className="empty"><AlertCircle size={22}/>Tidak ada temuan pada filter ini.</div>}</div>
}
export default function ActionsPage(p:PageProps){
  const items=p.store.findings.filter(f=>`${f.id} ${f.ruas} ${f.jenis} ${f.pic}`.toLowerCase().includes(p.search.toLowerCase())).filter(f=>p.activeTab==='Semua'||(p.activeTab==='Prioritas'?['Kritis','Tinggi'].includes(f.prioritas):f.status===p.activeTab));
 const open=p.store.findings.filter(f=>f.status!=='Selesai').length;
 return <><PageHeading label="Kasus dan tindakan korektif" detail="Kelola temuan mutu, PIC, tenggat waktu, dan verifikasi ulang" action={canRole(p.workflow.role,'manageFindings')?<button className="btn primary" onClick={()=>p.openNew('finding')} data-testid="button-new-finding"><Plus size={13}/>Tambah temuan</button>:<span className="subtle">Read-only sesuai peran</span>}/>
 <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><KPI icon={AlertTriangle} label="Kasus terbuka" value={`${open}`} note="belum ditutup" tone="red" testId="kpi-findings-open"/><KPI icon={Clock3} label="Mendekati tenggat" value="5" note="dalam 7 hari" tone="amber" testId="kpi-findings-due"/><KPI icon={CheckCircle2} label="Selesai" value="51" note="periode berjalan" tone="green" testId="kpi-findings-done"/><KPI icon={TrendingUp} label="Penyelesaian" value="68%" note="dari total tindakan" testId="kpi-findings-rate"/></div>
 <div className="grid-two"><Section title="Tahapan tindakan perbaikan" icon={ListChecks}><div className="panel-body"><div className="stage-row">{[['1','Diusulkan','6','65%'],['2','Disetujui','5','75%'],['3','Dilaksanakan','6','55%'],['4','Verifikasi ulang','4','42%'],['5','Selesai','3','90%']].map((s,i)=><div className="stage" key={s[0]}><div className="stage-num" style={{background:i===4?'#159b76':i===3?'#d9911c':'#1683c7'}}>{s[0]}</div><div className="stage-title">{s[1]} <span className="subtle">{s[2]}</span></div><div className="stage-bar"><i style={{width:s[3],background:i===4?'#159b76':undefined}}/></div></div>)}</div></div></Section>
 <Section title="Jenis tindakan" icon={Wrench}><div className="panel-body bar-list">{['Survei / penilaian ulang','Kalibrasi alat','Pelatihan ulang','Perbaikan data','Penggantian komponen'].map((x,i)=><div className="bar-row" key={x}><span style={{width:110}}>{x}</span><div className="bar-track"><div className={`bar-fill ${i%2?'teal':''}`} style={{width:`${[80,54,68,43,32][i]}%`}}/></div><span className="bar-percent">{[8,5,4,3,2][i]}</span></div>)}</div></Section></div>
 <Section title="Daftar tindakan perbaikan" icon={ClipboardList} extra={<FilterToolbar search={p.search} setSearch={p.setSearch} actions={<button className="btn sm" onClick={()=>{p.setActiveTab('Semua');p.setSearch('')}} data-testid="button-reset-findings"><RotateCcw size={12}/>Reset</button>}/>}>
 <div className="tabs">{['Semua','Diusulkan','Disetujui','Dilaksanakan','Verifikasi Ulang','Selesai'].map(t=><button key={t} className={`tab ${p.activeTab===t?'active':''}`} onClick={()=>p.setActiveTab(t)} data-testid={`tab-finding-${t.toLowerCase().replaceAll(' ','-')}`}>{t}</button>)}</div><FindingTable p={p} items={items}/></Section>
 </>;
}
