import {periodicSurveyTypes} from '../reviewReadiness';
import {evaluateStageGate} from '../workflowGate';
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {DocumentAttachments} from '../DocumentAttachments';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import { reviewSurvey } from "../periodicReview";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
} from "lucide-react";
import { useState } from "react";

import {
  CYCLE_PROTOCOLS,
  CYCLE_SHARED_PROTOCOLS,
  cycleDueDate,
  daysBetween,
  SurveyType,
  VervalCycle,
} from "../model";
import { Stage3BPeriodSelector } from "../Stage3BPeriodSelector";
import { Stage3BOperationalForms } from "../Stage3BOperationalForms";
import { GateSummary } from "../WorkflowComponents";

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

export function Stage3PeriodicWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, updateCycle, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage3PeriodicWorkspace:period-${state.activeCyclePeriod??1}`,{});
  const {
    stage3BCompletion,
    activeStage3BPeriod,
    stage3bPeriodRange,
    setStage3BPeriodRange,
    stage3BStatus,
    setStage3BStatus,
    onStage3BCompletion,
    switchStage3BPeriod,
  } = useStage3BPeriod(
    state.project.id,
    onUpdate,
    () => {},
    state.activeCyclePeriod,
  );
  const selectedCycleTypes = periodicSurveyTypes(state);
  const [,refreshSource]=useState(0);
  const [reviewType, setReviewType] = useState<SurveyType>(
    selectedCycleTypes[0] ?? state.project.surveyTypes[0] ?? "IRI",
  );
  const selectedReviewType = selectedCycleTypes.includes(reviewType)
    ? reviewType
    : (selectedCycleTypes[0] ?? reviewType);
  const surveyReview = state.cycle.surveyReviews?.[selectedReviewType];
  const dueCycle = cycleDueDate(state.cycle.lastCompletedDate);
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
      (pciSd !== null && Number.isFinite(pciSd) && pciSd >= 0 && pciSd <= 10);
    if (
      (types.includes("IRI") && iriCv !== null && iriCv > 5) ||
      (types.includes("PCI") && pciSd !== null && pciSd > 10) ||
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

  const due = daysBetween(state.simulationDate, dueCycle);
  const consistencyResult = evaluateCycleConsistency(
    selectedCycleTypes,
    state.cycle.iriCoefficientVariation,
    state.cycle.pciManualMaxDifferencePercent ?? null,
    state.cycle.reRatingStatus,
  );
  const canPrepareCycle = state.role === "Penyedia Jasa / Ketua Tim";
  const canReviewCycle = state.role === "PIC Balai / Pengguna Jasa";
  const reviewPrerequisites=evaluateStageGate(state,'Tahap 2');
  const periodScope=activeStage3BPeriod===1?state.project.id:`${state.project.id}::period-${activeStage3BPeriod}`;
  const reviewLocks=[...(!reviewPrerequisites.readyToComplete?reviewPrerequisites.blockers:[]),...(!selectedCycleTypes.length?['Lingkup jenis survei belum ditetapkan.']:[])];
  const sourceReady=(type:SurveyType,phase:string)=>{const result=sourceInspectionStatus(periodScope,type,phase,state.productionTests.PCI.pciManual!==false,{...state.project,periodStart:stage3bPeriodRange.start,periodEnd:stage3bPeriodRange.end});return result.complete&&(type!=='Lendutan'||!result.concerns.some(reason=>phase==='periodic14'||/CV ≤ 5%|Minimal 3 pengulangan/.test(reason)));};
  const sourceReviewReady=sourceReady(selectedReviewType,'periodic14');
  const conformityLock=!state.cycle.periodCompleted?'Menunggu penyerahan Penyedia':!sourceReviewReady?'Lengkapi pemeriksaan bersama':'';
  const allProtocols = [
    ...selectedCycleTypes.flatMap((t) =>
      CYCLE_PROTOCOLS[t].map((p) => `${t} · ${p}`),
    ),
    ...CYCLE_SHARED_PROTOCOLS,
  ];
  const checked = allProtocols.filter(
    (x) => state.cycle.checkedProtocols[x],
  ).length;
  const openPeriodFindings=state.corrections.filter(item=>['Konsistensi gagal','Temuan proses verval'].includes(item.source)&&item.status!=='Ditutup'&&(item.cyclePeriod===undefined||item.cyclePeriod===activeStage3BPeriod));
  const baReviewBlockers=[...reviewLocks,
    ...(!stage3bPeriodRange.start||!stage3bPeriodRange.end?['Jadwal dan periode pemeriksaan belum ditetapkan.']:[]),
    ...(!state.cycle.periodCompleted?['Penyedia belum menyerahkan hasil periode.']:[]),
    ...selectedCycleTypes.flatMap(type=>['consistency','internal','periodic14'].filter(phase=>!sourceReady(type,phase)).map(phase=>`${type}: ${phase==='consistency'?'Konsistensi':phase==='internal'?'V&V Internal':'V&V Bersama'} belum lengkap.`)),
    ...(checked!==allProtocols.length?['Pemeriksaan pelaksanaan belum lengkap.']:[]),
    ...(consistencyResult!=='Konsisten'?['Hasil konsistensi belum memenuhi pemeriksaan.']:[]),
    ...(state.cycle.userReview!=='Sesuai'||selectedCycleTypes.some(type=>state.cycle.surveyReviews?.[type]?.decision!=='Sesuai')||state.cycle.reviewPendingTypes?.length?['Review Balai masih perlu diselesaikan atau diulang.']:[]),
    ...(openPeriodFindings.length?['Selesaikan tindak lanjut temuan periode sebelum mencatat BA.']:[]),
    ...(!(draft.cycleBa??state.cycle.certificateId).trim()?['Referensi BA belum diisi.']:[])];
  const updateConsistencyMetric = (
    key: "iriCoefficientVariation" | "pciManualMaxDifferencePercent",
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
      key === "pciManualMaxDifferencePercent"
        ? value
        : (state.cycle.pciManualMaxDifferencePercent ?? null);
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
      `Catat ${key === "iriCoefficientVariation" ? "IRI CV" : "Selisih PCI Manual (%)"} verval`,
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
          state.cycle.pciManualMaxDifferencePercent ?? null,
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
    const failedTypes = selectedCycleTypes.filter(
      (type) =>
        (type === "IRI" && (state.cycle.iriCoefficientVariation ?? 0) > 5) ||
        (type === "PCI" &&
          (state.cycle.pciManualMaxDifferencePercent ?? 0) > 10) ||
        state.cycle.reRatingStatus === "Tidak Sesuai",
    );
    const heldIds = state.dailyRecords
      .filter(
        (record) =>
          record.state === "Tercatat" &&
          (failedTypes.length ? failedTypes : selectedCycleTypes).includes(
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
    const heldIds = new Set(state.cycle.heldRecordIds);
    commit("Catat BA verval Balai 14 hari", certificateId, (s) => {
      const invalidated = invalidateVervalStages(
        s,
        "BA verval baru tercatat; validasi LRS dan audit perlu diulang.",
      );
      return {
        ...invalidated,
        cycle: {
          ...s.cycle,
          requiresReview: false,
          reviewReason: "",
          lastCompletedDate: stage3bPeriodRange.end||s.simulationDate,
          certificateId,
          consistency: "Konsisten",
          heldRecordIds: [],
        },
        dailyRecords: s.dailyRecords.map((record) =>
          heldIds.has(record.id) && record.state === "Ditahan"
            ? { ...record, state: "Tercatat" }
            : record,
        ),
      };
    });
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
    if(reviewLocks.length){setNotice(reviewLocks.join(' '));return;}
    if(!selectedCycleTypes.includes(selectedReviewType)){setNotice('Pilih jenis survei yang tersedia pada periode ini.');return;}
    if(patch.userReview==='Sesuai'&&(!state.cycle.periodCompleted||!sourceReady(selectedReviewType,'periodic14'))){
      setNotice('Selesaikan pemeriksaan bersama dan tunggu hasil periode Penyedia sebelum mencatat Sesuai.');return;
    }
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
      commit("Buka kasus dari pemeriksaan proses verval", c.id, (s) => ({
        ...invalidateVervalStages(s,'Temuan pemeriksaan periode memerlukan tindak lanjut.'),
        cycle:{...s.cycle,...scopedPatch},
        corrections: [c, ...s.corrections],
      }));
    } else {
      updateCycle(scopedPatch,"Catat pemeriksaan Pengguna Jasa dan bukti akhir periode");
    }
  };
  return (
    <>
      {heading(
        "Tahap 3B · verifikasi dan validasi berkala",
        "Verval berkala 14 hari",
        "Penyedia menyiapkan bukti dan checklist periode; hasil pemeriksaan dirangkum sistem, lalu PIC Balai / Pengguna Jasa meninjau, memberi catatan/keputusan, dan mencatat BA berkala.",
      )}
      {state.cycle.requiresReview && (
        <div className="wf-callout warn">
          Pemeriksaan ulang diperlukan: {state.cycle.reviewReason} BA
          sebelumnya: {state.cycle.certificateId || "Belum tercatat"}
        </div>
      )}
      <p className="wf-note stage-period-hint">Pilih periode terlebih dahulu. Semua pemeriksaan dan BA mengikuti periode yang dipilih.</p>
      <Stage3BPeriodSelector
        simulationDate={state.simulationDate}
        periodStates={{...state.cycleHistory,[String(activeStage3BPeriod)]:state.cycle}}
        packageId={state.project.id}
        activePeriod={activeStage3BPeriod}
        onPeriodChange={switchStage3BPeriod}
        onRangeChange={setStage3BPeriodRange}
        surveyStartDate={state.project.surveyStartDate}
        surveyEndDate={state.project.surveyEndDate}
        editable={state.role==='Penyedia Jasa / Ketua Tim'}
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
      {canReviewCycle && (
<div className="stage-role-priority">
      <Panel
        title={
          canReviewCycle ? "Pekerjaan PIC Balai · review periode" : "Hasil review PIC Balai"
        }
        icon={ClipboardCheck}
      >
        {canReviewCycle ? (
          <>
            <div className="wf-callout">
              Khusus PIC Balai / Pengguna Jasa: periksa data, hasil konsistensi,
              checklist dan evidence Penyedia sebelum memberikan keputusan.
              Temuan harus ditindaklanjuti dan tidak boleh dianggap lolos.
            </div>
            {reviewLocks.length>0&&<div className="wf-callout warn" role="status"><strong>Review belum dapat dicatat — bukan gangguan tombol</strong><p>Prasyarat pemeriksaan belum terpenuhi. Pilihan keputusan dan isian review ditahan agar tidak menghasilkan persetujuan yang tidak sah.</p><details><summary>Lihat {reviewLocks.length} alasan tertahan</summary><ul>{reviewLocks.map(reason=><li key={reason}>{reason}</li>)}</ul></details><button className="wf-button" onClick={()=>onNavigate('/entry:Validasi produksi')}>Periksa Tahap 2</button></div>}
            {!state.cycle.periodCompleted&&<p className="wf-note">Penyedia belum menyerahkan hasil periode ini. Review baru dapat dicatat setelah prasyarat terpenuhi; keputusan Sesuai juga memerlukan V&V Bersama yang lengkap.</p>}
            {conformityLock&&<p className="wf-note">Keputusan Sesuai tertahan: {conformityLock}. Buka V&V Bersama untuk melengkapi pemeriksaan jenis yang dipilih.</p>}
            <div className="wf-fields">
              <Field label="Jenis survei yang direview">
                <Select
                  id="select-periodic-review-survey"
                  value={selectedReviewType}
                  disabled={!selectedCycleTypes.length}
                  options={selectedCycleTypes}
                  onChange={(value) => setReviewType(value as SurveyType)}
                />
              </Field>
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
              <Field label="Keputusan review Pengguna Jasa">
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
              <Field label="Nomor BA V&V 2-Mingguan (bila sudah diterbitkan)">
                <input
                  data-testid="input-cycle-ba"
                  disabled={reviewLocks.length>0}
                  value={draft.cycleBa ?? state.cycle.certificateId}
                  onChange={(e) => saveText("cycleBa", e.target.value)}
                  placeholder="Belum ada nomor BA"
                />
              </Field>
            </div>
            <p className="wf-note">
              Nomor BA dan keputusan hanya dicatat oleh PIC Balai. Draft, review dan histori tersedia pada Dokumen & BA.
            </p>
          </>
        ) : (
          <div className="package-readonly-grid">
            <div>
              <small>Keputusan Pengguna Jasa</small>
              <strong>{state.cycle.userReview ?? "Belum Diperiksa"}</strong>
            </div>
            <div>
              <small>Nomor BA V&V 2-Mingguan</small>
              <strong>
                {state.cycle.certificateId || "Belum diterbitkan"}
              </strong>
            </div>
            <div className="wide">
              <small>Catatan PIC Balai</small>
              <strong>
                {state.cycle.userReviewNote?.trim() ||
                  "Belum ada catatan dari PIC Balai"}
              </strong>
            </div>
            {selectedCycleTypes.includes("Jembatan") && (
              <div>
                <small>Validasi jembatan</small>
                <strong>
                  {state.cycle.bridgeValidatedPercent === undefined
                    ? "Belum tercatat"
                    : `${state.cycle.bridgeValidatedPercent}%`}
                </strong>
              </div>
            )}
            {state.cycle.periodCompleted && (
              <>
                <div>
                  <small>Lokasi uji validasi akhir</small>
                  <strong>
                    {state.cycle.finalValidationLocation || "Belum dicatat"}
                  </strong>
                </div>
                <div>
                  <small>Konfirmasi kondisi alat</small>
                  <strong>
                    {state.cycle.finalToolUnchanged
                      ? "Sudah dikonfirmasi"
                      : "Belum dikonfirmasi"}
                  </strong>
                </div>
              </>
            )}
            <div className="wide">
              <small>Akses</small>
              <strong>
                {state.role === "Direktorat / Pusat"
                  ? "Monitoring Direktorat — hanya baca"
                  : "Hasil review Balai — hanya baca untuk Penyedia"}
              </strong>
            </div>
          </div>
        )}
      </Panel>
</div>
      )}
      <Stage3BOperationalForms selectedSurvey={selectedReviewType} onSurveyChange={setReviewType} periodStart={stage3bPeriodRange.start} periodEnd={stage3bPeriodRange.end} pciManual={state.productionTests.PCI.pciManual!==false}
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
        onCompletionChange={onStage3BCompletion}
        onAnswersChanged={() => {
          refreshSource(value=>value+1);
          if (!state.cycle.certificateId&&(!surveyReview||surveyReview.decision==='Belum Diperiksa')) return;
          commit(
            "Perbarui checklist periode",
            `Periode ${activeStage3BPeriod}`,
            (current) => ({
              ...current,
              cycle: (current.cycle.certificateId||current.cycle.surveyReviews?.[selectedReviewType])
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
      />

      <div className="wf-callout" role="status">
        <strong>{canPrepareCycle ? 'Pekerjaan Ketua Tim' : canReviewCycle ? 'Pekerjaan PIC Balai' : 'Pemantauan periode'}</strong>
        <p className="wf-note">
          {canPrepareCycle
            ? 'Isi konsistensi dan V&V internal, lengkapi bukti, lalu serahkan hasil periode untuk diperiksa Balai.'
            : canReviewCycle
              ? state.cycle.periodCompleted
                ? 'Periksa V&V bersama, hasil sistem dan bukti Penyedia; kemudian catat review per jenis survei.'
                : 'Menunggu penyerahan hasil periode dari Ketua Tim. Checklist pelaksanaan Penyedia hanya untuk dipantau.'
              : 'Pantau kelengkapan, hasil pemeriksaan, temuan dan keputusan Balai. Isian teknis hanya dapat diubah aktor yang berwenang.'}
        </p>
      </div>
      <details className="wf-panel"><summary className="wf-panel-head">{canPrepareCycle ? 'Checklist pelaksanaan periode · Ketua Tim' : 'Detail & Riwayat · Checklist pelaksanaan Ketua Tim (hanya lihat)'} ({checked}/{allProtocols.length})</summary>
        {allProtocols.map(protocol=><CheckRow key={protocol} id={`cycle-protocol-${testId(protocol)}`} label={protocol} checked={!!state.cycle.checkedProtocols[protocol]} disabled={!canPrepareCycle} onChange={value=>updateProtocol(protocol,value)}/>)}
      </details>
      {canPrepareCycle ? <DocumentAttachments scope={`${state.project.id}:stage3b-${activeStage3BPeriod}`} categories={['Bukti repeatability / hasil pemeriksaan berkala','Bukti pendukung periode']} legacyEvidenceIds={[`stage3b-repeatability-${activeStage3BPeriod}`,`stage3b-supporting-evidence-${activeStage3BPeriod}`]} editable={canPrepareCycle}/> : <details className="wf-panel"><summary className="wf-panel-head">Detail & Riwayat · Bukti Penyedia (hanya lihat)</summary><DocumentAttachments scope={`${state.project.id}:stage3b-${activeStage3BPeriod}`} categories={['Bukti repeatability / hasil pemeriksaan berkala','Bukti pendukung periode']} legacyEvidenceIds={[`stage3b-repeatability-${activeStage3BPeriod}`,`stage3b-supporting-evidence-${activeStage3BPeriod}`]} editable={false}/></details>}
      <div className="wf-grid">

        <Panel title="Cakupan pemeriksaan periode" icon={ClipboardList}>
          <p className="wf-note">
            Jenis survei berikut berasal dari lingkup paket. Pemeriksaan mengikuti jenis survei pada paket dan periode yang dipilih.
          </p>
          <div className="wf-pill-list" style={{ marginTop: 10 }}>
            {state.project.surveyTypes.map((type) => (
              <span className="wf-pill" key={type}>
                <CheckCircle2 size={12} />
                {type}
              </span>
            ))}
          </div>
          <div className="wf-note" style={{ marginTop: 10 }}>
            {state.cycle.periodCompleted
              ? "Penyedia telah menandai periode sebagai selesai."
              : "Periode belum ditandai selesai oleh Penyedia."}
          </div>
          {canPrepareCycle && (
            <CheckRow
              id="cycle-period-completed"
              label="Serahkan hasil pemeriksaan periode kepada Balai"
              checked={state.cycle.periodCompleted}
              onChange={(value) =>
                updateCycle(
                  { periodCompleted: value, selectedTypes:selectedCycleTypes },
                  "Tandai akhir pemeriksaan periode",
                )
              }
            />
          )}
        </Panel>
      </div>
<details className="stage-technical-details" open={canPrepareCycle}><summary>{canPrepareCycle ? "Hasil teknis dan tindak lanjut periode" : "Detail & Riwayat · Hasil teknis Penyedia (hanya lihat)"}</summary>
      <div className="wf-grid">
        <div>
          <Panel title="Hasil pemeriksaan teknis dan bukti" icon={FileCheck2}>
            <div className="workflow-data-origin">
              <span className="origin-badge provider">
                {canPrepareCycle
                  ? "Data yang dicatat Penyedia"
                  : "HASIL PEMERIKSAAN"}
              </span>
              <div>
                <strong>
                  {canPrepareCycle
                    ? "Lengkapi hasil bila integrasi sumber belum tersedia"
                    : "Hasil yang disiapkan Penyedia"}
                </strong>
                <span>Hasil pemeriksaan yang tersedia pada paket ini. Nilai dari sistem sumber belum tersedia secara otomatis.</span>
              </div>
            </div>
            {selectedCycleTypes.includes("IRI") && (
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
            {selectedCycleTypes.includes("PCI") && (
              <Field label="Selisih PCI Manual (maks. 10%)">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  data-testid="input-cycle-pci-ai-sd"
                  value={state.cycle.pciManualMaxDifferencePercent ?? ""}
                  readOnly={!canPrepareCycle}
                  onChange={(e) =>
                    updateConsistencyMetric(
                      "pciManualMaxDifferencePercent",
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
              Hasil pemeriksaan konsistensi:{" "}
              <strong>{consistencyResult}</strong>. Parameter mengikuti acuan
              teknis yang berlaku pada jenis survei.
            </div>
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
            <Field label="Alat/rater terkait data yang ditahan" full>
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
                placeholder="Nama alat; kosong = seluruh alat jenis yang gagal"
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
              <Button
                id="button-cycle-complete"
                kind="primary"
                onClick={saveCycle}
                disabled={!canReviewCycle||baReviewBlockers.length>0}
              >
                Catat BA Balai
              </Button>
            </div>{canReviewCycle&&baReviewBlockers.length>0&&<details className="wf-note"><summary>BA tertahan · {baReviewBlockers.length} persyaratan</summary><ul>{baReviewBlockers.map((reason,index)=><li key={index}>{reason}</li>)}</ul><a href="#pemeriksaan-berkala">Buka pemeriksaan periode</a>{openPeriodFindings.length>0&&<button className="wf-button" onClick={()=>onNavigate('/actions:Koreksi berbukti')}>Buka tindak lanjut</button>}</details>}
            {state.cycle.heldRecordIds.length > 0 && (
              <div className="wf-callout danger" style={{ marginTop: 9 }}>
                {state.cycle.heldRecordIds.length} rekaman dalam periode ditahan
                sampai koreksi ditutup dan verval ulang lulus.
              </div>
            )}
            {state.cycle.consistency === "Tidak Konsisten" && (
              <div className="wf-callout danger" style={{ marginTop: 9 }}>
                HOLD aktif · data 14 hari terakhir belum boleh diteruskan.
                Hasil uji ulang harus konsisten sebelum kembali.
              </div>
            )}
          </Panel>
        </div>
      </div>
      </details>
      {!canReviewCycle && (
<div className="stage-role-priority">
      <Panel
        title={
          canReviewCycle ? "Pekerjaan PIC Balai · review periode" : "Hasil review PIC Balai"
        }
        icon={ClipboardCheck}
      >
        {canReviewCycle ? (
          <>
            <div className="wf-callout">
              Khusus PIC Balai / Pengguna Jasa: periksa data, hasil konsistensi,
              checklist dan evidence Penyedia sebelum memberikan keputusan.
              Temuan harus ditindaklanjuti dan tidak boleh dianggap lolos.
            </div>
            {reviewLocks.length>0&&<div className="wf-callout warn" role="status"><strong>Review belum dapat dicatat — bukan gangguan tombol</strong><p>Prasyarat pemeriksaan belum terpenuhi. Pilihan keputusan dan isian review ditahan agar tidak menghasilkan persetujuan yang tidak sah.</p><details><summary>Lihat {reviewLocks.length} alasan tertahan</summary><ul>{reviewLocks.map(reason=><li key={reason}>{reason}</li>)}</ul></details><button className="wf-button" onClick={()=>onNavigate('/entry:Validasi produksi')}>Periksa Tahap 2</button></div>}
            {!state.cycle.periodCompleted&&<p className="wf-note">Penyedia belum menyerahkan hasil periode ini. Review baru dapat dicatat setelah prasyarat terpenuhi; keputusan Sesuai juga memerlukan V&V Bersama yang lengkap.</p>}
            {conformityLock&&<p className="wf-note">Keputusan Sesuai tertahan: {conformityLock}. Buka V&V Bersama untuk melengkapi pemeriksaan jenis yang dipilih.</p>}
            <div className="wf-fields">
              <Field label="Jenis survei yang direview">
                <Select
                  id="select-periodic-review-survey"
                  value={selectedReviewType}
                  disabled={!selectedCycleTypes.length}
                  options={selectedCycleTypes}
                  onChange={(value) => setReviewType(value as SurveyType)}
                />
              </Field>
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
              <Field label="Keputusan review Pengguna Jasa">
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
              <Field label="Nomor BA V&V 2-Mingguan (bila sudah diterbitkan)">
                <input
                  data-testid="input-cycle-ba"
                  disabled={reviewLocks.length>0}
                  value={draft.cycleBa ?? state.cycle.certificateId}
                  onChange={(e) => saveText("cycleBa", e.target.value)}
                  placeholder="Belum ada nomor BA"
                />
              </Field>
            </div>
            <p className="wf-note">
              Nomor BA dan keputusan hanya dicatat oleh PIC Balai. Draft, review dan histori tersedia pada Dokumen & BA.
            </p>
          </>
        ) : (
          <div className="package-readonly-grid">
            <div>
              <small>Keputusan Pengguna Jasa</small>
              <strong>{state.cycle.userReview ?? "Belum Diperiksa"}</strong>
            </div>
            <div>
              <small>Nomor BA V&V 2-Mingguan</small>
              <strong>
                {state.cycle.certificateId || "Belum diterbitkan"}
              </strong>
            </div>
            <div className="wide">
              <small>Catatan PIC Balai</small>
              <strong>
                {state.cycle.userReviewNote?.trim() ||
                  "Belum ada catatan dari PIC Balai"}
              </strong>
            </div>
            {selectedCycleTypes.includes("Jembatan") && (
              <div>
                <small>Validasi jembatan</small>
                <strong>
                  {state.cycle.bridgeValidatedPercent === undefined
                    ? "Belum tercatat"
                    : `${state.cycle.bridgeValidatedPercent}%`}
                </strong>
              </div>
            )}
            {state.cycle.periodCompleted && (
              <>
                <div>
                  <small>Lokasi uji validasi akhir</small>
                  <strong>
                    {state.cycle.finalValidationLocation || "Belum dicatat"}
                  </strong>
                </div>
                <div>
                  <small>Konfirmasi kondisi alat</small>
                  <strong>
                    {state.cycle.finalToolUnchanged
                      ? "Sudah dikonfirmasi"
                      : "Belum dikonfirmasi"}
                  </strong>
                </div>
              </>
            )}
            <div className="wide">
              <small>Akses</small>
              <strong>
                {state.role === "Direktorat / Pusat"
                  ? "Monitoring Direktorat — hanya baca"
                  : "Hasil review Balai — hanya baca untuk Penyedia"}
              </strong>
            </div>
          </div>
        )}
      </Panel>
</div>
      )}
      <details className="stage-document-details"><summary>Dokumen periode ini · draft BA & riwayat</summary>
      <Panel title={`Dokumen BA · Periode ${activeStage3BPeriod}`} icon={FileText}>
        <p className="wf-note">
          Hasil pemeriksaan periode ini menjadi dasar isi draft BA. Periksa dan lengkapi data yang memang tersedia; nomor resmi, tanda tangan, dan pengesahan bukan hasil otomatis.
        </p>
        <div className="wf-toolbar" style={{ flexWrap: "wrap" }}>
          {baAccess("konsistensi", "Susun BA Konsistensi", activeStage3BPeriod)}
          {baAccess("internal", "Susun BA V&V Internal", activeStage3BPeriod)}
          {baAccess(
            "duaMingguan",
            "Susun BA V&V 2-Mingguan",
            activeStage3BPeriod,
          )}
        </div>
      </Panel>
      </details>
      <GateSummary
        title="Gerbang Tahap 3 → Tahap 4"
        items={[
          {
            label: "Periode survei selesai",
            ready: state.cycle.periodCompleted,
            detail: state.cycle.periodCompleted
              ? "Ditandai selesai"
              : "Masih dalam masa survei",
          },
          {
            label: "Checklist Konsistensi lengkap",
            ready: stage3BCompletion.consistency,
          },

          {
            label: "Validasi Internal lengkap",
            ready: stage3BCompletion.internal,
          },

          {
            label: "V&V 2-Mingguan lengkap",
            ready: stage3BCompletion.periodic14,
          },
          {
            label: "System-check konsistensi",
            ready: consistencyResult === "Konsisten",
            detail: consistencyResult,
          },
          {
            label: "Keputusan Balai",
            ready: state.cycle.userReview === "Sesuai",
            detail: state.cycle.userReview ?? "Belum Diperiksa",
          },
          {
            label: "BA verval Balai",
            ready: !!state.cycle.certificateId,
            detail: state.cycle.certificateId || "Belum dicatat",
          },
          {
            label: "Tidak ada HOLD / kasus verval terbuka",
            ready:
              state.cycle.heldRecordIds.length === 0 &&
              !state.corrections.some(
                (c) =>
                  c.blockedStage === "Verval 14 hari" && c.status !== "Ditutup",
              ),
            detail: state.cycle.heldRecordIds.length
              ? `${state.cycle.heldRecordIds.length} rekaman ditahan`
              : "Tidak ada rekaman ditahan",
          },
        ]}
      />
    </>
  );
}
