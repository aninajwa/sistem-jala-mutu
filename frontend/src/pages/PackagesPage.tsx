import { serverStageText, useServerPackageStages } from "./useServerPackageStages";
import { apiRequest } from "../auth/client";
import { readDeclaredPackageSurveyScopes } from "../workflow/declaredPackageSurveyScope";
import {
  mapServerPackagesToDirahPackages,
  type ServerBalaiRow,
  type ServerPackageListResponse,
  type ServerPackageRow,
} from "./serverPackageView";
import { CreatePackageDialog } from "./CreatePackageDialog";
import { canCreateServerPackage, type CreatedServerPackage } from "./serverPackageCreation";
import { FilterPanel } from "../design/b/FilterPanel";
import { WorkspaceHeading, StatePill } from "../design/b/Patterns";
import { Feedback } from "../design/Feedback";
import { balaiReviewQueue } from "../workflow/balaiReviewQueue";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Search,
  ClipboardList,
  FolderOpen,
  Archive,
  Plus,
} from "lucide-react";
import type { OperationalWorkflowState, WorkflowRole } from "../workflow/model";
import {
  derivePackageStage,
  packageStatus,
  packageWaitingFor,
} from "../workflow/packageStore";
import { isLegacyExample, isRoleTestMode } from "../workflow/access/packageAccess";
import { packageMenuLabel } from "../workflow/roleNavigation";

type Props = {
  packages: Record<string, OperationalWorkflowState>;
  role: WorkflowRole;
  onOpen: (id: string) => void;
  onOpenReview?: (
    id: string,
    selection: string,
    context?: { period?: number; auditLevel?: number },
  ) => void;
  /** Server mode: show the create action and server package statuses instead of local derivations. */
  onCreatePackage?: () => void;
  serverPackageStatuses?: Record<string, string>;
  serverStages?: Record<string, import("./useServerPackageStages").ServerPackageStage> | null;
  serverReviewQueue?: import("../workflow/balaiReviewQueue").BalaiReviewItem[];
};
function LocalPackagesPage({
  packages,
  role,
  onOpen,
  onOpenReview,
  onCreatePackage,
  serverPackageStatuses,
  serverStages,
  serverReviewQueue,
}: Props) {
  const stageOf = (s: OperationalWorkflowState) =>
    serverPackageStatuses ? serverStageText(serverStages?.[s.project.id]) : derivePackageStage(s);
  const statusOf = (s: OperationalWorkflowState) =>
    serverPackageStatuses ? serverPackageStatusLabel(serverPackageStatuses[s.project.id]) : packageStatus(s);
  const waitingOf = (s: OperationalWorkflowState) =>
    serverPackageStatuses ? serverStageText(serverStages?.[s.project.id]) : packageWaitingFor(s);
  const [compact, setCompact] = useState(false);
  const provider = role === "Penyedia Jasa / Ketua Tim";
  const [search, setSearch] = useState("");
  const [balai, setBalai] = useState("");
  const [status, setStatus] = useState("");
  const [showLegacy, setShowLegacy] = useState(() => import.meta.env.DEV);
  const reviewItems = useMemo(
    () =>
      role === "PIC Balai / Pengguna Jasa" ? serverReviewQueue ?? balaiReviewQueue(packages) : [],
    [packages, role, serverReviewQueue],
  );
  const all = Object.values(packages),
    legacy = all.filter(isLegacyExample);
  const rows = useMemo(
    () =>
      all.filter(
        (s) =>
          (showLegacy || !isLegacyExample(s)) &&
          (!balai || s.project.balai === balai) &&
          (!status || stageOf(s) === status) &&
          `${s.project.packageName} ${s.project.id} ${s.project.contractor} ${s.project.routes.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [all, balai, status, showLegacy, search],
  );
  return (
    <div
      className={`package-page b-package-catalog ${compact ? "is-compact" : ""}`}
    >
      <WorkspaceHeading
        eyebrow="PAKET & LINGKUP PENUGASAN"
        title={packageMenuLabel(role)}
        description={
          role === "Admin"
            ? "Pantau administrasi paket. Keputusan teknis berada pada pemeriksa."
            : "Pilih paket untuk melanjutkan pekerjaan sesuai tahap dan kewenangan."
        }
        action={onCreatePackage && (role === "Penyedia Jasa / Ketua Tim" || role === "Admin") ? (
          <button type="button" className="wf-button primary" onClick={onCreatePackage} data-testid="button-create-package-authenticated">
            <Plus size={16} /> Buat Paket
          </button>
        ) : undefined}
      />
      <FilterPanel
        title="Filter paket"
        activeCount={Number(!!search) + Number(!!balai) + Number(!!status)}
        onReset={() => {
          setSearch("");
          setBalai("");
          setStatus("");
        }}
      >
        {" "}
        <div className="b-catalog-toolbar">
          <label className="package-search">
            <Search size={17} />
            <input
              aria-label="Cari paket"
              placeholder="Nama paket, ruas, atau Penyedia…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {new Set(all.map((s) => s.project.balai)).size > 1 && (
            <select
              aria-label="Filter Balai paket"
              value={balai}
              onChange={(e) => setBalai(e.target.value)}
            >
              <option value="">Seluruh Balai dalam cakupan</option>
              {[...new Set(all.map((s) => s.project.balai))].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          )}
          <select
            aria-label="Filter tahap paket"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Semua tahap</option>
            {[...new Set(all.map(stageOf))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          {!provider && <button
            className="btn"
            aria-pressed={compact}
            onClick={() => setCompact(!compact)}
          >
            {compact ? "Tampilan kartu" : "Tampilan ringkas"}
          </button>}
        </div>
      </FilterPanel>
      <div className="b-catalog-caption">
        <span>{rows.length} paket dalam filter</span>
        {!!legacy.length && (
          <details className="legacy-packages">
            <summary>
              <Archive size={14} />
              {legacy.length} paket contoh tersimpan
            </summary>
            <label>
              <input
                type="checkbox"
                checked={showLegacy}
                onChange={(e) => setShowLegacy(e.target.checked)}
              />
              Tampilkan paket contoh lama
            </label>
            <p>Data historis tetap disimpan.</p>
          </details>
        )}
      </div>
      {provider && rows.length > 0 && (
        <ul className="provider-case-queue" aria-label="Paket dalam penugasan">
          {rows.map((state) => (
            <li key={state.project.id} data-testid={`package-card-${state.project.id}`}>
              <div>
                <small>{state.project.contractNumber || state.project.id}</small>
                <h2>{state.project.packageName}</h2>
                <p>{state.project.balai} · {state.project.semester}</p>
                <p>{state.project.surveyTypes.join(", ") || "Jenis survei belum tercatat"}</p>
                <p>{state.project.routes.join(", ") || "Ruas belum tercatat"}</p>
              </div>
              <div className="provider-case-action">
                <strong>{serverPackageStatuses ? statusOf(state) : `${derivePackageStage(state)} · ${packageStatus(state)}`}</strong>
                <span>{waitingOf(state)}</span>
                <button type="button" className="wf-button primary" onClick={() => onOpen(state.project.id)}>
                  Buka Paket <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!provider && <div className="b-package-grid">
        {rows.map((s) => {
          const review =
            role === "PIC Balai / Pengguna Jasa"
              ? reviewItems.find(
                  (row) =>
                    row.packageId === s.project.id &&
                    row.status === "Perlu Review",
                )
              : undefined;
          return (
            <article
              className="package-card b-package-tile"
              key={s.project.id}
              data-testid={`package-card-${s.project.id}`}
            >
              <div className="b-package-tile-heading">
                <span className="b-row-icon">
                  <ClipboardList size={22} />
                </span>
                <span className="package-id">
                  {s.project.contractNumber || s.project.id}
                </span>
                <StatePill>{stageOf(s)}</StatePill>
              </div>
              <h2>{s.project.packageName}</h2>
              <div className="package-meta">
                <span>
                  <Building2 size={14} />
                  {s.project.balai}
                </span>
                <span>{s.project.semester}</span>
              </div>
              <p className="b-package-identity">
                {s.project.contractor}
                <br />
                {s.project.routes.join(", ")}
              </p>
              <div className="package-scope">
                {s.project.surveyTypes.map((type) => (
                  <span key={type}>{type}</span>
                ))}
              </div>
              <dl className="b-package-facts">
                <div>
                  <dt>Status paket</dt>
                  <dd>{statusOf(s)}</dd>
                </div>
                <div>
                  <dt>Pemilik langkah berikutnya</dt>
                  <dd>{waitingOf(s)}</dd>
                </div>
              </dl>
              <div className="b-package-actions">
                {review && onOpenReview ? (
                  <>
                    <div>
                      <small>Pengajuan perlu ditinjau</small>
                      <strong>{review.kind}</strong>
                    </div>
                    <button
                      className="wf-button primary"
                      onClick={() =>
                        onOpenReview(s.project.id, review.selection, {
                          period: review.period,
                          auditLevel: review.auditLevel,
                        })
                      }
                    >
                      Buka pemeriksaan Balai
                      <ArrowRight size={15} />
                    </button>
                    <button
                      className="b-text-action"
                      onClick={() => onOpen(s.project.id)}
                    >
                      Lihat paket
                    </button>
                  </>
                ) : (
                  <button
                    className="wf-button primary"
                    onClick={() => onOpen(s.project.id)}
                  >
                    Buka paket
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>}
      {!rows.length && (
        <Feedback
          kind="empty"
          title={
            all.length
              ? "Tidak ada paket yang sesuai"
              : "Belum ada paket dalam penugasan"
          }
          description={
            all.length
              ? "Sesuaikan pencarian atau filter paket."
              : "Periksa cakupan akun dengan pengelola penugasan."
          }
        />
      )}
    </div>
  );
}

export default function PackagesPage(props: Props) {
    return isRoleTestMode() ? <LocalPackagesPage {...props} /> : <ServerPackagesPage role={props.role} onOpen={props.onOpen} onOpenReview={props.onOpenReview} serverReviewQueue={props.serverReviewQueue} />;
}

type Balai = ServerBalaiRow;

function serverPackageStatusLabel(status: string | undefined): string {
    if (!status) return 'Belum tersedia';
    const labels: Record<string, string> = {
      DRAFT: 'Draf',
      DIAJUKAN: 'Diajukan',
      DISETUJUI: 'Disetujui',
      PERLU_REVISI: 'Perlu revisi',
      SELESAI: 'Selesai',
    };
    return labels[status] ?? status;
}

function ServerPackagesPage({ role, onOpen, onOpenReview, serverReviewQueue }: Pick<Props, 'role' | 'onOpen' | 'onOpenReview' | 'serverReviewQueue'>) {
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
    const serverStages = useServerPackageStages();
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
          onOpenReview={onOpenReview}
          serverReviewQueue={serverReviewQueue}
          serverPackageStatuses={serverPackageStatuses}
          serverStages={serverStages}
          onCreatePackage={canCreate ? () => { setNotice(''); setCreatePackageOpen(true); } : undefined}
        />
        {hasMore && <div><p>Carian dan filter berlaku pada paket yang sudah dimuat. Muat berikutnya untuk melihat lebih banyak paket.</p><button type="button" className="wf-button primary" disabled={loading || !!error} onClick={() => setPage(value => value + 1)}>Muat paket berikutnya <ArrowRight size={15} /></button></div>}
        {createPackageOpen && (
          <CreatePackageDialog onClose={() => setCreatePackageOpen(false)} onCreated={handleCreated} />
        )}
    </div>;

}
