import { apiRequest } from '../../auth/client';
import type { WorkflowRole } from '../../workflow/model';

type Envelope<T> = { data: T };
const base = (packageId: string) => `/paket/${encodeURIComponent(packageId)}`;
const post = (body: unknown, method = 'POST'): RequestInit => ({ method, body: JSON.stringify(body) });

export const PROVIDER: WorkflowRole = 'Penyedia Jasa / Ketua Tim';
export const PIC: WorkflowRole = 'PIC Balai / Pengguna Jasa';
export const DIRECTORATE: WorkflowRole = 'Direktorat / Pusat';

/** Cheap read-only Tahap 4-6 summary for the stage rail and package status. */
export async function getFinalStagesProgress(packageId: string, signal?: AbortSignal) {
  return (await apiRequest<Envelope<import('../../workflow/serverPackageStatus').FinalStagesProgress>>(`${base(packageId)}/progres-akhir`, { signal })).data;
}

// ---------- upload ----------
export type UploadMessage = { pesan_id?: number; sta: number | null; kode_error: string | null; pesan: string };
export type UploadRow = { upload_id: number; jenis_survei_id: number; sistem_id: number; semester: number; waktu_upload: string; jumlah_record: number | null; status: 'VALID' | 'ERROR'; pesan: UploadMessage[] };
export type UploadState = { sistem: Array<{ sistem_id: number; nama: string }>; jenis_survei: Array<{ jenis_survei_id: number; nama: string }>; upload: UploadRow[] };
export type UploadInput = { jenis_survei_id: number; sistem_id: number; status: 'VALID' | 'ERROR'; jumlah_record?: number | null; pesan?: Array<{ pesan: string; kode_error?: string; sta?: number | null }> };

export async function getUploads(packageId: string, signal?: AbortSignal) {
  return (await apiRequest<Envelope<UploadState>>(`${base(packageId)}/upload-sistem`, { signal })).data;
}
export async function recordUpload(packageId: string, input: UploadInput) {
  return (await apiRequest<Envelope<UploadState>>(`${base(packageId)}/upload-sistem`, post(input))).data;
}
/** Latest upload per survey type; the Tahap 4 gate needs every one of them VALID. */
export function latestUploadBySurvey(state: UploadState) {
  const latest = new Map<number, UploadRow>();
  for (const row of [...state.upload].sort((a, b) => b.upload_id - a.upload_id)) if (!latest.has(row.jenis_survei_id)) latest.set(row.jenis_survei_id, row);
  return state.jenis_survei.map(survey => ({ ...survey, latest: latest.get(survey.jenis_survei_id) ?? null }));
}

// ---------- audit ----------
export type AuditStatus = 'Belum Dimulai' | 'Dalam Review' | 'Lulus' | 'Ditolak';
export type AuditSample = { sampel_id?: number; sta_awal: number; sta_akhir: number; nilai_asli: number; nilai_verifikasi: number; selisih_persen?: number | null; status: 'Sesuai' | 'Tidak Sesuai' };
export type AuditLevelRow = {
  audit_id: number; tingkat: 1 | 2 | 3; status: AuditStatus; versi: number; tanggal: string | null;
  persen_sampel_rencana: number | null; persen_sampel_realisasi: number | null; alasan_penolakan: string | null;
  detail: { checklist?: Record<string, boolean>; ba_number?: string; catatan?: string; catatan_keputusan?: string | null };
  sampel: AuditSample[]; koreksi_terbuka: number;
};
export type AuditState = { paket_id: number; tahap4_disetujui: boolean; tingkat: AuditLevelRow[] };
export type AuditSaveInput = { expected_version: number; checklist?: Record<string, boolean>; ba_number?: string; catatan?: string; persen_sampel_realisasi?: number; sampel?: AuditSample[] };

export async function getAudit(packageId: string, signal?: AbortSignal) {
  return (await apiRequest<Envelope<AuditState>>(`${base(packageId)}/audit`, { signal })).data;
}
export async function saveAudit(packageId: string, level: number, input: AuditSaveInput) {
  return (await apiRequest<Envelope<AuditState>>(`${base(packageId)}/audit/${level}`, post(input, 'PUT'))).data;
}
export async function decideAudit(packageId: string, level: number, expectedVersion: number, keputusan: 'Lulus' | 'Ditolak', catatan: string) {
  return (await apiRequest<Envelope<AuditState>>(`${base(packageId)}/audit/${level}/keputusan`, post({ expected_version: expectedVersion, keputusan, catatan }))).data;
}

export const AUDIT_LEVELS = {
  1: { owner: PROVIDER, ownerLabel: 'Penyedia Jasa', title: 'Audit tingkat 1 · Internal Penyedia', scope: '100% data', ba: 'BA Audit Internal (Lampiran G)' },
  2: { owner: PIC, ownerLabel: 'PIC Balai (Pengguna Jasa)', title: 'Audit tingkat 2 · Pengguna Jasa', scope: 'Sampel acak maks. 5% panjang jalan', ba: 'BA Verval Pengguna Jasa' },
  3: { owner: DIRECTORATE, ownerLabel: 'Direktorat', title: 'Audit tingkat 3 · Direktorat', scope: 'Sampel acak min. 1%', ba: 'BA Verval Direktorat' },
} as const;

export const INTERNAL_AUDIT_CHECKLIST = [
  'Format, kelengkapan, ketelitian dan kewajaran data',
  'Tanggal-waktu, ruas dan arah sesuai',
  'Cuaca, permukaan, alat dan personil tercatat',
  'Gambar/video cerah, lensa bersih, tidak melawan matahari',
  'Foto defect PCI sesuai spesifikasi dataset AI',
] as const;

export type AuditGate = { canEdit: boolean; canDecide: boolean; locked: string | null };
/** Mirrors simpan_audit/putuskan_audit: owner role, previous level passed, no open correction for this level. */
export function auditGate(state: AuditState, level: 1 | 2 | 3, role: WorkflowRole): AuditGate {
  const row = state.tingkat.find(item => item.tingkat === level);
  const previous = state.tingkat.find(item => item.tingkat === level - 1);
  const owner = AUDIT_LEVELS[level].owner === role;
  let locked: string | null = null;
  if (!row) locked = 'Data audit belum tersedia.';
  else if (row.status === 'Lulus') locked = null;
  else if (level === 1 && !state.tahap4_disetujui) locked = 'Menunggu Tahap 4 disetujui PIC Balai.';
  else if (level > 1 && previous?.status !== 'Lulus') locked = `Menunggu Audit tingkat ${level - 1} Lulus.`;
  else if (row.koreksi_terbuka > 0) locked = `Ada ${row.koreksi_terbuka} kasus koreksi terbuka untuk audit ini. Tutup kasusnya sebelum audit diulang.`;
  const open = !!row && row.status !== 'Lulus' && !locked;
  return { canEdit: owner && open, canDecide: owner && open && row?.status === 'Dalam Review', locked };
}

export function sampleDeviation(sample: Pick<AuditSample, 'nilai_asli' | 'nilai_verifikasi'>) {
  if (!sample.nilai_asli) return null;
  return Math.round(Math.abs(sample.nilai_verifikasi - sample.nilai_asli) * 10000 / Math.abs(sample.nilai_asli)) / 100;
}

// ---------- penerimaan ----------
export type TerminRow = { termin_id: number; nomor: 1 | 2 | 3 | 4; persen_bobot: number; batas_waktu: string; output_wajib: string; status: 'Belum' | 'Selesai'; versi: number };
export type BeritaAcara = { ba_id: number; jenis: string; nomor: string; tanggal: string; sumber_tipe: string; status: string };
export type PenerimaanState = {
  paket_id: number; audit3_lulus: boolean; termin: TerminRow[];
  penerimaan: Array<{ penerimaan_id: number; termin_id: number; jenis: 'PARSIAL' | 'AKHIR'; tanggal: string; ba: BeritaAcara | null }>;
  berita_acara: BeritaAcara[];
};
export async function getAcceptance(packageId: string, signal?: AbortSignal) {
  return (await apiRequest<Envelope<PenerimaanState>>(`${base(packageId)}/penerimaan`, { signal })).data;
}
export async function recordAcceptance(packageId: string, term: number, input: { expected_version: number; jenis: 'PARSIAL' | 'AKHIR'; nomor_ba: string; tanggal?: string }) {
  return (await apiRequest<Envelope<PenerimaanState>>(`${base(packageId)}/penerimaan/${term}`, post(input))).data;
}
/** Mirrors catat_penerimaan: in order, terms 3-4 need Audit 3 Lulus, only the PIC records. */
export function terminGate(state: PenerimaanState, term: TerminRow, role: WorkflowRole) {
  if (term.status === 'Selesai') return { canRecord: false, reason: 'Sudah diterima.' };
  const earlier = state.termin.find(item => item.nomor < term.nomor && item.status !== 'Selesai');
  if (earlier) return { canRecord: false, reason: `Menunggu termin ${earlier.nomor} diterima.` };
  if (term.nomor >= 3 && !state.audit3_lulus) return { canRecord: false, reason: 'Menunggu Audit tingkat 3 Lulus.' };
  if (role !== PIC) return { canRecord: false, reason: 'Dicatat oleh PIC Balai.' };
  return { canRecord: true, reason: null };
}
export function acceptedPercent(state: PenerimaanState) {
  return state.termin.filter(item => item.status === 'Selesai').reduce((sum, item) => sum + Number(item.persen_bobot), 0);
}

export function auditErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/Akses tidak dibenarkan|42501/.test(message)) return 'Akun atau cakupan paket tidak berwenang untuk tindakan ini.';
  return message || 'Permintaan gagal; periksa koneksi server lalu coba lagi.';
}
