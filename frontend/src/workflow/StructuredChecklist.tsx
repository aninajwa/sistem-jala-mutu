import {
  ChevronDown,
  FileText,
} from 'lucide-react';

import type {
  WorkflowRole,
} from './model';

import {
  checklistProgress,
  type ChecklistChoice,
  type StructuredChecklistAnswer,
  type StructuredChecklistAnswers,
  type StructuredChecklistItem,
  type StructuredChecklistTemplate,
} from './structuredChecklist';

type Props = {
  template: StructuredChecklistTemplate;
  role: WorkflowRole;

  answers: StructuredChecklistAnswers;

  onChange: (
    itemId: string,
    answer: StructuredChecklistAnswer,
  ) => void;

  readOnly?: boolean;
};

function ChoiceButtons({
  item,
  answer,
  disabled,
  onChange,
}: {
  item: StructuredChecklistItem;
  answer?: StructuredChecklistAnswer;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const options =
    item.options || [];

  return (
    <div className="structured-checklist-options">
      {options.map(option => {
        const selected =
          answer?.value === option;

        return (
          <button
            type="button"
            key={option}
            disabled={disabled}
            className={`structured-choice ${
              selected ? 'selected' : ''
            } ${
              option === 'Tidak' ||
              option === 'Tidak Memenuhi' ||
              option === 'Tidak Ada'
                ? 'negative'
                : ''
            }`}
            onClick={() =>
              onChange(option)
            }
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ChecklistItem({
  item,
  answer,
  role,
  readOnly,
  onChange,
}: {
  item: StructuredChecklistItem;
  answer?: StructuredChecklistAnswer;
  role: WorkflowRole;
  readOnly: boolean;
  onChange: (
    answer: StructuredChecklistAnswer,
  ) => void;
}) {
  const canEditByRole =
    !item.editableRoles ||
    item.editableRoles.includes(role);

  const disabled =
    readOnly ||
    !canEditByRole ||
    item.dataOrigin === 'package' ||
    item.dataOrigin === 'source-system' ||
    item.dataOrigin === 'system';

  const setValue = (
    value: string,
  ) => {
    if (disabled) return;

    onChange({
      ...answer,
      value,
    });
  };

  const isChoice =
    item.responseType === 'yes-no' ||
    item.responseType === 'comply' ||
    item.responseType === 'availability';

  return (
    <div className="structured-checklist-item">
      <div className="structured-checklist-question">
        {item.number && (
          <span className="structured-item-number">
            {item.number}
          </span>
        )}

        <div>
          <strong>
            {item.label}
          </strong>

          {item.description && (
            <p>
              {item.description}
            </p>
          )}
        </div>
      </div>

      {item.responseType ===
        'readonly' && (
        <div className="structured-readonly-value">
          {answer?.value ||
            'Mengikuti data paket / sistem'}
        </div>
      )}

      {isChoice && (
        <ChoiceButtons
          item={item}
          answer={answer}
          disabled={disabled}
          onChange={setValue}
        />
      )}

      {item.responseType ===
        'text' && (
        <input
          type="text"
          disabled={disabled}
          value={answer?.value || ''}
          onChange={event =>
            setValue(
              event.target.value,
            )
          }
          placeholder="Isi sesuai dokumen / hasil pemeriksaan"
        />
      )}

      {item.responseType ===
        'number' && (
        <input
          type="number"
          disabled={disabled}
          value={answer?.value || ''}
          onChange={event =>
            setValue(
              event.target.value,
            )
          }
        />
      )}

      {item.responseType ===
        'table' && (
        <div className="structured-table-placeholder">
          Data hasil ditampilkan pada tabel pemeriksaan terkait.
        </div>
      )}

      {(item.noteAllowed ||
        item.noteRequired) && (
        <textarea
          className="structured-item-note"
          disabled={disabled}
          value={
            answer?.note || ''
          }
          onChange={event =>
            onChange({
              ...answer,
              note:
                event.target.value,
            })
          }
          placeholder={
            item.noteRequired
              ? 'Keterangan wajib'
              : 'Keterangan'
          }
        />
      )}

      {(item.evidenceAllowed ||
        item.evidenceRequired) && (
        <div className="structured-evidence-reference">
          <FileText size={13} />

          <input
            type="text"
            disabled={disabled}
            value={
              answer?.evidenceReference ||
              ''
            }
            onChange={event =>
              onChange({
                ...answer,
                evidenceReference:
                  event.target.value,
              })
            }
            placeholder={
              item.evidenceRequired
                ? 'Referensi bukti wajib'
                : 'Nomor / nama / referensi bukti'
            }
          />
        </div>
      )}
    </div>
  );
}

export function StructuredChecklist({
  template,
  role,
  answers,
  onChange,
  readOnly = false,
}: Props) {
  const progress =
    checklistProgress(
      template,
      answers,
    );

  return (
    <section className="wf-panel structured-checklist">
      <div className="wf-panel-head">
        <div>
          <h3>
            {template.title}
          </h3>

          <span className="wf-note">
            {progress.completed} dari{' '}
            {progress.total} item
            dilengkapi
          </span>
        </div>

        <span
          className={`wf-status ${
            progress.complete
              ? 'good'
              : 'warn'
          }`}
        >
          {progress.complete
            ? 'Lengkap'
            : 'Belum lengkap'}
        </span>
      </div>

      <div className="wf-body structured-checklist-body">
        {template.sections.map(
          (
            section,
            sectionIndex,
          ) => (
            <details
              key={section.id}
              className="structured-checklist-section"
              open={sectionIndex === 0}
            >
              <summary>
                <div>
                  {section.number && (
                    <span className="structured-section-number">
                      {section.number}
                    </span>
                  )}

                  <strong>
                    {section.title}
                  </strong>
                </div>

                <ChevronDown
                  size={14}
                />
              </summary>

              {section.description && (
                <p className="structured-section-description">
                  {
                    section.description
                  }
                </p>
              )}

              <div className="structured-checklist-items">
                {section.items.map(
                  item => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      answer={
                        answers[
                          item.id
                        ]
                      }
                      role={role}
                      readOnly={
                        readOnly
                      }
                      onChange={answer =>
                        onChange(
                          item.id,
                          answer,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </details>
          ),
        )}
      </div>
    </section>
  );
}