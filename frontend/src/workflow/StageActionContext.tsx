import {useWorkflowReconciliation} from '../hooks/useWorkflowReconciliation';
import type {OperationalWorkflowState} from './model';
import {PACKAGE_WORKFLOW_ITEMS} from './roleNavigation';
import {STAGE_POLICY,mayOperate} from './access/operationalPolicy';
import {evaluateStageGate} from './workflowGate';
import {StageOwnershipBanner} from './StageOwnershipBanner';
import {getNextWorkflowAction} from './WorkflowNextAction';
export function StageActionContext({state,selection,onNavigate}:{state:OperationalWorkflowState;selection:string;onNavigate?:(selection:string)=>void}){
 const sourceIssues=useWorkflowReconciliation(state);
 const stage=PACKAGE_WORKFLOW_ITEMS.find(item=>item.selection===selection)?.code;if(!stage)return null;
 const policy=STAGE_POLICY[stage],gate=evaluateStageGate(state,stage),next=getNextWorkflowAction(state);
 const blockers=[...gate.blockers,...sourceIssues.filter(issue=>(stage==='Tahap 6'||issue.stage===stage)).map(issue=>issue.message)];const ready=gate.readyToComplete&&blockers.length===0;
 const level=state.role==='Direktorat / Pusat'?3:state.role==='PIC Balai / Pengguna Jasa'?2:1;
 const editable=mayOperate(state.role,stage,'draft',level),review=mayOperate(state.role,stage,'approve',level);
 const isAdmin=state.role==='Admin';
 const heading=isAdmin?'Monitoring paket · tanpa hak keputusan':editable&&review?'Pekerjaan Anda · pemeriksaan sesuai tingkat audit':editable?'Pekerjaan Anda · isi dan simpan':review?'Pekerjaan Anda · periksa pengajuan':'Pantau pekerjaan · hanya lihat';
 const description=isAdmin?'Perubahan data teknis dan persetujuan dilakukan oleh pemilik tahap.':editable?'Lengkapi isian dan bukti yang menjadi tanggung jawab Anda.':review?'Periksa hasil, bukti, dan catatan Penyedia; jangan mengubah data sumbernya.':'Form aktor lain hanya untuk pemantauan. Tidak ada hak mengubah atau mengesahkan.';
 return <section className="stage-action-context rc2-task-line" aria-label="Panduan pekerjaan tahap"><div className="stage-task-summary"><strong>{heading}</strong><span>{description}</span><span className={ready?'wf-status ok':'wf-status warn'}>{ready?'Prasyarat dasar terpenuhi — keputusan tetap mengikuti pemeriksaan':`${blockers.length} prasyarat belum terpenuhi`}</span></div>{!ready&&blockers.length>0&&<details className="stage-task-blockers"><summary>Mengapa tahap tertahan? ({blockers.length})</summary><ul>{blockers.map((reason,index)=><li key={index}>{reason}</li>)}</ul></details>}<details className="stage-task-details"><summary>Tujuan, penanggung jawab & langkah berikutnya</summary><p>{policy.purpose}</p><StageOwnershipBanner selection={selection} role={state.role}/><small>Berikutnya: {policy.next}.</small></details>{ready&&next.stage!=='Selesai'&&next.selection!==selection&&(!PACKAGE_WORKFLOW_ITEMS.find(item=>item.selection===next.selection)||PACKAGE_WORKFLOW_ITEMS.findIndex(item=>item.selection===next.selection)>PACKAGE_WORKFLOW_ITEMS.findIndex(item=>item.selection===selection))&&onNavigate&&<button type="button" className="wf-button" title={next.title} onClick={()=>onNavigate(next.selection)}>Lihat {next.stage}</button>}</section>;
}
