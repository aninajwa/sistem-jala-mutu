import { useEffect, useMemo, useState } from 'react';
import type { SurveyType } from './model';
import { sourceDocument } from './sourceDocumentModel';
import { attachmentRepository, ATTACHMENT_CHANGED, downloadLocalFile } from './repository/attachmentRepository';
import { readEvidenceLinks } from './repository/evidenceLinks';

/** Read-only projection of the existing checklist evidence; never copies or re-uploads bytes. */
export function Stage3BSourceEvidenceIndex({packageId, period, surveys, pciManual=true}: {
  packageId:string;
  period:number;
  surveys:SurveyType[];
  pciManual?:boolean;
}) {
  const [revision, refresh] = useState(0);
  useEffect(() => {
    const handler = () => refresh(value => value + 1);
    window.addEventListener(ATTACHMENT_CHANGED, handler);
    return () => window.removeEventListener(ATTACHMENT_CHANGED, handler);
  }, []);
  const periodScope = period === 1 ? packageId : `${packageId}::period-${period}`;
  const entries = useMemo(() => {
    const metadata = attachmentRepository.metadata();
    return surveys.flatMap(survey => (['consistency', 'internal', 'periodic14'] as const).flatMap(phase => {
      const source = sourceDocument(survey, phase, pciManual);
      if (!source) return [];
      const scope = `${periodScope}:form-${source.id}`;
      const links = readEvidenceLinks(scope);
      const prefix = `${scope}:documents:`;
      return [...new Set([
        ...Object.keys(metadata).filter(key => key.startsWith(prefix)),
        ...Object.keys(links),
      ])].filter(key => !links[key]?.detached).flatMap(key => {
        const fileKey = links[key]?.fileKey ?? key;
        const item = metadata[fileKey];
        return item ? [{key, fileKey, survey, phase, name:item.name}] : [];
      });
    }));
  }, [periodScope, surveys.join('|'), pciManual, revision]);
  const [notice, setNotice] = useState('');
  if (entries.length === 0) return <p className="wf-note">Belum ada lampiran formulir pemeriksaan berkala yang tersimpan di perangkat ini.</p>;
  return <div className="stage-evidence-index" aria-label="Bukti formulir periode yang sudah tersimpan">
    {entries.map(entry => <div className="stage4-summary-row" key={`${entry.phase}:${entry.survey}:${entry.key}`}>
      <span><strong>{entry.survey}</strong> · {entry.phase==='consistency'?'Konsistensi':entry.phase==='internal'?'V&V Internal':'V&V Bersama'}<small>{entry.name}</small></span>
      <button type="button" className="wf-button" onClick={() => {
        void attachmentRepository.get(entry.fileKey).then(record => {
          if (record) downloadLocalFile(record);
          else setNotice('Berkas tidak tersedia pada perangkat ini.');
        }).catch(() => setNotice('Berkas belum dapat dibuka.'));
      }}>Unduh</button>
    </div>)}
    {notice && <p role="status">{notice}</p>}
  </div>;
}
