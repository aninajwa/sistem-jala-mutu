import { FilterPanel } from "../design/b/FilterPanel";
import { WorkspaceHeading, StatePill } from "../design/b/Patterns";
import { Feedback } from "../design/Feedback";
import { balaiReviewQueue } from "../workflow/balaiReviewQueue";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Search,
  ClipboardList,
  Archive,
} from "lucide-react";
import type { OperationalWorkflowState, WorkflowRole } from "../workflow/model";
import {
  derivePackageStage,
  packageStatus,
  packageWaitingFor,
} from "../workflow/packageStore";
import { isLegacyExample } from "../workflow/access/packageAccess";
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
};
export default function PackagesPage({
  packages,
  role,
  onOpen,
  onOpenReview,
}: Props) {
  const [compact, setCompact] = useState(false);
  const [search, setSearch] = useState("");
  const [balai, setBalai] = useState("");
  const [status, setStatus] = useState("");
  const [showLegacy, setShowLegacy] = useState(() => import.meta.env.DEV);
  const reviewItems = useMemo(
    () =>
      role === "PIC Balai / Pengguna Jasa" ? balaiReviewQueue(packages) : [],
    [packages, role],
  );
  const all = Object.values(packages),
    legacy = all.filter(isLegacyExample);
  const rows = useMemo(
    () =>
      all.filter(
        (s) =>
          (showLegacy || !isLegacyExample(s)) &&
          (!balai || s.project.balai === balai) &&
          (!status || derivePackageStage(s) === status) &&
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
            {[...new Set(all.map(derivePackageStage))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <button
            className="btn"
            aria-pressed={compact}
            onClick={() => setCompact(!compact)}
          >
            {compact ? "Tampilan kartu" : "Tampilan ringkas"}
          </button>
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
      <div className="b-package-grid">
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
                <StatePill>{derivePackageStage(s)}</StatePill>
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
                  <dd>{packageStatus(s)}</dd>
                </div>
                <div>
                  <dt>Pemilik langkah berikutnya</dt>
                  <dd>{packageWaitingFor(s)}</dd>
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
      </div>
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
