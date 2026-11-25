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
      // Survey types proven by recorded sessions belong to the package scope even if the list row omits it.
      project: { ...state.project, surveyTypes: [...new Set([...state.project.surveyTypes, ...(stage.sesi ?? []).map(sessionToDailyRecord).map(r => r.surveyType)])] },
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

type ReviewedCycle = { siklus_ke: number; status: string; catatan_review: string | null; direview_pada?: string | null; nomor_ba: string | null; uji: Array<{ jenis_kode: string }> };
/**
 * PIC decisions on verval cycles as Dirah's per-survey review results ("Hasil per survei"):
 * DITERIMA -> Sesuai, PERLU_PERBAIKAN -> Temuan; only the latest reviewed cycle per package.
 */
export function attachVervalReviews(packages: Record<string, OperationalWorkflowState>, cycles: Record<string, ReviewedCycle[]>) {
  return Object.fromEntries(Object.entries(packages).map(([id, state]) => {
    const reviewed = (cycles[id] ?? []).filter(c => (c.status === 'DITERIMA' || c.status === 'PERLU_PERBAIKAN') && c.direview_pada)
      .sort((a, b) => b.siklus_ke - a.siklus_ke)[0];
    if (!reviewed) return [id, state];
    const decision = reviewed.status === 'DITERIMA' ? 'Sesuai' as const : 'Temuan' as const;
    const types = [...new Set(reviewed.uji.map(u => u.jenis_kode))].filter(code => (SURVEY_TYPES as readonly string[]).includes(code)) as SurveyType[];
    const surveyReviews = Object.fromEntries(types.map(type => [type, {
      decision, reviewedAt: reviewed.direview_pada!.slice(0, 10),
      note: reviewed.catatan_review ?? `BA Verval ${reviewed.nomor_ba ?? ''} · siklus ke-${reviewed.siklus_ke}`,
    }]));
    const surveyTypes = [...new Set([...state.project.surveyTypes, ...types])];
    return [id, { ...state, project: { ...state.project, surveyTypes }, activeCyclePeriod: reviewed.siklus_ke, cycle: { ...state.cycle, requiresReview: false, reviewPendingTypes: [], surveyReviews } }];
  }));
}
