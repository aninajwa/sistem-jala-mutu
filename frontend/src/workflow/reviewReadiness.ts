import {sourceInspectionStatus} from './repository/sourceChecklistRepository';
import type {OperationalWorkflowState,SurveyType} from './model';
import {evaluateProductionTest} from './model';
import {evaluateStageGate} from './workflowGate';
/** Resolve legacy empty scope without mutating persisted periods or expanding a deliberate subset. */
export function periodicSurveyTypes(state:OperationalWorkflowState):SurveyType[]{
 const selected=state.cycle.selectedTypes.filter(type=>state.project.surveyTypes.includes(type));
 return [...new Set(selected.length?selected:state.project.surveyTypes)];
}
export function productionReviewBlockers(state:OperationalWorkflowState):string[]{
 const blockers=[...evaluateStageGate(state,'Tahap 0').blockers,...evaluateStageGate(state,'Tahap 1').blockers];
 if(!state.project.surveyTypes.length)blockers.push('Lingkup jenis survei paket belum ditetapkan.');
 for(const type of state.project.surveyTypes){if(state.calibrationChecklist[type]&&!sourceInspectionStatus(state.project.id,type,'calibration',state.productionTests.PCI.pciManual!==false,state.project).complete)blockers.push(`${type}: formulir kalibrasi belum lengkap menurut isian yang berlaku.`);if(type==='PCI'&&state.productionTests.PCI.pciManual===false)blockers.push('PCI AI: keputusan penggunaan operasional belum terverifikasi.');
 const result=evaluateProductionTest(type,state.productionTests[type]);if(!result.passed)blockers.push(`${type}: hasil uji produksi belum memenuhi pemeriksaan.`);}
 return [...new Set(blockers)];
}
