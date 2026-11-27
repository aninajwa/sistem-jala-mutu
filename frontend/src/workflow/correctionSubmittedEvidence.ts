/** Only submitted execution references are displayed; unrelated local uploads are excluded. */
export function submittedCorrectionEvidenceKeys(keys: unknown, projectId: string, caseId: string): string[] {
  const base = `${projectId}::correction::${caseId}::execution`;
  if (!Array.isArray(keys)) return [];
  return [...new Set(keys.filter((key): key is string => {
    if (typeof key !== 'string' || key !== key.trim() || !key.startsWith(base)) return false;
    const rest = key.slice(base.length);
    const match = /^(?:::submission-[1-9]\d*)?:documents:(.+)$/.exec(rest);
    return !!match && !!match[1].trim();
  }))];
}

/** Hash the bytes, not mutable local metadata. This is local integrity, not authentication. */
export async function correctionEvidenceDigest(file: Blob): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export function validCorrectionEvidenceDigests(keys: readonly string[], digests: unknown): boolean {
  if (!digests || typeof digests !== 'object' || Array.isArray(digests)) return false;
  const entries = Object.entries(digests);
  return entries.length === keys.length && entries.every(([key, digest]) => keys.includes(key) && typeof digest === 'string' && /^[a-f0-9]{64}$/.test(digest));
}
export function correctionEvidenceIntegrity(expected: string | undefined, actual: string): 'legacy' | 'matched' | 'mismatch' {
  return expected === undefined ? 'legacy' : expected === actual ? 'matched' : 'mismatch';
}
