import type {CorrectionCase,OperationalWorkflowState} from './model';
export const defaultCase = (
  state: OperationalWorkflowState,
  id = `KOR-${Date.now().toString().slice(-7)}`,
): CorrectionCase => ({
  id,
  source: "Validasi produksi",
  blockedStage: "Validasi produksi",
  road: state.project.routes[0] || "",
  stationing: "STA 0+000 – 0+100",
  rejectionReason: "",
  severity: "Mayor",
  owner: "PIC survei",
  dueDate: state.simulationDate,
  rootCause: "",
  fieldDataValid: "",
  surveyType: "IRI",
  actionType: "",
  evidence: "",
  proposedValue: "",
  approval: "Draft",
  retest: "Belum Diuji",
  status: "Terbuka",
  returnStage: "Validasi produksi",
  originalValue:
    state.dailyRecords.find(
      (record) =>
        record.surveyType === "IRI" &&
        record.road === (state.project.routes[0] || ""),
    )?.rawValue || "Belum ada nilai raw tertaut",
  linkedRecordId: state.dailyRecords.find(
    (record) =>
      record.surveyType === "IRI" &&
      record.road === (state.project.routes[0] || ""),
  )?.id,
  verification: { surveyor: false, teamLeader: false, balai: false },
  reviewNote: "",
});
