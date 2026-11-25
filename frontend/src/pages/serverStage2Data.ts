export type Stage2Trial = {
  uji_coba_id: number; paket_id: number; tim_id: number; jenis_survei_id: number; alat_id: number;
  ruas_id: number | null; tanggal: string; panjang_km: number; percobaan_ke: number; status: string; versi: number;
};
export type Stage2Measurement = { pengukuran_id: number; seksi_id: number; ulangan_ke: number; kecepatan_kmh: number | null; nilai_alat: number; beban_kn: number | null; rater_personel_id: number | null };
export type Stage2Section = { seksi_id: number; uji_coba_id: number; nama_seksi: string; sta_awal: number; sta_akhir: number; nilai_referensi: number | null; kategori_kondisi: string | null; pengukuran: Stage2Measurement[] };
export type Stage2Detail = { uji_coba: Stage2Trial; seksi: Stage2Section[] };
export type Stage2Evaluation = { hasil?: Array<{ kode: string; nilai: number; satuan?: string; operator?: string; nilai_min?: number | null; nilai_max?: number | null; lulus?: boolean }>; lengkap?: boolean; semua_lulus?: boolean | null; aturan?: { mode?: string; status_ambang?: string; boleh_mengunci_pengajuan?: boolean; keputusan_pic_tetap_manual?: boolean } };
export type Stage2Submission = { status: string; versi: number; pengajuan?: { diajukan_oleh: number; diajukan_pada: string; snapshot: unknown } | null; review?: { pengguna_id: number; keputusan: string; catatan: string | null; waktu: string } | null; aturan?: { mode?: string; validasi_ambang_automatik_aktif?: boolean; revisi_membuat_percobaan_baru?: boolean } };
export type Stage2Criteria = { jenis_survei?: { kode: string; nama: string }; parameter?: Array<{ kode: string; nama: string; satuan: string | null; nilai_min: number | null; nilai_max: number | null; operator: string; status: string }>; lingkup?: { panjang_min_km?: number; jumlah_lokasi_min?: number; jumlah_ulangan?: number; rater_berbeda?: boolean; interval_hari?: number }; aturan?: { mode?: string; sumber_nilai?: string; status_ambang?: string; boleh_mengunci_pengajuan?: boolean; keputusan_pic_tetap_manual?: boolean; catatan_lokasi_pci?: string | null } };
export type Stage2Team = { tim_id: number; jenis_survei_id: number; nama_tim: string; jenis_survei?: { kode: string; nama: string } };
export type Stage2SurveyType = { jenis_survei_id: number; kode: string; nama: string };
export type Stage2Equipment = { alat_id: number; mulai?: string | null; selesai?: string | null; alat_survei?: { nama_alat?: string; jenis_survei_id?: number } };
export type Stage2Road = { ruas_id: number; nomor_ruas?: string | null; nama_ruas?: string | null };

export type Stage2Request = <T>(path: string, init?: RequestInit) => Promise<T>;
type Envelope<T> = { data: T };
type WorkspaceState = { trials: Stage2Trial[]; detail: Stage2Detail; evaluation: Stage2Evaluation; submission: Stage2Submission };
export type Stage2Gate = { aktif: boolean; paket_id: number; status: string; snapshot_sesuai: boolean; stage2_allowed: boolean; alasan?: string };
export type Stage2PackageCompletion = {
  paket_id: number;
  state: 'complete' | 'partial' | 'unavailable';
  approved_count: number | null;
  total_count: number | null;
  pending_surveys: Array<{ jenis_survei_id: number; kode: string | null; nama: string | null }> | null;
  reason: 'DECLARED_SCOPE_UNSET' | 'DECLARED_SCOPE_EMPTY' | null;
  label: string;
};
export type Stage2WorkspaceData = {
  trials: Stage2Trial[];
  teams: Stage2Team[];
  surveyTypes: Stage2SurveyType[];
  roads: Stage2Road[];
  gate: Stage2Gate;
  completion: Stage2PackageCompletion | null;
};

function list<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`Respons ${label} tidak sesuai kontrak senarai.`);
  return value as T[];
}
function record<T>(value: unknown, label: string): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Respons ${label} tidak sesuai kontrak objek.`);
  return value as T;
}
function id(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new Error(`Respons ${label} tidak mempunyai ID sah.`);
  return Number(value);
}

export function eligibleStage2Equipment(team: Stage2Team | undefined, equipment: Stage2Equipment[], date: string) {
  if (!team) return [];
  return equipment.filter(item =>
    (item.alat_survei?.jenis_survei_id == null || item.alat_survei.jenis_survei_id === team.jenis_survei_id) &&
    (!item.mulai || item.mulai <= date) && (!item.selesai || item.selesai >= date));
}

export function parseStage2PackageCompletion(value: unknown, packageId: string): Stage2PackageCompletion {
  const row = record<Stage2PackageCompletion>(value, 'status package-wide Tahap 2');
  const surveys = row.pending_surveys;
  if (row.paket_id !== Number(packageId) ||
    !['complete', 'partial', 'unavailable'].includes(row.state) ||
    typeof row.label !== 'string' ||
    !(row.reason === null || row.reason === 'DECLARED_SCOPE_UNSET' || row.reason === 'DECLARED_SCOPE_EMPTY') ||
    !(row.approved_count === null || (Number.isSafeInteger(row.approved_count) && row.approved_count >= 0)) ||
    !(row.total_count === null || (Number.isSafeInteger(row.total_count) && row.total_count >= 0)) ||
    !(surveys === null || (Array.isArray(surveys) && surveys.every(survey =>
      Number.isSafeInteger(survey.jenis_survei_id) && survey.jenis_survei_id > 0 &&
      (survey.kode === null || typeof survey.kode === 'string') &&
      (survey.nama === null || typeof survey.nama === 'string'))))) {
    throw new Error('Respons status package-wide Tahap 2 tidak lengkap atau tidak sesuai paket.');
  }
  if (row.state === 'complete' &&
    (row.total_count === null || row.total_count < 1 || row.approved_count !== row.total_count ||
      !Array.isArray(surveys) || surveys.length !== 0 || row.reason !== null)) {
    throw new Error('Status selesai Tahap 2 tidak sepadan dengan kiraan jenis survei.');
  }
  if (row.state === 'partial' &&
    (row.total_count === null || row.total_count < 1 || row.approved_count === null ||
      row.approved_count >= row.total_count || !Array.isArray(surveys) ||
      surveys.length !== row.total_count - row.approved_count || row.reason !== null)) {
    throw new Error('Status separa Tahap 2 tidak sepadan dengan jenis survei yang menunggu.');
  }
  if (row.state === 'unavailable' && row.reason === null) {
    throw new Error('Status Tahap 2 tidak tersedia tanpa alasan.');
  }
  return row;
}

export async function getStage2PackageCompletion(
  packageId: string,
  request: Stage2Request,
  signal?: AbortSignal,
): Promise<Stage2PackageCompletion> {
  const response = await request<Envelope<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/tahap2-status`,
    { signal, cache: 'no-store' },
  );
  return parseStage2PackageCompletion(response.data, packageId);
}

export async function getStage2Workspace(packageId: string, request: Stage2Request, signal?: AbortSignal): Promise<Stage2WorkspaceData> {
  const [trials, teams, surveyTypes, roads, gate, completion] = await Promise.all([
    request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/uji-coba`, { signal }),
    request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/tim`, { signal }),
    request<Envelope<unknown>>('/jenis-survei', { signal }),
    request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/ruas-jalan`, { signal }),
    request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/konfirmasi-kalibrasi`, { signal }),
    getStage2PackageCompletion(packageId, request, signal).catch(() => null),
  ]);
  const gateRow = record<Stage2Gate>(gate.data, 'gate konfirmasi PIC Tahap 1');
  if (gateRow.paket_id !== Number(packageId) || typeof gateRow.aktif !== 'boolean' ||
    typeof gateRow.stage2_allowed !== 'boolean' || typeof gateRow.snapshot_sesuai !== 'boolean' ||
    (gateRow.stage2_allowed && (!gateRow.aktif || gateRow.status !== 'DISETUJUI' || !gateRow.snapshot_sesuai))) {
    throw new Error('Respons gate konfirmasi Tahap 1 tidak sesuai kontrak; Tahap 2 ditahan.');
  }
  return {
    trials: list<Stage2Trial>(trials.data, 'daftar Uji Coba'),
    teams: list<Stage2Team>(teams.data, 'tim survei'),
    surveyTypes: list<Stage2SurveyType>(surveyTypes.data, 'jenis survei'),
    roads: list<Stage2Road>(roads.data, 'ruas paket'),
    gate: gateRow,
    completion,
  };
}

export async function getStage2Equipment(packageId: string, teamId: number, request: Stage2Request, signal?: AbortSignal) {
  const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/tim/${teamId}/alat`, { signal });
  return list<Stage2Equipment>(response.data, 'alat tim');
}

export async function getStage2Criteria(packageId: string, surveyTypeId: number, request: Stage2Request, signal?: AbortSignal) {
  const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/uji-coba-kriteria/${surveyTypeId}`, { signal });
  return record<Stage2Criteria>(response.data, 'kriteria uji coba');
}

export async function getStage2WorkspaceState(packageId: string, trialId: number, request: Stage2Request): Promise<WorkspaceState> {
  const base = `/paket/${encodeURIComponent(packageId)}/uji-coba/${trialId}`;
  const [trialsResult, detailResult, evaluationResult, submissionResult] = await Promise.all([
    request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/uji-coba`),
    request<Envelope<unknown>>(base),
    request<Envelope<unknown>>(`${base}/evaluasi`),
    request<Envelope<unknown>>(`${base}/pengajuan`),
  ]);
  const trials = list<Stage2Trial>(trialsResult.data, 'daftar Uji Coba');
  const detail = record<Stage2Detail>(detailResult.data, 'detail Uji Coba');
  const trial = trials.find(item => item.uji_coba_id === trialId);
  if (!trial || detail.uji_coba?.uji_coba_id !== trialId || !Array.isArray(detail.seksi)) throw new Error('Bacaan semula Uji Coba tidak mengesahkan paket dan detail yang dipilih.');
  return { trials, detail, evaluation: record<Stage2Evaluation>(evaluationResult.data, 'evaluasi'), submission: record<Stage2Submission>(submissionResult.data, 'pengajuan') };
}

async function postThenRefresh<T>(
  packageId: string, trialId: number, path: string, payload: unknown, request: Stage2Request,
  confirm: (created: unknown, state: WorkspaceState) => T,
): Promise<{ confirmed: T; state: WorkspaceState }> {
  const response = await request<Envelope<unknown>>(path, { method: 'POST', body: JSON.stringify(payload) });
  let state: WorkspaceState;
  try { state = await getStage2WorkspaceState(packageId, trialId, request); }
  catch (error) {
    throw new Error(`Server menerima perubahan Uji Coba #${trialId}, tetapi bacaan semula gagal. Muat semula sebelum mencuba lagi. ${error instanceof Error ? error.message : ''}`.trim());
  }
  try { return { confirmed: confirm(response?.data, state), state }; }
  catch (error) {
    throw new Error(`Server menerima perubahan Uji Coba #${trialId}, tetapi bacaan semula belum mengesahkannya. Muat semula sebelum mencuba lagi. ${error instanceof Error ? error.message : ''}`.trim());
  }
}

export function createStage2Trial(packageId: string, input: Omit<Stage2Trial, 'uji_coba_id' | 'paket_id' | 'status' | 'versi'>, request: Stage2Request) {
  const path = `/paket/${encodeURIComponent(packageId)}/uji-coba`;
  return request<Envelope<unknown>>(path, { method: 'POST', body: JSON.stringify(input) }).then(async response => {
    let trialId: number;
    try {
      const created = record<Stage2Trial>(response?.data, 'ciptaan Uji Coba');
      trialId = id(created.uji_coba_id, 'ciptaan Uji Coba');
    } catch (error) {
      throw new Error(`Server menerima Uji Coba tetapi responsnya tidak dapat dikenal pasti. Muat semula sebelum mencuba lagi. ${error instanceof Error ? error.message : ''}`.trim());
    }
    let state: WorkspaceState;
    try { state = await getStage2WorkspaceState(packageId, trialId, request); }
    catch (error) { throw new Error(`Server menerima Uji Coba #${trialId}, tetapi bacaan semula gagal. Muat semula sebelum mencuba lagi. ${error instanceof Error ? error.message : ''}`.trim()); }
    const saved = state.trials.find(item => item.uji_coba_id === trialId);
    if (!saved || saved.status !== 'DRAFT' || saved.tim_id !== input.tim_id || saved.jenis_survei_id !== input.jenis_survei_id || saved.alat_id !== input.alat_id || saved.ruas_id !== input.ruas_id) {
      throw new Error(`Server menerima Uji Coba #${trialId}, tetapi bacaan semula belum mengesahkan DRAFT dan skop yang dihantar. Muat semula sebelum mencuba lagi.`);
    }
    return { state, trialId };
  });
}

export function createStage2Section(packageId: string, trialId: number, input: unknown, request: Stage2Request) {
  return postThenRefresh(packageId, trialId, `/paket/${encodeURIComponent(packageId)}/uji-coba/${trialId}/seksi`, input, request, (value, state) => {
    const sectionId = id(record<{ seksi_id: number }>(value, 'ciptaan seksi').seksi_id, 'ciptaan seksi');
    const section = state.detail.seksi.find(item => item.seksi_id === sectionId);
    if (!section) throw new Error(`Seksi #${sectionId} belum ditemui selepas bacaan semula server.`);
    return section;
  });
}

export function createStage2Measurement(packageId: string, trialId: number, sectionId: number, input: unknown, request: Stage2Request) {
  return postThenRefresh(packageId, trialId, `/paket/${encodeURIComponent(packageId)}/uji-coba/${trialId}/seksi/${sectionId}/pengukuran`, input, request, (value, state) => {
    const measurementId = id(record<{ pengukuran_id: number }>(value, 'ciptaan pengukuran').pengukuran_id, 'ciptaan pengukuran');
    const measurement = state.detail.seksi.flatMap(section => section.pengukuran ?? []).find(item => item.pengukuran_id === measurementId);
    if (!measurement) throw new Error(`Pengukuran #${measurementId} belum ditemui selepas bacaan semula server.`);
    return measurement;
  });
}

export function saveStage2Evaluation(packageId: string, trialId: number, input: { expected_version: number; hasil: Array<{ kode: string; nilai: number }> }, request: Stage2Request) {
  return postThenRefresh(packageId, trialId, `/paket/${encodeURIComponent(packageId)}/uji-coba/${trialId}/evaluasi`, input, request, (_created, state) => {
    const saved = new Map((state.evaluation.hasil ?? []).map(item => [item.kode, item.nilai]));
    if (input.hasil.some(item => saved.get(item.kode) !== item.nilai)) throw new Error('Nilai evaluasi belum disahkan melalui bacaan semula server.');
    return state.evaluation;
  });
}

export function submitStage2Trial(packageId: string, trialId: number, expectedVersion: number, request: Stage2Request) {
  return postThenRefresh(packageId, trialId, `/paket/${encodeURIComponent(packageId)}/uji-coba/${trialId}/pengajuan`, { expected_version: expectedVersion }, request, (_created, state) => {
    const trial = state.trials.find(item => item.uji_coba_id === trialId);
    if (state.submission.status !== 'DIAJUKAN' || !trial || trial.status !== 'DIAJUKAN' || state.submission.versi <= expectedVersion) {
      throw new Error('Pengajuan belum disahkan sebagai DIAJUKAN oleh bacaan semula server.');
    }
    return state.submission;
  });
}

export function reviewStage2Trial(packageId: string, trialId: number, input: { expected_version: number; keputusan: 'DISETUJUI' | 'PERLU_REVISI'; catatan: string }, request: Stage2Request) {
  return postThenRefresh(packageId, trialId, `/paket/${encodeURIComponent(packageId)}/uji-coba/${trialId}/pengajuan/review`, input, request, (_created, state) => {
    const trial = state.trials.find(item => item.uji_coba_id === trialId);
    if (state.submission.status !== input.keputusan || state.submission.review?.keputusan !== input.keputusan || trial?.status !== input.keputusan) {
      throw new Error(`Keputusan ${input.keputusan} belum disahkan oleh bacaan semula server.`);
    }
    return state.submission;
  });
}
