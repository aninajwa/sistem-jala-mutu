import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BookOpen,
  CheckCircle2,
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

type Phase3B =
  | 'consistency'
  | 'internal'
  | 'periodic14';

type Props = {
  packageId: string;
  surveyTypes: SurveyType[];
  role: WorkflowRole;

  onCompletionChange?: (
    phase: Phase3B,
    complete: boolean,
  ) => void;
};

type StoredAnswer =
  Record<string, boolean>;

type StoredAnswers =
  Record<string, StoredAnswer>;

const PHASES: Array<{
  id: Phase3B;
  label: string;
  description: string;
}> = [
  {
    id: 'consistency',
    label: 'Konsistensi',
    description:
      'Pengujian konsistensi / repeatability sesuai checklist sumber setiap jenis survei.',
  },
  {
    id: 'internal',
    label: 'Validasi Internal',
    description:
      'Verifikasi dan validasi internal oleh Penyedia Jasa sebelum review periodik.',
  },
  {
    id: 'periodic14',
    label: 'V&V 2-Mingguan',
    description:
      'Verifikasi dan validasi periode 14 hari sebagai bahan review PIC Balai.',
  },
];

function storageKey(
  packageId: string,
) {
  return `jala-mutu-stage3b-${packageId}-v1`;
}

function loadAnswers(
  packageId: string,
): StoredAnswers {
  if (
    typeof window === 'undefined'
  ) {
    return {};
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(
        storageKey(packageId),
      ) || '{}',
    ) as StoredAnswers;
  } catch {
    return {};
  }
}

function saveAnswers(
  packageId: string,
  answers: StoredAnswers,
) {
  if (
    typeof window !== 'undefined'
  ) {
    window.localStorage.setItem(
      storageKey(packageId),
      JSON.stringify(answers),
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

export function Stage3BSourceChecklist({
  packageId,
  surveyTypes,
  role,
  onCompletionChange,
}: Props) {
  const [
    phase,
    setPhase,
  ] =
    useState<Phase3B>(
      'consistency',
    );

  const [
    survey,
    setSurvey,
  ] =
    useState<SurveyType>(
      surveyTypes[0] ??
        'IRI',
    );

  const [
    pciVariant,
    setPciVariant,
  ] =
    useState<
      'PCI Manual' | 'PCI AI'
    >('PCI Manual');

  const [
    answers,
    setAnswers,
  ] =
    useState<StoredAnswers>(
      () =>
        loadAnswers(
          packageId,
        ),
    );

  useEffect(() => {
    if (
      !surveyTypes.includes(
        survey,
      )
    ) {
      setSurvey(
        surveyTypes[0] ??
          'IRI',
      );
    }
  }, [
    surveyTypes,
    survey,
  ]);

  const variant =
    surveyVariant(
      survey,
      pciVariant,
    );

  const templates =
    useMemo(
      () =>
        sourceChecklistTemplates(
          variant,
          phase as SourceChecklistPhase,
        ),
      [
        variant,
        phase,
      ],
    );

  const template =
    templates[0];

  const canEdit =
    role ===
      'Penyedia Jasa / Ketua Tim' ||
    role === 'Admin';

  const checked =
    template
      ? answers[
          template.id
        ] ?? {}
      : {};

  const complete =
    template
      ? template.items.filter(
          item =>
            checked[item],
        ).length
      : 0;

  const setItem = (
    item: string,
    value: boolean,
  ) => {
    if (
      !template ||
      !canEdit
    ) {
      return;
    }

    const next = {
      ...answers,

      [template.id]: {
        ...checked,
        [item]: value,
      },
    };

    setAnswers(next);

    saveAnswers(
      packageId,
      next,
    );
  };

  const phaseComplete = (
    phaseId: Phase3B,
  ) => {
    const scopedVariants:
      SourceChecklistSurvey[] =
      surveyTypes.flatMap(
        type =>
          type === 'PCI'
            ? [
                'PCI Manual',
                'PCI AI',
              ]
            : [type],
      ) as SourceChecklistSurvey[];

    const allTemplates =
      scopedVariants.flatMap(
        scopedSurvey =>
          sourceChecklistTemplates(
            scopedSurvey,
            phaseId,
          ),
      );

    if (
      !allTemplates.length
    ) {
      return false;
    }

    return allTemplates.every(
      current =>
        current.items.length >
          0 &&
        current.items.every(
          item =>
            !!answers[
              current.id
            ]?.[item],
        ),
    );
  };

  useEffect(() => {
    PHASES.forEach(
      item => {
        onCompletionChange?.(
          item.id,
          phaseComplete(
            item.id,
          ),
        );
      },
    );
  }, [
    answers,
    surveyTypes.join('|'),
  ]);

  return (
    <section className="wf-panel">
      <div className="wf-panel-head">
        <h3>
          <BookOpen
            size={14}
          />

          Checklist Tahap 3B
        </h3>

        <span
          className={`wf-status ${
            template &&
            complete ===
              template.items.length &&
            template.items.length >
              0
              ? 'good'
              : 'warn'
          }`}
        >
          {template
            ? `${complete}/${template.items.length} item`
            : 'Template belum tersedia'}
        </span>
      </div>

      <div className="wf-body">
        <div className="wf-toolbar">
          {PHASES.map(
            item => (
              <button
                key={item.id}
                type="button"
                className={`wf-button ${
                  phase ===
                  item.id
                    ? 'primary'
                    : ''
                }`}
                onClick={() =>
                  setPhase(
                    item.id,
                  )
                }
              >
                {item.label}
              </button>
            ),
          )}
        </div>

        <div
          className="wf-callout"
          style={{
            marginTop: 10,
          }}
        >
          <strong>
            {
              PHASES.find(
                item =>
                  item.id ===
                  phase,
              )?.label
            }
          </strong>

          <div
            className="wf-note"
            style={{
              marginTop: 4,
            }}
          >
            {
              PHASES.find(
                item =>
                  item.id ===
                  phase,
              )?.description
            }
          </div>
        </div>

        <div
          className="wf-fields"
          style={{
            marginTop: 10,
          }}
        >
          <label className="wf-field">
            <span>
              Jenis survei
            </span>

            <select
              value={survey}
              onChange={
                event =>
                  setSurvey(
                    event.target
                      .value as
                      SurveyType,
                  )
              }
            >
              {surveyTypes.map(
                type => (
                  <option
                    key={type}
                  >
                    {type}
                  </option>
                ),
              )}
            </select>
          </label>

          {survey ===
            'PCI' && (
            <label className="wf-field">
              <span>
                Metode PCI
              </span>

              <select
                value={
                  pciVariant
                }
                onChange={
                  event =>
                    setPciVariant(
                      event
                        .target
                        .value as
                        | 'PCI Manual'
                        | 'PCI AI',
                    )
                }
              >
                <option>
                  PCI Manual
                </option>

                <option>
                  PCI AI
                </option>
              </select>
            </label>
          )}
        </div>

        {!template ? (
          <div
            className="wf-callout warn"
            style={{
              marginTop: 10,
            }}
          >
            Checklist sumber
            untuk{' '}
            <strong>
              {variant}
            </strong>{' '}
            /{' '}
            <strong>
              {phase}
            </strong>{' '}
            belum tersedia.
            Sistem tidak
            membuat item
            pengganti secara
            asumsi.
          </div>
        ) : (
          <>
            <div
              className="wf-callout"
              style={{
                marginTop: 10,
              }}
            >
              <strong>
                {template.title}
              </strong>

              <br />

              Sumber:{' '}
              {
                template.sourceFile
              }.
            </div>

            {template.sections
              .length > 0 && (
              <details
                style={{
                  marginTop: 10,
                }}
              >
                <summary
                  className="wf-note"
                  style={{
                    cursor:
                      'pointer',
                    fontWeight:
                      700,
                  }}
                >
                  Struktur
                  checklist (
                  {
                    template
                      .sections
                      .length
                  }{' '}
                  bagian)
                </summary>

                <div
                  style={{
                    marginTop: 7,
                  }}
                >
                  {template.sections.map(
                    section => (
                      <div
                        className="wf-row"
                        key={
                          section
                        }
                      >
                        <span>
                          {
                            section
                          }
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </details>
            )}

            <div
              style={{
                marginTop: 10,
              }}
            >
              {template.items.map(
                (
                  item,
                  index,
                ) => (
                  <label
                    className="wf-row wf-check production-trial-check"
                    key={`${item}-${index}`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        !!checked[
                          item
                        ]
                      }
                      disabled={
                        !canEdit
                      }
                      onChange={
                        event =>
                          setItem(
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
                ),
              )}
            </div>

            {template.items
              .length > 0 &&
              complete ===
                template
                  .items
                  .length && (
                <div
                  className="wf-callout"
                  style={{
                    marginTop: 10,
                  }}
                >
                  <CheckCircle2
                    size={13}
                  />{' '}
                  Checklist{' '}
                  {
                    PHASES.find(
                      item =>
                        item.id ===
                        phase,
                    )?.label
                  }{' '}
                  untuk{' '}
                  {variant}{' '}
                  lengkap.
                </div>
              )}
          </>
        )}
      </div>
    </section>
  );
}