import { test } from "node:test";
import assert from "node:assert/strict";
import { scopedBalaiLocations } from "./geo/adapter";
import { statusTone } from "./statusPresentation";
const input = {
  id: "source-row",
  label: "Lokasi bersumber",
  balai: "Balai A",
  latitude: -6.2,
  longitude: 106.8,
  sourceId: "reference-test",
  sourceSystem: "isolated-test",
};
test("empty geography never fabricates locations", () =>
  assert.deepEqual(scopedBalaiLocations([], new Set(["Balai A"])), []));
test("only a scoped sourced coordinate becomes a location; input is immutable", () => {
  const before = JSON.stringify(input);
  assert.equal(scopedBalaiLocations([input], new Set(["Balai A"])).length, 1);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(scopedBalaiLocations([input], new Set(["Balai B"])), []);
});
test("missing provenance and duplicate geometry are rejected", () => {
  assert.deepEqual(
    scopedBalaiLocations(
      [
        { ...input, sourceId: "" },
        { ...input, latitude: NaN },
      ],
      new Set(["Balai A"]),
    ),
    [],
  );
  assert.equal(
    scopedBalaiLocations([input, input], new Set(["Balai A"])).length,
    1,
  );
});
for (const [label, tone] of [
  ["Belum Lengkap", "warn"],
  ["Belum Disetujui", "warn"],
  ["Tidak Sesuai", "bad"],
  ["Perlu Perbaikan", "bad"],
  ["Lulus", "good"],
  ["Dalam Review", "warn"],
  ["Draft", "info"],
  ["Tidak dikenal", "neutral"],
] as const)
  test(`${label}: visual status does not imply a false positive decision`, () =>
    assert.equal(statusTone(label), tone));
