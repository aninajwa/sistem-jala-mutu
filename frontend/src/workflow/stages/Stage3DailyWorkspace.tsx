import { useState } from 'react';
import { Archive, ClipboardCheck, FileText, MapPinned, Plus, Save } from 'lucide-react';
import { DocumentAttachments } from '../DocumentAttachments';
import { usePersistedDraft } from '../../hooks/usePersistedDraft';
import { recordDailyChange } from '../workflowRevisions';
import { BackupSnapshot, DailySurveyRecord, daysBetween, evaluateProductionTest, SurveyType } from '../model';
import { dailyChecks, dailyFields, evaluateDailySurvey } from '../surveyStandards';
import { VALIDATION_SOURCE_OPTIONS, STAGE3_SOURCE_MODE_PRESENTATION } from '../workflowConfig';
import { Stage3DailyRecordsTable } from './Stage3DailyRecordsTable';
import type { WorkflowStageProps } from './stageSupport';
import { Badge, Button, CheckRow, dailyEquipment, defaultDaily, Field, idNow, Select, testId } from './stageSupport';
import { useWorkflowStage } from './useWorkflowStage';
import './stage3a-redesign.css';

type Section = 'identitas' | 'hasil' | 'pemeriksaan';
const SECTIONS: { key: Section; title: string }[] = [
  { key: 'identitas', title: 'Kegiatan & lokasi' },
  { key: 'hasil', title: 'Data survei' },
  { key: 'pemeriksaan', title: 'Pemeriksaan & bukti' },
];
const BACKUP_MEDIA = ['Perangkat kerja', 'Media eksternal', 'Penyimpanan jaringan'];
// A new entry must not inherit sample staff identities from demo fixtures.
const emptyDaily = (date: string, road: string, survey: SurveyType) => ({
  ...defaultDaily(date, road, survey), operator: '', driver: '',
});

export function Stage3DailyWorkspace(props: WorkflowStageProps) {
  const { state, setNotice } = props;
  const { commit } = useWorkflowStage(props);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('identitas');
  const [daily, setDaily] = usePersistedDraft(`jala-ui-draft:${state.project.id}:${state.role}:daily`, () =>
    emptyDaily(state.simulationDate, state.project.routes[0] || '', state.project.surveyTypes[0] || 'IRI'),
  );
  const [dailyTool, setDailyTool] = usePersistedDraft<Record<string, boolean>>(`jala-ui-draft:${state.project.id}:${state.role}:dailyTool`, {});
  const [dailySource, setDailySource] = useState<(typeof VALIDATION_SOURCE_OPTIONS)[number]>('Pencatatan manual');
  const [backupMedia, setBackupMedia] = useState<string[]>(['Perangkat kerja']);
  const canWrite = state.role === 'Penyedia Jasa / Ketua Tim';
  const sourceReadOnly = STAGE3_SOURCE_MODE_PRESENTATION[dailySource].sourceReadOnly;

  // Existing stage guards and validation remain authoritative; UI state never grants approval.
  const preparationReady = state.project.preparation.reportApproval === 'Disetujui';
  const calibrationReady = state.calibrations.length > 0 && state.calibrations.every(c =>
    daysBetween(state.simulationDate, c.dueDate) >= 0 && c.qualificationValid && c.trainingVerified && c.condition === 'Baik',
  ) && state.project.surveyTypes.length > 0 && state.project.surveyTypes.every(type => state.calibrationChecklist[type]);
  const methodApproved = state.productionApproval === 'Disetujui' && state.project.surveyTypes.every(type =>
    evaluateProductionTest(type, state.productionTests[type]).passed,
  );
  const bridgeReady = daily.surveyType !== 'Jembatan' || state.bridgeInspectionPermit;
  const stageReady = preparationReady && calibrationReady && methodApproved && bridgeReady;
  const checks = dailyChecks(daily);
  const technicalErrors = sourceReadOnly ? [] : evaluateDailySurvey({ ...daily, dailyToolCheck: dailyTool }, state.dailyRecords.filter(r => r.id !== editingId));
  const essentialComplete = !!daily.road && !!daily.operator.trim() && !!daily.rawValue.trim() && !!daily.date && !!daily.time && !!daily.lane.trim() && daily.date <= state.simulationDate && Number.isFinite(daily.lengthKm) && daily.lengthKm >= 0;
  const canSave = canWrite && stageReady && !sourceReadOnly && essentialComplete && (technicalErrors.length === 0 || (daily.state === 'Survei Ulang' && !!daily.eventNotes.trim()));
  const scopedRecords = state.dailyRecords.filter(r => state.project.routes.includes(r.road) && state.project.surveyTypes.includes(r.surveyType));
  const recorded = scopedRecords.filter(r => r.state === 'Tercatat').length;
  const held = scopedRecords.filter(r => r.state === 'Ditahan').length;
  const resurvey = scopedRecords.filter(r => r.state === 'Survei Ulang').length;

  const setValue = <K extends keyof Omit<DailySurveyRecord, 'id'>>(key: K, value: Omit<DailySurveyRecord, 'id'>[K]) => {
    setDaily(d => ({ ...d, [key]: value }));
  };
  const changeSurvey = (type: SurveyType) => {
    setDaily(d => ({ ...d, surveyType: type, tool: dailyEquipment[type][0], technicalData: {}, surfaceDry: true, glareFree: true, speedAndLaneCompliant: true }));
    setDailyTool({});
  };
  const changeTechnical = (key: string, value: string) => {
    setDaily(d => ({
      ...d,
      technicalData: { ...d.technicalData, [key]: value },
      ...(key === 'method' ? { tool: value === 'LWD' ? 'LWD' : 'FWD Dynatest' } : {}),
      ...(key === 'iriClass' ? { tool: value === 'Kelas 3' ? 'IRI Tipe Respon' : 'Profilometer Laser' } : {}),
    }));
    if (key === 'method' || key === 'iriClass' || key === 'pciMethod') setDailyTool({});
  };
  const editRecord = (record: DailySurveyRecord) => {
    const { id, ...draft } = record;
    setEditingId(id);
    setDaily(draft);
    setDailyTool({ ...record.dailyToolCheck });
    setDailySource('Pencatatan manual');
    setSection('identitas');
    setOpen(true);
  };
  const saveRecord = () => {
    if (!canWrite || sourceReadOnly) return;
    if (!essentialComplete) { setNotice('Lengkapi tanggal, waktu, ruas, lajur, operator, hasil, dan panjang kegiatan.', 'error'); return; }
    if (!state.project.routes.includes(daily.road) || !state.project.surveyTypes.includes(daily.surveyType)) {
      setNotice('Ruas dan jenis survei harus sesuai paket.', 'error'); return;
    }
    if (!daily.date || daily.date > state.simulationDate || !Number.isFinite(daily.lengthKm) || daily.lengthKm < 0) {
      setNotice('Periksa tanggal dan panjang kegiatan.', 'error'); return;
    }
    if (daily.surveyType === 'Lereng' && !daily.slopeFailureType?.trim()) {
      setNotice('Lengkapi jenis keruntuhan lereng.', 'error'); return;
    }
    if (!stageReady) { setNotice('Prasyarat Tahap 0–2 atau izin jembatan belum terpenuhi.', 'error'); return; }
    if (daily.state === 'Survei Ulang' && !daily.eventNotes.trim()) { setNotice('Isi alasan survei ulang.', 'error'); return; }
    if (daily.state !== 'Survei Ulang' && technicalErrors.length) {
      setNotice(technicalErrors[0], 'error'); return;
    }
    const record: DailySurveyRecord = {
      ...daily, id: editingId || idNow('HARIAN'), dailyToolCheck: { ...dailyTool }, cleanedValue: daily.rawValue, cleaningReason: '',
    };
    commit('Catat survei harian', record.id, s => recordDailyChange(s, record), 'Kegiatan harian tersimpan.');
    setDaily(emptyDaily(state.simulationDate, state.project.routes[0] || '', state.project.surveyTypes[0] || 'IRI'));
    setDailyTool({});
    setOpen(false);
    setEditingId(null);
    setSection('identitas');
  };
  const makeBackup = () => {
    if (!canWrite || !scopedRecords.length) return;
    if (backupMedia.length < 2) { setNotice('Pilih minimal dua media penyimpanan.', 'error'); return; }
    const backup: BackupSnapshot = {
      id: idNow('BKP'), createdAt: `${state.simulationDate} ${daily.time || '08:00'}`,
      media: backupMedia, includesRaw: true, includesProcessed: true, note: 'Catatan pengamanan data rekaman lapangan',
    };
    commit('Catat pengamanan data', backup.id, s => ({ ...s, backups: [backup, ...s.backups] }), 'Catatan pengamanan tersimpan.');
  };
  const readyLabels = [
    { label: 'Persiapan', good: preparationReady },
    { label: 'Kalibrasi', good: calibrationReady },
    { label: 'Uji produksi', good: methodApproved },
    ...(daily.surveyType === 'Jembatan' ? [{ label: 'Izin jembatan', good: bridgeReady }] : []),
  ];
  const roleHeading = state.role === 'PIC Balai / Pengguna Jasa' ? 'Pantauan pelaksanaan survei'
    : state.role === 'Direktorat / Pusat' ? 'Pemantauan survei harian'
    : state.role === 'Admin' ? 'Status pencatatan survei' : 'Survei harian';

  return (
    <div className="stage3a-redesign">
      <header className="stage3a-title"><span>Tahap 3A · pelaksanaan harian</span><h1>{roleHeading}</h1></header>
      <div className="stage3a-head">
        <div className="stage3a-stats" aria-label="Ringkasan rekaman">
          <span><strong>{recorded}</strong> tercatat</span>
          <span><strong>{held}</strong> tertahan</span>
          <span><strong>{resurvey}</strong> survei ulang</span>
        </div>
        {canWrite && <button type="button" className="wf-button primary" onClick={() => { setOpen(value => !value); setEditingId(null); setSection('identitas'); }}>
          <Plus size={16} aria-hidden="true" /> {open ? 'Tutup formulir' : 'Catat kegiatan'}
        </button>}
      </div>

      {canWrite && open && <section className="stage3a-entry" aria-label="Formulir kegiatan harian">
        <div className="stage3a-entry-head">
          <div><h3>{editingId ? 'Perbarui kegiatan' : 'Catat kegiatan'}</h3><p>Isian sementara tersimpan di perangkat ini.</p></div>
          <Badge tone={stageReady ? 'good' : 'warn'}>{stageReady ? 'Prasyarat siap' : 'Prasyarat belum lengkap'}</Badge>
        </div>
        <nav className="stage3a-steps" aria-label="Bagian formulir">
          {SECTIONS.map((item, index) => <button key={item.key} type="button" className={section === item.key ? 'active' : ''}
            aria-current={section === item.key ? 'step' : undefined} onClick={() => setSection(item.key)}>
            <span>{index + 1}</span>{item.title}
          </button>)}
        </nav>
        {!stageReady && <details className="stage3a-prerequisites">
          <summary>Periksa prasyarat pencatatan</summary>
          <div className="stage3a-prereq-items">
            {readyLabels.map(item => <span key={item.label}><Badge tone={item.good ? 'good' : 'warn'}>{item.good ? 'Siap' : 'Belum'}</Badge> {item.label}</span>)}
          </div>
        </details>}

        {section === 'identitas' && <div className="stage3a-section">
          <h4><MapPinned size={17} aria-hidden="true" /> Kegiatan dan lokasi</h4>
          <div className="stage3a-fields">
            <Field label="Tanggal kegiatan"><input type="date" data-testid="input-daily-date" max={state.simulationDate} value={daily.date} onChange={e => setValue('date', e.target.value)} /></Field>
            <Field label="Waktu"><input type="time" data-testid="input-daily-time" value={daily.time} onChange={e => setValue('time', e.target.value)} /></Field>
            <Field label="Jenis survei"><Select id="select-daily-survey" value={daily.surveyType} options={[...state.project.surveyTypes]} onChange={v => changeSurvey(v as SurveyType)} /></Field>
            <Field label="Ruas"><Select id="select-daily-road" value={daily.road} options={[...state.project.routes]} onChange={v => setValue('road', v)} /></Field>
            <Field label="Panjang kegiatan (km)"><input type="number" step="any" min="0" data-testid="input-daily-length" value={daily.lengthKm} onChange={e => setValue('lengthKm', Number(e.target.value))} /></Field>
            {daily.surveyType === 'Lalu Lintas' && <Field label="Durasi pengamatan (menit)"><input type="number" min="0" data-testid="input-daily-traffic-duration" value={daily.trafficDurationMinutes} onChange={e => setValue('trafficDurationMinutes', Number(e.target.value))} /></Field>}
            <Field label="Lajur / posisi"><input data-testid="input-daily-lane" value={daily.lane} onChange={e => setValue('lane', e.target.value)} /></Field>
            <Field label="Arah"><Select id="select-daily-direction" value={daily.direction} options={['Normal', 'Opposite']} onChange={v => setValue('direction', v as DailySurveyRecord['direction'])} /></Field>
            <Field label="Cuaca"><Select id="select-daily-weather" value={daily.weather} options={['Cerah', 'Berawan', 'Hujan']} onChange={v => setValue('weather', v as DailySurveyRecord['weather'])} /></Field>
            <Field label="Alat"><Select id="select-daily-tool" value={daily.tool} options={dailyEquipment[daily.surveyType]} onChange={v => { setValue('tool', v); setDailyTool({}); }} /></Field>
            <Field label="Operator"><input data-testid="input-daily-operator" value={daily.operator} onChange={e => setValue('operator', e.target.value)} /></Field>
            <Field label="Pengemudi"><input data-testid="input-daily-driver" value={daily.driver} onChange={e => setValue('driver', e.target.value)} /></Field>
            <Field label="Lokasi penting (POI)"><input data-testid="input-daily-poi" value={daily.poi} onChange={e => setValue('poi', e.target.value)} /></Field>
          </div>
          <div className="stage3a-actions"><button className="wf-button primary" type="button" onClick={() => setSection('hasil')}>Lanjut ke data survei</button></div>
        </div>}

        {section === 'hasil' && <div className="stage3a-section">
          <h4><FileText size={17} aria-hidden="true" /> Data {daily.surveyType}</h4>
          <div className="stage3a-fields">
            <Field label="Sumber kegiatan"><Select id="select-daily-source" value={dailySource} options={[...VALIDATION_SOURCE_OPTIONS]} onChange={v => setDailySource(v as (typeof VALIDATION_SOURCE_OPTIONS)[number])} /></Field>
            {sourceReadOnly ? <div className="stage3a-field-note">Data sumber belum terhubung. Gunakan pencatatan manual untuk memasukkan kegiatan.</div> : <>
              {daily.surveyType === 'Lereng' && <Field label="Jenis keruntuhan lereng"><input data-testid="input-daily-slope-failure" value={daily.slopeFailureType || ''} onChange={e => setValue('slopeFailureType', e.target.value)} /></Field>}
              {daily.surveyType === 'IRI' && <CheckRow id="daily-speed-lane" label="Kecepatan dan jejak roda sesuai" checked={daily.speedAndLaneCompliant} onChange={v => setValue('speedAndLaneCompliant', v)} />}
              {(daily.surveyType === 'IRI' || daily.surveyType === 'PCI') && <CheckRow id="daily-surface-dry" label="Permukaan kering" checked={daily.surfaceDry} onChange={v => setValue('surfaceDry', v)} />}
              {daily.surveyType === 'PCI' && <CheckRow id="daily-glare-free" label="Pencahayaan citra memadai" checked={daily.glareFree} onChange={v => setValue('glareFree', v)} />}
              {dailyFields(daily).map(field => <Field key={field.key} label={field.label.replace(' (simulasi)', '').replace(' (acuan teknis belum dilampirkan)', '')}>
                {field.options ? <select data-testid={`input-daily-technical-${field.key}`} value={daily.technicalData?.[field.key] ?? ''} onChange={e => changeTechnical(field.key, e.target.value)}>
                  <option value="">Pilih</option>{field.options.map(value => <option key={value} value={value}>{value}</option>)}
                </select> : <input data-testid={`input-daily-technical-${field.key}`} type={field.numeric ? 'number' : 'text'} step={field.numeric ? 'any' : undefined} value={daily.technicalData?.[field.key] ?? ''} onChange={e => changeTechnical(field.key, e.target.value)} />}
              </Field>)}
              <Field label="Ringkasan hasil / referensi data mentah"><input data-testid="input-daily-raw" value={daily.rawValue} onChange={e => setValue('rawValue', e.target.value)} /></Field>
              <Field label="Faktor pengganggu"><input data-testid="input-daily-disturbances" value={daily.disturbances} onChange={e => setValue('disturbances', e.target.value)} /></Field>
              <Field label="Catatan kejadian"><input data-testid="input-daily-events" value={daily.eventNotes} onChange={e => setValue('eventNotes', e.target.value)} /></Field>
            </>}
          </div>
          <div className="stage3a-actions"><button className="wf-button" type="button" onClick={() => setSection('identitas')}>Kembali</button><button className="wf-button primary" type="button" onClick={() => setSection('pemeriksaan')}>Lanjut ke pemeriksaan</button></div>
        </div>}

        {section === 'pemeriksaan' && <div className="stage3a-section">
          <h4><ClipboardCheck size={17} aria-hidden="true" /> Pemeriksaan harian</h4>
          <div className="stage3a-checks">
            {checks.map(key => <CheckRow key={key} id={`daily-tool-${testId(key)}`} label={key} checked={!!dailyTool[key]} disabled={sourceReadOnly}
              onChange={value => setDailyTool(prev => ({ ...prev, [key]: value }))} />)}
          </div>
          <div className="stage3a-subsection">
            <h4>Bukti kegiatan</h4>
            <DocumentAttachments scope={`${state.project.id}:stage3a-${daily.surveyType}`}
              categories={[`Bukti kegiatan ${daily.surveyType}`, 'Checklist / catatan pemeriksaan harian', 'Pengamanan data harian']} editable={canWrite} />
          </div>
          <div className="stage3a-subsection">
            <h4>Pengamanan data</h4>
            <div className="stage3a-media">{BACKUP_MEDIA.map(media => <label key={media}><input type="checkbox" data-testid={`check-backup-media-${testId(media)}`}
              checked={backupMedia.includes(media)} onChange={e => setBackupMedia(prev => e.target.checked ? [...prev, media] : prev.filter(item => item !== media))} />{media}</label>)}</div>
            <div className="stage3a-actions"><Button id="button-create-daily-backup" disabled={!scopedRecords.length} onClick={makeBackup}><Archive size={15} /> Catat pengamanan</Button><span className="wf-note">{state.backups.length} catatan</span></div>
          </div>
          {!!technicalErrors.length && !sourceReadOnly && <details className="stage3a-errors" role="status"><summary>{technicalErrors.length} isian perlu dilengkapi</summary><ul>{technicalErrors.map((error, i) => <li key={`${i}-${error}`}>{error.replace(' (simulasi)', '')}</li>)}</ul></details>}
          <div className="stage3a-actions">
            <button className="wf-button" type="button" onClick={() => setSection('hasil')}>Kembali</button>
            <Button id="button-daily-resurvey" disabled={!stageReady || sourceReadOnly} onClick={() => setDaily(d => ({ ...d, state: 'Survei Ulang' }))}>Tandai survei ulang</Button>
            <Button id="button-daily-save" kind="primary" disabled={!canSave} onClick={saveRecord}><Save size={15} />{daily.state === 'Survei Ulang' ? 'Catat survei ulang' : editingId ? 'Simpan perubahan' : 'Simpan kegiatan'}</Button>
          </div>
        </div>}
      </section>}

      <Stage3DailyRecordsTable state={state} onEdit={canWrite ? editRecord : undefined} />
    </div>
  );
}
