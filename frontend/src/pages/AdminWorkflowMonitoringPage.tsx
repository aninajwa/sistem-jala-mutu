import {useEffect,useMemo,useState} from 'react';
import {ClipboardCheck,Clock3,History,Search,ShieldCheck} from 'lucide-react';
import {KPI,PageHeading,Section,Status} from '../components/app/AppComponents';
import {adminAuditRows,adminReviewRows} from '../workflow/monitoringProjection';
import type {PageProps} from '../types';
import './verificationQueue.css';
import './adminMonitoringDetail.css';

/** Administrative monitoring is a read-only projection of real review and audit records. */
export default function AdminWorkflowMonitoringPage(p:PageProps){
 const [query,setQuery]=useState('');
 const [balai,setBalai]=useState('');
 const [status,setStatus]=useState('');
 const [stage,setStage]=useState('');
 const [detail,setDetail]=useState<{title:string;subtitle:string;status:string;reason:string;note:string;context:string}|null>(null);
 useEffect(()=>{if(!detail)return;const onEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setDetail(null)};window.addEventListener('keydown',onEscape);return()=>window.removeEventListener('keydown',onEscape)},[detail]);
 const auditOnly=p.activeTab==='Audit';
 const reviewRows=useMemo(()=>adminReviewRows(p.packages),[p.packages]);
 const auditRows=useMemo(()=>adminAuditRows(p.packages),[p.packages]);
 const balais=useMemo(()=>[...new Set(Object.values(p.packages).map(v=>v.project.balai))].sort(),[p.packages]);
 const reviewStages=[...new Set(reviewRows.map(r=>r.stage))];
 const auditStages=['1','2','3'];
 const options=auditOnly?['Belum Dimulai','Dalam Review','Klarifikasi','Lulus','Ditolak']:['Perlu Review','Menunggu','Perlu Perbaikan','Selesai/Lulus'];
 const needle=query.trim().toLocaleLowerCase('id');
 const reviewFiltered=reviewRows.filter(r=>(!balai||r.balai===balai)&&(!status||r.status===status)&&(!stage||r.stage===stage)&&(!needle||[r.packageName,r.packageId,r.balai,r.kind,r.reason,r.note].join(' ').toLocaleLowerCase('id').includes(needle)));
 const auditFiltered=auditRows.filter(r=>(!balai||r.state.project.balai===balai)&&(!status||r.audit.status===status)&&(!stage||String(r.level)===stage)&&(!needle||[r.state.project.packageName,r.state.project.id,r.state.project.balai,r.audit.decisionNote,r.audit.reviewReason].join(' ').toLocaleLowerCase('id').includes(needle)));
 const reviewCounts=[reviewRows.filter(r=>r.status==='Perlu Review').length,reviewRows.filter(r=>r.status==='Menunggu').length,reviewRows.filter(r=>r.status==='Perlu Perbaikan').length,reviewRows.filter(r=>r.status==='Selesai/Lulus').length];
 const auditCounts=[auditRows.filter(r=>r.audit.status==='Belum Dimulai').length,auditRows.filter(r=>r.audit.status==='Dalam Review').length,auditRows.filter(r=>r.audit.status==='Klarifikasi'||r.audit.status==='Ditolak'||r.audit.requiresReview).length,auditRows.filter(r=>r.audit.status==='Lulus'&&!r.audit.requiresReview).length];
 const counts=auditOnly?auditCounts:reviewCounts;
 const labels=auditOnly?['Belum Dimulai','Dalam Review','Perlu Tindak Lanjut','Lulus']:['Perlu Ditinjau','Menunggu Prasyarat','Perlu Perbaikan','Hasil Tercatat'];
 const notes=auditOnly?['rekaman audit','audit berlangsung','klarifikasi / penolakan / ulang','hasil audit terkini']:['pengajuan membutuhkan review','belum siap diperiksa','perbaikan atau klarifikasi','hasil review terkini'];
 const icons=[ClipboardCheck,Clock3,ShieldCheck,History];
 return <>
  <PageHeading label="Monitoring Workflow" detail="Pantau status pemeriksaan dan audit QA/QC lintas paket. Keputusan mutu tetap dilakukan pihak pemeriksa berwenang."/>
  <div className="kpi-grid balai-review-kpis">{labels.map((label,i)=><KPI key={`${auditOnly}:${label}`} icon={icons[i]} label={label} value={String(counts[i])} note={notes[i]} testId={`kpi-admin-monitor-${i}`}/>)}</div>
  <Section title={auditOnly?'Status Audit Tingkat 1–3':'Status Review Operasional'} icon={ClipboardCheck}><div className="panel-body">
   <p className="subtle">{auditOnly?'Memantau audit internal Penyedia, audit Balai, dan audit Direktorat.':'Memantau review persiapan, produksi, V&V berkala, dan pemeriksaan bertahap; bukan daftar keputusan audit.'}</p>
   <div className="balai-review-filters">
    <label><span><Search size={13}/> Cari paket atau catatan</span><input aria-label="Cari monitoring Admin" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nama paket, Balai, atau catatan…"/></label>
    <label><span>Balai</span><select aria-label="Filter Balai monitoring Admin" value={balai} onChange={e=>setBalai(e.target.value)}><option value="">Semua Balai</option>{balais.map(v=><option key={v}>{v}</option>)}</select></label>
    <label><span>{auditOnly?'Tingkat audit':'Tahap pemeriksaan'}</span><select aria-label="Filter tahap monitoring Admin" value={(auditOnly?auditStages:reviewStages).includes(stage)?stage:''} onChange={e=>setStage(e.target.value)}><option value="">Semua {auditOnly?'tingkat':'tahap'}</option>{(auditOnly?auditStages:reviewStages).map(v=><option key={v} value={v}>{auditOnly?`Tingkat ${v}`:v}</option>)}</select></label>
    <label><span>Status</span><select aria-label="Filter status monitoring Admin" value={options.includes(status)?status:''} onChange={e=>setStatus(e.target.value)}><option value="">Semua status</option>{options.map(v=><option key={v}>{v}</option>)}</select></label>
   </div>
   <p role="status" className="subtle">{auditOnly?auditFiltered.length:reviewFiltered.length} rekaman ditampilkan · {auditOnly?auditRows.length:reviewRows.length} rekaman keseluruhan (bukan jumlah paket unik)</p>
   <div className="balai-history-scroll"><table className="balai-history-table admin-monitor-table"><thead><tr><th>Paket</th><th>Balai</th><th>{auditOnly?'Tingkat audit':'Tahap / review'}</th><th>Status</th><th>Detail</th></tr></thead><tbody>
    {auditOnly?auditFiltered.map(({state,level,audit})=><tr key={`${state.project.id}:${level}`}><td><strong>{state.project.packageName}</strong><small>{state.project.id}</small></td><td>{state.project.balai}</td><td>Tingkat {level}</td><td><Status value={audit.requiresReview?'Perlu Pemeriksaan Ulang':audit.status}/></td><td><button type="button" className="btn" onClick={()=>setDetail({title:'Detail Monitoring Audit',subtitle:`${state.project.packageName} · Audit tingkat ${level}`,status:audit.requiresReview?'Perlu Pemeriksaan Ulang':audit.status,reason:audit.reviewReason||'Tidak ada alasan atau temuan yang dicatat.',note:audit.decisionNote||'Belum ada catatan keputusan.',context:`${state.project.id} · ${state.project.balai}`})}>Lihat Detail</button></td></tr>):reviewFiltered.map(r=><tr key={r.id}><td><strong>{r.packageName}</strong><small>{r.packageId}</small></td><td>{r.balai}</td><td>{r.stage} · {r.kind}</td><td><Status value={r.status}/></td><td><button type="button" className="btn" onClick={()=>setDetail({title:'Detail Monitoring Review',subtitle:`${r.packageName} · ${r.stage} · ${r.kind}`,status:r.status,reason:r.reason||'Belum ada alasan tercatat.',note:r.note||'Belum ada catatan pemeriksaan.',context:`${r.packageId} · ${r.balai}`})}>Lihat Detail</button></td></tr>)}
   </tbody></table></div>
   {(auditOnly?auditFiltered:reviewFiltered).length===0&&<p className="balai-review-empty">Tidak ada rekaman yang sesuai dengan filter. Coba pilih semua status atau semua Balai.</p>}
   <p className="subtle">Data berasal dari rekaman workflow yang tersimpan, bukan bukti BA sudah disahkan. Monitoring tidak menyediakan aksi keputusan atau perubahan hasil mutu.</p>
  </div></Section>
  {detail&&<div className="admin-detail-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDetail(null)}}>
   <section className="admin-detail-dialog" role="dialog" aria-modal="true" aria-label={detail.title}>
    <div className="admin-detail-heading"><div><h2>{detail.title}</h2><p className="subtle">{detail.subtitle}</p></div><button type="button" className="btn" aria-label="Tutup detail monitoring" onClick={()=>setDetail(null)}>✕</button></div>
    <div className="admin-detail-meta"><Status value={detail.status}/><span className="subtle">{detail.context}</span></div>
    <div className="admin-detail-field"><h3>Kondisi / Alasan</h3><p>{detail.reason}</p></div>
    <div className="admin-detail-field"><h3>Catatan Pemeriksaan</h3><p>{detail.note}</p></div>
    <p className="subtle">Informasi ditampilkan dari rekaman saat ini. Keputusan dan perbaikan dilakukan oleh pihak berwenang pada modul terkait.</p>
    <button type="button" className="btn" onClick={()=>setDetail(null)}>Tutup</button>
   </section>
  </div>}
 </>;
}
