
import type {
  OperationalWorkflowState,
  WorkflowRole,
} from './model';

export const WORKFLOW_STAGES = [
  'Tahap 0',
  'Tahap 1',
  'Tahap 2',
  'Tahap 3A',
  'Tahap 3B',
  'Tahap 4',
  'Tahap 5',
  'Tahap 6',
] as const;

export type WorkflowStage =
  (typeof WORKFLOW_STAGES)[number];

export type StageGateResult = {
  stage: WorkflowStage;
  canView: boolean;
  canWork: boolean;
  readyToComplete: boolean;
  blockers: string[];
  waitingFor: string;
};

const PROVIDER = 'Penyedia Jasa / Ketua Tim';
const BALAI = 'PIC Balai / Pengguna Jasa';
const DIRECTORATE = 'Direktorat / Pusat';

function isProvider(role: WorkflowRole): boolean {
  return role === PROVIDER;
}

function isBalai(role: WorkflowRole): boolean {
  return role === BALAI;
}

function calibrationReady(
  state: OperationalWorkflowState,
): boolean {
  return (
    state.project.surveyTypes.length > 0 &&
    state.project.surveyTypes.every(type => {
      const checklistReady =
        state.calibrationChecklist[type] === true;

      const equipmentReady = state.calibrations.some(
        record =>
          record.surveyType === type &&
          record.condition === 'Baik' &&
          record.qualificationValid === true &&
          record.trainingVerified === true &&
          record.dueDate >= state.simulationDate,
      );

      return checklistReady && equipmentReady;
    })
  );
}

export function evaluateStageGate(
  state: OperationalWorkflowState,
  stage: WorkflowStage,
  role: WorkflowRole = state.role,
): StageGateResult {
  const blockers: string[] = [];

  const preparationApproved =
    state.project.preparation.reportApproval === 'Disetujui';

  const calibrationApproved = calibrationReady(state);

  const productionApproved =
    state.productionApproval === 'Disetujui' && !(state.project.surveyTypes.includes('PCI') && state.productionTests.PCI.pciManual === false);

  const dailyRecorded =
    state.project.surveyTypes.length > 0 &&
    state.project.surveyTypes.every(type =>
      state.dailyRecords.some(
        record =>
          record.surveyType === type &&
          record.state === 'Tercatat' &&
          state.project.routes.includes(record.road),
      ),
    );

  const hasOpenCorrections = state.corrections.some(
    correction => correction.status !== 'Ditutup',
  );

  const periodicReviewed =
    !state.cycle.requiresReview &&
    !state.cycle.reviewPendingTypes?.length &&
    !Object.values(state.cycleHistory??{}).some(cycle=>cycle.requiresReview) &&
    state.cycle.periodCompleted === true &&
    state.cycle.consistency === 'Konsisten' &&
    state.cycle.userReview === 'Sesuai' &&
    Boolean(state.cycle.certificateId?.trim()) &&
    state.cycle.heldRecordIds.length === 0 &&
    !hasOpenCorrections;

  const submissionValid =
    state.submission.validationStatus === 'VALID';

  const auditsCompleted =
    state.audits.length === 3 &&
    state.audits.every(audit => audit.status === 'Lulus' && !audit.requiresReview);

  let canWork = false;
  let waitingFor = 'Penyedia Jasa';
  let readyToComplete = false;

  switch (stage) {
    case 'Tahap 0':
      canWork = isProvider(role) || isBalai(role);
      waitingFor = preparationApproved
        ? '-'
        : state.project.preparation.reportApproval === 'Diajukan'
          ? 'PIC Balai / Pengguna Jasa'
          : 'Penyedia Jasa';
      readyToComplete = preparationApproved;

      if (!preparationApproved) {
        blockers.push(
          'Laporan persiapan belum memiliki persetujuan yang disyaratkan.',
        );
      }
      break;

    case 'Tahap 1':
      canWork = isProvider(role);
      waitingFor = calibrationApproved ? '-' : PROVIDER;
      readyToComplete = calibrationApproved;

      if (!calibrationApproved) {
        blockers.push(
          'Checklist atau kelayakan alat/personel belum lengkap.',
        );
      }
      break;

    case 'Tahap 2':
      canWork = isProvider(role) || isBalai(role);
      waitingFor = productionApproved
        ? '-'
        : state.productionApproval === 'Diajukan'
          ? BALAI
          : PROVIDER;

      readyToComplete =
        preparationApproved &&
        calibrationApproved &&
        productionApproved;

      if (!preparationApproved || !calibrationApproved) {
        blockers.push(
          'Prasyarat persiapan dan kalibrasi belum terpenuhi.',
        );
      }

      if (!productionApproved) {
        blockers.push(
          'Persetujuan penggunaan alat/metode belum tercatat.',
        );
      }
      break;

    case 'Tahap 3A':
      canWork = isProvider(role);
      waitingFor = PROVIDER;

      // Tidak ada approval Balai untuk setiap catatan harian.
      readyToComplete =
        productionApproved && dailyRecorded;

      if (!productionApproved) {
        blockers.push(
          'Kesiapan penggunaan alat/metode belum disetujui.',
        );
      }

      if (!dailyRecorded) {
        blockers.push(
          'Rekaman survei belum tersedia untuk seluruh jenis dalam paket.',
        );
      }
      break;

    case 'Tahap 3B':
      // Penyedia mengisi pemeriksaan internal.
      // Balai terlibat pada pemeriksaan bersama.
      canWork = isProvider(role) || isBalai(role);

      waitingFor =
        state.cycle.userReview === 'Sesuai'
          ? '-'
          : state.cycle.periodCompleted
            ? BALAI
            : PROVIDER;

      readyToComplete =
        productionApproved &&
        periodicReviewed;

      if (!productionApproved) {
        blockers.push(
          'Kesiapan alat/metode belum disetujui.',
        );
      }

      if (!periodicReviewed) {
        blockers.push(
          'V&V berkala, pengesahan, atau tindak lanjut temuan belum lengkap.',
        );
      }
      break;

    case 'Tahap 4':
      canWork = isProvider(role) || isBalai(role);
      waitingFor = submissionValid ? '-' : PROVIDER;

      readyToComplete =
        dailyRecorded &&
        periodicReviewed &&
        submissionValid;

      if (!dailyRecorded || !periodicReviewed) {
        blockers.push(
          'Data pelaksanaan dan hasil pemeriksaan berkala belum siap.',
        );
      }

      if (!submissionValid) {
        blockers.push(
          'Status validasi data belum VALID.',
        );
      }
      break;

    case 'Tahap 5':
      canWork =
        isProvider(role) ||
        isBalai(role) ||
        role === DIRECTORATE;

      waitingFor = auditsCompleted
        ? '-'
        : 'Auditor sesuai tingkat kewenangan';

      readyToComplete =
        submissionValid && auditsCompleted;

      if (!submissionValid) {
        blockers.push(
          'Data belum memenuhi persyaratan untuk audit.',
        );
      }

      if (!auditsCompleted) {
        blockers.push(
          'Hasil audit pada tingkat yang dipersyaratkan belum lengkap.',
        );
      }
      break;

    case 'Tahap 6':
      canWork = isBalai(role);
      waitingFor =
        state.acceptance.finalAcceptance
          ? '-'
          : BALAI;

      readyToComplete =
        auditsCompleted &&
        state.acceptance.finalAcceptance === true;

      if (!auditsCompleted) {
        blockers.push(
          'Hasil audit yang dipersyaratkan belum selesai.',
        );
      }

      if (!state.acceptance.finalAcceptance) {
        blockers.push(
          'Keputusan penerimaan akhir belum tercatat.',
        );
      }
      break;
  }

  // Semua halaman boleh dipratinjau.
  // Ini BUKAN izin untuk mengubah data atau menyetujui hasil.
  return {
    stage,
    canView: true,
    canWork,
    readyToComplete,
    blockers,
    waitingFor,
  };
}

export function evaluateWorkflowGates(
  state: OperationalWorkflowState,
  role: WorkflowRole = state.role,
): StageGateResult[] {
  return WORKFLOW_STAGES.map(stage =>
    evaluateStageGate(state, stage, role),
  );
}
