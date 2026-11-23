import { documentQuestions, sourceDocument } from '../workflow/sourceDocumentModel';
import { ApiError } from '../auth/client';

export const STAGE1_IRI_CANDIDATE = {
  documentId: 'bd492d0bf8d7f96d',
  candidateRevision: 'CANDIDATE-IRI-CAL-01',
  officialRevision: null,
  approvalState: 'INTERNAL_PROJECT_DRAFT' as const,
  sourceHash: 'ab68855c227ec7ea681fcf3ff03a0b75157b14761e63a13d48bd08a5f8fd550d',
};

const prefix: Record<number, string> = { 2: 'IRI-CAL', 3: 'IRI-VAL', 4: 'IRI-GPS', 5: 'IRI-DOC' };
const source = sourceDocument('IRI', 'calibration');
if (!source || source.id !== STAGE1_IRI_CANDIDATE.documentId) throw new Error('IRI checklist source identity mismatch');

export const STAGE1_IRI_ITEMS = documentQuestions(source)
  .filter(question => [2, 3, 4, 5].includes(question.table))
  .map(question => {
    const match = /^(\d+)\.(\d+)$/.exec(question.number);
    if (!match || !prefix[Number(match[1])] || question.options.join('|').toLowerCase() !== 'ya|tidak') {
      throw new Error(`Unsupported source checklist row: ${question.id}`);
    }
    return {
      key: `${prefix[Number(match[1])]}-${question.number}`,
      sourceId: question.id,
      section: source.tables.find(table => table.table === question.table)?.heading ?? '',
      label: question.label,
      number: question.number,
      options: ['Ya', 'Tidak'] as const,
      answerType: 'choice' as const,
      mandatory: null,
      applicability: ['IRI'] as const,
    };
  });

if (STAGE1_IRI_ITEMS.length !== 30 || new Set(STAGE1_IRI_ITEMS.map(item => item.key)).size !== 30) {
  throw new Error('IRI candidate must contain exactly 30 unique binary source items');
}

export const STAGE1_IRI_ITEM_BY_KEY = new Map(STAGE1_IRI_ITEMS.map(item => [item.key, item]));

export type IriAnswer = { value: 'Ya' | 'Tidak' | null; note: string | null };
export type IriChecklistResponse = {
  paket_id: number;
  survey: 'IRI';
  template: typeof STAGE1_IRI_CANDIDATE & { template_id: number | null };
  filling: { pengisian_id: number | null; version: number; answer_status: 'DRAFT'; updated_at: string | null };
  items: Array<Pick<(typeof STAGE1_IRI_ITEMS)[number], 'key' | 'section' | 'label' | 'number' | 'options' | 'answerType' | 'mandatory' | 'applicability'>>;
  answers: Record<string, IriAnswer>;
};
export type IriChecklistRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

export function mergeIriDraft(current: Record<string, IriAnswer>, patch: Record<string, IriAnswer>) {
  return { ...current, ...patch };
}

export function hydrateIriChecklist(response: IriChecklistResponse, packageId: string): IriChecklistResponse {
  if (response.paket_id !== Number(packageId) || response.survey !== 'IRI' || response.template.documentId !== STAGE1_IRI_CANDIDATE.documentId || response.template.sourceHash !== STAGE1_IRI_CANDIDATE.sourceHash) {
    throw new Error('Respons checklist tidak sesuai paket/template.');
  }
  if (response.template.candidateRevision !== STAGE1_IRI_CANDIDATE.candidateRevision || response.template.approvalState !== 'INTERNAL_PROJECT_DRAFT'
    || response.template.officialRevision !== null || response.items.length !== 30) throw new Error('Item checklist server tidak sesuai versi kandidat.');
  const seen = new Set<string>();
  for (const item of response.items) {
    const expected = STAGE1_IRI_ITEM_BY_KEY.get(item.key);
    if (!expected || seen.has(item.key) || item.label !== expected.label || item.section !== expected.section || item.number !== expected.number
      || item.options.join('|') !== 'Ya|Tidak' || item.applicability.length !== 1 || item.applicability[0] !== 'IRI' || item.mandatory !== null) {
      throw new Error('Item checklist server tidak sesuai versi kandidat.');
    }
    seen.add(item.key);
  }
  for (const [key, answer] of Object.entries(response.answers)) {
    if (!STAGE1_IRI_ITEM_BY_KEY.has(key) || !answer || ![null, 'Ya', 'Tidak'].includes(answer.value)
      || (answer.note !== null && (typeof answer.note !== 'string' || answer.note.length > 2000))) throw new Error('Jawaban server tidak sesuai kontrak checklist.');
  }
  return response;
}

export async function readIriChecklist(packageId: string, request: IriChecklistRequest, signal?: AbortSignal) {
  const response = await request<{ data: IriChecklistResponse }>(`/paket/${encodeURIComponent(packageId)}/checklist-kalibrasi?survey=IRI`, { signal });
  return hydrateIriChecklist(response.data, packageId);
}

export async function saveIriDraft(packageId: string, current: IriChecklistResponse, patch: Record<string, IriAnswer>, request: IriChecklistRequest) {
  const response = await request<{ data: IriChecklistResponse }>(`/paket/${encodeURIComponent(packageId)}/checklist-kalibrasi`, {
    method: 'PATCH', body: JSON.stringify({ template_id: current.template.template_id, expected_version: current.filling.version,
      answers: Object.entries(patch).map(([key, answer]) => ({ key, value: answer.value, note: answer.note })) }),
  });
  const hydrated = hydrateIriChecklist(response.data, packageId);
  if (hydrated.filling.version <= current.filling.version) throw new Error('Bacaan server tidak mengonfirmasi versi draf yang baru.');
  return hydrated;
}

export function draftSaveError(cause: unknown) {
  if (cause instanceof ApiError && cause.status === 409) return { conflict: true, message: 'Versi checklist berubah di server. Perubahan lokal Anda tetap disimpan di layar; muat ulang data secara sadar sebelum menggabungkan.' };
  return { conflict: false, message: cause instanceof Error ? cause.message : 'Simpan gagal; perubahan lokal belum dikonfirmasi server.' };
}
