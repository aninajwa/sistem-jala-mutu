import CompliancePage from './CompliancePage';
import ReportsPage from './ReportsPage';
import type { PageProps } from '../types';
import type { Principal } from '../workflow/repository/contracts';
import { useServerEnrichedPackages } from './useServerEnrichedPackages';

function ServerStatus({ loading, error, count }: { loading: boolean; error: string; count: number }) {
  return <div className="ds-view-toggle" role="status" data-testid="summary-server-status">
    <span>{error ? `Gagal memuat paket: ${error}` : loading ? 'Memuat paket dan status dari server…' : `${count} paket dari server.`}</span>
  </div>;
}

/** Analisis & Kepatuhan on server packages filled with server facts (Dirah UI unchanged). */
export function ServerCompliancePage(p: PageProps) {
  const { packages, loading, error } = useServerEnrichedPackages(p.workflow.role);
  return <><ServerStatus loading={loading} error={error} count={Object.keys(packages).length} /><CompliancePage {...p} packages={packages} /></>;
}

/** Dashboard & Laporan on server packages; the principal's package scope is the server list. */
export function ServerReportsPage(p: PageProps & { principal: Principal }) {
  const { packages, loading, error } = useServerEnrichedPackages(p.workflow.role);
  const principal = { ...p.principal, packageIds: Object.keys(packages) };
  return <><ServerStatus loading={loading} error={error} count={Object.keys(packages).length} />
    <ReportsPage key={principal.packageIds.join(',') + String(loading)} {...p} packages={packages} principal={principal} /></>;
}
