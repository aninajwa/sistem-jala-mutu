export const STAGE0_EVIDENCE_CATEGORIES = [
  'Laporan Pendahuluan',
  'Program Mutu / Quality Management Plan',
  'RMPK',
  'RKK',
  'RMLLP',
  'Bukti Koordinasi',
] as const;

export const STAGE0_LEGACY_EVIDENCE_IDS = [
  'stage0-laporan-pendahuluan',
  'stage0-program-mutu',
  'stage0-rmpk',
  'stage0-rkk',
  'stage0-rmllp',
  'stage0-koordinasi',
] as const;

export type EvidencePresence = 'berkas-lokal' | 'perlu-perbaikan' | 'referensi' | 'belum-tercatat';
export type EvidenceFileLink = {
  key: string;
  fileKey?: string;
  categories: string[];
  status: string;
  detached?: boolean;
};
export type Stage0EvidenceInput = {
  links: EvidenceFileLink[];
  availableKeys: ReadonlySet<string>;
  legacyReferences: Record<string, { reference?: string; fileName?: string }>;
};

/** Ringkasan keberadaan evidence saja; tidak menentukan kelulusan KAK atau keputusan Balai. */
export function summarizeStage0Evidence(input: Stage0EvidenceInput) {
  return STAGE0_EVIDENCE_CATEGORIES.map((category, index) => {
    const linked = input.links.filter(link =>
      !link.detached && link.categories.includes(category) && input.availableKeys.has(link.fileKey ?? link.key));
    const usable = linked.some(link => link.status !== 'Perlu perbaikan');
    const needsRepair = linked.length > 0 && !usable;
    const legacy = input.legacyReferences[STAGE0_LEGACY_EVIDENCE_IDS[index]];
    const hasReference = Boolean(legacy?.reference?.trim() || legacy?.fileName?.trim());
    const status: EvidencePresence = usable ? 'berkas-lokal'
      : needsRepair ? 'perlu-perbaikan'
      : hasReference ? 'referensi' : 'belum-tercatat';
    return { category, status, count: linked.length };
  });
}
