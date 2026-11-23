import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRoleNavigation, PACKAGE_WORKFLOW_ITEMS } from "./roleNavigation";
const stepper = readFileSync(
  new URL("../design/b/StageNavigator.tsx", import.meta.url),
  "utf8",
);
const hub = readFileSync(new URL("./PackageHub.tsx", import.meta.url), "utf8");
for (const role of [
  "Penyedia Jasa / Ketua Tim",
  "PIC Balai / Pengguna Jasa",
  "Direktorat / Pusat",
  "Admin",
] as const) {
  test(`${role}: sidebar ringkas; delapan tahap tetap tersedia dalam paket`, () => {
    const nav = buildRoleNavigation(role, true, "Tahap 0");
    const packageNav = nav.find((item) => item.path === "/packages");
    assert.ok(packageNav);
    assert.equal(
      packageNav.children[0]?.selection,
      "/packages:Ringkasan Paket",
    );
    assert.equal(packageNav.children.length, 1);
    assert.equal(PACKAGE_WORKFLOW_ITEMS.length, 8);
    assert.match(hub, /<StageNavigator/);
    assert.match(stepper, /jm-stage-stepper/);
    assert.match(stepper, /onNavigate\?\.\(item.selection\)/);
  });
}
test("header paket memuat satu stepper tanpa pintasan modul ganda", () => {
  assert.doesNotMatch(hub, /PackageStageNavigator/);
  assert.doesNotMatch(hub, /package-context-actions/);
  assert.match(hub, /Informasi paket/);
  assert.match(hub, /packageMenuLabel/);
});
test("ringkasan tetap menghubungkan pekerjaan dan tindakan perbaikan", () => {
  assert.match(hub, /nextAction\(state\)/);
  assert.match(hub, /onCorrections\(\)/);
  assert.match(hub, /\/actions:Koreksi berbukti/);
  assert.match(hub, /package-finding-card/);
});
