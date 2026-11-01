import test from "node:test";
import assert from "node:assert/strict";
import { createDemoWorkflow } from "../demoScenario";
import {
  documentRepository,
  baKey,
  type BaIdentity,
} from "../ba/documentRepository";
import { listPackageDocuments, availablePeriods } from "./documentCatalog";
import { documentNavigation } from "./documentNavigation";
import { saveDraftVersion } from "../ba/documentService";
import { documentFingerprint } from "../ba/documentWorkflow";
const identity: BaIdentity = {
  packageId: "a:b",
  kind: "audit",
  period: 0,
  survey: "IRI",
  auditLevel: 2,
};
function setup() {
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return memory.size;
      },
      key: (index: number) => [...memory.keys()][index] ?? null,
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  });
  const state = createDemoWorkflow("complete");
  state.project.id = identity.packageId;
  state.role = "PIC Balai / Pengguna Jasa";
  return { state, memory };
}
test("catalog enumerates existing package identities, does not create false drafts or leak other packages", () => {
  const { state, memory } = setup();
  memory.set("legacy-data", "preserve");
  assert.deepEqual(listPackageDocuments(state), []);
  documentRepository.saveDraft(identity, { field: "catatan" });
  documentRepository.saveDraft(
    { ...identity, packageId: "other" },
    { field: "private" },
  );
  const before = [...memory];
  const rows = listPackageDocuments(state);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].identity, identity);
  assert.equal(rows[0].version, 0);
  assert.equal(rows[0].status, "Draft");
  assert.deepEqual([...memory], before);
  memory.set(baKey({ ...identity, survey: "PCI" }), "invalid-json");
  assert.equal(listPackageDocuments(state).length, 1);
});
test("catalog uses actual versions and flags stale data without changing history", () => {
  const { state } = setup();
  documentRepository.addVersion(identity, {
    actor: state.role,
    templateHash: "hash",
    fields: { a: "b" },
    status: "rejected-local",
    sourceFingerprint: documentFingerprint(state, identity),
  });
  assert.equal(listPackageDocuments(state)[0].status, "Ditolak");
  assert.equal(listPackageDocuments(state)[0].stale, false);
  state.project.contractor = "changed";
  assert.equal(listPackageDocuments(state)[0].stale, true);
  assert.equal(documentRepository.read(identity).versions.length, 1);
});
test("explicit draft checkpoints retain legacy keys; Admin and wrong audit owner cannot save", () => {
  const { state, memory } = setup();
  memory.set("jala-ba-draft-v1:old", "legacy");
  saveDraftVersion(state, identity, { a: "b" }, "hash", 0);
  assert.equal(documentRepository.read(identity).versions.length, 1);
  assert.equal(memory.get("jala-ba-draft-v1:old"), "legacy");
  assert.throws(
    () => saveDraftVersion(state, identity, {}, "hash", 0),
    /tab lain/,
  );
  state.role = "Admin";
  assert.throws(
    () => saveDraftVersion(state, identity, {}, "hash", 1),
    /membaca/,
  );
  state.role = "Penyedia Jasa / Ketua Tim";
  assert.throws(
    () => saveDraftVersion(state, identity, {}, "hash", 1),
    /membaca/,
  );
});
test("four document menus use unique live list filters and preserve historical periods", () => {
  const { state } = setup();
  state.activeCyclePeriod = 3;
  state.cycleHistory = { "2": state.cycle };
  assert.deepEqual(availablePeriods(state), [2, 3]);
  for (const role of [
    "Penyedia Jasa / Ketua Tim",
    "PIC Balai / Pengguna Jasa",
    "Direktorat / Pusat",
    "Admin",
  ] as const) {
    const menu = documentNavigation(role);
    assert.equal(new Set(menu.map((item) => item.tab)).size, menu.length);
    assert.ok(
      menu.every(
        (item) => item.href === "/documents" && !item.selection && !item.locked,
      ),
    );
  }
});

test("attachment locations expose package/document identity without leaking storage key into UI", async () => {
  const { state } = setup();
  const { attachmentLocation } = await import("./documentCatalog");
  const result = attachmentLocation(
    `${state.project.id}:ba-internal-p2-IRI-audit1:documents:random-id`,
    { [state.project.id]: state },
  );
  assert.equal(result?.identity?.period, 2);
  assert.equal(result?.identity?.kind, "internal");
  assert.equal(
    attachmentLocation("other:documents:random-id", {
      [state.project.id]: state,
    }),
    undefined,
  );
});

test("document dates are not fabricated from the package simulation clock", async () => {
  const { state } = setup();
  const { BA_TEMPLATES, automaticFields } = await import("../ba/docxEngine");
  for (const template of BA_TEMPLATES) {
    const values = automaticFields(template, state, "IRI", {
      start: "",
      end: "",
    });
    for (const field of template.fields.filter((f) =>
      /^(dd\/mm\/yyyy|tanggal)$/.test(f.label.toLowerCase()),
    ))
      assert.equal(values[field.id], undefined);
  }
});

test("all seven BA map to existing operational routes and retain typed periodic scope", async () => {
  const { documentStages, isPeriodicBa } = await import("./documentCatalog");
  const { workflowSubmodules } = await import("../../app/navigation");
  assert.equal(Object.keys(documentStages).length, 7);
  for (const [kind, stage] of Object.entries(documentStages)) {
    assert.equal(workflowSubmodules.has(stage.selection), true);
    assert.equal(
      isPeriodicBa(kind as BaIdentity["kind"]),
      ["konsistensi", "internal", "duaMingguan"].includes(kind),
    );
  }
});


test('survey-specific template sections never block an unrelated survey draft', async()=>{
 const {BA_TEMPLATES,fieldsFor}=await import('../ba/docxEngine');
 const {baFieldErrors,baFieldComplete}=await import('../ba/fieldValidation');
 for(const kind of ['internal','bertahap','duaMingguan'] as const){
  const template=BA_TEMPLATES.find(t=>t.id===kind)!;
  const iri=fieldsFor(template,'IRI');
  assert.ok(iri.some(f=>/Survei Profil Memanjang/.test(f.section??'')));
  assert.ok(!iri.some(f=>/Survei Jembatan|\(PCI\)|Survei Lainnya/.test(f.section??'')));
  const pci=fieldsFor(template,'PCI');
  assert.ok(pci.some(f=>/\(PCI\)/.test(f.section??'')));
  assert.ok(!pci.some(f=>/Survei Profil Memanjang|Survei Jembatan/.test(f.section??'')));
  const complete=Object.fromEntries(iri.map(f=>[f.id,f.choices?.[0]??'Nilai teruji']));
  assert.deepEqual(baFieldErrors(kind,'IRI',complete),[]);
  const field=iri.find(f=>f.placeholder)!;
  assert.equal(baFieldComplete(field,field.placeholder),false);
  assert.equal(baFieldComplete(field,'[BELUM DIISI]'),false);
 }
});

test('list completeness respects submitted snapshot rather than silently refreshing from source',()=>{
 const {state}=setup();
 documentRepository.addVersion(identity,{actor:state.role,templateHash:'test',fields:{},status:'submitted-local',sourceFingerprint:documentFingerprint(state,identity)});
 const before=listPackageDocuments(state)[0].missing;
 state.project.contractor='New provider';
 assert.equal(listPackageDocuments(state)[0].missing,before);
 assert.equal(listPackageDocuments(state)[0].stale,true);
});
