import assert from "node:assert/strict";
import { test } from "node:test";
import { correctionCanOpenCase, correctionDefaultView, correctionVisibleViews, correctionViewLabel } from "./correctionJourney";

const mk = (status: "Terbuka" | "Menunggu Persetujuan" | "Disetujui" | "Dilaksanakan" | "Verifikasi Ulang" | "Ditutup", blockedStage = "Verval 14 hari") => ({ status, blockedStage });
const provider = "Penyedia Jasa / Ketua Tim";
const balai = "PIC Balai / Pengguna Jasa";
const directorate = "Direktorat / Pusat";

test("Penyedia: usulan terpisah dari pelaksanaan dan pemeriksaan hasil", () => {
  assert.equal(correctionDefaultView(provider, mk("Terbuka")), "proposal");
  assert.ok(!correctionVisibleViews(provider, mk("Terbuka")).includes("execution"));
  assert.ok(!correctionVisibleViews(provider, mk("Menunggu Persetujuan")).includes("verification"));
  assert.equal(correctionDefaultView(provider, mk("Disetujui")), "execution");
  assert.ok(correctionVisibleViews(provider, mk("Dilaksanakan")).includes("verification"));
  assert.equal(correctionDefaultView(provider, mk("Ditutup")), "history");
});

test("Balai melihat pengajuan ketika waktunya review; admin hanya monitoring", () => {
  assert.equal(correctionDefaultView(balai, mk("Menunggu Persetujuan")), "approval");
  assert.deepEqual(correctionVisibleViews("Admin", mk("Menunggu Persetujuan")), ["finding", "history"]);
  assert.deepEqual(correctionVisibleViews(directorate, mk("Disetujui")), ["finding", "history"]);
});

test("Audit Tingkat 3 Direktorat punya pemeriksaan hasil hanya setelah pelaksanaan", () => {
  assert.ok(!correctionVisibleViews(directorate, mk("Disetujui", "Audit tingkat 3")).includes("verification"));
  assert.ok(correctionVisibleViews(directorate, mk("Dilaksanakan", "Audit tingkat 3")).includes("verification"));
  assert.equal(correctionDefaultView(directorate, mk("Dilaksanakan", "Audit tingkat 3")), "verification");
});

test("Buka temuan manual tidak ditawarkan sebagai input pada Direktorat/Admin", () => {
  assert.equal(correctionCanOpenCase(provider), true);
  assert.equal(correctionCanOpenCase(balai), true);
  assert.equal(correctionCanOpenCase(directorate), false);
  assert.equal(correctionCanOpenCase("Admin"), false);
});


test("label pemeriksaan mengikuti pekerjaan role, bukan keputusan role lain", () => {
  assert.equal(correctionViewLabel(provider, mk("Terbuka"), "approval"), "Verifikasi internal & ajukan");
  assert.equal(correctionViewLabel(provider, mk("Menunggu Persetujuan"), "approval"), "Status pengajuan");
  assert.equal(correctionViewLabel(balai, mk("Menunggu Persetujuan"), "approval"), "Periksa usulan");
  assert.equal(correctionViewLabel(directorate, mk("Menunggu Persetujuan", "Audit tingkat 3"), "approval"), "Hasil pemeriksaan");
});
