import {canPerformAction,type WorkflowAction} from '../workflowPermissions';
import type {OperationalWorkflowState,WorkflowRole} from '../model';
import type {WorkflowStage} from '../workflowGate';
import {evaluateStageGate} from '../workflowGate';
export type StageOperation='view'|'draft'|'submit'|'comment'|'approve'|'revise'|'reject'|'baDraft'|'recordDecision';
const P:WorkflowRole='Penyedia Jasa / Ketua Tim',B:WorkflowRole='PIC Balai / Pengguna Jasa',D:WorkflowRole='Direktorat / Pusat';
export const STAGE_POLICY:Record<WorkflowStage,{draft:WorkflowRole[];submit:WorkflowRole[];review:WorkflowRole[];ba:WorkflowRole[];purpose:string;source:string;next:string}>={
 'Tahap 0':{draft:[P],submit:[P],review:[B],ba:[],purpose:'Lengkapi survei pendahuluan dan laporan; Balai memeriksa hasil pengajuan.',source:'KAK 11.1 Survei Pendahuluan; Flowchart 01a; arahan mentor',next:'Kalibrasi alat dan personel'},
 'Tahap 1':{draft:[P],submit:[],review:[],ba:[P],purpose:'Catat alat, personel, kalibrasi, sertifikat dan kesiapan sesuai jenis survei.',source:'Flowchart 01b; Draft PP kalibrasi; format BA Kalibrasi dan Validasi',next:'Validasi produksi dan persetujuan metode pada Tahap 2'},
 'Tahap 2':{draft:[P],submit:[P],review:[B],ba:[P],purpose:'Periksa hasil uji dari sumber, lengkapi referensi, lalu ajukan penggunaan alat/metode.',source:'KAK 11.1–11.9; Flowchart 01c–01d; arahan mentor',next:'Pelaksanaan harian dan V&V berkala berjalan paralel'},
 'Tahap 3A':{draft:[P],submit:[],review:[],ba:[],purpose:'Catat kegiatan harian dan bukti pelaksanaan. Tidak ada persetujuan Balai per hari.',source:'Flowchart 02a; KAK 11.10; arahan mentor',next:'Lanjutkan kegiatan harian dan pemeriksaan periode 3B'},
 'Tahap 3B':{draft:[P],submit:[P],review:[B],ba:[P,B],purpose:'Penyedia melaporkan pemeriksaan internal; Balai meninjau kegiatan bersama dan BA per periode.',source:'KAK 11.10; Flowchart 02b–02c; checklist konsistensi/internal/2-mingguan',next:'Tindak lanjuti temuan atau lanjutkan penyiapan data'},
 'Tahap 4':{draft:[P],submit:[P],review:[B],ba:[P,B],purpose:'Siapkan data dan dokumen, periksa RNI/LRS dan V&V bertahap sebelum penyerahan.',source:'KAK 11.10; Flowchart 03a–03b; format V&V Bertahap',next:'Audit internal, konfirmasi penyerahan dan audit Balai'},
 'Tahap 5':{draft:[P,B,D],submit:[],review:[P,B,D],ba:[P,B,D],purpose:'Audit tingkat 1 oleh Penyedia, tingkat 2 oleh Balai, tingkat 3 oleh Direktorat.',source:'KAK 11.10; Flowchart 03b–03c; ERD 05; checklist Audit Data',next:'Klarifikasi/tindak lanjut atau penerimaan data'},
 'Tahap 6':{draft:[P],submit:[P],review:[B],ba:[B],purpose:'Penyedia melengkapi laporan dan termin; Balai mencatat penerimaan sesuai hasil pemeriksaan.',source:'Flowchart 03c–03d; format Penerimaan Data; KAK pelaporan/pembayaran',next:'Arsipkan hasil dan lanjutkan integrasi pengesahan resmi'},
};
export function mayOperate(role:WorkflowRole,stage:WorkflowStage,operation:StageOperation,auditLevel:1|2|3=1){
 if(operation==='view')return true;
 if(role==='Admin')return false;
 const policy=STAGE_POLICY[stage];
 if(stage==='Tahap 5'){const actor=[P,B,D][auditLevel-1];return role===actor&&operation!=='submit'&&canPerformAction(role,(['audit.internal','audit.balai','audit.directorate'] as const)[auditLevel-1]);}
 const actions:Partial<Record<WorkflowStage,[WorkflowAction,WorkflowAction|undefined,WorkflowAction|undefined]>>={
 'Tahap 0':['preparation.edit','preparation.submit','preparation.review'],
 'Tahap 1':['calibration.edit',undefined,undefined],
 'Tahap 2':['production.edit','production.submit','production.review'],
 'Tahap 3A':['daily.record',undefined,undefined],
 'Tahap 3B':['periodic.internal','periodic.internal','periodic.review'],
 'Tahap 4':['submission.prepare','submission.prepare','submission.review'],
 'Tahap 6':['submission.prepare','submission.prepare','acceptance.review']};
 const [edit,submit,review]=actions[stage]!;
 if(operation==='draft')return policy.draft.includes(role)&&canPerformAction(role,edit);
 if(operation==='submit')return !!submit&&policy.submit.includes(role)&&canPerformAction(role,submit);
 if(operation==='baDraft')return policy.ba.includes(role);
 return !!review&&policy.review.includes(role)&&canPerformAction(role,review);
}
export function operationBlockers(state:OperationalWorkflowState,stage:WorkflowStage,operation:StageOperation,level:1|2|3=1){
 if(!mayOperate(state.role,stage,operation,level))return [`Tindakan ini bukan kewenangan ${state.role}. ${STAGE_POLICY[stage].purpose}`];
 if(['view','draft','comment','baDraft','revise','reject'].includes(operation))return [];
 if(stage==='Tahap 3A')return state.productionApproval==='Disetujui'?[]:['Persetujuan metode belum tercatat.'];
 if(stage==='Tahap 0'&&operation==='submit')return []; // exact checklist evaluated by stage handler
 if(stage==='Tahap 0'&&operation==='approve')return state.project.preparation.reportApproval==='Diajukan'?[]:['Laporan belum diajukan.'];
 if(stage==='Tahap 2'&&['approve','recordDecision'].includes(operation))return state.productionApproval==='Diajukan'?[]:['Hasil produksi belum diajukan.'];
 const gate=evaluateStageGate(state,stage);return gate.readyToComplete?[]:gate.blockers;
}
