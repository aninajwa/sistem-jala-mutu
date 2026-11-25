import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createLocalId } from "./localId";
import { dashboardModel, groupRows, splitRows } from "./dashboardModel";
import { readLocalReports } from "./adapter";
import { filterReport } from "./query";
import { EMPTY_FILTER, type ReportFilter } from "./model";
import { INITIAL_WORKFLOW, type WorkflowRole } from "../workflow/model";
import type { Principal } from "../workflow/repository/contracts";
import { appendDraft, readDraftHistory } from "./draftStorage";
import { draftKey, type Draft } from "./periodic";
const roles: WorkflowRole[] = [
  "Penyedia Jasa / Ketua Tim",
  "PIC Balai / Pengguna Jasa",
  "Direktorat / Pusat",
  "Admin",
];
const principal: Principal = {
  id: "owner",
  role: roles[0],
  packageIds: ["A", "B", "EMPTY"],
  balaiIds: [],
  source: "local-test",
};
function pkg(id: string, balai: string) {
  const p = structuredClone(INITIAL_WORKFLOW);
  p.project.id = id;
  p.project.packageName = "Paket serupa";
  p.project.balai = balai;
  p.project.surveyTypes = ["IRI", "PCI"];
  p.dailyRecords = [
    {
      id: "r",
      date: "2026-10-01",
      surveyType: "IRI",
      road: "R",
      state: "Tercatat",
    },
  ] as any;
  p.corrections = [
    { id: "c1", status: "Terbuka", dueDate: "2026-10-01", surveyType: "IRI" },
    { id: "c2", status: "Ditutup", dueDate: "2026-10-02", surveyType: "PCI" },
  ] as any;
  p.cycle.surveyReviews = {
    IRI: { decision: "Sesuai", reviewedAt: "2026-10-01", note: "n" },
  };
  return p;
}
const packages = {
  A: pkg("A", "Balai A"),
  B: pkg("B", "Balai B"),
  EMPTY: pkg("EMPTY", "Balai B"),
  SECRET: pkg("SECRET", "Rahasia"),
};
packages.EMPTY.dailyRecords = [];
packages.EMPTY.corrections = [];
packages.EMPTY.cycle.surveyReviews = {};
function model(role = roles[0], f: ReportFilter = { ...EMPTY_FILTER }) {
  const s = readLocalReports(packages, { ...principal, role });
  return dashboardModel(
    role,
    {
      activities: filterReport(s.rows.activities, f),
      reviews: filterReport(s.rows.reviews, f),
      corrections: filterReport(s.rows.corrections, f),
    },
    s.packages,
    f,
  );
}
for (const role of roles.slice(0, 3))
  test(`scoped unique metrics ${role}`, () => {
    const m = model(role);
    assert.equal(m.packageCount, 3);
    assert.equal(m.balaiCount, 2);
    assert.equal(m.data.activities.length, 2);
    assert.equal(m.active, 2);
    assert.equal(m.closed, 2);
    assert.equal(m.data.reviews.length, 2);
    for (const c of m.charts)
      assert.doesNotMatch(JSON.stringify(c), /Rahasia|SECRET/);
  });
test("role charts have different questions and forms", () => {
  const [p, b, d] = roles.slice(0, 3).map((r) => model(r));
  assert.deepEqual(
    p.charts.map((c) => c.id),
    ["trend", "types", "actions", "packages"],
  );
  assert.equal(p.charts[0].type, "area");
  assert.deepEqual(
    b.charts.map((c) => c.id),
    ["packages", "reviews", "actions", "trend"],
  );
  assert.deepEqual(
    d.charts.map((c) => c.id),
    ["regions", "trend", "actions", "reviews"],
  );
  assert.deepEqual(d.charts[1].series, ["Balai A", "Balai B"]);
});
test("Admin and empty assignments fail closed", () => {
  const s = readLocalReports(packages, { ...principal, role: "Admin" });
  assert.equal(s.denied, true);
  assert.deepEqual(s.packages, {});
  assert.equal(model("Admin").data.activities.length, 0);
});
test("inactive assignment packages and record filters are distinguished", () => {
  assert.equal(model().packageCount, 3);
  assert.equal(
    model(roles[0], { ...EMPTY_FILTER, start: "2026-10-01" }).packageCount,
    2,
  );
  assert.equal(
    model(roles[0], { ...EMPTY_FILTER, start: "2030-01-01" }).packageCount,
    0,
  );
});
test("global filter intersection propagates everywhere", () => {
  const f = {
    ...EMPTY_FILTER,
    packageId: "A",
    balai: "Balai A",
    survey: "IRI",
    start: "2026-10-01",
    end: "2026-10-01",
  };
  const m = model(roles[0], f);
  assert.equal(m.packageCount, 1);
  assert.equal(m.data.activities.length, 1);
  assert.equal(m.active, 1);
  assert.equal(m.closed, 0);
  assert.equal(
    model(roles[0], { ...f, status: "Ditutup" }).data.activities.length,
    0,
  );
  assert.equal(model(roles[0], { ...f, packageId: "SECRET" }).packageCount, 0);
});
test("stack totals match unique cases and identical names do not merge packages", () => {
  const m = model();
  const c = m.charts.find((c) => c.id === "actions")!;
  assert.equal(c.values.length, 2);
  for (const p of c.values)
    assert.equal(
      c.series!.reduce((n, _, i) => n + Number(p[`s${i}`] || 0), 0),
      p.count,
    );
  assert.equal(m.charts.find((c) => c.id === "packages")!.values.length, 2);
});
test("duplicate source identities counted once", () => {
  const rows = readLocalReports(packages, principal).rows.activities;
  assert.equal(groupRows([...rows, rows[0]], "survey")[0].count, 2);
  assert.equal(
    splitRows([...rows, rows[0]], "month", "balai").values[0].count,
    2,
  );
});
test("over six types use bars and unknown status is not counted active", () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({
    key: String(i),
    survey: "Jenis " + i,
    date: "",
    status: "Unknown",
    packageId: "A",
    packageName: "P",
    balai: "B",
    dateBasis: "",
    reference: "",
    context: "",
  }));
  const m = dashboardModel(
    roles[0],
    { activities: rows, reviews: [], corrections: rows },
    packages,
    EMPTY_FILTER,
  );
  assert.equal(m.charts[1].type, "horizontal");
  assert.equal(m.active, 0);
  assert.equal(m.charts[0].values.length, 0);
});
test("HTTP getRandomValues fallback produces unique RFC4122 v4 identities", () => {
  const fallback = {
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  } as Crypto;
  const ids = Array.from({ length: 10000 }, () => createLocalId(fallback));
  assert.equal(new Set(ids).size, 10000);
  for (const id of ids.slice(0, 20))
    assert.match(
      id,
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
    );
});
test("native UUID and unavailable/throwing crypto paths are handled", () => {
  assert.equal(
    createLocalId({
      randomUUID: () => "native-id",
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    } as Crypto),
    "native-id",
  );
  assert.match(
    createLocalId({
      randomUUID: () => {
        throw Error();
      },
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    } as Crypto),
    /^[a-f0-9-]{36}$/,
  );
  assert.throws(() => createLocalId({} as Crypto), /Pembuat ID aman/);
});
function memory() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) || null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}
const draft: Draft = {
  id: "ID",
  owner: "owner",
  packageId: "A",
  kind: "weekly",
  start: "2026-10-01",
  end: "2026-10-07",
  content: ["a", "b", "c", "d"],
  attachments: [
    { name: "a.png", type: "image/png", data: "data:image/png;base64,AA==" },
  ],
  updated: "2026-10-01T10:00:00Z",
  version: 1,
};
test("immutable versions persist attachments and retain withdrawn assignment", () => {
  const store = memory();
  appendDraft(store, principal, draft);
  appendDraft(store, principal, { ...draft, id: "other", packageId: "B" });
  const all = appendDraft(
    store,
    { ...principal, packageIds: ["A"] },
    { ...draft, content: ["new", "b", "c", "d"] },
  );
  assert.equal(all.length, 3);
  assert.equal(all[0].content[0], "a");
  assert.equal(all[2].version, 2);
  assert.equal(
    readDraftHistory(store, principal)[0].attachments[0].data,
    draft.attachments[0].data,
  );
});
test("corrupt history and quota do not overwrite data or pretend success", () => {
  const store = memory();
  store.setItem(draftKey(principal), "CORRUPT");
  assert.throws(() => appendDraft(store, principal, draft), /Data draf/);
  assert.equal(store.getItem(draftKey(principal)), "CORRUPT");
  assert.throws(
    () =>
      appendDraft(
        {
          getItem: () => "[]",
          setItem: () => {
            throw Error("QuotaExceededError");
          },
        },
        principal,
        draft,
      ),
    /Quota/,
  );
});
test("schema, collision, roles and ownership checked before writing", () => {
  const store = memory();
  for (const role of roles.slice(1))
    assert.throws(() => appendDraft(store, { ...principal, role }, draft));
  appendDraft(store, principal, draft);
  assert.throws(
    () => appendDraft(store, principal, { ...draft, packageId: "B" }),
    /bertentangan/,
  );
  store.setItem(
    draftKey(principal),
    JSON.stringify([{ ...draft, kind: "forged" }]),
  );
  assert.throws(() => readDraftHistory(store, principal));
});
