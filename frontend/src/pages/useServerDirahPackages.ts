import { useEffect, useState } from 'react';
import { apiRequest } from '../auth/client';
import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import {
  mapServerPackagesToDirahPackages,
  type ServerBalaiRow,
  type ServerPackageListResponse,
  type ServerPackageRow,
} from './serverPackageView';

/** Upper bound on pages read for summary screens; each page holds up to page_size packages. */
const MAX_PAGES = 20;

export type ServerDirahPackagesState =
  | { status: 'loading'; packages: Record<string, OperationalWorkflowState> }
  | { status: 'ready'; packages: Record<string, OperationalWorkflowState>; truncated: boolean }
  | { status: 'error'; packages: Record<string, OperationalWorkflowState>; message: string };

/**
 * Reads the caller's packages and Balai names from the API and maps them into the
 * Dirah view model, so Dirah screens render server packages instead of demo data.
 * Stage progress is not inferred here; only identity fields come from the server.
 */
export function useServerDirahPackages(enabled: boolean, role: WorkflowRole) {
  const [state, setState] = useState<ServerDirahPackagesState>({ status: 'loading', packages: {} });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState(current => ({ status: 'loading', packages: current.packages }));
    (async () => {
      const rows: ServerPackageRow[] = [];
      let truncated = true;
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const result = await apiRequest<ServerPackageListResponse>(`/paket?page=${page}`, { signal: controller.signal });
        if (!Array.isArray(result.data)) throw new Error('Format respons paket tidak sesuai.');
        rows.push(...result.data);
        const pageSize = result.page_size > 0 ? result.page_size : 50;
        if (result.data.length < pageSize) { truncated = false; break; }
      }
      // Balai names are optional: the mapper falls back to "Balai #id".
      const balais = await apiRequest<{ data: ServerBalaiRow[] }>('/balai', { signal: controller.signal })
        .then(result => (Array.isArray(result.data) ? result.data : []))
        .catch(() => [] as ServerBalaiRow[]);
      if (controller.signal.aborted) return;
      setState({ status: 'ready', packages: mapServerPackagesToDirahPackages(rows, balais, role), truncated });
    })().catch(error => {
      if (controller.signal.aborted) return;
      setState(current => ({
        status: 'error',
        packages: current.packages,
        message: error instanceof Error ? error.message : 'Gagal memuat paket.',
      }));
    });
    return () => controller.abort();
  }, [enabled, role, revision]);

  return { state, reload: () => setRevision(value => value + 1) };
}
