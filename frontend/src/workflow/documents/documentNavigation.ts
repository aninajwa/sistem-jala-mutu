import type { WorkflowRole } from "../model";
import type { RoleNavChild } from "../roleNavigation";
export function documentNavigation(role: WorkflowRole): RoleNavChild[] {
  return [
    { label: "Daftar dokumen", href: "/documents", tab: "Semua" },
    {
      label: "Tujuh format dokumen",
      href: "/documents",
      tab: "Format dokumen",
    },
    {
      label:
        role === "Direktorat / Pusat"
          ? "Dokumen audit & penerimaan"
          : "Audit & penerimaan",
      href: "/documents",
      tab: "Audit & penerimaan",
    },
  ];
}
