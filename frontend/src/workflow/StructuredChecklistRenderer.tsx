import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Paperclip,
} from 'lucide-react';

import type {
  WorkflowRole,
} from './model';

import type {
  StructuredChecklistAnswer,
  StructuredChecklistAnswers,
  StructuredChecklistItem,
  StructuredChecklistTemplate,
} from './structuredChecklist';

type Props = {
  template: StructuredChecklistTemplate;
  role: WorkflowRole;
  answers: StructuredChecklistAnswers;

  onAnswerChange: (
    itemId: string,
    patch: Partial<StructuredChecklistAnswer>,
  ) => void;

  readOnly?: boolean;
};

function isNegative(value: string) {
  return [
    'Tidak',
    'Tidak Memenuhi',
    'Tidak Ada',
  ].includes(value);
}

function ResponseDisplay({
  value,
}: {
  value: string;
}) {
  if (!value) {
    return (
      <span className="wf-status warn">
        <CircleAlert size={12} />
        Belum diisi
      </span>
    );
  }

  return (
    <span
      className={`wf-status ${
        isNegative(value)
          ? 'warn'
          : 'good'
      }`}
    >
      <CheckCircle2 size={12} />
      {value}
    </span>
  );
}

function ChecklistTable({
  item,
}: {
  item: StructuredChecklistItem;
}) {
  const columns =
    item.tableColumns || [];

  const rows =
    item.tableRows || [];

  if (columns.length === 0) {
    return (
      <div className="structured-table-empty">
        Belum ada struktur hasil.
      </div>
    );
  }

  return (
    <div className="structured-table-wrap">
      <table className="structured-result-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map(column => (
                  <td
                    key={`${rowIndex}-${column}`}
                  >
                    {row[column] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="structured-table-empty-cell"
              >
                Belum ada data hasil validasi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StructuredChecklistRenderer({
  template,
  role,
  answers,
  onAnswerChange,
  readOnly = false,
}: Props) {
  return (
    <div className="structured-checklist">
      {template.sections.map(
        (section, index) => (
          <details
            key={section.id}
            className="structured-checklist-section"
            open={index === 0}
          >
            <summary>
              <div className="structured-section-heading">
                {section.number && (
                  <span className="structured-section-number">
                    {section.number}
                  </span>
                )}

                <strong>
                  {section.title}
                </strong>
              </div>
            </summary>

            {section.description && (
              <p className="structured-section-description">
                {section.description}
              </p>
            )}

            <div className="structured-checklist-items">
              {section.items.map(item => {
                const answer =
                  answers[item.id] || {};

                const value =
                  answer.value || '';

                const roleCanEdit =
                  !item.editableRoles ||
                  item.editableRoles.includes(role);

                const canEdit =
                  !readOnly &&
                  roleCanEdit &&
                  item.dataOrigin !== 'package' &&
                  item.dataOrigin !==
                    'source-system' &&
                  item.dataOrigin !== 'system';

                /*
                 * INFORMASI OTOMATIS / READ ONLY
                 */
                if (
                  item.responseType ===
                  'readonly'
                ) {
                  return (
                    <div
                      key={item.id}
                      className="structured-checklist-item structured-readonly-item"
                    >
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

                      <span className="structured-readonly-value">
                        Data paket
                      </span>
                    </div>
                  );
                }

                /*
                 * HASIL VALIDASI BERBENTUK TABEL
                 */
                if (
                  item.responseType ===
                  'table'
                ) {
                  return (
                    <div
                      key={item.id}
                      className="structured-checklist-table-item"
                    >
                      {item.label && (
                        <div className="structured-table-title">
                          {item.label}
                        </div>
                      )}

                      <ChecklistTable
                        item={item}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="structured-checklist-item"
                  >
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

                    <div className="structured-checklist-response">
                      {canEdit ? (
                        <>
                        {item.responseType === 'check' && (
  <label className="structured-single-check">
    <input
      type="checkbox"
      checked={value === 'checked'}
      onChange={event =>
        onAnswerChange(
          item.id,
          {
            value:
              event.target.checked
                ? 'checked'
                : '',
          },
        )
      }
    />

    <span>
      {value === 'checked'
        ? 'Tercatat'
        : 'Belum ditandai'}
    </span>
  </label>
)}
                          {(item.responseType ===
                            'yes-no' ||
                            item.responseType ===
                              'comply' ||
                            item.responseType ===
                              'availability') && (
                            <div className="structured-checklist-options">
                              {(item.options || []).map(
                                option => (
                                  <button
                                    key={option}
                                    type="button"
                                    className={`structured-choice ${
                                      value ===
                                      option
                                        ? 'selected'
                                        : ''
                                    } ${
                                      isNegative(
                                        option,
                                      )
                                        ? 'negative'
                                        : ''
                                    }`}
                                    onClick={() =>
  onAnswerChange(
    item.id,
    {
      value:
        value === option
          ? ''
          : option,
    },
  )
}
                                  >
                                    {option}
                                  </button>
                                ),
                              )}
                            </div>
                          )}

                          {item.responseType ===
                            'text' && (
                            <input
                              type="text"
                              value={value}
                              onChange={event =>
                                onAnswerChange(
                                  item.id,
                                  {
                                    value:
                                      event.target
                                        .value,
                                  },
                                )
                              }
                            />
                          )}

                          {item.responseType ===
                            'number' && (
                            <input
                              type="number"
                              value={value}
                              onChange={event =>
                                onAnswerChange(
                                  item.id,
                                  {
                                    value:
                                      event.target
                                        .value,
                                  },
                                )
                              }
                            />
                          )}

                          {item.noteAllowed && (
                            <textarea
                              className="structured-note-input"
                              value={
                                answer.note || ''
                              }
                              placeholder="Catatan / keterangan"
                              onChange={event =>
                                onAnswerChange(
                                  item.id,
                                  {
                                    note:
                                      event.target
                                        .value,
                                  },
                                )
                              }
                            />
                          )}

                          {item.evidenceAllowed && (
                            <div className="structured-evidence">
                              <div className="structured-evidence-title">
                                <Paperclip
                                  size={13}
                                />
                                Bukti pendukung
                                {item.evidenceRequired
                                  ? ' *'
                                  : ' · opsional'}
                              </div>

                              <label className="structured-evidence-file">
                                <input
                                  type="file"
                                  onChange={event => {
                                    const file =
                                      event
                                        .target
                                        .files?.[0];

                                    if (!file) {
                                      return;
                                    }

                                    onAnswerChange(
                                      item.id,
                                      {
                                        evidenceReference:
                                          file.name,
                                      },
                                    );
                                  }}
                                />

                                <span className="wf-button">
                                  <Paperclip
                                    size={12}
                                  />
                                  Pilih file
                                </span>
                              </label>

                              <input
                                type="text"
                                value={
                                  answer.evidenceReference ||
                                  ''
                                }
                                placeholder="Nomor dokumen / BA / referensi bukti"
                                onChange={event =>
                                  onAnswerChange(
                                    item.id,
                                    {
                                      evidenceReference:
                                        event.target
                                          .value,
                                    },
                                  )
                                }
                              />

                              {answer.evidenceReference && (
                                <div className="structured-evidence-current">
                                  <FileText
                                    size={13}
                                  />

                                  <span>
                                    {
                                      answer.evidenceReference
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="structured-readonly-response">
                          <ResponseDisplay
                            value={value}
                          />

                          {answer.note && (
                            <div className="structured-readonly-note">
                              {answer.note}
                            </div>
                          )}

                          {item.evidenceAllowed &&
                            answer.evidenceReference && (
                              <div className="structured-evidence-current">
                                <FileText
                                  size={13}
                                />
                                {
                                  answer.evidenceReference
                                }
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ),
      )}
    </div>
  );
}