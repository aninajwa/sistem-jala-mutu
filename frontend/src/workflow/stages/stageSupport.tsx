import { Activity } from "lucide-react";
import { type ReactNode } from "react";
import { markAuditsForReview } from "../workflowRevisions";

import {
  CorrectionCase,
  DailySurveyRecord,
  INITIAL_WORKFLOW,
  OperationalWorkflowState,
  ProductionTest,
  SurveyType,
} from "../model";
import { WORKFLOW_ROLE_OPTIONS, WORKFLOW_ROLE_SCOPE } from "../workflowConfig";

export type WorkflowStageProps = {
  selection: string;
  state: OperationalWorkflowState;
  onUpdate: (
    updater: (current: OperationalWorkflowState) => OperationalWorkflowState,
    activity: string,
    object: string,
  ) => void;
  setNotice: (message: string) => void;
  onNavigate: (selection: string) => void;
};
export type NumericProductionKey = {
  [K in keyof ProductionTest]-?: NonNullable<ProductionTest[K]> extends number
    ? K
    : never;
}[keyof ProductionTest];
export const roleOptions = WORKFLOW_ROLE_OPTIONS;
export const roleScope = WORKFLOW_ROLE_SCOPE;
export const labels: Partial<Record<keyof ProductionTest, string>> = {
  trialKm: "Panjang uji (km)",
  sections: "Jumlah seksi",
  sectionLengthKm: "Panjang setiap seksi (km)",
  repeats: "Pengulangan",
  speedTrials40: "Ulangan pada 40 km/jam",
  speedTrials50: "Ulangan pada 50 km/jam",
  speedTrialsAbove60: "Ulangan di atas 60 km/jam",
  coefficientA: "Koefisien A",
  coefficientB: "Koefisien B",
  rSquared: "R²",
  coefficientVariation: "Koefisien variasi (%)",
  f1Before: "F1 sebelum QA",
  f1After: "F1 sesudah QA",
  meanAveragePrecision: "mAP",
  segmentsWithinFive: "Segmen selisih ≤5 poin (%)",
  segmentsAtLeastFifteen: "Segmen selisih ≥15 poin (%)",
  standardDeviation: "Simpangan baku",
  fwdLoad: "Beban FWD (kN)",
  locations: "Jumlah lokasi",
  trafficHours: "Durasi rekam (jam)",
  lwdCorrelationPoints: "Titik korelasi LWD terhadap FWD",
  lwdRepeats: "Ulangan pengukuran LWD",
  lwdDifferenceMicrons: "Selisih ulangan LWD (µm)",
  lwdDifferencePercent: "Selisih ulangan LWD (%)",
};
export const equipmentOptions = [
  "Profilometer Laser",
  "IRI Tipe Respon",
  "FWD Dynatest",
  "LWD",
  "Kamera Survei",
  "GPS Geodetik",
  "GPS Navigasi",
  "Video Log",
  "Total Station",
  "Traffic Counter",
  "Formulir Survei",
];
export const dailyEquipment: Record<SurveyType, string[]> = {
  IRI: ["Profilometer Laser", "IRI Tipe Respon"],
  PCI: ["Kamera Survei", "Formulir Survei"],
  Lendutan: ["FWD Dynatest", "LWD"],
  Jembatan: ["Formulir Survei", "Total Station", "GPS Geodetik"],
  Lereng: ["GPS Navigasi", "Formulir Survei"],
  RNI: ["Video Log", "Formulir Survei"],
  "Lalu Lintas": ["Traffic Counter", "Kamera Survei", "Formulir Survei"],
  Drainase: ["Formulir Survei", "Kamera Survei"],
};
export const systemsByType: Record<SurveyType, string> = {
  IRI: "SMD Jalan",
  PCI: "SMD Jalan",
  Lendutan: "SMD Jalan",
  Jembatan: "INVI-J",
  Lereng: "InSlope",
  Drainase: "InDrain",
  "Lalu Lintas": "SMD Jalan",
  RNI: "SMD Jalan",
};
export const SYSTEM_TARGET_ORDER = [
  "SMD Jalan",
  "INVI-J",
  "InSlope",
  "InDrain",
] as const;
export const testId = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
export const idNow = (prefix: string) =>
  `${prefix}-${Date.now().toString().slice(-7)}`;
export function auditValue(value: unknown) {
  if (value === undefined) return "—";
  if (Array.isArray(value))
    return value.length <= 2
      ? JSON.stringify(value)
      : `${value.length} item (${value
          .slice(0, 2)
          .map((item) =>
            typeof item === "object" && item
              ? String((item as { id?: string }).id ?? "rekaman")
              : String(item),
          )
          .join(", ")}…)`;
  if (value && typeof value === "object")
    return `{${Object.keys(value as object)
      .slice(0, 5)
      .join(", ")}${Object.keys(value as object).length > 5 ? ", …" : ""}}`;
  return String(value).slice(0, 100);
}
export function collectAuditChanges(
  before: unknown,
  after: unknown,
  path = "",
): Array<{ path: string; before: string; after: string }> {
  if (Object.is(before, after) || path === "events") return [];
  if (
    before &&
    after &&
    typeof before === "object" &&
    typeof after === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    const oldObject = before as Record<string, unknown>;
    const newObject = after as Record<string, unknown>;
    return [...new Set([...Object.keys(oldObject), ...Object.keys(newObject)])]
      .flatMap((key) =>
        collectAuditChanges(
          oldObject[key],
          newObject[key],
          path ? `${path}.${key}` : key,
        ),
      )
      .slice(0, 6);
  }
  if (
    Array.isArray(before) &&
    Array.isArray(after) &&
    before.every((item) => item && typeof item === "object") &&
    after.every((item) => item && typeof item === "object")
  ) {
    const identify = (item: unknown, index: number) => {
      const row = item as Record<string, unknown>;
      return String(row.id ?? row.level ?? row.type ?? index);
    };
    const oldRows = new Map(
      before.map((item, index) => [identify(item, index), item]),
    );
    const newRows = new Map(
      after.map((item, index) => [identify(item, index), item]),
    );
    return [...new Set([...oldRows.keys(), ...newRows.keys()])]
      .flatMap((key) => {
        if (!oldRows.has(key))
          return [
            {
              path: `${path}[${key}]`,
              before: "—",
              after: auditValue(newRows.get(key)),
            },
          ];
        if (!newRows.has(key))
          return [
            {
              path: `${path}[${key}]`,
              before: auditValue(oldRows.get(key)),
              after: "—",
            },
          ];
        return collectAuditChanges(
          oldRows.get(key),
          newRows.get(key),
          `${path}[${key}]`,
        );
      })
      .slice(0, 6);
  }
  return [
    {
      path: path || "workflow",
      before: auditValue(before),
      after: auditValue(after),
    },
  ];
}
export const defaultDaily = (
  date = "2027-06-10",
  road = "Medan – Binjai",
  surveyType: SurveyType = "IRI",
): Omit<DailySurveyRecord, "id"> => ({
  date,
  time: "08:00",
  surveyType,
  road,
  lengthKm: 0,
  trafficDurationMinutes: 0,
  lane: "Lajur 1",
  direction: "Normal",
  weather: "Cerah",
  surfaceDry: true,
  glareFree: true,
  speedAndLaneCompliant: true,
  tool: dailyEquipment[surveyType][0],
  operator: "D. Prasetyo",
  driver: "B. Santoso",
  poi: "",
  disturbances: "",
  eventNotes: "",
  dailyToolCheck: {
    "Bounce test": false,
    GPS: false,
    Baterai: false,
    Penyimpanan: false,
  },
  rawValue: "",
  cleanedValue: "",
  cleaningReason: "",
  state: "Tercatat",
  technicalData: {},
});
export const defaultCase = (
  state: OperationalWorkflowState,
): CorrectionCase => ({
  id: idNow("KOR"),
  source: "Validasi produksi",
  blockedStage: "Validasi produksi",
  road: state.project.routes[0] || "",
  stationing: "STA 0+000 – 0+100",
  rejectionReason: "",
  severity: "Mayor",
  owner: "PIC survei",
  dueDate: state.simulationDate,
  rootCause: "",
  fieldDataValid: "",
  surveyType: "IRI",
  actionType: "",
  evidence: "",
  proposedValue: "",
  approval: "Draft",
  retest: "Belum Diuji",
  status: "Terbuka",
  returnStage: "Validasi produksi",
  originalValue:
    state.dailyRecords.find(
      (record) =>
        record.surveyType === "IRI" &&
        record.road === (state.project.routes[0] || ""),
    )?.rawValue || "Belum ada nilai raw tertaut",
  linkedRecordId: state.dailyRecords.find(
    (record) =>
      record.surveyType === "IRI" &&
      record.road === (state.project.routes[0] || ""),
  )?.id,
  verification: { surveyor: false, teamLeader: false, balai: false },
  reviewNote: "",
});
export const invalidateTerm1 = (
  acceptance: OperationalWorkflowState["acceptance"],
) => ({
  ...acceptance,
  terms: acceptance.terms.map((term) =>
    term.id === "T1" ? { ...term, complete: false } : term,
  ),
  finalReport: false,
  finalAcceptance: false,
});
export const resetAuditLevels = (): OperationalWorkflowState["audits"] => [
  { ...INITIAL_WORKFLOW.audits[0], sampleIds: [] },
  { ...INITIAL_WORKFLOW.audits[1], sampleIds: [] },
  { ...INITIAL_WORKFLOW.audits[2], sampleIds: [] },
];
export const invalidateDependentStages = (
  state: OperationalWorkflowState,
  reason: string,
): OperationalWorkflowState => ({
  ...state,
  productionApproval: "Draft",
  productionApprovalBa: "",
  bridgeInspectionPermit: false,
  submission: {
    ...state.submission,
    validationStatus: "Draft",
    validationMessage: reason,
  },
  audits: markAuditsForReview(state, reason),
  acceptance: {
    ...state.acceptance,
    terms: state.acceptance.terms.map((term) =>
      term.id === "T1" || term.id === "T3" || term.id === "T4"
        ? { ...term, complete: false }
        : term,
    ),
    semesterTwoRevalidation: false,
    finalReport: false,
    finalAcceptance: false,
  },
});
export const invalidateVervalStages = (
  state: OperationalWorkflowState,
  reason: string,
): OperationalWorkflowState => ({
  ...state,
  submission: {
    ...state.submission,
    validationStatus: "Draft",
    validationMessage: reason,
  },
  audits: markAuditsForReview(state, reason),
  acceptance: {
    ...state.acceptance,
    terms: state.acceptance.terms.map((term) =>
      term.id === "T2" || term.id === "T3" || term.id === "T4"
        ? { ...term, complete: false }
        : term,
    ),
    semesterTwoRevalidation: false,
    finalReport: false,
    finalAcceptance: false,
  },
});
export function Badge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "good" | "warn" | "bad" | "info";
}) {
  return <span className={`wf-status ${tone}`}>{children}</span>;
}
export function Panel({
  title,
  icon: Icon = Activity,
  extra,
  children,
}: {
  title: string;
  icon?: any;
  extra?: any;
  children: any;
}) {
  return (
    <section className="wf-panel">
      <div className="wf-panel-head">
        <h3>
          <Icon size={14} />
          {title}
        </h3>
        {extra}
      </div>
      <div className="wf-body">{children}</div>
    </section>
  );
}
export function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: any;
  full?: boolean;
}) {
  return (
    <div className={`wf-field ${full ? "full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}
export function Button({
  children,
  onClick,
  kind = "",
  disabled = false,
  id,
}: {
  children: any;
  onClick: () => void;
  kind?: string;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      type="button"
      data-testid={id}
      className={`wf-button ${kind}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function CheckRow({
  label,
  checked,
  onChange,
  id,
  detail,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  detail?: string;
  disabled?: boolean;
}) {
  return (
    <label className="wf-row wf-check" data-testid={`row-${id}`}>
      <input
        type="checkbox"
        data-testid={`check-${id}`}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {label}
        {detail && (
          <span className="wf-note" style={{ display: "block" }}>
            {detail}
          </span>
        )}
      </span>
    </label>
  );
}
export function Select({
  value,
  onChange,
  options,
  id,
  disabled = false,
  disabledOptions = {},
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  id: string;
  disabled?: boolean;
  disabledOptions?:Record<string,string>;
}) {
  return (
    <select
      value={value}
      data-testid={id}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {!options.includes(value)&&<option value={value} disabled>{options.length?'Nilai tersimpan perlu ditinjau':'Belum ada pilihan tersedia'}</option>}
      {options.map((o) => (
        <option key={o} value={o} disabled={!!disabledOptions[o]}>
          {o==='Sinkronisasi sistem sumber'?'Data lokal tersimpan (API belum tersambung)':o==='Input manual fallback'?'Pencatatan manual':o}{disabledOptions[o]?` · ${disabledOptions[o]}`:''}
        </option>
      ))}
    </select>
  );
}
