import { test } from "node:test";
import assert from "node:assert/strict";
import { stagePresentation, sectionGroup } from "./stagePresentation";
import { PACKAGE_WORKFLOW_ITEMS } from "../../workflow/roleNavigation";
import { WORKFLOW_ROLE_OPTIONS } from "../../workflow/workflowConfig";
import { mayOperate } from "../../workflow/access/operationalPolicy";
for (const role of WORKFLOW_ROLE_OPTIONS)
  for (const item of PACKAGE_WORKFLOW_ITEMS)
    test(`${role} × ${item.code}: presentation follows existing operation rights`, () => {
      const actual = stagePresentation(role, item.code);
      const draft = mayOperate(role, item.code, "draft", actual.level),
        review = mayOperate(role, item.code, "approve", actual.level);
      assert.equal(
        actual.mode,
        draft && review
          ? "audit"
          : review
            ? "review"
            : draft
              ? "prepare"
              : "monitor",
      );
      if (role === "Admin") assert.equal(actual.mode, "monitor");
      if (item.code === "Tahap 5" && role !== "Admin")
        assert.equal(
          actual.level,
          role === "Direktorat / Pusat"
            ? 3
            : role === "PIC Balai / Pengguna Jasa"
              ? 2
              : 1,
        );
    });
for (const [title, group] of [
  ["Riwayat pemeriksaan", "history"],
  ["Keputusan Balai", "decision"],
  ["Checklist sumber", "evidence"],
  ["Dokumen dan bukti", "evidence"],
  ["Ruang lingkup paket", "work"],
] as const)
  test(`Section grouping ${title} retains source category`, () =>
    assert.equal(sectionGroup(title), group));
