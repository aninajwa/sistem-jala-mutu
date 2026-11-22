import { ArrowLeft, CircleAlert, FileSearch, ShieldX } from "lucide-react";
export function Feedback({
  kind,
  title,
  description,
  onBack,
  actionLabel = "Kembali ke beranda",
}: {
  kind: "empty" | "error" | "forbidden" | "not-found";
  title: string;
  description: string;
  onBack?: () => void;
  actionLabel?: string;
}) {
  const Icon =
    kind === "forbidden"
      ? ShieldX
      : kind === "error"
        ? CircleAlert
        : FileSearch;
  return (
    <section
      className="jm-feedback"
      role={kind === "error" ? "alert" : undefined}
      data-testid={`state-${kind}`}
    >
      <span className="jm-feedback-icon">
        <Icon size={30} />
      </span>
      <small>
        {kind === "forbidden"
          ? "403 · AKSES DIBATASI"
          : kind === "not-found"
            ? "404 · HALAMAN TIDAK DITEMUKAN"
            : "JALA MUTU"}
      </small>
      <h1>{title}</h1>
      <p>{description}</p>
      {onBack && (
        <button className="wf-button primary" onClick={onBack}>
          <ArrowLeft size={16} />
          {actionLabel}
        </button>
      )}
    </section>
  );
}
export function LoadingState() {
  return (
    <section
      className="jm-loading"
      role="status"
      aria-label="Memuat ruang kerja"
    >
      <span />
      <span />
      <span />
      <p>Menyiapkan ruang kerja…</p>
    </section>
  );
}
