// LOCAL TEST/QA ONLY. Not imported by Express and never connects to Supabase.
import { z } from 'zod';

const MAX_ID = 2_147_483_647;
const id = z.number().int().positive().max(MAX_ID);
const finite = z.number().finite();

export const localConsistencyPayloadSchema = z.object({
  siklus_id: id,
  jenis_survei_id: id,
  tim_id: id,
  ruas_id: id,
  sta_awal: finite,
  sta_akhir: finite,
  jumlah_ulangan: id,
  ulangan: z.array(z.object({
    ulangan_ke: id,
    rater_personel_id: id,
    nilai: finite,
  }).strict()).min(1),
}).strict();

export class LocalPrototypeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LocalPrototypeError';
    this.code = code;
  }
}

/**
 * Simulated transaction against isolated memory only.
 * References are fixture joins, not claims about live cross-table relationships.
 */
export function createLocalConsistencyRepository({ cycles = [], referenceRows = [] } = {}) {
  const state = {
    cycles: structuredClone(cycles),
    referenceRows: structuredClone(referenceRows),
    consistency: [],
    repetitions: [],
    nextConsistencyId: 1,
    nextRepetitionId: 1,
  };

  return {
    snapshot: () => structuredClone(state),
    async transact(work) {
      const draft = structuredClone(state);
      const result = await work(draft);
      Object.assign(state, draft);
      return structuredClone(result);
    },
  };
}

/**
 * Local validator/simulator. `fixtureRoleAllowsWrite` is deliberately an
 * injected test decision; no role name or production write policy is defined.
 */
export async function simulateConsistencyWrite({
  repository,
  packageId,
  auth,
  payload,
  failRepeatAt = null,
}) {
  const parsed = localConsistencyPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new LocalPrototypeError('INVALID_INPUT', 'Payload simulasi tidak valid');
  }
  if (!Number.isSafeInteger(packageId) || packageId <= 0 || packageId > MAX_ID) {
    throw new LocalPrototypeError('INVALID_INPUT', 'ID paket simulasi tidak valid');
  }
  if (!auth || !Number.isSafeInteger(auth.actorId) || auth.actorId <= 0) {
    throw new LocalPrototypeError('UNAUTHENTICATED', 'Identiti fixture diperlukan');
  }
  if (!auth.assignments?.some((assignment) => assignment.packageId === packageId)) {
    throw new LocalPrototypeError('FORBIDDEN', 'Fixture tidak mempunyai assignment paket');
  }
  if (auth.fixtureRoleAllowsWrite !== true) {
    throw new LocalPrototypeError('FORBIDDEN', 'Keputusan role fixture menolak write');
  }

  return repository.transact(async (draft) => {
    const cycle = draft.cycles.find((row) => row.siklus_id === parsed.data.siklus_id && row.paket_id === packageId);
    if (!cycle) throw new LocalPrototypeError('NOT_FOUND', 'Siklus tidak dimiliki paket fixture');

    const referenceMatches = draft.referenceRows.some((row) =>
      row.paket_id === packageId
      && row.siklus_id === parsed.data.siklus_id
      && row.jenis_survei_id === parsed.data.jenis_survei_id
      && row.tim_id === parsed.data.tim_id
      && row.ruas_id === parsed.data.ruas_id
      && parsed.data.ulangan.every((repeat) => row.personel_ids?.includes(repeat.rater_personel_id)));
    if (!referenceMatches) {
      throw new LocalPrototypeError('REFERENCE_MISMATCH', 'Rujukan tidak sepadan dengan fixture paket/siklus');
    }

    const main = {
      konsistensi_id: draft.nextConsistencyId++,
      siklus_id: parsed.data.siklus_id,
      jenis_survei_id: parsed.data.jenis_survei_id,
      tim_id: parsed.data.tim_id,
      ruas_id: parsed.data.ruas_id,
      sta_awal: parsed.data.sta_awal,
      sta_akhir: parsed.data.sta_akhir,
      jumlah_ulangan: parsed.data.jumlah_ulangan,
      status: null,
    };
    draft.consistency.push(main);

    const repeats = [];
    for (let index = 0; index < parsed.data.ulangan.length; index += 1) {
      if (failRepeatAt === index) throw new LocalPrototypeError('SIMULATED_INSERT_FAILURE', 'Kegagalan insert ulangan simulasi');
      const item = parsed.data.ulangan[index];
      const repeat = {
        ulangan_id: draft.nextRepetitionId++,
        konsistensi_id: main.konsistensi_id,
        ulangan_ke: item.ulangan_ke,
        rater_personel_id: item.rater_personel_id,
        nilai: item.nilai,
      };
      draft.repetitions.push(repeat);
      repeats.push(repeat);
    }
    return { ...main, ulangan: repeats };
  });
}
