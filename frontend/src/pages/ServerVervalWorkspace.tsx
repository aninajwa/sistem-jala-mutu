import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiRequest } from '../auth/client';
import { displayVervalValue, getVervalConsistency, getVervalCycle, getVervalCycles, type ConsistencyCheck, type VervalCycle } from './serverVervalData';

function attributes(record: Record<string, unknown>) {
  return Object.entries(record).map(([key, value]) => <div className="package-context-grid" key={key}>
    <small>{key.replaceAll('_', ' ')}</small><strong>{displayVervalValue(key, value)}</strong>
  </div>);
}

export function ServerVervalWorkspace({ packageId }: { packageId: string }) {
  const [cycles, setCycles] = useState<VervalCycle[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [listRevision, setListRevision] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cycle, setCycle] = useState<VervalCycle | null>(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleError, setCycleError] = useState('');
  const [consistency, setConsistency] = useState<ConsistencyCheck[]>([]);
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [consistencyError, setConsistencyError] = useState('');
  const [detailRevision, setDetailRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setListLoading(true);
    setListError('');
    getVervalCycles(packageId, apiRequest, controller.signal).then(rows => {
      if (controller.signal.aborted) return;
      setCycles(rows);
      setSelectedId(current => current !== null && rows.some(row => row.siklus_id === current) ? current : null);
    }).catch(error => {
      if (!controller.signal.aborted) setListError(error instanceof Error ? error.message : 'Gagal memuat siklus Verval.');
    }).finally(() => {
      if (!controller.signal.aborted) setListLoading(false);
    });
    return () => controller.abort();
  }, [packageId, listRevision]);

  useEffect(() => {
    if (selectedId === null) {
      setCycle(null);
      setCycleError('');
      setCycleLoading(false);
      setConsistency([]);
      setConsistencyError('');
      setConsistencyLoading(false);
      return;
    }
    const controller = new AbortController();
    setCycleLoading(true);
    setCycleError('');
    setCycle(null);
    getVervalCycle(packageId, selectedId, apiRequest, controller.signal).then(value => {
      if (!controller.signal.aborted) setCycle(value);
    }).catch(error => {
      if (!controller.signal.aborted) setCycleError(error instanceof Error ? error.message : 'Gagal memuat detail siklus.');
    }).finally(() => {
      if (!controller.signal.aborted) setCycleLoading(false);
    });

    setConsistencyLoading(true);
    setConsistencyError('');
    setConsistency([]);
    getVervalConsistency(packageId, selectedId, apiRequest, controller.signal).then(rows => {
      if (!controller.signal.aborted) setConsistency(rows);
    }).catch(error => {
      if (!controller.signal.aborted) setConsistencyError(error instanceof Error ? error.message : 'Gagal memuat uji konsistensi.');
    }).finally(() => {
      if (!controller.signal.aborted) setConsistencyLoading(false);
    });
    return () => controller.abort();
  }, [packageId, selectedId, detailRevision]);

  return <div data-testid="server-stage3b-workspace" aria-label={`Verval berkala paket ${packageId}`}>
    <section className="wf-panel" aria-labelledby="server-verval-list-title">
      <div className="wf-panel-head"><h3 id="server-verval-list-title">Siklus Verval · Paket #{packageId}</h3>
        <button type="button" className="wf-button" disabled={listLoading} onClick={() => setListRevision(value => value + 1)}><RefreshCw size={13} /> {listLoading ? 'Memuat…' : 'Muat semula siklus'}</button>
      </div>
      <div className="wf-body">
        {listLoading && <p role="status">Memuat daftar siklus Verval…</p>}
        {!listLoading && listError && <div role="alert" className="wf-callout danger">{listError}<button type="button" className="wf-button" onClick={() => setListRevision(value => value + 1)}>Coba lagi</button></div>}
        {!listLoading && !listError && cycles.length === 0 && <p className="wf-note">Belum ada siklus Verval untuk paket ini.</p>}
        {!listLoading && !listError && cycles.length > 0 && <div className="wf-table-wrap"><table className="wf-table">
          <thead><tr><th>Siklus</th><th>Periode</th><th>Status</th><th>Maklumat</th></tr></thead>
          <tbody>{cycles.map(item => <tr key={item.siklus_id}>
            <td><button type="button" className="wf-button" aria-pressed={selectedId === item.siklus_id} onClick={() => setSelectedId(item.siklus_id)}>Pilih siklus #{item.siklus_id}{item.siklus_ke == null ? '' : ` · Ke-${item.siklus_ke}`}</button></td>
            <td>{displayVervalValue('periode_mulai', item.periode_mulai)} – {displayVervalValue('periode_selesai', item.periode_selesai)}</td>
            <td>{displayVervalValue('status', item.status)}</td>
            <td>{Object.keys(item).length} atribut dari API</td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </section>

    {selectedId !== null && <>
      <section className="wf-panel" aria-labelledby="server-verval-detail-title">
        <div className="wf-panel-head"><h3 id="server-verval-detail-title">Detail siklus #{selectedId}</h3>
          <button type="button" className="wf-button" disabled={cycleLoading || consistencyLoading} onClick={() => setDetailRevision(value => value + 1)}><RefreshCw size={13} /> {cycleLoading || consistencyLoading ? 'Memuat…' : 'Muat semula detail & konsistensi'}</button>
        </div>
        <div className="wf-body">
          {cycleLoading && <p role="status">Memuat detail siklus…</p>}
          {!cycleLoading && cycleError && <div role="alert" className="wf-callout danger">{cycleError}<button type="button" className="wf-button" onClick={() => setDetailRevision(value => value + 1)}>Coba lagi</button></div>}
          {!cycleLoading && cycle && <div className="package-context-grid" data-testid="verval-cycle-attributes">{attributes(cycle as Record<string, unknown>)}</div>}
        </div>
      </section>

      <section className="wf-panel" aria-labelledby="server-verval-consistency-title">
        <div className="wf-panel-head"><h3 id="server-verval-consistency-title">Uji konsistensi · Siklus #{selectedId}</h3></div>
        <div className="wf-body">
          {consistencyLoading && <p role="status">Memuat uji konsistensi…</p>}
          {!consistencyLoading && consistencyError && <div role="alert" className="wf-callout danger">{consistencyError}<button type="button" className="wf-button" onClick={() => setDetailRevision(value => value + 1)}>Coba lagi</button></div>}
          {!consistencyLoading && !consistencyError && consistency.length === 0 && <p className="wf-note">Belum ada rekod uji konsistensi yang dipulangkan untuk siklus ini.</p>}
          {!consistencyLoading && !consistencyError && consistency.map(row => <article className="wf-panel" key={row.konsistensi_id}>
            <div className="wf-panel-head"><h4>Konsistensi #{row.konsistensi_id}</h4></div>
            <div className="wf-body"><div className="package-context-grid">{attributes(row as Record<string, unknown>)}</div></div>
          </article>)}
        </div>
      </section>
    </>}
  </div>;
}
