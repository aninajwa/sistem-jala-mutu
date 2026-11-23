import { useEffect, useMemo, useState } from 'react';
import type { WorkflowRole } from '../../workflow/model';
import { loadServerPackages, type ServerDashboardPackage } from '../serverDashboard';
import { getCorrectionCapabilities, getCorrectionDetail, listPackageCorrections, mapCorrectionRpcError, reviewCorrectionAndReadBack, submitCorrectionAction, submitCorrectionAndReadBack, type CorrectionCapabilities, type ServerCorrectionCase } from './serverCorrectionData';

export function ServerCorrectionDashboard({ role }: { role: WorkflowRole }) {
  const [packages, setPackages] = useState<ServerDashboardPackage[]>([]);
  const [rows, setRows] = useState<ServerCorrectionCase[]>([]);
  const [capability, setCapability] = useState<CorrectionCapabilities | null>(null);
  const [selected, setSelected] = useState<ServerCorrectionCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setCapability(null); setSelected(null);
    loadServerPackages(controller.signal, role).then(async available => {
      if (controller.signal.aborted) return;
      setPackages(available);
      const caps = await Promise.all(available.map(pkg => getCorrectionCapabilities(pkg.id, controller.signal)));
      const enabled = caps.length > 0 && caps.every(item => item.read && item.write);
      setCapability(enabled ? { read: true, write: true, reason: null } : caps.find(item => !item.read || !item.write) ?? { read: false, write: false, reason: 'Belum ada paket yang dapat diakses.' });
      if (!enabled) { setRows([]); return; }
      const results = await Promise.allSettled(available.map(pkg => listPackageCorrections(pkg.id, controller.signal)));
      const failed = results.find(result => result.status === 'rejected');
      if (failed?.status === 'rejected') throw failed.reason;
      setRows(results.flatMap(result => result.status === 'fulfilled' ? result.value : []));
    }).catch(reason => { if (!controller.signal.aborted) setError(mapCorrectionRpcError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [role]);

  const visible = useMemo(() => rows.filter(row => `${row.correctionId} ${row.description} ${row.road} ${row.source} ${row.status}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  async function open(row: ServerCorrectionCase) {
    setSelected(null); setError('');
    try { setSelected(await getCorrectionDetail(row.packageId, row.correctionId)); }
    catch (reason) { setError(mapCorrectionRpcError(reason)); }
  }
  async function refreshSelection(next: ServerCorrectionCase) {
    setSelected(next);
    setRows(current => current.map(row => row.correctionId === next.correctionId && row.packageId === next.packageId ? next : row));
  }
  async function updateAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || selected.version === null) return;
    setBusy(true); setError('');
    try { await submitCorrectionAction(selected.packageId, selected.correctionId, selected.version, { ...(actionType ? { action_type: actionType } : {}), evidence }); await refreshSelection(await getCorrectionDetail(selected.packageId, selected.correctionId)); }
    catch (reason) { setError(mapCorrectionRpcError(reason)); } finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || selected.version === null) return;
    setBusy(true); setError('');
    try { await refreshSelection(await submitCorrectionAndReadBack(selected.packageId, selected.correctionId, selected.version)); }
    catch (reason) { setError(mapCorrectionRpcError(reason)); } finally { setBusy(false); }
  }
  async function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || selected.version === null) return;
    const form = new FormData(event.currentTarget); const decision = form.get('decision');
    if (decision !== 'Disetujui' && decision !== 'Perlu Revisi') return;
    setBusy(true); setError('');
    try { await refreshSelection(await reviewCorrectionAndReadBack(selected.packageId, selected.correctionId, selected.version, decision, reviewNote)); }
    catch (reason) { setError(mapCorrectionRpcError(reason)); } finally { setBusy(false); }
  }

  return <div className="corr-dashboard" data-testid="server-correction-dashboard">
    <header className="corr-heading"><div><h2>Koreksi berbukti</h2><p>Workflow Correction terautentikasi · data berasal dari kontrak server, bukan demo lokal.</p></div><div className="corr-role"><span><small>Peran aktif</small><strong>{role}</strong></span></div></header>
    {capability && (!capability.read || !capability.write) && <div className="corr-panel" role="status" data-testid="correction-disabled"><strong>Workflow server dinonaktifkan</strong><p>{capability.reason ?? 'RPC Correction belum tersedia.'} Daftar, detail, pengajuan bukti, dan review belum dapat disimpan atau dibaca dari database ini.</p><p>Gunakan workflow demo hanya di mode demo; jangan masukkan bukti resmi di sini.</p></div>}
    {loading && <p role="status">Memeriksa kapabilitas dan memuat Correction server…</p>}
    {error && <div className="corr-panel" role="alert"><strong>Correction tidak dapat dimuat</strong><p>{error}</p><button type="button" className="corr-preview-button" onClick={() => window.location.reload()}>Muat ulang</button></div>}
    {capability?.read && <div className="corr-main-grid">
      <section className="corr-panel corr-list"><div className="corr-list-header"><h3>Kasus koreksi ({visible.length})</h3><input aria-label="Cari koreksi" placeholder="Cari kasus atau ruas" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <div className="corr-table-scroll"><table><thead><tr><th>ID</th><th>Paket / ruas</th><th>Temuan</th><th>Prioritas</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {visible.map(row => <tr key={`${row.packageId}:${row.correctionId}`}><td>#{row.correctionId}</td><td>{packages.find(pkg => pkg.id === row.packageId)?.name ?? `Paket #${row.packageId}`}<small>{row.road}</small></td><td>{row.description || row.source}</td><td>{row.severity}</td><td>{row.status}</td><td><button type="button" className="corr-preview-button" onClick={() => void open(row)}>Buka detail</button></td></tr>)}
        </tbody></table>{!visible.length && <p className="corr-table-empty">Belum ada kasus Correction tersimpan dalam cakupan akun.</p>}</div>
      </section>
      <section className="corr-panel" aria-label="Detail dan tindakan koreksi"><h3>Detail kasus</h3>{selected ? <><p>#{selected.correctionId} · {selected.status}</p><dl>{Object.entries(selected.data).filter(([,value]) => value === null || ['string','number','boolean'].includes(typeof value)).map(([key,value]) => <div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{String(value ?? 'Belum tercatat')}</dd></div>)}</dl><form onSubmit={updateAction}><fieldset disabled={!capability.write || role !== 'Penyedia Jasa / Ketua Tim' || busy || selected.version === null}><legend>Tindakan koreksi dan bukti</legend><label>Jenis tindakan<input value={actionType} onChange={event => setActionType(event.target.value)} placeholder="Isi tindakan yang sesuai kasus" /></label><label>Referensi bukti<textarea value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Masukkan referensi bukti yang benar-benar tersedia" /></label><button type="submit" disabled={!capability.write || role !== 'Penyedia Jasa / Ketua Tim' || busy || selected.version === null}>Simpan tindakan/bukti</button></fieldset></form><form onSubmit={submit}><button type="submit" disabled={!capability.write || role !== 'Penyedia Jasa / Ketua Tim' || busy || selected.version === null}>Ajukan untuk review</button></form><form onSubmit={review}><fieldset disabled={!capability.write || role !== 'PIC Balai / Pengguna Jasa' || busy || selected.version === null}><legend>Review verifier</legend><label>Keputusan<select name="decision"><option value="Disetujui">Disetujui</option><option value="Perlu Revisi">Perlu Revisi</option></select></label><label>Catatan review<textarea value={reviewNote} onChange={event => setReviewNote(event.target.value)} /></label><button type="submit">Simpan keputusan review</button></fieldset></form><p role="status">Keputusan yang tampil di detail hanya keputusan persisted yang dikembalikan server.</p></> : <p>Pilih satu kasus untuk membaca detail. Formulir menulis dan review nonaktif sampai RPC production tersedia.</p>}</section>
    </div>}
    {capability?.write && <p className="corr-footnote">Route tulis tersedia setelah operator mengaktifkan kontrak yang telah disetujui di QA.</p>}
  </div>;
}
