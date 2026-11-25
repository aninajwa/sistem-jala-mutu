import type { ServerPreparationDocument } from './serverPreparation';

export type DocumentRequest = <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
export type AuthorizedPackageOption = { id: string; name: string };

export async function readPackageDocuments(packageId: string, request: DocumentRequest) {
  const result = await request<{ data: ServerPreparationDocument[] }>(
    `/paket/${encodeURIComponent(packageId)}/dokumen`,
    { cache: 'no-store' },
  );
  if (!result || !Array.isArray(result.data)) {
    throw new Error('Respons daftar dokumen paket tidak sesuai.');
  }
  for (const row of result.data) {
    if (!Number.isSafeInteger(row?.dokumen_id) || row.dokumen_id < 1 ||
        String(row.paket_id) !== packageId || typeof row.judul !== 'string') {
      throw new Error('Identitas dokumen paket dari server tidak valid.');
    }
  }
  return result.data;
}

export function packageDocumentsUrl(currentHref: string, packageId: string | null) {
  const url = new URL(currentHref);
  if (packageId) url.searchParams.set('paket', packageId);
  else url.searchParams.delete('paket');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function documentsPageUrl(currentHref: string, tab: string) {
  const url = new URL(currentHref);
  url.pathname = '/documents';
  url.searchParams.delete('submodule');
  url.searchParams.set('tab', tab);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function authorizedPackageOptions(
  packages: Array<{ id: string; name: string }>,
): AuthorizedPackageOption[] {
  return packages
    .filter(item => /^[1-9]\d*$/.test(item.id) && item.name.trim().length > 0)
    .map(item => ({ id: item.id, name: item.name }));
}

export function initialAuthorizedPackageId(
  packages: AuthorizedPackageOption[],
  requestedId: string | null,
  currentId: string,
) {
  if (requestedId) return packages.some(item => item.id === requestedId) ? requestedId : '';
  return packages.some(item => item.id === currentId) ? currentId : (packages[0]?.id ?? '');
}
