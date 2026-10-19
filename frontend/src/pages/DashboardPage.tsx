import { useState } from 'react';
import { Link } from 'wouter';
import {
  AlertTriangle, ArrowDownToLine, ArrowRight, BarChart3, Building2, CalendarDays,
  CheckCircle2, ClipboardCheck, ClipboardList, Database, FileCheck2, FileText, HardDrive,
  ListChecks, MapPinned, Plus, Settings, ShieldCheck, Target, TrendingUp, Users,
} from 'lucide-react';

import { BalaiOsmMap } from '../BalaiOsmMap';
import { Chart, KPI, PageHeading, Section, Status, SurveyTable } from '../components/app/AppComponents';
import { surveiTypes } from '../lib/demoData';
import type { PageProps } from '../types';
import { evaluateProductionTest, type SurveyType } from '../workflow/model';
import {
  ROLE_HOME_LABELS, ROLE_HOME_PRIORITIES, ROLE_HOME_QUICK_LINKS, WORKFLOW_ROLE_SCOPE, canAccessRoute,
} from '../workflow/workflowConfig';

export default function DashboardPage(p:PageProps){
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
