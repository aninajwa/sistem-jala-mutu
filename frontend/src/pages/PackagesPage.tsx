import { apiRequest } from '../auth/client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, Search, FolderOpen, Archive, Plus } from 'lucide-react';
import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import { derivePackageStage, packageStatus, packageWaitingFor } from '../workflow/packageStore';
import { isLegacyExample, isRoleTestMode } from '../workflow/access/packageAccess';
import { packageMenuLabel } from '../workflow/roleNavigation';
import { readDeclaredPackageSurveyScopes } from '../workflow/declaredPackageSurveyScope';
import { mapServerPackagesToDirahPackages,
  type ServerBalaiRow, type ServerPackageListResponse, type ServerPackageRow } from './serverPackageView';
import { CreatePackageDialog } from './CreatePackageDialog';
import { canCreateServerPackage, type CreatedServerPackage } from './serverPackageCreation';
type Props = { packages: Record<string, OperationalWorkflowState>; role: WorkflowRole; onOpen: (id: string) => void; onCreatePackage?: () => void; serverPackageStatuses?: Record<string, string> };
function LocalPackagesPage({ packages, role, onOpen, onCreatePackage, serverPackageStatuses }: Props) {
    const [search, setSearch] = useState(''), [balai, setBalai] = useState(''), [status, setStatus] = useState(''), [showLegacy, setShowLegacy] = useState(() => import.meta.env.DEV);
    const all = Object.values(packages), legacy = all.filter(isLegacyExample);
    const rows = useMemo(() => all.filter(s => (showLegacy || !isLegacyExample(s)) && (!balai || s.project.balai === balai) && (!status || (serverPackageStatuses ? serverPackageStatuses[s.project.id] === status : derivePackageStage(s) === status)) && `${s.project.packageName} ${s.project.id} ${s.project.contractor} ${s.project.routes.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [all, balai, status, showLegacy, search, serverPackageStatuses]);
    const statusOptions = [...new Set(all.map(item => serverPackageStatuses?.[item.project.id] ?? derivePackageStage(item)))];
    return <div className="package-page operational-list">
        <div className="package-page-head">
          <div>
            <div className="eyebrow">PENGELOLAAN PAKET QA/QC</div>
            <h1>{packageMenuLabel(role)}</h1>
            <p>{role === 'Admin' ? 'Pantau identitas dan pengaturan paket. Keputusan teknis tetap menjadi kewenangan pelaksana pemeriksaan.' : 'Pilih paket penugasan untuk melanjutkan pekerjaan atau meninjau hasil pemeriksaan.'}</p>
          </div>
          <div className="package-head-actions">
            {onCreatePackage && (role === 'Penyedia Jasa / Ketua Tim' || role === 'Admin') && (
              <button type="button" className="wf-button primary" onClick={onCreatePackage} data-testid="button-create-package-authenticated">
                <Plus size={14} /> Buat Paket
              </button>
            )}
            <span className="package-count">{rows.length} paket terlihat</span>
          </div>
        </div>
        <div className="package-list-filters"><label className="package-search"><Search size={16} /><input aria-label="Cari paket" placeholder="Cari nama paket, nomor, ruas atau penyedia…" value={search} onChange={e => setSearch(e.target.value)} /></label>
            {new Set(all.map(s => s.project.balai)).size > 1 && <select aria-label="Filter Balai paket" value={balai} onChange={e => setBalai(e.target.value)}><option value="">Seluruh Balai dalam cakupan</option>{[...new Set(all.map(s => s.project.balai))].map(value => <option key={value}>{value}</option>)}</select>}
            <select aria-label={serverPackageStatuses ? 'Filter status paket' : 'Filter tahap paket'} value={status} onChange={e => setStatus(e.target.value)}><option value="">{serverPackageStatuses ? 'Semua status paket' : 'Semua tahap'}</option>{statusOptions.map(value => <option key={value}>{value}</option>)}</select></div>
        {!!legacy.length && <details className="legacy-packages"><summary><Archive size={14} /> {legacy.length} paket contoh lama tersimpan</summary><p>Data lama tetap disimpan. Tampilkan jika diperlukan untuk pemeriksaan; tidak ada data yang dihapus.</p><label><input type="checkbox" checked={showLegacy} onChange={e => setShowLegacy(e.target.checked)} /> Tampilkan paket contoh lama</label></details>}
        <div className="package-list">{rows.map(s => {
          const contractor = s.project.contractor || 'Penyedia belum ditetapkan';
          const routes = s.project.routes?.length
            ? s.project.routes.join(', ')
            : 'Ruas belum ditetapkan';

          return (
            <article className="package-card" key={s.project.id} data-testid={`package-card-${s.project.id}`}>
              <div className="package-card-main">
                <div className="package-id">{s.project.contractNumber || s.project.id}</div>
                <h2>{s.project.packageName}</h2>
                <div className="package-meta">
                  <span><Building2 size={14} />{s.project.balai}</span>
                  <span>{s.project.semester}</span>
                </div>
                <p>{contractor} · {routes}</p>
              </div>
              <div className="package-card-status">
                <div><small>Tahap</small><strong>{serverPackageStatuses ? 'Belum diverifikasi' : derivePackageStage(s)}</strong></div>
                <div><small>Status</small><strong>{serverPackageStatuses ? serverPackageStatusLabel(serverPackageStatuses[s.project.id]) : packageStatus(s)}</strong></div>
                <div><small>Tanggung jawab berikutnya</small><strong>{serverPackageStatuses ? 'Belum ditentukan' : packageWaitingFor(s)}</strong></div>
                <button className="wf-button primary" onClick={() => onOpen(s.project.id)}>
                  Buka paket <ArrowRight size={15} />
                </button>
              </div>
            </article>
          );
        })}</div>
        {!rows.length && <div className="package-empty"><FolderOpen size={32} /><h2>Tidak ada paket yang sesuai</h2><p>Periksa kata pencarian, filter, atau penugasan akun.</p></div>}
    </div>;
}


// Real sessions stay on the Dirah UI. The list is refetched from the backend
// and mapped into the exact view model the Dirah component already expects.
export default function PackagesPage(props: Props) {
    return isRoleTestMode() ? <LocalPackagesPage {...props} /> : <ServerPackagesPage role={props.role} onOpen={props.onOpen} />;
}

type Balai = ServerBalaiRow;

function serverPackageStatusLabel(status: string | undefined): string {
    if (!status) return 'Belum tersedia';
    const labels: Record<string, string> = {
      DRAFT: 'Draf',
      DIAJUKAN: 'Diajukan',
      DISETUJUI: 'Disetujui',
      PERLU_REVISI: 'Perlu revisi',
    };
    return labels[status] ?? status;
}

function ServerPackagesPage({ role, onOpen }: { role: WorkflowRole; onOpen: (id: string) => void }) {
    const [packages, setPackages] = useState<ServerPackageRow[]>([]);
    const [balais, setBalais] = useState<Balai[]>([]);
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(false);
    const [createPackageOpen, setCreatePackageOpen] = useState(false);
    const [notice, setNotice] = useState('');
    const canCreate = canCreateServerPackage(role);

    function reload() { setPackages([]); setPage(1); setHasMore(false); setError(''); setLoading(true); setRevision(value => value + 1); }
    function handleCreated(item: CreatedServerPackage) {
        setCreatePackageOpen(false);
        setNotice(`Paket #${item.paket_id} (${item.nama_paket}) berhasil dibuat dengan status ${item.status}.`);
        reload();
    }

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        apiRequest<ServerPackageListResponse>(`/paket?page=${page}`, { signal: controller.signal })
            .then(result => {
                if (controller.signal.aborted) return;
                if (!Array.isArray(result.data)) throw new Error('Format respons paket tidak sesuai.');
                const packageIds = [...new Set(result.data.map(item => item.paket_id))];
                const loadingRows = result.data.map(item => ({ ...item, declared_survey_scope_read_status: 'loading' as const }));
                setPackages(current => page === 1 ? loadingRows : [...new Map([...current, ...loadingRows].map(item => [item.paket_id, item])).values()]);
                setHasMore(result.data.length >= (result.page_size > 0 ? result.page_size : 50));
                if (!packageIds.length) return;
                return readDeclaredPackageSurveyScopes(
                  packageIds,
                  (path) => apiRequest<{ data: unknown }>(path, { signal: controller.signal }),
                ).then(scopes => {
                  if (controller.signal.aborted) return;
                  setPackages(current => current.map(item => {
                    if (!packageIds.includes(item.paket_id)) return item;
                    const scope = scopes.get(item.paket_id);
                    return scope
                      ? { ...item, declared_survey_scope: scope, declared_survey_scope_read_status: undefined }
                      : { ...item, declared_survey_scope: undefined, declared_survey_scope_read_status: 'error' };
                  }));
                }).catch(() => {
                  if (!controller.signal.aborted) setPackages(current => current.map(item => packageIds.includes(item.paket_id)
                    ? { ...item, declared_survey_scope: undefined, declared_survey_scope_read_status: 'error' }
                    : item));
                });
            })
            .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Gagal memuat paket.'); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [page, revision]);

    useEffect(() => {
        const controller = new AbortController();
        apiRequest<{ data: Balai[] }>('/balai', { signal: controller.signal })
            .then(result => {
                if (controller.signal.aborted) return;
                if (!Array.isArray(result.data)) throw new Error('Format balai tidak sesuai.');
                setBalais(result.data);
            })
            .catch(() => { /* Nama balai tetap berjalan lewat fallback Balai #id pada mapping. */ });
        return () => controller.abort();
    }, [revision]);

    // Backend paket → view model UI Dirah.
    const dirahPackages = useMemo(() => {
        const mapped = mapServerPackagesToDirahPackages(packages, balais, role);
        return mapped;
    }, [packages, balais, role]);
    const serverPackageStatuses = useMemo(
      () => Object.fromEntries(packages.map(item => [String(item.paket_id), item.status])),
      [packages],
    );

    if (loading && !packages.length) {
        return <div className="package-page operational-list">
            <div className="package-page-head"><div><div className="eyebrow">PENGELOLAAN PAKET QA/QC</div><h1>{packageMenuLabel(role)}</h1><p>Daftar paket diambil dari server sesuai akun yang sedang masuk.</p></div>{canCreate && <button type="button" className="wf-button primary" onClick={() => setCreatePackageOpen(true)}><Plus size={16} /> Buat Paket</button>}</div>
            <p role="status">Memuat paket dari server…</p>
            {createPackageOpen && <CreatePackageDialog onClose={() => setCreatePackageOpen(false)} onCreated={handleCreated} />}
        </div>;
    }

    return <div className="package-page operational-list">
        {notice && <div role="status" className="wf-callout" style={{ marginBottom: 12 }}>{notice}</div>}
        {error && <div role="alert" className="wf-callout"><p>{error}</p><button type="button" className="wf-button" disabled={loading} onClick={reload}>Coba lagi</button></div>}
        {/* UI Dirah asli dipertahankan utuh; data di dalamnya dari backend. */}
        <LocalPackagesPage
          packages={dirahPackages}
          role={role}
          onOpen={onOpen}
          serverPackageStatuses={serverPackageStatuses}
          onCreatePackage={canCreate ? () => { setNotice(''); setCreatePackageOpen(true); } : undefined}
        />
        {hasMore && <div><p>Carian dan filter berlaku pada paket yang sudah dimuat. Muat berikutnya untuk melihat lebih banyak paket.</p><button type="button" className="wf-button primary" disabled={loading || !!error} onClick={() => setPage(value => value + 1)}>Muat paket berikutnya <ArrowRight size={15} /></button></div>}
        {createPackageOpen && (
          <CreatePackageDialog onClose={() => setCreatePackageOpen(false)} onCreated={handleCreated} />
        )}
    </div>;

}
