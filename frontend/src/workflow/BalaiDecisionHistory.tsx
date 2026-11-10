import type {OperationalWorkflowState} from './model';
export function BalaiDecisionHistory({state,stage}:{state:OperationalWorkflowState;stage:'Tahap 0'|'Tahap 2'|'Tahap 6'}){
 const rows=(state.balaiDecisionHistory??[]).filter(row=>row.stage===stage).slice().reverse();
 return <details className="wf-panel" style={{margin:'12px 0',padding:14}}><summary>Riwayat keputusan & catatan · {rows.length} rekaman</summary>
 {rows.length?rows.map((row,i)=><div key={`${row.recordedAt}:${i}`} className="review-note"><small>{row.recordedAt} · {row.actor}</small><p><strong>{row.previousDecision} → {row.decision}</strong></p>{row.previousNote&&<p>Catatan sebelumnya: {row.previousNote}</p>}<p>Catatan tersimpan: {row.note||'Tidak ada catatan'}</p></div>):<p className="subtle">Belum ada riwayat terstruktur. Keputusan lama dapat ditelusuri melalui riwayat aktivitas paket; sistem tidak membuat riwayat pengesahan terdahulu.</p>}
 </details>;
}
