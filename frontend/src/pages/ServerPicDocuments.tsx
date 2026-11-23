import { useEffect, useState } from 'react';
import { apiRequest } from '../auth/client';
import { PageHeading } from '../components/app/AppComponents';
import { loadServerPackages } from './serverDashboard';
import type { WorkflowRole } from '../workflow/model';
import { authorizedPackageOptions, initialAuthorizedPackageId, packageDocumentsUrl, readPackageDocuments } from './serverPicDocumentsData';
import type { ServerPreparationDocument } from './serverPreparation';

const PIC_ROLE: WorkflowRole = 'PIC Balai / Pengguna Jasa';

export function ServerPicDocuments({ requestedPackageId }: { requestedPackageId: string | null }) {
  const [packages, setPackages] = useState<Array<{ id: string; name: string }>>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState('');
  const [packageId, setPackageId] = useState(requestedPackageId ?? '');
  const [documents, setDocuments] = useState<ServerPreparationDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsRead, setDocumentsRead] = useState(false);
  const [documentsError, setDocumentsError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setPackages([]);
    setPackageId(requestedPackageId ?? '');
    setPackagesLoading(true);
    setPackagesError('');
    loadServerPackages(controller.signal, PIC_ROLE)
      .then(rows => {
        if (controller.signal.aborted) return;
        const allowed = authorizedPackageOptions(rows);
        setPackages(allowed);
        setPackageId(current => initialAuthorizedPackageId(allowed, requestedPackageId, current));
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setPackages([]);
          setPackageId('');
          setPackagesError(error instanceof Error ? error.message : 'Gagal memuat paket yang menjadi kewenangan Anda.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setPackagesLoading(false); });
    return () => controller.abort();
  }, [requestedPackageId]);

  useEffect(() => {
    if (!packageId || !packages.some(item => item.id === packageId)) {
      setDocuments([]);
      setDocumentsRead(false);
      setDocumentsError('');
      return;
    }
    const controller = new AbortController();
    setDocuments([]);
    setDocumentsRead(false);
    setDocumentsError('');
    setDocumentsLoading(true);
    readPackageDocuments(packageId, (path, init) => apiRequest(path, { ...init, signal: controller.signal }))
      .then(result => {
        if (controller.signal.aborted) return;
        setDocuments(result);
        setDocumentsRead(true);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setDocuments([]);
          setDocumentsError(error instanceof Error ? error.message : 'Gagal membaca dokumen paket dari server.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setDocumentsLoading(false); });
    return () => controller.abort();
  }, [packageId, packages]);

  function choosePackage(nextId: string) {
    setPackageId(nextId);
    window.history.replaceState(window.history.state, '', packageDocumentsUrl(window.location.href, nextId || null));
  }

  const packageName = packages.find(item => item.id === packageId)?.name;

  return (
    <main className="documents-page dr-page">
      <PageHeading label="Dokumen & BA Paket" detail="Daftar paket dan dokumen dibaca dari API server sesuai kewenangan PIC Balai." />
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
        {!packagesLoading && !packagesError && !packages.length &&
          <p role="status">Belum ada paket dalam kewenangan Anda.</p>}
      </section>

      {packageId && packageName && <section className="dr-panel" aria-label="Dokumen paket terpilih">
        <div className="dr-panel-head"><h2>Dokumen · {packageName}</h2><span>Paket #{packageId}</span></div>
        <p className="wf-note">Daftar ini menggunakan API dokumen persiapan paket. BA workflow belum tersedia melalui API baca dokumen.</p>
        {documentsLoading && <p role="status">Memuat dokumen dari server…</p>}
        {documentsError && <p role="alert">Gagal membaca dokumen paket: {documentsError}</p>}
        {!documentsLoading && !documentsError && documentsRead && documents.length === 0 &&
          <p role="status">Belum ada dokumen untuk paket ini</p>}
        {!documentsLoading && !documentsError && documents.map(document => (
          <article className="dr-record" key={document.dokumen_id}>
            <div className="dr-record-main">
              <strong>{document.judul}</strong>
              <span>Dokumen #{document.dokumen_id} · {document.jenis_dokumen?.nama ?? 'Jenis dokumen belum tersedia'}</span>
              <span>Status: {document.status} · Versi aktif: {document.versi_aktif}</span>
            </div>
          </article>
        ))}
      </section>}
    </main>
  );
}
