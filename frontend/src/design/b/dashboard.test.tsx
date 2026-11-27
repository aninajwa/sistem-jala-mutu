// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DashboardPage from "../../pages/DashboardPage";
import { createDemoWorkflow } from "../../workflow/demoScenario";
import { WORKFLOW_ROLE_OPTIONS } from "../../workflow/workflowConfig";
import type { PageProps } from "../../types";
vi.mock("./geo/DirectorateMap", () => ({
  DirectorateMap: () => <div aria-label="Peta Indonesia" />,
}));
const titles = [
  "Dashboard Pekerjaan",
  "Dashboard Pengawasan",
  "Dashboard Nasional",
  "Dashboard Sistem",
];
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});
for (const [index, role] of WORKFLOW_ROLE_OPTIONS.entries())
  for (const populated of [false, true])
    it(`${role}: distinct ${populated ? "scoped data" : "empty"} dashboard without workflow mutation`, () => {
      const state = createDemoWorkflow("complete");
      state.role = role;
      const packages = populated ? { [state.project.id]: state } : {};
      const before = JSON.stringify(packages);
      const p: PageProps = {
        workflow: state,
        packages,
        store: { surveys: [], findings: [], docs: [], logs: [] },
        openPackage: vi.fn(),
        openPackageReview: vi.fn(),
        openPackageBA: vi.fn(),
        balai: "Semua Balai",
        periode: "Semua periode",
        jenis: "Semua",
        scoped: [],
        search: "",
        setSearch: vi.fn(),
        activeTab: "Semua",
        setActiveTab: vi.fn(),
        openNew: vi.fn(),
        beginEdit: vi.fn(),
        updateStatus: vi.fn(),
        record: vi.fn(),
        setNotice: vi.fn(),
      };
      render(<DashboardPage {...p} />);
      expect(
        screen.getByRole("heading", { name: titles[index], level: 1 }),
      ).toBeTruthy();
      expect(JSON.stringify(packages)).toBe(before);
      expect(document.querySelectorAll(".b-metrics>.b-metric")).toHaveLength(4);
      if (role === "Admin") {
        expect(screen.getByText("Usulan penugasan")).toBeTruthy();
        expect(screen.queryByText("Pengguna aktif")).toBeNull();
        expect(screen.queryByRole("button", { name: "Setujui" })).toBeNull();
      }
      if (role === "Direktorat / Pusat")
        expect(
          screen.getByRole("heading", { name: "Peta pengawasan lintas Balai" }),
        ).toBeTruthy();
      if (!populated)
        expect(screen.getAllByText(/Belum ada/).length).toBeGreaterThan(0);
    });
