import {
  CATALOG,
  draftKey,
  canEdit,
  validateDraft,
  type Draft,
} from "./periodic";
import type { Principal } from "../workflow/repository/contracts";
const bad = () =>
  new Error(
    "Data draf tidak dapat dibaca. Simpan salinan penyimpanan browser sebelum pemulihan.",
  );
export function readDraftHistory(
  storage: Pick<Storage, "getItem">,
  principal: Principal,
): Draft[] {
  let data: unknown;
  try {
    data = JSON.parse(storage.getItem(draftKey(principal)) || "[]");
  } catch {
    throw bad();
  }
  if (!Array.isArray(data)) throw bad();
  const versions = new Set<string>();
  for (const d of data) {
    if (
      !d ||
      !["id", "owner", "packageId", "start", "end", "updated"].every(
        (k) => typeof d[k] === "string" && !!d[k],
      ) ||
      !CATALOG.some((c) => c.id === d.kind) ||
      !Number.isFinite(Date.parse(d.updated)) ||
      !Number.isInteger(d.version) ||
      d.version < 1 ||
      !Array.isArray(d.content) ||
      d.content.length !== 4 ||
      d.content.some((v: unknown) => typeof v !== "string") ||
      !Array.isArray(d.attachments) ||
      d.attachments.some(
        (a: Draft["attachments"][number]) =>
          !a ||
          typeof a.name !== "string" ||
          !["application/pdf", "image/png", "image/jpeg"].includes(a.type) ||
          typeof a.data !== "string" ||
          !a.data.startsWith(`data:${a.type};base64,`),
      )
    )
      throw bad();
    const key = JSON.stringify([d.id, d.version]);
    if (versions.has(key)) throw bad();
    versions.add(key);
  }
  return data;
}
/** Re-read before append; retain records temporarily outside current assignment. Browser-only, no server transaction. */
export function appendDraft(
  storage: Pick<Storage, "getItem" | "setItem">,
  principal: Principal,
  draft: Draft,
): Draft[] {
  if (!canEdit(principal, draft) || validateDraft(draft) || !draft.id)
    throw new Error("Draf di luar kewenangan atau belum lengkap.");
  const prior = readDraftHistory(storage, principal);
  if (
    prior.some(
      (d) =>
        d.id === draft.id &&
        (d.owner !== draft.owner ||
          d.packageId !== draft.packageId ||
          d.kind !== draft.kind),
    )
  )
    throw new Error("Identitas draf bertentangan dengan versi tersimpan.");
  const version =
    Math.max(
      0,
      ...prior.filter((d) => d.id === draft.id).map((d) => d.version),
    ) + 1;
  const all = [...prior, { ...draft, version }];
  storage.setItem(draftKey(principal), JSON.stringify(all));
  return all;
}
