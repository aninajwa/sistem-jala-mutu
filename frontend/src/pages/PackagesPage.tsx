import { apiRequest } from '../auth/client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, Search, FolderOpen, Archive } from 'lucide-react';
import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import { derivePackageStage, packageStatus, packageWaitingFor } from '../workflow/packageStore';
import { isLegacyExample, isRoleTestMode } from '../workflow/access/packageAccess';
import { packageMenuLabel } from '../workflow/roleNavigation';
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


// Real sessions use the API. The legacy workflow adapter is only for explicit dev demos.
export default function PackagesPage(props: Props) {
    return isRoleTestMode() ? <LocalPackagesPage {...props} /> : <ServerPackagesPage role={props.role} onOpen={props.onOpen} />;
}

type ServerPackage = {
    paket_id: number;
    nama_paket: string;
    nomor_kontrak: string | null;
    tahun_anggaran: number | null;
    balai_id: number | null;
    status: string;
};
type Balai = { balai_id: number; nama: string; kode: string };
type PackageResponse = { data: ServerPackage[]; page: number; page_size: number };

function ServerPackagesPage({ role, onOpen }: { role: WorkflowRole; onOpen: (id: string) => void }) {
    const [packages, setPackages] = useState<ServerPackage[]>([]);
    const [balais, setBalais] = useState<Balai[]>([]);
    const [search, setSearch] = useState('');
    const [balai, setBalai] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [balaiError, setBalaiError] = useState('');
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        apiRequest<PackageResponse>(`/paket?page=${page}`, { signal: controller.signal })
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
        setBalaiError('');
        apiRequest<{ data: Balai[] }>('/balai', { signal: controller.signal })
            .then(result => {
                if (controller.signal.aborted) return;
                if (!Array.isArray(result.data)) throw new Error('Format balai tidak sesuai.');
                setBalais(result.data);
            })
            .catch(() => { if (!controller.signal.aborted) setBalaiError('Nama balai belum dapat dimuat. ID balai tetap ditampilkan; tekan Muat ulang untuk mencoba lagi.'); });
        return () => controller.abort();
    }, [revision]);

    const balaiNames = useMemo(() => new Map(balais.map(item => [String(item.balai_id), item.nama || item.kode])), [balais]);
    const balaiName = (id: number | null) => id === null ? 'Balai belum ditetapkan' : balaiNames.get(String(id)) || `Balai #${id}`;
    // Filter options are restricted to the returned packages, never a client-side access grant.
    const balaiOptions = [...new Set(packages.filter(item => item.balai_id !== null).map(item => String(item.balai_id)))];
    const statuses = [...new Set(packages.map(item => item.status))];
    const rows = packages.filter(item => (!balai || String(item.balai_id) === balai) && (!status || item.status === status) &&
        `${item.nama_paket} ${item.nomor_kontrak || ''} ${item.paket_id} ${balaiName(item.balai_id)}`.toLowerCase().includes(search.trim().toLowerCase()));
    const reload = () => { setPackages([]); setPage(1); setHasMore(false); setError(''); setLoading(true); setRevision(value => value + 1); };


    return <div className="package-page operational-list">
        <div className="package-page-head"><div><div className="eyebrow">PENGELOLAAN PAKET QA/QC</div><h1>{packageMenuLabel(role)}</h1>
            <p>Daftar paket dari server, sesuai akses akun yang sedang masuk.</p></div>
            <span className="package-count">{rows.length} dari {packages.length} paket dimuat</span>
        </div>
        <div className="wf-callout">Daftar dan detail paket menggunakan data server. Buka paket untuk melihat informasi kontrak.</div>
        <div className="package-list-filters">
            <label className="package-search"><Search size={16} /><input aria-label="Cari paket" placeholder="Cari nama paket, nomor kontrak, ID atau balai…" value={search} onChange={e => setSearch(e.target.value)} /></label>
            <select aria-label="Filter Balai paket" value={balai} onChange={e => setBalai(e.target.value)}><option value="">Semua balai pada paket yang dimuat</option>{balaiOptions.map(id => <option key={id} value={id}>{balaiName(Number(id))}</option>)}</select>
            <select aria-label="Filter status paket" value={status} onChange={e => setStatus(e.target.value)}><option value="">Semua status</option>{statuses.map(value => <option key={value} value={value}>{value}</option>)}</select>
            <button type="button" className="wf-button" disabled={loading} onClick={reload}>Muat ulang</button>
        </div>
        {balaiError && <p role="status">{balaiError}</p>}
        {error && <div role="alert" className="wf-callout"><p>{error}</p><button type="button" className="wf-button" disabled={loading} onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Coba lagi</button></div>}
        <div className="package-list">{rows.map(item => <article className="package-card" key={item.paket_id} data-testid={`server-package-card-${item.paket_id}`}>
            <div className="package-card-main"><div className="package-id">{item.nomor_kontrak || `Paket #${item.paket_id}`}</div><h2>{item.nama_paket}</h2>
                <div className="package-meta"><span><Building2 size={14} />{balaiName(item.balai_id)}</span><span>Tahun anggaran: {item.tahun_anggaran ?? 'Belum diisi'}</span></div><p>ID paket: {item.paket_id}</p>
            </div><div className="package-card-status"><div><small>Status server</small><strong>{item.status}</strong></div><button type="button" className="wf-button primary" onClick={() => onOpen(String(item.paket_id))}>Buka paket <ArrowRight size={15} /></button></div>
        </article>)}</div>
        {loading && <p role="status">Memuat paket dari server…</p>}
        {!loading && !error && !rows.length && <div className="package-empty"><FolderOpen size={32} /><h2>{packages.length ? 'Tidak ada paket yang sesuai filter' : 'Belum ada paket yang dapat diakses'}</h2><p>{packages.length ? 'Periksa carian dan filter pada paket yang sudah dimuat.' : 'Periksa penugasan akun atau buat paket melalui alur backend yang tersedia.'}</p></div>}
        {hasMore && <div><p>Carian dan filter berlaku pada paket yang sudah dimuat. Muat berikutnya untuk melihat lebih banyak paket.</p><button type="button" className="wf-button primary" disabled={loading || !!error} onClick={() => { setLoading(true); setPage(value => value + 1); }}>Muat paket berikutnya <ArrowRight size={15} /></button></div>}
    </div>;
}
