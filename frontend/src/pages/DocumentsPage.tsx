import { ArrowRight, BookOpen, FileText, Plus, RotateCcw } from 'lucide-react';

import {
  FilterToolbar, PageHeading, Section, Status,
} from '../components/app/AppComponents';
import type { PageProps } from '../types';

export default function DocumentsPage(p:PageProps){
 const docs=p.store.docs.filter(d=>`${d.nama} ${d.kategori} ${d.status}`.toLowerCase().includes(p.search.toLowerCase())).filter(d=>p.activeTab==='Semua'||d.kategori===p.activeTab);
 const isBerita=p.activeTab==='Berita acara';
 return <>
  <PageHeading label={isBerita?'Berita Acara':'Dokumen Mutu'} detail={isBerita?'Susun dan periksa draft BA berdasarkan tahapan QA/QC.':'Dokumen dan bukti pendukung paket survei.'} action={!isBerita?<button className="btn primary" onClick={()=>p.openNew('doc')} data-testid="button-upload-document"><Plus size={13}/>Tambah dokumen</button>:undefined}/>
  {isBerita ? <Section title="Pilih Paket untuk Berita Acara" icon={FileText}>
     <div className="panel-body" style={{display:'grid',gap:10}}>
       <p style={{margin:'0 0 4px',fontSize:12,color:'#58697d'}}>Pilih BA pada paket yang benar untuk membuka draft atau hasilnya. Penyusunan baru sebaiknya dimulai dari tahap pemeriksaan terkait.</p>
       {Object.values(p.packages).map(item=><div key={item.project.id} style={{padding:14,border:'1px solid #dae5ed',borderRadius:9,display:'grid',gap:10}}>
         <div><strong>{item.project.packageName}</strong><div style={{fontSize:11,color:'#66778b',marginTop:3}}>{item.project.id} · {item.project.balai} · {item.project.surveyTypes.join(', ')}</div></div>
         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:7}}>
           {([['kalibrasi','BA Kalibrasi & Validasi','Tahap 1–2'],['konsistensi','BA Konsistensi','Tahap 3B'],['internal','BA V&V Internal','Tahap 3B'],['duaMingguan','BA V&V 2-Mingguan','Tahap 3B'],['bertahap','BA V&V Bertahap','Tahap 4'],['audit','Dokumen Hasil Audit','Tahap 5'],['penerimaan','BA Penerimaan Data','Tahap 6']] as const).map(([kind,name,stage])=><button key={kind} type="button" className="btn sm" style={{justifyContent:'space-between',minHeight:39}} onClick={()=>p.openPackageBA(item.project.id,kind)}><span><FileText size={13} style={{verticalAlign:'middle',marginRight:5}}/>{name} <small style={{opacity:.65,marginLeft:4}}>{stage}</small></span><ArrowRight size={12}/></button>)}
         </div>
       </div>)}
       {!Object.keys(p.packages).length&&<p>Belum ada paket yang tersedia.</p>}
     </div>
   </Section> : <>
   <Section title="Dokumen tercatat" icon={BookOpen} extra={<FilterToolbar search={p.search} setSearch={p.setSearch} actions={<button className="btn sm" onClick={()=>p.setSearch('')} data-testid="button-reset-document-search"><RotateCcw size={12}/></button>}/> }>
     <div className="tabs">{['Semua','Kalibrasi','Validasi','Verifikasi berkala','Berita acara'].map(t=><button className={`tab ${p.activeTab===t?'active':''}`} key={t} onClick={()=>p.setActiveTab(t)} data-testid={`tab-doc-${t.toLowerCase().replaceAll(' ','-')}`}>{t}</button>)}</div>
     <div className="table-wrap"><table data-testid="table-documents"><thead><tr><th>Nama dokumen</th><th>Kategori</th><th>Versi</th><th>Status</th></tr></thead><tbody>{docs.length ? docs.map(d=><tr key={d.id} data-testid={`row-document-${d.id}`}><td>{d.nama}</td><td>{d.kategori}</td><td>{d.versi}</td><td><Status value={d.status}/></td></tr>) : <tr><td colSpan={4}>Belum ada dokumen pada kategori ini.</td></tr>}</tbody></table></div>
   </Section>
  </>}
 </>;
}
