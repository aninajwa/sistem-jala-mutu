import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import type { OperationalWorkflowState, DailySurveyRecord } from '../model';
import { dailyChecks, dailyFields } from '../surveyStandards';

type Props = { state: OperationalWorkflowState; onEdit?: (record: DailySurveyRecord) => void };

export function Stage3DailyRecordsTable({ state, onEdit }: Props) {
  const [survey, setSurvey] = useState('');
  const [date, setDate] = useState('');
  const [road, setRoad] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const isAdmin = state.role === 'Admin';
  const isProvider = state.role === 'Penyedia Jasa / Ketua Tim';
  const isDirectorate = state.role === 'Direktorat / Pusat';
  const scoped = state.dailyRecords.filter(record =>
    state.project.surveyTypes.includes(record.surveyType) && state.project.routes.includes(record.road),
  );
  const records = scoped.filter(record =>
    (!survey || record.surveyType === survey) && (!date || record.date === date) && (!road || record.road === road),
  ).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  const byType = state.project.surveyTypes.map(type => ({ type, count: records.filter(record => record.surveyType === type).length })).filter(item => item.count);
  return (
    <section className="wf-panel stage3a-records" aria-label="Daftar kegiatan harian">
      <div className="wf-panel-head">
        <h3><ClipboardList size={16} aria-hidden="true" /> {isAdmin ? 'Status rekaman harian' : isDirectorate ? 'Kegiatan per survei' : isProvider ? 'Riwayat kegiatan' : 'Data kegiatan yang tercatat'}</h3>
        <span className="wf-note">{records.length} kegiatan</span>
      </div>
      <div className="wf-body">
        <div className="stage3a-filters">
          <label>Tanggal <input aria-label="Filter tanggal kegiatan" type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <label>Jenis survei <select aria-label="Filter jenis survei" value={survey} onChange={e => setSurvey(e.target.value)}>
            <option value="">Semua</option>{state.project.surveyTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select></label>
          <label>Ruas <select aria-label="Filter ruas" value={road} onChange={e => setRoad(e.target.value)}>
            <option value="">Semua</option>{state.project.routes.map(item => <option key={item} value={item}>{item}</option>)}
          </select></label>
          {(date || survey || road) && <button type="button" className="wf-button" onClick={() => { setDate(''); setSurvey(''); setRoad(''); }}>Hapus filter</button>}
        </div>
        {isDirectorate && byType.length > 0 && <div className="stage3a-type-summary">{byType.map(item => <span key={item.type}><strong>{item.count}</strong> {item.type}</span>)}</div>}
        {!records.length ? <div className="wf-empty">{scoped.length ? 'Tidak ada kegiatan yang cocok dengan filter.' : 'Belum ada kegiatan yang tercatat pada paket ini.'}</div>
          : <div className="stage3a-record-list" data-testid="table-daily-records">
            {records.map(record => {
              const checks = dailyChecks(record);
              const completed = checks.filter(key => record.dailyToolCheck?.[key]).length;
              const selected = expanded === record.id;
              return <article className="stage3a-record" key={record.id} data-testid={`row-daily-${record.id}`}>
                <div className="stage3a-record-main">
                  <div className="stage3a-record-date"><strong>{record.date}</strong><span>{record.time}</span></div>
                  <div className="stage3a-record-subject"><strong>{record.surveyType} · {record.road}</strong><span>{record.id}{!isAdmin ? ` · ${record.lane} · ${record.direction}` : ''}</span></div>
                  <span className={`stage3a-state ${record.state === 'Tercatat' ? 'good' : 'attention'}`}>{record.state === 'Tercatat' && completed < checks.length ? 'Tersimpan · cek harian belum lengkap' : record.state}</span>
                  <button type="button" className="wf-button" aria-expanded={selected} aria-controls={`stage3a-detail-${record.id}`}
                    onClick={() => setExpanded(selected ? null : record.id)}>{selected ? 'Tutup' : 'Lihat detail'}</button>
                  {onEdit && <button type="button" className="wf-button" onClick={() => onEdit(record)}>Perbarui</button>}
                </div>
                {selected && <div className="stage3a-record-detail" id={`stage3a-detail-${record.id}`}>
                  <div><strong>Pelaksanaan</strong><dl>
                    <dt>Ruas</dt><dd>{record.road}</dd><dt>Alat</dt><dd>{record.tool || '—'}</dd>
                    <dt>Panjang</dt><dd>{record.lengthKm} km</dd>
                    {!isAdmin && <><dt>Operator</dt><dd>{record.operator || '—'}</dd><dt>Cuaca</dt><dd>{record.weather}</dd></>}
                  </dl></div>
                  {!isAdmin && <div><strong>Pemeriksaan harian</strong><p>{completed} dari {checks.length} butir diperiksa{completed < checks.length ? ' · perlu dilengkapi' : ''}</p>
                    <ul>{checks.map(key => <li key={key}>{record.dailyToolCheck?.[key] ? '✓' : '–'} {key}</li>)}</ul>
                  </div>}
                  {!isAdmin && <div><strong>Hasil & catatan</strong>
                    <p>{record.rawValue || 'Hasil belum tersedia'}</p>
                    {record.disturbances && <p>Gangguan: {record.disturbances}</p>}
                    {record.eventNotes && <p>Catatan: {record.eventNotes}</p>}
                    <details><summary>Data teknis {record.surveyType}</summary><dl>{dailyFields(record).map(field => <span className="stage3a-datum" key={field.key}><dt>{field.label.replace(' (simulasi)', '')}</dt><dd>{record.technicalData?.[field.key] || '—'}</dd></span>)}</dl></details>
                  </div>}
                </div>}
              </article>;
            })}
          </div>}
      </div>
    </section>
  );
}
export default Stage3DailyRecordsTable;
