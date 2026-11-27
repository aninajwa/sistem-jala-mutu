import { useState } from 'react';
import { projectVolume, type VolumeRow } from './volumeProgress';
import { WorkPanel, WorkLink } from '../design/b/Patterns';
export function VolumeProgressPanel({rows,packages,survey,onOpen}: {rows:readonly VolumeRow[];packages:Record<string,string>;survey:string;onOpen:(id:string)=>void}) {
 const [semester,setSemester]=useState('');
 const scoped=projectVolume(rows,new Set(Object.keys(packages)),survey);
 const visible=scoped.filter(r=>!semester||r.semester===semester);
 const format=(n:number)=>n.toLocaleString('id-ID',{maximumFractionDigits:2});
 return <WorkPanel title="Target dan realisasi volume" action={<label className="bi-volume-filter">Semester <select aria-label="Semester volume" value={semester} onChange={e=>setSemester(e.target.value)}><option value="">Semua semester</option>{[...new Set(scoped.map(r=>r.semester))].sort().map(s=><option key={s}>{s}</option>)}</select></label>}>
 <p className="subtle">Volume kumulatif per lokasi dan semester; tidak mengikuti filter tanggal sesi harian.</p>
 {!visible.length?<p className="subtle">Belum ada target volume pada cakupan ini.</p>:<div className="bi-volume-list">{visible.map(r=><div key={JSON.stringify([r.packageId,r.locationId,r.surveyType,r.semester])} className="bi-volume-row"><div className="bi-volume-head"><strong>{r.surveyType} · {r.locationId}</strong><WorkLink onClick={()=>onOpen(r.packageId)}>Buka paket</WorkLink></div><small>{packages[r.packageId]} · {r.semester}</small><div className="bi-volume-head"><span>Target {format(r.target)} {r.unit}</span><strong>{r.percent===null?'Belum terverifikasi':`${format(r.percent)}%`}</strong></div><div className="bi-volume-track" role="img" aria-label={r.percent===null?'Realisasi belum terverifikasi':`Realisasi ${format(r.percent)} persen`}><span style={{width:`${Math.min(100,r.percent??0)}%`}}/></div><small>Realisasi {r.percent===null?'—':`${format(r.realized!)} ${r.unit}`} · Referensi {r.sourceId}</small></div>)}</div>}
 </WorkPanel>;
}
