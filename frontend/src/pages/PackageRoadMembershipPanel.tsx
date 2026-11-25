import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPinned, RefreshCw, Save } from 'lucide-react';
import { ApiError } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import {
  addPackageRoadLocation,
  getOfficialPackageRoads,
  getPackageRoadAssignmentOptions,
  type PackageRoad,
  type PackageRoadAssignmentOptions,
} from './packageRoadMembership';

const assignmentRole = 'PIC Balai / Pengguna Jasa';
const providerRole = 'Penyedia Jasa / Ketua Tim';
const roadName = (road: PackageRoad) =>
  `${road.nomor_ruas || `Ruas #${road.ruas_id}`} · ${road.nama_ruas || 'Nama belum tersedia'}`;

export function PackageRoadMembershipPanel({ packageId, role }: { packageId: string; role: WorkflowRole }) {
  const isPic = role === assignmentRole;
  const isProvider = role === providerRole;
  const [options, setOptions] = useState<PackageRoadAssignmentOptions | null>(null);
  const [officialRoads, setOfficialRoads] = useState<PackageRoad[] | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedRoad, setSelectedRoad] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [uncertainSave, setUncertainSave] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    let readbackComplete = !isPic;
    try {
      if (isPic) {
        const [optionsResult, roadsResult] = await Promise.allSettled([
          getPackageRoadAssignmentOptions(packageId, undefined, signal),
          getOfficialPackageRoads(packageId, undefined, signal),
        ]);
        if (signal?.aborted) return;
        if (roadsResult.status === 'fulfilled') setOfficialRoads(roadsResult.value);
        else throw roadsResult.reason;
        if (optionsResult.status === 'fulfilled') {
          setOptions(optionsResult.value);
          setSelectedSurvey(current =>
            current && optionsResult.value.survei.some(survey => String(survey.jenis_survei_id) === current) ? current : '',
          );
          setSelectedSemester(current =>
            current === '__none' || (current !== '' && optionsResult.value.semester_tersedia.includes(Number(current))) ? current : '',
          );
          readbackComplete = true;
        } else {
          setOptions(null);
          setError(optionsResult.reason instanceof Error ? optionsResult.reason.message : 'Opsi penetapan tidak dapat dimuat.');
        }
      } else {
        const nextOfficialRoads = await getOfficialPackageRoads(packageId, undefined, signal);
        if (signal?.aborted) return;
        setOptions(null);
        setOfficialRoads(nextOfficialRoads);
      }
      if (readbackComplete) setUncertainSave(false);
    } catch (cause) {
      if (!signal?.aborted) {
        setError(cause instanceof Error ? cause.message : 'Keanggotaan ruas paket gagal dimuat.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [isPic, packageId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, revision]);

  const selectedScopeLocations = useMemo(() => {
    const surveyId = Number(selectedSurvey);
    const semester = selectedSemester === '__none' ? null : Number(selectedSemester);
    return options?.lokasi_ditetapkan.filter(row =>
      row.ruas_id !== null && row.jenis_survei_id === surveyId && row.semester === semester,
    ) ?? [];
  }, [options, selectedSemester, selectedSurvey]);

  const availableRoads = useMemo(() => {
    const already = new Set(selectedScopeLocations.map(row => row.ruas_id));
    return (options?.ruas_tersedia ?? []).filter(road => !already.has(road.ruas_id));
  }, [options, selectedScopeLocations]);

  async function save() {
    if (!isPic || !options || saving || !selectedSurvey || !selectedSemester || !selectedRoad) return;
    setSaving(true);
    setError('');
    setNotice('');
    setUncertainSave(false);
    const input = {
      ruas_id: Number(selectedRoad),
      jenis_survei_id: Number(selectedSurvey),
      semester: selectedSemester === '__none' ? null : Number(selectedSemester),
    };
    let rpcConfirmed = false;
    try {
      const saved = await addPackageRoadLocation(packageId, input);
      rpcConfirmed = true;
      const [refreshedOptions, refreshedOfficialRoads] = await Promise.all([
        getPackageRoadAssignmentOptions(packageId),
        getOfficialPackageRoads(packageId),
      ]);
      const membershipPresent = refreshedOfficialRoads.some(road => road.ruas_id === input.ruas_id);
      const locationPresent = refreshedOptions.lokasi_ditetapkan.some(location =>
        location.lokasi_id === saved.location.lokasi_id &&
        location.paket_id === Number(packageId) &&
        location.ruas_id === input.ruas_id &&
        location.jenis_survei_id === input.jenis_survei_id &&
        location.semester === input.semester,
      );
      if (!membershipPresent || !locationPresent) {
        setUncertainSave(true);
        throw new Error('Server menerima permintaan, tetapi bacaan ulang resmi belum mengesahkan lokasi yang sama. Muat ulang dan periksa sebelum mencoba lagi.');
      }
      setOptions(refreshedOptions);
      setOfficialRoads(refreshedOfficialRoads);
      setSelectedRoad('');
      setNotice('Ruas berhasil ditambahkan dan dikonfirmasi pada bacaan resmi paket.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Penetapan ruas gagal.');
      if (cause instanceof ApiError && cause.status === 409) {
        setRevision(value => value + 1);
      } else if (rpcConfirmed || !(cause instanceof ApiError) || cause.status >= 500) {
        // A network/readback error after POST is ambiguous; prevent a blind retry.
        setUncertainSave(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="wf-panel" data-testid="package-road-membership">
      <div className="wf-panel-head">
        <h3><MapPinned size={14} /> Keanggotaan ruas paket</h3>
        <button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)} disabled={loading || saving}>
          <RefreshCw size={13} /> Muat ulang
        </button>
      </div>
      <div className="wf-body">
        {loading && <p role="status">Memuat keanggotaan ruas dari server…</p>}
        {error && <div role="alert" className="wf-callout danger">{error}</div>}
        {notice && <div role="status" className="wf-callout">{notice}</div>}
        {uncertainSave && <div role="alert" className="wf-callout warn">Status simpan belum pasti. Muat ulang keanggotaan resmi sebelum mengirim ulang agar tidak membuat duplikasi.</div>}

        {!loading && officialRoads !== null && (
          <>
            <p className="wf-note">Ruas Balai yang tersedia adalah sumber pilihan. Hanya ruas yang tampil pada daftar lokasi paket resmi dianggap ditetapkan.</p>
            <h4>Ruas resmi paket</h4>
            {!officialRoads.length && <p role="status">Belum ada ruas resmi yang ditetapkan untuk paket ini.</p>}
            {!!officialRoads.length && (
              <ul aria-label="Ruas resmi paket">
                {officialRoads.map(road => <li key={road.ruas_id}>{roadName(road)}</li>)}
              </ul>
            )}

            {isPic && options && (
              <>
                <h4>Lokasi dan lingkup yang ditetapkan</h4>
                {!options.lokasi_ditetapkan.length && <p>Belum ada baris lokasi paket; penambahan berikutnya membuat baris baru tanpa mengubah data lain.</p>}
                {!!options.lokasi_ditetapkan.length && (
                  <ul aria-label="Lokasi paket ditetapkan">
                    {options.lokasi_ditetapkan.map(location => (
                      <li key={location.lokasi_id}>
                        {location.ruas ? roadName(location.ruas) : `Lokasi #${location.lokasi_id} · ruas belum ditetapkan`}
                        {' · '}{location.survei?.kode ?? 'Survei belum ditetapkan'}
                        {' · '}{location.semester === null ? 'Semester tidak ditentukan' : `Semester ${location.semester}`}
                      </li>
                    ))}
                  </ul>
                )}

                <fieldset disabled={saving || uncertainSave || !options.survei.length} style={{ border: 0, padding: 0, margin: '12px 0 0' }}>
                  <legend>Tambahkan lokasi ruas (baris baru; tidak mengubah lokasi yang ada)</legend>
                  <div className="wf-grid equal">
                    <label className="wf-field">Jenis survei
                      <select value={selectedSurvey} onChange={event => { setSelectedSurvey(event.target.value); setSelectedRoad(''); }}>
                        <option value="">Pilih jenis survei</option>
                        {options.survei.map(survey => <option key={survey.jenis_survei_id} value={survey.jenis_survei_id}>{survey.kode} · {survey.nama}</option>)}
                      </select>
                    </label>
                    <label className="wf-field">Semester
                      <select value={selectedSemester} onChange={event => { setSelectedSemester(event.target.value); setSelectedRoad(''); }}>
                        <option value="">Pilih semester</option>
                        <option value="__none">Tidak ditentukan (kolom nullable)</option>
                        {options.semester_tersedia.map(semester => <option key={semester} value={semester}>{semester}</option>)}
                      </select>
                    </label>
                    <label className="wf-field">Ruas Balai tersedia untuk lingkup ini
                      <select value={selectedRoad} onChange={event => setSelectedRoad(event.target.value)}>
                        <option value="">Pilih ruas</option>
                        {availableRoads.map(road => <option key={road.ruas_id} value={road.ruas_id}>{roadName(road)}</option>)}
                      </select>
                    </label>
                  </div>
                  {!availableRoads.length && <p role="status">Tidak ada ruas lain yang tersedia untuk lingkup survei dan semester terpilih.</p>}
                  <button type="button" className="wf-button primary" onClick={() => void save()} disabled={!selectedSurvey || !selectedSemester || !selectedRoad || saving || uncertainSave}>
                    <Save size={13} /> {saving ? 'Menyimpan dan mengesahkan…' : 'Tambahkan ruas ke paket'}
                  </button>
                </fieldset>
              </>
            )}
            {isProvider && <p className="stage-readonly-note">Mode baca sahaja. Penetapan ruas paket hanya dapat dilakukan PIC Balai dengan scope yang sesuai.</p>}
          </>
        )}
      </div>
    </section>
  );
}
