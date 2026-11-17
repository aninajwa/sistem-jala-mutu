import {useState,type ReactNode} from 'react';
import './stage0StepForm.css';

export type Stage0Step = {id:string; title:string; complete:number; total:number; content:ReactNode};

type Props={steps:Stage0Step[]; locked:boolean; status:string};

export function Stage0StepForm({steps,locked,status}:Props){
 const [active,setActive]=useState(()=>Math.max(0,steps.findIndex(step=>step.complete<step.total)));
 const index=Math.min(Math.max(0,active),Math.max(0,steps.length-1));
 const chosen=steps[index];
 const done=steps.reduce((sum,s)=>sum+s.complete,0);
 const total=steps.reduce((sum,s)=>sum+s.total,0);
 if(!chosen)return null;
 return <section className="stage0-step-form" aria-label="Formulir persiapan bertahap">
   <header className="stage0-step-header">
     <div><h3>Formulir persiapan</h3><p>Kerjakan satu kelompok kegiatan pada satu waktu. Semua isian tetap tersimpan pada checklist paket.</p></div>
     <strong className="stage0-step-total">{done}/{total} selesai</strong>
   </header>
   <nav className="stage0-step-nav" aria-label="Kelompok formulir persiapan">
     {steps.map((step,i)=><button key={step.id} type="button" aria-current={i===index?'step':undefined} className={'stage0-step-tab'+(i===index?' active':'')} onClick={()=>setActive(i)}>
       <span className="stage0-step-order">{i+1}</span>
       <span className="stage0-step-tab-text"><strong>{step.title}</strong><small>{step.complete}/{step.total} butir</small></span>
       {step.complete===step.total&&step.total>0&&<span className="stage0-step-done" aria-label="Lengkap">✓</span>}
     </button>)}
   </nav>
   <div className="stage0-step-active" id={'stage0-step-'+chosen.id} aria-live="polite">
     <div className="stage0-step-active-head"><strong>Langkah {index+1} dari {steps.length}: {chosen.title}</strong><span>{chosen.complete} dari {chosen.total} selesai</span></div>
     {locked&&<p className="stage0-step-locked" role="status">Isian terkunci karena status Laporan Pendahuluan: {status}. Untuk revisi, tunggu keputusan PIC Balai.</p>}
     {chosen.content}
     <div className="stage0-step-controls">
       <button type="button" className="wf-button" disabled={index===0} onClick={()=>setActive(i=>Math.max(0,i-1))}>Sebelumnya</button>
       <span>Kelompok {index+1}/{steps.length}</span>
       <button type="button" className="wf-button primary" disabled={index===steps.length-1} onClick={()=>setActive(i=>Math.min(steps.length-1,i+1))}>Berikutnya</button>
     </div>
   </div>
   <p className="stage0-step-footnote">Jumlah selesai menunjukkan centang kegiatan, bukan bukti bahwa seluruh lampiran telah diperiksa. Periksa juga ringkasan bukti dan status review Balai.</p>
 </section>;
}
