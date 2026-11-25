import { apiRequest } from '../auth/client';

export type PackageRoad = {
  ruas_id: number;
  balai_id: number;
  nomor_ruas?: string | null;
  nama_ruas?: string | null;
};
export type PackageSurveyOption = {
  jenis_survei_id: number;
  kode: string;
  nama: string;
};
export type PackageLocation = {
  lokasi_id: number;
  paket_id: number;
  jenis_survei_id: number | null;
  ruas_id: number | null;
  semester: number | null;
  jenis_pemeriksaan: string | null;
  target_volume: number | null;
  lampiran: string | null;
  ruas: PackageRoad | null;
  survei: PackageSurveyOption | null;
};
export type PackageRoadAssignmentOptions = {
  paket_id: number;
  balai_id: number;
  survei: PackageSurveyOption[];
  semester_tersedia: number[];
  ruas_tersedia: PackageRoad[];
  lokasi_ditetapkan: PackageLocation[];
};
export type PackageRoadRequest = <T>(path: string, init?: RequestInit) => Promise<T>;
type Envelope<T> = { data: T };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function positiveId(value: unknown) {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export function parseOfficialRoads(value: unknown, _packageId: string): PackageRoad[] {
  if (!Array.isArray(value)) throw new Error('Daftar ruas resmi paket tidak sesuai format.');
  return value.map(raw => {
    if (!object(raw) || !positiveId(raw.ruas_id) || !positiveId(raw.balai_id)) {
      throw new Error('Daftar ruas resmi paket memuat identitas ruas tidak valid.');
    }
    return raw as PackageRoad;
  });
}

export function parseAssignmentOptions(value: unknown, packageId: string): PackageRoadAssignmentOptions {
  if (!object(value) || value.paket_id !== Number(packageId) || !positiveId(value.balai_id) ||
    !Array.isArray(value.survei) || !Array.isArray(value.semester_tersedia) ||
    !Array.isArray(value.ruas_tersedia) || !Array.isArray(value.lokasi_ditetapkan)) {
    throw new Error('Opsi penetapan ruas tidak lengkap atau tidak sesuai paket.');
  }
  for (const survey of value.survei) {
    if (!object(survey) || !positiveId(survey.jenis_survei_id) ||
      typeof survey.kode !== 'string' || typeof survey.nama !== 'string') {
      throw new Error('Katalog jenis survei dari server tidak valid.');
    }
  }
  for (const semester of value.semester_tersedia) {
    if (!Number.isSafeInteger(semester) || Number(semester) < -2147483648 || Number(semester) > 2147483647) {
      throw new Error('Daftar semester paket tidak valid.');
    }
  }
  const roads = parseOfficialRoads(value.ruas_tersedia, packageId);
  const locations = value.lokasi_ditetapkan.map(raw => {
    if (!object(raw) || !object(raw.lokasi) || !positiveId(raw.lokasi.lokasi_id) ||
      raw.lokasi.paket_id !== Number(packageId) ||
      !(raw.ruas === null || (object(raw.ruas) && positiveId(raw.ruas.ruas_id))) ||
      !(raw.survei === null || (object(raw.survei) && positiveId(raw.survei.jenis_survei_id)))) {
      throw new Error('Lokasi paket yang ditetapkan tidak valid.');
    }
    return {
      ...(raw.lokasi as unknown as PackageLocation),
      ruas: raw.ruas as PackageRoad | null,
      survei: raw.survei as PackageSurveyOption | null,
    };
  });
  return {
    paket_id: Number(value.paket_id),
    balai_id: Number(value.balai_id),
    survei: value.survei as PackageSurveyOption[],
    semester_tersedia: value.semester_tersedia as number[],
    ruas_tersedia: roads,
    lokasi_ditetapkan: locations,
  };
}

export async function getOfficialPackageRoads(
  packageId: string,
  request: PackageRoadRequest = apiRequest,
  signal?: AbortSignal,
) {
  const result = await request<Envelope<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/ruas-jalan`,
    { signal },
  );
  return parseOfficialRoads(result?.data, packageId);
}

export async function getPackageRoadAssignmentOptions(
  packageId: string,
  request: PackageRoadRequest = apiRequest,
  signal?: AbortSignal,
) {
  const result = await request<Envelope<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/ruas-jalan/assignment`,
    { signal },
  );
  return parseAssignmentOptions(result?.data, packageId);
}

export async function addPackageRoadLocation(
  packageId: string,
  input: { ruas_id: number; jenis_survei_id: number; semester: number | null },
  request: PackageRoadRequest = apiRequest,
) {
  const result = await request<Envelope<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/ruas-jalan/assignment`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  if (!object(result?.data) || !object(result.data.lokasi) ||
    result.data.lokasi.paket_id !== Number(packageId) ||
    result.data.lokasi.ruas_id !== input.ruas_id ||
    result.data.lokasi.jenis_survei_id !== input.jenis_survei_id ||
    result.data.lokasi.semester !== input.semester ||
    !Array.isArray(result.data.ruas_paket)) {
    throw new Error('Bacaan ulang atomik RPC tidak mengesahkan lokasi ruas yang disimpan.');
  }
  const officialRoads = parseOfficialRoads(result.data.ruas_paket, packageId);
  if (!officialRoads.some(road => road.ruas_id === input.ruas_id)) {
    throw new Error('Lokasi tersimpan tetapi belum muncul pada bacaan ruas resmi paket.');
  }
  return { location: result.data.lokasi as unknown as PackageLocation, officialRoads };
}
