import type {OperationalWorkflowState} from '../model';
import {correctionReviewer} from '../checkpoint09Corrections';
import {applyClosedCorrection,correctionClosureErrors} from '../flowRules';
import {matchesJournaledTransition} from './providerChecklistCascade';
/** The source reviewer may close a verified case and invalidate readiness.
 * This is never permission to edit another auditor's decisions or survey data. */
export function isCorrectionClosureCascade(before:OperationalWorkflowState,after:OperationalWorkflowState){
 const closing=before.corrections.filter(c=>c.status!=='Ditutup'&&after.corrections.find(n=>n.id===c.id)?.status==='Ditutup');
 if(closing.length!==1)return false;
 const c=closing[0];
 if(before.role!==correctionReviewer(c)||correctionClosureErrors(before,c).length)return false;
 return matchesJournaledTransition(before,applyClosedCorrection(before,c),after,
  ['Tutup kasus setelah verifikasi hasil pada sistem sumber'],c.id);
}
