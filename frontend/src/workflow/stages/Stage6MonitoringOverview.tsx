import { useEffect, useState } from 'react';
import type { OperationalWorkflowState } from '../model';
import { BalaiDecisionHistory } from '../BalaiDecisionHistory';
import { stage6MonitorTabsForRole, type Stage6MonitorTab } from '../stage6Presentation';
import { Stage6DirectorateNotes } from './Stage6DirectorateNotes';
import { Stage6HandoverStatus } from './Stage6HandoverWorkspace';

export function Stage6MonitoringOverview({state,onNavigate,principalId}:{state:OperationalWorkflowState;onNavigate:(selection:string)=>void;principalId?:string}) {
  const directorate=state.role==='Direktorat / Pusat';
  const tabs=stage6MonitorTabsForRole(state.role);
  const [activeTab,setActiveTab]=useState<Stage6MonitorTab>('overview');
  useEffect(()=>setActiveTab('overview'),[state.role,state.project.id]);
  const {acceptance,project}=state;
  const openCorrections=state.corrections.filter(c=>c.status!=='Ditutup');
  const validAudits=state.audits.filter(a=>a.status==='Lulus'&&!a.requiresReview).length;
  const termsComplete=acceptance.terms.filter(t=>t.complete).length;
  const fact=(title:string,value:string|number)=><div className="stage6-metric" key={title}><span>{title}</span><strong>{value}</strong></div>;
  const nav=(text:string,route:string)=><button className="wf-button" type="button" onClick={()=>onNavigate(route)}>{text}</button>;
  return <section className="stage6-monitor" aria-label={directorate?'Pengawasan teknis penerimaan':'Administrasi penerimaan'}>
    <nav className="stage6-tabs" aria-label="Bagian kerja Tahap 6">
      {tabs.map(tab=><button type="button" key={tab.id} data-testid={`stage6-monitor-tab-${tab.id}`}
        className={activeTab===tab.id?'stage6-tab active':'stage6-tab'} aria-current={activeTab===tab.id?'page':undefined}
        onClick={()=>setActiveTab(tab.id)}>{tab.label}</button>)}
    </nav>
    {activeTab==='overview' && <>
      <div className="stage6-metrics">
        {directorate?<>
          {fact('Audit Tingkat 3',state.audits[2]?.requiresReview?'Perlu review ulang':state.audits[2]?.status||'Belum diperiksa')}
          {fact('Audit lulus berlaku',`${validAudits}/3`)}
          {fact('Temuan terbuka',openCorrections.length)}
          {fact('Penerimaan Balai',acceptance.acceptanceDecision||'Belum diperiksa')}
        </>:<>
          {fact('Status penerimaan',acceptance.acceptanceDecision||'Belum diperiksa')}
          {fact('Termin selesai',`${termsComplete}/${acceptance.terms.length}`)}
          {fact('BA parsial',acceptance.partialReceipts.length)}
          {fact('BA akhir',acceptance.finalAcceptanceBa?'Tercatat':'Belum tercatat')}
        </>}
      </div>
      {directorate?<div className="stage6-panel stage6-focus">
        <div className="stage6-section-heading"><h3>Perlu perhatian Direktorat</h3><span>{openCorrections.length} temuan aktif</span></div>
        <div className="stage6-task-list">
          {state.audits[2]?.status!=='Lulus'||state.audits[2]?.requiresReview?<div><strong>Audit Tingkat 3 belum tuntas</strong><span>{state.audits[2]?.requiresReview?'Periksa perubahan data dan keputusan audit sebelumnya.':'Periksa kesiapan audit Direktorat.'}</span></div>:<div><strong>Audit Tingkat 3 berlaku</strong><span>Hasil dapat digunakan untuk meninjau kesiapan penerimaan.</span></div>}
          {openCorrections.length>0?<div><strong>{openCorrections.length} temuan masih terbuka</strong><span>Tinjau tindak lanjut sebelum penerimaan diselesaikan.</span></div>:null}
          {acceptance.acceptanceDecision==='Ditolak'?<div><strong>Balai menolak penerimaan</strong><span>{acceptance.acceptanceRejectionReason||'Buka riwayat pemeriksaan Balai.'}</span></div>:null}
        </div>
        <div className="stage6-actions">{nav('Buka Audit Tingkat 3','/verification:Audit tingkat 1–3')}{openCorrections.length>0&&nav('Lihat tindak lanjut','/actions:Koreksi berbukti')}<button type="button" className="wf-button" onClick={()=>setActiveTab('notes')}>Buka catatan</button></div>
      </div>:<div className="stage6-panel"><div className="stage6-section-heading"><h3>Dokumen penerimaan</h3></div>
        <div className="stage6-details-grid"><div><span>BA akhir</span><strong>{acceptance.finalAcceptanceBa||'Belum tersedia'}</strong></div><div><span>Laporan akhir</span><strong>{acceptance.finalReport?'Tercatat':'Belum tercatat'}</strong></div></div>
        <div className="stage6-actions">{nav('Lihat dokumen mutu','/documents:BA & dokumen workflow')}<button type="button" className="wf-button" onClick={()=>setActiveTab('terms')}>Buka status termin</button></div>
      </div>}
    </>}
    {activeTab==='overview' && <Stage6HandoverStatus packageId={project.id}/> }
    {directorate && activeTab==='audit' && <div className="stage6-panel">
      <div className="stage6-section-heading"><h3>Hasil audit berjenjang</h3><span>Ringkasan hasil tercatat</span></div>
      <div className="stage6-audit-list">{state.audits.map((audit,i)=><div key={i} className="stage6-audit-row">
        <div><strong>Tingkat {i+1} · {['Penyedia','Balai','Direktorat'][i]}</strong><span>{audit.requiresReview?'Perlu pemeriksaan ulang':audit.status}</span></div>
        <span>{audit.sampleUnits?.length??audit.sampleIds.length} unit sampel</span>
      </div>)}</div>
      <div className="stage6-details-grid"><div><span>Jenis survei dalam paket</span><strong>{project.surveyTypes.join(', ')||'Belum ditentukan'}</strong></div><div><span>Data SMD</span><strong>{state.submission.validationStatus||'Belum tercatat'}</strong></div></div>
      <div className="stage6-actions">{nav('Buka pemeriksaan Audit Tingkat 3','/verification:Audit tingkat 1–3')}</div>
    </div>}
    {directorate && activeTab==='notes' && <Stage6DirectorateNotes packageId={project.id} role={state.role} principalId={principalId}/>}
    {activeTab==='terms' && !directorate && <div className="stage6-panel"><div className="stage6-section-heading"><h3>Status termin</h3><span>Data Penyedia, hanya lihat</span></div>
      <div className="stage6-terms-readonly">{acceptance.terms.map(t=><div key={t.id}><strong>{t.id} · {t.percentage}%</strong><span>{t.complete?'Selesai':`Progres ${t.progress??0}%`}</span><small>{t.milestone}</small></div>)}</div>
      <p className="stage6-footnote">Progres termin bukan status pencairan pembayaran.</p>
    </div>}
    {activeTab==='documents' && <div className="stage6-panel">
      <div className="stage6-section-heading"><h3>{directorate?'Dokumen & tindak lanjut':'Dokumen & BA'}</h3><span>Dokumen yang telah tercatat</span></div>
      <div className="stage6-details-grid">
        <div><span>BA penerimaan akhir</span><strong>{acceptance.finalAcceptanceBa||'Belum tercatat'}</strong></div>
        <div><span>BA parsial</span><strong>{acceptance.partialReceipts.join(', ')||'Belum tercatat'}</strong></div>
        <div><span>Laporan akhir</span><strong>{acceptance.finalReport?'Tersedia':'Belum tersedia'}</strong></div>
        <div><span>Keputusan Balai</span><strong>{acceptance.acceptanceDecision||'Belum diperiksa'}</strong></div>
      </div>
      {acceptance.acceptanceRejectionReason && <div className="stage6-inline-warning">Penolakan: {acceptance.acceptanceRejectionReason}</div>}
      <div className="stage6-actions">{nav('Lihat dokumen mutu','/documents:BA & dokumen workflow')}{directorate&&nav('Lihat kasus perbaikan','/actions:Koreksi berbukti')}</div>
    </div>}
    {activeTab==='history' && !directorate && <div className="stage6-panel"><h3>Riwayat keputusan Balai</h3><BalaiDecisionHistory state={state} stage="Tahap 6" /></div>}
    {directorate && activeTab==='documents' && <div className="stage6-panel"><h3>Riwayat keputusan Balai</h3><BalaiDecisionHistory state={state} stage="Tahap 6" /></div>}
  </section>;
}
