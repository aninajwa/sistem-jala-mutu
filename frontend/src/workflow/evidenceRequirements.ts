export const STAGE0_REQUIRED_EVIDENCE = [
  { id: 'stage0-laporan-pendahuluan', label: 'Laporan Pendahuluan' },
  { id: 'stage0-program-mutu', label: 'Program Mutu / Quality Management Plan' },
];

export const STAGE4_REQUIRED_EVIDENCE = [
  { id: 'stage4-raw-package', label: 'Paket / referensi data sumber' },
  { id: 'stage4-validated-package', label: 'Paket / referensi data tervalidasi' },
];

export const STAGE6_REQUIRED_EVIDENCE = [
  { id: 'stage6-final-report', label: 'Laporan akhir' },
  { id: 'stage6-final-acceptance-ba', label: 'Berita Acara Penerimaan' },
];

export function auditEvidenceRequirements(level: 1 | 2 | 3) {
  return [
    { id: `stage5-audit-${level}-evidence`, label: `Bukti Audit Tingkat ${level}` },
    { id: `stage5-audit-${level}-ba`, label: level === 1 ? 'Dokumen audit internal' : `Berita Acara Audit Tingkat ${level}` },
  ];
}

export function auditStartEvidenceRequirements(level: 1 | 2 | 3) {
  return [
    ...STAGE0_REQUIRED_EVIDENCE,
    ...STAGE4_REQUIRED_EVIDENCE,
    ...([1, 2, 3] as const)
      .filter(previousLevel => previousLevel < level)
      .flatMap(auditEvidenceRequirements),
  ];
}

export const FINAL_ACCEPTANCE_EVIDENCE = [
  ...STAGE0_REQUIRED_EVIDENCE,
  ...STAGE4_REQUIRED_EVIDENCE,
  ...auditEvidenceRequirements(1),
  ...auditEvidenceRequirements(2),
  ...auditEvidenceRequirements(3),
  ...STAGE6_REQUIRED_EVIDENCE,
];
