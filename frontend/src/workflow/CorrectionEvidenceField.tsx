import { useEffect, useState } from 'react';
import { ATTACHMENT_CHANGED, attachmentRepository, downloadLocalFile, type LocalFile } from './repository/attachmentRepository';
import { readEvidenceLinks, updateEvidenceLink } from './repository/evidenceLinks';
import './correctionEvidence.css';

type EvidenceFile = { key: string; name: string; size: number; record: LocalFile | null };
type Props = {
  scope: string;
  editable: boolean;
  note: string;
  onNoteChange?: (value: string) => void;
  noFile?: boolean;
  allowNoFile?: boolean;
  onNoFileChange?: (checked: boolean) => void;
  onChanged?: () => void;
};

export function CorrectionEvidenceField({scope, editable, note, onNoteChange, noFile = false, onNoFileChange, onChanged,
allowNoFile = true}: Props) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const prefix = `${scope}:documents:`;

  useEffect(() => {
    let live = true;
    const load = async () => {
      const links = readEvidenceLinks(scope);
      const metadata = attachmentRepository.metadata();
      const keys = [...new Set([...Object.keys(metadata).filter(key => key.startsWith(prefix)), ...Object.keys(links)])]
        .filter(key => key.startsWith(prefix) && !links[key]?.detached);
      const results = await Promise.all(keys.map(async key => {
        const fileKey = links[key]?.fileKey ?? key;
        const meta = metadata[fileKey];
        if (!meta) return null;
        const record = await attachmentRepository.get(fileKey).catch(() => null);
        return { key, name: meta.name, size: meta.size, record };
      }));
      if (live) setFiles(results.filter((item): item is EvidenceFile => item !== null));
    };
    void load();
    const changed = () => { void load(); };
    window.addEventListener(ATTACHMENT_CHANGED, changed);
    return () => { live = false; window.removeEventListener(ATTACHMENT_CHANGED, changed); };
  }, [scope, prefix]);

  async function upload(selected: FileList | null) {
    if (!editable || busy || !selected?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(selected)) {
        if (file.size > 25 * 1024 * 1024) throw new Error('Maksimum 25 MB per file.');
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) throw new Error('Gunakan PDF, JPG, PNG, atau WEBP.');
        const key = prefix + crypto.randomUUID();
        await attachmentRepository.put(key, file);
        updateEvidenceLink(scope, key, { category: 'Bukti foto/video', categories: ['Bukti foto/video'], status: 'Tersedia' }, 'Tambahkan bukti koreksi');
      }
      setNotice('Berkas tersimpan di perangkat ini.');
      onChanged?.();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Berkas belum berhasil disimpan.');
    } finally { setBusy(false); }
  }

  function detach(key: string) {
    if (!editable || busy) return;
    try {
      updateEvidenceLink(scope, key, { detached: true }, 'Lepaskan bukti koreksi');
      setFiles(current => current.filter(item => item.key !== key));
      onChanged?.();
    } catch { setNotice('Berkas belum berhasil dilepaskan.'); }
  }

  return <section className="corr-evidence" aria-label="Bukti pendukung">
    <div className="corr-evidence-head"><strong>Bukti pendukung</strong><span>{files.length} file</span></div>
    <label className="corr-evidence-note-label">Catatan / referensi
      {editable
        ? <textarea value={note} onChange={e => onNoteChange?.(e.target.value)} placeholder="Jelaskan lokasi, hasil pemeriksaan, dan bukti yang mendukung tindakan" rows={3}/>
        : <p className="corr-evidence-readonly">{note || 'Belum ada catatan.'}</p>}
    </label>
    <div className="corr-evidence-list">
      {files.map(file => <div className="corr-evidence-item" key={file.key}>
        <div className="corr-evidence-file"><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB · {file.record ? 'Berkas lokal' : 'Belum dapat dibuka'}</small></div>
        <div className="corr-evidence-buttons">
          <button type="button" className="wf-button" disabled={!file.record} onClick={() => { if (file.record) downloadLocalFile(file.record); }}>Unduh</button>
          {editable && <button type="button" className="wf-button" onClick={() => detach(file.key)}>Hapus</button>}
        </div>
      </div>)}
    </div>
    {editable && <div className="corr-evidence-actions">
      <label className="corr-evidence-upload">+ Tambah file
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" multiple disabled={busy || noFile} onChange={e => { void upload(e.currentTarget.files); e.currentTarget.value = ''; }}/>
      </label>
      {allowNoFile && files.length === 0 && (
  <label className="corr-evidence-no-file"><input type="checkbox" checked={noFile} onChange={e => onNoFileChange?.(e.target.checked)}/> Tanpa file pendukung (sertakan alasan di catatan</label>
)}
    </div>}
    {files.length === 0 && !editable && <small className="corr-evidence-muted">Tidak ada berkas yang dapat diperiksa pada perangkat ini.</small>}
    <small className="corr-evidence-muted">Lampiran tersimpan lokal; akses lintas perangkat memerlukan server dokumen.</small>
    {notice && <p role="status" className="corr-evidence-notice">{notice}</p>}
  </section>;
}
