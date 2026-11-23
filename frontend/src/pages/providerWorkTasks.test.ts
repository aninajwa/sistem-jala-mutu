import assert from "node:assert/strict";
import { test } from "node:test";
import { providerCaseTasks } from "./providerWorkTasks";
import type { OperationalWorkflowState } from "../workflow/model";

const makeCase = (id: string, status: string, dueDate = "", blockedStage = "Verval 14 hari") => ({
  id, status, dueDate, blockedStage, surveyType: "IRI", cyclePeriod: 2,
});
const sample = (cases: ReturnType<typeof makeCase>[], name: string): OperationalWorkflowState => ({
  project: { packageName: name }, corrections: cases,
} as unknown as OperationalWorkflowState);

test("dashboard Penyedia: setiap kasus terbuka tampil terpisah dan terhubung ke paket yang benar", () => {
  const tasks = providerCaseTasks({a: sample([makeCase("A1", "Terbuka"), makeCase("A2", "Disetujui")], "Paket A"), b: sample([makeCase("B1", "Menunggu Persetujuan")], "Paket B")});
  assert.equal(tasks.length, 3);
  assert.deepEqual(tasks.map(item => [item.packageId, item.caseId]), [["a", "A1"], ["a", "A2"], ["b", "B1"]]);
  assert.deepEqual(tasks.map(item => item.owner), ["provider", "provider", "reviewer"]);
  assert.equal(tasks[0].period, 2);
});

test("dashboard Penyedia: tidak menampilkan kasus tertutup; tenggat terdekat diutamakan", () => {
  const source = {a: sample([makeCase("C", "Ditutup"), makeCase("Z", "Terbuka", "2026-12-18"), makeCase("X", "Terbuka", "2026-11-26"), makeCase("Y", "Terbuka")], "Paket")};
  const before = JSON.stringify(source);
  assert.deepEqual(providerCaseTasks(source).map(item => item.caseId), ["X", "Z", "Y"]);
  assert.equal(JSON.stringify(source), before);
});

test("dashboard Penyedia: hasil pemeriksaan Audit 3 tetap menunggu Direktorat, bukan tugas Penyedia", () => {
  const tasks = providerCaseTasks({a: sample([makeCase("AUD3", "Dilaksanakan", "", "Audit tingkat 3")], "Paket")});
  assert.equal(tasks[0].owner, "reviewer");
  assert.match(tasks[0].nextAction, /Periksa ulang/);
});
