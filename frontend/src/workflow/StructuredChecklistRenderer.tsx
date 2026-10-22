import {useState} from 'react';
import {itemIsComplete} from './structuredChecklist';
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
  return /^(tidak|belum|gagal)\b/i.test(value.trim());
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
      className={`wf-status ${isNegative(value)?'warn':'info'}`}
    >
      <CheckCircle2 size={12} />
      {value==='checked'?'Tercatat':value}
    </span>
  );
}

function ChecklistTable({
  item,answer,editable,onChange,
}: {
  item: StructuredChecklistItem;answer?:StructuredChecklistAnswer;editable:boolean;onChange:(value:string)=>void;
}) {
  const columns =
    item.tableColumns || [];

  let saved:Record<string,string>={};try{saved=JSON.parse(answer?.value||'{}');}catch{}
  const rows=item.tableRows?.length?item.tableRows:[{}];

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
                    {row[column]!==undefined&&String(row[column]).trim()&&!/^(—|-|\[.*\])$/.test(String(row[column]))?<span>{row[column]}</span>:editable?<input aria-label={`${item.label}: baris ${rowIndex+1}, ${column}`} value={saved[`${rowIndex}:${column}`]??''} onChange={e=>onChange(JSON.stringify({...saved,[`${rowIndex}:${column}`]:e.target.value}))}/>:<span>{saved[`${rowIndex}:${column}`]||'Belum diisi'}</span>}
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
  const [filter,setFilter]=useState<'all'|'missing'|'attention'>('all');
  return (
    <div className="structured-checklist">
      <div className="checklist-filter"><label>Tampilkan <select aria-label="Filter jawaban checklist" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">Semua butir</option><option value="missing">Belum dijawab</option><option value="attention">Perlu pemeriksaan</option></select></label><small>Jawaban lengkap bukan keputusan reviewer.</small></div>
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
                </strong><span className="category-progress">{section.items.filter(item=>itemIsComplete(item,answers[item.id])).length}/{section.items.length} terisi</span>
              </div>
            </summary>

            {section.description && (
              <p className="structured-section-description">
                {section.description}
              </p>
            )}

            <div className="structured-checklist-items">
              {section.items.filter(item=>filter==='all'||filter==='missing'&&!itemIsComplete(item,answers[item.id])||filter==='attention'&&isNegative(answers[item.id]?.value??'')).map(item => {
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
                        item={item} answer={answers[item.id]} editable={canEdit} onChange={value=>{if(canEdit)onAnswerChange(item.id,{value});}}
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
                                  <label key={option} className={`structured-choice ${value===option?'selected':''} ${isNegative(option)?'negative':''}`}>
                                    <input type="radio" name={`${template.id}:${item.id}`} aria-label={`${item.label}: ${option}`} checked={value===option} onChange={()=>{if(canEdit)onAnswerChange(item.id,{value:option});}}/>
                                    {option}
                                  </label>
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

                          {item.noteAllowed && (<details className="checklist-item-notes" open={item.noteRequired&&!answer.note?true:undefined}><summary>Catatan{item.noteRequired?' · wajib':''}{answer.note?' · tersimpan':''}</summary>
                            <textarea
                              rows={2}
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
                            /></details>
                          )}

                          {item.evidenceAllowed && (
                            <details className="structured-evidence"><summary>Referensi lampiran{item.evidenceRequired?' · wajib':''}</summary>
                              <div className="structured-evidence-title">
                                <Paperclip
                                  size={13}
                                />
                                Bukti pendukung
                                {item.evidenceRequired
                                  ? ' *'
                                  : ' · opsional'}
                              </div>

                              <p className="wf-note">Lampirkan dokumen/foto pada area Lampiran tahap. Kolom ini hanya referensi bukti, bukan unggahan berkas.</p>
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
                            </details>
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