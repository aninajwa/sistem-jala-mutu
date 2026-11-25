import type {OperationalWorkflowState} from '../model';
import type {BaIdentity} from './documentRepository';
export function documentIdentityErrors(state:OperationalWorkflowState,id:BaIdentity){
 const periodic=['konsistensi','internal','duaMingguan'].includes(id.kind);
 const errors=[];
 if(id.packageId!==state.project.id)errors.push('Identitas BA tidak sesuai paket aktif.');
 if(!state.project.surveyTypes.includes(id.survey as never))errors.push('Jenis survei BA berada di luar lingkup paket saat ini; arsip hanya dibaca.');
 if(![1,2,3].includes(id.auditLevel)||id.kind!=='audit'&&id.auditLevel!==1)errors.push('Tingkat audit BA tidak valid.');
 if(periodic&&(!Number.isSafeInteger(id.period)||id.period<1||id.period!==(state.activeCyclePeriod??1)&&!state.cycleHistory?.[String(id.period)]))errors.push('Rekaman sumber periode BA belum tersedia.');
 if(!periodic&&id.period!==0)errors.push('Format nonberkala tidak memakai nomor periode.');
 return errors;
}
export function documentReviewContext(state:OperationalWorkflowState,id:BaIdentity){
 if(!id.period)return state;
 const cycle=id.period===(state.activeCyclePeriod??1)?state.cycle:state.cycleHistory?.[String(id.period)];
 return cycle?{...state,activeCyclePeriod:id.period,cycle,cycleHistory:{}}:state;
}
