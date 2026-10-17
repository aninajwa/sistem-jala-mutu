import { RotateCcw, Route, Users } from 'lucide-react';
import { DEMO_CHECKPOINTS, type DemoCheckpointId } from './demoScenario';
import type { OperationalWorkflowState } from './model';

export function DemoJourneyPanel({state,onLoad,onNavigate}:{state:OperationalWorkflowState;onLoad:(id:DemoCheckpointId)=>void;onNavigate:(selection:string)=>void}){
  const currentPackage=state.project.id==='PAKET-DEMO-E2E-001';
  return <section className="wf-demo-journey" data-testid="demo-journey-panel">
    <div className="wf-demo-head">
      <div><span>MODE PEMBELAJARAN</span><strong>Paket Demo End-to-End Tahap 0–6</strong><small>{currentPackage?'Paket demo aktif. Pilih checkpoint untuk melihat POV role yang berbeda.':'Muat paket demo untuk belajar alur tanpa menunggu API/backend.'}</small></div>
      <button className="wf-button" type="button" onClick={()=>onLoad('start')}><RotateCcw size={13}/> Mulai dari awal</button>
    </div>
    <div className="wf-demo-track">
      {DEMO_CHECKPOINTS.map(step=><button key={step.id} type="button" className={`wf-demo-step ${state.role===step.actor&&currentPackage?'role-match':''}`} onClick={()=>{onLoad(step.id);onNavigate(step.selection);}} title={step.detail}>
        <span className="wf-demo-order">{step.order+1}</span>
        <span><b>{step.stage}</b><small>{step.title}</small></span>
      </button>)}
    </div>
    <div className="wf-demo-hint"><Users size={14}/><span>Setiap checkpoint otomatis mengganti <strong>role aktif + data paket + halaman yang relevan</strong>. Ini hanya seed/mock pembelajaran; tidak menentukan kontrak backend final.</span><Route size={14}/></div>
  </section>;
}
