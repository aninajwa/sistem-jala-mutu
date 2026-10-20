export type EvidenceRequirement = { id: string; label: string };
export type EvidenceStore = Record<string, unknown>;

export function passesEvidenceGate(baseChecksPass: boolean, missingEvidence: readonly string[]): boolean {
  return baseChecksPass && missingEvidence.length === 0;
}

export function hasEvidenceRecord(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as { fileName?: unknown; reference?: unknown };
  return [record.fileName, record.reference].some(
    entry => typeof entry === 'string' && entry.trim().length > 0,
  );
}

export function missingEvidenceFromStore(
  packageId: string,
  requirements: readonly EvidenceRequirement[],
  store: EvidenceStore,
): string[] {
  return requirements
    .filter(item => !hasEvidenceRecord(store[`${packageId}:${item.id}`]))
    .map(item => item.label);
}
