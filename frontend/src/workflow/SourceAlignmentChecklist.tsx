import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
} from 'lucide-react';

import type {
  SurveyType,
  WorkflowRole,
} from './model';

import {
  sourceChecklistTemplates,
  type SourceChecklistPhase,
  type SourceChecklistSurvey,
} from './sourceChecklistTemplates';

import {
  StructuredChecklistRenderer,
} from './StructuredChecklistRenderer';

import {
  checklistProgress,
  type StructuredChecklistAnswers,
  type StructuredChecklistItem,
  type StructuredChecklistTemplate,
} from './structuredChecklist';

import {
  getStructuredChecklistTemplate,
} from './structuredChecklistTemplates';

const LEGACY_STORAGE_KEY =
  'road-qaqc-source-checklists-v2';

const STRUCTURED_STORAGE_KEY =
  'road-qaqc-structured-checklists-v2';

type TemplateAnswers =
  Record<string, boolean>;

type StoredLegacyAnswers = Record<
  string,
  Record<string, TemplateAnswers>
>;

type StoredStructuredAnswers = Record<
  string,
  Record<
    string,
    StructuredChecklistAnswers
  >
>;

function loadLegacyAnswers():
  StoredLegacyAnswers {
  if (
    typeof window === 'undefined'
  ) {
    return {};
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(
        LEGACY_STORAGE_KEY,
      ) || '{}',
    ) as StoredLegacyAnswers;
  } catch {
    return {};
  }
}

function saveLegacyAnswers(
  value: StoredLegacyAnswers,
) {
  if (
    typeof window !== 'undefined'
  ) {
    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify(value),
    );
  }
}

const DEVELOPMENT_PACKAGE_ID =
  'PAKET-DEMO-002';

const DEVELOPMENT_SURVEYS:
  SourceChecklistSurvey[] = [
    'IRI',
    'PCI Manual',
    'PCI AI',
    'Lendutan',
    'Lereng',
    'Lalu Lintas',
  ];

function developmentAnswerForItem(
  item: StructuredChecklistItem,
) {
  /*
   * readonly dan table tidak dihitung sebagai
   * item wajib oleh checklistProgress().
   */
  if (
    item.responseType === 'readonly' ||
    item.responseType === 'table'
  ) {
    return undefined;
  }

  let value = '';

  if (item.responseType === 'check') {
    value = 'checked';
  } else if (
    item.responseType === 'number'
  ) {
    value = '1';
  } else if (
    item.responseType === 'text'
  ) {
    value = 'Data development Package B';
  } else if (
    item.options &&
    item.options.length > 0
  ) {
    /*
     * Template kita menyimpan opsi kondisi
     * sesuai source; opsi pertama adalah
     * kondisi memenuhi/positif pada seed demo.
     */
    value = item.options[0];
  } else {
    value = 'Ya';
  }

  return {
    value,

    ...(item.noteRequired
      ? {
          note:
            'Data development Package B.',
        }
      : {}),

    ...(item.evidenceRequired
      ? {
          evidenceReference:
            `DEV-${item.id}`,
        }
      : {}),
  };
}

function createDevelopmentPackageAnswers():
  Record<
    string,
    StructuredChecklistAnswers
  > {
  const result:
    Record<
      string,
      StructuredChecklistAnswers
    > = {};

  for (
    const survey of DEVELOPMENT_SURVEYS
  ) {
    const template =
      getStructuredChecklistTemplate(
        survey,
        'calibration',
      );

    if (!template) {
      continue;
    }

    const answers:
      StructuredChecklistAnswers = {};

    for (
      const section of template.sections
    ) {
      for (
        const item of section.items
      ) {
        const answer =
          developmentAnswerForItem(
            item,
          );

        if (answer) {
          answers[item.id] =
            answer;
        }
      }
    }

    result[template.id] =
      answers;
  }

  return result;
}

function loadStructuredAnswers():
  StoredStructuredAnswers {
  if (
    typeof window === 'undefined'
  ) {
    return {};
  }

  try {
    const raw =
      window.localStorage.getItem(
        STRUCTURED_STORAGE_KEY,
      );

    const stored:
      StoredStructuredAnswers =
        raw
          ? JSON.parse(raw)
          : {};

    /*
     * Package B adalah paket development
     * yang histori Tahap 0–2-nya memang
     * sudah selesai.
     *
     * Karena structured checklist memakai
     * storage terpisah dari packageStore,
     * jawaban Tahap 1 perlu diseed juga
     * agar state development konsisten.
     */
    if (
      !stored[
        DEVELOPMENT_PACKAGE_ID
      ]
    ) {
      stored[
        DEVELOPMENT_PACKAGE_ID
      ] =
        createDevelopmentPackageAnswers();

      window.localStorage.setItem(
        STRUCTURED_STORAGE_KEY,
        JSON.stringify(stored),
      );
    }

    return stored;
  } catch {
    const fallback:
      StoredStructuredAnswers = {
      [DEVELOPMENT_PACKAGE_ID]:
        createDevelopmentPackageAnswers(),
    };

    window.localStorage.setItem(
      STRUCTURED_STORAGE_KEY,
      JSON.stringify(fallback),
    );

    return fallback;
  }
}

function saveStructuredAnswers(
  value: StoredStructuredAnswers,
) {
  if (
    typeof window !== 'undefined'
  ) {
    window.localStorage.setItem(
      STRUCTURED_STORAGE_KEY,
      JSON.stringify(value),
    );
  }
}

function surveyVariant(
  survey: SurveyType,
  pciVariant:
    | 'PCI Manual'
    | 'PCI AI',
): SourceChecklistSurvey {
  return survey === 'PCI'
    ? pciVariant
    : survey;
}

/*
 * Phase lama dan phase structured tidak 100% sama.
 *
 * Khusus Verval Berkala:
 * legacy = consistency
 * structured = periodic14
 */
function mapStructuredPhase(
  phase: SourceChecklistPhase,
):
  | StructuredChecklistTemplate['phase']
  | undefined {
  if (phase === 'calibration') {
    return 'calibration';
  }

  if (phase === 'consistency') {
    return 'periodic14';
  }

  return undefined;
}

export function SourceAlignmentChecklist({
  packageId,
  phase,
  surveyTypes,
  role,
  editableRoles,
  onCompletionChange,
  title = 'Checklist QA/QC',
  defaultSurvey,
  hideSurveySelector = false,
}: {
  packageId: string;
  phase: SourceChecklistPhase;
  surveyTypes: SurveyType[];
  role: WorkflowRole;
  editableRoles: WorkflowRole[];
  onCompletionChange?: (
    survey: SurveyType,
    complete: boolean,
  ) => void;
  title?: string;
  defaultSurvey?: SurveyType;
  hideSurveySelector?: boolean;
}) {
  const available = useMemo(
    () =>
      surveyTypes.length > 0
        ? surveyTypes
        : (['IRI'] as SurveyType[]),
    [surveyTypes],
  );

  const [
    survey,
    setSurvey,
  ] =
    useState<SurveyType>(
      defaultSurvey &&
      available.includes(
        defaultSurvey,
      )
        ? defaultSurvey
        : available[0],
    );

  const [
    pciVariant,
    setPciVariant,
  ] =
    useState<
      'PCI Manual' | 'PCI AI'
    >('PCI Manual');

  const [
    legacyAnswers,
    setLegacyAnswers,
  ] =
    useState<StoredLegacyAnswers>(
      () =>
        loadLegacyAnswers(),
    );

  const [
    structuredAnswers,
    setStructuredAnswers,
  ] =
    useState<StoredStructuredAnswers>(
      () =>
        loadStructuredAnswers(),
    );

  /*
   * Selector utama Validasi Produksi
   * harus selalu mengontrol checklist
   * yang sedang ditampilkan.
   */
  useEffect(() => {
    if (
      defaultSurvey &&
      available.includes(
        defaultSurvey,
      )
    ) {
      setSurvey(
        defaultSurvey,
      );
      return;
    }

    if (
      !available.includes(
        survey,
      )
    ) {
      setSurvey(
        available[0],
      );
    }
  }, [
    defaultSurvey,
    available,
    survey,
  ]);

  const variant =
    surveyVariant(
      survey,
      pciVariant,
    );

  /*
   * =====================================================
   * STRUCTURED CHECKLIST
   * =====================================================
   */

  const structuredPhase =
    mapStructuredPhase(
      phase,
    );

  const structuredTemplate =
    structuredPhase
      ? getStructuredChecklistTemplate(
          variant,
          structuredPhase,
        )
      : undefined;

  const structuredPackage =
    structuredAnswers[
      packageId
    ] || {};

  const currentStructuredAnswers:
    StructuredChecklistAnswers =
      structuredTemplate
        ? structuredPackage[
            structuredTemplate.id
          ] || {}
        : {};

  const structuredProgress =
    structuredTemplate
      ? checklistProgress(
          structuredTemplate,
          currentStructuredAnswers,
        )
      : null;

  /*
   * Kirim status lengkap/tidak lengkap
   * ke workflow Tahap 1 / Tahap 3B.
   */
  useEffect(() => {
    if (
      !structuredTemplate ||
      !structuredProgress ||
      !onCompletionChange
    ) {
      return;
    }

    onCompletionChange(
      survey,
      structuredProgress.complete,
    );
  }, [
    structuredTemplate?.id,
    structuredProgress?.complete,
    onCompletionChange,
    survey,
  ]);

  /*
   * Renderer structured mengirim value string.
   * Di storage kita tetap simpan object:
   *
   * {
   *   value,
   *   note,
   *   evidenceReference
   * }
   *
   * sehingga nanti bisa ditambah catatan/evidence
   * tanpa bongkar struktur.
   */
  const updateStructuredAnswer = (
  itemId: string,
  patch: {
    value?: string;
    note?: string;
    evidenceReference?: string;
  },
) => {
  if (!structuredTemplate) {
    return;
  }

  const currentAnswer =
    currentStructuredAnswers[itemId] || {};

  const nextAnswers = {
    ...currentStructuredAnswers,

    [itemId]: {
      ...currentAnswer,
      ...patch,
    },
  };

  const next: StoredStructuredAnswers = {
    ...structuredAnswers,

    [packageId]: {
      ...structuredPackage,

      [structuredTemplate.id]:
        nextAnswers,
    },
  };

  setStructuredAnswers(next);
  saveStructuredAnswers(next);
};

  /*
   * Kalau template sudah dipetakan dari Draft PP,
   * pakai renderer structured.
   */
  if (
    structuredTemplate
  ) {
    return (
      <div className="source-checklist-wrapper">
        {!hideSurveySelector && (
          <section className="wf-panel source-checklist-selector">
            <div className="wf-panel-head">
              <h3>
                <BookOpen
                  size={14}
                />

                Jenis Survei
              </h3>
            </div>

            <div className="wf-body">
              <label className="wf-field">
                <span>
                  Jenis survei
                </span>

                <select
                  value={survey}
                  onChange={
                    event =>
                      setSurvey(
                        event
                          .target
                          .value as SurveyType,
                      )
                  }
                >
                  {available.map(
                    type => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </section>
        )}

        {survey === 'PCI' && (
          <section className="wf-panel">
            <div className="wf-body">
              <div className="pci-method-selector">
                <span className="pci-method-label">
                  Metode PCI
                </span>

                <div className="pci-method-options">
                  <button
                    type="button"
                    className={`wf-button ${
                      pciVariant ===
                      'PCI Manual'
                        ? 'primary'
                        : ''
                    }`}
                    onClick={() =>
                      setPciVariant(
                        'PCI Manual',
                      )
                    }
                  >
                    PCI Manual
                  </button>

                  <button
                    type="button"
                    className={`wf-button ${
                      pciVariant ===
                      'PCI AI'
                        ? 'primary'
                        : ''
                    }`}
                    onClick={() =>
                      setPciVariant(
                        'PCI AI',
                      )
                    }
                  >
                    PCI Berbasis AI
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <StructuredChecklistRenderer
  template={{
    ...structuredTemplate,
    title,
  }}
  role={role}
  answers={currentStructuredAnswers}
  readOnly={!editableRoles.includes(role)}
  onAnswerChange={(itemId, patch) => {
    const currentAnswer =
      currentStructuredAnswers[itemId] || {};

    const nextAnswers = {
      ...currentStructuredAnswers,

      [itemId]: {
        ...currentAnswer,
        ...patch,
      },
    };

    const next: StoredStructuredAnswers = {
      ...structuredAnswers,

      [packageId]: {
        ...structuredPackage,

        [structuredTemplate.id]:
          nextAnswers,
      },
    };

    setStructuredAnswers(next);
    saveStructuredAnswers(next);
  }}
/>
      </div>
    );
  }

  /*
   * =====================================================
   * LEGACY CHECKLIST
   * =====================================================
   *
   * Sementara tetap dipakai untuk survei yang
   * lampiran Word-nya belum selesai dimapping.
   *
   * Jangan kita mengarang struktur survei lain.
   */

  const templates =
    useMemo(
      () =>
        sourceChecklistTemplates(
          variant,
          phase,
        ),
      [
        variant,
        phase,
      ],
    );

  const template =
    templates[0];

  const canEdit =
    editableRoles.includes(
      role,
    );

  const packageAnswers =
    legacyAnswers[
      packageId
    ] || {};

  const checked:
    TemplateAnswers =
      template
        ? packageAnswers[
            template.id
          ] || {}
        : {};

  const completedCount =
    template
      ? template.items.filter(
          item =>
            !!checked[
              item
            ],
        ).length
      : 0;

  const totalCount =
    template?.items.length ||
    0;

  const legacyComplete =
    totalCount > 0 &&
    completedCount ===
      totalCount;

  useEffect(() => {
    if (
      structuredTemplate ||
      !onCompletionChange
    ) {
      return;
    }

    onCompletionChange(
      survey,
      legacyComplete,
    );
  }, [
    structuredTemplate,
    survey,
    legacyComplete,
    onCompletionChange,
  ]);

  const toggleLegacy = (
    item: string,
    value: boolean,
  ) => {
    if (
      !template ||
      !canEdit
    ) {
      return;
    }

    const next:
      StoredLegacyAnswers = {
      ...legacyAnswers,

      [packageId]: {
        ...packageAnswers,

        [template.id]: {
          ...checked,

          [item]:
            value,
        },
      },
    };

    setLegacyAnswers(
      next,
    );

    saveLegacyAnswers(
      next,
    );
  };

  return (
    <section
      className="wf-panel source-checklist-panel"
      data-testid={`source-checklist-${phase}`}
    >
      <div className="wf-panel-head">
        <h3>
          <BookOpen
            size={14}
          />

          {title}
        </h3>

        <span
          className={`wf-status ${
            legacyComplete
              ? 'good'
              : 'warn'
          }`}
        >
          {template
            ? `${completedCount} dari ${totalCount} dilengkapi`
            : 'Belum tersedia'}
        </span>
      </div>

      <div className="wf-body">
        {!hideSurveySelector && (
          <div className="wf-fields">
            <label className="wf-field">
              <span>
                Jenis survei
              </span>

              <select
                value={
                  survey
                }
                onChange={
                  event =>
                    setSurvey(
                      event
                        .target
                        .value as SurveyType,
                    )
                }
              >
                {available.map(
                  type => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
        )}

        {survey === 'PCI' && (
          <div className="pci-method-selector">
            <span className="pci-method-label">
              Metode PCI
            </span>

            <div className="pci-method-options">
              <button
                type="button"
                className={`wf-button ${
                  pciVariant ===
                  'PCI Manual'
                    ? 'primary'
                    : ''
                }`}
                onClick={() =>
                  setPciVariant(
                    'PCI Manual',
                  )
                }
              >
                PCI Manual
              </button>

              <button
                type="button"
                className={`wf-button ${
                  pciVariant ===
                  'PCI AI'
                    ? 'primary'
                    : ''
                }`}
                onClick={() =>
                  setPciVariant(
                    'PCI AI',
                  )
                }
              >
                PCI Berbasis AI
              </button>
            </div>
          </div>
        )}

        {!template ? (
          <div className="wf-callout warn">
            Checklist untuk{' '}
            <strong>
              {variant}
            </strong>{' '}
            pada kegiatan ini belum
            tersedia.
          </div>
        ) : (
          <>
            <div className="checklist-context">
              <div>
                <strong>
                  {variant}
                </strong>

                <span>
                  {canEdit
                    ? 'Lengkapi item pemeriksaan yang menjadi tanggung jawab Penyedia.'
                    : 'Checklist pengajuan Penyedia ditampilkan read-only untuk peran ini.'}
                </span>
              </div>

              <span
                className={`wf-status ${
                  legacyComplete
                    ? 'good'
                    : 'warn'
                }`}
              >
                {completedCount}/
                {totalCount}
              </span>
            </div>

            <details className="checklist-items-details">
              <summary>
                <span>
                  Buka checklist
                  pemeriksaan
                </span>

                <strong>
                  {completedCount}/
                  {totalCount}
                </strong>
              </summary>

              <div className="checklist-items-list">
                {template.items.map(
                  (
                    item,
                    index,
                  ) =>
                    canEdit ? (
                      <label
                        className="wf-row wf-check checklist-item-row"
                        key={`${item}-${index}`}
                      >
                        <input
                          type="checkbox"
                          checked={
                            !!checked[
                              item
                            ]
                          }
                          onChange={
                            event =>
                              toggleLegacy(
                                item,
                                event
                                  .target
                                  .checked,
                              )
                          }
                        />

                        <span>
                          {item}
                        </span>
                      </label>
                    ) : (
                      <div
                        className="wf-row checklist-item-row"
                        key={`${item}-${index}`}
                      >
                        <span>
                          {item}
                        </span>

                        {checked[
                          item
                        ] ? (
                          <span className="wf-status good">
                            <CheckCircle2
                              size={
                                12
                              }
                            />

                            Tercatat
                          </span>
                        ) : (
                          <span className="wf-status warn">
                            <CircleAlert
                              size={
                                12
                              }
                            />

                            Belum tercatat
                          </span>
                        )}
                      </div>
                    ),
                )}
              </div>
            </details>
          </>
        )}
      </div>
    </section>
  );
}