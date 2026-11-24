import type { CorrectionCase, OperationalWorkflowState, SurveyType } from '../../workflow/model';
import type { ServerCorrectionCase } from './serverCorrectionData';

type Detail = Record<string, unknown>;
const text = (d: Detail, key: string) => (typeof d[key] === 'string' ? (d[key] as string) : '');
const optional = (d: Detail, key: string) => (typeof d[key] === 'string' && d[key] ? (d[key] as string) : undefined);
const record = <T>(d: Detail, key: string) =>
  d[key] && typeof d[key] === 'object' && !Array.isArray(d[key]) ? (d[key] as Record<string, T>) : undefined;
const oneOf = <T extends string>(value: string, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

/** Server correction (kasus_temuan.detail + status) in the shape Dirah's correction screens render. */
export function serverCaseToCorrection(row: ServerCorrectionCase): CorrectionCase {
  const d = (record<unknown>(row.data, 'detail') ?? {}) as Detail;
  return {
    id: String(row.correctionId),
    cyclePeriod: typeof d.cycle_period === 'number' ? d.cycle_period : undefined,
    source: text(d, 'source') || row.source,
    blockedStage: text(d, 'blocked_stage'),
    road: text(d, 'road') || row.road,
    stationing: text(d, 'stationing'),
    rejectionReason: text(d, 'rejection_reason') || row.description,
    severity: oneOf(text(d, 'severity') || row.severity, ['Kritis', 'Mayor', 'Minor'] as const, 'Minor'),
    owner: text(d, 'owner'),
    dueDate: text(d, 'due_date'),
    rootCause: oneOf(text(d, 'root_cause'), ['Alat', 'Personel', 'Metode', 'Kondisi lapangan', 'Pemrosesan', ''] as const, ''),
    fieldDataValid: oneOf(text(d, 'field_data_valid'), ['Ya', 'Tidak', 'Tidak Berlaku', ''] as const, ''),
    surveyType: (text(d, 'survey_type') || 'IRI') as SurveyType,
    actionType: text(d, 'action_type'),
    evidence: text(d, 'evidence'),
    originalValue: text(d, 'original_value'),
    proposedValue: text(d, 'proposed_value'),
    approval: oneOf(text(d, 'approval'), ['Draft', 'Diajukan', 'Perlu Revisi', 'Disetujui', 'Ditolak'] as const, 'Draft'),
    retest: oneOf(text(d, 'retest'), ['Belum Diuji', 'Lulus', 'Gagal'] as const, 'Belum Diuji'),
    status: oneOf(row.status, ['Terbuka', 'Menunggu Persetujuan', 'Disetujui', 'Dilaksanakan', 'Verifikasi Ulang', 'Ditutup'] as const, 'Terbuka'),
    returnStage: text(d, 'return_stage'),
    linkedRecordId: optional(d, 'linked_record_id'),
    executionReference: optional(d, 'execution_reference'),
    retestReference: optional(d, 'retest_reference'),
    verification: {
      surveyor: d.verification_surveyor === true,
      teamLeader: d.verification_team_leader === true,
      balai: d.verification_balai === true,
    },
    reviewNote: optional(d, 'review_note'),
    ruleScenario: optional(d, 'rule_scenario'),
    ruleChecks: record<boolean>(d, 'rule_checks'),
    ruleNumbers: record<number>(d, 'rule_numbers'),
    provinceUpdateBa: optional(d, 'province_update_ba'),
    serverVersion: row.version ?? undefined,
  };
}

/** Replace each package's local corrections with its server cases (server mode never shows demo cases). */
export function attachServerCorrections(
  packages: Record<string, OperationalWorkflowState>,
  rows: ServerCorrectionCase[],
): Record<string, OperationalWorkflowState> {
  return Object.fromEntries(Object.entries(packages).map(([id, state]) => [
    id,
    { ...state, corrections: rows.filter(row => row.packageId === id).map(serverCaseToCorrection) },
  ]));
}
