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

type DataResponse<T> = { data: T };
export type ProtectedGet = <T>(path: string, init?: RequestInit) => Promise<T>;

function rows<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`Respons ${label} tidak sesuai kontrak (senarai dijangka).`);
  return value as T[];
}

export async function getSurveySessions(packageId: string, request: ProtectedGet, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/sesi-survei`, { signal });
  return rows<SurveySession>(response?.data, 'sesi survei');
}

export async function getSurveySegments(packageId: string, sessionId: number, request: ProtectedGet, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/sesi-survei/${encodeURIComponent(String(sessionId))}/data-segmen`,
    { signal },
  );
  return rows<SurveySegment>(response?.data, 'data segmen');
}

export function sessionSummary(session: SurveySession) {
  return [
    session.tanggal,
    session.ruas_id == null ? null : `Ruas #${session.ruas_id}`,
    session.tim_id == null ? null : `Tim #${session.tim_id}`,
  ].filter(value => value !== null && value !== undefined && value !== '').join(' · ') || `Sesi #${session.sesi_id}`;
}
