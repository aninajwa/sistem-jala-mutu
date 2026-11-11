import {useEffect,useMemo,useState} from 'react';
import {ClipboardCheck,Clock3,History,Search,ShieldCheck} from 'lucide-react';
import {KPI,PageHeading,Section,Status} from '../components/app/AppComponents';
import {directorateAuditRows,directorateAuditHistory,DIRECTORATE_TABS,type AuditBucket,type DirectorateAuditRow} from '../workflow/monitoringProjection';
import type {PageProps} from '../types';
import './verificationQueue.css';
import './adminMonitoringDetail.css';

/** One shared workflow model; only the Directorate's audit level 3 is actionable here. */
export default function DirectorateAuditPage(p:PageProps){
 const [query,setQuery]=useState('');
 const [balai,setBalai]=useState('');
 const [detail,setDetail]=useState<{row:DirectorateAuditRow;kind:'blocker'|'history'}|null>(null);
 useEffect(()=>{if(!detail)return;const onEscape=(e:KeyboardEvent)=>{if(e.key==='Escape')setDetail(null)};window.addEventListener('keydown',onEscape);return()=>window.removeEventListener('keydown',onEscape)},[detail]);
 const rows=useMemo(()=>directorateAuditRows(p.packages),[p.packages]);
 const balais=useMemo(()=>[...new Set(rows.map(r=>r.state.project.balai))].sort(),[rows]);
 const view=DIRECTORATE_TABS.find(t=>t.label===p.activeTab)?.bucket??'siap';
 const title=DIRECTORATE_TABS.find(t=>t.bucket===view)?.label??'Perlu Diaudit';
 const needle=query.trim().toLocaleLowerCase('id');
 const hasHistory=(r:DirectorateAuditRow)=>directorateAuditHistory(r.state).length>0;
 const visible=rows.filter(r=>view==='riwayat'?hasHistory(r):r.status===view);
 const filtered=visible.filter(r=>(!balai||r.state.project.balai===balai)&&(!needle||[r.state.project.id,r.state.project.packageName,r.state.project.balai,r.reason].join(' ').toLocaleLowerCase('id').includes(needle)));
 const kpiLabels=['Siap Diaudit','Sedang Diaudit','Tertahan / Tindak Lanjut','Hasil & Riwayat'];
 const kpiNotes=['prasyarat terpenuhi','pemeriksaan berlangsung','ada hambatan atau perbaikan','paket dengan rekaman audit'];
 const buckets:AuditBucket[]=['siap','berjalan','tertahan','riwayat'];
 const icons=[ClipboardCheck,Clock3,ShieldCheck,History];
 const activeHistory=detail?.kind==='history'?directorateAuditHistory(detail.row.state):[];
 return <>
  <PageHeading label="Audit & Assurance" detail="Pemeriksaan audit tingkat 3. Audit tingkat 1 dan 2 adalah prasyarat, bukan keputusan Direktorat."/>
  <div className="kpi-grid balai-review-kpis">{buckets.map((bucket,i)=><KPI key={bucket} icon={icons[i]} label={kpiLabels[i]} value={String(rows.filter(r=>bucket==='riwayat'?hasHistory(r):r.status===bucket).length)} note={kpiNotes[i]} testId={`kpi-direktorat-${i}`}/>)}</div>
  <Section title={title} icon={ClipboardCheck}><div className="panel-body">
   <div className="balai-review-filters">
    <label><span><Search size={13}/> Cari paket</span><input aria-label="Cari paket audit Direktorat" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nama atau ID paket…"/></label>
    <label><span>Balai</span><select aria-label="Filter Balai Direktorat" value={balai} onChange={e=>setBalai(e.target.value)}><option value="">Semua Balai</option>{balais.map(v=><option key={v}>{v}</option>)}</select></label>
   </div>
   <p className="subtle" role="status">{filtered.length} dari {visible.length} paket pada kategori {title.toLowerCase()} · {rows.length} paket dalam cakupan audit</p>
   {view==='riwayat'?<div className="balai-history-scroll"><table className="balai-history-table directorate-history-table"><thead><tr><th>Paket</th><th>Kondisi terkini</th><th>Rekaman</th><th>Aksi</th></tr></thead><tbody>
    {filtered.map(row=>{const audit=row.state.audits[2];const entries=directorateAuditHistory(row.state);return <tr key={row.state.project.id}><td><strong>{row.state.project.packageName}</strong><small>{row.state.project.id} · {row.state.project.balai}</small></td><td><Status value={audit.requiresReview?'Perlu Pemeriksaan Ulang':audit.status}/></td><td>{entries.length} rekaman status{entries.some(h=>h.source==='snapshot')?' termasuk arsip':''}</td><td><button type="button" className="btn" onClick={()=>setDetail({row,kind:'history'})}>Lihat Riwayat</button></td></tr>})}
   </tbody></table></div>:<div className="balai-review-list">{filtered.map(row=>{const {state,ready,reason,status}=row;const central=state.audits[2],balaiAudit=state.audits[1];const action=status==='siap'?'Buka Pemeriksaan':status==='berjalan'?'Lanjutkan Audit':'Lihat Hambatan';return <article key={state.project.id} className="balai-review-item"><div className="balai-review-item-head"><div><strong>{state.project.packageName}</strong><div className="subtle">{state.project.id} · {state.project.balai}</div></div><Status value={status==='siap'?'Siap Diaudit':status==='berjalan'?'Dalam Review':'Tertahan / Tindak Lanjut'}/></div>
    <p>Audit Balai: <strong>{balaiAudit.status}</strong> · Audit Direktorat: <strong>{central.status}</strong></p>
    <p className="subtle">{reason}</p>
    {status==='tertahan'&&<p className="subtle">Buka detail untuk melihat hambatan sebelum pemeriksaan dilanjutkan.</p>}
    <button type="button" className={`btn ${status==='siap'&&ready?'primary':''}`} onClick={()=>status==='tertahan'?setDetail({row,kind:'blocker'}):p.openPackageReview(state.project.id,'/verification:Audit tingkat 1–3',{auditLevel:3})}>{status==='tertahan'?<ShieldCheck size={14}/>:<ClipboardCheck size={14}/>} {action}</button>
   </article>})}</div>}
   {!filtered.length&&<p className="balai-review-empty">{visible.length?'Tidak ada paket yang sesuai filter. Coba kosongkan pencarian atau pilih Semua Balai.':view==='siap'?'Belum ada paket yang memenuhi prasyarat audit tingkat 3. Periksa Tertahan & Tindak Lanjut.':view==='berjalan'?'Belum ada audit tingkat 3 yang sedang berlangsung.':view==='tertahan'?'Tidak ada paket yang sedang tertahan.':'Belum ada rekaman status audit tingkat 3 yang tersimpan.'}</p>}
   <p className="subtle">Hasil audit mengikuti pemeriksaan dan data terbaru. Rekaman historis yang tersedia ditampilkan tanpa mengubah keputusan sebelumnya.</p>
  </div></Section>
  {detail&&<div className="admin-detail-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDetail(null)}}><section className="admin-detail-dialog" role="dialog" aria-modal="true" aria-label={detail.kind==='history'?'Detail Riwayat Audit':'Detail Hambatan Audit'}>
   <div className="admin-detail-heading"><div><h2>{detail.kind==='history'?'Detail Riwayat Audit':'Detail Hambatan Audit'}</h2><p className="subtle">{detail.row.state.project.packageName} · Audit tingkat 3</p></div><button type="button" className="btn" aria-label="Tutup detail audit" onClick={()=>setDetail(null)}>✕</button></div>
   <div className="admin-detail-meta"><span className="subtle">{detail.row.state.project.id} · {detail.row.state.project.balai}</span></div>
   {detail.kind==='blocker'?<><div className="admin-detail-field"><h3>Status audit tersimpan</h3><p>{detail.row.state.audits[2].status}</p>{detail.row.state.audits[2].requiresReview&&<p><Status value="Perlu Pemeriksaan Ulang"/> — kondisi terkini, bukan keputusan audit baru.</p>}</div><div className="admin-detail-field"><h3>Kondisi / Alasan</h3><p>{detail.row.reason}</p></div><div className="admin-detail-field"><h3>Prasyarat audit</h3><p>Audit tingkat 1: {detail.row.state.audits[0].status}{detail.row.state.audits[0].requiresReview?' (perlu pemeriksaan ulang)':''}</p><p>Audit tingkat 2: {detail.row.state.audits[1].status}{detail.row.state.audits[1].requiresReview?' (perlu pemeriksaan ulang)':''}</p><p>Penyerahan: {detail.row.state.submission.validationStatus}</p></div><div className="admin-detail-field"><h3>Tindak Lanjut</h3><p>{detail.row.ready?'Periksa temuan atau status audit tingkat 3 yang masih perlu tindak lanjut.':'Selesaikan prasyarat yang belum sesuai melalui pihak berwenang sebelum melanjutkan audit tingkat 3.'}</p></div><button type="button" className="btn" onClick={()=>{const id=detail.row.state.project.id;setDetail(null);p.openPackageReview(id,'/verification:Audit tingkat 1–3',{auditLevel:3})}}>Buka Paket (lihat konteks)</button></>:<><div className="admin-detail-field"><h3>Status audit yang tersimpan</h3><p>{detail.row.state.audits[2].status}</p><h3>Kondisi terkini</h3><p>{detail.row.state.audits[2].requiresReview?<Status value="Perlu Pemeriksaan Ulang"/>:<Status value={detail.row.state.audits[2].status}/>}</p></div><div className="admin-detail-field"><h3>Rekaman status dan hasil audit</h3>{activeHistory.map((entry,i)=><div className="directorate-history-entry" key={`${entry.source}-${i}`}><strong>{entry.source==='current'?'Status terkini':`Snapshot tersimpan ${i}`}</strong><p>Status: {entry.status}{entry.requiresReview?' · memerlukan pemeriksaan ulang':''}</p>{entry.reason&&<p>Alasan: {entry.reason}</p>}{entry.note&&<p>Catatan pemeriksa: {entry.note}</p>}{entry.baNumber&&<p>Referensi BA tercatat: {entry.baNumber} (bukan bukti pengesahan)</p>}</div>)}</div><p className="subtle">Status dalam review bukan keputusan akhir. Tanggal, pemeriksa, atau versi data tidak ditampilkan jika tidak tersedia dalam rekaman. Snapshot tidak dianggap sebagai BA yang disahkan.</p></>}
   <button type="button" className="btn" onClick={()=>setDetail(null)}>Tutup</button>
  </section></div>}
 </>;
}
