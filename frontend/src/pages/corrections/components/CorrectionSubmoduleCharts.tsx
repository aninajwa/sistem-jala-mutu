import {useState} from 'react';
import type {WorkflowRole} from '../../../workflow/model';
import type {CorrectionRow} from '../correctionViewModel';
import {STATUS_LABEL,STATUS_ORDER,isOverdue,dueInSevenDays} from '../correctionViewModel';
import './CorrectionSubmoduleCharts.css';

type Datum={label:string;value:number};
type Spec={title:string;kind:'donut'|'bars';data:Datum[]};
const COLORS=['#2563eb','#0d9488','#d97706','#7c3aed','#e11d48','#64748b'];
const counts=(rows:CorrectionRow[],fn:(r:CorrectionRow)=>string):Datum[]=>{
 const map=new Map<string,number>();
 rows.forEach(r=>{const key=fn(r)?.trim()||'Belum ditentukan';map.set(key,(map.get(key)??0)+1)});
 return [...map].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,8);
};
const status=(rows:CorrectionRow[])=>STATUS_ORDER.map(s=>({label:STATUS_LABEL[s],value:rows.filter(r=>r.status===s).length})).filter(x=>x.value>0);
function chartSpec(role:WorkflowRole,tab:string,rows:CorrectionRow[]):Spec[]{
 const priority=()=>counts(rows,r=>r.severity),actions=()=>counts(rows,r=>r.actionType),balai=()=>counts(rows,r=>r.balai);
 if(role==='Penyedia Jasa / Ketua Tim'){
  if(tab==='Tugas Saya')return [{title:'Status tugas',kind:'donut',data:status(rows)},{title:'Jenis tindakan',kind:'bars',data:actions()}];
  if(tab==='Menunggu Verifikasi')return [{title:'Status pengajuan',kind:'donut',data:status(rows)}];
  return [];
 }
 if(role==='PIC Balai / Pengguna Jasa'){
  if(tab==='Tindak Lanjut Paket')return [{title:'Progres kasus',kind:'donut',data:status(rows)},{title:'Prioritas kasus',kind:'bars',data:priority()}];
  if(tab==='Verifikasi Ulang')return [{title:'Jenis tindakan yang diuji ulang',kind:'bars',data:actions()}];
  return [];
 }
 if(role==='Direktorat / Pusat'){
  if(tab==='Temuan Lintas Paket')return [{title:'Kasus per Balai',kind:'bars',data:balai()},{title:'Status lintas Balai',kind:'donut',data:status(rows)}];
  if(tab==='Audit Tingkat 3')return [{title:'Status temuan terkait Audit Tingkat 3',kind:'donut',data:status(rows)}];
  if(tab==='Verifikasi Ulang')return [{title:'Uji ulang menurut Balai',kind:'bars',data:balai()}];
  if(tab==='Riwayat')return [{title:'Kasus selesai menurut Balai',kind:'bars',data:balai()}];
  return [];
 }
 if(tab==='Monitoring Kasus')return [{title:'Status seluruh kasus',kind:'donut',data:status(rows)},{title:'Prioritas kasus',kind:'bars',data:priority()}];
 if(tab==='Notifikasi & SLA')return [{title:'Kondisi tenggat',kind:'donut',data:[{label:'Terlambat',value:rows.filter(isOverdue).length},{label:'≤ 7 hari',value:rows.filter(r=>!isOverdue(r)&&dueInSevenDays(r)).length}].filter(x=>x.value>0)}];
 return [];
}
function Card({spec}:{spec:Spec}){
 const [selected,setSelected]=useState<string|null>(null);
 const total=spec.data.reduce((n,x)=>n+x.value,0);
 const active=spec.data.find(x=>x.label===selected);
 const circumference=2*Math.PI*48;
 let segmentOffset=0;
 const segments=spec.data.map((x,i)=>{const dash=total?circumference*x.value/total:0;const item={...x,color:COLORS[i%COLORS.length],dash,offset:segmentOffset};segmentOffset+=dash;return item;});
 return <article className="corr-sub-chart-card"><h4>{spec.title}</h4>{total===0?<p className="corr-sub-chart-empty">Belum ada kasus pada kategori ini.</p>:<>
 {spec.kind==='donut'?<div className="corr-chart-content"><div className="corr-donut">
  <svg className="corr-donut-svg" viewBox="0 0 132 132" role="group" aria-label={`Distribusi ${spec.title.toLowerCase()}`}>
   {segments.map(x=><circle key={x.label} className={`corr-donut-slice ${selected===x.label?'is-selected':''}`} cx="66" cy="66" r="48" fill="none" stroke={x.color} strokeWidth={selected===x.label?30:27} strokeDasharray={`${x.dash} ${circumference-x.dash}`} strokeDashoffset={-x.offset} transform="rotate(-90 66 66)" onClick={()=>setSelected(selected===x.label?null:x.label)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(selected===x.label?null:x.label)}}} role="button" tabIndex={0} aria-pressed={selected===x.label} aria-label={`${x.label}: ${x.value} kasus, ${Math.round(100*x.value/total)} persen`}/>) }
  </svg>
  <div className="corr-donut-center"><strong>{active?.value??total}</strong><span>{active?'Terpilih':'Kasus'}</span></div>
 </div><div className="corr-chart-legend">{spec.data.map((x,i)=><button type="button" key={x.label} className={`corr-chart-choice ${selected===x.label?'is-selected':''}`} onClick={()=>setSelected(selected===x.label?null:x.label)} aria-pressed={selected===x.label}><i style={{background:COLORS[i%COLORS.length]}}/><span>{x.label}</span><strong>{x.value}</strong></button>)}</div></div>
 :<div className="corr-chart-bars">{spec.data.map((x,i)=><button type="button" className={`corr-chart-bar-row ${selected===x.label?'is-selected':''}`} key={x.label} onClick={()=>setSelected(selected===x.label?null:x.label)} aria-pressed={selected===x.label} title={`Lihat rincian ${x.label}`}><span className="corr-chart-bar-label">{x.label}</span><span className="corr-chart-bar-track"><i style={{width:`${100*x.value/Math.max(...spec.data.map(d=>d.value),1)}%`,background:COLORS[i%COLORS.length]}}/></span><strong>{x.value}</strong></button>)}</div>}
 <div className={`corr-chart-selection ${active?'has-selection':''}`} aria-live="polite">{active?<><span className="corr-selection-kicker">Rincian kategori</span><strong>{active.label}</strong><span>{active.value} dari {total} kasus · {Math.round(active.value/total*100)}%</span><button type="button" onClick={()=>setSelected(null)} aria-label="Tutup rincian kategori">Tutup</button></>:<span>Klik warna donut, legenda, atau batang untuk melihat rincian.</span>}</div>
 </>}</article>
}
export default function CorrectionSubmoduleCharts({role,tab,rows}:{role:WorkflowRole;tab:string;rows:CorrectionRow[]}){
 const specs=chartSpec(role,tab,rows);
 if(!specs.length)return null;
 return <section className={`corr-sub-charts ${role==='Direktorat / Pusat'&&tab==='Riwayat'?'corr-history-compact':''}`} aria-label="Grafik tindakan perbaikan">{specs.map(s=><Card key={`${role}:${tab}:${s.title}`} spec={s}/>)}</section>;
}
