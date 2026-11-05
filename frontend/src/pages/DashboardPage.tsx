import { useState } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, BarChart3, Building2, CheckCircle2, ClipboardCheck, Database, FileText, MapPinned, Settings, ShieldCheck, TrendingUp } from 'lucide-react';
import { BalaiOsmMap } from '../BalaiOsmMap';
import { KPI, PageHeading, Section } from '../components/app/AppComponents';
import type { PageProps } from '../types';
import { ROLE_HOME_LABELS } from '../workflow/workflowConfig';
import { aggregateDashboard } from './dashboardMetrics';
import { ReviewEvidenceLocalStatus } from './ReviewEvidenceLocalStatus';
import { isReviewPackageInScope } from './reviewEvidenceAccess';
import { CreatePackageDialog } from './CreatePackageDialog';
import './dashboardSummary.css';

const empty = <div className="panel-body subtle">Belum ada data tercatat pada cakupan dan filter ini.</div>;
type ChartRow = {name:string;value:number};
function ChartDetail({name,value,unit,onClose}:{name:string;value:number;unit:string;onClose:()=>void}){
 return <div className="ds-chart-detail" role="status"><div><strong>{name}</strong><span>{value.toLocaleString('id-ID')} {unit} dalam cakupan pilihan.</span></div><button type="button" onClick={onClose} aria-label="Tutup rincian grafik">Tutup</button></div>;
}
function Columns({rows,unit='rekaman'}:{rows:ChartRow[];unit?:string}){
 const [selected,setSelected]=useState<string|null>(null);
 if(!rows.length)return empty;
 const max=Math.max(1,...rows.map(r=>r.value));
 const active=rows.find(r=>r.name===selected);
 return <div className="panel-body ds-columns"><div className="ds-column-plot" aria-label={`Grafik kolom ${unit}`}>
 {rows.map(r=><button type="button" className={`ds-column-item ds-chart-control ${selected===r.name?'is-selected':''}`} key={r.name} onClick={()=>setSelected(selected===r.name?null:r.name)} title={`${r.name}: ${r.value} ${unit}. Klik untuk rincian`} aria-pressed={selected===r.name} aria-label={`${r.name}, ${r.value} ${unit}; tampilkan rincian`}><strong>{r.value.toLocaleString('id-ID')}</strong><span className="ds-column-track"><span className="ds-column-fill" style={{height:`${r.value/max*100}%`}}/></span><span className="ds-column-name">{r.name}</span></button>)}
 </div>{active&&<ChartDetail name={active.name} value={active.value} unit={unit} onClose={()=>setSelected(null)}/>}<p className="ds-chart-note">Pilih kolom untuk melihat rincian jumlah {unit}.</p></div>;
}
function Bars({rows,unit='rekaman'}:{rows:ChartRow[];unit?:string}){
 const [selected,setSelected]=useState<string|null>(null);
 if(!rows.length)return empty;
 const max=Math.max(1,...rows.map(r=>r.value));const active=rows.find(r=>r.name===selected);
 return <div className="panel-body ds-bars">{rows.map(r=><button type="button" key={r.name} className={`ds-bar ds-chart-control ${selected===r.name?'is-selected':''}`} onClick={()=>setSelected(selected===r.name?null:r.name)} title={`${r.name}: ${r.value} ${unit}`} aria-pressed={selected===r.name}><span className="ds-bar-label">{r.name}</span><span className="ds-bar-track"><span className="ds-bar-fill" style={{width:`${r.value/max*100}%`}}/></span><strong className="ds-bar-value">{r.value.toLocaleString('id-ID')}</strong></button>)}{active&&<ChartDetail name={active.name} value={active.value} unit={unit} onClose={()=>setSelected(null)}/>}<p className="ds-chart-note">Pilih kategori untuk melihat rincian.</p></div>;
}
function Trend({rows}:{rows:{label:string;records:number}[]}){
 const [selected,setSelected]=useState<string|null>(null);
 if(!rows.length)return empty;
 const max=Math.max(1,...rows.map(r=>r.records));const width=640,height=180,left=43,right=22,top=20,bottom=39;
 const x=(i:number)=>left+(rows.length===1?(width-left-right)/2:i*(width-left-right)/(rows.length-1));
 const y=(v:number)=>height-bottom-(v/max)*(height-top-bottom);
 const points=rows.map((r,i)=>`${x(i)},${y(r.records)}`).join(' ');
 const active=rows.find(r=>r.label===selected);
 return <div className="panel-body ds-trend"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tren rekaman survei per bulan">
 {[0,.5,1].map(t=><g key={t}><line x1={left} x2={width-right} y1={y(max*t)} y2={y(max*t)} stroke="#e1e9f0" strokeDasharray="4 5"/><text x={left-9} y={y(max*t)+4} textAnchor="end" fill="#60768a" fontSize="11">{Math.round(max*t)}</text></g>)}
 {rows.length>1&&<polyline points={points} fill="none" stroke="#1686c6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}
 {rows.map((r,i)=><g key={r.label}><circle cx={x(i)} cy={y(r.records)} r="5" fill={selected===r.label?'#ef9b42':'#1686c6'} stroke="white" strokeWidth="2"><title>{r.label}: {r.records} rekaman</title></circle><text x={x(i)} y={Math.max(12,y(r.records)-12)} textAnchor="middle" fontSize="11" fill="#164b70">{r.records}</text><text x={x(i)} y={height-12} textAnchor="middle" fontSize="10" fill="#60768a">{r.label}</text></g>)}
 </svg><div className="ds-trend-points" aria-label="Pilih bulan untuk rincian">{rows.map(r=><button type="button" key={r.label} aria-pressed={selected===r.label} className={selected===r.label?'is-selected':''} onClick={()=>setSelected(selected===r.label?null:r.label)}>{r.label}</button>)}</div>{active&&<ChartDetail name={`Bulan ${active.label}`} value={active.records} unit="rekaman" onClose={()=>setSelected(null)}/>}<p className="ds-chart-note">Rekaman tercatat per bulan, bukan tren tingkat kelulusan. Pilih bulan untuk rincian.</p></div>;
}
function Donut({open,closed}:{open:number;closed:number}){
 const [selected,setSelected]=useState<'Terbuka'|'Ditutup'|null>(null);
 const total=open+closed;if(!total)return empty;
 const pct=closed/total*100;
 return <div className="panel-body ds-donut-layout"><div className="ds-donut" role="img" aria-label={`${closed} ditutup dari ${total} kasus`} style={{background:`conic-gradient(#159c90 0 ${pct}%,#ef9b42 ${pct}% 100%)`}}><div className="ds-donut-hole"><strong>{total}</strong><span>Total kasus</span></div></div><div className="ds-donut-legend">{([{name:'Terbuka',value:open,color:'#ef9b42'},{name:'Ditutup',value:closed,color:'#159c90'}] as const).map(r=><button key={r.name} type="button" className={`ds-legend-choice ds-chart-control ${selected===r.name?'is-selected':''}`} onClick={()=>setSelected(selected===r.name?null:r.name)} aria-pressed={selected===r.name}><i style={{background:r.color}}/>{r.name}<strong>{r.value}</strong></button>)}<p className="ds-chart-note">Pilih status untuk melihat jumlah dan proporsinya.</p></div>{selected&&<div className="ds-donut-detail"><ChartDetail name={`${selected} (${Math.round((selected==='Terbuka'?open:closed)/total*100)}%)`} value={selected==='Terbuka'?open:closed} unit="kasus" onClose={()=>setSelected(null)}/></div>}</div>;
}
function StatusStack({rows,unit='kasus'}:{rows:ChartRow[];unit?:string}){
 const [selected,setSelected]=useState<string|null>(null);
 const total=rows.reduce((n,r)=>n+r.value,0);
 if(!total)return empty;
 const palette=['#ef9b42','#139f96','#1686c6','#a785c8'];
 const active=rows.find(r=>r.name===selected);
 return <div className="panel-body ds-stack"><div className="ds-stack-track" role="group" aria-label={`Komposisi ${unit}`}>
 {rows.filter(r=>r.value>0).map((r,i)=><button key={r.name} type="button" title={`${r.name}: ${r.value} ${unit}`} aria-pressed={selected===r.name} aria-label={`${r.name}: ${r.value} ${unit}, ${Math.round(r.value/total*100)} persen`} onClick={()=>setSelected(selected===r.name?null:r.name)} style={{width:`${r.value/total*100}%`,background:palette[i%palette.length]}} className="ds-stack-segment"/>)}</div>
 <div className="ds-stack-legend">{rows.map((r,i)=><button key={r.name} type="button" aria-pressed={selected===r.name} onClick={()=>setSelected(selected===r.name?null:r.name)}><i style={{background:palette[i%palette.length]}}/><span>{r.name}</span><strong>{r.value}</strong><small>{total?Math.round(r.value/total*100):0}%</small></button>)}</div>
 {active&&<ChartDetail name={`${active.name} · ${Math.round(active.value/total*100)}%`} value={active.value} unit={unit} onClose={()=>setSelected(null)}/>}
 </div>;
}
function BalaiRanking({rows,limit,onLimitChange}:{rows:{name:string;packages:number}[];limit:string;onLimitChange:(v:string)=>void}){
 const visible=limit==='Semua'?rows:rows.slice(0,Number(limit));
 return <div className="ds-ranking"><div className="ds-ranking-toolbar"><label>Jumlah Balai <select value={limit} onChange={e=>onLimitChange(e.target.value)}><option value="5">Top 5</option><option value="10">Top 10</option><option value="Semua">Semua</option></select></label><small>Diurutkan berdasarkan jumlah paket · {visible.length} dari {rows.length} Balai</small></div><Bars rows={visible.map(x=>({name:x.name,value:x.packages}))} unit="paket"/></div>;
}
function ProgressSummary({metrics,role}:{metrics:ReturnType<typeof aggregateDashboard>;role:string}){
 const total=metrics.correctionsOpen+metrics.correctionsClosed;
 const closureRate=total?Math.round(metrics.correctionsClosed/total*100):null;
 const acceptanceRate=metrics.packages?Math.round(metrics.accepted/metrics.packages*100):null;
 return <div className="panel-body ds-progress-summary">
  <div className="ds-progress-top">
   <div><span>Paket dalam cakupan</span><strong>{metrics.packages}</strong></div>
   <div><span>Audit perlu review</span><strong>{metrics.auditPending}</strong></div>
   <div><span>Penerimaan akhir</span><strong>{metrics.accepted}</strong></div>
  </div>
  <div className="ds-progress-meter"><div><span>Kasus koreksi ditutup</span><strong>{closureRate===null?'—':`${closureRate}%`}</strong></div><div className="ds-progress-track"><span style={{width:`${closureRate??0}%`}}/></div><small>{metrics.correctionsClosed} dari {total} kasus</small></div>
  <div className="ds-progress-meter"><div><span>Paket dengan penerimaan akhir</span><strong>{acceptanceRate===null?'—':`${acceptanceRate}%`}</strong></div><div className="ds-progress-track is-green"><span style={{width:`${acceptanceRate??0}%`}}/></div><small>{metrics.accepted} dari {metrics.packages} paket</small></div>
  <Link href={role==='Penyedia Jasa / Ketua Tim'?'/packages':'/packages'} className="btn sm">Lihat paket</Link>
 </div>;
}
function SurveyInspectionPanel({surveyTypes,records,role,surveyFilter,reviews,onOpenPackage,allowedPackageIds}:{surveyTypes:string[];records:{name:string;records:number}[];role:string;surveyFilter:string;reviews:ReturnType<typeof aggregateDashboard>['surveyReviews'];onOpenPackage:(id:string)=>void;allowedPackageIds:ReadonlySet<string>}){
 const [selected,setSelected]=useState('Semua');
 const [expanded,setExpanded]=useState<string|null>(null);
 const names=[...new Set([...surveyTypes,...records.map(r=>r.name),...reviews.map(r=>r.surveyType)])].sort();
 const shown=names.filter(n=>(selected==='Semua'||n===selected)&&(surveyFilter==='Semua'||n===surveyFilter));
 return <div className="panel-body ds-inspection">
  <div className="ds-inspection-intro"><div><strong>Hasil review per jenis survei</strong><p>Keputusan eksplisit per paket dan tahap. Referensi eksplisit diperiksa terhadap berkas di perangkat ini; hasilnya bukan verifikasi server atau persetujuan pemeriksa.</p></div><label>Jenis survei <select value={selected} onChange={e=>{setSelected(e.target.value);setExpanded(null);}}><option value="Semua">Semua jenis</option>{names.map(n=><option key={n} value={n}>{n}</option>)}</select></label></div>
  {shown.length===0?<div className="ds-inspection-empty">Belum ada jenis survei dalam cakupan akses.</div>:<div className="ds-inspection-table-wrap"><table className="ds-inspection-table"><thead><tr><th>Jenis survei</th><th>Rekaman</th><th>Keputusan review</th><th>Rincian pemeriksaan</th></tr></thead><tbody>{shown.map(n=>{const items=reviews.filter(r=>r.surveyType===n&&isReviewPackageInScope(r.packageId,allowedPackageIds));const sesuai=items.filter(r=>r.decision==='Sesuai').length;const temuan=items.filter(r=>r.decision==='Temuan').length;return <tr key={n}><th scope="row">{n}</th><td>{records.find(r=>r.name===n)?.records??0}<small>aktivitas tercatat</small></td><td>{items.length?<><strong>{sesuai} sesuai · {temuan} temuan</strong><small>{items.length} keputusan, bukan paket lulus</small></>:<span className="ds-pending">Belum ada keputusan</span>}</td><td>{items.length?<><button type="button" className="btn sm" aria-expanded={expanded===n} onClick={()=>setExpanded(expanded===n?null:n)}>{expanded===n?'Tutup rincian':`Lihat ${items.length} keputusan`}</button>{expanded===n&&<div className="ds-review-details">{items.map((r,i)=><div className="ds-review-item" key={`${r.packageId}-${r.stage}-${i}`}><strong>{r.decision} · {r.packageName}</strong><small>{r.stage} · {r.reviewedAt}</small><small>{r.note||'Catatan tidak diisi'}</small><small>{r.evidenceReferences.length?`Referensi bukti tercatat (${r.evidenceReferences.length}) · status lokal ditampilkan di bawah; keabsahan dan server belum diverifikasi`:'Status bukti: belum ada referensi eksplisit pada keputusan review'}</small>{r.evidenceReferences.map(ref=><ReviewEvidenceLocalStatus key={ref} packageId={r.packageId} reference={ref}/>)}<button type="button" className="btn sm" onClick={()=>onOpenPackage(r.packageId)} aria-label={`Buka paket ${r.packageName} untuk memeriksa bukti`}>Periksa paket dan bukti</button></div>)}</div>}</>:<span className="ds-pending">Belum tersedia</span>}</td></tr>})}</tbody></table></div>}
  <div className="ds-inspection-foot"><span><strong>{reviews.filter(r=>shown.includes(r.surveyType)).length} keputusan review</strong> tercatat. Belum dapat dinyatakan sebagai persentase kepatuhan atau penerimaan akhir.</span><Link className="btn sm" href={role==='Penyedia Jasa / Ketua Tim'?'/packages':'/verification'}>Buka pemeriksaan</Link></div>
 </div>;
}
function TrendQualityNotice({reviews}:{reviews:ReturnType<typeof aggregateDashboard>['surveyReviews']}){
 const monthly=new Map<string,{sesuai:number;temuan:number}>();
 for(const r of reviews){const month=r.reviewedAt.slice(0,7);const v=monthly.get(month)??{sesuai:0,temuan:0};v[r.decision==='Sesuai'?'sesuai':'temuan']++;monthly.set(month,v);}
 return <div className="panel-body ds-quality-notice"><div className="ds-quality-icon"><ShieldCheck size={24}/></div><div><strong>Riwayat keputusan review yang tercatat</strong>{monthly.size?<div className="ds-review-months">{[...monthly].sort(([a],[b])=>a.localeCompare(b)).map(([month,v])=><div key={month}><strong>{month}</strong><span>{v.sesuai} sesuai · {v.temuan} temuan</span></div>)}</div>:<p>Belum ada keputusan review bertanggal dalam cakupan akses.</p>}<p className="ds-chart-note">Ini tren jumlah keputusan review, bukan tren persentase kepatuhan, bukan hasil audit final. Review berkala dan V&amp;V bertahap dihitung sebagai peristiwa berbeda.</p></div></div>;
}
function AttentionList({items,onOpen}:{items:ReturnType<typeof aggregateDashboard>['attention'];onOpen:(id:string)=>void}){
 if(!items.length)return empty;
 return <div className="panel-body ds-attention-list">{items.map(item=><div key={item.id} className="ds-attention-row"><div><strong>{item.name}</strong><span>{item.balai}</span><small>{item.open} koreksi terbuka · {item.pending} dalam proses tindak lanjut/review</small></div><button type="button" className="btn sm" onClick={()=>onOpen(item.id)}>Lihat paket</button></div>)}</div>;
}
export default function DashboardPage(p:PageProps & { canCreatePackage?: boolean }){
 const [createPackageOpen,setCreatePackageOpen]=useState(false);
 const role=p.workflow.role;
 const admin=role==='Admin',provider=role==='Penyedia Jasa / Ketua Tim',balai=role==='PIC Balai / Pengguna Jasa';
 const [balaiFilter,setBalaiFilter]=useState('Semua Balai');
 const [surveyFilter,setSurveyFilter]=useState('Semua');
 const [periodFilter,setPeriodFilter]=useState('Semua periode');
 const [packageFilter,setPackageFilter]=useState('Semua paket');
 const [attentionFilter,setAttentionFilter]=useState('Semua kondisi');
 const [balaiLimit,setBalaiLimit]=useState('10');
 const tab=p.activeTab;
 const overview=tab==='Semua';
 const entries=Object.entries(p.packages);
 const balaiOptions=[...new Set(entries.map(([,x])=>x.project.balai).filter(Boolean))].sort();
 const packageOptions=entries.filter(([,x])=>balaiFilter==='Semua Balai'||x.project.balai===balaiFilter).map(([id,x])=>({id,name:x.project.packageName||id})).sort((a,b)=>a.name.localeCompare(b.name));
 const surveyOptions=[...new Set(entries.flatMap(([,x])=>x.project.surveyTypes))].sort();
 const datedRecords=entries.flatMap(([,x])=>x.dailyRecords).filter(r=>r.state==='Tercatat' && /^\d{4}-\d{2}-\d{2}$/.test(r.date));
 const years=[...new Set(datedRecords.map(r=>r.date.slice(0,4)))].sort().reverse();
 const months=[...new Set(datedRecords.map(r=>r.date.slice(0,7)))].sort().reverse();
 const periodChoices=[{value:'Semua periode',label:'Semua tanggal rekaman'},...years.map(y=>({value:`Tahun ${y}`,label:`Tahun ${y}`})),...months.map(m=>({value:`Bulan ${m}`,label:new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(new Date(`${m}-01T12:00:00`))}))];
 const scopedPackages=packageFilter==='Semua paket'?p.packages:Object.fromEntries(entries.filter(([id])=>id===packageFilter));
 const usePeriod=overview||tab==='Tren'||tab==='Kepatuhan';
 const metrics=aggregateDashboard(scopedPackages,role,admin?'Semua Balai':balaiFilter,admin?'Semua':surveyFilter,usePeriod?periodFilter:'Semua periode');
 const showBalai=!admin&&!provider&&(overview||tab==='Kepatuhan'||tab==='Tren'||tab==='Perlu perhatian');
 const showPackage=!admin&&(provider||balai)&&(overview||tab==='Kepatuhan'||tab==='Tren');
 const showSurvey=!admin&&(overview||tab==='Kepatuhan'||tab==='Tren');
 const showPeriod=!admin&&usePeriod;
 const showAttention=!admin&&!provider&&tab==='Perlu perhatian';
 const showFilters=showBalai||showPackage||showSurvey||showPeriod||showAttention;
 const rankedBalai=[...metrics.byBalai].sort((a,b)=>b.packages-a.packages||a.name.localeCompare(b.name));
 const selectedAttention=metrics.attention.filter(item=>attentionFilter==='Semua kondisi'||(attentionFilter==='Ada koreksi terbuka'?item.open>0:item.pending>0));
 const kpis=admin?[
  [Database,'Paket tercatat',metrics.packages,'Dalam cakupan tersedia','blue'],
  [Building2,'Balai tercatat',metrics.balai,'Dari referensi paket','blue'],
  [ShieldCheck,'Log aktivitas lokal',p.store.logs.length,'Belum merupakan audit trail server','green'],
  [Settings,'Integrasi backend','Belum aktif','Autentikasi dan API perlu diuji','amber'],
 ]:provider?[
  [FileText,'Paket saya',metrics.packages,'Paket dalam cakupan akses','blue'],
  [BarChart3,'Rekaman survei',metrics.dailyRecords,'Rekaman tercatat','blue'],
  [AlertTriangle,'Koreksi terbuka',metrics.correctionsOpen,'Belum ditutup','amber'],
  [CheckCircle2,'Penerimaan akhir',metrics.accepted,'Paket dengan penerimaan final','green'],
 ]:balai?[
  [Building2,'Paket kewenangan',metrics.packages,'Sesuai cakupan akses','blue'],
  [ClipboardCheck,'Audit dalam review',metrics.auditPending,'Tahap audit dalam review/klarifikasi','amber'],
  [AlertTriangle,'Koreksi terbuka',metrics.correctionsOpen,'Perlu pemantauan','amber'],
  [BarChart3,'Rekaman tercatat',metrics.dailyRecords,'Dari paket dalam cakupan','blue'],
 ]:[
  [Building2,'Balai tercatat',metrics.balai,'Dalam cakupan akses','blue'],
  [FileText,'Paket monitoring',metrics.packages,'Paket yang dapat diakses','blue'],
  [AlertTriangle,'Koreksi terbuka',metrics.correctionsOpen,'Belum ditutup','amber'],
  [ClipboardCheck,'Audit dalam review',metrics.auditPending,'Dalam review/klarifikasi','amber'],
 ];
 const heading=tab==='Kepatuhan'?'Hasil pemeriksaan per survei':tab==='Tren'?'Tren aktivitas dan mutu data':tab==='Perlu perhatian'?'Paket perlu perhatian':tab==='Workflow'?'Status data workflow':ROLE_HOME_LABELS[role];
 return <>
  <PageHeading id="dashboard-main" label={heading} detail={`${role} · Ringkasan monitoring sesuai cakupan akses`} action={<div className="toolbar"><Link href={admin?'/data-master':provider?'/packages':balai?'/verification':'/packages'} className="btn primary">{admin?'Buka data master':provider?'Buka paket saya':balai?'Buka review':'Buka monitoring'}</Link>{p.canCreatePackage&&provider&&<button type="button" className="btn" onClick={()=>setCreatePackageOpen(true)} data-testid="button-create-package">Buat Paket</button>}</div>}/>
  {showFilters&&<div className="ds-filter-panel" aria-label="Filter ringkasan QA/QC">
   <div className="ds-filter-title"><strong>{tab==='Tren'?'Cakupan tren rekaman':tab==='Kepatuhan'?'Cakupan survei':tab==='Perlu perhatian'?'Filter paket perlu perhatian':'Cakupan ringkasan'}</strong></div>
   <div className="ds-filter-fields">
    {showBalai&&<label>Wilayah Balai<select value={balaiFilter} onChange={e=>{setBalaiFilter(e.target.value);setPackageFilter('Semua paket')}}><option value="Semua Balai">Semua Balai dalam akses</option>{balaiOptions.map(x=><option key={x} value={x}>{x}</option>)}</select></label>}
    {showPackage&&<label>Paket<select value={packageFilter} onChange={e=>setPackageFilter(e.target.value)}><option value="Semua paket">Semua paket dalam akses</option>{packageOptions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
    {showSurvey&&<label>Jenis survei<select value={surveyFilter} onChange={e=>setSurveyFilter(e.target.value)}><option value="Semua">Semua jenis</option>{surveyOptions.map(x=><option key={x} value={x}>{x}</option>)}</select></label>}
    {showPeriod&&<label>Periode rekaman survei<select value={periodFilter} onChange={e=>setPeriodFilter(e.target.value)}>{periodChoices.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>}
    {showAttention&&<label>Prioritas<select value={attentionFilter} onChange={e=>setAttentionFilter(e.target.value)}><option>Semua kondisi</option><option>Ada koreksi terbuka</option><option>Menunggu tindak lanjut</option></select></label>}
    <button className="btn sm" type="button" onClick={()=>{setBalaiFilter('Semua Balai');setPackageFilter('Semua paket');setSurveyFilter('Semua');setPeriodFilter('Semua periode');setAttentionFilter('Semua kondisi')}}>Atur ulang</button>
   </div>
  </div>}
  {overview&&<div className="kpi-grid ds-kpi-grid">{kpis.map(([Icon,label,value,note,tone])=><KPI key={String(label)} icon={Icon} label={String(label)} value={String(value)} note={String(note)} tone={String(tone)} testId={`kpi-dashboard-${String(label).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}/>)}</div>}
  {admin? <>
   {overview&&<div className="grid-two">
    <Section title="Paket menurut Balai" icon={Database}><Columns rows={metrics.byBalai.map(b=>({name:b.name,value:b.packages}))} unit="paket"/></Section>
    <Section title="Status integrasi sistem" icon={Settings}><div className="panel-body"><div className="quality-check"><span>Data paket</span><strong>{metrics.packages} tersedia</strong></div><div className="quality-check"><span>Log aktivitas frontend</span><strong>{p.store.logs.length} catatan</strong></div><div className="quality-check"><span>API, login dan otorisasi server</span><strong>Belum diverifikasi</strong></div><div className="subtle" style={{marginTop:10}}>Admin memantau sistem tanpa mengambil keputusan teknis QA/QC.</div></div></Section>
   </div>}
   {overview&&<div className="grid-two"><Section title="Rekaman survei yang tercatat" icon={BarChart3}><Columns rows={metrics.bySurvey.map(r=>({name:r.name,value:r.records}))}/></Section><Section title="Aktivitas pencatatan bulanan" icon={TrendingUp}><Trend rows={metrics.trend}/></Section></div>}
   {tab==='Workflow'&&<div className="grid-two"><Section title="Kesiapan aliran data" icon={Settings}><div className="panel-body"><div className="quality-check"><span>Data paket yang dapat dibaca</span><strong>{metrics.packages}</strong></div><div className="quality-check"><span>Catatan aktivitas lokal</span><strong>{p.store.logs.length}</strong></div><div className="quality-check"><span>Integrasi API dan autentikasi</span><strong>Belum diverifikasi</strong></div></div></Section><Section title="Catatan pengelolaan" icon={ShieldCheck}><div className="panel-body ds-explain"><strong>Monitoring sistem, bukan persetujuan teknis</strong><p>Ringkasan ini hanya menunjukkan data yang tersedia di frontend. Audit trail server, sinkronisasi, dan otorisasi final harus diverifikasi bersama backend.</p><Link href="/data-master" className="btn sm">Buka Data Master</Link></div></Section></div>}
  </>:<>
   {overview&&<div className="grid-two">
    <Section id="dashboard-compliance" title="Aktivitas survei menurut jenis" icon={BarChart3}><Columns rows={metrics.bySurvey.map(s=>({name:s.name,value:s.records}))}/></Section>
    <Section title="Komposisi kasus koreksi" icon={AlertTriangle}><Donut open={metrics.correctionsOpen} closed={metrics.correctionsClosed}/></Section>
   </div>}
   {overview&&<div className="grid-two">
    <Section id="dashboard-trend" title="Tren pencatatan per bulan" icon={TrendingUp}><Trend rows={metrics.trend}/></Section>
    {provider?<Section title="Koreksi terbuka menurut paket" icon={AlertTriangle}><Bars rows={metrics.attention.filter(x=>x.open>0).map(x=>({name:x.name,value:x.open}))} unit="koreksi terbuka"/></Section>:balai?<Section title="Akses antrean pemeriksaan" icon={ClipboardCheck}><div className="panel-body ds-action-panel"><strong>Periksa paket dalam kewenangan Balai</strong><p>{metrics.auditPending} audit masih dalam review/klarifikasi. Detail temuan dan keputusan diperiksa di modul Verifikasi & Review.</p><Link className="btn sm" href="/verification">Buka antrean review</Link></div></Section>:<Section title="Sebaran paket lintas Balai" icon={Building2}><BalaiRanking rows={rankedBalai} limit={balaiLimit} onLimitChange={setBalaiLimit}/></Section>}
   </div>}
   {overview&&<div className="grid-two ds-overview-secondary">
    {balai?<Section title="Paket perlu tindak lanjut" icon={AlertTriangle}><AttentionList items={metrics.attention} onOpen={p.openPackage}/></Section>:provider?<Section title="Progres penyelesaian" icon={ShieldCheck}><ProgressSummary metrics={metrics} role={role}/></Section>:<Section title="Progres tindak lanjut" icon={ShieldCheck}><ProgressSummary metrics={metrics} role={role}/></Section>}
    {balai?<Section title="Progres tindak lanjut" icon={ShieldCheck}><ProgressSummary metrics={metrics} role={role}/></Section>:provider?<Section title="Langkah selanjutnya" icon={ClipboardCheck}><div className="panel-body ds-action-panel"><strong>Lanjutkan pemeriksaan dan koreksi paket</strong><p>Rincian pekerjaan, bukti, dan verifikasi ulang tersedia di modul paket dan tindakan perbaikan.</p><Link className="btn sm" href="/packages">Buka paket saya</Link></div></Section>:<Section title="Peta monitoring wilayah" icon={MapPinned}><div className="panel-body"><BalaiOsmMap surveys={[]}/><p className="ds-chart-note">Peta dasar saja. Penanda menunggu geometri/koordinat yang sah; tidak ada titik simulasi.</p></div></Section>}
   </div>}
   {overview&&!provider&&!balai&&<Section title="Paket perlu perhatian" icon={AlertTriangle}><AttentionList items={metrics.attention} onOpen={p.openPackage}/></Section>}
   {tab==='Kepatuhan'&&<>
    <Section id="dashboard-compliance" title="Matriks hasil pemeriksaan per jenis survei" icon={ClipboardCheck}><SurveyInspectionPanel surveyTypes={surveyOptions} records={metrics.bySurvey} role={role} surveyFilter={surveyFilter} reviews={metrics.surveyReviews} onOpenPackage={p.openPackage} allowedPackageIds={new Set(Object.keys(scopedPackages))}/></Section>
    <div className="grid-two"><Section title="Status pemeriksaan tingkat paket" icon={ShieldCheck}><div className="panel-body ds-action-panel"><strong>Ringkasan pemeriksaan paket</strong><p>Audit dalam review/klarifikasi: <b>{metrics.auditPending}</b>. Koreksi terbuka: <b>{metrics.correctionsOpen}</b>. Angka ini tidak diatribusikan otomatis ke IRI, PCI, atau jenis survei lainnya.</p><Link className="btn sm" href={provider?'/packages':'/verification'}>Telusuri pemeriksaan</Link></div></Section><Section title="Prinsip perhitungan kepatuhan" icon={FileText}><div className="panel-body ds-action-panel"><strong>Belum ada persentase yang sah</strong><p>Persentase hanya dihitung dari keputusan pemeriksaan yang jelas objek, jenis survei, periode, pembilang, penyebut, dan bukti sumbernya. Tidak menggunakan jumlah rekaman sebagai pengganti hasil.</p></div></Section></div>
   </>}
   {tab==='Tren'&&<>
    <div className="grid-two"><Section id="dashboard-trend" title="Tren aktivitas pencatatan" icon={TrendingUp}><Trend rows={metrics.trend}/></Section><Section title="Tren mutu hasil pemeriksaan" icon={ShieldCheck}><TrendQualityNotice reviews={metrics.surveyReviews}/></Section></div>
    <Section title="Konteks data aktivitas" icon={Database}><div className="panel-body ds-action-panel"><strong>{metrics.dailyRecords} rekaman tercatat · {metrics.trend.length} bulan dengan aktivitas</strong><p>Filter periode dan jenis survei membatasi aktivitas rekaman. Status koreksi, audit, dan penerimaan tetap dihitung pada tingkat paket, sehingga tidak diperlakukan sebagai hasil mutu per survei atau per bulan.</p></div></Section>
   </>}
   {!provider&&tab==='Perlu perhatian'&&<div className="grid-two">
    <Section title="Peta monitoring wilayah" icon={MapPinned}><div className="panel-body"><BalaiOsmMap surveys={[]} /><div className="subtle" style={{marginTop:8}}>Peta dasar aktif. Penanda ruas belum ditampilkan sampai koordinat/geometri yang sah tersedia dari sumber data. Tidak menggunakan titik simulasi.</div></div></Section>
    <Section title="Paket perlu perhatian" icon={AlertTriangle}><AttentionList items={selectedAttention} onOpen={p.openPackage}/></Section>
   </div>}
  </>}

   {createPackageOpen&&p.canCreatePackage&&<CreatePackageDialog onClose={()=>setCreatePackageOpen(false)} onCreated={item=>{setCreatePackageOpen(false);p.setNotice(`Paket DRAFT #${item.paket_id} berhasil dibuat di server.`);}}/>}
  </>;
}
