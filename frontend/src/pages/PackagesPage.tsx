import {useMemo,useState} from 'react';
import {ArrowRight,Building2,Search,FolderOpen,Archive} from 'lucide-react';
import type {OperationalWorkflowState,WorkflowRole} from '../workflow/model';
import {derivePackageStage,packageStatus,packageWaitingFor} from '../workflow/packageStore';
import {
  isLegacyExample,
} from '../workflow/access/packageAccess';
import {packageMenuLabel} from '../workflow/roleNavigation';

type Props={packages:Record<string,OperationalWorkflowState>;role:WorkflowRole;onOpen:(id:string)=>void};
export default function PackagesPage({packages,role,onOpen}:Props){
 const [search, setSearch] = useState("");
const [balai, setBalai] = useState("");
const [status, setStatus] = useState("");
const [showLegacy, setShowLegacy] = useState(
  () => import.meta.env.DEV
);
 const all=Object.values(packages),legacy=all.filter(isLegacyExample);
 const rows=useMemo(()=>all.filter(s=>(showLegacy||!isLegacyExample(s))&&(!balai||s.project.balai===balai)&&(!status||derivePackageStage(s)===status)&&`${s.project.packageName} ${s.project.id} ${s.project.contractor} ${s.project.routes.join(' ')}`.toLowerCase().includes(search.toLowerCase())),[all,balai,status,showLegacy,search]);
 return <div className="package-page operational-list">
  <div className="package-page-head"><div><div className="eyebrow">PENGELOLAAN PAKET QA/QC</div><h1>{packageMenuLabel(role)}</h1><p>{role==='Admin'?'Pantau identitas dan pengaturan paket. Keputusan teknis tetap menjadi kewenangan pelaksana pemeriksaan.':'Pilih paket penugasan untuk melanjutkan pekerjaan atau meninjau hasil pemeriksaan.'}</p></div><span className="package-count">{rows.length} paket terlihat</span></div>
  <div className="package-list-filters"><label className="package-search"><Search size={16}/><input aria-label="Cari paket" placeholder="Cari nama paket, nomor, ruas atau penyedia…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  {new Set(all.map(s=>s.project.balai)).size>1&&<select aria-label="Filter Balai paket" value={balai} onChange={e=>setBalai(e.target.value)}><option value="">Seluruh Balai dalam cakupan</option>{[...new Set(all.map(s=>s.project.balai))].map(value=><option key={value}>{value}</option>)}</select>}
  <select aria-label="Filter tahap paket" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Semua tahap</option>{[...new Set(all.map(derivePackageStage))].map(value=><option key={value}>{value}</option>)}</select></div>
  {!!legacy.length&&<details className="legacy-packages"><summary><Archive size={14}/> {legacy.length} paket contoh lama tersimpan</summary><p>Data lama tetap disimpan. Tampilkan jika diperlukan untuk pemeriksaan; tidak ada data yang dihapus.</p><label><input type="checkbox" checked={showLegacy} onChange={e=>setShowLegacy(e.target.checked)}/> Tampilkan paket contoh lama</label></details>}
  <div className="package-list">{rows.map(s=><article className="package-card" key={s.project.id} data-testid={`package-card-${s.project.id}`}><div className="package-card-main"><div className="package-id">{s.project.contractNumber||s.project.id}</div><h2>{s.project.packageName}</h2><div className="package-meta"><span><Building2 size={14}/>{s.project.balai}</span><span>{s.project.semester}</span></div><p>{s.project.contractor} · {s.project.routes.join(', ')}</p><div className="package-scope">{s.project.surveyTypes.map(type=><span key={type}>{type}</span>)}</div></div><div className="package-card-status"><div><small>Tahap</small><strong>{derivePackageStage(s)}</strong></div><div><small>Status</small><strong>{packageStatus(s)}</strong></div><div><small>Tanggung jawab berikutnya</small><strong>{packageWaitingFor(s)}</strong></div><button className="wf-button primary" onClick={()=>onOpen(s.project.id)}>Buka paket <ArrowRight size={15}/></button></div></article>)}</div>
  {!rows.length&&<div className="package-empty"><FolderOpen size={32}/><h2>Tidak ada paket yang sesuai</h2><p>Periksa kata pencarian, filter, atau penugasan akun.</p></div>}
 </div>;
}
