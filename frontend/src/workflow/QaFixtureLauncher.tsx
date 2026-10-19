import { useState } from 'react';
import { createDemoWorkflow, type DemoCheckpointId } from './demoScenario';
import type { OperationalWorkflowState } from './model';

const OPTIONS: { id: DemoCheckpointId; label: string; detail: string }[] = [
  { id: 'stage4-ready', label: 'Tahap 4 — Siap pemeriksaan', detail: 'Prasyarat sebelumnya disiapkan khusus untuk pengujian; cek RNI/LRS dan kesiapan data.' },
  { id: 'audit1-provider', label: 'Tahap 5 — Audit 1 (Penyedia)', detail: 'Audit internal dimulai; checklist dan keputusan belum dianggap lulus.' },
  { id: 'audit2-balai', label: 'Tahap 5 — Audit 2 (Balai)', detail: 'Audit 1 dicontohkan lulus sebagai fixture, lalu Balai memeriksa Audit 2.' },
  { id: 'audit3-directorate', label: 'Tahap 5 — Audit 3 (Direktorat)', detail: 'Audit 1–2 dicontohkan lulus sebagai fixture, lalu Direktorat memeriksa Audit 3.' },
  { id: 'acceptance-balai', label: 'Tahap 6 — Penerimaan Data', detail: 'Audit 1–3 disiapkan sebagai contoh lulus; keputusan penerimaan tetap diperiksa sesuai aturan.' },
];
export const QA_FIXTURE_ID = 'PAKET-QA-45-LOKAL';
export function buildQaFixture(id: DemoCheckpointId): OperationalWorkflowState {
  const state = createDemoWorkflow(id);
  state.project = {
    ...state.project,
    id: QA_FIXTURE_ID,
    packageName: 'Paket Contoh QA/QC — Uji Tahap 4–6',
  };
  // Melengkapi data contoh saja, tidak mengubah aturan gerbang workflow operasional.
  const standardRecord=state.calibrations[0];
  for (const type of state.project.surveyTypes) {
    if (state.calibrations.some(item=>item.surveyType===type)) continue;
    if(!standardRecord) break;
    state.calibrations.push({
      ...standardRecord,
      id:`CAL-QA-${type.replace(/[^a-z0-9]/gi,'-')}`,
      surveyType:type,
      equipment:`Peralatan simulasi ${type}`,
      serialNumber:`QA-${type.replace(/[^a-z0-9]/gi,'-')}-001`,
      condition:'Baik',
      dueDate:'2028-12-31',
      qualificationValid:true,
      trainingVerified:true,
      certificateReference:`QA-CERT-${type.replace(/[^a-z0-9]/gi,'-')}`,
    });
  }
  if (id === 'stage4-ready') {
    // Titik uji Tahap 4 belum dinyatakan VALID, agar gerbang operasional diuji sungguhan.
    state.submission.validationStatus = 'Draft';
    state.submission.validationMessage = 'Data contoh siap diperiksa pada Tahap 4; belum lulus gerbang.';
  }
  state.events = [];
  return state;
}
export function QaFixtureLauncher({ onCreate, hasFixture }: {
  onCreate: (id: DemoCheckpointId) => void;
  hasFixture: boolean;
}) {
  const [checkpoint, setCheckpoint] = useState<DemoCheckpointId>('stage4-ready');
  const current = OPTIONS.find(item => item.id === checkpoint)!;
  return <section data-testid="qa-fixture-launcher" style={{padding:16,background:'#fff',border:'1px solid #b7d6e6',borderRadius:12,marginBottom:16}}>
    <div style={{fontWeight:800,color:'#173f59',fontSize:14}}>Paket ketiga — skenario uji Tahap 4–6</div>
    <p style={{fontSize:12,color:'#536e7c',margin:'7px 0'}}>Pilih titik awal untuk menguji alur nyata dengan data contoh. Kedua paket lain tidak berubah; hasil uji bukan persetujuan resmi.</p>
    <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
      <label htmlFor="qa-scenario" style={{fontSize:12}}>Mulai dari</label>
      <select id="qa-scenario" data-testid="select-qa-scenario" value={checkpoint} onChange={e=>setCheckpoint(e.target.value as DemoCheckpointId)} style={{padding:'9px 10px',border:'1px solid #b8cdd8',borderRadius:6,minWidth:210}}>
        {OPTIONS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <button type="button" data-testid="button-create-qa-fixture" onClick={()=>{
        if(hasFixture && !window.confirm('Ini akan MENIMPA paket QA lokal sebelumnya (bukan dua paket kerja). Lanjutkan?')) return;
        onCreate(checkpoint);
      }} style={{border:0,borderRadius:6,padding:'10px 13px',color:'#fff',background:'#166c5b',cursor:'pointer',fontWeight:700}}>{hasFixture?'Siapkan skenario':'Siapkan paket contoh'}</button>
    </div>
    <p style={{fontSize:11,color:'#657c87',margin:'9px 0 0'}}>{current.detail} Status yang disiapkan adalah fixture untuk uji fungsi, bukan hasil evaluasi sungguhan.</p>
  </section>;
}
