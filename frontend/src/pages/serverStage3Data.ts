export type SurveySession = {
  sesi_id: number;
  paket_id?: number;
  tim_id?: number | null;
  ruas_id?: number | null;
  alat_id?: number | null;
  tanggal?: string | null;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  lajur?: string | null;
  arah?: string | null;
  cuaca?: string | null;
  kondisi_permukaan?: string | null;
  panjang_tercapai_km?: number | null;
  [key: string]: unknown;
};

export type SurveySegment = {
  data_id: number;
  sesi_id?: number | null;
  jenis_survei_id?: number | null;
  ruas_id?: number | null;
  sta_awal?: number | null;
  sta_akhir?: number | null;
  lajur?: string | null;
  nilai_utama?: number | null;
  atribut_detail?: unknown;
  lat?: number | null;
  lon?: number | null;
  status_qc?: string | null;
  versi_aktif?: number | null;
  [key: string]: unknown;
};

export type SurveyTeam = { tim_id: number; paket_id: number; jenis_survei_id: number; nama_tim: string; jenis_survei?: { kode?: string; nama?: string } };
export type SurveyToolAssignment = { alat_id: number; mulai?: string | null; selesai?: string | null; alat_survei?: { nama_alat?: string; jenis_survei_id?: number; penyedia_id?: number } };
export type SurveyRoad = { ruas_id: number; nomor_ruas?: string | null; nama_ruas?: string | null; [key: string]: unknown };
export type ApprovedSurveyTrial = { uji_coba_id: number; paket_id: number; tim_id: number; jenis_survei_id: number; alat_id: number; ruas_id: number | null; tanggal: string; status: string };
export type SurveySessionInput = {
  tim_id: number;
  ruas_id: number;
  alat_id: number;
  tanggal: string;
  operator_id?: number | null;
  pengemudi_id?: number | null;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  lajur?: string | null;
  arah?: string | null;
  cuaca?: string | null;
  kondisi_permukaan?: string | null;
  panjang_tercapai_km?: number | null;
  link_video?: string | null;
};
export type SurveySegmentInput = {
  jenis_survei_id: number;
  sta_awal?: number | null;
  sta_akhir?: number | null;
  lajur?: string | null;
  nilai_utama?: number | null;
  lat?: number | null;
  lon?: number | null;
};

export type PackageSurveyProgress = {
  sessionCount: number;
  segmentCount: number;
};

export function packageSurveyProgressLabel(
  progress: PackageSurveyProgress | null,
  loading: boolean,
  error: boolean,
) {
  if (loading) return 'Progres sedang dimuat';
  if (error || !progress) return 'Progres belum dapat dimuat';
  if (progress.sessionCount === 0) return 'Belum ada sesi';
  return `Sedang berjalan · ${progress.sessionCount} sesi · ${progress.segmentCount} segmen`;
}

type DataResponse<T> = { data: T };
export type ProtectedRequest = <T>(path: string, init?: RequestInit) => Promise<T>;
export type ProtectedGet = ProtectedRequest;
type Paginated<T> = { data: T[]; page?: number; page_size?: number };

function rows<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`Respons ${label} tidak sesuai kontrak (senarai dijangka).`);
  return value as T[];
}

export function eligibleApprovedTrials(
  trials: ApprovedSurveyTrial[], assignments: SurveyToolAssignment[], roads: SurveyRoad[],
  teamId: number, surveyTypeId: number, date: string,
) {
  return trials.filter(trial => trial.status === 'DISETUJUI' && trial.tim_id === teamId &&
    trial.jenis_survei_id === surveyTypeId && trial.ruas_id !== null &&
    roads.some(road => road.ruas_id === trial.ruas_id) &&
    assignments.some(assignment => assignment.alat_id === trial.alat_id &&
      (assignment.alat_survei?.jenis_survei_id == null || assignment.alat_survei.jenis_survei_id === trial.jenis_survei_id) &&
      (!assignment.mulai || assignment.mulai <= date) && (!assignment.selesai || assignment.selesai >= date)));
}

function validId(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new Error(`Respons ${label} tidak mempunyai ID yang sah.`);
  return Number(value);
}

async function pagedRows<T>(path: string, request: ProtectedRequest, signal?: AbortSignal): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= 1000; page += 1) {
    const suffix = path.includes('?') ? '&' : '?';
    const response = await request<Paginated<unknown>>(`${path}${suffix}page=${page}`, { signal });
    const next = rows<T>(response?.data, 'senarai berserver');
    all.push(...next);
    const size = Number(response.page_size) || 50;
    if (next.length < size) return all;
  }
  throw new Error('Senarai server melebihi had halaman yang boleh dimuat.');
}

export async function getSurveySessions(packageId: string, request: ProtectedRequest, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/sesi-survei`, { signal });
  return rows<SurveySession>(response?.data, 'sesi survei');
}

export async function getPackageSurveyProgress(
  packageId: string,
  request: ProtectedRequest,
  signal?: AbortSignal,
): Promise<PackageSurveyProgress> {
  const sessions = await getSurveySessions(packageId, request, signal);
  if (sessions.some(session => session.paket_id != null && String(session.paket_id) !== packageId)) {
    throw new Error('Respons sesi tidak sepadan dengan paket aktif.');
  }
  const segmentLists = await Promise.all(
    sessions.map(session => {
      const sessionId = validId(session.sesi_id, 'sesi survei');
      return getSurveySegments(packageId, sessionId, request, signal);
    }),
  );
  return {
    sessionCount: sessions.length,
    segmentCount: segmentLists.reduce((total, segments) => total + segments.length, 0),
  };
}

export async function getSurveySession(packageId: string, sessionId: number, request: ProtectedRequest, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/sesi-survei/${encodeURIComponent(String(sessionId))}`, { signal });
  const row = response?.data as SurveySession | null;
  if (!row || validId(row.sesi_id, 'sesi survei') !== sessionId) throw new Error('Bacaan semula sesi tidak mengesahkan sesi yang disimpan.');
  return row;
}

export async function getSurveySegments(packageId: string, sessionId: number, request: ProtectedRequest, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/sesi-survei/${encodeURIComponent(String(sessionId))}/data-segmen`, { signal },
  );
  return rows<SurveySegment>(response?.data, 'data segmen');
}

export async function getSurveySegment(packageId: string, sessionId: number, dataId: number, request: ProtectedRequest, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/sesi-survei/${encodeURIComponent(String(sessionId))}/data-segmen/${encodeURIComponent(String(dataId))}`, { signal },
  );
  const row = response?.data as SurveySegment | null;
  if (!row || validId(row.data_id, 'data segmen') !== dataId) throw new Error('Bacaan semula data segmen tidak mengesahkan rekod yang disimpan.');
  return row;
}

export function getSurveyTeams(packageId: string, request: ProtectedRequest, signal?: AbortSignal) {
  return pagedRows<SurveyTeam>(`/paket/${encodeURIComponent(packageId)}/tim`, request, signal);
}

export function getSurveyToolAssignments(packageId: string, teamId: number, request: ProtectedRequest, signal?: AbortSignal) {
  return pagedRows<SurveyToolAssignment>(`/paket/${encodeURIComponent(packageId)}/tim/${encodeURIComponent(String(teamId))}/alat`, request, signal);
}

export async function getSurveyRoads(packageId: string, request: ProtectedRequest, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/ruas-jalan`, { signal });
  return rows<SurveyRoad>(response?.data, 'ruas paket');
}

export async function getApprovedSurveyTrials(packageId: string, request: ProtectedRequest, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/uji-coba`, { signal });
  return rows<ApprovedSurveyTrial>(response?.data, 'uji coba');
}

export async function createSurveySessionAndConfirm(packageId: string, input: SurveySessionInput, request: ProtectedRequest) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/sesi-survei`, {
    method: 'POST', body: JSON.stringify(input),
  });
  const created = response?.data as SurveySession | null;
  const sessionId = validId(created?.sesi_id, 'respons ciptaan sesi');
  let detail: SurveySession;
  let sessions: SurveySession[];
  try {
    [detail, sessions] = await Promise.all([
      getSurveySession(packageId, sessionId, request),
      getSurveySessions(packageId, request),
    ]);
  } catch (error) {
    throw new Error(`Server menerima sesi #${sessionId}, tetapi bacaan semula gagal. Muat semula senarai sebelum cuba menyimpan lagi. ${error instanceof Error ? error.message : ''}`.trim());
  }
  if (!sessions.some(row => row.sesi_id === sessionId)) throw new Error(`Server menerima sesi #${sessionId}, tetapi bacaan semula senarai belum memaparkannya. Muat semula sebelum cuba menyimpan lagi.`);
  return { session: detail, sessions };
}

export async function createSurveySegmentAndConfirm(packageId: string, sessionId: number, input: SurveySegmentInput, request: ProtectedRequest) {
  const response = await request<DataResponse<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/sesi-survei/${encodeURIComponent(String(sessionId))}/data-segmen`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  const created = response?.data as SurveySegment | null;
  const dataId = validId(created?.data_id, 'respons ciptaan data segmen');
  let detail: SurveySegment;
  let segments: SurveySegment[];
  try {
    [detail, segments] = await Promise.all([
      getSurveySegment(packageId, sessionId, dataId, request),
      getSurveySegments(packageId, sessionId, request),
    ]);
  } catch (error) {
    throw new Error(`Server menerima data segmen #${dataId}, tetapi bacaan semula gagal. Muat semula senarai sebelum cuba menyimpan lagi. ${error instanceof Error ? error.message : ''}`.trim());
  }
  if (!segments.some(row => row.data_id === dataId)) throw new Error(`Server menerima data segmen #${dataId}, tetapi bacaan semula senarai belum memaparkannya. Muat semula sebelum cuba menyimpan lagi.`);
  return { segment: detail, segments };
}

export function sessionSummary(session: SurveySession) {
  return [session.tanggal, session.ruas_id == null ? null : `Ruas #${session.ruas_id}`, session.tim_id == null ? null : `Tim #${session.tim_id}`]
    .filter(value => value !== null && value !== undefined && value !== '').join(' · ') || `Sesi #${session.sesi_id}`;
}
