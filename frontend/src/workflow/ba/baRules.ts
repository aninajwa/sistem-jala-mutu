import type {OperationalWorkflowState,WorkflowRole} from '../model';
import {evaluateStageGate,type WorkflowStage} from '../workflowGate';
import type {BaKind} from './docxEngine';
export function baOwner(kind:BaKind,level:1|2|3):WorkflowRole{return kind==='audit'?(['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat'] as const)[level-1]:['kalibrasi','konsistensi','internal'].includes(kind)?'Penyedia Jasa / Ketua Tim':'PIC Balai / Pengguna Jasa';}
export const baStage:Record<BaKind,WorkflowStage>={kalibrasi:'Tahap 2',konsistensi:'Tahap 3B',internal:'Tahap 3B',duaMingguan:'Tahap 3B',bertahap:'Tahap 4',audit:'Tahap 5',penerimaan:'Tahap 6'};
export function baDecisionErrors(state:OperationalWorkflowState,kind:BaKind,level:1|2|3){
 const gate=evaluateStageGate(state,baStage[kind]);
 if(kind==='audit')return state.audits[level-1].status==='Lulus'&&!state.audits[level-1].requiresReview?[]:['Audit pada tingkat ini belum lulus atau memerlukan review ulang.'];
 return gate.readyToComplete?[]:gate.blockers;
}
