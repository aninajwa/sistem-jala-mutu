import type { CorrectionCase, WorkflowRole } from "../model";

export type CorrectionView =
  | "finding"
  | "proposal"
  | "approval"
  | "execution"
  | "verification"
  | "history";

export const CORRECTION_VIEW_LABELS: Record<CorrectionView, string> = {
  finding: "Temuan",
  proposal: "Usulan",
  approval: "Pemeriksaan usulan",
  execution: "Pelaksanaan",
  verification: "Pemeriksaan hasil",
  history: "Riwayat",
};

// This is presentation availability, not a mutation permission policy. Actual
// transactions remain guarded by the workflow/reviewer rules in the workspace.
export function correctionVisibleViews(
  role: WorkflowRole,
  item: Pick<CorrectionCase, "status" | "blockedStage">,
): CorrectionView[] {
  const isProvider = role === "Penyedia Jasa / Ketua Tim";
  const isBalai = role === "PIC Balai / Pengguna Jasa";
  const isAudit3Reviewer = role === "Direktorat / Pusat" &&
    /^Audit tingkat 3$/i.test(item.blockedStage);
  const hasProposal = item.status !== "Terbuka";
  const hasExecution = ["Disetujui", "Dilaksanakan", "Verifikasi Ulang", "Ditutup"].includes(item.status);
  const hasRetest = ["Dilaksanakan", "Verifikasi Ulang", "Ditutup"].includes(item.status);
  const views: CorrectionView[] = ["finding"];

  // Reviewers can inspect the submitted plan. No provider editing form is
  // exposed to administrators or informational Directorate monitoring.
  if (isProvider || isBalai || isAudit3Reviewer) views.push("proposal");
  if (isProvider || isBalai || (isAudit3Reviewer && hasProposal)) {
    views.push("approval");
  }
  if (hasExecution && (isProvider || isBalai || isAudit3Reviewer)) views.push("execution");
  if (hasRetest && (isProvider || isBalai || isAudit3Reviewer)) views.push("verification");
  views.push("history");
  return views;
}

export function correctionDefaultView(
  role: WorkflowRole,
  item: Pick<CorrectionCase, "status" | "blockedStage">,
): CorrectionView {
  const views = correctionVisibleViews(role, item);
  const isProvider = role === "Penyedia Jasa / Ketua Tim";
  const isBalai = role === "PIC Balai / Pengguna Jasa";
  const audit3 = role === "Direktorat / Pusat" && /^Audit tingkat 3$/i.test(item.blockedStage);
  const desired: CorrectionView = item.status === "Ditutup" ? "history"
    : item.status === "Terbuka" ? (isProvider ? "proposal" : "finding")
      : item.status === "Menunggu Persetujuan" ? (isBalai || isProvider ? "approval" : "finding")
        : item.status === "Disetujui" ? (isProvider ? "execution" : "finding")
          : (isBalai || audit3) ? "verification" : "history";
  return views.includes(desired) ? desired : "finding";
}

/** Presentation gate for manually creating cases. Formal source transactions
 * remain subject to create() and the workflow permission guards. */
export function correctionCanOpenCase(role: WorkflowRole): boolean {
  return role === "Penyedia Jasa / Ketua Tim" || role === "PIC Balai / Pengguna Jasa";
}

/** A section label describes the current actor's work, not another role's decision. */
export function correctionViewLabel(
  role: WorkflowRole,
  item: Pick<CorrectionCase, "status" | "blockedStage">,
  view: CorrectionView,
): string {
  if (view !== "approval") return CORRECTION_VIEW_LABELS[view];
  if (role === "Penyedia Jasa / Ketua Tim") {
    return item.status === "Terbuka" ? "Verifikasi internal & ajukan" : "Status pengajuan";
  }
  if (role === "PIC Balai / Pengguna Jasa") {
    return item.status === "Menunggu Persetujuan" ? "Periksa usulan" : "Hasil pemeriksaan";
  }
  return "Hasil pemeriksaan";
}
