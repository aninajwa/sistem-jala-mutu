import {useState} from 'react';
import type {WorkflowRole} from './model';
import {DocumentAttachments} from './DocumentAttachments';
import {readLendutanPeriod,saveLendutanPeriod,lendutanSampling,INTERNAL_PARAMETERS,JOINT_PARAMETERS} from './repository/lendutanPeriod';
export function LendutanPeriodReview({scope,phase,role,onChanged}:{scope:string;phase:'internal'|'periodic14';role:WorkflowRole;onChanged:()=>void}){
 const [revision,refresh]=useState(0),[notice,setNotice]=useState('');
 const record=readLendutanPeriod(scope,phase),values=record.values,owner=phase==='internal'?'Penyedia Jasa / Ketua Tim':'PIC Balai / Pengguna Jasa',editable=role===owner;
 const parameters=phase==='internal'?INTERNAL_PARAMETERS:JOINT_PARAMETERS;
 const sample=lendutanSampling(values.total??'',values.sample??'',values.sampleReference??'');
 function update(field:string,value:string){try{saveLendutanPeriod(scope,phase,role,field,value);refresh(revision+1);onChanged();setNotice('Hasil pemeriksaan tersimpan di perangkat.');}catch(e){setNotice(e instanceof Error?e.message:String(e));}}
 function field(name:string,type='text'){const label:Record<string,string>={total:'Total titik dalam periode',sample:'Jumlah titik sampel',sampleReference:'Daftar / referensi titik sampel'};return <label className="wf-field" key={name}>{label[name]??name}<input aria-label={`Lendutan ${label[name]??name}`} type={type} min={type==='number'?0:undefined} step={type==='number'?1:undefined} value={values[name]??''} disabled={!editable} onChange={e=>update(name,e.target.value)}/></label>;}
 return <section className="wf-panel lendutan-period-review"><div className="wf-panel-head"><h3>Lendutan · {phase==='internal'?'V&V Internal':'V&V Bersama / 2-Mingguan'}</h3></div><div className="wf-body">
 <p className="wf-note">Pemeriksaan manual oleh {owner}. Hasil sistem tidak menggantikan keputusan pemeriksa.</p>
 {parameters.map(name=><details key={name} className="structured-checklist-section"><summary>{name}</summary><label className="wf-field">Hasil dan catatan<textarea rows={2} aria-label={`Lendutan ${name}`} disabled={!editable} value={values[name]??''} onChange={e=>update(name,e.target.value)}/></label></details>)}
 {phase==='periodic14'&&<section><h4>Cakupan sampel</h4><div className="wf-fields">{field('total','number')}{field('sample','number')}{field('sampleReference')}</div><p role="status">Hasil sistem: {sample.label} · {sample.reason}</p><small>Sampling 5% digunakan sementara; pengesahan ketentuan untuk penggunaan resmi masih diperlukan.</small></section>}
 <div className="wf-fields">{(phase==='internal'?['Data valid','Data tidak valid','Tindakan perbaikan','Kesimpulan','Rekomendasi']:['Kesimpulan','Rekomendasi']).map(name=>field(name))}</div>
 {notice&&<small role="status">{notice}</small>}
 <details><summary>Riwayat isian ({record.history.length})</summary><ol>{record.history.map((entry,i)=><li key={i}>{entry.at} · {entry.actor} · {entry.field}: {entry.before||'Belum diisi'} → {entry.after||'Dikosongkan'}</li>)}</ol></details>
 </div><DocumentAttachments scope={`${scope}:lendutan-${phase}`} editable={editable} categories={phase==='internal'?['Hasil validasi setiap parameter','Daftar data valid dan tidak valid','Tindakan perbaikan dan rencana tindak lanjut']:['Daftar titik sampel','Hasil verifikasi dan catatan setiap parameter','Rekomendasi perbaikan']} onChanged={onChanged}/></section>;
}
