import { apiRequest } from '../../auth/client';

/** Tahap 3B server contract (baca_verval_paket) and the rules the UI mirrors from the RPCs. */
export type VervalStatus = 'BERJALAN' | 'DIAJUKAN' | 'DITERIMA' | 'PERLU_PERBAIKAN' | 'DITAHAN';
export type VervalRepeat = { ulangan_id?: number; ulangan_ke: number; rater_personel_id: number; nilai: number };
export type VervalTest = {
  konsistensi_id: number; jenis_survei_id: number; jenis_kode: string; tim_id: number; ruas_id: number;
  sta_awal: number; sta_akhir: number; jumlah_ulangan: number; status: 'Konsisten' | 'Tidak Konsisten';
  rata_rata: number | null; simpangan_baku: number | null; kv_persen: number | null; ulangan: VervalRepeat[];
};
export type VervalCycleRow = {
  siklus_id: number; siklus_ke: number; periode_mulai: string; periode_selesai: string; jatuh_tempo: string;
  status: VervalStatus; versi: number; nomor_ba: string | null; catatan_review: string | null;
  panjang_km: number; jumlah_sesi: number; terlambat: boolean; koreksi_terbuka: number; uji: VervalTest[];
};
export type VervalPackage = {
  paket_id: number; tahap4: string; boleh_buka: boolean; alasan_tidak_boleh_buka: string | null;
  siklus: VervalCycleRow[];
  opsi: {
    jenis_survei: Array<{ jenis_survei_id: number; kode: string; nama: string }>;
    tim: Array<{ tim_id: number; nama_tim: string; jenis_survei_id: number }>;
    ruas: Array<{ ruas_id: number; nomor_ruas: string | null; nama_ruas: string | null }>;
    personel: Array<{ personel_id: number; nama: string }>;
  };
};

const base = (packageId: string) => `/paket/${encodeURIComponent(packageId)}`;
type Envelope<T> = { data: T };

export async function getVervalPackage(packageId: string, signal?: AbortSignal) {
  return (await apiRequest<Envelope<VervalPackage>>(`${base(packageId)}/verval`, { signal })).data;
}
export async function openVervalCycle(packageId: string, requestId: string) {
  return (await apiRequest<Envelope<VervalCycleRow>>(`${base(packageId)}/siklus-verval`, { method: 'POST', body: JSON.stringify({ request_id: requestId }) })).data;
}
export async function recordConsistency(packageId: string, cycleId: number, input: {
  request_id: string; expected_version: number; jenis_survei_id: number; tim_id: number; ruas_id: number;
  sta_awal: number; sta_akhir: number; ulangan: Array<{ ulangan_ke: number; rater_personel_id: number; nilai: number }>;
}) {
  return (await apiRequest<Envelope<{ konsistensi_id: number; status: string; kv_persen: number | null }>>(
    `${base(packageId)}/siklus-verval/${cycleId}/uji-konsistensi`, { method: 'POST', body: JSON.stringify(input) })).data;
}
export async function submitVervalCycle(packageId: string, cycleId: number, expectedVersion: number, nomorBa: string) {
  return (await apiRequest<Envelope<VervalCycleRow>>(`${base(packageId)}/siklus-verval/${cycleId}/ajukan`,
    { method: 'POST', body: JSON.stringify({ expected_version: expectedVersion, nomor_ba: nomorBa }) })).data;
}
export async function reviewVervalCycle(packageId: string, cycleId: number, expectedVersion: number, keputusan: 'DITERIMA' | 'PERLU_PERBAIKAN', catatan: string) {
  return (await apiRequest<Envelope<VervalCycleRow>>(`${base(packageId)}/siklus-verval/${cycleId}/review`,
    { method: 'POST', body: JSON.stringify({ expected_version: expectedVersion, keputusan, catatan }) })).data;
}

export const STATUS_LABEL: Record<VervalStatus, { label: string; tone: 'ok' | 'warn' | 'bad' | 'info' | '' }> = {
  BERJALAN: { label: 'Berjalan', tone: 'info' },
  DIAJUKAN: { label: 'Menunggu PIC', tone: 'warn' },
  DITERIMA: { label: 'Diterima', tone: 'ok' },
  PERLU_PERBAIKAN: { label: 'Perlu perbaikan', tone: 'bad' },
  DITAHAN: { label: 'Data ditahan', tone: 'bad' },
};

/** Same thresholds as simpan_uji_konsistensi_verval: PCI SD <= 8, others KV <= 5 %. Needs >= 2 values. */
export function consistencyPreview(values: number[], kode: string) {
  const nums = values.filter(value => Number.isFinite(value));
  if (nums.length < 2) return null;
  const mean = nums.reduce((sum, value) => sum + value, 0) / nums.length;
  const sd = Math.sqrt(nums.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (nums.length - 1));
  const kv = mean === 0 ? null : Math.round(sd * 10000 / Math.abs(mean)) / 100;
  const consistent = kode === 'PCI' ? sd <= 8 : kv !== null && kv <= 5;
  return { mean: Math.round(mean * 1000) / 1000, sd: Math.round(sd * 1000) / 1000, kv, consistent, rule: kode === 'PCI' ? 'SD ≤ 8' : 'KV ≤ 5%' };
}

/** Latest test per contracted survey type, as ajukan_verval evaluates it. */
export function latestTestsByType(pkg: VervalPackage, cycle: VervalCycleRow) {
  return pkg.opsi.jenis_survei.map(type => ({
    ...type,
    latest: [...cycle.uji].filter(test => test.jenis_survei_id === type.jenis_survei_id).sort((a, b) => b.konsistensi_id - a.konsistensi_id)[0] ?? null,
  }));
}

export type VervalAction = 'open' | 'record' | 'submit' | 'review';
/** Mirrors the RPC transitions so only actions the server accepts are shown. */
export function vervalActions(pkg: VervalPackage, cycle: VervalCycleRow | null, role: string): VervalAction[] {
  const provider = role === 'Penyedia Jasa / Ketua Tim';
  const pic = role === 'PIC Balai / Pengguna Jasa';
  const actions: VervalAction[] = [];
  if (provider && pkg.boleh_buka) actions.push('open');
  if (!cycle) return actions;
  const editable = ['BERJALAN', 'DITAHAN', 'PERLU_PERBAIKAN'].includes(cycle.status);
  if (provider && editable) {
    actions.push('record');
    const tests = latestTestsByType(pkg, cycle);
    if (tests.length > 0 && tests.every(item => item.latest) && cycle.koreksi_terbuka === 0) actions.push('submit');
  }
  if (pic && cycle.status === 'DIAJUKAN') actions.push('review');
  return actions;
}

export function daysUntil(date: string, today = new Date()) {
  const [y, m, d] = date.split('-').map(Number);
  const due = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due - now) / 86400000);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
}

export function vervalErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/Akses tidak dibenarkan|42501/.test(message)) return 'Akun atau cakupan paket tidak berwenang untuk tindakan ini.';
  return message || 'Permintaan gagal; periksa koneksi server lalu coba lagi.';
}
