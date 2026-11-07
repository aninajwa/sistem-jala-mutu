import { apiRequest } from '../auth/client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, Search, FolderOpen, Archive } from 'lucide-react';
import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import { derivePackageStage, packageStatus, packageWaitingFor } from '../workflow/packageStore';
import { isLegacyExample, isRoleTestMode } from '../workflow/access/packageAccess';
import { packageMenuLabel } from '../workflow/roleNavigation';
import { mapServerPackagesToDirahPackages,
  type ServerBalaiRow, type ServerPackageListResponse, type ServerPackageRow } from './serverPackageView';
type Props = { packages: Record<string, OperationalWorkflowState>; role: WorkflowRole; onOpen: (id: string) => void };
function LocalPackagesPage({ packages, role, onOpen }: Props) {
    const [search, setSearch] = useState(''), [balai, setBalai] = useState(''), [status, setStatus] = useState(''), [showLegacy, setShowLegacy] = useState(() => import.meta.env.DEV);
    const all = Object.values(packages), legacy = all.filter(isLegacyExample);
    const rows = useMemo(() => all.filter(s => (showLegacy || !isLegacyExample(s)) && (!balai || s.project.balai === balai) && (!status || derivePackageStage(s) === status) && `${s.project.packageName} ${s.project.id} ${s.project.contractor} ${s.project.routes.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [all, balai, status, showLegacy, search]);
    return <div className="package-page operational-list">
        <div className="package-page-head"><div><div className="eyebrow">PENGELOLAAN PAKET QA/QC</div><h1>{packageMenuLabel(role)}</h1><p>{role === 'Admin' ? 'Pantau identitas dan pengaturan paket. Keputusan teknis tetap menjadi kewenangan pelaksana pemeriksaan.' : 'Pilih paket penugasan untuk melanjutkan pekerjaan atau meninjau hasil pemeriksaan.'}</p></div><span className="package-count">{rows.length} paket terlihat</span></div>
        <div className="package-list-filters"><label className="package-search"><Search size={16} /><input aria-label="Cari paket" placeholder="Cari nama paket, nomor, ruas atau penyedia…" value={search} onChange={e => setSearch(e.target.value)} /></label>
            {new Set(all.map(s => s.project.balai)).size > 1 && <select aria-label="Filter Balai paket" value={balai} onChange={e => setBalai(e.target.value)}><option value="">Seluruh Balai dalam cakupan</option>{[...new Set(all.map(s => s.project.balai))].map(value => <option key={value}>{value}</option>)}</select>}
            <select aria-label="Filter tahap paket" value={status} onChange={e => setStatus(e.target.value)}><option value="">Semua tahap</option>{[...new Set(all.map(derivePackageStage))].map(value => <option key={value}>{value}</option>)}</select></div>
        {!!legacy.length && <details className="legacy-packages"><summary><Archive size={14} /> {legacy.length} paket contoh lama tersimpan</summary><p>Data lama tetap disimpan. Tampilkan jika diperlukan untuk pemeriksaan; tidak ada data yang dihapus.</p><label><input type="checkbox" checked={showLegacy} onChange={e => setShowLegacy(e.target.checked)} /> Tampilkan paket contoh lama</label></details>}
        <div className="package-list">{rows.map(s => <article className="package-card" key={s.project.id} data-testid={`package-card-${s.project.id}`}><div className="package-card-main"><div className="package-id">{s.project.contractNumber || s.project.id}</div><h2>{s.project.packageName}</h2><div className="package-meta"><span><Building2 size={14} />{s.project.balai}</span><span>{s.project.semester}</span></div><p>{s.project.contractor} · {s.project.routes.join(', ')}</p><div className="package-scope">{s.project.surveyTypes.map(type => <span key={type}>{type}</span>)}</div></div><div className="package-card-status"><div><small>Tahap</small><strong>{derivePackageStage(s)}</strong></div><div><small>Status</small><strong>{packageStatus(s)}</strong></div><div><small>Tanggung jawab berikutnya</small><strong>{packageWaitingFor(s)}</strong></div><button className="wf-button primary" onClick={() => onOpen(s.project.id)}>Buka paket <ArrowRight size={15} /></button></div></article>)}</div>
        {!rows.length && <div className="package-empty"><FolderOpen size={32} /><h2>Tidak ada paket yang sesuai</h2><p>Periksa kata pencarian, filter, atau penugasan akun.</p></div>}
    </div>;
}


// Real sessions stay on the Dirah UI. The list is refetched from the backend
// and mapped into the exact view model the Dirah component already expects.
export default function PackagesPage(props: Props) {
    return isRoleTestMode() ? <LocalPackagesPage {...props} /> : <ServerPackagesPage role={props.role} onOpen={props.onOpen} />;
}

type Balai = ServerBalaiRow;

function ServerPackagesPage({ role, onOpen }: { role: WorkflowRole; onOpen: (id: string) => void }) {
    const [packages, setPackages] = useState<ServerPackageRow[]>([]);
    const [balais, setBalais] = useState<Balai[]>([]);
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        apiRequest<ServerPackageListResponse>(`/paket?page=${page}`, { signal: controller.signal })
            .then(result => {
                if (controller.signal.aborted) return;
                if (!Array.isArray(result.data)) throw new Error('Format respons paket tidak sesuai.');
                setPackages(current => page === 1 ? result.data : [...new Map([...current, ...result.data].map(item => [item.paket_id, item])).values()]);
                setHasMore(result.data.length >= (result.page_size > 0 ? result.page_size : 50));
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

    // Backend paket → view model UI Dirah. Tidak ada data demo yang dipakai.
    const dirahPackages = useMemo(
        () => mapServerPackagesToDirahPackages(packages, balais, role),
        [packages, balais, role],
    );

    if (loading && !packages.length) {
        return <div className="package-page operational-list">
            <div className="package-page-head"><div><div className="eyebrow">PENGELOLAAN PAKET QA/QC</div><h1>{packageMenuLabel(role)}</h1><p>Daftar paket diambil dari server sesuai akun yang sedang masuk.</p></div></div>
            <p role="status">Memuat paket dari server…</p>
        </div>;
    }

    return <div className="package-page operational-list">
        {error && <div role="alert" className="wf-callout"><p>{error}</p><button type="button" className="wf-button" disabled={loading} onClick={reload}>Coba lagi</button></div>}
        {/* UI Dirah asli dipertahankan utuh; data di dalamnya dari backend. */}
        <LocalPackagesPage packages={dirahPackages} role={role} onOpen={onOpen} />
        {hasMore && <div><p>Carian dan filter berlaku pada paket yang sudah dimuat. Muat berikutnya untuk melihat lebih banyak paket.</p><button type="button" className="wf-button primary" disabled={loading || !!error} onClick={() => setPage(value => value + 1)}>Muat paket berikutnya <ArrowRight size={15} /></button></div>}
    </div>;

    function reload() { setPackages([]); setPage(1); setHasMore(false); setError(''); setLoading(true); setRevision(value => value + 1); }
}
