import { submittedPeriodicRecords } from './periodicRecords';
import {CYCLE_PROTOCOLS,CYCLE_SHARED_PROTOCOLS,type OperationalWorkflowState,type SurveyType} from './model';
import {periodicSurveyTypes} from './reviewReadiness';
import {sourceInspectionStatus} from './repository/sourceChecklistRepository';
import {periodRange} from './stages/periodSchedule';
import {evaluateStageGate} from './workflowGate';
import {invalidateVervalStages} from './dependentStageInvalidation';
export function periodSourceReady(state:OperationalWorkflowState,type:SurveyType,phase:string){
 const period=state.activeCyclePeriod??1,range=periodRange(state.project.id,period,state.project.surveyStartDate,state.project.surveyEndDate);
 const result=sourceInspectionStatus(period===1?state.project.id:`${state.project.id}::period-${period}`,type,phase,state.productionTests.PCI.pciManual!==false,{...state.project,periodStart:range.start,periodEnd:range.end});
 return result.complete&&(type!=='Lendutan'||!result.concerns.some(reason=>phase==='periodic14'||/CV ≤ 5%|Minimal 3 pengulangan/.test(reason)));
}
export function periodicBaBlockers(state:OperationalWorkflowState,certificate:string){
 const types=periodicSurveyTypes(state),period=state.activeCyclePeriod??1,cycle=state.cycle;
 const range=periodRange(state.project.id,period,state.project.surveyStartDate,state.project.surveyEndDate);
 const protocols=[...types.flatMap(type=>CYCLE_PROTOCOLS[type].map(p=>`${type} · ${p}`)),...CYCLE_SHARED_PROTOCOLS];
 const errors=[...evaluateStageGate(state,'Tahap 2').blockers];
 if(!types.length||!range.start||!range.end||!cycle.periodCompleted)errors.push('Lingkup, jadwal dan penyerahan periode wajib lengkap.');
 if(cycle.periodCompleted && !submittedPeriodicRecords(state).confirmed)errors.push('Daftar rekaman penyerahan belum terkonfirmasi.');
 if(cycle.providerResubmissionRequired)errors.push('Menunggu pengajuan ulang dari Penyedia.');
 if(types.some(type=>['consistency','internal','periodic14'].some(phase=>!periodSourceReady(state,type,phase))))errors.push('Checklist sumber periode belum lengkap/memenuhi.');
 const pci=state.productionTests.PCI.pciManual===false?cycle.pciAiStandardDeviation:cycle.pciManualMaxDifferencePercent;
 if(protocols.some(p=>!cycle.checkedProtocols[p])||cycle.reRatingStatus!=='Sesuai'||
    types.includes('IRI')&&(cycle.iriCoefficientVariation===null||!Number.isFinite(cycle.iriCoefficientVariation)||cycle.iriCoefficientVariation<0||cycle.iriCoefficientVariation>5)||
    types.includes('PCI')&&(pci==null||!Number.isFinite(pci)||pci<0||pci>(state.productionTests.PCI.pciManual===false?8:10)))errors.push('Protokol atau hasil konsistensi belum memenuhi.');
 if(cycle.userReview!=='Sesuai'||types.some(type=>cycle.surveyReviews?.[type]?.decision!=='Sesuai')||cycle.reviewPendingTypes?.length)errors.push('Review Balai perlu diselesaikan/diulang.');
 if(state.corrections.some(c=>['Konsistensi gagal','Temuan proses verval'].includes(c.source)&&c.status!=='Ditutup'&&(c.cyclePeriod===undefined||c.cyclePeriod===period)))errors.push('Tindak lanjut temuan periode masih terbuka.');
 if(!certificate.trim())errors.push('Referensi BA wajib diisi.');
 return errors;
}
/** Recording a new period BA reopens downstream readiness, never rewrites audit decisions. */
export function recordPeriodicBa(state:OperationalWorkflowState,certificate:string):OperationalWorkflowState {
 if(state.role!=='PIC Balai / Pengguna Jasa'||periodicBaBlockers(state,certificate).length)return state;
 const range=periodRange(state.project.id,state.activeCyclePeriod??1,state.project.surveyStartDate,state.project.surveyEndDate),held=new Set(state.cycle.heldRecordIds);
 return {...invalidateVervalStages(state,'BA verval baru tercatat; validasi LRS dan audit perlu diulang.'),
  cycle:{...state.cycle,requiresReview:false,reviewReason:'',lastCompletedDate:range.end||state.simulationDate,certificateId:certificate.trim(),consistency:'Konsisten',heldRecordIds:[]},
  dailyRecords:state.dailyRecords.map(record=>held.has(record.id)&&record.state==='Ditahan'?{...record,state:'Tercatat' as const}:record)};
}
