import { useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { apiRequest } from '../auth/client';
import { STAGE1_IRI_CANDIDATE, STAGE1_IRI_ITEMS, draftSaveError, readIriChecklist, saveIriDraft, type IriAnswer, type IriChecklistResponse } from './stage1IriChecklist';
import { iriSectionFromDeepLink } from './stage1AccordionState';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;
type Props = { packageId: string; enabled?: boolean; request?: Request };
const requestDefault = apiRequest as Request;
const emptyAnswer: IriAnswer = { value: null, note: null };

export function Stage1IriDraftChecklist({ packageId, enabled = false, request = requestDefault }: Props) {
  const [server, setServer] = useState<IriChecklistResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, IriAnswer>>({});
  const [dirty, setDirty] = useState<Record<string, IriAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    readIriChecklist(packageId, request, controller.signal)
      .then(data => {
        if (controller.signal.aborted) return;
        setServer(data);
        setAnswers(data.answers);
      })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Checklist belum dapat dimuat.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [packageId, request]);

  const sections = useMemo(() => [...new Set(STAGE1_IRI_ITEMS.map(item => item.section))], []);
  const [openSection, setOpenSection] = useState(() => iriSectionFromDeepLink(window.location.search, sections));
  function edit(key: string, patch: Partial<IriAnswer>) {
    const item = STAGE1_IRI_ITEMS.find(candidate => candidate.key === key);
    if (!enabled || !item) return;
    const next = { ...(dirty[key] ?? answers[key] ?? emptyAnswer), ...patch };
    setDirty(current => ({ ...current, [key]: next }));
    setSavedMessage('');
    if (!conflict) setError('');
  }
  async function save() {
    if (!enabled || !server || saving || !Object.keys(dirty).length) return;
    setSaving(true); setError(''); setSavedMessage(''); setConflict(false);
    try {
      const data = await saveIriDraft(packageId, server, dirty, request);
      setServer(data); setAnswers(data.answers); setDirty({}); setSavedMessage('Jawaban tersimpan dan dikonfirmasi server.');
    } catch (cause) {
      const failure = draftSaveError(cause);
      setConflict(failure.conflict); setError(failure.message);
    } finally { setSaving(false); }
  }
  async function reloadServerVersion() {
    if (reloading || saving) return;
    setReloading(true); setError(''); setSavedMessage('');
    try {
      const data = await readIriChecklist(packageId, request);
      setServer(data); setAnswers(data.answers); setConflict(false);
      setSavedMessage('Versi server dimuat; perubahan lokal tetap tersedia untuk ditinjau sebelum disimpan.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Versi server belum dapat dimuat.');
    } finally { setReloading(false); }
  }

  return <section className="wf-panel source-exact-checklist" data-testid="stage1-iri-draft-checklist">
    <div className="wf-panel-head"><h3>Checklist Kalibrasi &amp; Validasi · IRI</h3><span>{Object.values({ ...answers, ...dirty }).filter(answer => answer.value !== null).length}/30 terjawab</span></div>
    <div className="wf-body">
      <p className="wf-note">Kandidat internal {STAGE1_IRI_CANDIDATE.candidateRevision} · sumber belum disetujui sebagai template resmi. Hanya 30 butir Ya/Tidak; hasil validasi terstruktur dan survei lain belum termasuk.</p>
      {loading && <p role="status">Memuat jawaban checklist dari server…</p>}
      {!loading && error && !server && <p role="alert" className="wf-callout warn">{error}</p>}
      {server && <>
        <p role="status">{Object.keys(dirty).length ? 'Ada perubahan belum disimpan; simpan untuk mengirim draf ke server.' : `Draf server versi ${server.filling.version}.`}</p>
        <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="ui09-iri-accordion" data-testid="stage1-iri-sections">
          {sections.map(section => {
            const sectionItems = STAGE1_IRI_ITEMS.filter(item => item.section === section);
            const answered = sectionItems.filter(item => (dirty[item.key] ?? answers[item.key] ?? emptyAnswer).value !== null).length;
            return <AccordionItem className="structured-checklist-section ui09-iri-section" value={section} key={section}>
              <AccordionTrigger className="ui09-iri-trigger" data-testid={`stage1-iri-section-${section.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                <strong>{section}</strong><span>{answered}/{sectionItems.length} terjawab</span>
              </AccordionTrigger>
              <AccordionContent forceMount className="ui09-iri-content">
          {sectionItems.map(item => {
            const answer = dirty[item.key] ?? answers[item.key] ?? emptyAnswer;
            return <div className="structured-checklist-item" key={item.key} data-item-key={item.key}>
              <div className="structured-checklist-question"><span>{item.number}</span><strong>{item.label}</strong></div>
              <fieldset className="structured-checklist-options" aria-label={item.label}>{item.options.map(option => <label className={`structured-choice ${answer.value === option ? 'selected' : ''}`} key={option}>
                <input type="radio" name={item.key} value={option} checked={answer.value === option} disabled={!enabled || saving} onChange={() => edit(item.key, { value: option })}/>{option}
              </label>)}</fieldset>
              <label className="wf-field">Keterangan<textarea maxLength={2000} rows={2} value={answer.note ?? ''} disabled={!enabled || saving} onChange={event => edit(item.key, { note: event.target.value || null })}/></label>
              {answer.value === null && <small className="wf-note">Belum dijawab</small>}
            </div>;
          })}
              </AccordionContent>
            </AccordionItem>;
          })}
        </Accordion>
        {enabled && <button type="button" className="wf-button primary" disabled={saving || conflict || !Object.keys(dirty).length} onClick={save} aria-busy={saving}>{saving ? 'Menyimpan…' : 'Simpan draf jawaban'}</button>}
      </>}
      {conflict && <>
        <p role="alert" className="wf-callout warn">{error}</p>
        <button type="button" className="wf-button" disabled={reloading || saving} onClick={reloadServerVersion}>{reloading ? 'Memuat versi server…' : 'Muat ulang versi server sebelum menggabungkan'}</button>
      </>}
      {!conflict && error && server && <p role="alert" className="wf-callout danger">{error}</p>}
      {savedMessage && <p role="status" className="wf-callout">{savedMessage}</p>}
      {!enabled && <p className="stage-readonly-note">Baca saja: penyimpanan jawaban IRI belum diaktifkan pada antarmuka ini.</p>}
      <small>Jawaban draf tidak mengajukan, menyetujui, atau membuka tahap berikutnya. Pengajuan dan pemeriksaan PIC memerlukan kontrak alur terpisah.</small>
    </div>
  </section>;
}
