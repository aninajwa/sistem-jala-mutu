import test from "node:test";
import assert from "node:assert/strict";
import {
  CATALOG,
  canEdit,
  validateDraft,
  sumSessionDistance,
  type Draft,
  type SurveySessionLength,
} from "./periodic";
import { groupRows } from "./Dashboard";
import type { Principal } from "../workflow/repository/contracts";
const principal: Principal = {
  id: "u",
  role: "Penyedia Jasa / Ketua Tim",
  packageIds: ["A"],
  balaiIds: [],
  source: "local-test",
};
const draft: Draft = {
  id: "d",
  owner: "u",
  packageId: "A",
  kind: "weekly",
  start: "2026-11-01",
  end: "2026-11-07",
  content: ["a", "b", "c", "d"],
  attachments: [],
  updated: "",
  version: 1,
};
test("catalog separates four report purposes and has no official final decision", () => {
  assert.equal(CATALOG.length, 4);
  for (const c of CATALOG) assert.deepEqual(c.reviewers, ["Balai"]);
});
test("only assigned owner provider edits drafts", () => {
  assert.ok(canEdit(principal, draft));
  for (const role of [
    "Admin",
    "PIC Balai / Pengguna Jasa",
    "Direktorat / Pusat",
  ] as const)
    assert.equal(canEdit({ ...principal, role }, draft), false);
  assert.equal(canEdit(principal, { ...draft, owner: "other" }), false);
  assert.equal(canEdit(principal, { ...draft, packageId: "secret" }), false);
});
test("draft dates and sections required", () => {
  assert.equal(validateDraft(draft), "");
  for (const d of [
    { ...draft, start: "2026-02-30" },
    { ...draft, end: "2026-01-01" },
    { ...draft, content: ["a", "", "b", "c"] },
    { ...draft, kind: "fake" },
  ])
    assert.ok(validateDraft(d));
});
test("charts empty state and grouping preserve counts", () => {
  assert.deepEqual(groupRows([], "status"), []);
  const rows = [{ status: "a" }, { status: "a" }, { status: "b" }] as any;
  assert.deepEqual(groupRows(rows, "status"), [
    { name: "a", count: 2 },
    { name: "b", count: 1 },
  ]);
});
test("km only verified scoped unique sessions, never record conversion", () => {
  const r: SurveySessionLength = {
    packageId: "A",
    sessionId: "1",
    date: "2026-11-01",
    surveyType: "IRI",
    length: 2,
    unit: "km",
    sourceId: "source",
    validation: "verified",
    aggregation: "session-distance",
  };
  assert.equal(
    sumSessionDistance(
      [
        r,
        r,
        { ...r, sessionId: "2", validation: "unverified" },
        { ...r, packageId: "secret" },
        { ...r, sessionId: "3", length: NaN },
      ],
      ["A"],
    ),
    2,
  );
  assert.equal(sumSessionDistance([], ["A"]), 0);
});
