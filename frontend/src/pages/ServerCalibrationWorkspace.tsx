import { useEffect, useState } from 'react';
import { FileCheck2, RefreshCw, Users, Wrench } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import {
  calibrationSummary,
  canManageCalibration,
  serverRows,
  type ServerCalibration,
  type ServerSurveyTeam,
} from './serverCalibration';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Data Tahap 1 belum dapat dimuat.';
}

function displayDate(value: string | null) {
  if (!value) return 'Belum ditetapkan';
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}

export function ServerCalibrationWorkspace({
  packageId,
  role,
  preparationStatus,
}: {
  packageId: string;
  role: WorkflowRole;
  preparationStatus?: string | null;
}) {
  const [teams, setTeams] = useState<ServerSurveyTeam[]>([]);
  const [calibrations, setCalibrations] = useState<ServerCalibration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim`, { signal: controller.signal }),
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/kalibrasi-alat`, { signal: controller.signal }),
    ])
      .then(([teamResult, calibrationResult]) => {
        if (controller.signal.aborted) return;
        setTeams(serverRows<ServerSurveyTeam>(teamResult.data, 'tim survei'));
        setCalibrations(serverRows<ServerCalibration>(calibrationResult.data, 'kalibrasi alat'));
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [packageId, revision]);

  const summary = calibrationSummary(teams, calibrations);
  const manageable = canManageCalibration(role, preparationStatus);

  return <div className="wf" data-testid="server-calibration-workspace">
    <div className="wf-title">
      <h2>Kalibrasi & Validasi Awal</h2>
      <p>Tim survei, alat, rekod kalibrasi, dan sijil yang tersimpan pada server.</p>
    </div>

    <div className={`wf-callout ${preparationStatus !== 'DISETUJUI' ? 'danger' : ''}`}>
      <strong>Status persiapan: {preparationStatus || 'Sedang dimuat'}</strong>
      <div>{preparationStatus === 'DISETUJUI'
        ? manageable
          ? 'Persiapan sudah disetujui. Penyedia Jasa boleh meneruskan pengisian Tahap 1.'
          : 'Persiapan sudah disetujui. Paparan ini tersedia dalam mode baca untuk peran semasa.'
        : 'Pengurusan Tahap 1 hanya dibuka selepas persiapan disetujui. Data sedia ada masih boleh dibaca jika backend mengizinkan.'}</div>
    </div>

    {loading && <p role="status">Memuat data kalibrasi dari server…</p>}
    {error && <div role="alert" className="wf-callout danger">
      <p>{error}</p>
      <button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={13} /> Coba lagi</button>
    </div>}

    {!loading && !error && <>
      <div className="wf-kpis">
        {[
          ['Tim survei', String(summary.teams)],
          ['Rekod kalibrasi', String(summary.calibrations)],
          ['Sijil tersedia', String(summary.certificates)],
          ['Masih DRAFT', String(summary.drafts)],
        ].map(([label, value]) => <div className="wf-kpi" key={label}>
          <div className="wf-kpi-label">{label}</div>
          <div className="wf-kpi-value">{value}</div>
        </div>)}
      </div>

      <section className="wf-panel">
        <div className="wf-panel-head">
          <h3><Users size={14} /> Tim survei</h3>
          <span>{teams.length} rekod server</span>
        </div>
        <div className="wf-body">
          {!teams.length ? <p>Belum ada tim survei yang didaftarkan untuk paket ini.</p> : <div className="package-flow-list">
            {teams.map(team => <div className="package-flow-row" key={team.tim_id}>
              <div className="package-flow-icon"><Users size={15} /></div>
              <div className="package-flow-copy">
                <small>Tim #{team.tim_id}</small>
                <strong>{team.nama_tim}</strong>
                <span>{team.jenis_survei ? `${team.jenis_survei.kode} · ${team.jenis_survei.nama}` : `Jenis survei #${team.jenis_survei_id}`}</span>
              </div>
              <div className="package-flow-status">Tersimpan</div>
            </div>)}
          </div>}
        </div>
      </section>

      <section className="wf-panel">
        <div className="wf-panel-head">
          <h3><Wrench size={14} /> Rekod kalibrasi alat</h3>
          <button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={13} /> Muat ulang</button>
        </div>
        <div className="wf-body">
          {!calibrations.length ? <p>Belum ada rekod kalibrasi alat untuk paket ini.</p> : <div className="package-flow-list">
            {calibrations.map(item => <div className="package-flow-row" key={item.kalibrasi_id}>
              <div className="package-flow-icon"><Wrench size={15} /></div>
              <div className="package-flow-copy">
                <small>Kalibrasi #{item.kalibrasi_id} · Alat #{item.alat_id} · Versi {item.versi}</small>
                <strong>{item.komponen}</strong>
                <span>{item.jenis} · {item.standar} · {item.pelaksana}</span>
                <span>Kalibrasi {displayDate(item.tgl_kalibrasi)} · Berlaku hingga {displayDate(item.berlaku_sd)}</span>
              </div>
              <div className="package-flow-status">
                {item.dokumen_id !== null ? <><FileCheck2 size={13} /> Sijil #{item.dokumen_id}</> : item.status}
              </div>
            </div>)}
          </div>}
        </div>
      </section>

      {manageable && <div className="wf-callout">
        <strong>Sambungan baca server sudah aktif</strong>
        <div>Borang pendaftaran tim, alat, personel dan kalibrasi akan disambungkan pada langkah berikutnya selepas paparan data ini disahkan.</div>
      </div>}
    </>}
  </div>;
}
