import { useEffect, useMemo, useState } from 'react';
import type { WorkflowRole } from '../workflow/model';
import { useServerDirahPackages } from './useServerDirahPackages';
import { useServerPackageStages } from './useServerPackageStages';
import { attachServerAuditFacts, attachVervalReviews } from './audit/serverDirectorateAudit';
import { apiRequest } from '../auth/client';
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
  const [cycles, setCycles] = useState<Record<string, Parameters<typeof attachVervalReviews>[1][string]>>({});
  const ids = useMemo(() => Object.keys(state.packages).sort().join(','), [state.packages]);

  useEffect(() => {
    if (state.status !== 'ready' || !ids) return;
    const controller = new AbortController();
    Promise.allSettled(ids.split(',').map(id => listPackageCorrections(id, controller.signal)))
      .then(results => { if (!controller.signal.aborted) setCorrections(results.flatMap(r => r.status === 'fulfilled' ? r.value : [])); });
    return () => controller.abort();
  }, [state.status, ids]);

  // Verval reviews only for packages with survey sessions (others cannot have cycles).
  const vervalIds = useMemo(() => stages ? Object.values(stages).filter(s => (s.jumlah_sesi ?? 0) > 0).map(s => String(s.paket_id)).sort().join(',') : '', [stages]);
  useEffect(() => {
    if (!vervalIds) return;
    const controller = new AbortController();
    Promise.allSettled(vervalIds.split(',').map(id => apiRequest<{ data: { siklus: Parameters<typeof attachVervalReviews>[1][string] } }>(`/paket/${id}/verval`, { signal: controller.signal })
      .then(result => [id, result.data?.siklus ?? []] as const)))
      .then(results => { if (!controller.signal.aborted) setCycles(Object.fromEntries(results.flatMap(r => r.status === 'fulfilled' ? [r.value] : []))); });
    return () => controller.abort();
  }, [vervalIds]);

  const packages = useMemo(
    () => attachVervalReviews(attachServerCorrections(attachServerAuditFacts(state.packages, stages), corrections), cycles),
    [state.packages, stages, corrections, cycles],
  );
  const loading = state.status === 'loading' || stages === null;
  return { packages, stages, loading, error: state.status === 'error' ? state.message : '', reload };
}
