import { SURVEY_TYPES, type DailySurveyRecord, type OperationalWorkflowState, type SurveyType } from '../../workflow/model';
import type { ServerPackageStage, ServerSessionSummary } from '../useServerPackageStages';

const AUDIT_STATUSES = new Set(['Belum Dimulai', 'Dalam Review', 'Lulus', 'Ditolak']);

/**
 * Copies the server audit facts (GET /paket-tahap) into Dirah's package view model, so the
 * Direktorat "Audit Tingkat 3" queue (directorateAuditRows) works on server packages.
 * Only audit status, level-3 rejection reason and the Tahap 4 VALID gate are set; nothing is inferred.
 */
export function attachServerAuditFacts(
  packages: Record<string, OperationalWorkflowState>,
  stages: Record<string, ServerPackageStage> | null,
): Record<string, OperationalWorkflowState> {
  if (!stages) return packages;
  return Object.fromEntries(Object.entries(packages).map(([id, state]) => {
    const stage = stages[id];
    if (!stage) return [id, state];
    const audits = state.audits.map((level, index) => {
      const status = stage.audit?.[String(index + 1)];
      return {
        ...level,
        status: status && AUDIT_STATUSES.has(status) ? status as typeof level.status : 'Belum Dimulai' as const,
        reviewReason: index === 2 && stage.alasan_audit3 ? stage.alasan_audit3 : level.reviewReason,
      };
    }) as OperationalWorkflowState['audits'];
    const finished = stage.tahap === 'Selesai';
    return [id, {
      ...state,
      audits,
      dailyRecords: (stage.sesi ?? []).map(sessionToDailyRecord),
      submission: { ...state.submission, validationStatus: stage.tahap4 === 'DISETUJUI' ? 'VALID' : 'Draft' },
      acceptance: { ...state.acceptance, finalAcceptance: finished, acceptanceDecision: finished ? 'Diterima' : state.acceptance.acceptanceDecision },
    }];
  }));
}

/** A recorded server survey session as Dirah's daily record (only fields the server provides). */
export function sessionToDailyRecord(row: ServerSessionSummary): DailySurveyRecord {
  const survey = (SURVEY_TYPES as readonly string[]).includes(row.jenis_kode ?? '') ? row.jenis_kode as SurveyType : 'IRI';
  return {
    id: `sesi-${row.sesi_id}`, date: row.tanggal ?? '', time: row.jam_mulai?.slice(0, 5) ?? '', surveyType: survey,
    road: row.ruas ?? '', lengthKm: Number(row.panjang_km ?? 0), trafficDurationMinutes: 0, lane: row.lajur ?? '',
    direction: row.arah === 'Opposite' ? 'Opposite' : 'Normal', weather: row.cuaca === 'Hujan' ? 'Hujan' : row.cuaca === 'Berawan' ? 'Berawan' : 'Cerah',
    surfaceDry: true, glareFree: true, speedAndLaneCompliant: true, tool: '', operator: '', driver: '', poi: '', disturbances: '', eventNotes: '',
    state: 'Tercatat',
  } as DailySurveyRecord;
}
