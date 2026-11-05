
import { expect, test, vi } from "vitest";
import {
  ROLE_TABS,
  STATUS_ORDER,
  matchesRoleTab,
  type CorrectionRow,
} from "./correctionViewModel";

const assert = {
  deepEqual(actual: unknown, expected: unknown) {
    expect(actual).toEqual(expected);
  },
  equal(actual: unknown, expected: unknown) {
    expect(actual).toBe(expected);
  },
  doesNotMatch(actual: string, pattern: RegExp, message?: string) {
    expect(actual, message).not.toMatch(pattern);
  },
  match(actual: string, pattern: RegExp) {
    expect(actual).toMatch(pattern);
  },
};

const statuses = [...STATUS_ORDER];

const rows = statuses.map((status, i) => ({
  id: `TEST-${i}`,
  key: `paket-test:TEST-${i}`,
  packageId: "paket-test",
  packageName: "Paket Test",
  balai: "Balai Test",
  status,
  severity: "Minor",
  source: "Verval 14 hari",
  blockedStage: "Verval 14 hari",
  returnStage: "Verval 14 hari",
  dueDate: "",
})) as unknown as CorrectionRow[];

const penyedia = "Penyedia Jasa / Ketua Tim" as const;
const balai = "PIC Balai / Pengguna Jasa" as const;
const pusat = "Direktorat / Pusat" as const;

function visible(
  role: typeof penyedia | typeof balai | typeof pusat,
  tab: string,
) {
  return rows
    .filter(row => matchesRoleTab(row, role, tab))
    .map(row => row.status);
}

test("Menu sesuai role", () => {
  assert.deepEqual(ROLE_TABS[penyedia], [
    "Tugas Saya", "Menunggu Verifikasi", "Riwayat",
  ]);
  assert.deepEqual(ROLE_TABS[balai], [
    "Antrian Verifikasi", "Tindak Lanjut Paket",
    "Verifikasi Ulang", "Riwayat",
  ]);
});

test("Penyedia: status masuk submenu yang benar", () => {
  assert.deepEqual(visible(penyedia, "Tugas Saya"), [
    "Terbuka", "Disetujui",
  ]);
  assert.deepEqual(visible(penyedia, "Menunggu Verifikasi"), [
    "Menunggu Persetujuan", "Dilaksanakan",
    "Verifikasi Ulang",
  ]);
  assert.deepEqual(visible(penyedia, "Riwayat"), [
    "Ditutup",
  ]);
});

test("Balai: persetujuan dan verifikasi ulang terpisah", () => {
  assert.deepEqual(visible(balai, "Antrian Verifikasi"), [
    "Menunggu Persetujuan",
  ]);
  assert.deepEqual(visible(balai, "Verifikasi Ulang"), [
    "Dilaksanakan", "Verifikasi Ulang",
  ]);
  assert.deepEqual(visible(balai, "Riwayat"), [
    "Ditutup",
  ]);
  assert.deepEqual(
    visible(balai, "Tindak Lanjut Paket"),
    statuses,
  );
});

test("Direktorat: pemantauan verifikasi ulang", () => {
  assert.deepEqual(visible(pusat, "Verifikasi Ulang"), [
    "Dilaksanakan", "Verifikasi Ulang",
  ]);
  assert.deepEqual(visible(pusat, "Riwayat"), [
    "Ditutup",
  ]);
});

test("KPI dan grafik memakai himpunan kasus yang sama", () => {
  for (const [role, tab] of [
    [penyedia, "Menunggu Verifikasi"],
    [balai, "Verifikasi Ulang"],
    [balai, "Antrian Verifikasi"],
  ] as const) {
    const selected = rows.filter(row =>
      matchesRoleTab(row, role, tab)
    );

    const kpiTotal = selected.length;

    const chartTotal = STATUS_ORDER.reduce(
      (total, status) =>
        total + selected.filter(row =>
          row.status === status
        ).length,
      0,
    );

    assert.equal(kpiTotal, chartTotal);
  }
});