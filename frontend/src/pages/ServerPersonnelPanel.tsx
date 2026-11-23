import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { RefreshCw, UserRound, Award } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import type { ServerSurveyTeam } from './serverCalibration';
import {
  createStage1Personnel,
  createStage1Qualification,
  uploadStage1QualificationEvidence,
  type QualificationDraft,
  type Stage1Membership,
  type Stage1Qualification,
  type PersonnelDraft,
} from './serverStage1Data';

const EMPTY_PERSON: PersonnelDraft = { nama: '', nik_internal: '', pendidikan: '', pengalaman_tahun: '', peran: '', mulai: '', selesai: '' };
const EMPTY_QUALIFICATION: QualificationDraft = { jenis: 'SKK', nomor: '', jenjang: '', berlaku_sd: '' };
function message(error: unknown) { return error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Data personel belum dapat diproses.'; }
function responseRows<T>(value: unknown, label: string): T[] {
  const data = value && typeof value === 'object' && 'data' in value ? (value as { data: unknown }).data : null;
  if (!Array.isArray(data)) throw new Error(`Respons ${label} daripada server tidak sesuai.`);
  return data as T[];
}

export function ServerPersonnelPanel({ packageId, teams, manageable }: { packageId: string; teams: ServerSurveyTeam[]; manageable: boolean }) {
  const [teamId, setTeamId] = useState('');
  const [members, setMembers] = useState<Stage1Membership[]>([]);
  const [qualifications, setQualifications] = useState<Stage1Qualification[]>([]);
  const [personDraft, setPersonDraft] = useState<PersonnelDraft>(EMPTY_PERSON);
  const [qualificationDraft, setQualificationDraft] = useState<QualificationDraft>(EMPTY_QUALIFICATION);
  const [evidenceQualificationId, setEvidenceQualificationId] = useState<number | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [personId, setPersonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const selectedMember = members.find(member => String(member.personel_id) === personId);
  const visibleQualifications = useMemo(() => qualifications.filter(item => String(item.personel_id) === personId), [qualifications, personId]);

  useEffect(() => {
    setTeamId(current => teams.some(team => String(team.tim_id) === current) ? current : teams[0] ? String(teams[0].tim_id) : '');
  }, [teams]);

  useEffect(() => {
    setPersonDraft(EMPTY_PERSON);
    setQualificationDraft(EMPTY_QUALIFICATION);
    setMembers([]); setQualifications([]); setPersonId(''); setError('');
    if (!teamId) return;
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim/${teamId}/personel`, { signal: controller.signal }),
    ]).then(async ([memberResponse]) => {
      const nextMembers = responseRows<Stage1Membership>(memberResponse, 'personel tim');
      const qualificationRows = await Promise.all(nextMembers.map(async member => {
        const result = await apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim/${teamId}/personel/${member.personel_id}/kualifikasi`, { signal: controller.signal });
        return responseRows<Stage1Qualification>(result, 'kualifikasi personel');
      }));
      if (controller.signal.aborted) return;
      setMembers(nextMembers);
      setQualifications(qualificationRows.flat());
      setPersonId(current => nextMembers.some(member => String(member.personel_id) === current) ? current : nextMembers[0] ? String(nextMembers[0].personel_id) : '');
    }).catch(cause => { if (!controller.signal.aborted) setError(message(cause)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [packageId, teamId, revision]);

  async function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manageable || !teamId || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const confirmed = await createStage1Personnel(packageId, Number(teamId), personDraft, apiRequest);
      setMembers(current => current.some(member => member.anggota_id === confirmed.anggota_id) ? current : [...current, confirmed]);
      setPersonId(String(confirmed.personel_id));
      setPersonDraft(EMPTY_PERSON);
      setNotice(`Personel #${confirmed.personel_id} disahkan sebagai anggota Tim #${teamId}. Kelayakan belum dinilai oleh server.`);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function addQualification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manageable || !teamId || !selectedMember || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const confirmed = await createStage1Qualification(packageId, Number(teamId), selectedMember.personel_id, qualificationDraft, apiRequest);
      setQualifications(current => current.some(item => item.kualifikasi_id === confirmed.kualifikasi_id) ? current : [confirmed, ...current]);
      setQualificationDraft(EMPTY_QUALIFICATION);
      setNotice(`Kualifikasi #${confirmed.kualifikasi_id} disahkan daripada server. Penilaian kelayakan belum disokong.`);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function uploadEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qualification = visibleQualifications.find(item => item.kualifikasi_id === evidenceQualificationId);
    if (!manageable || !teamId || !selectedMember || !qualification || !evidenceFile || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await uploadStage1QualificationEvidence(packageId, Number(teamId), selectedMember.personel_id, qualification, evidenceFile, apiRequest);
      setQualifications(current => current.map(item => item.kualifikasi_id === result.qualification.kualifikasi_id ? result.qualification : item));
      setEvidenceFile(null); setEvidenceQualificationId(null);
      setNotice(`Bukti PDF untuk kualifikasi #${result.qualification.kualifikasi_id} disahkan melalui bacaan semula server. Kelayakan masih belum dinilai.`);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  return <section className="wf-panel">
    <div className="wf-panel-head"><h3><UserRound size={14} /> Personel & kualifikasi</h3><button type="button" className="wf-button" disabled={!teamId || loading} onClick={() => setRevision(value => value + 1)}><RefreshCw size={13} /> Muat ulang</button></div>
    <div className="wf-body">
      {!teams.length ? <p>Daftarkan tim survei sebelum menambah personel.</p> : <>
        <label className="wf-field">Tim survei<select value={teamId} onChange={event => setTeamId(event.target.value)} disabled={busy}>{teams.map(team => <option key={team.tim_id} value={team.tim_id}>Tim #{team.tim_id} - {team.nama_tim}</option>)}</select></label>
        {loading && <p role="status">Memuat personel dan kualifikasi daripada server...</p>}
        {error && <div role="alert" className="wf-callout danger">{error}</div>}
        {notice && <div role="status" className="wf-callout">{notice}</div>}
        {!loading && !members.length && <div className="wf-empty">Belum ada personel untuk tim ini.</div>}
        {!!members.length && <div className="package-flow-list">{members.map(member => <button type="button" className="package-flow-row" key={member.anggota_id} aria-pressed={personId === String(member.personel_id)} onClick={() => setPersonId(String(member.personel_id))}><div className="package-flow-icon"><UserRound size={15} /></div><div className="package-flow-copy"><small>Anggota #{member.anggota_id} - Personel #{member.personel_id}</small><strong>{member.personel?.nama || `Personel #${member.personel_id}`}</strong><span>{member.peran} - {member.mulai || 'Mulai belum ditetapkan'}</span></div><div className="package-flow-status">{qualifications.filter(item => item.personel_id === member.personel_id).length} kualifikasi - belum dinilai</div></button>)}</div>}
        {manageable && <form onSubmit={addPerson} style={{ marginTop: 16 }}><h4>Daftarkan personel ke tim</h4><div className="wf-fields">
          <label className="wf-field">Nama personel<input required maxLength={255} value={personDraft.nama} onChange={event => setPersonDraft(current => ({ ...current, nama: event.target.value }))} disabled={busy} /></label>
          <label className="wf-field">Peran dalam tim<input required maxLength={255} value={personDraft.peran} onChange={event => setPersonDraft(current => ({ ...current, peran: event.target.value }))} disabled={busy} /></label>
          <label className="wf-field">ID personel internal (opsional)<input maxLength={255} value={personDraft.nik_internal} onChange={event => setPersonDraft(current => ({ ...current, nik_internal: event.target.value }))} disabled={busy} /></label>
          <label className="wf-field">Pendidikan (opsional)<input maxLength={255} value={personDraft.pendidikan} onChange={event => setPersonDraft(current => ({ ...current, pendidikan: event.target.value }))} disabled={busy} /></label>
          <label className="wf-field">Pengalaman (tahun)<input type="number" min="0" step="1" value={personDraft.pengalaman_tahun} onChange={event => setPersonDraft(current => ({ ...current, pengalaman_tahun: event.target.value }))} disabled={busy} /></label>
          <label className="wf-field">Mulai penugasan (opsional)<input type="date" value={personDraft.mulai} onChange={event => setPersonDraft(current => ({ ...current, mulai: event.target.value }))} disabled={busy} /></label>
          <label className="wf-field">Selesai penugasan (opsional)<input type="date" value={personDraft.selesai} onChange={event => setPersonDraft(current => ({ ...current, selesai: event.target.value }))} disabled={busy} /></label>
        </div><button className="wf-button primary" type="submit" disabled={busy} style={{ marginTop: 12 }}>{busy ? 'Menyimpan...' : 'Simpan personel ke server'}</button></form>}
        <div className="wf-panel" style={{ marginTop: 16 }}><div className="wf-panel-head"><h3><Award size={14} /> Kualifikasi personel</h3><span>{selectedMember ? `Personel #${selectedMember.personel_id}` : 'Pilih personel'}</span></div><div className="wf-body">
          {selectedMember && <>{!visibleQualifications.length ? <div className="wf-empty">Belum ada kualifikasi yang tercatat.</div> : visibleQualifications.map(item => <div className="wf-row" key={item.kualifikasi_id}><span><strong>{item.jenis}</strong> - {item.nomor}{item.jenjang ? ` - ${item.jenjang}` : ''}</span><span>{item.berlaku_sd || 'Tarikh luput tidak ditetapkan'} - belum dinilai</span></div>)}
            {manageable && !!visibleQualifications.length && <form onSubmit={uploadEvidence} style={{ marginTop: 12 }}><h4>Muat naik bukti kualifikasi</h4><label className="wf-field">Kualifikasi<select value={evidenceQualificationId ?? ''} onChange={event => { setEvidenceQualificationId(event.target.value ? Number(event.target.value) : null); setEvidenceFile(null); }} disabled={busy} required><option value="">Pilih kualifikasi</option>{visibleQualifications.map(item => <option key={item.kualifikasi_id} value={item.kualifikasi_id}>{item.jenis} - {item.nomor}</option>)}</select></label><label className="wf-field">Fail sijil PDF<input type="file" accept="application/pdf,.pdf" onChange={event => setEvidenceFile(event.target.files?.[0] ?? null)} disabled={busy} required /></label><p className="wf-note">Bukti dimuat naik ke server dengan versi rekod semasa. Muat naik bukti tidak mengesahkan kelayakan.</p><button className="wf-button" type="submit" disabled={busy || evidenceQualificationId === null || !evidenceFile}>{busy ? 'Memuat naik...' : 'Simpan bukti ke server'}</button></form>}
            {manageable && <form onSubmit={addQualification} style={{ marginTop: 12 }}><div className="wf-fields">
              <label className="wf-field">Jenis kualifikasi<select value={qualificationDraft.jenis} onChange={event => setQualificationDraft(current => ({ ...current, jenis: event.target.value as QualificationDraft['jenis'] }))} disabled={busy}><option value="SKA">SKA</option><option value="SKK">SKK</option><option value="PELATIHAN_QA_QC_DJBM">Pelatihan QA/QC DJBM</option></select></label>
              <label className="wf-field">Nomor<input required maxLength={255} value={qualificationDraft.nomor} onChange={event => setQualificationDraft(current => ({ ...current, nomor: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Jenjang (opsional)<input maxLength={255} value={qualificationDraft.jenjang} onChange={event => setQualificationDraft(current => ({ ...current, jenjang: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Berlaku hingga (opsional)<input type="date" value={qualificationDraft.berlaku_sd} onChange={event => setQualificationDraft(current => ({ ...current, berlaku_sd: event.target.value }))} disabled={busy} /></label>
            </div><p className="wf-note">Metadata dan bukti PDF disimpan melalui server. Bukti tidak menyatakan kelayakan telah disahkan; penilaian kelayakan masih belum disokong.</p><button className="wf-button" type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan kualifikasi'}</button></form>}
          </>}
        </div></div>
      </>}
    </div>
  </section>;
}
