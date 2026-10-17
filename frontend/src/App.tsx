import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  Activity, AlertCircle, AlertTriangle, ArrowDownToLine, ArrowRight, BarChart3, Bell,
  BookOpen, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, ClipboardCheck,
  Clock3, Database, FileCheck2, FileText, Filter, Gauge, HardDrive, ListChecks, Menu,
  Pencil, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, Target, TrendingUp,
  Users, Wrench, X, MapPinned, CircleHelp, Layers3, Eye, RotateCcw, ClipboardList
} from 'lucide-react';
import { SubmoduleWorkspace } from './SubmoduleWorkspace';
import { BalaiOsmMap } from './BalaiOsmMap';
import { OperationalWorkflowWorkspace } from './workflow/OperationalWorkflowWorkspace';
import { PackageContextHeader, PackageOverview, PackagesPage } from './workflow/PackageHub';
import { PACKAGE_STORE_KEY, derivePackageStage, loadWorkflowPackageStore, packageStatus, packageWaitingFor, type WorkflowPackageStore } from './workflow/packageStore';
import { buildRoleNavigation } from './workflow/roleNavigation';
import { RoleSidebar } from './workflow/RoleSidebar';
import { WorkflowDocuments } from './workflow/WorkflowDocuments';
import {
  ROLE_DEMO_USERS, ROLE_HOME_LABELS, ROLE_HOME_PRIORITIES, ROLE_HOME_QUICK_LINKS,
  WORKFLOW_ROLE_OPTIONS, WORKFLOW_ROLE_SCOPE, canAccessRoute, canRole,
} from './workflow/workflowConfig';
import {
  evaluateProductionTest,
  type OperationalWorkflowState,
  type SurveyType,
  type WorkflowRole,
} from './workflow/model';

type Survey = { id:string; balai:string; ruas:string; jenis:string; tanggal:string; alat:string; status:string; hasil:string; km:number };
type Finding = { id:string; ruas:string; jenis:string; prioritas:string; status:string; pic:string; due:string };
type Doc = { id:string; nama:string; kategori:string; versi:string; status:string };
type Log = { id:string; waktu:string; pengguna:string; aktivitas:string; objek:string; hasil:string };
type Store = { surveys:Survey[]; findings:Finding[]; docs:Doc[]; logs:Log[] };

const balais = ['Balai Sumatera Utara','Balai Jawa Barat','Balai Kalimantan Timur','Balai Sulawesi Selatan','Balai Nusa Tenggara'];
const surveiTypes = ['IRI','PCI','Lendutan','Jembatan','Lereng','Drainase','Lalu Lintas','RNI'];
const initial:Store = {
 surveys:[
  {id:'SRV-0271',balai:balais[0],ruas:'Medan â€“ Binjai',jenis:'IRI',tanggal:'2027-06-14',alat:'Profilometer Laser',status:'Lulus',hasil:'IRI 2,14 m/km',km:42.8},
  {id:'SRV-0270',balai:balais[1],ruas:'Bandung â€“ Cileunyi',jenis:'PCI',tanggal:'2027-06-13',alat:'Kamera Survei',status:'Verifikasi',hasil:'PCI 78,2',km:31.4},
  {id:'SRV-0269',balai:balais[2],ruas:'Samarinda â€“ Tenggarong',jenis:'Drainase',tanggal:'2027-06-12',alat:'Video Log',status:'Perlu Perbaikan',hasil:'4 anomali',km:26.1},
  {id:'SRV-0268',balai:balais[3],ruas:'Makassar â€“ Maros',jenis:'Lendutan',tanggal:'2027-06-11',alat:'FWD Dynatest',status:'Lulus',hasil:'0,42 mm',km:38.6},
  {id:'SRV-0267',balai:balais[0],ruas:'Pematang Siantar â€“ Parapat',jenis:'IRI',tanggal:'2027-06-10',alat:'Profilometer Laser',status:'Draft',hasil:'Menunggu hasil',km:54.2},
  {id:'SRV-0266',balai:balais[4],ruas:'Mataram â€“ Praya',jenis:'Jembatan',tanggal:'2027-06-09',alat:'Total Station',status:'Lulus',hasil:'Baik',km:19.7},
  {id:'SRV-0265',balai:balais[1],ruas:'Cirebon â€“ Kuningan',jenis:'PCI',tanggal:'2027-06-08',alat:'Kamera Survei',status:'Perlu Perbaikan',hasil:'PCI 51,6',km:29.3}
 ],
 findings:[
  {id:'TP-027-013',ruas:'Samarinda â€“ Tenggarong',jenis:'Kelengkapan dokumen',prioritas:'Tinggi',status:'Diusulkan',pic:'Rizal Hidayat',due:'2027-06-20'},
  {id:'TP-027-012',ruas:'Cirebon â€“ Kuningan',jenis:'Nilai di luar rentang',prioritas:'Kritis',status:'Dilaksanakan',pic:'Siti Rahma',due:'2027-06-18'},
  {id:'TP-027-011',ruas:'Pematang Siantar â€“ Parapat',jenis:'Kalibrasi alat',prioritas:'Sedang',status:'Verifikasi Ulang',pic:'Budi Santoso',due:'2027-06-21'},
  {id:'TP-027-010',ruas:'Bandung â€“ Cileunyi',jenis:'Konsistensi data',prioritas:'Rendah',status:'Selesai',pic:'Nina Anggraini',due:'2027-06-11'},
  {id:'TP-027-009',ruas:'Makassar â€“ Maros',jenis:'Metode pengukuran',prioritas:'Sedang',status:'Disetujui',pic:'Agus Kurniawan',due:'2027-06-19'}
 ],
 docs:[
  {id:'DOC-104',nama:'Sertifikat Kalibrasi Profilometer.pdf',kategori:'Kalibrasi',versi:'v2.1',status:'Lengkap'},
  {id:'DOC-103',nama:'Hasil Validasi Lapangan.xlsx',kategori:'Validasi',versi:'v1.4',status:'Lengkap'},
  {id:'DOC-102',nama:'Verifikasi Berkala Juni.pdf',kategori:'Verifikasi berkala',versi:'v1.3',status:'Perlu Dilengkapi'},
   {id:'DOC-101',nama:'Berita Acara Survei.jpg',kategori:'Berita acara',versi:'v1.0',status:'Lengkap'},
   {id:'DOC-100',nama:'Foto Pendukung Survei Medan â€“ Binjai.zip',kategori:'Bukti pendukung',versi:'v1.0',status:'Lengkap'}
 ],
 logs:[
  {id:'LOG-0281',waktu:'14 Jun 2027 14:32',pengguna:'D. Prasetyo',aktivitas:'Validasi data survei',objek:'SRV-0271 Â· Medan â€“ Binjai',hasil:'Berhasil'},
  {id:'LOG-0280',waktu:'14 Jun 2027 13:47',pengguna:'N. Anggraini',aktivitas:'Ubah status temuan',objek:'TP-027-010',hasil:'Berhasil'},
  {id:'LOG-0279',waktu:'14 Jun 2027 11:20',pengguna:'B. Santoso',aktivitas:'Unggah dokumen mutu',objek:'Sertifikat Kalibrasi',hasil:'Berhasil'},
  {id:'LOG-0278',waktu:'13 Jun 2027 16:08',pengguna:'R. Hidayat',aktivitas:'Ajukan verifikasi',objek:'SRV-0270 Â· Bandung â€“ Cileunyi',hasil:'Berhasil'}
 ]
};
const titleFor:Record<string,string> = {'/':'Dashboard QA/QC Survei Kondisi Jalan','/data-master':'Data Master & Referensi','/packages':'Paket Kontrak','/entry':'Workspace Paket','/verification':'Verifikasi & Validasi Berjenjang','/actions':'Temuan & Tindakan Perbaikan','/compliance':'Analisis & Kepatuhan','/reports':'Dashboard & Pelaporan','/documents':'Manajemen Dokumen Mutu','/notifications':'Notifikasi & Pengingat','/audit':'Keamanan & Jejak Audit'};
const submoduleBehaviors:Record<string,Record<string,{target:string;tab?:string;action?:'export'}>>={
 '/':{'Dashboard utama':{target:'dashboard-main'},'Kepatuhan per survei':{target:'dashboard-compliance'},'Tren mutu data':{target:'dashboard-trend'}},
 '/data-master':{'Balai & wilayah':{target:'master-data',tab:'Balai & wilayah'},'Referensi survei':{target:'master-data',tab:'Jenis survei'},'Alat & personel':{target:'master-data',tab:'Alat & personel'}},
 '/entry':{'Data kegiatan':{target:'entry-data'},'Hasil awal':{target:'entry-results'},'Riwayat pengajuan':{target:'entry-history'}},
 '/verification':{'Self-audit':{target:'verification-self-audit'},'Sampling berjenjang':{target:'verification-sampling'},'Hasil verifikasi':{target:'verification-results'}},
 '/actions':{'Kasus & temuan':{target:'actions-cases'},'Prioritas':{target:'actions-cases',tab:'Prioritas'},'Verifikasi ulang':{target:'actions-cases',tab:'Verifikasi Ulang'}},
 '/compliance':{'Perhitungan mutu':{target:'compliance-calculation'},'Tren kepatuhan':{target:'compliance-trend'},'Peringkat balai':{target:'compliance-ranking'}},
 '/reports':{'Ringkasan kinerja':{target:'reports-summary'},'Laporan periodik':{target:'reports-export'},'Ekspor data':{target:'reports-export',action:'export'}},
 '/documents':{'Kalibrasi':{target:'documents-list',tab:'Kalibrasi'},'Validasi':{target:'documents-list',tab:'Validasi'},'Bukti pendukung':{target:'documents-list',tab:'Bukti pendukung'}},
 '/notifications':{'Pengingat jatuh tempo':{target:'notifications-list',tab:'Jatuh tempo'},'Peringatan mutu':{target:'notifications-list',tab:'Mutu'},'Eskalasi':{target:'notifications-escalation',tab:'Semua'}},
 '/audit':{'Pengguna & peran':{target:'audit-users',tab:'Semua'},'Hak akses':{target:'audit-permissions',tab:'Semua'},'Jejak aktivitas':{target:'audit-activity',tab:'Semua'}}
};
const sectionTargets:Record<string,Record<string,string>>={
 '/':{'Kepatuhan per jenis survei':'dashboard-compliance'},
 '/data-master':{'Kelola data master':'master-data'},
 '/entry':{'Form entri data uji':'entry-data','Hasil uji awal':'entry-results','Daftar pengajuan survei':'entry-history'},
 '/verification':{'Aspek mutu yang diperiksa':'verification-self-audit','Status hasil verifikasi':'verification-results','Daftar sampel untuk diverifikasi':'verification-sampling'},
 '/actions':{'Daftar tindakan perbaikan':'actions-cases'},
 '/compliance':{'Kepatuhan per jenis survei':'compliance-calculation','Tren kepatuhan QA/QC':'compliance-trend','Peringkat balai':'compliance-ranking'},
 '/reports':{'Paket laporan tersedia':'reports-export'},
 '/documents':{'File manager dokumen':'documents-list'},
 '/notifications':{'Kotak notifikasi':'notifications-list','Alur eskalasi notifikasi':'notifications-escalation'},
 '/audit':{'Matriks hak akses per peran':'audit-permissions','Log aktivitas pengguna':'audit-activity'}
};
const headingTargets:Record<string,Record<string,string>>={
 '/':{'Ringkasan operasional':'dashboard-main'},
 '/reports':{'Dashboard kinerja & pelaporan':'reports-summary'}
};
const workflowSubmodules = new Set([
  '/packages:Ringkasan Paket',
  '/documents:BA & dokumen workflow',
  '/entry:Persiapan & SPMK',
  '/documents:Kalibrasi & personel',
  '/entry:Validasi produksi',
  '/entry:Survei harian',
  '/verification:Verval 14 hari',
  '/entry:Gerbang RNI/LRS',
  '/verification:Audit tingkat 1â€“3',
  '/reports:Penerimaan & termin',
  '/actions:Koreksi berbukti',
  '/notifications:Pengingat & eskalasi',
  '/audit:Peran & backup',
  '/reports:Matriks cakupan diagram',
]);

function readStore():Store {
 try {
  const saved=localStorage.getItem('road-qaqc-local-v1');
  if(saved){
   const parsed=JSON.parse(saved) as Partial<Store>;
   const docs=parsed.docs||initial.docs;
   const proofDoc=initial.docs.find(d=>d.kategori==='Bukti pendukung');
   return {...initial,...parsed,docs:proofDoc&&!docs.some(d=>d.id===proofDoc.id)?[...docs,proofDoc]:docs};
  }
 } catch { /* demo data fallback */ }
 return initial;
}
function isInPeriod(date:string,period:string){
 const year=date.slice(0,4),month=Number(date.slice(5,7));
 if(period==='Tahun 2027')return year==='2027';
 if(period==='Semester I 2027')return year==='2027'&&month>=1&&month<=6;
 if(period==='Triwulan II 2027')return year==='2027'&&month>=4&&month<=6;
 if(period==='Juni 2027')return year==='2027'&&month===6;
 if(period==='Mei 2027')return year==='2027'&&month===5;
 return true;
}
function downloadCsv(filename:string,rows:string[][]){
  const csv='\uFEFF'+rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const DEMO_SESSION_KEY='jala-mutu-demo-session-v1';
function RoleEntryScreen({currentRole,onEnter}:{currentRole:WorkflowRole;onEnter:(role:WorkflowRole)=>void}){
 const roleIcon=(role:WorkflowRole)=>role==='Penyedia Jasa / Ketua Tim'?FileText:role==='PIC Balai / Pengguna Jasa'?ClipboardCheck:role==='Direktorat / Pusat'?BarChart3:Settings;
 return <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#edf6fb 0%,#f7fafc 48%,#eef7f4 100%)',display:'grid',placeItems:'center',padding:24}}>
  <div style={{width:'min(1040px,100%)'}}>
   <div style={{textAlign:'center',marginBottom:22}}>
    <img src={`${import.meta.env.BASE_URL}jala-mutu-mark.png`} alt="Simbol JALA MUTU" style={{width:54,height:54,objectFit:'contain'}}/>
    <div style={{fontSize:26,fontWeight:800,letterSpacing:.2,color:'#17344b',marginTop:8}}>JALA <span style={{color:'#1689c9'}}>MUTU</span></div>
    <div style={{fontSize:12,color:'#60778b',marginTop:5}}>Pratinjau peran frontend Â· autentikasi nyata akan mengikuti backend</div>
   </div>
   <div style={{background:'#fff',border:'1px solid #dce7ee',borderRadius:12,padding:18,boxShadow:'0 18px 55px rgba(40,78,105,.10)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
     <div><strong style={{fontSize:15,color:'#233f54'}}>Masuk sesuai peran</strong><div style={{fontSize:10,color:'#6d8293',marginTop:3}}>Pilih actor untuk melihat menu dan aksi yang relevan. Pemilihan ini mengatur pengalaman UI sementara; kontrol akses backend akan diintegrasikan kemudian.</div></div>
     
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>
     {WORKFLOW_ROLE_OPTIONS.map(role=>{const Icon=roleIcon(role);const user=ROLE_DEMO_USERS.find(([,r])=>r===role)?.[0]||'Pengguna';return <button key={role} type="button" onClick={()=>onEnter(role)} data-testid={`button-enter-role-${role.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`} style={{textAlign:'left',background:role===currentRole?'#f2f8fc':'#fff',border:role===currentRole?'1px solid #4ca3d4':'1px solid #dce6ed',borderRadius:9,padding:14,cursor:'pointer',minHeight:150}}>
      <div style={{width:34,height:34,borderRadius:8,display:'grid',placeItems:'center',background:'#e9f4fa',color:'#167db7',marginBottom:11}}><Icon size={18}/></div>
      <div style={{fontWeight:800,fontSize:11,color:'#244257'}}>{role}</div>
      <div style={{fontSize:9,color:'#748797',marginTop:3}}>Akun pratinjau: {user}</div>
      <div style={{fontSize:9.5,lineHeight:1.55,color:'#566d7f',marginTop:9}}>{WORKFLOW_ROLE_SCOPE[role]}</div>
      <div style={{display:'flex',alignItems:'center',gap:5,color:'#167db7',fontSize:9,fontWeight:700,marginTop:11}}>Masuk ke workspace <ArrowRight size={11}/></div>
     </button>})}
    </div>
   </div>
  </div>
 </div>;
}
function App(){
 const [store,setStore]=useState<Store>(readStore);
 const [packageStore,setPackageStore]=useState<WorkflowPackageStore>(loadWorkflowPackageStore);
 const activePackageId=packageStore.activePackageId;
 const fallbackPackageId=Object.keys(packageStore.packages)[0]||'PAKET-DEMO-001';
 const workflow=packageStore.packages[activePackageId||fallbackPackageId];
 const [balai,setBalai]=useState('Semua Balai');
 const [periode,setPeriode]=useState('Semester I 2027');
 const [jenis,setJenis]=useState('Semua');
 const [mobileOpen,setMobileOpen]=useState(false);
 const [modal,setModal]=useState<'survey'|'finding'|'doc'|'master'|null>(null);
 const [editing,setEditing]=useState<string|null>(null);
 const [search,setSearch]=useState('');
 const [activeTab,setActiveTab]=useState('Semua');
  const [selectedSubmodule,setSelectedSubmodule]=useState(()=>new URLSearchParams(window.location.search).get('submodule')||'');
 const [notice,setNotice]=useState('');
 const [location,setLocation]=useLocation();
 const [demoSession,setDemoSession]=useState(()=>localStorage.getItem(DEMO_SESSION_KEY)==='active');
 const isPackageWorkspace =
  !!activePackageId &&
  (
    selectedSubmodule === '/packages:Ringkasan Paket' ||
    workflowSubmodules.has(selectedSubmodule)
  );

const visibleNav = useMemo(
  () =>
    buildRoleNavigation(
      packageStore.activeRole,
      isPackageWorkspace,
      workflow
        ? derivePackageStage(workflow)
        : 'Tahap 0',
    ),
  [
    packageStore.activeRole,
    isPackageWorkspace,
    workflow,
  ],
);
 useEffect(()=>{localStorage.setItem('road-qaqc-local-v1',JSON.stringify(store));},[store]);
  useEffect(()=>{localStorage.setItem(PACKAGE_STORE_KEY,JSON.stringify(packageStore));},[packageStore]);
   useEffect(()=>{setMobileOpen(false);setSearch('');setActiveTab('Semua');const selected=new URLSearchParams(window.location.search).get('submodule')||'';setSelectedSubmodule(selected.startsWith(`${location}:`)?selected:'');},[location]);
  const scoped=useMemo(()=>store.surveys.filter(s=>(balai==='Semua Balai'||s.balai===balai)&&(jenis==='Semua'||s.jenis===jenis)&&isInPeriod(s.tanggal,periode)),[store.surveys,balai,jenis,periode]);
 const record=(activity:string,object:string)=>setStore(prev=>({...prev,logs:[{id:`LOG-${Date.now()}`,waktu:new Date().toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),pengguna:'Anda Â· '+packageStore.activeRole,aktivitas:activity,objek:object,hasil:'Berhasil'},...prev.logs]}));
  const updateWorkflow=(update:(current:OperationalWorkflowState)=>OperationalWorkflowState,_activity:string,_object:string)=>setPackageStore(current=>{
    const id=current.activePackageId;
    if(!id||!current.packages[id])return current;
    return {...current,packages:{...current.packages,[id]:update({...current.packages[id],role:current.activeRole})}};
  });
  const enterAsRole=(role:WorkflowRole)=>{setPackageStore(current=>({...current,activeRole:role,packages:Object.fromEntries(Object.entries(current.packages).map(([id,state])=>[id,{...state,role}]))}));localStorage.setItem(DEMO_SESSION_KEY,'active');setDemoSession(true);setSelectedSubmodule('');setLocation('/');setNotice(`Peran aktif: ${role}`);};
  const switchRole=()=>{localStorage.removeItem(DEMO_SESSION_KEY);setDemoSession(false);setSelectedSubmodule('');setMobileOpen(false);};
  const openPackage=(id:string)=>{setPackageStore(current=>({...current,activePackageId:id,packages:{...current.packages,[id]:{...current.packages[id],role:current.activeRole}}}));setSelectedSubmodule('/packages:Ringkasan Paket');setLocation('/packages?submodule=%2Fpackages%3ARingkasan%20Paket');setNotice('Workspace paket dibuka.');};
  const backToPackages=()=>{setPackageStore(current=>({...current,activePackageId:null}));setSelectedSubmodule('');setLocation('/packages');};
  useEffect(()=>{if(demoSession&&!canAccessRoute(packageStore.activeRole,location)){setSelectedSubmodule('');setLocation('/');}},[demoSession,packageStore.activeRole,location,setLocation]);

 const addOrEdit=(type:'survey'|'finding'|'doc'|'master',form:Record<string,string>)=>{
  const id=editing||`${type==='survey'?'SRV':type==='finding'?'TP-027':type==='doc'?'DOC':'REF'}-${Date.now().toString().slice(-5)}`;
  if(type==='survey'){
   const row:Survey={id,balai:form.balai||balais[0],ruas:form.ruas||'Ruas baru',jenis:form.jenis||'IRI',tanggal:form.tanggal||'2027-06-15',alat:form.alat||'Profilometer Laser',status:form.status||'Draft',hasil:form.hasil||'Menunggu hasil',km:Number(form.km)||0};
   setStore(p=>({...p,surveys:editing?p.surveys.map(x=>x.id===editing?row:x):[row,...p.surveys]}));record(editing?'Ubah data survei':'Tambah data survei',`${id} Â· ${row.ruas}`);
  } else if(type==='finding'){
   const row:Finding={id,ruas:form.ruas||'Ruas baru',jenis:form.jenis||'Kelengkapan dokumen',prioritas:form.prioritas||'Sedang',status:form.status||'Diusulkan',pic:form.pic||'Belum ditetapkan',due:form.due||'2027-06-30'};
   setStore(p=>({...p,findings:editing?p.findings.map(x=>x.id===editing?row:x):[row,...p.findings]}));record(editing?'Ubah temuan':'Tambah temuan',`${id} Â· ${row.ruas}`);
  } else if(type==='doc'){
   const row:Doc={id,nama:form.nama||'Dokumen baru',kategori:form.kategori||'Validasi',versi:form.versi||'v1.0',status:form.status||'Lengkap'};
   setStore(p=>({...p,docs:editing?p.docs.map(x=>x.id===editing?row:x):[row,...p.docs]}));record(editing?'Perbarui dokumen':'Tambah dokumen',row.nama);
  } else {
   setStore(p=>({...p,docs:[{id,nama:form.nama||'Referensi baru',kategori:form.kategori||'Jenis survei',versi:'v1.0',status:'Aktif'},...p.docs]}));record('Tambah referensi master',form.nama||'Referensi baru');
  }
  setModal(null);setEditing(null);setNotice(editing?'Perubahan tersimpan di perangkat ini':'Data berhasil ditambahkan dan tersimpan lokal');window.setTimeout(()=>setNotice(''),2600);
 };
 const updateStatus=(type:'survey'|'finding'|'doc',id:string,status:string)=>{
  setStore(p=>type==='survey'?({...p,surveys:p.surveys.map(x=>x.id===id?{...x,status}:x)}):type==='finding'?({...p,findings:p.findings.map(x=>x.id===id?{...x,status}:x)}):({...p,docs:p.docs.map(x=>x.id===id?{...x,status}:x)}));
  record(`Ubah status menjadi ${status}`,id);setNotice(`Status ${id} diperbarui`);window.setTimeout(()=>setNotice(''),2200);
 };
 const beginEdit=(type:'survey'|'finding'|'doc'|'master',id:string)=>{setEditing(id);setModal(type);};
 const openNew=(type:'survey'|'finding'|'doc'|'master')=>{setEditing(null);setModal(type);};
  const navigateSubmodule=(selection:string)=>{
    const url=new URL(window.location.href);url.searchParams.set('submodule',selection);
    setSelectedSubmodule(selection);
    setLocation(`${selection.split(':')[0]}${url.search}${url.hash}`);
    setMobileOpen(false);
  };
  const activateSubmodule=(path:string,label:string)=>{
   const behavior=submoduleBehaviors[path]?.[label];
    const selection=`${path}:${label}`;
    navigateSubmodule(selection);
   setActiveTab(behavior?.tab||'Semua');
   setMobileOpen(false);
  };
  const clearSubmodule=()=>{setSelectedSubmodule('');const url=new URL(window.location.href);url.searchParams.delete('submodule');window.history.replaceState(window.history.state,'',url);};
  const pageProps={store,workflow,packages:packageStore.packages,openPackage,balai,periode,jenis,scoped,search,setSearch,activeTab,setActiveTab,openNew,beginEdit,updateStatus,record,setNotice};
 if(!demoSession)return <RoleEntryScreen currentRole={packageStore.activeRole} onEnter={enterAsRole}/>;
 return <WouterRouter>
   <div className="app-shell" onClickCapture={e=>{if((e.target as HTMLElement).closest('[data-testid="button-export-report"]')){const rows:string[][]=[['Jenis rekaman','ID','Balai / PIC','Ruas / Nama','Jenis / Kategori','Status','Tanggal / Detail'],...store.surveys.map(s=>['Survei',s.id,s.balai,s.ruas,s.jenis,s.status,`${s.tanggal}; ${s.hasil}; ${s.km} km`]),...store.findings.map(f=>['Temuan',f.id,f.pic,f.ruas,f.jenis,f.status,`Prioritas ${f.prioritas}; jatuh tempo ${f.due}`]),...store.docs.map(d=>['Dokumen',d.id,'',d.nama,d.kategori,d.status,`Versi ${d.versi}`])];downloadCsv(`data-qaqc-${new Date().toISOString().slice(0,10)}.csv`,rows)}}}>
   <div className={`mobile-scrim ${mobileOpen?'show':''}`} onClick={()=>setMobileOpen(false)} />
   <aside className={`sidebar ${mobileOpen?'open':''}`}>
     <div className="brand">
      <img className="brand-mark-image" src={`${import.meta.env.BASE_URL}jala-mutu-mark.png`} alt="Simbol JALA MUTU"/>
      <div className="brand-copy">
       <div className="brand-name"><span>JALA</span><span className="brand-name-accent">MUTU</span></div>
       <div className="brand-tagline">Jaminan &amp; Pengendalian<br/>Mutu Survei Jalan</div>
      </div>
     </div>
    <RoleSidebar
        navigation={visibleNav}
        location={location}
        activeTab={activeTab}
        selectedSubmodule={selectedSubmodule}
        activePackageId={activePackageId}
        isPackageWorkspace={isPackageWorkspace}
        onClearSubmodule={clearSubmodule}
        onNavigateSubmodule={navigateSubmodule}
        onSetActiveTab={setActiveTab}
        onSetLocation={setLocation}
        onCloseMobile={()=>setMobileOpen(false)}
      />
    <div className="side-foot">QA/QC Survei Kondisi Jalan<br/><span style={{color:'#75bde7'}}>Versi operasional 1.0</span></div>
   </aside>
   <main className="main-area">
    <header className="topbar">
     <div className="top-left"><button className="mobile-toggle" onClick={()=>setMobileOpen(true)} aria-label="Buka navigasi" data-testid="button-open-navigation"><Menu size={18}/></button><div><div style={{display:'flex',alignItems:'center',gap:9,flexWrap:'wrap'}}><div className="page-title">{isPackageWorkspace?workflow.project.packageName:(titleFor[location]||'Monitoring QA/QC')}</div></div><div className="crumb">QA/QC Survei Kondisi Jalan <span style={{margin:'0 5px'}}>â€º</span> {isPackageWorkspace?'Workspace Paket':(visibleNav.find(n=>n.path===location)?.label||'Ringkasan')}</div></div></div>
     <div className="global-filters">
      <div className="filter-wrap"><label>Balai:</label><select value={balai} onChange={e=>setBalai(e.target.value)} data-testid="select-global-balai"><option>Semua Balai</option>{balais.map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="filter-wrap"><label>Periode:</label><select value={periode} onChange={e=>setPeriode(e.target.value)} data-testid="select-global-periode">{['Semester I 2027','Triwulan II 2027','Juni 2027','Mei 2027','Tahun 2027'].map(x=><option key={x}>{x}</option>)}</select></div>
      {location==='/'&&<div className="filter-wrap"><label>Jenis survei:</label><select value={jenis} onChange={e=>setJenis(e.target.value)} data-testid="select-survey-type"><option>Semua</option>{surveiTypes.map(x=><option key={x}>{x}</option>)}</select></div>}
      <div className="filter-wrap"><label>Peran aktif:</label><button className="btn sm" onClick={switchRole} data-testid="button-switch-role" title="Ganti peran"><Users size={12}/>{packageStore.activeRole}</button></div>
     </div>
    </header>
    <div className="content">
     {notice&&<div className="notice" role="status" data-testid="status-toast"><CheckCircle2 size={14}/>{notice}</div>}
     <div className="mobile-filters" style={{gap:7,marginBottom:11,flexWrap:'wrap'}} data-testid="mobile-global-filters">
      <div className="filter-wrap" style={{flex:1,minWidth:135}}><label>Balai</label><select value={balai} onChange={e=>setBalai(e.target.value)} data-testid="select-mobile-balai"><option>Semua Balai</option>{balais.map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="filter-wrap" style={{flex:1,minWidth:135}}><label>Periode</label><select value={periode} onChange={e=>setPeriode(e.target.value)} data-testid="select-mobile-periode">{['Semester I 2027','Triwulan II 2027','Juni 2027','Mei 2027','Tahun 2027'].map(x=><option key={x}>{x}</option>)}</select></div>
      {location==='/'&&<div className="filter-wrap" style={{flex:1,minWidth:135}}><label>Jenis survei</label><select value={jenis} onChange={e=>setJenis(e.target.value)} data-testid="select-mobile-survey-type"><option>Semua</option>{surveiTypes.map(x=><option key={x}>{x}</option>)}</select></div>}
     </div>
      {selectedSubmodule?(workflowSubmodules.has(selectedSubmodule)
        ?activePackageId?<><PackageContextHeader state={workflow} onBack={backToPackages} onNavigate={navigateSubmodule}/>{selectedSubmodule==='/packages:Ringkasan Paket'?<PackageOverview state={workflow} onNavigate={navigateSubmodule}/>:<OperationalWorkflowWorkspace selection={selectedSubmodule} state={workflow} onUpdate={updateWorkflow} setNotice={setNotice} onNavigate={navigateSubmodule}/>}</>:<PackagesPage packages={packageStore.packages} role={packageStore.activeRole} onOpen={openPackage}/>
        :<SubmoduleWorkspace selection={selectedSubmodule} {...pageProps} onBack={()=>{clearSubmodule();setActiveTab('Semua')}}/>):<Switch>
      <Route path="/"><Dashboard {...pageProps}/></Route>
      <Route path="/data-master"><MasterPage {...pageProps}/></Route>
      <Route path="/packages"><PackagesPage packages={packageStore.packages} role={packageStore.activeRole} onOpen={openPackage}/></Route>
      <Route path="/entry"><EntryPage {...pageProps}/></Route>
      <Route path="/verification"><VerificationPage {...pageProps}/></Route>
      <Route path="/actions"><ActionsPage {...pageProps}/></Route>
      <Route path="/compliance"><CompliancePage {...pageProps}/></Route>
      <Route path="/reports"><ReportsPage {...pageProps}/></Route>
      <Route path="/documents"><DocumentsPage {...pageProps}/></Route>
      <Route path="/notifications"><NotificationsPage {...pageProps}/></Route>
      <Route path="/audit"><AuditPage {...pageProps}/></Route>
      <Route><Dashboard {...pageProps}/></Route>
      </Switch>}
    </div>
   </main>
   {modal&&<DataDialog type={modal} editing={editing} store={store} onClose={()=>{setModal(null);setEditing(null)}} onSave={addOrEdit}/>}
  </div>
 </WouterRouter>;
}

type Props={store:Store;workflow:OperationalWorkflowState;packages:Record<string,OperationalWorkflowState>;openPackage:(id:string)=>void;balai:string;periode:string;jenis:string;scoped:Survey[];search:string;setSearch:(s:string)=>void;activeTab:string;setActiveTab:(s:string)=>void;openNew:(t:'survey'|'finding'|'doc'|'master')=>void;beginEdit:(t:'survey'|'finding'|'doc'|'master',id:string)=>void;updateStatus:(t:'survey'|'finding'|'doc',id:string,status:string)=>void;record:(a:string,o:string)=>void;setNotice:(s:string)=>void};
function KPI({icon:Icon,label,value,note,tone='blue',testId}:{icon:any;label:string;value:string;note:string;tone?:string;testId:string}){
 return <div className="kpi" data-testid={testId}><div className={`kpi-icon ${tone}`}><Icon size={19}/></div><div><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div><div className="kpi-note">{note}</div></div></div>;
}
function Section({title,icon:Icon,children,extra,id}:{title:string;icon:any;children:any;extra?:any;id?:string}){
  const [location]=useLocation();
  const sectionId=id||sectionTargets[location]?.[title];
  const userRoles=location==='/audit'&&title==='Matriks hak akses per peran'?<div id="audit-users" className="panel-body" style={{borderBottom:'1px solid #edf1f5'}}><strong style={{fontSize:10}}>Pengguna dan peran</strong><div className="table-wrap"><table data-testid="table-audit-users"><thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th></tr></thead><tbody>{ROLE_DEMO_USERS.map(([name,role])=><tr key={name}><td>{name}</td><td>{role}</td><td><Status value="Aktif"/></td></tr>)}</tbody></table></div></div>:null;
  return <section id={sectionId} className="panel"><div className="panel-head"><h3><Icon size={14}/>{title}</h3>{extra}</div>{userRoles}{children}</section>;
}
function PageHeading({label,detail,action,id}:{label:string;detail:string;action?:any;id?:string}){const [location]=useLocation();return <div id={id||headingTargets[location]?.[label]} className="module-row"><div><div className="module-title"><Layers3 size={15}/>{label}</div><div className="subtle" style={{marginTop:4}}>{detail}</div></div>{action}</div>}
function Status({value}:{value:string}){let c='s-neutral';if(/Lulus|Selesai|Lengkap|Berhasil|Aktif|Disetujui|Memenuhi/i.test(value))c='s-good';else if(/Verifikasi|Menunggu|Review|Diusulkan|Sedang|Perlu Dilengkapi/i.test(value))c='s-warn';else if(/Perbaikan|Kritis|Tinggi|Tolak|Lewat/i.test(value))c='s-bad';else if(/Draft|Dilaksanakan/i.test(value))c='s-info';return <span className={`status ${c}`}>{value}</span>}
function Chart({mode='trend'}:{mode?:'trend'|'bars'}){
 const bars=mode==='bars';
 return <div className="chart" data-testid={`chart-${mode}`}><div className="chart-y"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="chart-grid">{bars?<div style={{display:'flex',alignItems:'end',justifyContent:'space-around',height:'100%',padding:'3px 4% 0'}}>{[68,81,73,92,77,86,62].map((n,i)=><div key={i} style={{height:`${n}%`,width:'7%',background:i%2?'#2cae92':'#2388c8',borderRadius:'3px 3px 0 0',position:'relative'}}><span style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',fontSize:8,color:'#576d81'}}>{n}%</span></div>)}</div>:<svg viewBox="0 0 600 140" preserveAspectRatio="none"><polyline points="0,105 100,92 200,82 300,64 400,53 500,39 600,29" fill="none" stroke="#1686c6" strokeWidth="3"/><polyline points="0,120 100,108 200,95 300,85 400,72 500,66 600,51" fill="none" stroke="#16a17a" strokeWidth="2.5"/>{[ [0,105],[100,92],[200,82],[300,64],[400,53],[500,39],[600,29]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill="#1686c6"/>)}</svg>}</div><div className="chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span></div></div>
}
function Dashboard(p:Props){
 const [q,setQ]=useState('');
 const surveys=p.scoped.filter(s=>!q||`${s.ruas} ${s.id} ${s.jenis}`.toLowerCase().includes(q.toLowerCase()));
 const role=p.workflow.role;
 const loggedKm=p.workflow.dailyRecords.filter(record=>record.state==='Tercatat').reduce((total,record)=>total+record.lengthKm,0);
 const kmTotal=p.scoped.reduce((total,s)=>total+s.km,0)+loggedKm;
 const passedSurveys=p.scoped.filter(s=>s.status==='Lulus').length;
 const passRate=p.scoped.length?Math.round(passedSurveys/p.scoped.length*100):0;
 const pendingSurveys=p.scoped.filter(s=>s.status==='Verifikasi'||s.status==='Perlu Perbaikan');
 const openCorrections=p.workflow.corrections.filter(c=>c.status!=='Ditutup').length;
 const opened=p.store.findings.filter(f=>f.status!=='Selesai');
 const productionRates=surveiTypes.map(type=>{
   const surveyType=type as SurveyType;
   const result=evaluateProductionTest(surveyType,p.workflow.productionTests[surveyType]);
   return {type,rate:result.checks.length?Math.round(result.checks.filter(check=>check.pass).length/result.checks.length*100):0};
 });
 const quickLinks=ROLE_HOME_QUICK_LINKS[role].filter(item=>canAccessRoute(role,item.href));
 const roleAction=role==='Penyedia Jasa / Ketua Tim'
   ?<button className="btn primary" onClick={()=>p.openNew('survey')} data-testid="button-add-survey"><Plus size={13}/>Entri survei</button>
   :role==='PIC Balai / Pengguna Jasa'
     ?<Link className="btn primary" href="/verification" data-testid="link-dashboard-review"><ClipboardCheck size={13}/>Buka antrean review</Link>
     :role==='Direktorat / Pusat'
       ?<Link className="btn primary" href="/verification" data-testid="link-dashboard-audit"><ShieldCheck size={13}/>Buka audit pusat</Link>
       :<Link className="btn primary" href="/data-master" data-testid="link-dashboard-admin"><Settings size={13}/>Kelola konfigurasi</Link>;
 const roleKpis:Array<[any,string,string,string,string]>=role==='Penyedia Jasa / Ketua Tim'
   ?[
     [Target,'Progres paket',`${kmTotal.toFixed(1)} km`,'kegiatan pada scope aktif','blue'],
     [FileText,'Pengajuan aktif',`${p.scoped.length}`,'survei pada filter aktif','blue'],
     [AlertTriangle,'Perlu tindak lanjut',`${opened.length+openCorrections}`,'temuan/kasus belum ditutup','amber'],
     [CheckCircle2,'Lulus validasi',`${passRate}%`,'hasil yang sudah lolos','green'],
   ]
   :role==='PIC Balai / Pengguna Jasa'
     ?[
       [ClipboardCheck,'Menunggu review',`${pendingSurveys.length}`,'hasil perlu keputusan Balai','amber'],
       [CheckCircle2,'Lulus validasi',`${passRate}%`,'hasil pada scope Balai','green'],
       [AlertTriangle,'Temuan terbuka',`${opened.length+openCorrections}`,'perlu catatan/tindak lanjut','amber'],
       [CalendarDays,'Siklus berkala','14 hari','periode verval selama masa survei','blue'],
     ]
     :role==='Direktorat / Pusat'
       ?[
         [Building2,'Balai pada mock',`${new Set(p.scoped.map(s=>s.balai)).size}`,'scope agregasi sementara','blue'],
         [ClipboardCheck,'Perlu audit/review',`${pendingSurveys.length}`,'hasil belum final','amber'],
         [CheckCircle2,'Kelulusan',`${passRate}%`,'agregat filter aktif','green'],
         [AlertTriangle,'Temuan terbuka',`${opened.length+openCorrections}`,'lintas paket pada scope aktif','amber'],
       ]
       :[
         [Database,'Data master','Data lokal','API master belum terhubung','blue'],
         [Users,'Peran aktif','4','RBAC final menunggu backend','blue'],
         [HardDrive,'Persistence','localStorage','sementara di browser','amber'],
         [ShieldCheck,'Audit trail',`${p.store.logs.length}`,'log lokal tersedia','green'],
       ];
 return <><PageHeading id="dashboard-main" label={ROLE_HOME_LABELS[role]} detail={`${role} Â· ${p.balai} Â· ${p.periode}`} action={<div className="toolbar">{roleAction}<button className="btn" onClick={()=>{p.record('Ekspor laporan ringkasan','Dashboard QA/QC');p.setNotice('Laporan ringkasan disiapkan untuk ekspor lokal')}} data-testid="button-export-dashboard"><ArrowDownToLine size={13}/>Ekspor laporan</button></div>}/>
 <div className="notice" style={{marginBottom:12}} data-testid="role-workspace-context"><ShieldCheck size={14}/><div><strong>{role}</strong><div className="subtle" style={{marginTop:2}}>{WORKFLOW_ROLE_SCOPE[role]} Â· State workflow sementara disimpan lokal; autentikasi dan API nyata akan mengikuti backend.</div></div></div>
 <div className="kpi-grid">{roleKpis.map(([Icon,label,value,note,tone])=><KPI key={String(label)} icon={Icon} label={String(label)} value={String(value)} note={String(note)} tone={String(tone)} testId={`kpi-role-${String(label).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}/>)}</div>
 <div className="grid-two">
   <Section title="Fokus kerja sesuai peran" icon={ListChecks}><div className="panel-body" style={{display:'grid',gap:8}}>{ROLE_HOME_PRIORITIES[role].map((item,index)=><div className="quality-check" key={item}><span style={{display:'flex',gap:8,alignItems:'flex-start'}}><span className="stage-num" style={{width:20,height:20,minWidth:20}}>{index+1}</span>{item}</span></div>)}</div></Section>
   <Section title="Akses cepat" icon={ArrowRight}><div className="panel-body" style={{display:'grid',gap:8}}>{quickLinks.map(item=><Link key={item.href} href={item.href} className="quality-check" style={{textDecoration:'none',color:'inherit',alignItems:'center'}} data-testid={`link-role-home-${item.href.replace(/[^a-z0-9]+/g,'-')}`}><span><strong>{item.label}</strong><div className="subtle" style={{marginTop:2}}>{item.detail}</div></span><ArrowRight size={14}/></Link>)}</div></Section>
 </div>
 {role==='Penyedia Jasa / Ketua Tim'&&<>
   <div className="grid-even"><Section title="Status kesiapan paket" icon={ClipboardCheck}><div className="panel-body">{[
     ['Survei pendahuluan',p.workflow.project.preparation.reportApproval==='Disetujui'?'Disetujui':'Menunggu'],
     ['Kalibrasi alat & personil',p.workflow.calibrations.every(c=>c.condition==='Baik'&&c.qualificationValid)?'Memenuhi':'Perlu review'],
     ['Bukti/dokumen persiapan',Object.values(p.workflow.project.preparation.documents).filter(Boolean).length?'Ada dokumen':'Perlu Dilengkapi'],
     ['Tindakan perbaikan',openCorrections===0?'Selesai':'Perlu Perbaikan'],
   ].map(([label,status])=><div className="quality-check" key={label}><span>{label}</span><Status value={status}/></div>)}</div></Section>
   <Section title="Pengajuan terbaru paket" icon={FileCheck2} extra={<Link href="/entry" className="btn sm">Buka workflow <ArrowRight size={12}/></Link>}><SurveyTable surveys={surveys.slice(0,4)} onEdit={p.beginEdit} onStatus={p.updateStatus} canEdit/></Section></div>
 </>}
 {role==='PIC Balai / Pengguna Jasa'&&<>
   <div className="grid-even"><Section title="Antrean assurance Balai" icon={ClipboardCheck}><div className="panel-body">{[
     ['Menunggu keputusan Balai',pendingSurveys.length?'Perlu review':'Selesai'],
     ['Catatan/tindakan terbuka',opened.length+openCorrections?'Perlu Perbaikan':'Selesai'],
     ['Verval berkala','Monitoring 14 hari'],
     ['Keputusan terdokumentasi','Perlu review'],
   ].map(([label,status])=><div className="quality-check" key={label}><span>{label}</span><Status value={String(status)}/></div>)}</div></Section>
   <Section title="Sampel menunggu review" icon={FileCheck2} extra={<Link href="/verification" className="btn sm">Buka verifikasi <ArrowRight size={12}/></Link>}><SurveyTable surveys={(pendingSurveys.length?pendingSurveys:surveys).slice(0,4)} onEdit={p.beginEdit} onStatus={p.updateStatus} canEdit={false}/></Section></div>
 </>}
 {role==='Direktorat / Pusat'&&<>
   <div className="grid-two"><Section title="Monitoring lintas Balai" icon={MapPinned}><div className="panel-body"><BalaiOsmMap surveys={p.scoped}/><div className="subtle" style={{marginTop:7}}>Scope saat ini masih memakai data simulasi. Backend nantinya menentukan Balai/paket yang boleh terlihat.</div></div></Section>
   <Section id="dashboard-compliance" title="Kepatuhan per jenis survei" icon={BarChart3} extra={<span className="subtle">System-check mock</span>}><div className="panel-body bar-list">{productionRates.map((item,i)=><div className="bar-row" key={item.type}><span>{item.type}</span><div className="bar-track"><div className={`bar-fill ${i%2?'teal':''}`} style={{width:`${item.rate}%`}}/></div><span className="bar-percent">{item.rate}%</span></div>)}</div></Section></div>
   <div className="grid-even"><Section title="Status audit/review pusat" icon={ShieldCheck}><div className="panel-body">{[['Hasil menunggu review',pendingSurveys.length?'Perlu review':'Selesai'],['Temuan terbuka',opened.length+openCorrections?'Perlu Perbaikan':'Selesai'],['Agregasi laporan','Aktif']].map(([label,status])=><div className="quality-check" key={label}><span>{label}</span><Status value={String(status)}/></div>)}</div></Section><Section id="dashboard-trend" title="Tren mutu agregat" icon={TrendingUp}><Chart/></Section></div>
 </>}
 {role==='Admin'&&<>
   <div className="grid-even"><Section title="Kesiapan administrasi sistem" icon={Settings}><div className="panel-body">{[['Data master','Data lokal'],['Autentikasi','Menunggu backend'],['Hak akses','Frontend sementara'],['Persistence','localStorage aktif']].map(([label,status])=><div className="quality-check" key={label}><span>{label}</span><Status value={status}/></div>)}</div></Section>
   <Section title="Aktivitas frontend terbaru" icon={ClipboardList}><div className="panel-body">{p.store.logs.slice(0,5).map(log=><div className="quality-check" key={log.id}><span><strong>{log.aktivitas}</strong><div className="subtle">{log.objek}</div></span><Status value={log.hasil}/></div>)}</div></Section></div>
 </>}
 <div className="subtle" style={{textAlign:'right',marginTop:10}}>Data ilustratif Â· Dashboard role-based frontend Â· API/persistence/auth final belum terhubung</div>
 </>;
}
function SurveyTable({surveys,onEdit,onStatus,canEdit=true}:{surveys:Survey[];onEdit:(t:'survey',id:string)=>void;onStatus:(t:'survey',id:string,s:string)=>void;canEdit?:boolean}){
 return <div className="table-wrap" data-testid="table-surveys"><table><thead><tr><th>ID / Tanggal</th><th>Balai</th><th>Ruas</th><th>Jenis</th><th>Alat survei</th><th>Hasil awal</th><th>Status validasi</th><th>Aksi</th></tr></thead><tbody>{surveys.map(s=><tr key={s.id} data-testid={`row-survey-${s.id}`}><td><strong>{s.id}</strong><div className="subtle">{s.tanggal}</div></td><td>{s.balai.replace('Balai ','')}</td><td>{s.ruas}</td><td>{s.jenis}</td><td>{s.alat}</td><td>{s.hasil}</td><td><Status value={s.status}/></td><td>{canEdit?<div className="toolbar"><button className="btn sm" onClick={()=>onEdit('survey',s.id)} aria-label={`Edit ${s.id}`} data-testid={`button-edit-survey-${s.id}`}><Pencil size={12}/></button><select aria-label={`Ubah status ${s.id}`} value={s.status} onChange={e=>onStatus('survey',s.id,e.target.value)} data-testid={`select-status-survey-${s.id}`} style={{fontSize:9,border:'1px solid #d5e0e8',borderRadius:4,padding:4}}>{['Draft','Verifikasi','Lulus','Perlu Perbaikan','Diserahkan'].map(x=><option key={x}>{x}</option>)}</select></div>:<span className="subtle">Lihat saja</span>}</td></tr>)}</tbody></table>{surveys.length===0&&<div className="empty"><Search size={21}/><div>Tidak ada survei sesuai filter.</div></div>}</div>
}
function FilterToolbar({search,setSearch,actions}:{search:string;setSearch:(s:string)=>void;actions?:any}){return <div className="toolbar"><div className="search-box"><Search size={13}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari data..." data-testid="input-module-search"/></div>{actions}</div>}
function EntryPage(p:Props){
 const filtered=p.scoped.filter(s=>!p.search||`${s.id} ${s.ruas} ${s.jenis} ${s.status}`.toLowerCase().includes(p.search.toLowerCase()));
 const count=(status:string)=>p.scoped.filter(s=>s.status===status).length;
 return <><PageHeading label="Entri survei dan hasil awal" detail="Catat pengukuran ruas, alat, dan hasil pemeriksaan awal" action={canRole(p.workflow.role,'enterSurvey')?<button className="btn primary" onClick={()=>p.openNew('survey')} data-testid="button-new-entry"><Plus size={13}/>Entri survei baru</button>:<span className="subtle">Mode review / read-only sesuai peran</span>}/>
 <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><KPI icon={FileText} label="Pengajuan" value={`${p.scoped.length+90}`} note="data periode berjalan" testId="kpi-entry-submitted"/><KPI icon={HardDrive} label="Draft" value={`${count('Draft')+11}`} note="perlu dilengkapi" tone="blue" testId="kpi-entry-draft"/><KPI icon={AlertTriangle} label="Perlu dilengkapi" value="8" note="data belum lengkap" tone="amber" testId="kpi-entry-incomplete"/><KPI icon={CheckCircle2} label="Diserahkan" value={`${count('Lulus')+74}`} note="siap diverifikasi" tone="green" testId="kpi-entry-complete"/></div>
 <div className="grid-two"><Section title="Form entri data uji" icon={ClipboardList}><div className="panel-body"><div className="notice"><CircleHelp size={14}/>Gunakan tombol entri baru untuk membuat rekaman dengan data tersimpan lokal.</div><div className="form-grid" style={{marginTop:12}}><div className="field"><label>Balai</label><select data-testid="entry-preview-balai">{balais.map(b=><option key={b}>{b}</option>)}</select></div><div className="field"><label>Jenis survei</label><select data-testid="entry-preview-type">{surveiTypes.map(t=><option key={t}>{t}</option>)}</select></div><div className="field"><label>Nomor ruas</label><input placeholder="Contoh: Ruas A â€“ Ruas B" data-testid="entry-preview-road"/></div><div className="field"><label>Alat survei</label><select data-testid="entry-preview-tool">{['Profilometer Laser','Kamera Survei','FWD Dynatest','Video Log','Total Station'].map(t=><option key={t}>{t}</option>)}</select></div></div><div className="form-actions">{canRole(p.workflow.role,'enterSurvey')?<><button className="btn" onClick={()=>p.openNew('survey')} data-testid="button-save-draft"><HardDrive size={13}/>Simpan draft</button><button className="btn primary" onClick={()=>p.openNew('survey')} data-testid="button-submit-entry"><ArrowRight size={13}/>Ajukan validasi</button></>:<span className="subtle">Peran aktif dapat melihat data, tetapi tidak melakukan entri pada presentation layer ini.</span>}</div></div></Section>
 <Section title="Hasil uji awal" icon={Gauge}><div className="panel-body"><div className="kpi-grid" style={{gridTemplateColumns:'repeat(2,1fr)',margin:0}}>{[['A','Koefisien A','1,028'],['B','Koefisien B','0,246'],['RÂ²','Koefisien determinasi','0,92'],['CV','Variasi hasil','3,6%']].map(([a,b,c],i)=><div key={a} className="kpi" style={{minHeight:68,background:['#edf6fc','#eef8f5','#f4f1fb','#fff5ea'][i]}}><div className="kpi-icon">{a}</div><div><div className="kpi-label">{b}</div><div className="kpi-value">{c}</div></div></div>)}</div><div className="subtle" style={{marginTop:11}}>Grafik sampel hasil uji per jarak (km)</div><Chart/></div></Section></div>
 <Section title="Daftar pengajuan survei" icon={FileCheck2} extra={<FilterToolbar search={p.search} setSearch={p.setSearch} actions={<button className="btn sm" onClick={()=>p.setSearch('')} data-testid="button-clear-entry-search"><RotateCcw size={12}/>Reset</button>}/>}>
 <div className="tabs">{['Semua','Draft','Verifikasi','Lulus','Perlu Perbaikan'].map(t=><button className={`tab ${p.activeTab===t?'active':''}`} onClick={()=>p.setActiveTab(t)} key={t} data-testid={`tab-entry-${t.toLowerCase().replaceAll(' ','-')}`}>{t}</button>)}</div><SurveyTable surveys={filtered.filter(s=>p.activeTab==='Semua'||s.status===p.activeTab)} onEdit={p.beginEdit} onStatus={p.updateStatus} canEdit={canRole(p.workflow.role,'enterSurvey')}/></Section></>;
}
function VerificationPage(p:Props){
 const pending=p.scoped.filter(s=>s.status==='Verifikasi'||s.status==='Perlu Perbaikan');
 return <><PageHeading label="Alur verifikasi bertingkat" detail="Pemeriksaan berlapis dari penyedia jasa, balai, hingga direktorat" action={<button className="btn primary" onClick={()=>p.setActiveTab(p.activeTab==='Semua'?'Audit sampling':'Semua')} data-testid="button-start-verification"><ClipboardCheck size={13}/>Mulai verifikasi</button>}/>
 <div className="stage-row" style={{marginBottom:12}}>{[['1','Tingkat 1 â€” Penyedia jasa','Self-audit kelengkapan data','100%'],['2','Tingkat 2 â€” Pengguna jasa','Sampling dan verifikasi hasil','78%'],['3','Tingkat 3 â€” Direktorat','Audit lanjutan independen','60%']].map(s=><div className="stage" key={s[0]} style={{background:'white'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><div className="stage-num">{s[0]}</div><div className="stage-title" style={{margin:0}}>{s[1]}<div className="subtle">{s[2]}</div></div></div><div className="stage-bar"><i style={{width:s[3],background:s[0]==='1'?'#15a078':'#1989ca'}}/></div><div className="subtle" style={{textAlign:'right'}}>{s[3]} Â· data diaudit</div></div>)}</div>
 <div className="grid-two"><Section title="Aspek mutu yang diperiksa" icon={CheckCircle2}><div className="panel-body">{['Kelengkapan dokumen','Metode survei','Kalibrasi alat','Konsistensi hasil','Kelengkapan ruas','Kewajaran nilai'].map((x,i)=><div className="quality-check" key={x}><span style={{display:'flex',gap:8,alignItems:'center'}}><CheckCircle2 size={14} color={i===4?'#d89520':'#15996f'}/>{x}</span><Status value={i===4?'Perlu review':'Sesuai'}/></div>)}</div></Section>
 <Section title="Status hasil verifikasi" icon={Activity}><div className="panel-body kpi-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',margin:0}}><KPI icon={Clock3} label="Menunggu audit" value={`${pending.length+16}`} note="butuh tinjauan" testId="kpi-verification-wait"/><KPI icon={CheckCircle2} label="Lulus" value="64" note="sesuai standar" tone="green" testId="kpi-verification-pass"/><KPI icon={AlertTriangle} label="Perlu perbaikan" value="15" note="tindak lanjut" tone="red" testId="kpi-verification-rework"/></div><Chart/></Section></div>
 <div className="grid-even"><Section title="Daftar sampel untuk diverifikasi" icon={FileCheck2} extra={<div className="toolbar"><button className="btn sm" onClick={()=>p.setActiveTab(p.activeTab==='Prioritas tinggi'?'Semua':'Prioritas tinggi')} data-testid="button-filter-priority"><SlidersHorizontal size={12}/>Prioritas</button></div>}><SurveyTable surveys={pending.length?pending:p.scoped.slice(0,4)} onEdit={p.beginEdit} onStatus={p.updateStatus} canEdit={canRole(p.workflow.role,'reviewValidation')}/></Section>
 <Section title="Tinjauan keputusan" icon={ClipboardCheck}><div className="panel-body"><div className="field"><label>Catatan pemeriksa</label><textarea placeholder="Tuliskan alasan ketidaksesuaian atau rekomendasi..." data-testid="textarea-verification-note"/></div><div className="form-actions">{canRole(p.workflow.role,'reviewValidation')?<><button className="btn danger" onClick={()=>{const first=pending[0];if(first)p.updateStatus('survey',first.id,'Perlu Perbaikan');else p.setNotice('Tidak ada data yang menunggu perbaikan')}} data-testid="button-return-revision"><RotateCcw size={13}/>Kembalikan</button><button className="btn primary" onClick={()=>{const first=pending[0];if(first)p.updateStatus('survey',first.id,'Lulus');else p.setNotice('Tidak ada sampel menunggu verifikasi')}} data-testid="button-approve-verification"><Check size={13}/>Setujui hasil</button></>:<span className="subtle">Keputusan review tersedia untuk PIC Balai / Pengguna Jasa, Direktorat / Pusat, atau Admin pada demo frontend.</span>}</div></div></Section></div>
 </>;
}
function FindingTable({p,items}:{p:Props;items:Finding[]}){
 const canManage=canRole(p.workflow.role,'manageFindings');
 return <div className="table-wrap"><table data-testid="table-findings"><thead><tr><th>ID Temuan</th><th>Ruas</th><th>Jenis temuan</th><th>Prioritas</th><th>PIC</th><th>Jatuh tempo</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{items.map(f=><tr key={f.id} data-testid={`row-finding-${f.id}`}><td><strong>{f.id}</strong></td><td>{f.ruas}</td><td>{f.jenis}</td><td><Status value={f.prioritas}/></td><td>{f.pic}</td><td>{f.due}</td><td><Status value={f.status}/></td><td>{canManage?<div className="toolbar"><button className="btn sm" onClick={()=>p.beginEdit('finding',f.id)} data-testid={`button-edit-finding-${f.id}`} aria-label={`Edit temuan ${f.id}`}><Pencil size={12}/></button><select value={f.status} onChange={e=>p.updateStatus('finding',f.id,e.target.value)} data-testid={`select-status-finding-${f.id}`} style={{fontSize:9,border:'1px solid #d5e0e8',borderRadius:4,padding:4}}>{['Diusulkan','Disetujui','Dilaksanakan','Verifikasi Ulang','Selesai'].map(s=><option key={s}>{s}</option>)}</select></div>:<span className="subtle">Lihat saja</span>}</td></tr>)}</tbody></table>{items.length===0&&<div className="empty"><AlertCircle size={22}/>Tidak ada temuan pada filter ini.</div>}</div>
}
function ActionsPage(p:Props){
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
function MasterPage(p:Props){
 const [tab,setTab]=useState('Jenis survei');
  useEffect(()=>{if(['Balai & wilayah','Jenis survei','Alat survei','Alat & personel','Personel','Parameter mutu'].includes(p.activeTab))setTab(p.activeTab)},[p.activeTab]);
  const builtins=tab==='Jenis survei'?surveiTypes:tab==='Balai & wilayah'?balais:tab==='Alat survei'?['Profilometer Laser','Kamera Survei','FWD Dynatest','Video Log','Total Station','GPS Geodetik']:tab==='Personel'?['D. Prasetyo','N. Anggraini','B. Santoso','R. Hidayat','S. Rahma']:tab==='Alat & personel'?[...['Profilometer Laser','Kamera Survei','FWD Dynatest','Video Log','Total Station'].map(x=>`Alat: ${x}`),...['D. Prasetyo','N. Anggraini','B. Santoso','R. Hidayat','S. Rahma'].map(x=>`Personel: ${x}`)]:['Koefisien A','Koefisien B','Koefisien determinasi','Koefisien variasi'];
 const custom=p.store.docs.filter(d=>d.status==='Aktif'&&d.kategori===tab).map(d=>d.nama);
 return <><PageHeading label="Referensi dan sumber daya" detail="Kelola data balai, jenis survei, alat, personel, dan standar mutu" action={<div className="toolbar"><button className="btn" onClick={()=>p.record('Impor data master','Referensi lokal')} data-testid="button-import-master"><ArrowDownToLine size={13}/>Impor data</button><button className="btn primary" onClick={()=>p.openNew('master')} data-testid="button-add-reference"><Plus size={13}/>Tambah referensi</button></div>}/>
 <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><KPI icon={Building2} label="Balai aktif" value="35" note="seluruh wilayah" testId="kpi-master-balai"/><KPI icon={FileCheck2} label="Jenis survei" value="8" note="referensi aktif" tone="green" testId="kpi-master-types"/><KPI icon={Wrench} label="Alat terdaftar" value="48" note="kalibrasi dipantau" tone="blue" testId="kpi-master-tools"/><KPI icon={Users} label="Personel" value="126" note="Penyedia & reviewer QA/QC" tone="green" testId="kpi-master-staff"/></div>
 <Section title="Kelola data master" icon={Database} extra={<div className="subtle">Pilih kategori referensi</div>}><div className="tabs">{['Balai & wilayah','Jenis survei','Alat survei','Personel','Parameter mutu'].map(t=><button className={`tab ${tab===t?'active':''}`} key={t} onClick={()=>setTab(t)} data-testid={`tab-master-${t.toLowerCase().replaceAll(' ','-')}`}>{t}</button>)}</div><div className="grid-two" style={{padding:12,margin:0}}><div className="panel"><div className="panel-head"><h3><Database size={14}/>{tab}</h3></div><div className="table-wrap"><table data-testid="table-master"><thead><tr><th>Kode</th><th>Nama referensi</th><th>Kelompok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{[...builtins,...custom].map((x,i)=><tr key={`${x}-${i}`} data-testid={`row-master-${i}`}><td>{tab==='Jenis survei'?`REF-0${i+1}`:`${tab.slice(0,3).toUpperCase()}-${100+i}`}</td><td><strong>{x}</strong></td><td>{tab==='Jenis survei'?'Pengukuran kondisi':tab}</td><td><Status value="Aktif"/></td><td><button className="btn sm" onClick={()=>{p.setNotice(`Referensi ${x} merupakan data bawaan; gunakan Tambah Referensi untuk menambahkan nilai baru.`);window.setTimeout(()=>p.setNotice(''),2500)}} data-testid={`button-view-master-${i}`}><Eye size={12}/>Detail</button></td></tr>)}</tbody></table></div></div>
 <Section title="Sebaran referensi aktif" icon={BarChart3}><div className="panel-body"><div className="bar-list">{surveiTypes.map((x,i)=><div className="bar-row" key={x}><span>{x}</span><div className="bar-track"><div className="bar-fill" style={{width:`${[76,62,54,70,42,58,49,37][i]}%`}}/></div><span className="bar-percent">{[15,12,10,14,8,11,9,7][i]}</span></div>)}</div><div className="notice" style={{marginTop:15}}><ShieldCheck size={14}/>Perubahan referensi dicatat pada jejak audit lokal.</div></div></Section></div></Section></>;
}
function CompliancePage(p:Props){
 const types=surveiTypes.map((t,i)=>({name:t,target:[1250,980,450,320,200,400,1200,300][i],real:[1180,870,380,290,160,320,1080,250][i],value:[92,89,84,91,80,82,90,83][i]}));
 return <><PageHeading label="Analisis mutu dan kepatuhan" detail="Pemantauan kinerja data, tren validasi, dan perbandingan per jenis survei" action={<button className="btn" onClick={()=>p.record('Ekspor analisis kepatuhan','Analisis mutu')} data-testid="button-export-compliance"><ArrowDownToLine size={13}/>Ekspor analisis</button>}/>
 <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><KPI icon={CheckCircle2} label="Kepatuhan rata-rata" value="88%" note="target minimum 85%" tone="green" testId="kpi-compliance-average"/><KPI icon={Clock3} label="Rata-rata layanan" value="4,2 hari" note="waktu penyelesaian" testId="kpi-compliance-days"/><KPI icon={AlertTriangle} label="Data perlu perbaikan" value={`${p.store.surveys.filter(x=>x.status==='Perlu Perbaikan').length+13}`} note="lintas jenis survei" tone="amber" testId="kpi-compliance-rework"/><KPI icon={TrendingUp} label="Tren periode" value="+3,8%" note="dibanding periode lalu" tone="blue" testId="kpi-compliance-trend"/></div>
 <div className="grid-two"><Section title="Tren kepatuhan QA/QC" icon={TrendingUp} extra={<div className="legend"><span><i/>Uji produksi</span><span><i style={{background:'#16a17a'}}/>Konsistensi</span></div>}><Chart/></Section><Section title="Peringkat balai" icon={BarChart3}><div className="panel-body bar-list">{balais.map((b,i)=><div className="bar-row" key={b}><span>{b.replace('Balai ','')}</span><div className="bar-track"><div className="bar-fill" style={{width:`${[92,85,78,71,68][i]}%`}}/></div><span className="bar-percent">{[92,85,78,71,68][i]}%</span></div>)}</div></Section></div>
 <div className="grid-two"><Section title="Kepatuhan per jenis survei" icon={ClipboardCheck}><div className="table-wrap"><table data-testid="table-compliance"><thead><tr><th>Jenis survei</th><th>Target (km)</th><th>Realisasi (km)</th><th>Kepatuhan</th><th>Status</th></tr></thead><tbody>{types.map(t=><tr key={t.name} data-testid={`row-compliance-${t.name}`}><td><strong>{t.name}</strong></td><td>{t.target.toLocaleString('id-ID')}</td><td>{t.real.toLocaleString('id-ID')}</td><td><div className="toolbar"><div className="bar-track" style={{width:105}}><div className="bar-fill teal" style={{width:`${t.value}%`}}/></div><b>{t.value}%</b></div></td><td><Status value={t.value>=85?'Memenuhi':'Tidak Memenuhi'}/></td></tr>)}</tbody></table></div></Section>
 <Section title="Kendala dominan" icon={AlertCircle} extra={<select value={p.activeTab==='Semua'?'Kalibrasi':p.activeTab} onChange={e=>p.setActiveTab(e.target.value)} data-testid="select-compliance-category" style={{fontSize:9,border:'1px solid #d5e0e8',padding:5,borderRadius:4}}>{['Kalibrasi','Dokumen','Konsistensi','SDM'].map(x=><option key={x}>{x}</option>)}</select>}><div className="panel-body bar-list">{['Kalibrasi alat tidak sesuai','Sertifikat kedaluwarsa','Parameter belum lengkap','Metode tidak konsisten','Lainnya'].map((x,i)=><div className="bar-row" key={x}><span style={{width:125}}>{x}</span><div className="bar-track"><div className="bar-fill" style={{width:`${[38,24,16,12,10][i]}%`}}/></div><span className="bar-percent">{[38,24,16,12,10][i]}%</span></div>)}</div></Section></div>
 <Section title="Peta pemeriksaan mutu" icon={Filter}><div className="panel-body"><div className="heat-row" style={{fontWeight:700}}><span>Aspek mutu</span>{['Jan','Feb','Mar','Apr','Mei','Jun'].map(x=><span key={x} style={{textAlign:'center'}}>{x}</span>)}</div>{['Kalibrasi','Kelengkapan data','Konsistensi hasil','Kompetensi SDM'].map((x,r)=><div className="heat-row" key={x}><span>{x}</span>{Array.from({length:6},(_,i)=><span key={i} className={`heat-cell ${((r+i)%5===0)?'mid':((r+i)%7===0)?'low':''}`} title={`${x} ${i+1}`} data-testid={`heat-${r}-${i}`}/>)}</div>)}</div></Section></>;
}
function ReportsPage(p:Props){
 const [range,setRange]=useState('Semester I 2027');
 return <><PageHeading label="Dashboard kinerja & pelaporan" detail="Ringkasan operasional untuk Penyedia, PIC Balai, dan Direktorat / Pusat" action={<button className="btn primary" onClick={()=>{p.record('Ekspor laporan kinerja',range);p.setNotice('Laporan kinerja disiapkan untuk diunduh')}} data-testid="button-export-report"><ArrowDownToLine size={13}/>Ekspor laporan</button>}/>
 <div className="toolbar" style={{marginBottom:12}}><div className="field" style={{maxWidth:180}}><label>Rentang laporan</label><select value={range} onChange={e=>setRange(e.target.value)} data-testid="select-report-range">{['Semester I 2027','Triwulan II 2027','Juni 2027','Tahun 2027'].map(x=><option key={x}>{x}</option>)}</select></div><button className="btn" onClick={()=>p.setActiveTab(p.activeTab==='Semua'?'Kinerja balai':'Semua')} data-testid="button-toggle-report-view"><SlidersHorizontal size={13}/>{p.activeTab==='Semua'?'Kinerja balai':'Semua indikator'}</button></div>
 <div className="kpi-grid"><KPI icon={Target} label="Target survei" value="1.250 km" note="rencana semester" testId="report-kpi-target"/><KPI icon={Activity} label="Realisasi" value="900 km" note="72% dari target" tone="green" testId="report-kpi-realization"/><KPI icon={CheckCircle2} label="Kelulusan validasi" value="88%" note="melebihi ambang mutu" tone="green" testId="report-kpi-validation"/><KPI icon={AlertTriangle} label="Temuan aktif" value={`${p.store.findings.filter(f=>f.status!=='Selesai').length}`} note="temuan belum ditutup" tone="amber" testId="report-kpi-findings"/><KPI icon={Clock3} label="Rata-rata layanan" value="4,2 hari" note="siklus verifikasi" testId="report-kpi-service"/></div>
 <div className="grid-two"><Section title="Tren progres dan mutu" icon={TrendingUp} extra={<div className="legend"><span><i/>Realisasi</span><span><i style={{background:'#16a17a'}}/>Kepatuhan</span></div>}><Chart/></Section><Section title="Kinerja per balai" icon={Building2}><div className="panel-body bar-list">{balais.map((b,i)=><div className="bar-row" key={b}><span>{b.replace('Balai ','')}</span><div className="bar-track"><div className={`bar-fill ${i%2?'teal':''}`} style={{width:`${[86,78,72,69,65][i]}%`}}/></div><span className="bar-percent">{[86,78,72,69,65][i]}%</span></div>)}</div></Section></div>
 <div className="grid-even"><Section title="Paket laporan tersedia" icon={FileText}><div className="table-wrap"><table data-testid="table-report-packages"><thead><tr><th>Nama laporan</th><th>Periode</th><th>Isi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{[['Ringkasan QA/QC','Juni 2027','Progres, validasi, temuan'],['Kinerja balai','Triwulan II 2027','Perbandingan wilayah'],['Kepatuhan per survei','Semester I 2027','8 jenis survei'],['Jejak verifikasi','Juni 2027','Alur & keputusan']].map((r,i)=><tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td><td><Status value="Siap"/></td><td><button className="btn sm" onClick={()=>{p.record('Ekspor paket laporan',r[0]);p.setNotice(`${r[0]} siap diunduh`)}} data-testid={`button-download-report-${i}`}><ArrowDownToLine size={12}/>Unduh</button></td></tr>)}</tbody></table></div></Section>
 <Section title="Catatan kinerja periode" icon={ClipboardList}><div className="panel-body"><div className="quality-check"><span>Realisasi survei</span><b>900 / 1.250 km</b></div><div className="quality-check"><span>Kelulusan tahap validasi</span><Status value="88% Â· Memenuhi"/></div><div className="quality-check"><span>Temuan prioritas tinggi</span><Status value="3 perlu tindak lanjut"/></div><div className="quality-check"><span>Integritas data</span><Status value="Baik"/></div><div className="notice" style={{marginTop:12}}>Semua angka pada dashboard ini bersifat simulasi untuk demonstrasi alur kerja.</div></div></Section></div>
 </>;
}
function DocumentsPage(p:Props){
 const docs=p.store.docs.filter(d=>`${d.nama} ${d.kategori} ${d.status}`.toLowerCase().includes(p.search.toLowerCase())).filter(d=>p.activeTab==='Semua'||d.kategori===p.activeTab);
 return <><PageHeading label="Kontrol dokumen mutu" detail="Sertifikat, hasil validasi, dan bukti pendukung untuk paket survei" action={<button className="btn primary" onClick={()=>p.openNew('doc')} data-testid="button-upload-document"><Plus size={13}/>Tambah dokumen</button>}/>
 <WorkflowDocuments state={p.workflow}/>
 <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><KPI icon={FileText} label="Total dokumen" value={`${p.store.docs.length+244}`} note="terdaftar pada sistem" testId="kpi-doc-total"/><KPI icon={CheckCircle2} label="Paket lengkap" value="77" note="72% dari kebutuhan" tone="green" testId="kpi-doc-complete"/><KPI icon={AlertTriangle} label="Perlu dilengkapi" value={`${p.store.docs.filter(d=>d.status!=='Lengkap').length+7}`} note="tindak lanjut dibutuhkan" tone="red" testId="kpi-doc-incomplete"/><KPI icon={Layers3} label="Versi terbaru" value="32" note="dokumen diperbarui" tone="blue" testId="kpi-doc-latest"/></div>
 <div className="grid-two"><Section title="File manager dokumen" icon={BookOpen} extra={<FilterToolbar search={p.search} setSearch={p.setSearch} actions={<button className="btn sm" onClick={()=>p.setSearch('')} data-testid="button-reset-document-search"><RotateCcw size={12}/></button>}/>}>
 <div className="tabs">{['Semua','Kalibrasi','Validasi','Verifikasi berkala','Berita acara'].map(t=><button className={`tab ${p.activeTab===t?'active':''}`} key={t} onClick={()=>p.setActiveTab(t)} data-testid={`tab-doc-${t.toLowerCase().replaceAll(' ','-')}`}>{t}</button>)}</div>
 <div className="table-wrap"><table data-testid="table-documents"><thead><tr><th>Nama dokumen</th><th>Kategori</th><th>Versi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{docs.map(d=><tr key={d.id} data-testid={`row-document-${d.id}`}><td><div style={{display:'flex',gap:7,alignItems:'center'}}><FileText size={14} color="#d75d53"/><strong>{d.nama}</strong></div></td><td>{d.kategori}</td><td>{d.versi}</td><td><Status value={d.status}/></td><td><div className="toolbar"><button className="btn sm" onClick={()=>p.beginEdit('doc',d.id)} data-testid={`button-edit-document-${d.id}`}><Pencil size={12}/></button><button className="btn sm" onClick={()=>p.updateStatus('doc',d.id,d.status==='Lengkap'?'Perlu Dilengkapi':'Lengkap')} data-testid={`button-toggle-document-${d.id}`} title="Ubah status"><Check size={12}/></button></div></td></tr>)}</tbody></table>{docs.length===0&&<div className="empty"><FileText size={21}/>Dokumen tidak ditemukan.</div>}</div>
 </Section><div style={{display:'grid',gap:11}}><Section title="Kelengkapan paket survei" icon={ClipboardCheck}><div className="panel-body"><div style={{display:'flex',alignItems:'center',gap:18}}><div style={{width:100,height:100,borderRadius:'50%',background:'conic-gradient(#13a17a 0 72%,#e8eef2 72% 100%)',display:'grid',placeItems:'center'}}><div style={{width:72,height:72,borderRadius:'50%',background:'white',display:'grid',placeItems:'center',textAlign:'center',font:'800 20px Manrope',color:'#173453'}}>77<span style={{font:'9px DM Sans',display:'block'}}>Paket lengkap</span></div></div><div style={{display:'grid',gap:8}}><span><i style={{display:'inline-block',width:8,height:8,borderRadius:8,background:'#13a17a',marginRight:7}}/>Lengkap <b>77</b></span><span><i style={{display:'inline-block',width:8,height:8,borderRadius:8,background:'#edb23b',marginRight:7}}/>Perlu dilengkapi <b>8</b></span><span><i style={{display:'inline-block',width:8,height:8,borderRadius:8,background:'#d9e1e7',marginRight:7}}/>Belum ada <b>3</b></span></div></div>{['Sertifikat kalibrasi','Hasil validasi','Verifikasi berkala','Foto/video','Data mentah & final'].map(x=><div className="quality-check" key={x}><span>{x}</span><Status value={x==='Verifikasi berkala'?'Perlu Dilengkapi':'Ada'}/></div>)}</div></Section>
 <Section title="Riwayat revisi" icon={RotateCcw}><div className="panel-body">{['v2.1 Â· Kalibrasi alat','v1.4 Â· Hasil validasi','v1.3 Â· Verifikasi berkala'].map((x,i)=><div className="quality-check" key={x}><span>{x}</span><span className="subtle">{['14 Jun','09 Jun','05 Jun'][i]} 2027</span></div>)}</div></Section></div></div></>;
}
function NotificationsPage(p:Props){
 const [read,setRead]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('road-qaqc-notifications-read')||'[]') as string[]}catch{return[]}});
 useEffect(()=>{localStorage.setItem('road-qaqc-notifications-read',JSON.stringify(read));},[read]);
 const alerts=[{id:'NTF-14',date:'14 Jun 2027',category:'Peringatan mutu',message:'Kalibrasi alat perlu diperbarui',road:'Balai Sumatera Utara Â· Ruas Medan â€“ Binjai',due:'Jatuh tempo 16 Jun 2027',tone:'red'},{id:'NTF-13',date:'13 Jun 2027',category:'Jatuh tempo',message:'Verifikasi berkala jatuh tempo',road:'Balai Jawa Barat Â· Ruas Bandung â€“ Cileunyi',due:'Jatuh tempo 18 Jun 2027',tone:'amber'},{id:'NTF-12',date:'12 Jun 2027',category:'Audit',message:'Audit dokumen belum ditindaklanjuti',road:'Balai Kalimantan Timur Â· Ruas Samarinda',due:'Tenggat 20 Jun 2027',tone:'blue'},{id:'NTF-11',date:'10 Jun 2027',category:'Informasi',message:'Hasil verifikasi sudah tersedia',road:'Balai Sulawesi Selatan Â· Ruas Makassar â€“ Maros',due:'Diperbarui 10 Jun 2027',tone:'green'}];
 const visible=alerts.filter(a=>(p.activeTab==='Semua'||p.activeTab==='Belum dibaca'&&!read.includes(a.id)||p.activeTab==='Jatuh tempo'&&a.category==='Jatuh tempo'||p.activeTab==='Mutu'&&a.category==='Peringatan mutu'));
 return <><PageHeading label="Kotak notifikasi dan pengingat" detail="Pantau jatuh tempo, peringatan mutu, dan eskalasi tindak lanjut" action={<button className="btn" onClick={()=>setRead(alerts.map(a=>a.id))} data-testid="button-mark-all-read"><Check size={13}/>Tandai semua dibaca</button>}/>
 <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><KPI icon={Bell} label="Belum dibaca" value={`${12-read.length}`} note="pemberitahuan aktif" tone="blue" testId="kpi-notif-unread"/><KPI icon={Clock3} label="Mendekati jatuh tempo" value="5" note="dalam 7 hari" tone="amber" testId="kpi-notif-due"/><KPI icon={AlertTriangle} label="Eskalasi aktif" value="3" note="perlu perhatian" tone="red" testId="kpi-notif-escalation"/><KPI icon={CheckCircle2} label="Ditindaklanjuti" value="28" note="periode berjalan" tone="green" testId="kpi-notif-followed"/></div>
 <div className="grid-two"><Section title="Kotak notifikasi" icon={Bell} extra={<FilterToolbar search={p.search} setSearch={p.setSearch}/>}>
 <div className="tabs">{['Semua','Belum dibaca','Jatuh tempo','Mutu'].map(t=><button className={`tab ${p.activeTab===t?'active':''}`} key={t} onClick={()=>p.setActiveTab(t)} data-testid={`tab-notification-${t.toLowerCase().replaceAll(' ','-')}`}>{t}</button>)}</div><div style={{padding:10,display:'grid',gap:7}}>{visible.filter(a=>!p.search||`${a.message} ${a.road}`.toLowerCase().includes(p.search.toLowerCase())).map(a=><div key={a.id} style={{display:'flex',gap:10,alignItems:'center',border:'1px solid #e4ebf0',padding:10,borderRadius:5,background:read.includes(a.id)?'#fff':'#f8fbfd'}} data-testid={`notification-${a.id}`}><div className={`kpi-icon ${a.tone}`}><AlertCircle size={17}/></div><div style={{flex:1}}><div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}><strong style={{fontSize:10}}>{a.message}</strong><Status value={a.category}/></div><div className="subtle">{a.road}</div><div className="subtle" style={{color:'#b66a1a'}}>{a.due} Â· {a.date}</div></div><button className="btn sm" onClick={()=>{setRead(x=>x.includes(a.id)?x:[...x,a.id]);p.record('Baca notifikasi',a.id)}} data-testid={`button-read-${a.id}`}>{read.includes(a.id)?'Dibaca':'Lihat'}</button><button className="btn sm primary" onClick={()=>{setRead(x=>x.includes(a.id)?x:[...x,a.id]);p.record('Tindak lanjuti notifikasi',a.id);p.setNotice('Notifikasi ditandai untuk ditindaklanjuti')}} data-testid={`button-follow-${a.id}`}>Tindak</button></div>)}</div>
 </Section><div style={{display:'grid',gap:11}}><Section title="Jadwal siklus verifikasi (14 hari)" icon={CalendarDays} extra={<button className="btn sm" onClick={()=>p.setActiveTab(p.activeTab==='Jatuh tempo'?'Semua':'Jatuh tempo')} data-testid="button-calendar-next">Jun 2027 <ChevronDown size={12}/></button>}><div className="panel-body"><div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5,textAlign:'center',fontSize:9,color:'#657c91'}}>{['Sen','Sel','Rab','Kam','Jum','Sab','Min',...Array.from({length:35},(_,i)=>`${i+1}`)].map((d,i)=><div key={`${d}-${i}`} style={{padding:'6px 2px',background:i>6&&['6','9','13','16'].includes(d)?i%3===0?'#fff0d7':'#e5f4ee':'transparent',borderRadius:4,color:i>6&&['6','9','13','16'].includes(d)?'#226b8e':undefined,fontWeight:i>6&&['6','9','13','16'].includes(d)?800:400}}>{d}</div>)}</div><div className="legend" style={{marginTop:10}}><span><i style={{background:'#1787cc'}}/>Pengingat</span><span><i style={{background:'#e5a333'}}/>Jatuh tempo</span><span><i style={{background:'#16a17a'}}/>Verifikasi</span></div></div></Section>
 <Section title="Alur eskalasi notifikasi" icon={TrendingUp}><div className="panel-body"><div className="stage-row">{[['1','PIC Balai / Pengguna Jasa','Pengingat awal'],['2','Atasan terkait','Eskalasi keterlambatan'],['3','Direktorat / Pusat','Tindak lanjut tingkat pusat']].map(x=><div className="stage" key={x[0]}><div className="stage-num">{x[0]}</div><div className="stage-title">{x[1]}<div className="subtle">{x[2]}</div></div></div>)}</div></div></Section></div></div></>;
}
function AuditPage(p:Props){
 const logs=p.store.logs.filter(l=>`${l.id} ${l.pengguna} ${l.aktivitas} ${l.objek}`.toLowerCase().includes(p.search.toLowerCase()));
 return <><PageHeading label="Keamanan dan jejak audit" detail="Kontrol akses, aktivitas pengguna, dan rekam perubahan data" action={<div className="toolbar"><button className="btn" onClick={()=>p.setActiveTab(p.activeTab==='Semua'?'Kelola pengguna':'Semua')} data-testid="button-manage-users"><Settings size={13}/>Kelola pengguna</button><button className="btn primary" onClick={()=>{p.record('Ekspor log audit','Semua aktivitas');p.setNotice('Log audit disiapkan untuk ekspor lokal')}} data-testid="button-export-audit"><ArrowDownToLine size={13}/>Ekspor log</button></div>}/>
 <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><KPI icon={Users} label="Pengguna aktif" value="42" note="12% dari periode lalu" testId="kpi-audit-users"/><KPI icon={ShieldCheck} label="Peran aktif" value="4" note="Penyedia, PIC Balai, Direktorat, Admin" tone="blue" testId="kpi-audit-roles"/><KPI icon={Activity} label="Aktivitas hari ini" value={`${126+p.store.logs.length-4}`} note="18% dibanding kemarin" tone="green" testId="kpi-audit-activity"/><KPI icon={AlertTriangle} label="Percobaan ditolak" value="2" note="33% dari hari kemarin" tone="red" testId="kpi-audit-rejected"/></div>
 <div className="grid-two"><Section title="Matriks hak akses per peran" icon={ShieldCheck}><div className="table-wrap"><table data-testid="table-permissions"><thead><tr><th>Peran</th><th>Input data</th><th>Validasi</th><th>Laporan</th><th>Kelola akses</th></tr></thead><tbody>{[['Penyedia Jasa / Ketua Tim',1,0,1,0],['PIC Balai / Pengguna Jasa',0,1,1,0],['Direktorat / Pusat',0,1,1,0],['Admin',1,1,1,1]].map(r=><tr key={String(r[0])}><td><strong>{r[0]}</strong></td>{r.slice(1).map((v,i)=><td key={i} style={{textAlign:'center',color:v?'#16966e':'#d4514b'}}>{v?<CheckCircle2 size={15}/>:<X size={15}/>}</td>)}</tr>)}</tbody></table></div><div className="legend" style={{padding:10}}><span><CheckCircle2 size={12} color="#16966e"/>Diizinkan</span><span><X size={12} color="#d4514b"/>Tidak diizinkan</span></div></Section>
 <Section title="Tren aktivitas keamanan" icon={BarChart3} extra={<span className="subtle">Aktivitas normal Â· ditolak</span>}><Chart mode="bars"/></Section></div>
 <div className="grid-two"><Section title="Log aktivitas pengguna" icon={ClipboardList} extra={<FilterToolbar search={p.search} setSearch={p.setSearch}/>}>
 <div className="table-wrap"><table data-testid="table-audit-log"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aktivitas</th><th>Objek</th><th>Hasil</th></tr></thead><tbody>{logs.map(l=><tr key={l.id} data-testid={`row-audit-${l.id}`}><td>{l.waktu}</td><td>{l.pengguna}</td><td>{l.aktivitas}</td><td>{l.objek}</td><td><Status value={l.hasil}/></td></tr>)}</tbody></table>{logs.length===0&&<div className="empty"><Search size={20}/>Tidak ada aktivitas yang cocok.</div>}</div>
 </Section><Section title="Detail perubahan data" icon={Eye}><div className="panel-body">{p.store.logs.slice(0,1).map(l=><div key={l.id}><div className="quality-check"><span>Waktu</span><strong>{l.waktu}</strong></div><div className="quality-check"><span>Pengguna</span><strong>{l.pengguna}</strong></div><div className="quality-check"><span>Aktivitas</span><strong>{l.aktivitas}</strong></div><div className="quality-check"><span>Objek</span><strong>{l.objek}</strong></div><div className="quality-check"><span>Hasil</span><Status value={l.hasil}/></div><div className="notice" style={{marginTop:12}}><ShieldCheck size={14}/>Perubahan UI disimpan secara lokal. Log simulasi hanya tersedia pada perangkat ini.</div></div>)}</div></Section></div>
 <Section title="Status sesi dan keamanan" icon={HardDrive}><div className="panel-body grid-even" style={{margin:0}}><div className="quality-check"><span>Mode autentikasi</span><Status value="Demo lokal"/></div><div className="quality-check"><span>Enkripsi koneksi</span><Status value="Tidak berlaku Â· tanpa API"/></div><div className="quality-check"><span>Ruang lingkup pengguna</span><Status value={p.workflow.role}/></div><div className="quality-check"><span>Penyimpanan perubahan</span><Status value="localStorage aktif"/></div></div></Section></>;
}
function DataDialog({type,editing,store,onClose,onSave}:{type:'survey'|'finding'|'doc'|'master';editing:string|null;store:Store;onClose:()=>void;onSave:(t:'survey'|'finding'|'doc'|'master',f:Record<string,string>)=>void}){
 const row=type==='survey'?store.surveys.find(x=>x.id===editing):type==='finding'?store.findings.find(x=>x.id===editing):type==='doc'?store.docs.find(x=>x.id===editing):undefined;
 const [form,setForm]=useState<Record<string,string>>(()=>row?Object.fromEntries(Object.entries(row).map(([k,v])=>[k,String(v)])):{});
 const set=(k:string,v:string)=>setForm(old=>({...old,[k]:v}));
 const titles={survey:editing?'Edit entri survei':'Entri survei baru',finding:editing?'Edit temuan':'Catat temuan baru',doc:editing?'Perbarui dokumen':'Tambah dokumen mutu',master:'Tambah referensi master'};
 const submit=(e:React.FormEvent)=>{e.preventDefault();onSave(type,form)};
 const input=(key:string,label:string,placeholder='',kind='text')=><div className="field" key={key}><label>{label}</label><input type={kind} value={form[key]||''} onChange={e=>set(key,e.target.value)} placeholder={placeholder} required data-testid={`input-form-${key}`}/></div>;
 const select=(key:string,label:string,options:string[])=><div className="field" key={key}><label>{label}</label><select value={form[key]||options[0]} onChange={e=>set(key,e.target.value)} data-testid={`select-form-${key}`}>{options.map(x=><option key={x}>{x}</option>)}</select></div>;
 return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="dialog" role="dialog" aria-modal="true" aria-label={titles[type]}><div className="dialog-head"><h2>{titles[type]}</h2><button className="btn sm" onClick={onClose} aria-label="Tutup dialog" data-testid="button-close-dialog"><X size={15}/></button></div><form className="dialog-content" onSubmit={submit}>
  {type==='survey'&&<div className="form-grid">{select('balai','Balai',balais)}{select('jenis','Jenis survei',surveiTypes)}{input('ruas','Nama ruas','Contoh: Medan â€“ Binjai')}{select('alat','Alat survei',['Profilometer Laser','Kamera Survei','FWD Dynatest','Video Log','Total Station'])}{input('tanggal','Tanggal survei','','date')}{input('km','Panjang ruas (km)','0','number')}{select('status','Status validasi',['Draft','Verifikasi','Lulus','Perlu Perbaikan','Diserahkan'])}{input('hasil','Hasil awal','Contoh: IRI 2,14 m/km')}</div>}
  {type==='finding'&&<div className="form-grid">{input('ruas','Ruas terkait','Nama ruas')}{input('jenis','Jenis temuan','Mis. Konsistensi data')}{select('prioritas','Prioritas',['Kritis','Tinggi','Sedang','Rendah'])}{select('status','Status tindakan',['Diusulkan','Disetujui','Dilaksanakan','Verifikasi Ulang','Selesai'])}{input('pic','PIC','Nama penanggung jawab')}{input('due','Jatuh tempo','','date')}</div>}
  {type==='doc'&&<div className="form-grid">{input('nama','Nama dokumen','Nama file atau dokumen')}{select('kategori','Kategori',['Kalibrasi','Validasi','Verifikasi berkala','Berita acara','Bukti pendukung'])}{input('versi','Versi dokumen','v1.0')}{select('status','Status',['Lengkap','Perlu Dilengkapi','Dalam Review'])}</div>}
  {type==='master'&&<div className="form-grid">{input('nama','Nama referensi','Nama referensi baru')}{select('kategori','Kelompok referensi',['Jenis survei','Alat survei','Balai & wilayah','Personel','Parameter mutu'])}</div>}
  <div className="form-actions"><button type="button" className="btn" onClick={onClose} data-testid="button-cancel-form">Batal</button><button type="submit" className="btn primary" data-testid="button-submit-form"><Check size={13}/>{editing?'Simpan perubahan':'Simpan data'}</button></div>
  </form></div></div>;
}
export default App;


