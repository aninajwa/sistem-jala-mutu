import { useMemo, useState } from 'react';
import { ArrowDownToLine, BarChart3, ClipboardCheck, FileWarning, ShieldCheck, TrendingUp, RotateCcw } from 'lucide-react';
import { KPI, PageHeading, Section } from '../components/app/AppComponents';
import type { PageProps } from '../types';
import { complianceCsv, summarizeCompliance } from './complianceMetrics';
import './complianceWorkspace.css';

type Workspace = 'balai'|'directorate'|'admin';
const workspaceFor=(role:string):Workspace=>role==='Admin'?'admin':role==='Direktorat / Pusat'?'directorate':'balai';
const viewFor=(role:Workspace,tab:string)=>role==='admin'?(tab==='Peringkat'?'comparison':'evidence'):
  tab==='Tren'?'trend':tab==='Peringkat'?'comparison':role==='balai'?'followup':'overview';
const emptyMessage=<p className="cm-empty">Belum ada data pada filter ini.</p>;

export default function CompliancePage(p:PageProps){
 const role=p.workflow.role;
 const [balai,setBalai]=useState('Semua Balai');
 const [search,setSearch]=useState('');
 const initialPeriod=/^Semester (I|II) \d{4}$/.test(p.periode)?p.periode:'Semua periode';
 const [period,setPeriod]=useState(initialPeriod);
 const periods=useMemo(()=>{
  const years=new Set(Object.values(p.packages).flatMap(pkg=>pkg.dailyRecords.map(record=>record.date.slice(0,4))).filter(value=>/^\d{4}$/.test(value)));
  const headerYear=/^Semester (?:I|II) (\d{4})$/.exec(initialPeriod)?.[1];
  if(headerYear)years.add(headerYear);
  return [...years].sort().reverse().flatMap(year=>[`Semester I ${year}`,`Semester II ${year}`]);
 },[p.packages,initialPeriod]);
 const kind=workspaceFor(role);
 const view=viewFor(kind,p.activeTab);
 // p.packages is already authorized by usePackageStore; filters can only narrow it.
 const choices=useMemo(()=>summarizeCompliance(p.packages).byBalai.map(b=>b.name),[p.packages]);
 const scope=useMemo(()=>{
  const keyword=search.trim().toLocaleLowerCase('id-ID');
  return Object.fromEntries(Object.entries(p.packages).filter(([id,state])=>
   (kind==='balai'||balai==='Semua Balai'||state.project.balai===balai)&&
   (!keyword||[id,state.project.packageName].some(value=>(value||'').toLocaleLowerCase('id-ID').includes(keyword)))
  ));
 },[p.packages,kind,balai,search]);
 const summary=useMemo(()=>summarizeCompliance(scope,period),[scope,period]);
 const packageRows=summary.rows.filter(r=>r.survey==='Seluruh paket');
 const titles={balai:'Evaluasi Mutu Paket Balai',directorate:'Pengawasan Mutu Lintas Balai',admin:'Analisis Kelengkapan Bukti'};
 const explanations={balai:'Analisis pemeriksaan dan tindak lanjut pada paket dalam kewenangan Balai.',directorate:'Perbandingan hasil pemeriksaan lintas Balai berdasarkan rekaman yang tersedia.',admin:'Analisis ketersediaan rekaman dan temuan agregat, tanpa keputusan teknis atau antrean workflow.'};
 const download=()=>{
   const csv=complianceCsv(summary,role,period);
   const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='jejak-analisis-kepatuhan.csv';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 if(role==='Penyedia Jasa / Ketua Tim')return <main className="cm-workspace"><PageHeading label="Analisis & Kepatuhan" detail="Analisis lintas paket bukan tugas Penyedia"/><p>Gunakan Ringkasan QA/QC, Paket, Tindakan Perbaikan, dan Laporan untuk paket dalam kewenangan Anda.</p></main>;
 const tableSurvey=<Section title="Pemeriksaan menurut jenis survei" icon={ClipboardCheck}><div className="cm-table-scroll"><table data-testid="table-compliance"><thead><tr><th>Jenis survei</th><th>Rekaman pada periode</th><th>Review berkala</th><th>V&V bertahap</th></tr></thead><tbody>{summary.survey.map(s=><tr key={s.name}><th scope="row">{s.name}</th><td>{s.records}</td><td>{s.periodic.sesuai} sesuai dari {s.periodic.total} keputusan</td><td>{s.staged.sesuai} sesuai dari {s.staged.total} keputusan</td></tr>)}</tbody></table>{!summary.survey.length&&emptyMessage}</div></Section>;
 const tableBalai=<Section title="Perbandingan cakupan dan temuan antar-Balai" icon={BarChart3}><div className="cm-table-scroll"><table data-testid="table-compliance-balai"><thead><tr><th>Balai</th><th>Paket</th><th>Audit lulus / keputusan</th><th>Koreksi terbuka (terkini)</th></tr></thead><tbody>{summary.byBalai.map(b=><tr key={b.name}><th scope="row">{b.name}</th><td>{b.packages}</td><td>{b.audit.total?`${b.audit.sesuai} / ${b.audit.total}`:'Belum ada keputusan'}</td><td>{b.open}</td></tr>)}</tbody></table>{!summary.byBalai.length&&emptyMessage}</div></Section>;
 const tablePackages=<Section title="Perbandingan paket dalam kewenangan" icon={BarChart3}><div className="cm-table-scroll"><table data-testid="table-compliance-packages"><thead><tr><th>Paket</th><th>Wilayah penugasan</th><th>Rekaman pada periode</th><th>Audit lulus / keputusan</th><th>Koreksi terbuka</th><th>Akses</th></tr></thead><tbody>{packageRows.map(r=><tr key={r.packageId}><th scope="row">{r.packageName}</th><td>{r.balai}</td><td>{r.dailyRecords}</td><td>{r.audit.total?`${r.audit.sesuai} / ${r.audit.total}`:'Belum ada keputusan'}</td><td>{r.openCorrections}</td><td><button className="btn sm" type="button" onClick={()=>p.openPackage(r.packageId)}>Lihat paket</button></td></tr>)}</tbody></table>{!packageRows.length&&emptyMessage}</div></Section>;
 const tableDecisions=<Section title="Keputusan QA/QC terkini" icon={ShieldCheck}><div className="cm-table-scroll"><table data-testid="table-compliance-decisions"><thead><tr><th>Tahap</th><th>Sesuai / Lulus</th><th>Temuan / Ditolak</th><th>Keputusan tercatat</th></tr></thead><tbody>{([['Review berkala',summary.periodic],['V&V bertahap',summary.staged],['Audit tingkat 1–3',summary.audit]] as const).map(([label,c])=><tr key={label}><th scope="row">{label}</th><td>{c.sesuai}</td><td>{c.temuan}</td><td>{c.total}</td></tr>)}</tbody></table></div></Section>;
 const months=<Section title="Volume rekaman survei berdasarkan periode" icon={TrendingUp}><div className="cm-months">{summary.byMonth.length?summary.byMonth.map(m=><div className="cm-month" key={m.month}><span>{m.month}</span><div className="cm-bar" aria-label={`${m.records} rekaman pada ${m.month}`}><div style={{width:`${Math.round(100*m.records/Math.max(...summary.byMonth.map(v=>v.records)))}%`}}/></div><strong>{m.records} rekaman</strong></div>):emptyMessage}</div></Section>;
 const source=<Section title={kind==='admin'?'Jejak ketersediaan rekaman':'Paket dan sumber keputusan'} icon={ClipboardCheck}><div className="cm-table-scroll"><table data-testid="table-compliance-source"><thead><tr><th>Paket</th><th>Balai</th><th>Rekaman pada periode</th><th>Audit terkini</th><th>Koreksi terbuka</th><th>Akses</th></tr></thead><tbody>{packageRows.map(r=><tr key={r.packageId}><th scope="row">{r.packageName}</th><td>{r.balai}</td><td>{r.dailyRecords}</td><td>{r.audit.total?`${r.audit.sesuai} / ${r.audit.total}`:'Belum ada keputusan'}</td><td>{r.openCorrections}</td><td><button className="btn sm" type="button" onClick={()=>p.openPackage(r.packageId)}>Lihat paket</button></td></tr>)}</tbody></table>{!packageRows.length&&emptyMessage}</div></Section>;
 return <main className="cm-workspace" data-testid="compliance-workspace">
  <PageHeading label={titles[kind]} detail={explanations[kind]} action={<button className="btn" type="button" onClick={download} data-testid="button-export-compliance"><ArrowDownToLine size={15}/>Ekspor CSV</button>}/>
  <div className="cm-filters" role="group" aria-label="Filter Analisis dan Kepatuhan">
   {kind!=='balai'&&<label>Wilayah Balai<select value={balai} onChange={e=>setBalai(e.target.value)} aria-label="Filter Balai analisis"><option>Semua Balai</option>{choices.map(v=><option key={v}>{v}</option>)}</select></label>}
   <label>Temukan paket<input value={search} onChange={e=>setSearch(e.target.value)} aria-label="Cari paket dalam analisis" placeholder="Cari nama atau ID paket"/></label>
   <label className="cm-period">Periode rekaman<select value={period} onChange={e=>setPeriod(e.target.value)} aria-label="Periode rekaman analisis"><option value="Semua periode">Semua periode</option>{periods.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
   <button type="button" className="btn sm" onClick={()=>{setBalai('Semua Balai');setSearch('');setPeriod(initialPeriod);}} disabled={balai==='Semua Balai'&&!search&&period===initialPeriod}><RotateCcw size={14}/>Reset</button>
  </div>
  <div className="cm-kpis" aria-label="Ringkasan analisis">
   <KPI icon={ClipboardCheck} label="Paket tercakup" value={String(summary.packages)} note={`${summary.balais} Balai dalam akses aktif`} testId="kpi-compliance-packages"/>
   {kind!=='admin'&&<KPI icon={ShieldCheck} label="Audit lulus / keputusan" value={summary.audit.total?`${summary.audit.sesuai} / ${summary.audit.total}`:'Belum ada keputusan'} note="Hasil final yang masih berlaku" testId="kpi-compliance-audits" tone="green"/>}
   <KPI icon={FileWarning} label="Koreksi terbuka" value={String(summary.openCorrections)} note={`${summary.closedCorrections} koreksi ditutup · status terkini`} testId="kpi-compliance-rework" tone="amber"/>
   <KPI icon={BarChart3} label="Rekaman pada periode" value={String(summary.dailyRecords)} note="Jumlah rekaman, bukan panjang jalan" testId="kpi-compliance-records"/>
  </div>
  {kind==='admin'?<div className="cm-layout"><div className="cm-wide">{view==='comparison'?tableBalai:source}</div>{view==='comparison'?tableSurvey:months}</div>:
    view==='trend'?<div className="cm-layout"><div className="cm-wide">{months}</div>{tableSurvey}</div>:
    view==='comparison'?<div className="cm-layout"><div className="cm-wide">{kind==='balai'?tablePackages:tableBalai}</div>{tableSurvey}</div>:
    kind==='balai'?<div className="cm-layout"><div className="cm-wide">{source}</div>{tableDecisions}{tableSurvey}</div>:
    <div className="cm-layout"><div className="cm-wide">{tableBalai}</div>{tableDecisions}{source}</div>}
 </main>;
}
