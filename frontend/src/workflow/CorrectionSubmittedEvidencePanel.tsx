import { useEffect, useState } from 'react';
import { ATTACHMENT_CHANGED, attachmentRepository, downloadLocalFile, type LocalFile } from './repository/attachmentRepository';
import { EVIDENCE_LINK_CHANGED, readEvidenceLinks } from './repository/evidenceLinks';
import { submittedCorrectionEvidenceKeys, correctionEvidenceDigest, correctionEvidenceIntegrity } from './correctionSubmittedEvidence';
import './correctionEvidence.css';

async function readSubmittedFile(key: string, expected?: string) {
  const scope = key.slice(0, key.lastIndexOf(':documents:'));
  const link = readEvidenceLinks(scope)[key];
  const actualKey = link?.fileKey ?? key;
  const meta = attachmentRepository.metadata()[actualKey];
  const file = link?.detached ? null : await attachmentRepository.get(actualKey).catch(() => null);
  const actual = file ? await correctionEvidenceDigest(file.file).catch(() => null) : null;
  const integrity = actual ? correctionEvidenceIntegrity(expected, actual) : 'unavailable';
  return { key, file: integrity === 'mismatch' || integrity === 'unavailable' ? null : file, name: file?.name ?? meta?.name, integrity } as Entry;
}
type Entry = { key: string; file: LocalFile | null; name?: string; integrity?: "legacy" | "matched" | "mismatch" | "unavailable" };
export function CorrectionSubmittedEvidence({ projectId, caseId, keys, digests }: { projectId: string; caseId: string; keys: readonly string[]; digests?: Record<string, string> }) {
  const signature = JSON.stringify(submittedCorrectionEvidenceKeys(keys, projectId, caseId).map(key => [key, digests?.[key]]));
  const [result, setResult] = useState<{ signature: string; entries: Entry[] } | null>(null);
  useEffect(() => {
    let live = true, generation = 0;
    async function load() {
      const request = ++generation;
      if (live) setResult(null);
      const entries: Entry[] = await Promise.all((JSON.parse(signature) as [string, string | null][]).map(async ([key, expected]) => {
        return readSubmittedFile(key, expected ?? undefined);
      }));
      if (live && request === generation) setResult({ signature, entries });
    }
    void load();
    window.addEventListener(ATTACHMENT_CHANGED, load);
    window.addEventListener(EVIDENCE_LINK_CHANGED, load);
    window.addEventListener("storage", load);
    return () => { live = false; window.removeEventListener(ATTACHMENT_CHANGED, load); window.removeEventListener(EVIDENCE_LINK_CHANGED, load); window.removeEventListener("storage", load); };
  }, [signature]);
  const [downloadNotice, setDownloadNotice] = useState('');
  async function download(key: string) {
    setDownloadNotice('');
    const current = await readSubmittedFile(key, digests?.[key]);
    if (current.file) downloadLocalFile(current.file);
    else setDownloadNotice('Lampiran berubah atau tidak tersedia. Periksa kembali referensi hasil pelaksanaan.');
  }
  const entries = result?.signature === signature ? result.entries : null;
  return <section className="corr-evidence corr-evidence-submitted" aria-label="Lampiran hasil pelaksanaan">
    <div className="corr-evidence-head"><strong>Lampiran hasil pelaksanaan</strong><span>{JSON.parse(signature).length} referensi</span></div>
    {entries === null ? <small role="status">Memuat lampiran…</small> : entries.length === 0 ? <small>Belum ada referensi lampiran yang tercatat.</small> :
      <div className="corr-evidence-list">{entries.map((entry, i) => <div key={entry.key} className="corr-evidence-item">
        <div className="corr-evidence-file"><strong>{entry.name || `Lampiran ${i+1}`}</strong><small>{entry.integrity === 'mismatch' ? 'Isi berkas berbeda dari saat pengajuan' : entry.integrity === 'matched' ? 'Isi sesuai saat pengajuan · Berkas lokal' : entry.file ? 'Berkas lokal · Keutuhan versi lama belum tercatat' : 'Berkas belum tersedia di perangkat ini'}</small></div>
        <button type="button" className="wf-button" disabled={!entry.file} onClick={() => { void download(entry.key); }}>Unduh</button>
      </div>)}</div>}
    {downloadNotice && <small role="status">{downloadNotice}</small>}
  </section>;
}
