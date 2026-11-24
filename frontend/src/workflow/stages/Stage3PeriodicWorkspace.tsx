import { canEditPeriodicProvider, periodicCorrections, periodicCoverage, periodicHandoverTypes, submittedPeriodicRecords } from '../periodicRecords';
import { Stage3BMonitoring } from './Stage3BMonitoring';
import { Stage3BRecordTable } from './Stage3BRecordTable';
import { localPersistence } from '../repository/localPersistence';
import { switchWorkflowCyclePeriod } from "../cyclePeriodTransition";
import { PERIOD_SUBMISSION_ACTION, canSubmitPeriodicResults, periodicRecords, periodicSubmissionBlockers, submitPeriodicResults } from '../periodicSubmission';
import {recordPeriodicBa} from '../periodicDecision';
import {applyPeriodicFinding} from '../periodicFinding';
import {periodicSurveyTypes} from '../reviewReadiness';
import {evaluateStageGate} from '../workflowGate';
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {DocumentAttachments} from '../DocumentAttachments';
import {Stage3BSourceEvidenceIndex} from '../Stage3BSourceEvidenceIndex';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import { reviewSurvey } from "../periodicReview";
import {
  ClipboardCheck,
  ClipboardList,
  FileText,
} from "lucide-react";
import { useState } from "react";

import {
  CYCLE_PROTOCOLS,
  CYCLE_SHARED_PROTOCOLS,
  SurveyType,
  VervalCycle,
} from "../model";
import { Stage3BPeriodSelector } from "../Stage3BPeriodSelector";
import { Stage3BOperationalForms } from "../Stage3BOperationalForms";

import { useStage3BPeriod } from "../stages/useStage3BPeriod";
import type { WorkflowStageProps } from "./stageSupport";
import {
  Button,
  CheckRow,
  defaultCase,
  Field,
  invalidateVervalStages,
  Panel,
  Select,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";
import "./stage3b-redesign.css";

export function Stage3PeriodicWorkspace(props: WorkflowStageProps) {
  const { state: packageState, onUpdate, setNotice, onNavigate } = props;
  const [monitorPeriod, setMonitorPeriod] = useState<number>();
  const viewOnly = packageState.role === 'Direktorat / Pusat' || packageState.role === 'Admin';
  const state = viewOnly && monitorPeriod
    ? switchWorkflowCyclePeriod(packageState, monitorPeriod)
    : packageState;
  const { baAccess, commit, updateCycle } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage3PeriodicWorkspace:period-${state.activeCyclePeriod??1}`,{});
  const {
    activeStage3BPeriod,
    stage3bPeriodRange,
    setStage3BPeriodRange,
    switchStage3BPeriod,
  } = useStage3BPeriod(
    state.project.id,
    onUpdate,
    () => {},
    state.activeCyclePeriod,
  );
  const selectedCycleTypes = state.role === "Penyedia Jasa / Ketua Tim" ? periodicHandoverTypes(state) : periodicSurveyTypes(state);
  const [,refreshSource]=useState(0);
  const [reviewType, setReviewType] = useState<SurveyType>(
    selectedCycleTypes[0] ?? state.project.surveyTypes[0] ?? "IRI",
  );
  const selectedReviewType = selectedCycleTypes.includes(reviewType)
    ? reviewType
    : (selectedCycleTypes[0] ?? reviewType);
  const surveyReview = state.cycle.surveyReviews?.[selectedReviewType];
  const pciAi = state.productionTests.PCI.pciManual === false;
  const pciMetric = pciAi ? 'pciAiStandardDeviation' : 'pciManualMaxDifferencePercent';
  const pciLimit = pciAi ? 8 : 10;
  const evaluateCycleConsistency = (
    types: SurveyType[],
    iriCv: number | null,
    pciSd: number | null,
    reRating: VervalCycle["reRatingStatus"],
  ): VervalCycle["consistency"] => {
    if (!types.length) return "Belum Diperiksa";
    const iriPass =
      !types.includes("IRI") ||
      (iriCv !== null && Number.isFinite(iriCv) && iriCv >= 0 && iriCv <= 5);
    const pciPass =
      !types.includes("PCI") ||
      (pciSd !== null && Number.isFinite(pciSd) && pciSd >= 0 && pciSd <= pciLimit);
    if (
      (types.includes("IRI") && iriCv !== null && iriCv > 5) ||
      (types.includes("PCI") && pciSd !== null && pciSd > pciLimit) ||
      reRating === "Tidak Sesuai"
    )
      return "Tidak Konsisten";
    if (
      reRating === "Belum Diperiksa" ||
      (types.includes("IRI") && iriCv === null) ||
      (types.includes("PCI") && pciSd === null)
    )
      return "Belum Diperiksa";
    return iriPass && pciPass && reRating === "Sesuai"
      ? "Konsisten"
      : "Tidak Konsisten";
  };
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const consistencyResult = evaluateCycleConsistency(
    selectedCycleTypes,
    state.cycle.iriCoefficientVariation,
    state.cycle[pciMetric] ?? null,
    state.cycle.reRatingStatus,
  );
  const canPrepareCycle = state.role === "Penyedia Jasa / Ketua Tim";
  const canReviewCycle = state.role === "PIC Balai / Pengguna Jasa";
  const reviewPrerequisites=evaluateStageGate(state,'Tahap 2');
  const periodScope=activeStage3BPeriod===1?state.project.id:`${state.project.id}::period-${activeStage3BPeriod}`;
  const snapshot = submittedPeriodicRecords(state);
  const reviewLocks=[...(state.cycle.periodCompleted && !snapshot.confirmed ? ['Daftar rekaman penyerahan tidak dapat dipastikan. Periksa arsip atau lakukan penyerahan ulang jika BA belum tercatat.'] : []),...(state.cycle.providerResubmissionRequired?['Menunggu pengajuan ulang dari Penyedia.']:[]),...(!reviewPrerequisites.readyToComplete?reviewPrerequisites.blockers:[]),...(!selectedCycleTypes.length?['Lingkup jenis survei belum ditetapkan.']:[])];
  const sourceReady=(type:SurveyType,phase:string)=>{const result=sourceInspectionStatus(periodScope,type,phase,state.productionTests.PCI.pciManual!==false,{...state.project,periodStart:stage3bPeriodRange.start,periodEnd:stage3bPeriodRange.end});return result.complete&&(type!=='Lendutan'||!result.concerns.some(reason=>phase==='periodic14'||/CV ≤ 5%|Minimal 3 pengulangan/.test(reason)));};
  const sourceReviewReady=sourceReady(selectedReviewType,'periodic14');
  const conformityLock=!state.cycle.periodCompleted?'Menunggu penyerahan Penyedia':!sourceReviewReady?'Lengkapi pemeriksaan bersama':'';
  const coverage = periodicCoverage(state);
  const submissionTypes = coverage.filter(entry => entry.recorded > 0).map(entry => entry.type);
  const protocolsForTypes = (types: SurveyType[]) => [
    ...types.flatMap((t) =>
      CYCLE_PROTOCOLS[t].map((p) => `${t} · ${p}`),
    ),
    ...CYCLE_SHARED_PROTOCOLS,
  ];
  const allProtocols = protocolsForTypes(selectedCycleTypes);
  const handoverProtocols = protocolsForTypes(submissionTypes);
  const checked = allProtocols.filter(
    (x) => state.cycle.checkedProtocols[x],
  ).length;
  const openPeriodFindings = periodicCorrections(state).filter(item => item.status !== 'Ditutup');
  const baReviewBlockers=[...reviewLocks,
    ...(!stage3bPeriodRange.start||!stage3bPeriodRange.end?['Periode data belum tersedia. Penyedia perlu melengkapi tanggal survei.']:[]),
    ...(!state.cycle.periodCompleted?['Penyedia belum menyerahkan hasil periode.']:[]),
    ...selectedCycleTypes.flatMap(type=>['consistency','internal','periodic14'].filter(phase=>!sourceReady(type,phase)).map(phase=>`${type}: ${phase==='consistency'?'Konsistensi':phase==='internal'?'V&V Internal':'V&V Bersama'} belum lengkap.`)),
    ...(checked!==allProtocols.length?['Pemeriksaan pelaksanaan belum lengkap.']:[]),
    ...(consistencyResult!=='Konsisten'?['Hasil konsistensi belum memenuhi pemeriksaan.']:[]),
    ...(state.cycle.userReview!=='Sesuai'||selectedCycleTypes.some(type=>state.cycle.surveyReviews?.[type]?.decision!=='Sesuai')||state.cycle.reviewPendingTypes?.length?['Review Balai masih perlu diselesaikan atau diulang.']:[]),
    ...(openPeriodFindings.length?['Selesaikan tindak lanjut temuan periode sebelum mencatat BA.']:[]),
    ...(!(draft.cycleBa??state.cycle.certificateId).trim()?['Referensi BA belum diisi.']:[])];
  const updateConsistencyMetric = (
    key: "iriCoefficientVariation" | "pciManualMaxDifferencePercent" | "pciAiStandardDeviation",
    value: number | null,
  ) => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa diperlukan untuk mencatat hasil konsistensi.",
      );
      return;
    }
    const iriCv =
      key === "iriCoefficientVariation"
        ? value
        : state.cycle.iriCoefficientVariation;
    const pciSd =
      key === pciMetric
        ? value
        : (state.cycle[pciMetric] ?? null);
    updateCycle(
      {
        [key]: value,
        consistency: evaluateCycleConsistency(
          selectedCycleTypes,
          iriCv,
          pciSd,
          state.cycle.reRatingStatus,
        ),
      },
      `Catat ${key === "iriCoefficientVariation" ? "IRI CV" : pciAi ? "SD PCI AI" : "Selisih PCI Manual (%)"} verval`,
    );
  };
  const updateReRating = (value: VervalCycle["reRatingStatus"]) => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa diperlukan untuk mencatat penilaian ulang.",
      );
      return;
    }
    updateCycle(
      {
        reRatingStatus: value,
        consistency: evaluateCycleConsistency(
          selectedCycleTypes,
          state.cycle.iriCoefficientVariation,
          state.cycle[pciMetric] ?? null,
          value,
        ),
      },
      "Catat kesesuaian penilaian ulang",
    );
  };
  const updateProtocol = (key: string, value: boolean) => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa diperlukan untuk mengisi protokol verval.",
      );
      return;
    }
    updateCycle(
      { checkedProtocols: { ...state.cycle.checkedProtocols, [key]: value } },
      "Checklist protokol verval",
    );
  };
  const holdLast14Days = () => {
    if(!canPrepareCycle){setNotice("Penyedia mencatat penahanan data sesuai hasil pemeriksaan.");return;}
    if(!stage3bPeriodRange.start||!stage3bPeriodRange.end){setNotice("Pilih rentang periode terlebih dahulu.");return;}
    const holdScope = state.cycle.periodCompleted ? [selectedReviewType] : selectedCycleTypes;
    const failedTypes = holdScope.filter(
      (type) =>
        (type === "IRI" && (state.cycle.iriCoefficientVariation ?? 0) > 5) ||
        (type === "PCI" &&
          (state.cycle[pciMetric] ?? 0) > pciLimit) ||
        state.cycle.reRatingStatus === "Tidak Sesuai",
    );
    const heldIds = state.dailyRecords
      .filter(
        (record) =>
          record.state === "Tercatat" &&
          (failedTypes.length ? failedTypes : holdScope).includes(
            record.surveyType,
          ) &&
          state.project.routes.includes(record.road) &&
          (!state.cycle.affectedTool ||
            record.tool === state.cycle.affectedTool) &&
          record.date>=stage3bPeriodRange.start &&
          record.date<=stage3bPeriodRange.end,
      )
      .map((record) => record.id);
    commit(
      "Tahan data 14 hari terakhir",
      heldIds.join(", ") || state.project.packageName,
      (s) => {
        const invalidated = invalidateVervalStages(
          s,
          "Verval tidak konsisten; selesaikan koreksi dan ulangi validasi, penyerahan, dan audit.",
        );
        return {
          ...invalidated,
          cycle: {
            ...s.cycle,
            consistency: "Tidak Konsisten",
            certificateId: "",
            heldRecordIds: [...new Set([...s.cycle.heldRecordIds, ...heldIds])],
          },
          dailyRecords: s.dailyRecords.map((record) =>
            heldIds.includes(record.id)
              ? { ...record, state: "Ditahan" }
              : record,
          ),
        };
      },
      heldIds.length
        ? "Data lapangan pada rentang 14 hari terakhir ditahan"
        : "Konsistensi gagal; belum ada catatan lapangan di rentang 14 hari untuk ditandai",
    );
  };
  const saveCycle = () => {
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "BA verval berkala dicatat oleh PIC Balai / Pengguna Jasa setelah review.",
      );
      return;
    }
    if(baReviewBlockers.length){setNotice(baReviewBlockers.join(' '));return;}
    const certificateId = (draft.cycleBa ?? state.cycle.certificateId).trim();
    commit("Catat BA verval Balai 14 hari", certificateId,
      (s) => recordPeriodicBa(s, certificateId));
    setNotice("BA verval Balai dicatat pada paket saat ini.");
  };
  const updateFieldValidation = (
    key: "bridgeFieldValidation" | "finalPeriodValidation",
    value: boolean,
  ) => {
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "Peran PIC Balai / Pengguna Jasa diperlukan untuk validasi lapangan dan periode.",
      );
      return;
    }
    updateCycle(
      { [key]: value },
      key === "bridgeFieldValidation"
        ? "Validasi lapangan jembatan"
        : "Validasi akhir periode",
    );
  };
  const reviewEvidence = (patch: Partial<VervalCycle>) => {
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "Pemeriksaan proses, validasi lapangan dan bukti akhir dicatat oleh Pengguna Jasa.",
      );
      return;
    }
    if (!state.cycle.periodCompleted || reviewLocks.length) {
      setNotice(reviewLocks.join(' ') || 'Menunggu penyerahan Penyedia.');
      return;
    }
    if(!selectedCycleTypes.includes(selectedReviewType)){setNotice('Pilih jenis survei yang tersedia pada periode ini.');return;}
    if(patch.userReview==='Sesuai'&&(!state.cycle.periodCompleted||!sourceReady(selectedReviewType,'periodic14'))){
      setNotice('Selesaikan pemeriksaan bersama dan tunggu hasil periode Penyedia sebelum mencatat Sesuai.');return;
    }
    if(patch.userReview==='Temuan'&&!(surveyReview?.note??'').trim()){setNotice('Uraian temuan wajib diisi sebelum meminta perbaikan. Catatan biasa tidak otomatis membuat temuan.');return;}
    const scopedPatch =
      "userReview" in patch || "userReviewNote" in patch
        ? reviewSurvey(
            state.cycle,
            selectedReviewType,
            patch,
            state.simulationDate,
            selectedCycleTypes,
          )
        : patch;
    if (
      patch.userReview === "Temuan" &&
      !state.corrections.some(
        (c) => c.source === "Temuan proses verval" && c.status !== "Ditutup" && c.surveyType===selectedReviewType && (c.cyclePeriod===undefined||c.cyclePeriod===activeStage3BPeriod),
      )
    ) {
      const c = {
        ...defaultCase(state),
        source: "Temuan proses verval",
        cyclePeriod:activeStage3BPeriod,
        surveyType: selectedReviewType,
        blockedStage: "Verval 14 hari",
        returnStage: "Verval 14 hari",
        rejectionReason:
          surveyReview?.note ||
          "Pengguna Jasa menemukan ketidaksesuaian proses/hasil verval",
      };
      commit("Buka kasus dari pemeriksaan proses verval", c.id,
        (s) => applyPeriodicFinding(s, selectedReviewType, c.id));
    } else {
      updateCycle(scopedPatch,"Catat pemeriksaan Pengguna Jasa dan bukti akhir periode");
    }
  };

  const providerTasks = [
    ['consistency', 'Konsistensi'],
    ['internal', 'V&V Internal'],
    ['documents', 'Bukti & BA'],
    ['submission', 'Penyerahan ke Balai'],
  ] as const;
  const balaiTasks = [
    ['results', 'Hasil Penyedia'],
    ['periodic14', 'Pemeriksaan Bersama'],
    ['decision', 'Keputusan & Tindak Lanjut'],
    ['documents', 'BA'],
  ] as const;
  const tasks: ReadonlyArray<readonly [string, string]> = canPrepareCycle ? providerTasks : canReviewCycle ? balaiTasks : [];
  const [task, setTask] = useState<string>(tasks[0]?.[0] ?? 'monitoring');
  const [providerResult, setProviderResult] = useState<'consistency' | 'internal' | ''>('');
  const activeTask = tasks.some(([key]) => key === task) ? task : tasks[0]?.[0];
  const canInspect = canReviewCycle && state.cycle.periodCompleted && reviewLocks.length === 0;
  const { records: periodRecords, eligible: eligibleRecords, held, incomplete } = periodicRecords(state, selectedCycleTypes);
  const visibleRecords = canReviewCycle
    ? state.cycle.providerResubmissionRequired ? [] : snapshot.records
    : periodRecords;
  const canEditProviderSurvey = canEditPeriodicProvider(state, selectedReviewType);
  const visibleSurveyRecords = activeTask === 'submission' || activeTask === 'results'
    ? visibleRecords
    : visibleRecords.filter(record => record.surveyType === selectedReviewType);
  const status = state.cycle.providerResubmissionRequired ? 'Perlu diajukan ulang'
    : state.cycle.userReview === 'Temuan' || openPeriodFindings.length ? 'Ada temuan'
    : state.cycle.requiresReview ? 'Perlu diperiksa ulang'
    : state.cycle.periodCompleted && !snapshot.confirmed ? 'Arsip penyerahan'
    : state.cycle.certificateId ? 'BA tercatat'
    : state.cycle.periodCompleted ? 'Diserahkan' : 'Belum diserahkan';
  const submissionBlockers = activeTask === 'submission' ? periodicSubmissionBlockers(state) : [];
  const phase = activeTask === 'consistency' || activeTask === 'internal' || activeTask === 'periodic14' ? activeTask : null;
  const history = (<details className="stage3b-disclosure">
            <summary >Riwayat periode</summary>
            <div className="wf-body">
              {(state.reviewActivityHistory ?? []).filter(entry => entry.stage === 'Tahap 3B' &&
                entry.period === activeStage3BPeriod).map(entry => (
                <p key={entry.id}>{entry.recordedAt.slice(0, 10)} · {entry.actor} · {entry.status}
                  {entry.note && <> · {entry.note}</>}</p>
              ))}
              {(state.cycleRevisions?.[String(activeStage3BPeriod)] ?? [])
                .filter(entry => entry.certificateId).map((entry, index) => (
                  <p key={index}>BA terdahulu · {entry.certificateId} · {entry.userReview}</p>
              ))}
            </div>
          </details>);
  const attachments = (<DocumentAttachments compactPeriodic scope={`${state.project.id}:stage3b-${activeStage3BPeriod}`}
            categories={['Bukti repeatability / hasil pemeriksaan berkala', 'Bukti pendukung periode']}
            legacyEvidenceIds={[`stage3b-repeatability-${activeStage3BPeriod}`, `stage3b-supporting-evidence-${activeStage3BPeriod}`]}
            editable={false} />);
  return (
    <section className="stage3b-workspace">
      <header className="stage3b-header">
        <div>
          <p className="wf-eyebrow">Tahap 3B · V&V berkala</p>
          <h1 className="wf-title">Verifikasi dan Validasi Berkala</h1>
        </div>
        <span className="stage3b-status">{status}</span>
      </header>
      <Stage3BPeriodSelector
        packageId={state.project.id}
        activePeriod={activeStage3BPeriod}
        onPeriodChange={viewOnly ? setMonitorPeriod : switchStage3BPeriod}
        onRangeChange={setStage3BPeriodRange}
        surveyStartDate={state.project.surveyStartDate}
        surveyEndDate={state.project.surveyEndDate}
        editable={canPrepareCycle}
        onScheduleChange={({startDate,endDate})=>{
          if(state.role!=='Penyedia Jasa / Ketua Tim')return;
          commit('Lengkapi jadwal survei','Jadwal paket',current=>{
            if(current.role!=='Penyedia Jasa / Ketua Tim')return current;
            const reason='Jadwal survei dilengkapi; periksa keterkaitan periode pada rekaman dan keputusan lama.';
            return {...current,project:{...current.project,surveyStartDate:startDate,surveyEndDate:endDate},
              cycle:current.cycle.certificateId?{...current.cycle,requiresReview:true,reviewReason:reason}:current.cycle,
              cycleHistory:Object.fromEntries(Object.entries(current.cycleHistory??{}).map(([key,cycle])=>[key,cycle.certificateId?{...cycle,requiresReview:true,reviewReason:reason}:cycle]))};
          });
        }}
      />

      {tasks.length > 0 && (
        <nav className="stage3b-work-selector" aria-label="Pekerjaan Tahap 3B">
          {tasks.map(([key, label]) => (
            <button type="button" key={key} className={`stage3b-work-choice ${activeTask === key ? 'active' : ''}`}
              aria-current={activeTask === key ? 'page' : undefined} onClick={() => setTask(key)}>
              {label}
            </button>
          ))}
        </nav>
      )}
      {viewOnly ? (
        <Stage3BMonitoring state={state} surveys={selectedCycleTypes}
          notes={state.role === 'Direktorat / Pusat' ? props.periodicNotes?.(state) : undefined}
          attachments={attachments} history={history} />
      ) : <div className="stage3b-work-content">
        {activeTask === 'documents' && props.periodicNotes?.(state)}
        {state.cycle.requiresReview && (activeTask === 'submission' || activeTask === 'decision') && <p role="status">{state.cycle.reviewReason}</p>}
        {((canPrepareCycle && activeTask !== 'documents') ||
            (canReviewCycle && state.cycle.periodCompleted && activeTask === 'results')) && (
          <details className="stage3b-disclosure">
            <summary>Rekaman Tahap 3A · {visibleSurveyRecords.length} rekaman</summary>
            <Stage3BRecordTable records={visibleSurveyRecords} status={record =>
              held.includes(record) ? 'Ditahan'
                : incomplete.includes(record) ? 'Belum lengkap'
                : state.cycle.submittedRecordIds?.includes(record.id)
                  ? state.cycle.providerResubmissionRequired ? 'Perlu diajukan ulang' : 'Diserahkan'
                  : record.state
            } />
          </details>
        )}
        {canReviewCycle && !canInspect && <p role="status">
          {state.cycle.periodCompleted ? reviewLocks[0] : 'Menunggu penyerahan hasil periode dari Penyedia.'}
        </p>}

        {canInspect && (activeTask === 'periodic14' || activeTask === 'decision') && (
          <div className="wf-fields">
              <Field label="Jenis survei">
                <Select
                  id="select-periodic-review-survey"
                  value={selectedReviewType}
                  disabled={!selectedCycleTypes.length}
                  options={selectedCycleTypes}
                  onChange={(value) => setReviewType(value as SurveyType)}
                />
              </Field>
          </div>
        )}
      {phase && canPrepareCycle && !canEditProviderSurvey && (
        <p className="stage3b-notice" role="status">Hasil sudah diserahkan. Isian dapat diperbarui setelah usulan perbaikan disetujui atau saat pengajuan ulang diperlukan.</p>
      )}
      {phase && (canPrepareCycle || canInspect) && <Stage3BOperationalForms readOnly={canPrepareCycle && !canEditProviderSurvey} phase={phase} selectedSurvey={selectedReviewType} onSurveyChange={setReviewType} periodStart={stage3bPeriodRange.start} periodEnd={stage3bPeriodRange.end} pciManual={state.productionTests.PCI.pciManual!==false}
        key={`${state.project.id}:${activeStage3BPeriod}`}
        projectInfo={state.project}
        packageId={
          activeStage3BPeriod === 1
            ? state.project.id
            : `${state.project.id}::period-${activeStage3BPeriod}`
        }
        surveyTypes={
          selectedCycleTypes.length
            ? selectedCycleTypes
            : state.project.surveyTypes
        }
        role={state.role}
        onAnswersChanged={() => {
          refreshSource(value=>value+1);
          if (!(canPrepareCycle && state.cycle.periodCompleted) && !state.cycle.certificateId &&
              (!surveyReview || surveyReview.decision === 'Belum Diperiksa')) return;
          commit(
            "Perbarui checklist periode",
            `Periode ${activeStage3BPeriod}`,
            (current) => ({
              ...current,
              cycle: (current.role === "Penyedia Jasa / Ketua Tim" && current.cycle.periodCompleted ||
                current.cycle.certificateId || current.cycle.surveyReviews?.[selectedReviewType])
                ? {
                    ...current.cycle,
                    requiresReview: true,
                    reviewPendingTypes:[...new Set([...(current.cycle.reviewPendingTypes??[]),selectedReviewType])],
                    reviewReason:
                      "Jawaban checklist periode berubah; periksa dan catat ulang BA.",
                  }
                : current.cycle,
            }),
          );
        }}
      />}

        {canPrepareCycle && canEditProviderSurvey && activeTask === 'consistency' && (
          <details className="wf-panel">
            <summary className="wf-panel-head">Hasil konsistensi dan penahanan data</summary>
            <div className="wf-body">
            {selectedReviewType === "IRI" && (
              <Field label="IRI CV (maks. 5%)">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  data-testid="input-cycle-iri-cv"
                  value={state.cycle.iriCoefficientVariation ?? ""}
                  readOnly={!canPrepareCycle}
                  onChange={(e) =>
                    updateConsistencyMetric(
                      "iriCoefficientVariation",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </Field>
            )}
            {selectedReviewType === "PCI" && (
              <Field label={pciAi ? "Standar deviasi PCI AI (maks. 8)" : "Selisih PCI Manual (maks. 10%)"}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  data-testid="input-cycle-pci-ai-sd"
                  value={state.cycle[pciMetric] ?? ""}
                  readOnly={!canPrepareCycle}
                  onChange={(e) =>
                    updateConsistencyMetric(
                      pciMetric,
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </Field>
            )}
            <Field label="Penilaian ulang visual">
              <Select
                id="select-cycle-rerating"
                value={state.cycle.reRatingStatus}
                options={["Belum Diperiksa", "Sesuai", "Tidak Sesuai"]}
                disabled={!canPrepareCycle}
                onChange={(v) =>
                  updateReRating(v as VervalCycle["reRatingStatus"])
                }
              />
            </Field>
            <div
              className={`wf-callout ${consistencyResult === "Konsisten" ? "" : "danger"}`}
              data-testid="cycle-consistency-result"
            >
              Hasil konsistensi · <strong>{consistencyResult}</strong>
            </div>
            <Field label="Alat atau petugas penilai terkait" full>
              <input
                data-testid="input-cycle-affected-tool"
                value={state.cycle.affectedTool ?? ""}
                readOnly={!canPrepareCycle}
                onChange={(e) =>
                  updateCycle(
                    { affectedTool: e.target.value },
                    "Identifikasi alat terkait HOLD",
                  )
                }
                placeholder="Nama alat, bila hanya satu alat yang terkait"
              />
            </Field>
            <div className="wf-toolbar" style={{ marginTop: 10 }}>
              <Button
                id="button-cycle-hold"
                kind="danger"
                disabled={
                  !canPrepareCycle || consistencyResult !== "Tidak Konsisten"
                }
                onClick={holdLast14Days}
              >
                Tahan data periode
              </Button>
              <Button
                id="button-cycle-create-case"
                disabled={
                  !canPrepareCycle ||
                  consistencyResult !== "Tidak Konsisten" ||
                  state.corrections.some(
                    (item) =>
                      item.source === "Konsistensi gagal" &&
                      item.surveyType === selectedReviewType &&
                      item.cyclePeriod === activeStage3BPeriod &&
                      item.status !== "Ditutup",
                  )
                }
                onClick={() => {
                  if (state.role !== "Penyedia Jasa / Ketua Tim") {
                    setNotice("Peran Penyedia Jasa diperlukan.");
                    return;
                  }
                  const c = {
                    ...defaultCase(state),
                    source: "Konsistensi gagal",
                    surveyType: selectedReviewType,
                    cyclePeriod: activeStage3BPeriod,
                    blockedStage: "Verval 14 hari",
                    returnStage: "Verval 14 hari",
                    rejectionReason: "Hasil verval tidak konsisten",
                  };
                  commit("Buka kasus verval", c.id, (s) => ({
                    ...s,
                    corrections: [c, ...s.corrections],
                  }));
                }}
              >
                Buka kasus
              </Button>
            </div>

            </div>
          </details>
        )}
        {canPrepareCycle && activeTask === 'submission' && (
          <Panel title="Kesiapan penyerahan" icon={ClipboardList}>
            <div className="stage3b-readiness-counts" aria-label="Ringkasan rekaman">
              <span><strong>{eligibleRecords.length}</strong> layak</span>
              <span><strong>{incomplete.length}</strong> belum lengkap</span>
              <span><strong>{held.length}</strong> ditahan</span>
            </div>
            {canSubmitPeriodicResults(state) && <details className="stage3b-coverage">
              <summary>Cakupan per survei ({coverage.filter(entry => entry.eligible > 0).length}/{coverage.length})</summary>
              <ul className="stage3b-coverage-list">{coverage.map(entry =>
                <li key={entry.type}>
                  <strong>{entry.type}</strong>
                  <span>{entry.recorded ? `${entry.eligible} dari ${entry.recorded} layak` : 'Belum ada rekaman'}</span>
                </li>)}
              </ul>
            </details>}
            {!canSubmitPeriodicResults(state) ? <p role="status">Hasil periode telah diserahkan.</p> : <>
              <details className="stage3b-protocols">
                <summary>Pemeriksaan pelaksanaan ({handoverProtocols.filter(protocol => state.cycle.checkedProtocols[protocol]).length}/{handoverProtocols.length})</summary>
                {handoverProtocols.map(protocol => (
                  <CheckRow key={protocol} id={`cycle-protocol-${testId(protocol)}`} label={protocol}
                    checked={!!state.cycle.checkedProtocols[protocol]} disabled={!canEditPeriodicProvider(state)} onChange={value => updateProtocol(protocol, value)} />
                ))}
              </details>
              {!!submissionBlockers.length && <div className="stage3b-readiness-issues" role="status">
                <strong>{submissionBlockers.length} persyaratan belum terpenuhi</strong>
                <p>{submissionBlockers[0]}</p>
                {submissionBlockers.length > 1 && <details>
                  <summary>Lihat semua persyaratan</summary>
                  <ul>{submissionBlockers.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}</ul>
                </details>}
              </div>}
              <Button id="button-cycle-submit" kind="primary" disabled={submissionBlockers.length > 0}
                onClick={() => {
                  if (submissionBlockers.length) return;
                  commit(PERIOD_SUBMISSION_ACTION, state.project.packageName, submitPeriodicResults);
                }}>
                {state.cycle.periodCompleted ? "Ajukan ulang hasil" : "Serahkan hasil"}
              </Button>
            </>}
          </Panel>
        )}
        {canInspect && activeTask === 'decision' && (
          <Panel title="Keputusan per jenis survei" icon={ClipboardCheck}>
            <div className="wf-fields">
              <Field label="Catatan hasil pemeriksaan" full>
                <textarea
                  data-testid="input-cycle-user-review-note"
                  disabled={reviewLocks.length>0}
                  rows={3}
                  value={surveyReview?.note ?? ""}
                  onChange={(e) =>
                    reviewEvidence({ userReviewNote: e.target.value })
                  }
                  placeholder="Tuliskan catatan Balai, temuan, atau alasan keputusan"
                />
              </Field>
              <Field label="Keputusan Balai">
                <Select
                  id="select-cycle-user-review"
                  disabled={reviewLocks.length>0}
                  value={state.cycle.reviewPendingTypes?.includes(selectedReviewType)?'Belum Diperiksa':surveyReview?.decision ?? "Belum Diperiksa"}
                  options={["Belum Diperiksa", "Sesuai", "Temuan"]}
                  disabledOptions={conformityLock?{Sesuai:conformityLock}:{}}
                  onChange={(v) =>
                    reviewEvidence({
                      userReview: v as VervalCycle["userReview"],
                    })
                  }
                />
              </Field>
              {selectedReviewType === "Jembatan" && (
                <>
                  <Field label="Cakupan validasi jembatan (%)">
                    <input
                      data-testid="input-cycle-bridge-percent"
                      disabled={reviewLocks.length>0}
                      type="number"
                      min="0"
                      max="100"
                      value={state.cycle.bridgeValidatedPercent ?? ""}
                      onChange={(e) =>
                        reviewEvidence({
                          bridgeValidatedPercent: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Referensi laporan validasi lapangan">
                    <input
                      data-testid="input-cycle-bridge-report"
                      disabled={reviewLocks.length>0}
                      value={state.cycle.bridgeValidationReport ?? ""}
                      onChange={(e) =>
                        reviewEvidence({
                          bridgeValidationReport: e.target.value,
                        })
                      }
                    />
                  </Field>
                </>
              )}
              {state.cycle.periodCompleted && (
                <>
                  <Field label="Lokasi uji validasi akhir">
                    <input
                      data-testid="input-cycle-final-location"
                      disabled={reviewLocks.length>0}
                      value={state.cycle.finalValidationLocation ?? ""}
                      onChange={(e) =>
                        reviewEvidence({
                          finalValidationLocation: e.target.value,
                        })
                      }
                      placeholder="Isi bila pemeriksaan akhir dilakukan"
                    />
                  </Field>
                  <CheckRow
                    id="cycle-tool-unchanged"
                    disabled={reviewLocks.length>0}
                    label="Uji akhir membuktikan alat tidak berubah"
                    checked={!!state.cycle.finalToolUnchanged}
                    onChange={(v) => reviewEvidence({ finalToolUnchanged: v })}
                  />
                </>
              )}
            {selectedCycleTypes.includes("Jembatan") && (
              <CheckRow
                id="cycle-bridge-field-validation"
                label="Validasi lapangan jembatan oleh Pengguna Jasa"
                checked={state.cycle.bridgeFieldValidation}
                disabled={!canReviewCycle}
                onChange={(v) =>
                  updateFieldValidation("bridgeFieldValidation", v)
                }
              />
            )}
            {state.cycle.periodCompleted && (
              <CheckRow
                id="cycle-final-period-validation"
                label="Validasi periode akhir"
                checked={state.cycle.finalPeriodValidation}
                disabled={!canReviewCycle}
                onChange={(v) =>
                  updateFieldValidation("finalPeriodValidation", v)
                }
              />
            )}

            </div>
          </Panel>
        )}
        {canReviewCycle && state.cycle.periodCompleted && activeTask === 'results' && (
          <Panel title="Bukti pemeriksaan Penyedia" icon={ClipboardCheck}>
            <div className="wf-fields">
              <Field label="Jenis survei">
                <Select id="select-periodic-provider-results-survey" value={selectedReviewType}
                  options={selectedCycleTypes} onChange={value => setReviewType(value as SurveyType)} />
              </Field>
              <label className="wf-field">Formulir Penyedia
                <select aria-label="Formulir Penyedia" value={providerResult} onChange={event => setProviderResult(
                  event.target.value === 'consistency' ? 'consistency' :
                    event.target.value === 'internal' ? 'internal' : '',
                )}>
                  <option value="">Pilih formulir</option>
                  <option value="consistency">Konsistensi</option>
                  <option value="internal">V&V Internal</option>
                </select>
              </label>
            </div>
            {providerResult && <Stage3BOperationalForms phase={providerResult} packageId={periodScope}
              surveyTypes={selectedCycleTypes} role={state.role} selectedSurvey={selectedReviewType}
              periodStart={stage3bPeriodRange.start} periodEnd={stage3bPeriodRange.end}
              projectInfo={state.project} pciManual={!pciAi} />}
          </Panel>
        )}
        {(activeTask === 'results' && state.cycle.periodCompleted) || activeTask === 'documents' || (activeTask === 'decision' && openPeriodFindings.length > 0) ? (
          <Panel title={activeTask === 'documents' ? 'Dokumen dan riwayat periode' : 'Hasil periode'} icon={FileText}>
            <dl className="stage3b-result-facts">
              <div><dt>BA V&V 2-Mingguan</dt><dd>{state.cycle.certificateId || 'Belum tercatat'}</dd></div>
            </dl>
            {state.role !== 'Admin' && <div className="stage3b-result-list" aria-label="Hasil per survei">
              {selectedCycleTypes.map(type => {
                const review = state.cycle.surveyReviews?.[type];
                const decision = state.cycle.reviewPendingTypes?.includes(type)
                  ? 'Perlu diperiksa ulang' : review?.decision ?? 'Belum diperiksa';
                return <div className="stage3b-result-row" key={type}>
                  <strong>{type}</strong>
                  <span>{decision}</span>
                  {review?.note && <details>
                    <summary>Catatan</summary>
                    <p>{review.note}</p>
                  </details>}
                </div>;
              })}
            </div>}
            {activeTask === 'decision' && openPeriodFindings.length > 0 && (
              <div className="stage3b-finding-actions">
                <strong>Tindak lanjut temuan ({openPeriodFindings.length})</strong>
                <ul>{openPeriodFindings.map(finding => (
                  <li key={finding.id}>
                    <button type="button" className="wf-button" onClick={() => {
                      try {
                        localPersistence.setItem(`jala-correction-selection:${state.project.id}`, finding.id);
                      } catch {
                        setNotice('Pilihan kasus tidak dapat disimpan. Pilih kasus dari daftar.');
                      }
                      onNavigate('/actions:Koreksi berbukti');
                    }}>
                      {finding.surveyType} · {finding.status} · {finding.id}
                    </button>
                  </li>
                ))}</ul>
              </div>
            )}
          </Panel>
        ) : null}
        {activeTask === 'documents' && <Panel title="Bukti formulir yang sudah ada" icon={FileText}><Stage3BSourceEvidenceIndex packageId={state.project.id} period={activeStage3BPeriod} surveys={selectedCycleTypes} pciManual={!pciAi}/></Panel>}
        {activeTask === 'documents' && attachments}
        {activeTask === 'documents' && (
          history
        )}
        {activeTask === 'documents' && (
          <Panel title="Berita acara" icon={FileText}>
            {selectedCycleTypes.length > 1 && <label className="wf-field">
              Jenis survei untuk BA
              <select value={selectedReviewType} onChange={event => setReviewType(event.target.value as SurveyType)}>
                {selectedCycleTypes.map(type => <option key={type}>{type}</option>)}
              </select>
            </label>}
            <div className="wf-toolbar">
              {baAccess("konsistensi", "BA Konsistensi", activeStage3BPeriod, { survey: selectedReviewType })}
              {baAccess("internal", "BA V&V Internal", activeStage3BPeriod, { survey: selectedReviewType })}
              {baAccess("duaMingguan", "BA V&V 2-Mingguan", activeStage3BPeriod)}
            </div>
            {canInspect && <>
              <Field label="Nomor BA V&V 2-Mingguan yang diterbitkan">
                <input data-testid="input-cycle-ba" value={draft.cycleBa ?? state.cycle.certificateId}
                  onChange={event => saveText('cycleBa', event.target.value)} />
              </Field>
              <Button id="button-cycle-complete" kind="primary" disabled={baReviewBlockers.length > 0} onClick={saveCycle}>
                Catat nomor BA
              </Button>
              {baReviewBlockers.length > 0 && <details><summary>Persyaratan pencatatan BA</summary>
                <ul>{baReviewBlockers.map(reason => <li key={reason}>{reason}</li>)}</ul>
              </details>}
            </>}
          </Panel>
        )}
      </div>}
    </section>
  );
}
