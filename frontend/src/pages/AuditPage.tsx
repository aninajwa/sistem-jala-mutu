import {
  Activity, AlertTriangle, ArrowDownToLine, BarChart3, CheckCircle2, ClipboardList, Eye,
  HardDrive, Search, Settings, ShieldCheck, Users, X,
} from 'lucide-react';

import {
  Chart, FilterToolbar, KPI, PageHeading, Section, Status,
} from '../components/app/AppComponents';
import {
  SURVEY_TRANSITION_MATRIX, canSetSurveyStatus,
} from '../lib/statusTransitions';
import type { PageProps } from '../types';
import { WORKFLOW_ROLE_OPTIONS } from '../workflow/workflowConfig';

export default function AuditPage(p:PageProps){
 const logs=p.store.logs.filter(l=>`${l.id} ${l.pengguna} ${l.aktivitas} ${l.objek}`.toLowerCase().includes(p.search.toLowerCase()));
 return <><PageHeading label="Keamanan dan jejak audit" detail="Kontrol akses, aktivitas pengguna, dan rekam perubahan data" action={<div className="toolbar"><button className="btn" onClick={()=>p.setActiveTab(p.activeTab==='Semua'?'Kelola pengguna':'Semua')} data-testid="button-manage-users"><Settings size={13}/>Kelola pengguna</button><button className="btn primary" onClick={()=>{p.record('Ekspor log audit','Semua aktivitas');p.setNotice('Log audit disiapkan untuk ekspor lokal')}} data-testid="button-export-audit"><ArrowDownToLine size={13}/>Ekspor log</button></div>}/>
 <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><KPI icon={Users} label="Pengguna aktif" value="42" note="12% dari periode lalu" testId="kpi-audit-users"/><KPI icon={ShieldCheck} label="Peran aktif" value="4" note="Penyedia, PIC Balai, Direktorat, Admin" tone="blue" testId="kpi-audit-roles"/><KPI icon={Activity} label="Aktivitas hari ini" value={`${126+p.store.logs.length-4}`} note="18% dibanding kemarin" tone="green" testId="kpi-audit-activity"/><KPI icon={AlertTriangle} label="Percobaan ditolak" value="2" note="33% dari hari kemarin" tone="red" testId="kpi-audit-rejected"/></div>
 <div className="grid-two"><Section title="Matriks hak akses per peran" icon={ShieldCheck}><div className="table-wrap"><table data-testid="table-permissions"><thead><tr><th>Peran</th><th>Input data</th><th>Validasi</th><th>Laporan</th><th>Kelola akses</th></tr></thead><tbody>{[['Penyedia Jasa / Ketua Tim',1,0,1,0],['PIC Balai / Pengguna Jasa',0,1,1,0],['Direktorat / Pusat',0,1,1,0],['Admin',1,1,1,1]].map(r=><tr key={String(r[0])}><td><strong>{r[0]}</strong></td>{r.slice(1).map((v,i)=><td key={i} style={{textAlign:'center',color:v?'#16966e':'#d4514b'}}>{v?<CheckCircle2 size={15}/>:<X size={15}/>}</td>)}</tr>)}</tbody></table></div><div className="legend" style={{padding:10}}><span><CheckCircle2 size={12} color="#16966e"/>Diizinkan</span><span><X size={12} color="#d4514b"/>Tidak diizinkan</span></div></Section>
 <Section title="Tren aktivitas keamanan" icon={BarChart3} extra={<span className="subtle">Aktivitas normal Â· ditolak</span>}><Chart mode="bars"/></Section></div>
 <Section title="Matriks transisi status survei" icon={ShieldCheck}>
  <div className="table-wrap"><table data-testid="table-status-transitions"><thead><tr><th>Transisi</th>{WORKFLOW_ROLE_OPTIONS.map(role=><th key={role}>{role}</th>)}</tr></thead><tbody>{SURVEY_TRANSITION_MATRIX.map(({from,to})=><tr key={`${from}-${to}`} data-testid={`row-transition-${from.toLowerCase().replaceAll(' ','-')}-${to.toLowerCase().replaceAll(' ','-')}`}><td><strong>{from} → {to}</strong></td>{WORKFLOW_ROLE_OPTIONS.map(role=><td key={role} style={{textAlign:'center',color:canSetSurveyStatus(role,from,to)?'#16966e':'#d4514b'}}>{canSetSurveyStatus(role,from,to)?<CheckCircle2 size={15}/>:<X size={15}/>}</td>)}</tr>)}</tbody></table></div>
  <div className="legend" style={{padding:10}}><span><CheckCircle2 size={12} color="#16966e"/>Diizinkan</span><span><X size={12} color="#d4514b"/>Tidak diizinkan</span><span className="subtle">Percobaan transisi yang ditolak dicatat pada log audit.</span></div>
 </Section>
 <div className="grid-two"><Section title="Log aktivitas pengguna" icon={ClipboardList} extra={<FilterToolbar search={p.search} setSearch={p.setSearch}/>}>
 <div className="table-wrap"><table data-testid="table-audit-log"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aktivitas</th><th>Objek</th><th>Hasil</th></tr></thead><tbody>{logs.map(l=><tr key={l.id} data-testid={`row-audit-${l.id}`}><td>{l.waktu}</td><td>{l.pengguna}</td><td>{l.aktivitas}</td><td>{l.objek}</td><td><Status value={l.hasil}/></td></tr>)}</tbody></table>{logs.length===0&&<div className="empty"><Search size={20}/>Tidak ada aktivitas yang cocok.</div>}</div>
 </Section><Section title="Detail perubahan data" icon={Eye}><div className="panel-body">{p.store.logs.slice(0,1).map(l=><div key={l.id}><div className="quality-check"><span>Waktu</span><strong>{l.waktu}</strong></div><div className="quality-check"><span>Pengguna</span><strong>{l.pengguna}</strong></div><div className="quality-check"><span>Aktivitas</span><strong>{l.aktivitas}</strong></div><div className="quality-check"><span>Objek</span><strong>{l.objek}</strong></div><div className="quality-check"><span>Hasil</span><Status value={l.hasil}/></div><div className="notice" style={{marginTop:12}}><ShieldCheck size={14}/>Perubahan UI disimpan secara lokal. Log simulasi hanya tersedia pada perangkat ini.</div></div>)}</div></Section></div>
 <Section title="Status sesi dan keamanan" icon={HardDrive}><div className="panel-body grid-even" style={{margin:0}}><div className="quality-check"><span>Mode autentikasi</span><Status value="Demo lokal"/></div><div className="quality-check"><span>Enkripsi koneksi</span><Status value="Tidak berlaku Â· tanpa API"/></div><div className="quality-check"><span>Ruang lingkup pengguna</span><Status value={p.workflow.role}/></div><div className="quality-check"><span>Penyimpanan perubahan</span><Status value="localStorage aktif"/></div></div></Section></>;
}
