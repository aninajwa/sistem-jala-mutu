import { useEffect, useMemo, useState } from 'react';
import type { WorkflowRole } from '../workflow/model';
import { useServerDirahPackages } from './useServerDirahPackages';
import { useServerPackageStages } from './useServerPackageStages';
import { attachServerAuditFacts } from './audit/serverDirectorateAudit';
import { attachServerCorrections } from './corrections/serverCorrectionAdapter';
import { listPackageCorrections, type ServerCorrectionCase } from './corrections/serverCorrectionData';

/**
 * Server packages mapped into Dirah's view model and filled with server facts
 * (stage, audits, sessions, acceptance, correction cases) for the summary screens:
 * dashboard KPIs, Analisis & Kepatuhan and Dashboard & Laporan. Nothing comes from local demo state.
 */
export function useServerEnrichedPackages(role: WorkflowRole) {
  const { state, reload } = useServerDirahPackages(true, role);
  const stages = useServerPackageStages();
  const [corrections, setCorrections] = useState<ServerCorrectionCase[]>([]);
  const ids = useMemo(() => Object.keys(state.packages).sort().join(','), [state.packages]);

  useEffect(() => {
    if (state.status !== 'ready' || !ids) return;
    const controller = new AbortController();
    Promise.allSettled(ids.split(',').map(id => listPackageCorrections(id, controller.signal)))
      .then(results => { if (!controller.signal.aborted) setCorrections(results.flatMap(r => r.status === 'fulfilled' ? r.value : [])); });
    return () => controller.abort();
  }, [state.status, ids]);

  const packages = useMemo(
    () => attachServerCorrections(attachServerAuditFacts(state.packages, stages), corrections),
    [state.packages, stages, corrections],
  );
  const loading = state.status === 'loading' || stages === null;
  return { packages, stages, loading, error: state.status === 'error' ? state.message : '', reload };
}
