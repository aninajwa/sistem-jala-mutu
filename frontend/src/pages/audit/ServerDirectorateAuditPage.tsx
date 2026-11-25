import { useMemo } from 'react';
import DirectorateAuditPage from '../DirectorateAuditPage';
import type { PageProps } from "../../types";
import { useServerDirahPackages } from '../useServerDirahPackages';
import { useServerPackageStages } from '../useServerPackageStages';
import { attachServerAuditFacts } from './serverDirectorateAudit';

/** Direktorat "Audit Tingkat 3" queue on server packages and server audit facts (Dirah UI unchanged). */
export function ServerDirectorateAuditPage(p: PageProps) {
  const { state } = useServerDirahPackages(true, p.workflow.role);
  const stages = useServerPackageStages();
  const packages = useMemo(() => attachServerAuditFacts(state.packages, stages), [state.packages, stages]);
  return <>
    <div className="ds-view-toggle" role="status" data-testid="directorate-server-status">
      <span>{state.status === 'loading' || !stages ? 'Memuat paket dan status audit dari server…'
        : state.status === 'error' ? `Gagal memuat paket: ${state.message}` : `${Object.keys(packages).length} paket dari server.`}</span>
    </div>
    <DirectorateAuditPage {...p} packages={packages} />
  </>;
}
