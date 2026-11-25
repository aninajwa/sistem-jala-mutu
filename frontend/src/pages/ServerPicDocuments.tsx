import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Stamp } from 'lucide-react';
import { apiBlob, apiRequest } from '../auth/client';
import { PageHeading } from '../components/app/AppComponents';
import { loadServerPackages } from './serverDashboard';
import type { WorkflowRole } from '../workflow/model';
import { authorizedPackageOptions, initialAuthorizedPackageId, packageDocumentsUrl, readPackageDocuments } from './serverPicDocumentsData';
import type { ServerPreparationDocument } from './serverPreparation';

type BeritaAcara = { ba_id: number; jenis: string; nomor: string; tanggal: string | null; sumber_tipe: string | null; status: string | null; penandatangan: Array<{ jabatan: string; waktu: string }> };

const BA_LABEL: Record<string, string> = {
  AUDIT_INTERNAL: 'BA Audit Internal (Tahap 5 · tingkat 1)', VERVAL_PENGGUNA_JASA: 'BA Verval Pengguna Jasa (Tahap 5 · tingkat 2)',
  VERVAL_DIREKTORAT: 'BA Verval Direktorat (Tahap 5 · tingkat 3)', VERVAL_2_MINGGUAN: 'BA Verval 2-Mingguan (Tahap 3B)',
  PENERIMAAN_PARSIAL: 'BA Penerimaan parsial (Tahap 6)', PENERIMAAN_AKHIR: 'BA Penerimaan akhir (Tahap 6)',
};
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const size = (bytes?: number) => bytes ? `${(bytes / 1024 / 1024).toFixed(bytes > 1048576 ? 1 : 2)} MB` : '';

/** Logged-in users (every role): package PDFs from Supabase Storage, openable in the browser, plus the package's Berita Acara. */
export function ServerDocuments({ requestedPackageId, role }: { requestedPackageId: string | null; role: WorkflowRole }) {
  const [packages, setPackages] = useState<Array<{ id: string; name: string }>>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState('');
  const [packageId, setPackageId] = useState(requestedPackageId ?? '');
  const [documents, setDocuments] = useState<ServerPreparationDocument[]>([]);
  const [baRows, setBaRows] = useState<BeritaAcara[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsRead, setDocumentsRead] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [opening, setOpening] = useState<number | null>(null);
  const [openError, setOpenError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setPackages([]); setPackageId(requestedPackageId ?? ''); setPackagesLoading(true); setPackagesError('');
    loadServerPackages(controller.signal, role)
      .then(rows => {
        if (controller.signal.aborted) return;
        const allowed = authorizedPackageOptions(rows);
        setPackages(allowed);
        setPackageId(current => initialAuthorizedPackageId(allowed, requestedPackageId, current));
      })
      .catch(error => {
        if (!controller.signal.aborted) { setPackages([]); setPackageId(''); setPackagesError(error instanceof Error ? error.message : 'Gagal memuat paket yang menjadi kewenangan Anda.'); }
      })
      .finally(() => { if (!controller.signal.aborted) setPackagesLoading(false); });
    return () => controller.abort();
  }, [requestedPackageId, role]);

  useEffect(() => {
    if (!packageId || !packages.some(item => item.id === packageId)) { setDocuments([]); setBaRows([]); setDocumentsRead(false); setDocumentsError(''); return; }
    const controller = new AbortController();
    setDocuments([]); setBaRows([]); setDocumentsRead(false); setDocumentsError(''); setDocumentsLoading(true);
    Promise.all([
      readPackageDocuments(packageId, (path, init) => apiRequest(path, { ...init, signal: controller.signal })),
      apiRequest<{ data: BeritaAcara[] }>(`/paket/${encodeURIComponent(packageId)}/berita-acara`, { signal: controller.signal })
        .then(result => Array.isArray(result.data) ? result.data : []).catch(() => [] as BeritaAcara[]),
    ]).then(([docs, ba]) => {
      if (controller.signal.aborted) return;
      setDocuments(docs); setBaRows(ba); setDocumentsRead(true);
    }).catch(error => {
      if (!controller.signal.aborted) { setDocuments([]); setDocumentsError(error instanceof Error ? error.message : 'Gagal membaca dokumen paket dari server.'); }
    }).finally(() => { if (!controller.signal.aborted) setDocumentsLoading(false); });
    return () => controller.abort();
  }, [packageId, packages]);

  function choosePackage(nextId: string) {
    setPackageId(nextId);
    window.history.replaceState(window.history.state, '', packageDocumentsUrl(window.location.href, nextId || null));
  }

  async function openPdf(document: ServerPreparationDocument) {
    // Open the tab synchronously so the browser does not block it as a pop-up.
    const tab = window.open('', '_blank');
    setOpening(document.dokumen_id); setOpenError('');
    try {
      const blob = await apiBlob(`/paket/${encodeURIComponent(packageId)}/dokumen/${document.dokumen_id}/download`);
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      if (tab) tab.location.href = url; else window.location.assign(url);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      tab?.close();
      setOpenError(error instanceof Error ? error.message : 'Dokumen gagal dibuka.');
    } finally { setOpening(null); }
  }

  const packageName = packages.find(item => item.id === packageId)?.name;

  return (
    <main className="documents-page dr-page" data-testid="server-documents">
      <PageHeading label="Dokumen & BA Paket" detail="Dokumen PDF tersimpan di Supabase Storage dan Berita Acara dibaca dari server sesuai kewenangan Anda." />
      <section className="dr-panel" aria-label="Pilih paket dokumen">
        <label className="document-category-label">Paket
          <select aria-label="Paket dokumen" value={packageId} disabled={packagesLoading || !!packagesError} onChange={event => choosePackage(event.target.value)}>
            <option value="">Pilih paket</option>
            {packages.map(item => <option value={item.id} key={item.id}>{item.name} · #{item.id}</option>)}
          </select>
        </label>
        {packagesLoading && <p role="status">Memuat paket dalam kewenangan Anda…</p>}
        {packagesError && <p role="alert">Gagal memuat daftar paket: {packagesError}</p>}
        {!packagesLoading && !packagesError && requestedPackageId && !packageId &&
          <p role="alert">Paket #{requestedPackageId} tidak ditemukan atau tidak termasuk kewenangan Anda.</p>}
        {!packagesLoading && !packagesError && !packages.length && <p role="status">Belum ada paket dalam kewenangan Anda.</p>}
      </section>

      {packageId && packageName && <>
        <section className="dr-panel" aria-label="Dokumen paket terpilih">
          <div className="dr-panel-head"><h2><FileText size={16} /> Dokumen · {packageName}</h2><span>Paket #{packageId}</span></div>
          {documentsLoading && <p role="status">Memuat dokumen dari server…</p>}
          {documentsError && <p role="alert">Gagal membaca dokumen paket: {documentsError}</p>}
          {openError && <p role="alert" className="wf-callout danger">{openError}</p>}
          {!documentsLoading && !documentsError && documentsRead && documents.length === 0 && <p role="status">Belum ada dokumen untuk paket ini.</p>}
          {!documentsLoading && !documentsError && documents.map(document => {
            const active = document.dokumen_versi?.find(version => version.versi_ke === document.versi_aktif);
            return (
              <article className="dr-record" key={document.dokumen_id} data-testid={`document-${document.dokumen_id}`}>
                <div className="dr-record-main">
                  <strong>{document.judul}</strong>
                  <span>{document.jenis_dokumen?.nama ?? 'Jenis dokumen belum tersedia'} · Versi {document.versi_aktif}{active?.nama_file ? ` · ${active.nama_file}` : ''}{active?.ukuran_byte ? ` · ${size(active.ukuran_byte)}` : ''}</span>
                </div>
                <button type="button" className="wf-button primary" data-testid={`document-open-${document.dokumen_id}`} disabled={opening !== null} onClick={() => void openPdf(document)}>
                  <ExternalLink size={13} /> {opening === document.dokumen_id ? 'Membuka…' : 'Buka PDF'}
                </button>
              </article>
            );
          })}
        </section>
        <section className="dr-panel" aria-label="Berita Acara paket" data-testid="server-berita-acara">
          <div className="dr-panel-head"><h2><Stamp size={16} /> Berita Acara</h2><span>{baRows.length} BA</span></div>
          {documentsRead && baRows.length === 0 && <p role="status">Belum ada Berita Acara yang tercatat untuk paket ini.</p>}
          {baRows.map(ba => (
            <article className="dr-record" key={ba.ba_id}>
              <div className="dr-record-main">
                <strong>{BA_LABEL[ba.jenis] ?? ba.jenis}</strong>
                <span>Nomor {ba.nomor} · {date(ba.tanggal)} · {ba.status ?? '—'}{ba.penandatangan.length ? ` · Ditandatangani ${ba.penandatangan.map(t => t.jabatan).join(', ')}` : ''}</span>
              </div>
            </article>
          ))}
        </section>
      </>}
    </main>
  );
}

/** Kept for existing imports: the PIC view is the shared server view. */
export function ServerPicDocuments({ requestedPackageId }: { requestedPackageId: string | null }) {
  return <ServerDocuments requestedPackageId={requestedPackageId} role="PIC Balai / Pengguna Jasa" />;
}
