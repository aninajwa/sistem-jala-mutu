import '../workflow/ui09.css';
import {DocumentInsights09} from '../workflow/documents/DocumentInsights09';
import {SOURCE_FORM_CHANGED} from '../workflow/repository/workflowReconciliation';
import {BA_DOCUMENT_CHANGED} from '../workflow/ba/documentRepository';
import '../workflow/checkpoint09.css';
import { useEffect, useMemo, useState } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { documentRepository } from '../workflow/ba/documentRepository';
import { DOCUMENT_STATUS_LABELS } from '../workflow/ba/documentWorkflow';
import { PageHeading } from '../components/app/AppComponents';
import type { PageProps } from '../types';
import { SURVEY_TYPES, type WorkflowRole } from '../workflow/model';
import { DocumentPicker } from '../workflow/documents/DocumentPicker';
import { attachmentLocation, documentRoleFocus, listPackageDocuments } from '../workflow/documents/documentCatalog';
import { ATTACHMENT_CHANGED, attachmentRepository, downloadLocalFile } from '../workflow/repository/attachmentRepository';
import '../workflow/documents/documents.css';
import './documentsRole.css';

type Row = ReturnType<typeof listPackageDocuments>[number] & {packageName:string; balai:string};
type WorkView = 'tasks' | 'prepare' | 'history' | 'queue' | 'packages' | 'audit' | 'monitor' | 'archive';
const provider = 'Penyedia Jasa / Ketua Tim';
const balai = 'PIC Balai / Pengguna Jasa';
const directorate = 'Direktorat / Pusat';
const submitted = (r:Row) => r.localStatus === 'submitted-local';
const completed = (r:Row) => r.localStatus === 'reviewed-local';
const revision = (r:Row) => r.localStatus === 'revision-requested-local'||r.localStatus==='rejected-local';
const draft = (r:Row) => r.localStatus === 'local-draft'||revision(r);
const audit3 = (r:Row) => r.identity.kind === 'audit' && r.identity.auditLevel === 3;
const roleViews: Record<WorkflowRole, {id:WorkView;label:string;summary:string}[]> = {
  [provider]: [
    {id:'tasks',label:'Tugas Dokumen',summary:'Lanjutkan draft dan revisi dalam kewenangan Anda.'},
    {id:'prepare',label:'Siapkan BA',summary:'Pilih format dokumen sesuai penanggung jawab dan tahap sumber.'},
    {id:'history',label:'Riwayat Dokumen',summary:'Lihat dokumen yang sudah diajukan, diperiksa, dan versi sebelumnya.'},
  ],
  [balai]: [
    {id:'queue',label:'Antrian Pemeriksaan',summary:'Periksa hanya dokumen yang benar-benar masuk untuk Balai.'},
    {id:'packages',label:'Dokumen Paket',summary:'Pantau kelengkapan dokumen paket dalam kewenangan Balai.'},
    {id:'history',label:'Riwayat Pemeriksaan',summary:'Telusuri keputusan dan permintaan perbaikan dokumen.'},
  ],
  [directorate]: [
    {id:'audit',label:'Audit & Dokumen Pusat',summary:'Dokumen Audit Tingkat 3 dan tindak lanjut pemeriksaan pusat.'},
    {id:'monitor',label:'Monitoring Lintas Balai',summary:'Lihat dokumen lintas Balai sesuai cakupan akses.'},
    {id:'history',label:'Riwayat Audit',summary:'Telusuri arsip dan hasil pemeriksaan audit pusat.'},
  ],
  Admin: [
    {id:'monitor',label:'Monitoring Dokumen',summary:'Pantau status dan kelengkapan, tanpa mengubah keputusan teknis.'},
    {id:'archive',label:'Arsip & Lampiran',summary:'Telusuri rekaman, histori, dan lampiran paket.'},
  ],
};
function desiredView(role:WorkflowRole, tab:string):WorkView {
 const allowed=roleViews[role];
 const hit=allowed.find(x=>x.label===tab);
 if(hit)return hit.id;
 if(tab==='Format dokumen'||tab==='Berita acara')return role===provider?'prepare':allowed[0].id;
 return allowed[0].id;
}
function getVisible(rows:Row[],role:WorkflowRole,view:WorkView):Row[]{
 switch(view){
  case 'tasks':return rows.filter(r=>r.authors.includes(role)&&draft(r));
  case 'queue':return rows.filter(r=>r.reviewer===balai&&submitted(r));
  case 'audit':return rows.filter(audit3);
  case 'history':return rows.filter(r=>{const versions=documentRepository.read(r.identity).versions;const decision=versions.some(v=>['revision-requested-local','rejected-local','reviewed-local'].includes(v.status));return role===directorate?audit3(r)&&decision:role===balai?r.reviewer===balai&&decision:r.authors.includes(role)&&versions.length>0;});
  default:return rows;
 }
}
function labelFor(row:Row,role:WorkflowRole){
 if(role==='Admin')return 'Lihat dokumen';
 if(role===provider){if(row.authors.includes(role)&&draft(row))return revision(row)?'Perbaiki revisi':'Lanjutkan draft';return 'Lihat status';}
 if(role===balai&&row.reviewer===role&&submitted(row))return 'Periksa dokumen';
 if(role===directorate&&audit3(row)&&row.reviewer===role&&submitted(row))return 'Periksa audit';
 return 'Lihat dokumen';
}
function statusText(row:Row){return row.stale?'Data sumber berubah · '+row.status:row.status;}
export default function DocumentsPage(p:PageProps){
 const role=p.workflow.role;
 const view=desiredView(role,p.activeTab);
 const [query,setQuery]=useState('');
 const [packageId,setPackageId]=useState('');
 const [survey,setSurvey]=useState('');
 const [status,setStatus]=useState('');
  const [showAll,setShowAll]=useState(false);
 const [,refresh]=useState(0);
 const [notice,setNotice]=useState('');
 useEffect(()=>{const update=()=>refresh(x=>x+1);window.addEventListener(SOURCE_FORM_CHANGED,update);window.addEventListener(BA_DOCUMENT_CHANGED,update);window.addEventListener('storage',update);window.addEventListener(ATTACHMENT_CHANGED,update);return()=>{window.removeEventListener(SOURCE_FORM_CHANGED,update);window.removeEventListener(BA_DOCUMENT_CHANGED,update);window.removeEventListener('storage',update);window.removeEventListener(ATTACHMENT_CHANGED,update);};},[]);
 const all:Row[]=Object.values(p.packages).flatMap(state=>listPackageDocuments(state).map(row=>({...row,packageName:state.project.packageName,balai:state.project.balai??'Belum ditentukan'})));
 const viewRows=getVisible(all,role,view);
 const filteredAll=all.filter(r=>(!packageId||r.identity.packageId===packageId)&&(!survey||r.identity.survey===survey)&&(!status||r.status===status)&&(`${r.title} ${r.packageName} ${r.balai} ${r.identity.survey} ${r.identity.packageId}`.toLowerCase().includes(query.toLowerCase())));
 const rows=getVisible(filteredAll,role,view);
  const pageRows=view==='tasks'&&!showAll?rows.slice(0,5):rows;
  const counts=useMemo(()=>role===provider?[{label:'Draft / perlu revisi',value:filteredAll.filter(r=>r.authors.includes(role)&&draft(r)).length},{label:'Menunggu pemeriksaan',value:filteredAll.filter(r=>r.authors.includes(role)&&submitted(r)).length},{label:'Pemeriksaan selesai',value:filteredAll.filter(r=>r.authors.includes(role)&&completed(r)).length}]:role===balai?[{label:'Masuk untuk diperiksa',value:filteredAll.filter(r=>r.reviewer===balai&&submitted(r)).length},{label:'Masih disiapkan Penyedia',value:filteredAll.filter(r=>r.authors.includes(provider)&&draft(r)).length},{label:'Pemeriksaan selesai',value:filteredAll.filter(r=>r.reviewer===balai&&completed(r)).length}]:role===directorate?[{label:'Audit 3 tercatat',value:filteredAll.filter(audit3).length},{label:'Menunggu pusat',value:filteredAll.filter(r=>audit3(r)&&submitted(r)).length},{label:'Balai tercakup',value:new Set(filteredAll.map(r=>r.balai)).size}]:[{label:'Dokumen tercatat',value:filteredAll.length},{label:'Sumber berubah',value:filteredAll.filter(r=>r.stale).length},{label:'Selesai diperiksa',value:filteredAll.filter(completed).length}],[filteredAll,role]);
 const open=(row:Row)=>p.openPackageBA(row.identity.packageId,row.identity.kind,{...row.identity,returnTo:`/documents:${p.activeTab}`});
 const files=Object.entries(attachmentRepository.metadata()).filter(([key,meta])=>Object.keys(p.packages).some(id=>key.startsWith(id+':'))&&(!packageId||key.startsWith(packageId+':'))&&`${key} ${meta.name}`.toLowerCase().includes(query.toLowerCase()));
 const active=roleViews[role].find(item=>item.id===view)??roleViews[role][0];
 const isCatalog=view==='prepare';
 const isArchive=view==='archive';
 const groupedRows = (view === 'packages' || view === 'monitor')
   ? Object.values(rows.reduce<Record<string, { key:string; title:string; rows:Row[]; packageIds:Set<string> }>>((groups, row) => {
       const byBalai = view === 'monitor' && role === directorate;
       const key = byBalai ? row.balai : row.identity.packageId;
       if (!groups[key]) groups[key] = { key, title:byBalai?row.balai:row.packageName, rows:[], packageIds:new Set<string>() };
       groups[key].rows.push(row);
       groups[key].packageIds.add(row.identity.packageId);
       return groups;
     }, {})).sort((a,b)=>a.title.localeCompare(b.title,'id'))
   : [];
 const legacyDocs=p.store.docs.filter(d => [d.nama,d.kategori,d.versi,d.status].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 return <main className="documents-page dr-page">
  <PageHeading label={active.label} detail={active.summary}/>
  <p className="ui09-meta">{role}</p>
  {!isCatalog&&<details className="ui09-insights"><summary>Grafik status & cakupan dokumen</summary><DocumentInsights09 rows={filteredAll}/></details>}

  {!isCatalog&&<div className="dr-metrics">{counts.map(c=><div className="dr-metric" key={c.label}><span>{c.label}</span><strong>{c.value}</strong></div>)}</div>}
  {!isCatalog&&role!=='Admin'&&<details className="dr-panel"><summary>Siapkan BA dalam kewenangan Anda</summary><DocumentPicker packages={p.packages} openPackageBA={p.openPackageBA} role={role}/></details>}
  {isCatalog?<section className="dr-panel"><h3>Siapkan dokumen dari format resmi</h3><p>Dokumen disusun berdasarkan tahap sumber. Data tersedia ditarik dari paket; isian lain dilengkapi oleh pemilik yang berwenang. Format di luar kewenangan hanya untuk peninjauan.</p><DocumentPicker packages={p.packages} openPackageBA={p.openPackageBA} role={role}/></section>:<>

   {view==='audit'&&<p className="dr-guidance">Keputusan Audit Tingkat 3 dilakukan oleh Direktorat pada Tahap 5. Pemeriksaan BA lokal tidak menggantikan keputusan teknis maupun pengesahan resmi.</p>}
   <section className="dr-panel"><div className="dr-panel-head"><h3>{view==='tasks'?'Dokumen yang perlu Anda kerjakan':view==='queue'?'Dokumen masuk untuk pemeriksaan':view==='audit'?'Dokumen Audit Tingkat 3':view==='history'?'Dokumen dan keputusan terdahulu':view==='archive'?'Rekaman dokumen':'Dokumen dalam cakupan'}</h3><span>{rows.length} dokumen</span></div>
    {<div className="dr-filters"><div className="dr-filter-heading">Cari dan filter dokumen</div><div className="dr-filter-grid"><label>Cari<input aria-label="Cari dokumen" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nama dokumen atau paket"/></label><details className="ui09-doc-filters"><summary>Filter paket, survei & status{[packageId,survey,status].filter(Boolean).length?` (${[packageId,survey,status].filter(Boolean).length} aktif)`:''}</summary><div className="ui09-doc-filter-fields"><label>Paket<select aria-label="Filter paket dokumen" value={packageId} onChange={e=>setPackageId(e.target.value)}><option value="">Semua paket</option>{Object.values(p.packages).map(state=><option key={state.project.id} value={state.project.id}>{state.project.packageName}</option>)}</select></label><label>Survei<select aria-label="Filter survei dokumen" value={survey} onChange={e=>setSurvey(e.target.value)}><option value="">Semua survei</option>{SURVEY_TYPES.map(t=><option key={t}>{t}</option>)}</select></label><label>Status<select aria-label="Filter status dokumen" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Semua status</option>{[...new Set(all.map(r=>r.status))].map(s=><option key={s}>{s}</option>)}</select></label></div></details></div><button className="btn sm" type="button" onClick={()=>{setQuery('');setPackageId('');setSurvey('');setStatus('');}}>Reset filter</button></div>}
    {rows.length>0?(groupedRows.length>0?<div className="dr-records">{groupedRows.map(group=><details className="dr-panel" key={group.key} open><summary style={{cursor:'pointer',fontWeight:700,padding:'4px 0 10px'}}>{group.title} · {group.rows.length} dokumen{role===directorate&&view==='monitor'?` · ${group.packageIds.size} paket`:''}</summary><p className="wf-note">{group.rows.filter(submitted).length} menunggu pemeriksaan · {group.rows.filter(revision).length} perlu tindak lanjut · {group.rows.filter(completed).length} selesai diperiksa. Jumlah ini berdasarkan dokumen yang sudah tercatat, bukan seluruh BA yang diwajibkan.</p>{group.rows.map(r=><article className="dr-record" key={r.id}><div className="dr-record-main"><strong>{r.title}</strong><span>{r.packageName} · {r.stage.label} · {r.identity.survey}{r.identity.period?` · Periode ${r.identity.period}`:''}{r.identity.kind==='audit'?` · Audit ${r.identity.auditLevel}`:''}</span><span>{statusText(r)}{r.missing?` · ${r.missing} isian belum lengkap`:''}</span></div><button className="btn sm" type="button" onClick={()=>open(r)}>Lihat dokumen</button></article>)}</details>)}</div>:<div className="dr-records">{pageRows.map(r=><article className="dr-record" key={r.id}><div className="dr-record-main"><strong>{r.title}</strong><span>{r.packageName} · {r.stage.label} · {r.identity.survey}{r.identity.period?` · Periode ${r.identity.period}`:''}{r.identity.kind==='audit'?` · Audit ${r.identity.auditLevel}`:''}</span><span>{statusText(r)}{r.missing?` · ${r.missing} isian belum lengkap`:''}</span>{revision(r)&&<span>Periksa catatan pemeriksa dan lengkapi revisi sebelum mengajukan kembali.</span>}{view==='history'&&(()=>{const versions=documentRepository.read(r.identity).versions;const latest=versions.at(-1);return <span>Riwayat: {versions.length} versi · Keputusan terakhir: {DOCUMENT_STATUS_LABELS[latest?.status??'local-draft']??'Belum dipetakan'}{latest?.reviewNote?` · Catatan: ${latest.reviewNote}`:''}</span>;})()}</div><button className="btn sm primary" type="button" onClick={()=>open(r)}>{labelFor(r,role)}</button></article>)}</div>):<div className="dr-empty"><FolderOpen/><strong>Tidak ada dokumen pada bagian ini</strong><p>{view==='tasks'?'Tidak ada draft atau revisi yang perlu dilanjutkan.':view==='history'?'Belum ada dokumen dengan riwayat pemeriksaan sesuai cakupan.':view==='audit'?'Belum ada dokumen Audit Tingkat 3 tercatat. Lihat pekerjaan audit dari Tahap 5 paket.':'Belum ada rekaman yang sesuai. Dokumen yang belum dibuat tidak dihitung sebagai draft.'}</p></div>}
     {view==='tasks'&&rows.length>5&&<button type="button" className="btn primary dr-show-all" onClick={()=>setShowAll(v=>!v)}>{showAll?'Tampilkan 5 terbaru':`Lihat semua ${rows.length} dokumen`}</button>}
    </section>
    {view==='tasks'&&<div className="dr-next"><FileText/><div><strong>Perlu menyiapkan BA lain?</strong><p>Pilih format sesuai kewenangan dan jenis survei paket. Tidak semua format wajib dibuat sekaligus.</p></div><button type="button" className="btn primary" onClick={()=>p.setActiveTab('Siapkan BA')}>Siapkan BA</button></div>}
   {isArchive&&<section className="dr-panel"><h3>Berkas sumber dan lampiran paket</h3>{files.length?files.map(([key,file])=>{const loc=attachmentLocation(key,p.packages);return <div className="dr-record" key={key}><div className="dr-record-main"><strong>{file.name}</strong><span>{loc?.packageName??'Paket'} · {loc?.label??'Lampiran'} · {Math.ceil(file.size/1024)} KB</span></div><button className="btn sm" onClick={async()=>{const record=await attachmentRepository.get(key).catch(()=>null);if(record)downloadLocalFile(record);else setNotice('Berkas belum tersedia di perangkat ini; pemulihan membutuhkan sumber atau server dokumen.');}}>Unduh</button></div>;}):<p>Tidak ada berkas yang sesuai pencarian.</p>}{notice&&<p role="status">{notice}</p>}</section>}
   {(isArchive||view==='history')&&p.store.docs.length>0&&<section className="dr-panel"><div className="dr-panel-head"><h3>Catatan dokumen lama</h3><span>{legacyDocs.length} dari {p.store.docs.length} catatan</span></div><p>Catatan ini merupakan metadata lama, bukan BA yang telah disahkan. Belum tersedia tautan berkas yang dapat diverifikasi sehingga tombol unduh tidak ditampilkan. Rekaman asli tetap dipertahankan.</p>{legacyDocs.length?legacyDocs.map(d=><div className="dr-record" key={d.id}><div className="dr-record-main"><strong>{d.nama||'Dokumen tanpa nama'}</strong><span>Kategori: {d.kategori||'Belum tercatat'} · Versi: {d.versi||'Belum tercatat'} · Status lama: {d.status||'Belum tercatat'}</span><span>Berkas asli: belum terhubung ke repository lampiran</span></div></div>):<div className="dr-empty"><FolderOpen/><strong>Tidak ditemukan catatan lama</strong><p>Coba kata kunci lain atau reset pencarian.</p></div>}</section>}
  </>}
 </main>;
}
