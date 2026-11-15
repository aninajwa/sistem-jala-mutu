export type Stage4Request = <T>(path: string, init?: RequestInit) => Promise<T>;
export type Stage4Road = { ruas_id: number; nomor_ruas?: string | null; nama_ruas?: string | null; [key: string]: unknown };

export type Stage4LrsCapabilities = { read: boolean; write: boolean; reason: string | null };
export type Stage4LrsInput = {
  panjang_lapangan_m: number;
  panjang_acuan_m: number;
  jumlah_error_topologi: number;
  format_sesuai_glossary: boolean;
  sta_konsisten_iri_pci_ldt: boolean;
};
export type Stage4LrsRow = {
  validasi_lrs_id: number;
  paket_id: number;
  ruas_id: number;
  versi: number;
  panjang_lapangan_m: number | null;
  panjang_acuan_m: number | null;
  jumlah_error_topologi: number | null;
  format_sesuai_glossary: boolean | null;
  sta_konsisten_iri_pci_ldt: boolean | null;
  deviasi_m?: number | null;
  status?: string | null;
  tgl_valid?: string | null;
};
export type Stage4WorkflowStatus = {
  paket_id: number;
  state: 'PENDING_RULES' | 'DRAFT' | 'DIAJUKAN' | 'PERLU_REVISI' | 'DISETUJUI';
  workflow_version: number;
  gate: 'PENDING' | 'PASS' | 'FAIL';
  progression_allowed: boolean;
  blockers: Array<{ code: string; message: string }>;
  unresolved: string[];
  validations: Stage4LrsRow[];
};
export type Stage4WorkflowCapabilities = { status: boolean; submit: boolean; review: boolean; reason: string | null };
type Envelope<T> = { data: T };

export async function getStage4Roads(packageId: string, request: Stage4Request, signal?: AbortSignal): Promise<Stage4Road[]> {
  const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/ruas-jalan`, { signal });
  if (!Array.isArray(response?.data)) throw new Error('Respons ruas paket tidak sesuai kontrak (senarai dijangka).');
  return response.data.map(value => {
    const row = object(value);
    const ruasId = row?.ruas_id;
    if (!row || !Number.isSafeInteger(ruasId) || Number(ruasId) < 1) throw new Error('Respons ruas paket tidak mempunyai ID yang sah.');
    return row as Stage4Road;
  });
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function positiveId(value: unknown, label: string) {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new Error(`Respons ${label} tidak memiliki ID sah.`);
  return Number(value);
}

function nullableMeasurement(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

function nullableCount(value: unknown): number | null {
  const numeric = nullableMeasurement(value);
  return numeric !== null && Number.isSafeInteger(numeric) ? numeric : null;
}

function nullableBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function mapStage4LrsCapabilities(raw: unknown): Stage4LrsCapabilities {
  const value = object(raw);
  if (!value || typeof value.read !== 'boolean' || typeof value.write !== 'boolean' || !(value.reason === null || typeof value.reason === 'string')) {
    throw new Error('Respons kapabilitas validasi LRS tidak sesuai kontrak.');
  }
  return value as Stage4LrsCapabilities;
}

export function mapStage4LrsRows(raw: unknown, packageId: number): Stage4LrsRow[] {
  if (!Array.isArray(raw)) throw new Error('Respons daftar validasi LRS bukan array.');
  return raw.map(value => {
    const row = object(value);
    if (!row) throw new Error('Baris validasi LRS bukan objek.');
    const mapped: Stage4LrsRow = {
      validasi_lrs_id: positiveId(row.validasi_lrs_id, 'validasi LRS'),
      paket_id: positiveId(row.paket_id, 'paket validasi LRS'),
      ruas_id: positiveId(row.ruas_id, 'ruas validasi LRS'),
      versi: Number(row.versi),
      panjang_lapangan_m: nullableMeasurement(row.panjang_lapangan_m),
      panjang_acuan_m: nullableMeasurement(row.panjang_acuan_m),
      jumlah_error_topologi: nullableCount(row.jumlah_error_topologi),
      format_sesuai_glossary: nullableBoolean(row.format_sesuai_glossary),
      sta_konsisten_iri_pci_ldt: nullableBoolean(row.sta_konsisten_iri_pci_ldt),
      deviasi_m: row.deviasi_m as number | null | undefined,
      status: row.status as string | null | undefined,
      tgl_valid: row.tgl_valid as string | null | undefined,
    };
    if (mapped.paket_id !== packageId || !Number.isSafeInteger(mapped.versi) || mapped.versi < 0) throw new Error('Nilai atau cakupan paket validasi LRS dari server tidak sah.');
    return mapped;
  });
}

export async function getStage4LrsCapabilities(packageId: string, request: Stage4Request, signal?: AbortSignal) {
  const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/validasi-lrs-capabilities`, { signal });
  return mapStage4LrsCapabilities(response?.data);
}

export async function getStage4LrsRows(packageId: string, request: Stage4Request, signal?: AbortSignal) {
  const numericPackageId = Number(packageId);
  if (!Number.isSafeInteger(numericPackageId) || numericPackageId < 1) throw new Error('ID paket validasi LRS tidak sah.');
  const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/validasi-lrs`, { signal });
  return mapStage4LrsRows(response?.data, numericPackageId);
}

export async function saveStage4LrsAndConfirm(
  packageId: string, roadId: number, expectedVersion: number, input: Stage4LrsInput, request: Stage4Request,
) {
  if (!Number.isSafeInteger(roadId) || roadId < 1 || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw new Error('Ruas atau versi validasi LRS tidak sah.');
  const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/validasi-lrs/${roadId}`, {
    method: 'PUT', body: JSON.stringify({ expected_version: expectedVersion, ...input }),
  });
  const savedValue = object(response?.data);
  const savedId = positiveId(savedValue?.validasi_lrs_id, 'validasi LRS tersimpan');
  const rows = await getStage4LrsRows(packageId, request);
  const persisted = rows.find(row => row.validasi_lrs_id === savedId && row.ruas_id === roadId);
  if (!persisted || persisted.versi !== expectedVersion + 1 ||
    persisted.panjang_lapangan_m !== input.panjang_lapangan_m || persisted.panjang_acuan_m !== input.panjang_acuan_m ||
    persisted.jumlah_error_topologi !== input.jumlah_error_topologi || persisted.format_sesuai_glossary !== input.format_sesuai_glossary ||
    persisted.sta_konsisten_iri_pci_ldt !== input.sta_konsisten_iri_pci_ldt) {
    throw new Error('Penyimpanan diterima tetapi hasil validasi LRS belum cocok saat dibaca ulang. Muat ulang untuk memastikan status server.');
  }
  return { row: persisted, rows };
}

export async function getStage4WorkflowStatus(packageId: string, request: Stage4Request, signal?: AbortSignal) {
  const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/validasi-lrs-status`, { signal });
  const raw = object(response?.data);
  const id = Number(packageId);
  if (!raw || raw.paket_id !== id || !['PENDING_RULES','DRAFT','DIAJUKAN','PERLU_REVISI','DISETUJUI'].includes(String(raw.state)) ||
    !['PENDING','PASS','FAIL'].includes(String(raw.gate)) || typeof raw.progression_allowed !== 'boolean' ||
    !Number.isSafeInteger(raw.workflow_version) || Number(raw.workflow_version) < 0 ||
    !Array.isArray(raw.blockers) || !raw.blockers.every(item => object(item) && typeof item.code === 'string' && typeof item.message === 'string') ||
    !Array.isArray(raw.unresolved) || !Array.isArray(raw.validations)) throw new Error('Respons status workflow Stage 4 tidak sesuai kontrak.');
  // Never let the client treat an unconfirmed gate as permission to advance.
  if (raw.gate === 'PENDING' || raw.state === 'PENDING_RULES') raw.progression_allowed = false;
  return raw as unknown as Stage4WorkflowStatus;
}

export async function getStage4WorkflowCapabilities(packageId: string, request: Stage4Request, signal?: AbortSignal) {
  const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/validasi-lrs-workflow-capabilities`, { signal });
  const raw = object(response?.data);
  if (!raw || typeof raw.status !== 'boolean' || typeof raw.submit !== 'boolean' || typeof raw.review !== 'boolean' || !(raw.reason === null || typeof raw.reason === 'string')) {
    throw new Error('Respons kapabilitas workflow Stage 4 tidak sesuai kontrak.');
  }
  return raw as Stage4WorkflowCapabilities;
}

export async function submitStage4(packageId: string, expectedVersion: number, request: Stage4Request) {
  return request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/validasi-lrs/submit`, {
    method: 'POST', body: JSON.stringify({ expected_version: expectedVersion }),
  });
}

export async function reviewStage4(packageId: string, expectedVersion: number, keputusan: 'PERLU_REVISI' | 'DISETUJUI', catatan: string, request: Stage4Request) {
  return request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/validasi-lrs/review`, {
    method: 'POST', body: JSON.stringify({ expected_version: expectedVersion, keputusan, catatan }),
  });
}

export async function mutateStage4Workflow(packageId: string, expectedVersion: number, request: Stage4Request, action: 'submit' | 'review', decision?: 'PERLU_REVISI' | 'DISETUJUI', note = '') {
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw new Error('Versi workflow Stage 4 tidak sah.');
  return action === 'submit'
    ? submitStage4(packageId, expectedVersion, request)
    : reviewStage4(packageId, expectedVersion, decision ?? 'PERLU_REVISI', note, request);
}

export function stage4LrsErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/40001|versi/i.test(message)) return 'Validasi LRS berubah sejak dibaca. Muat ulang sebelum menyimpan lagi.';
  if (/PGRST202|schema cache|RPC.*belum tersedia/i.test(message)) return 'Kontrak simpan/baca LRS belum tersedia pada database. Tidak ada perubahan yang disimpan.';
  if (/403|42501|tidak dibenarkan|tidak berwenang/i.test(message)) return 'Akun atau cakupan paket/ruas tidak berwenang untuk validasi LRS.';
  return message || 'Permintaan validasi LRS gagal.';
}
