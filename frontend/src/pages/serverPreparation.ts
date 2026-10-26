import type { WorkflowRole } from '../workflow/model';

export type ServerContract = {
  paket_id: number;
  nama_paket: string;
  nomor_kontrak: string | null;
  balai_id: number | null;
  tahun_anggaran: number | null;
  status: string;
  nama_ppk: string | null;
  penyedia_id: number | null;
  tgl_spmk: string | null;
  tgl_selesai: string | null;
  nilai_kontrak: number | string | null;
  batas_lap_pendahuluan: string | null;
};

export type ServerChecklistItem = {
  item_id: number;
  kode?: string;
  bagian?: string;
  uraian?: string;
  wajib?: boolean | null;
  jawaban: 'Ya' | 'Tidak' | null;
  keterangan?: string | null;
  bukti_dokumen_id?: number | null;
};

export type ServerChecklist = {
  paket_id: number;
  pengisian: { status: string; versi: number };
  ringkasan: {
    jumlah_item: number;
    jumlah_terjawab: number;
    persen_terisi?: number;
  };
  items: ServerChecklistItem[];
};

export type ServerPreparationDocument = {
  dokumen_id: number;
  paket_id: number;
  judul: string;
  status: string;
  versi_aktif: number;
  jenis_dokumen?: { kode?: string; nama?: string } | null;
  dokumen_versi?: Array<{
    nama_file?: string;
    ukuran_byte?: number;
    versi_ke?: number;
  }>;
};

export type ServerPreparationSubmission = {
  paket_id: number;
  pengisian_id: number | null;
  status: string;
  versi: number;
  pengajuan: {
    pengajuan_id: number;
    diajukan_oleh: number;
    diajukan_pada: string;
    snapshot?: unknown;
  } | null;
  review: {
    persetujuan_id: number;
    pengguna_id: number;
    keputusan: string;
    catatan: string | null;
    waktu: string;
    dokumen_id: number | null;
    dok_versi_id: number | null;
  } | null;
  aturan: {
    mode: string;
    validasi_kelengkapan_resmi_aktif: boolean;
  };
};

export type ContractDraft = {
  nama_paket: string;
  nomor_kontrak: string;
  tahun_anggaran: string;
  nama_ppk: string;
  tgl_spmk: string;
};

export type ChecklistDraft = Record<number, {
  jawaban: 'Ya' | 'Tidak' | null;
  keterangan: string;
}>;

export function contractDraft(contract: ServerContract): ContractDraft {
  return {
    nama_paket: contract.nama_paket ?? '',
    nomor_kontrak: contract.nomor_kontrak ?? '',
    tahun_anggaran: contract.tahun_anggaran === null ? '' : String(contract.tahun_anggaran),
    nama_ppk: contract.nama_ppk ?? '',
    tgl_spmk: contract.tgl_spmk ?? '',
  };
}

function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function buildContractPatch(contract: ServerContract, draft: ContractDraft) {
  const namaPaket = draft.nama_paket.trim();
  const nomorKontrak = draft.nomor_kontrak.trim();
  const tahun = Number(draft.tahun_anggaran);
  const namaPpk = draft.nama_ppk.trim();
  const tglSpmk = draft.tgl_spmk.trim();

  if (!namaPaket) throw new Error('Nama paket wajib diisi.');
  if (!nomorKontrak) throw new Error('Nomor kontrak wajib diisi.');
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
    throw new Error('Tahun anggaran mesti antara 2000 hingga 2100.');
  }
  if (tglSpmk && !validCalendarDate(tglSpmk)) {
    throw new Error('Tanggal SPMK tidak valid.');
  }

  const patch: Record<string, string | number | null> = {};
  if (namaPaket !== contract.nama_paket) patch.nama_paket = namaPaket;
  if (nomorKontrak !== (contract.nomor_kontrak ?? '')) patch.nomor_kontrak = nomorKontrak;
  if (tahun !== contract.tahun_anggaran) patch.tahun_anggaran = tahun;
  if (namaPpk !== (contract.nama_ppk ?? '')) patch.nama_ppk = namaPpk || null;
  if (tglSpmk !== (contract.tgl_spmk ?? '')) patch.tgl_spmk = tglSpmk || null;
  return patch;
}

export function checklistDraft(items: ServerChecklistItem[]): ChecklistDraft {
  return Object.fromEntries(items.map(item => [item.item_id, {
    jawaban: item.jawaban,
    keterangan: item.keterangan ?? '',
  }]));
}

export function groupChecklistItems(items: ServerChecklistItem[]) {
  const groups = new Map<string, ServerChecklistItem[]>();
  for (const item of items) {
    const title = item.bagian?.trim() || 'Persiapan';
    const group = groups.get(title);
    if (group) group.push(item);
    else groups.set(title, [item]);
  }
  return Array.from(groups, ([title, groupedItems]) => ({ title, items: groupedItems }));
}

export function validatePreparationPdf(file: { name: string; type: string; size: number }) {
  if (!/\.pdf$/i.test(file.name) || file.type !== 'application/pdf') {
    throw new Error('Fail Laporan Pendahuluan mesti berformat PDF.');
  }
  if (!Number.isSafeInteger(file.size) || file.size < 1) {
    throw new Error('Fail PDF kosong atau tidak dapat dibaca.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Saiz fail PDF tidak boleh melebihi 10 MB.');
  }
}

export function buildChecklistPayload(items: ServerChecklistItem[], draft: ChecklistDraft) {
  return items.map(item => {
    const value = draft[item.item_id] ?? { jawaban: item.jawaban, keterangan: item.keterangan ?? '' };
    const keterangan = value.keterangan.trim();
    return {
      item_id: item.item_id,
      jawaban: value.jawaban,
      ...(keterangan ? { keterangan } : {}),
    };
  });
}

export function canEditPreparation(role: WorkflowRole, contractStatus: string, checklistStatus?: string) {
  return role === 'Penyedia Jasa / Ketua Tim'
    && contractStatus === 'DRAFT'
    && (!checklistStatus || checklistStatus === 'DRAFT' || checklistStatus === 'PERLU_REVISI');
}

export function canSubmitPreparation(
  role: WorkflowRole,
  contractStatus: string,
  checklistStatus: string | undefined,
  hasLinkedReport: boolean,
) {
  return role === 'Penyedia Jasa / Ketua Tim'
    && contractStatus === 'DRAFT'
    && (checklistStatus === 'DRAFT' || checklistStatus === 'PERLU_REVISI')
    && hasLinkedReport;
}
