import { createContext } from "react";
import { mayOperate } from "../../workflow/access/operationalPolicy";
import type { WorkflowRole } from "../../workflow/model";
import type { WorkflowStage } from "../../workflow/workflowGate";
export type StageMode = "prepare" | "review" | "audit" | "monitor";
export type SectionGroup = "work" | "evidence" | "decision" | "history";
export const StagePresentationContext = createContext<{
  mode: StageMode;
  level: 1 | 2 | 3;
}>({ mode: "monitor", level: 1 });
/** Read-only presentation of existing permission policy; never grants an action. */
export function stagePresentation(role: WorkflowRole, stage: WorkflowStage) {
  const level: 1 | 2 | 3 =
    role === "Direktorat / Pusat"
      ? 3
      : role === "PIC Balai / Pengguna Jasa"
        ? 2
        : 1;
  const draft = mayOperate(role, stage, "draft", level),
    review = mayOperate(role, stage, "approve", level);
  const mode: StageMode =
    draft && review
      ? "audit"
      : review
        ? "review"
        : draft
          ? "prepare"
          : "monitor";
  return { mode, level };
}
export function sectionGroup(title: string): SectionGroup {
  if (/riwayat|histori|jurnal|arsip/i.test(title)) return "history";
  if (
    /keputusan|persetujuan|review|hasil pemeriksaan|tindak lanjut|penerimaan/i.test(
      title,
    )
  )
    return "decision";
  if (
    /checklist|dokumen|lampiran|berkas|bukti|sertifikat|personel|pelatihan/i.test(
      title,
    )
  )
    return "evidence";
  return "work";
}
export const sectionLabels: Record<SectionGroup, string> = {
  work: "Pekerjaan",
  evidence: "Bukti & dokumen",
  decision: "Pemeriksaan",
  history: "Riwayat",
};
export function sectionIntent(mode: StageMode, group: SectionGroup) {
  if (group === "history") return "Riwayat tercatat";
  if (mode === "monitor") return "Untuk pemantauan";
  if (group === "decision")
    return mode === "prepare"
      ? "Pengajuan & hasil pemeriksaan"
      : "Pemeriksaan & keputusan";
  return mode === "review"
    ? "Data untuk diperiksa"
    : mode === "audit"
      ? "Bukti audit"
      : "Isian pekerjaan";
}
