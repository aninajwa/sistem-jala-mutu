import {productionReviewBlockers} from './reviewReadiness';
import {hasPendingRecheck} from './workflowRevisions';
import {workflowFormIssues} from './repository/workflowReconciliation';

import type { OperationalWorkflowState } from './model';
import { derivePackageStage } from './packageStore';
import {
  PACKAGE_WORKFLOW_ITEMS,
  stageIndexFromCode,
} from './roleNavigation';

export type StageDisplayStatus =
  | 'needs-review'
  | 'completed'
  | 'current'
  | 'upcoming';

export function getStageDisplayStatus(
  state: OperationalWorkflowState,
  stageCode: string,
): StageDisplayStatus {
  if(stageCode==='Tahap 2'&&state.productionApproval==='Disetujui'&&productionReviewBlockers(state).length)return 'needs-review';
  if(stageCode==='Tahap 6'&&hasPendingRecheck(state))return 'needs-review';
  if(workflowFormIssues(state).some(issue=>issue.stage===stageCode)||stageCode==='Tahap 6'&&workflowFormIssues(state).length>0||stageCode==='Tahap 5'&&state.audits.some(audit=>audit.requiresReview)||stageCode==='Tahap 3B'&&(state.cycle.requiresReview||Object.values(state.cycleHistory??{}).some(cycle=>cycle.requiresReview)))return 'needs-review';
  const currentStage = derivePackageStage(state);

  if (currentStage === 'Selesai') {
    return 'completed';
  }

  const currentIndex = stageIndexFromCode(currentStage);
  const index = PACKAGE_WORKFLOW_ITEMS.findIndex(
    item => item.code === stageCode,
  );

  if (index < 0) return 'upcoming';
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';

  return 'upcoming';
}

export function getStageDisplayLabel(
  status: StageDisplayStatus,
): string {
  switch (status) {
    case 'needs-review':
      return 'Perlu pemeriksaan ulang';
    case 'completed':
      return 'Tahap sebelumnya';
    case 'current':
      return 'Posisi proses saat ini';
    case 'upcoming':
      return 'Belum mencapai tahap ini · dapat ditinjau';
  }
}
