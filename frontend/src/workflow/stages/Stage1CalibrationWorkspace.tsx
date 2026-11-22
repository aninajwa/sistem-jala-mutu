import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { EvidenceAttachment } from "../EvidenceAttachment";
import { CalibrationRecord, CalibrationReview, CalibrationReviewSubject, CalibrationReviewEntry, daysBetween, SurveyType } from "../model";
import {defaultCase} from '../correctionDefaults';
import {localPersistence} from '../repository/localPersistence';
import {pendingCalibrationFinding,calibrationFindingCases} from '../calibrationCorrectionBridge';
import {calibrationSourceSignature, calibrationReviewIsCurrent, calibrationReviewEntries, CALIBRATION_REVIEW_SUBJECTS, calibrationSubjectEvidenceReady, canRespondToCalibrationReview} from '../calibrationReview';
import { SourceAlignmentChecklist } from "../SourceAlignmentChecklist";
import { sourceDocument, sourceDocumentKey } from "../sourceDocumentModel";
import { validateSourceDocument } from "../sourceFormValidation";
import { readLocal } from "../repository/localPersistence";
import { SOURCE_FORM_CHANGED } from "../repository/workflowReconciliation";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  dailyEquipment,
  Field,
  idNow,
  invalidateDependentStages,
  Panel,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

import '../stage1Workspace.css';
export function Stage1CalibrationWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage1CalibrationWorkspace`,{});
  const [newCalibration, setNewCalibration] = usePersistedDraft<Partial<CalibrationRecord>>(`jala-ui-draft:${state.project.id}:${state.role}:newCalibration`,{});
  const [calEditId, setCalEditId] = useState("");
  const [calibrationSurvey, setCalibrationSurvey] = useState<SurveyType>(
    state.project.surveyTypes[0] || "IRI",
  );
  const [reviewFormOpen,setReviewFormOpen]=useState(false);
  const [findingSubject,setFindingSubject]=useState<CalibrationReviewSubject|null>(null);
  const [findingRoad,setFindingRoad]=useState(state.project.routes[0] || '');
  const [findingSeverity,setFindingSeverity]=useState<'Kritis'|'Mayor'|'Minor'>('Mayor');
  const [findingError,setFindingError]=useState('');
  const [reviewError,setReviewError]=useState('');
  const [responseSubject,setResponseSubject]=useState<CalibrationReviewSubject|null>(null);
  const [responseNote,setResponseNote]=useState('');
  const [responseReference,setResponseReference]=useState('');
  const [responseError,setResponseError]=useState('');
  const [reviewResult,setReviewResult]=useState<CalibrationReview['result']>('Sesuai');
  const [reviewSubject,setReviewSubject]=useState<CalibrationReview['subject']>('Alat dan personel');
  const [reviewNote,setReviewNote]=useState('');
  const [reviewEvidence,setReviewEvidence]=useState('');
  const [calFormOpen, setCalFormOpen] = useState(false);
  const [calFormRecordId, setCalFormRecordId] = useState("");

  /*
   * Tahap 1:
   * - Penyedia melengkapi penugasan alat/personel dan bukti.
   * - Checklist mengikuti lampiran Kalibrasi & Validasi.
   * - Kesiapan dihitung sistem.
   * - PIC Balai / Direktorat membaca secara read-only.
   *
   * Tidak ada approval Balai khusus di Tahap 1.
   */

  const canEditCalibration = state.role === "Penyedia Jasa / Ketua Tim";

  const scopedSurveyTypes = state.project.surveyTypes;

  const activeSurvey = scopedSurveyTypes.includes(calibrationSurvey)
    ? calibrationSurvey
    : scopedSurveyTypes[0] || "IRI";

  const equipmentForSurvey = dailyEquipment[activeSurvey] || [];

  const surveyRecords = state.calibrations.filter(
    (record) => record.surveyType === activeSurvey,
  );

  const isCalibrationRecordReady = (record: CalibrationRecord) =>
    record.condition === "Baik" &&
    daysBetween(state.simulationDate, record.dueDate) >= 0 &&
    record.qualificationValid &&
    record.trainingVerified;

  const [sourceCompletion,setSourceCompletion]=useState<Record<string,boolean>>({});
  const [sourceRevision, setSourceRevision] = useState(0);
  useEffect(() => {
    const changed = () => setSourceRevision((previous) => previous + 1);
    window.addEventListener(SOURCE_FORM_CHANGED, changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener(SOURCE_FORM_CHANGED, changed);
      window.removeEventListener("storage", changed);
    };
  }, []);
  // Check the actual required source-form fields rather than trusting the saved
  // checklist flag alone. The flag records a submission; form validity is separate.
  const isDetailedFormComplete = (type: SurveyType) => {
    void sourceRevision;
    const document = sourceDocument(type, "calibration", state.productionTests.PCI.pciManual !== false);
    if (!document) return false;
    const answers = readLocal<Record<string, string>>(
      sourceDocumentKey(state.project.id, document.id),
      document.derivedFrom
        ? readLocal<Record<string, string>>(sourceDocumentKey(state.project.id, document.derivedFrom), {})
        : {},
    );
    return validateSourceDocument(document, answers, state.project).complete;
  };
  const activeReview=state.calibrationReviews?.[activeSurvey];
  const activeEntries=calibrationReviewEntries(state,activeSurvey);
  const activeSignature=calibrationSourceSignature(state,activeSurvey);
  const activeReviewCurrent=calibrationReviewIsCurrent(state,activeSurvey);
  const currentSection=activeEntries[reviewSubject];
  const openReview=(subject:CalibrationReviewSubject = 'Alat dan personel')=>{
    const current=activeEntries[subject]?.sourceSignature===activeSignature?activeEntries[subject]:undefined;
    setReviewSubject(subject);
    setReviewResult(current?.result ?? 'Sesuai');
    setReviewNote(current?.note ?? '');
    setReviewEvidence(current?.evidenceReference ?? '');
    setReviewError('');
    setReviewFormOpen(true);
  };
  const saveReview=()=>{
    if(state.role!=='PIC Balai / Pengguna Jasa')return;
    if(!reviewNote.trim()){setReviewError('Isi catatan pemeriksaan sebelum menyimpan.');return;}
    if(reviewResult==='Ada ketidaksesuaian'&&!reviewEvidence.trim()){setReviewError('Cantumkan referensi bukti ketidaksesuaian.');return;}
    if(reviewResult==='Sesuai'&&pendingCalibrationFinding(state,activeSurvey,reviewSubject)){setReviewError('Tindakan Perbaikan pada bagian ini belum ditutup. Selesaikan pemeriksaan hasilnya dahulu.');return;}
    if(reviewResult==='Sesuai'&&!calibrationSubjectEvidenceReady(state,activeSurvey,reviewSubject)){
      setReviewError(`Bukti ${reviewSubject.toLowerCase()} untuk ${activeSurvey} belum memenuhi persyaratan. Lengkapi bagian ini sebelum menyimpan hasil “Sesuai”.`);return;
    }
    const previousSnapshot: Omit<CalibrationReviewEntry, 'history'> | undefined = currentSection
      ? (({ history: _history, ...snapshot }: CalibrationReviewEntry) => snapshot)(currentSection)
      : undefined;
    const entry:CalibrationReviewEntry={result:reviewResult,note:reviewNote.trim(),evidenceReference:reviewEvidence.trim(),reviewedAt:state.simulationDate,reviewer:'PIC Balai / Pengguna Jasa',sourceSignature:calibrationSourceSignature(state,activeSurvey),
      history:previousSnapshot?[...(currentSection?.history??[]),previousSnapshot]:[]};
    const review:CalibrationReview={...entry,subject:reviewSubject,sections:{...activeEntries,[reviewSubject]:entry}};
    commit('Pemeriksaan kalibrasi Balai',`${activeSurvey} · ${reviewSubject}`,current=>({...current,calibrationReviews:{...current.calibrationReviews,[activeSurvey]:review}}),'Hasil pemeriksaan tersimpan.');
    setReviewError('');setReviewFormOpen(false);
  };
  const saveResponse=()=>{
    if(!responseSubject||state.role!=='Penyedia Jasa / Ketua Tim')return;
    const record=activeEntries[responseSubject];
    if(!canRespondToCalibrationReview(record)||record?.sourceSignature!==activeSignature){setResponseError('Hasil pemeriksaan perlu diperbarui oleh Balai.');return;}
    if(!responseNote.trim()){setResponseError('Isi penjelasan atau tindak lanjut terlebih dahulu.');return;}
    if(record.response){setResponseError('Tanggapan sudah dikirim. Menunggu pemeriksaan ulang Balai.');return;}
    const updated={...record,response:{note:responseNote.trim(),reference:responseReference.trim(),respondedAt:state.simulationDate}};
    commit('Tanggapan pemeriksaan kalibrasi',`${activeSurvey} · ${responseSubject}`,current=>({
      ...current,calibrationReviews:{...current.calibrationReviews,[activeSurvey]:{
        ...current.calibrationReviews?.[activeSurvey]!,sections:{...calibrationReviewEntries(current,activeSurvey),[responseSubject]:updated}
      }}
    }),'Tanggapan telah dikirim untuk diperiksa Balai.');
    setResponseSubject(null);setResponseNote('');setResponseReference('');setResponseError('');
  };
  const openCorrectionCase=(caseId:string)=>{
    try {localPersistence.setItem(`jala-correction-selection:${state.project.id}`,caseId);} catch {}
    onNavigate('/actions:Koreksi berbukti');
  };
  const createCalibrationCase=()=>{
    if(!findingSubject || state.role!=='PIC Balai / Pengguna Jasa')return;
    const record=calibrationReviewEntries(state,activeSurvey)[findingSubject];
    if(!record || record.result!=='Ada ketidaksesuaian' || record.sourceSignature!==calibrationSourceSignature(state,activeSurvey)){
      setFindingError('Pemeriksaan sudah berubah. Periksa kembali hasil dan bukti sebelum membuka tindakan.');return;
    }
    if(!state.project.routes.includes(findingRoad)){
      setFindingError('Pilih ruas yang sesuai dengan paket.');return;
    }
    if(pendingCalibrationFinding(state,activeSurvey,findingSubject)){
      setFindingError('Sudah ada tindakan perbaikan aktif untuk bagian ini.');return;
    }
    const id=`KOR-KAL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
    const item={...defaultCase(state,id),source:'Pemeriksaan kalibrasi',blockedStage:'Kalibrasi',returnStage:'Kalibrasi',surveyType:activeSurvey,road:findingRoad,stationing:'',linkedRecordId:undefined,originalValue:'Tidak berlaku untuk dokumen kalibrasi',severity:findingSeverity,rejectionReason:record.note,evidence:record.evidenceReference,owner:'',dueDate:'',fieldDataValid:'Tidak' as const,calibrationFinding:{surveyType:activeSurvey,subject:findingSubject,sourceSignature:record.sourceSignature,reviewedAt:record.reviewedAt}};
    commit('Buka temuan kalibrasi untuk tindakan perbaikan',`${activeSurvey} · ${findingSubject}`,current=>({...current,corrections:[item,...current.corrections]}),'Kasus tercatat. Penyedia dapat mengusulkan tindakan.');
    setFindingSubject(null);setFindingError('');
  };
  const reviewSummary=(isBalai:boolean)=> <section className="stage1-review-panel" data-testid="calibration-review-panel">
    <div className="stage1-summary-line"><h3>Hasil pemeriksaan Balai · {activeSurvey}</h3><Badge tone={activeReviewCurrent&&CALIBRATION_REVIEW_SUBJECTS.every(subject=>activeEntries[subject]?.result==='Sesuai')?'good':'warn'}>{CALIBRATION_REVIEW_SUBJECTS.filter(subject=>activeEntries[subject]?.sourceSignature===activeSignature).length} dari 4 diperiksa</Badge></div>
    <div className="stage1-review-sections">{CALIBRATION_REVIEW_SUBJECTS.map(subject=>{
      const record=activeEntries[subject],current=record?.sourceSignature===activeSignature;
      return <div className="stage1-review-section" key={subject} data-testid={`calibration-section-${CALIBRATION_REVIEW_SUBJECTS.indexOf(subject)}`}>
        <div className="stage1-summary-line"><strong>{subject}</strong><Badge tone={current&&record?.result==='Sesuai'?'good':'warn'}>{!record?'Belum diperiksa':!current?'Perlu diperiksa ulang':record.result}</Badge></div>
        {record&&<div className="stage1-review-record"><p>{record.note}</p>{record.evidenceReference&&<p className="stage1-mini-note">Bukti: {record.evidenceReference}</p>}
          {record.response&&<div className="stage1-response-summary"><strong>Tanggapan Penyedia</strong><p>{record.response.note}</p>{record.response.reference&&<p className="stage1-mini-note">Referensi: {record.response.reference}</p>}<p className="stage1-mini-note">Menunggu pemeriksaan ulang Balai.</p></div>}
          <p className="stage1-mini-note">Diperiksa Balai · {record.reviewedAt}</p>
          {!!record.history?.length&&<details><summary>Riwayat pemeriksaan ({record.history.length})</summary>{record.history.map((item,i)=><p className="stage1-mini-note" key={i}>{item.reviewedAt} · {item.result}: {item.note}</p>)}</details>}
        </div>}
        {isBalai&&<button type="button" className="wf-button" data-testid={subject===CALIBRATION_REVIEW_SUBJECTS[0]?'button-open-calibration-review':undefined} onClick={()=>openReview(subject)}>{record?'Perbarui pemeriksaan':'Catat hasil pemeriksaan'}</button>}
        {(()=>{const caseItem=calibrationFindingCases(state,activeSurvey,subject)[0];return caseItem?<div className="stage1-review-record"><p className="stage1-mini-note">Tindakan Perbaikan · {caseItem.id} · {caseItem.status}</p><button type="button" className="wf-button" onClick={()=>openCorrectionCase(caseItem.id)}>Lihat Tindakan Perbaikan</button></div>:null;})()}
        {isBalai&&current&&record?.result==='Ada ketidaksesuaian'&&!pendingCalibrationFinding(state,activeSurvey,subject)&&!calibrationFindingCases(state,activeSurvey,subject).some(c=>c.status==='Ditutup'&&c.calibrationFinding?.sourceSignature===record.sourceSignature&&c.rejectionReason===record.note&&c.evidence===record.evidenceReference)&&<button type="button" className="wf-button" onClick={()=>{setFindingSubject(subject);setFindingRoad(state.project.routes[0]||'');setFindingError('');}}>Buka Tindakan Perbaikan</button>}
        {isBalai&&findingSubject===subject&&<div className="stage1-review-form"><strong>Temuan kalibrasi · {subject}</strong><p className="stage1-mini-note">Uraian dan bukti mengikuti hasil pemeriksaan Balai. Rencana tindakan diisi Penyedia pada menu Tindakan Perbaikan.</p><Field label="Ruas terkait"><select aria-label="Ruas temuan kalibrasi" value={findingRoad} onChange={e=>setFindingRoad(e.target.value)}>{state.project.routes.map(road=><option key={road} value={road}>{road}</option>)}</select></Field><Field label="Tingkat temuan"><select aria-label="Tingkat temuan kalibrasi" value={findingSeverity} onChange={e=>setFindingSeverity(e.target.value as 'Kritis'|'Mayor'|'Minor')}><option>Minor</option><option>Mayor</option><option>Kritis</option></select></Field>{findingError&&<p role="alert" className="stage1-form-error">{findingError}</p>}<div className="wf-toolbar"><button type="button" className="wf-button primary" onClick={createCalibrationCase}>Catat Tindakan Perbaikan</button><button type="button" className="wf-button" onClick={()=>setFindingSubject(null)}>Batal</button></div></div>}
        {canEditCalibration&&current&&record?.result==='Ada ketidaksesuaian'&&pendingCalibrationFinding(state,activeSurvey,subject)&&<p className="stage1-mini-note">Tindak lanjut dilakukan melalui Tindakan Perbaikan. Setelah kasus selesai, Balai memeriksa kembali hasil kalibrasi.</p>}
        {canEditCalibration&&current&&canRespondToCalibrationReview(record)&&!pendingCalibrationFinding(state,activeSurvey,subject)&&!record?.response&&responseSubject!==subject&&<button type="button" className="wf-button" onClick={()=>{setResponseSubject(subject);setResponseError('');setResponseNote('');setResponseReference('');}}>Berikan tanggapan</button>}
        {canEditCalibration&&responseSubject===subject&&<div className="stage1-review-form"><Field label="Penjelasan atau tindak lanjut"><textarea aria-label="Tanggapan kalibrasi" rows={3} value={responseNote} onChange={e=>setResponseNote(e.target.value)}/></Field><Field label="Referensi bukti (jika ada)"><input aria-label="Referensi tanggapan kalibrasi" value={responseReference} onChange={e=>setResponseReference(e.target.value)}/></Field>{responseError&&<p role="alert" className="stage1-form-error">{responseError}</p>}<div className="wf-toolbar"><button type="button" className="wf-button primary" onClick={saveResponse}>Kirim tanggapan</button><button type="button" className="wf-button" onClick={()=>setResponseSubject(null)}>Batal</button></div></div>}
      </div>;
    })}</div>
    {isBalai&&reviewFormOpen&&<div className="stage1-review-form" data-testid="calibration-review-form">
      <h4>Pemeriksaan · {reviewSubject}</h4>
      <Field label="Bagian yang diperiksa"><select aria-label="Bagian kalibrasi yang diperiksa" value={reviewSubject} onChange={e=>openReview(e.target.value as CalibrationReviewSubject)}>{CALIBRATION_REVIEW_SUBJECTS.map(subject=><option key={subject}>{subject}</option>)}</select></Field>
      <Field label="Hasil pemeriksaan"><select aria-label="Hasil pemeriksaan kalibrasi" value={reviewResult} onChange={e=>{setReviewResult(e.target.value as CalibrationReview['result']);setReviewError('');}}><option>Sesuai</option><option>Perlu klarifikasi</option><option>Ada ketidaksesuaian</option></select></Field>
      <Field label="Catatan pemeriksaan"><textarea aria-label="Catatan pemeriksaan kalibrasi" rows={3} value={reviewNote} onChange={e=>{setReviewNote(e.target.value);setReviewError('');}} placeholder="Tuliskan hasil pemeriksaan dan tindak lanjut yang diperlukan"/></Field>
      {(reviewResult==='Ada ketidaksesuaian'||reviewEvidence)&&<Field label="Referensi bukti"><input aria-label="Referensi bukti kalibrasi" value={reviewEvidence} onChange={e=>setReviewEvidence(e.target.value)} placeholder="Nomor dokumen atau bukti pendukung"/></Field>}
      {reviewResult==='Perlu klarifikasi'&&<p className="stage1-mini-note">Penyedia dapat memberikan penjelasan untuk diperiksa kembali.</p>}
      {reviewResult==='Ada ketidaksesuaian'&&<p className="stage1-mini-note">Ketidaksesuaian yang terbukti dapat ditindaklanjuti melalui Tindakan Perbaikan. Tidak dibuat otomatis.</p>}
      {reviewError&&<p role="alert" className="stage1-form-error">{reviewError}</p>}
      <div className="wf-toolbar"><button type="button" className="wf-button primary" data-testid="button-save-calibration-review" onClick={saveReview}>Simpan hasil pemeriksaan</button><button type="button" className="wf-button" onClick={()=>{setReviewFormOpen(false);setReviewError('');}}>Batal</button></div>
    </div>}
  </section>;
  const isSurveyReady = (type: SurveyType) => {
    const records = state.calibrations.filter(
      (record) => record.surveyType === type,
    );

    return (
      records.length > 0 &&
      records.every(isCalibrationRecordReady) &&
      !!state.calibrationChecklist[type] &&
      isDetailedFormComplete(type)
    );
  };

  const readySurveyCount = scopedSurveyTypes.filter(isSurveyReady).length;

  const allSurveyReady =
    scopedSurveyTypes.length > 0 &&
    readySurveyCount === scopedSurveyTypes.length;

  const setTypeCheck = (type: SurveyType, value: boolean) => {
    if (!canEditCalibration||state.calibrationChecklist[type]===value) return;

    commit(`Checklist kalibrasi & validasi ${type}`, type, (s) => ({
      ...invalidateDependentStages(
        s,
        `Checklist kalibrasi ${type} berubah; validasi dan audit harus diperiksa kembali.`,
      ),
      calibrationChecklist: {
        ...s.calibrationChecklist,
        [type]: value,
      },
    }));
  };

  const beginAddCalibration = () => {
    if (!canEditCalibration) return;

    const id = idNow("CAL");

    setCalEditId("");
    setCalFormRecordId(id);

    setNewCalibration({
      id,
      surveyType: activeSurvey,
      equipment: equipmentForSurvey[0] || "",
      condition: "Baik",
      calibrationKind: "Referensi tahunan",
      lastCalibrated: state.simulationDate,
      dueDate: state.simulationDate,
      qualificationValid: false,
      trainingVerified: false,
    });

    setCalFormOpen(true);
  };

  const beginEditCalibration = (record: CalibrationRecord) => {
    if (!canEditCalibration) return;

    setCalibrationSurvey(record.surveyType || activeSurvey);

    setCalEditId(record.id);
    setCalFormRecordId(record.id);
    setNewCalibration({
      ...record,
    });

    setCalFormOpen(true);
  };

  const cancelCalibrationForm = () => {
    setCalFormOpen(false);
    setCalEditId("");
    setCalFormRecordId("");
    setNewCalibration({});
  };

  const addCalibration = () => {
    if (!canEditCalibration) {
      setNotice(
        "Hanya Penyedia Jasa / Ketua Tim yang dapat mengubah penugasan alat dan personel.",
      );
      return;
    }

    const surveyType = newCalibration.surveyType || activeSurvey;

    if (
      !newCalibration.equipment?.trim() ||
      !newCalibration.serialNumber?.trim() ||
      !newCalibration.personInCharge?.trim() ||
      !newCalibration.dueDate?.trim()
    ) {
      setNotice(
        "Jenis survei, alat, nomor seri, PIC/personel, dan masa berlaku wajib dilengkapi.",
      );
      return;
    }

    if (!newCalibration.standardReference?.trim()) {
      setNotice("Metode atau standar kalibrasi/validasi wajib dicatat.");
      return;
    }

    const lastCalibrated =
      newCalibration.lastCalibrated || state.simulationDate;

    const dueDate = newCalibration.dueDate || state.simulationDate;

    if (dueDate < lastCalibrated) {
      setNotice(
        "Tanggal berlaku tidak boleh lebih awal dari tanggal kalibrasi.",
      );
      return;
    }

    const recordId = calFormRecordId || calEditId || idNow("CAL");

    const rec: CalibrationRecord = {
      id: recordId,
      equipment: newCalibration.equipment,
      serialNumber: newCalibration.serialNumber,
      year:
        Number(newCalibration.year) ||
        new Date(state.simulationDate).getFullYear(),
      condition: newCalibration.condition || "Baik",
      calibrationKind: newCalibration.calibrationKind || "Referensi tahunan",
      lastCalibrated,
      dueDate,
      personInCharge: newCalibration.personInCharge,
      qualificationValid: !!newCalibration.qualificationValid,
      trainingVerified: !!newCalibration.trainingVerified,
      standardReference: newCalibration.standardReference || "",
      certificateReference: newCalibration.certificateReference || "",
      surveyType,
    };

    commit(
      calEditId
        ? "Perbarui penugasan alat & personel"
        : "Tambah penugasan alat & personel",
      `${surveyType} · ${rec.equipment}`,
      (s) => ({
        ...invalidateDependentStages(
          s,
          "Data alat/personel berubah; kesiapan dan validasi produksi perlu diperiksa kembali.",
        ),

        calibrations: calEditId
          ? s.calibrations.map((item) => (item.id === calEditId ? rec : item))
          : [...s.calibrations, rec],
      }),
      calEditId
        ? "Penugasan alat/personel diperbarui."
        : "Penugasan alat/personel ditambahkan.",
    );

    setCalibrationSurvey(surveyType);

    cancelCalibrationForm();
  };

  const changeSurvey = (type: SurveyType) => {
    setCalibrationSurvey(type);
    setCalFormOpen(false);
    setCalEditId("");
    setCalFormRecordId("");
    setNewCalibration({});
    setReviewFormOpen(false);
    setResponseSubject(null);
    setReviewError('');
  };

  if (!canEditCalibration) {
    const isBalai = state.role === "PIC Balai / Pengguna Jasa";
    const isDirectorate = state.role === "Direktorat / Pusat";
    return (
      <section className="stage1-clean stage1-readonly" data-testid="stage1-readonly-workspace">
        {heading("Tahap 1", isBalai ? "Pemeriksaan Kalibrasi" : isDirectorate ? "Pemantauan Kalibrasi" : "Data Kalibrasi Paket", "")}
        <div className="stage1-topline">
          <span>{readySurveyCount} dari {scopedSurveyTypes.length} jenis survei lengkap dan tervalidasi</span>
          <Badge tone={allSurveyReady ? "good" : "warn"}>{allSurveyReady ? "Lengkap" : "Belum lengkap"}</Badge>
        </div>
        <div className="stage1-survey-picker" role="group" aria-label="Pilih jenis survei">
          {scopedSurveyTypes.map((type) => <button type="button" key={type} className={`wf-button ${activeSurvey === type ? "primary" : ""}`} onClick={() => changeSurvey(type)} aria-pressed={activeSurvey === type}>{type}</button>)}
        </div>
        <div className="stage1-summary-line">
          <h3>Alat dan personel · {activeSurvey}</h3>
          <Badge tone={isSurveyReady(activeSurvey) ? "good" : "warn"}>{isSurveyReady(activeSurvey) ? "Lengkap" : "Perlu dilengkapi"}</Badge>
        </div>
        {surveyRecords.length ? <div className="stage1-records">
          {surveyRecords.map((record) => <details className="stage1-record" key={record.id}>
            <summary><span><strong>{record.equipment}</strong><small>{record.serialNumber} · {record.personInCharge}</small></span><Badge tone={isCalibrationRecordReady(record) ? "good" : "warn"}>{isCalibrationRecordReady(record) ? "Siap" : "Perlu dilengkapi"}</Badge></summary>
            <dl className="stage1-facts">
              <div><dt>Kondisi</dt><dd>{record.condition}</dd></div>
              <div><dt>Kalibrasi</dt><dd>{record.calibrationKind}</dd></div>
              <div><dt>Tanggal kalibrasi</dt><dd>{record.lastCalibrated}</dd></div>
              <div><dt>Berlaku sampai</dt><dd>{record.dueDate}</dd></div>
              <div><dt>Metode / standar</dt><dd>{record.standardReference || "Belum tercatat"}</dd></div>
              <div><dt>Sertifikat</dt><dd>{record.certificateReference || "Belum tercatat"}</dd></div>
              <div><dt>Kualifikasi</dt><dd>{record.qualificationValid ? "Tercatat" : "Belum tercatat"}</dd></div>
              <div><dt>Pelatihan</dt><dd>{record.trainingVerified ? "Tercatat" : "Belum tercatat"}</dd></div>
            </dl>
            <div className="stage1-evidence-inline">
              <EvidenceAttachment packageId={state.project.id} evidenceId={`calibration-certificate-${record.id}`} label="Bukti kalibrasi" editable={false} compact />
              <EvidenceAttachment packageId={state.project.id} evidenceId={`calibration-person-${record.id}`} label="Bukti personel" editable={false} compact />
            </div>
          </details>)}
        </div> : <p className="stage1-empty">Belum ada penugasan alat atau personel untuk {activeSurvey}.</p>}
        <details className="stage1-inspection">
          <summary>Rincian checklist kalibrasi · {activeSurvey} <Badge tone={state.calibrationChecklist[activeSurvey] ? "good" : "warn"}>{state.calibrationChecklist[activeSurvey] ? "Tercatat" : "Belum lengkap"}</Badge></summary>
          <SourceAlignmentChecklist pciManual={state.productionTests.PCI.pciManual !== false} projectInfo={state.project} packageId={state.project.id} phase="calibration" surveyTypes={[activeSurvey]} role={state.role} editableRoles={["Penyedia Jasa / Ketua Tim"]} title={`Checklist Kalibrasi & Validasi · ${activeSurvey}`} defaultSurvey={activeSurvey} hideSurveySelector />
        </details>
        {reviewSummary(isBalai)}
        <div className="stage1-document-link">{baAccess("kalibrasi", "Lihat BA Kalibrasi & Validasi")}</div>
      </section>
    );
  }

  return (
    <section className="stage1-clean stage1-provider" data-testid="stage1-provider-workspace">
      {heading("Tahap 1", "Kalibrasi & Validasi Awal", "")}
      <div className="stage1-topline"><span>{readySurveyCount} dari {scopedSurveyTypes.length} jenis survei lengkap dan tervalidasi</span><Badge tone={allSurveyReady ? "good" : "warn"}>{allSurveyReady ? "Lengkap" : "Belum lengkap"}</Badge></div>

      {/* ================================================
            JENIS SURVEI
            ================================================ */}

      <div id="stage1-survey-work" />
      <div className="stage1-survey-container" aria-label="Jenis survei">
        <div className="calibration-survey-tabs">
          {scopedSurveyTypes.map((type) => (
            <button
              type="button"
              key={type}
              className={`wf-button ${activeSurvey === type ? "primary" : ""}`}
              onClick={() => changeSurvey(type)}
            >
              {type}

              <span
                className={`calibration-tab-status ${
                  isSurveyReady(type) ? "ready" : ""
                }`}
              >
                {isSurveyReady(type) ? "Lengkap" : "Belum lengkap"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ================================================
            ALAT & PERSONEL TERSIMPAN
            ================================================ */}

      <div className="stage1-work-section" aria-label={`Alat dan personel ${activeSurvey}`}><div className="stage1-section-title"><h3>Alat & personel · {activeSurvey}</h3></div>
        <div className="calibration-panel-heading">
          <div>
            <strong>Penugasan yang sudah tersimpan</strong>

          </div>

          {canEditCalibration && !calFormOpen && (
            <Button
              id="button-open-calibration-form"
              kind="primary"
              onClick={beginAddCalibration}
            >
              <Plus size={13} />
              Tambah penugasan
            </Button>
          )}
        </div>

        {surveyRecords.length === 0 ? (
          <div className="wf-callout warn">
            Belum ada alat/personel yang ditugaskan untuk {activeSurvey}.
          </div>
        ) : (
          <div className="calibration-record-list">
            {surveyRecords.map((record) => {
              const ready = isCalibrationRecordReady(record);

              return (
                <details className="calibration-record-card" key={record.id}>
                  <summary>
                    <div className="calibration-record-summary">
                      <div>
                        <strong>{record.equipment}</strong>

                        <span>
                          {record.serialNumber}
                          {" · "}
                          {record.personInCharge}
                        </span>
                      </div>

                      <Badge tone={ready ? "good" : "warn"}>
                        {ready ? "Siap" : "Perlu dilengkapi"}
                      </Badge>
                    </div>
                  </summary>

                  <div className="calibration-record-detail">
                    <div className="package-readonly-grid">
                      <div>
                        <small>Jenis survei</small>
                        <strong>{record.surveyType}</strong>
                      </div>

                      <div>
                        <small>Kondisi</small>
                        <strong>{record.condition}</strong>
                      </div>

                      <div>
                        <small>Kalibrasi</small>
                        <strong>{record.calibrationKind}</strong>
                      </div>

                      <div>
                        <small>Kalibrasi terakhir</small>
                        <strong>{record.lastCalibrated}</strong>
                      </div>

                      <div>
                        <small>Berlaku sampai</small>
                        <strong>{record.dueDate}</strong>
                      </div>

                      <div>
                        <small>PIC / personel</small>
                        <strong>{record.personInCharge}</strong>
                      </div>
                    </div>

                    <div className="calibration-record-flags">
                      <Badge tone={record.qualificationValid ? "good" : "warn"}>
                        {record.qualificationValid
                          ? "Kualifikasi tercatat"
                          : "Kualifikasi belum tercatat"}
                      </Badge>

                      <Badge tone={record.trainingVerified ? "good" : "warn"}>
                        {record.trainingVerified
                          ? "Pelatihan tercatat"
                          : "Pelatihan belum tercatat"}
                      </Badge>
                    </div>

                    <div className="calibration-record-evidence">
                      <EvidenceAttachment
                        packageId={state.project.id}
                        evidenceId={`calibration-certificate-${record.id}`}
                        label="Sertifikat / bukti kalibrasi"
                        editable={false}
                        compact
                      />

                      <EvidenceAttachment
                        packageId={state.project.id}
                        evidenceId={`calibration-person-${record.id}`}
                        label="Bukti kualifikasi / pelatihan"
                        editable={false}
                        compact
                      />
                    </div>

                    {canEditCalibration && (
                      <div className="wf-toolbar">
                        <Button
                          id={`button-edit-calibration-${record.id}`}
                          onClick={() => beginEditCalibration(record)}
                        >
                          Edit penugasan
                        </Button>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================
            FORM TAMBAH / EDIT
            hanya muncul ketika user meminta
            ================================================ */}

      {canEditCalibration && calFormOpen && (
        <section className="stage1-edit-form" aria-label="Form penugasan kalibrasi"><h3>{calEditId ? "Edit penugasan" : "Tambah penugasan"}</h3>

          <div className="wf-fields">
            <Field label="Jenis survei">
              <select
                value={newCalibration.surveyType || activeSurvey}
                onChange={(e) => {
                  const type = e.target.value as SurveyType;

                  setCalibrationSurvey(type);

                  setNewCalibration((previous) => ({
                    ...previous,
                    surveyType: type,
                    equipment: dailyEquipment[type]?.[0] || "",
                  }));
                }}
              >
                {scopedSurveyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Alat">
              <select
                value={newCalibration.equipment || ""}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    equipment: e.target.value,
                  }))
                }
              >
                {(
                  dailyEquipment[
                    (newCalibration.surveyType || activeSurvey) as SurveyType
                  ] || []
                ).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nomor seri">
              <input
                value={newCalibration.serialNumber || ""}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    serialNumber: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Tahun alat">
              <input
                type="number"
                value={newCalibration.year || ""}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    year: Number(e.target.value),
                  }))
                }
              />
            </Field>

            <Field label="Kondisi">
              <select
                value={newCalibration.condition || "Baik"}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    condition: e.target.value,
                  }))
                }
              >
                <option>Baik</option>
                <option>Perlu servis</option>
                <option>Tidak layak</option>
              </select>
            </Field>

            <Field label="Jenis kalibrasi">
              <select
                value={newCalibration.calibrationKind || "Referensi tahunan"}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    calibrationKind: e.target
                      .value as CalibrationRecord["calibrationKind"],
                  }))
                }
              >
                <option>Referensi tahunan</option>
                <option>Relatif berkala</option>
              </select>
            </Field>

            <Field label="PIC / personel">
              <input
                value={newCalibration.personInCharge || ""}
                placeholder="Nama personel"
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    personInCharge: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Kalibrasi terakhir">
              <input
                type="date"
                value={newCalibration.lastCalibrated || state.simulationDate}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    lastCalibrated: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Berlaku sampai">
              <input
                type="date"
                value={newCalibration.dueDate || state.simulationDate}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    dueDate: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Metode / standar kalibrasi">
              <input
                value={newCalibration.standardReference || ""}
                placeholder="Nomor / nama metode atau standar"
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    standardReference: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Nomor / referensi sertifikat">
              <input
                value={newCalibration.certificateReference || ""}
                placeholder="Nomor sertifikat / dokumen"
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    certificateReference: e.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="calibration-form-checks">
            <label className="wf-pill">
              <input
                type="checkbox"
                checked={!!newCalibration.qualificationValid}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    qualificationValid: e.target.checked,
                  }))
                }
              />
              Kualifikasi personel tercatat
            </label>

            <label className="wf-pill">
              <input
                type="checkbox"
                checked={!!newCalibration.trainingVerified}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    trainingVerified: e.target.checked,
                  }))
                }
              />
              Pelatihan / kompetensi tercatat
            </label>
          </div>

          <div className="calibration-form-evidence">
            <EvidenceAttachment
              packageId={state.project.id}
              evidenceId={`calibration-certificate-${calFormRecordId}`}
              label="Sertifikat / bukti kalibrasi"
              description="Unggah dokumen bila tersedia, atau catat nomor/referensi sertifikat pada form."
              editable
              compact
            />

            <EvidenceAttachment
              packageId={state.project.id}
              evidenceId={`calibration-person-${calFormRecordId}`}
              label="Bukti kualifikasi / pelatihan"
              description="Dokumen kualifikasi, kompetensi atau pelatihan personel."
              editable
              compact
            />
          </div>

          <div className="wf-toolbar calibration-form-actions">
            <Button
              id="button-cancel-calibration"
              onClick={cancelCalibrationForm}
            >
              Batal
            </Button>

            <Button
              id="button-save-calibration"
              kind="primary"
              onClick={addCalibration}
            >
              {calEditId ? "Simpan Perubahan" : "Simpan Penugasan"}
            </Button>
          </div>
        </section>
      )}


      <details className="stage1-inspection"><summary>Isi checklist kalibrasi · {activeSurvey} <span className="stage1-inspection-hint">Buka formulir</span></summary><SourceAlignmentChecklist pciManual={state.productionTests.PCI.pciManual!==false}
        projectInfo={state.project}
        packageId={state.project.id}
        phase="calibration"
        surveyTypes={[activeSurvey]}
        role={state.role}
        editableRoles={["Penyedia Jasa / Ketua Tim"]}
        title={`Checklist Kalibrasi & Validasi · ${activeSurvey}`}
        defaultSurvey={activeSurvey}
        hideSurveySelector
        onCompletionChange={(survey,complete)=>setSourceCompletion(old=>old[survey]===complete?old:{...old,[survey]:complete})}
        onAnswersChanged={()=>{if(state.calibrationChecklist[activeSurvey])setTypeCheck(activeSurvey,false);}}
      />
        {canEditCalibration && <div className="wf-toolbar"><button type="button" className="wf-button primary" data-testid="button-save-source-calibration" disabled={!sourceCompletion[activeSurvey]} onClick={() => { if (canEditCalibration && sourceCompletion[activeSurvey]) { setTypeCheck(activeSurvey, true); setNotice('Hasil checklist kalibrasi disimpan.'); } }}>Simpan hasil checklist {activeSurvey}</button></div>}
      </details>

      {reviewSummary(false)}
      <div className="stage1-next-row"><span>{allSurveyReady ? "Persiapan kalibrasi lengkap" : `Masih ada ${scopedSurveyTypes.length - readySurveyCount} jenis survei yang perlu dilengkapi atau divalidasi`}</span>
        <Button id="button-stage1-next" kind="primary" disabled={!allSurveyReady} onClick={() => onNavigate("/entry:Validasi produksi")}>Lanjut ke Tahap 2 <ArrowRight size={13}/></Button>
      </div>

      <div className="stage1-document-link">{baAccess("kalibrasi", "Buka BA Kalibrasi & Validasi")}</div>
    </section>
  );
}
