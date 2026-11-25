import { useEffect, useMemo, useState } from 'react';
import CorrectionDashboard from './CorrectionDashboard';
import type { CorrectionPageProps } from '../ActionsPage';
import type { WorkflowRole } from '../../workflow/model';
import { useServerDirahPackages } from '../useServerDirahPackages';
import { getCorrectionCapabilities, listPackageCorrections, mapCorrectionRpcError, type ServerCorrectionCase } from './serverCorrectionData';
import { attachServerCorrections } from './serverCorrectionAdapter';

/** Dirah's correction dashboard fed with server packages and server correction cases. */
export function ServerCorrectionsPage(props: CorrectionPageProps & { authenticatedRole: WorkflowRole }) {
  const { state, reload } = useServerDirahPackages(true, props.authenticatedRole);
  const [rows, setRows] = useState<ServerCorrectionCase[]>([]);
  const [status, setStatus] = useState<{ loading: boolean; message: string }>({ loading: true, message: '' });
  const packageIds = useMemo(() => Object.keys(state.packages).sort().join(','), [state.packages]);

  useEffect(() => {
    if (state.status !== 'ready') return;
    const ids = packageIds ? packageIds.split(',') : [];
    const controller = new AbortController();
    setStatus({ loading: true, message: '' });
    (async () => {
      if (!ids.length) { setRows([]); return ''; }
      const capability = await getCorrectionCapabilities(ids[0], controller.signal);
      if (!capability.read) { setRows([]); return capability.reason ?? 'Koreksi server belum diaktifkan.'; }
      const results = await Promise.allSettled(ids.map(id => listPackageCorrections(id, controller.signal)));
      setRows(results.flatMap(result => (result.status === 'fulfilled' ? result.value : [])));
      const failed = results.filter(result => result.status === 'rejected').length;
      return failed ? `${failed} paket gagal dimuat; daftar mungkin belum lengkap.` : '';
    })()
      .then(message => { if (!controller.signal.aborted) setStatus({ loading: false, message }); })
      .catch(error => { if (!controller.signal.aborted) setStatus({ loading: false, message: mapCorrectionRpcError(error) }); });
    return () => controller.abort();
  }, [state.status, packageIds]);

  const packages = useMemo(() => attachServerCorrections(state.packages, rows), [state.packages, rows]);
  const busy = state.status === 'loading' || status.loading;
  return (
    <>
      <div className="ds-view-toggle" role="status">
        <span>
          {state.status === 'error' ? `Gagal memuat paket: ${state.message}`
            : busy ? 'Memuat kasus koreksi dari server…'
              : status.message || `${rows.length} kasus koreksi dari server.`}
        </span>
        <button type="button" className="btn sm" onClick={reload} disabled={busy}>Muat ulang</button>
        {props.authenticatedRole === 'Penyedia Jasa / Ketua Tim' && Object.keys(state.packages).length > 0 && (
          <select aria-label="Buka kasus baru pada paket" className="btn sm" value="" data-testid="correction-create-package"
            onChange={event => { if (event.target.value) window.location.assign(`/actions?paket=${encodeURIComponent(event.target.value)}&submodule=${encodeURIComponent('/actions:Koreksi berbukti')}`); }}>
            <option value="">Buka kasus baru…</option>
            {Object.values(state.packages).map(pkg => <option key={pkg.project.id} value={pkg.project.id}>{pkg.project.packageName}</option>)}
          </select>
        )}
      </div>
      <CorrectionDashboard {...props} packages={packages} />
    </>
  );
}
