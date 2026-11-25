import { useEffect, useState } from 'react';
import type { WorkflowRole } from '../workflow/model';
import { loadServerCorrections, loadServerPackages, packageFailureState, type ResourceState, type ServerCorrection, type ServerDashboardData, type ServerDashboardPackage } from './serverDashboard';

const initial: ServerDashboardData = {
  packages: { status: 'loading' }, corrections: { status: 'loading' }, correctionErrors: {},
};

export function useServerDashboard(enabled: boolean, role: WorkflowRole) {
  const [data, setData] = useState<ServerDashboardData>(initial);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setData(initial);
    void (async () => {
      let packages: ServerDashboardPackage[];
      try {
        packages = await loadServerPackages(controller.signal, role);
        if (controller.signal.aborted) return;
        setData(current => ({ ...current, packages: { status: 'ready', data: packages } }));
      } catch (error) {
        if (controller.signal.aborted) return;
        const state: ResourceState<ServerDashboardPackage[]> = packageFailureState(error);
        setData({ packages: state, corrections: { status: 'unavailable', message: 'Koreksi tidak dapat dimuat tanpa daftar paket yang sah.' }, correctionErrors: {} });
        return;
      }

      try {
        const result = await loadServerCorrections(packages, controller.signal);
        if (controller.signal.aborted) return;
        const failures = Object.keys(result.errors).length;
        const correctionState: ResourceState<Record<string, ServerCorrection[]>> =
          failures === packages.length && packages.length > 0
            ? { status: 'error', message: 'Koreksi gagal dimuat untuk semua paket dalam respons server.' }
            : { status: 'ready', data: result.data };
        setData(current => ({ ...current, corrections: correctionState, correctionErrors: result.errors }));
      } catch (error) {
        if (!controller.signal.aborted) setData(current => ({
          ...current,
          corrections: { status: 'error', message: error instanceof Error ? error.message : 'Koreksi gagal dimuat.' },
        }));
      }
    })();
    return () => controller.abort();
  }, [enabled, retry, role]);
  return { data, reload: () => setRetry(value => value + 1) };
}
