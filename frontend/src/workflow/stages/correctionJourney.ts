import type { CorrectionCase, WorkflowRole } from "../model";
import { correctionReviewer } from "../checkpoint09Corrections";

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
type JourneyCase = Pick<CorrectionCase, "status" | "blockedStage"> & Partial<Pick<CorrectionCase, "retest">>;
export function correctionProposalEditable(item: JourneyCase): boolean {
  return item.status === "Terbuka" || (item.status === "Verifikasi Ulang" && item.retest === "Gagal");
}
export function correctionVisibleViews(
  role: WorkflowRole,
  item: JourneyCase,
): CorrectionView[] {
  const isProvider = role === "Penyedia Jasa / Ketua Tim";
  const isBalai = role === "PIC Balai / Pengguna Jasa";
  const isAudit3Reviewer = role === "Direktorat / Pusat" &&
    /^Audit tingkat 3$/i.test(item.blockedStage);
  const draft = correctionProposalEditable(item);
  const hasProposal = !draft;
  const hasExecution = !draft && ["Disetujui", "Dilaksanakan", "Verifikasi Ulang", "Ditutup"].includes(item.status);
  const hasRetest = !draft && ["Dilaksanakan", "Verifikasi Ulang", "Ditutup"].includes(item.status);
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
  item: JourneyCase,
): CorrectionView {
  const views = correctionVisibleViews(role, item);
  const isProvider = role === "Penyedia Jasa / Ketua Tim";
  const isBalai = role === "PIC Balai / Pengguna Jasa";
  const audit3 = role === "Direktorat / Pusat" && /^Audit tingkat 3$/i.test(item.blockedStage);
  const desired: CorrectionView = item.status === "Ditutup" ? "history"
    : correctionProposalEditable(item) ? (isProvider ? "proposal" : "finding")
      : item.status === "Menunggu Persetujuan" ? (isBalai || isProvider ? "approval" : "finding")
        : item.status === "Disetujui" ? (isProvider ? "execution" : "finding")
          : (isBalai || audit3 || isProvider) ? "verification" : "history";
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
  item: JourneyCase,
  view: CorrectionView,
): string {
  if (view === "proposal" && role === "Penyedia Jasa / Ketua Tim" && correctionProposalEditable(item)) return "Rencana tindakan";
  if (view === "execution") return role === "Penyedia Jasa / Ketua Tim" && item.status === "Disetujui" ? "Laksanakan tindakan" : "Hasil pelaksanaan";
  if (view === "verification") {
    const reviewer = correctionReviewer(item);
    if (role === reviewer && item.status === "Dilaksanakan") return "Periksa hasil";
    if (role === reviewer && item.status === "Verifikasi Ulang" && item.retest === "Lulus") return "Penutupan kasus";
    return "Hasil pemeriksaan ulang";
  }
  if (view !== "approval") return CORRECTION_VIEW_LABELS[view];
  if (role === "Penyedia Jasa / Ketua Tim") {
    return correctionProposalEditable(item) ? "Verifikasi internal & ajukan" : "Status pengajuan";
  }
  if (role === "PIC Balai / Pengguna Jasa") {
    return item.status === "Menunggu Persetujuan" ? "Periksa usulan" : "Hasil pemeriksaan";
  }
  return "Hasil pemeriksaan";
}
