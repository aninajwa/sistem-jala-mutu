import {DocumentAttachments,documentAttachmentId} from './DocumentAttachments';
import {projectChecklistValue as automaticProjectValue} from './checklistProjectValues';
import { localPersistence } from './repository/localPersistence';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Stage3BFileEvidence } from './Stage3BFileEvidence';

import type { SurveyType, WorkflowRole } from './model';
import {
  STAGE3B_DOCX_CANDIDATES,
} from './stage3bChecklistData.docx-candidate';
import type {
  Stage3BItem,
  Stage3BPhase,
  Stage3BTemplate,
} from './stage3bChecklistData.generated';

type Props = {
  packageId: string;
  onAnswersChanged?: () => void;
  surveyTypes: SurveyType[];
  role: WorkflowRole;
  projectInfo?: { packageName: string; contractor: string; balai: string; satker: string; ppk: string; routes: string[]; contractNumber?: string };
  periodStart?: string;
  periodEnd?: string;
  onCompletionChange?: (
    phase: Stage3BPhase,
    complete: boolean,
  ) => void;
};

type Answers = Record<string, string>;

const PHASES: {
  id: Stage3BPhase;
  label: string;
}[] = [
  { id: 'consistency', label: 'Konsistensi' },
  { id: 'internal', label: 'Validasi Internal' },
  { id: 'periodic14', label: 'V&V 2-Mingguan' },
];

const TEMPLATES: Stage3BTemplate[] =
  STAGE3B_DOCX_CANDIDATES;

function keyFor(
  packageId: string,
  template: Stage3BTemplate,
  item: Stage3BItem,
  cell = '',
) {
  return [
    packageId,
    template.id,
    item.code,
    cell,
  ].join('::');
}

function storeKey(packageId: string) {
  return `jala-mutu-stage3b-docx-${packageId}-v1`;
}

function readAnswers(packageId: string): Answers {
  try {
    const raw = localPersistence.getItem(storeKey(packageId));
    return raw ? JSON.parse(raw) as Answers : {};
  } catch {
    return {};
  }
}

// Pilihan dalam dokumen sumber dapat masih berbentuk simbol kotak Word.
// Parser ini hanya mengubah bentuk tampilannya; bukan mengubah business rule.
function sourceChoices(value: string): { prefix: string; choices: string[] } | null {
  if (!/[□☐]/.test(value)) return null;
  const segments = value.split(/[□☐]/);
  const prefix = segments.shift()?.trim() ?? '';
  const choices = segments.map(part => part.trim()).filter(Boolean);
  return choices.length ? { prefix, choices } : null;
}


function isAttachmentSection(section: string) {
  return /lampiran|dokumen pendukung/i.test(section);
}


// Pilihan status pada tabel sumber dapat diwakili oleh header kolom,
// sementara sel aslinya hanya berisi simbol kotak □ tanpa label.
function optionHeader(label: string): string | null {
  const value = label.replace(/[□☐☑✓]/g, '').replace(/\s+/g, ' ').trim();
  const choices = new Set([
    'ya','tidak','n/a','na','sesuai','tidak sesuai','sesuai standar',
    'tidak sesuai standar','ada','tidak ada','memenuhi','tidak memenuhi',
    'baik','tidak baik','lengkap','tidak lengkap','diterapkan',
    'tidak diterapkan','terverifikasi','tidak terverifikasi',
    'konsisten','tidak konsisten','tinggi','sedang','rendah','selesai','proses'
  ]);
  return choices.has(value.toLowerCase()) ? value : null;
}

function isPlaceholder(value: string) {
  const text = value.trim();

  return (
    !text ||
    /^\[.*\]$/.test(text) ||
    /^\.{3,}$/.test(text) ||
    /^_{3,}$/.test(text)
  );
}

function isDocumentDecoration(value: string) {
  const text = value.trim().toLowerCase();

  return (
    text.startsWith('kementerian pekerjaan umum') ||
    text.startsWith('direktorat jenderal bina marga') ||
    text.startsWith('no. dok.') ||
    text.startsWith('no. rev.') ||
    text.startsWith('checklist verifikasi dan validasi') ||
    text.startsWith('checklist konsistensi survei')
  );
}

function groupedSections(template: Stage3BTemplate) {
  const groups = new Map<string, Stage3BItem[]>();

  for (const item of template.items) {
    const section = item.section || 'Pemeriksaan';
    const current = groups.get(section) ?? [];
    current.push(item);
    groups.set(section, current);
  }

  return [...groups.entries()];
}

function getRows(item: Stage3BItem): string[][] {
  const value = item.metadata?.source_rows;

  if (!Array.isArray(value)) return [];

  return value.map(row =>
    Array.isArray(row)
      ? row.map(cell => String(cell ?? ''))
      : [String(row ?? '')],
  );
}

function getColumns(item: Stage3BItem): string[] {
  const value = item.metadata?.table_columns;

  if (!Array.isArray(value)) return [];

  return value.map(column => String(column ?? ''));
}

export function Stage3BSourceChecklist({
  packageId,
  surveyTypes,
  role,
  projectInfo,
  onCompletionChange,
  periodStart,
  periodEnd,
  onAnswersChanged,
}: Props) {
  const [phase, setPhase] =
    useState<Stage3BPhase>('consistency');

  const [survey, setSurvey] = useState<SurveyType>(
    surveyTypes[0] ?? 'IRI',
  );

  const [pciMethod, setPciMethod] = useState<
    'PCI Manual' | 'PCI AI'
  >('PCI Manual');

  const [answers, setAnswers] = useState<Answers>(
    () => readAnswers(packageId),
  );

  useEffect(() => {
    setAnswers(readAnswers(packageId));
  }, [packageId]);

  useEffect(() => {
    if (!surveyTypes.includes(survey)) {
      setSurvey(surveyTypes[0] ?? 'IRI');
    }
  }, [survey, surveyTypes]);

  const canEdit =
    role === 'Penyedia Jasa / Ketua Tim' ;

  const variant =
    survey === 'PCI' ? pciMethod : survey;

  const template = useMemo(
    () => TEMPLATES.find(
      candidate =>
        candidate.survey === variant &&
        candidate.phase === phase,
    ),
    [variant, phase],
  );

  const sections = useMemo(
    () => template ? groupedSections(template) : [],
    [template],
  );

  function update(key: string, value: string) {
    if (!canEdit) return;

    const next = {
      ...answers,
      [key]: value,
    };

    setAnswers(next);
    onAnswersChanged?.();

    try {localPersistence.setItem(storeKey(packageId),JSON.stringify(next));} catch { /* local state remains usable */ }
  }

  // Hitung jawaban seluruh kombinasi jenis survei dan kegiatan untuk periode aktif.
  // Tabel tanpa opsi yang dapat dikonfirmasi tidak boleh otomatis dianggap lengkap.
  const readiness = useMemo(() => {
    const result: Record<Stage3BPhase, {done: number; total: number; uncertain: number}> = {
      consistency: {done:0,total:0,uncertain:0},
      internal: {done:0,total:0,uncertain:0},
      periodic14: {done:0,total:0,uncertain:0},
    };
    const variants = surveyTypes.flatMap(type => type === 'PCI' ? [pciMethod] : [type]);
    for (const variantName of variants) {
      for (const p of PHASES) {
        const target = TEMPLATES.find(t => t.survey === variantName && t.phase === p.id);
        if (!target) { result[p.id].total++; continue; }
        const dest = result[p.id];
        for (const item of target.items) {
          if (!item.required || isDocumentDecoration(item.label)) continue;
          // Informasi administratif tidak dihitung sebagai pemeriksaan teknis.
          if (automaticProjectValue(item.label, projectInfo) !== undefined) continue;
          if (/^(no\.?\s*dokumen|nomor dokumen|tanggal\s*:)/i.test(item.label.trim())) continue;
          if (isAttachmentSection(item.section)) continue; // Bukti dikelola di area Lampiran, bukan upload wajib per butir.
          if (item.inputType.toUpperCase() === 'JSON') {
            const columns = getColumns(item);
            const rows = getRows(item);
            const optionCols = columns.map(c => optionHeader(c)).filter(Boolean);
            if (optionCols.length >= 2) {
              for (let i=0;i<rows.length;i++) {
                const row = rows[i];
                const choices = columns.map((c,j)=>optionHeader(c) && /^[□☐\s]*$/.test(row[j]??'')).some(Boolean);
                if (!choices) continue; // subjudul dan baris keterangan bukan pertanyaan
                dest.total++;
                if (answers[keyFor(packageId,target,item,`status:${i}`)]?.trim()) dest.done++;
              }
            } else {
              // Jangan memberi status hijau untuk tabel numerik / status tunggal tanpa aturan pemetaan.
              const cells=rows.flatMap((row,i)=>row.map((cell,j)=>({cell,i,j}))).filter(({cell,j})=>isPlaceholder(cell)&&!(/foto|gambar|screenshot/i.test(columns[j]??'')));
              if(!cells.length) continue; // tabel informatif dari sumber
              for(const {i,j} of cells){
                dest.total++;
                if(answers[keyFor(packageId,target,item,`${i}:${j}`)]?.trim() || automaticProjectValue(rows[i]?.[0]??'',projectInfo)!==undefined)dest.done++;
              }
            }
          } else {
            dest.total++;
            if (answers[keyFor(packageId,target,item)]?.trim()) dest.done++;
          }
        }
      }
    }
    return result;
  }, [answers, packageId, surveyTypes, pciMethod, projectInfo]);

  useEffect(() => {
    if (!onCompletionChange) return;
    for (const entry of PHASES) {
      const value = readiness[entry.id];
      onCompletionChange(entry.id, value.total > 0 && value.done === value.total && value.uncertain === 0);
    }
  }, [readiness, onCompletionChange]);

  const entered = template
    ? Object.keys(answers).filter(key =>
        key.startsWith(
          `${packageId}::${template.id}::`,
        ) &&
        answers[key]?.trim(),
      ).length
    : 0;

  function renderSourceChoices(
    value: string,
    answerKey: string,
  ) {
    const parsed = sourceChoices(value);
    if (!parsed) return null;

    // Pilihan dari satu kelompok dokumen diperlakukan sebagai single-choice.
    // Satu kotak diperlakukan sebagai centang Ya/Tidak.
    return (
      <div className="s3doc-choice-group">
        {parsed.prefix && (
          <span className="s3doc-choice-prefix">{parsed.prefix}</span>
        )}
        {parsed.choices.map((choice, index) => {
          const label = choice || `Pilihan ${index + 1}`;
          const selected = answers[answerKey] === label;
          return (
            <label className="s3doc-choice" key={`${index}:${label}`}>
              <input
                type={parsed.choices.length > 1 ? 'radio' : 'checkbox'}
                name={answerKey}
                checked={selected}
                disabled={!canEdit}
                onChange={() => update(answerKey, selected ? '' : label)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  function renderItem(item: Stage3BItem) {
    if (!template) return null;

    if (isDocumentDecoration(item.label)) return null;

    const inputKey = keyFor(packageId, template, item);
    const inputType = item.inputType.toUpperCase();
    const textLabel=item.label.trim();
    const automaticPeriod = /periode (konsistensi|pemeriksaan|verifikasi)|masa pemeriksaan/i.test(textLabel) && periodStart && periodEnd ? `${periodStart} s.d. ${periodEnd}` : undefined;
    const automaticDate:string|undefined = undefined;

    // Lampiran dari Draft PP adalah dokumen pendukung, bukan jawaban bebas.
    // Proses lebih dulu supaya label yang tidak mengandung kata 'dokumen'
    // (mis. grafik / tabel deviasi / hasil repeatability) tidak menjadi textarea.
    if (isAttachmentSection(item.section) && inputType !== 'JSON') {
      return <div><a href={`#${documentAttachmentId(`${packageId}:form-${template.id}`)}`}>{item.label} · kelola Dokumen &amp; Lampiran</a><details><summary>Berkas yang pernah dicatat</summary><Stage3BFileEvidence packageId={packageId} evidenceId={`${template.id}:${item.code}`} label={item.label} editable={false}/></details></div>;
    }

    if (inputType === 'JSON') {
      const columns = getColumns(item);
      const rows = getRows(item);

      const statusColumns = columns
        .map((column, index) => ({ label: optionHeader(column), index }))
        .filter((entry): entry is { label: string; index: number } => !!entry.label);
      const hasStatusChoice = statusColumns.length >= 2;

      return (
        <div className="s3doc-table-wrap">
          <table className="s3doc-table">
            {columns.length > 0 && (
              <thead>
                <tr>
                  {columns.map((column, index) => (
                    <th key={index}>
                      {column || `Kolom ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
            )}

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, columnIndex) => {
                    const cellKey = keyFor(
                      packageId,
                      template,
                      item,
                      `${rowIndex}:${columnIndex}`,
                    );

                    const editableCell = isPlaceholder(cell);
                    const header=columns[columnIndex] ?? '';
                    const isPhoto=/foto|tangkapan layar|screenshot|gambar/i.test(header);
                    const photoName=`${template.id}:${item.code}:photo:${rowIndex}:${columnIndex}`;
                    const statusLabel = optionHeader(columns[columnIndex] ?? '');
                    const statusKey = keyFor(packageId, template, item, `status:${rowIndex}`);
                    const projectValue = columnIndex > 0
                      ? automaticProjectValue(row[0] ?? '', projectInfo)
                      : undefined;

                    return (
                      <td key={columnIndex}>
                        {isPhoto && editableCell ? (
                          <Stage3BFileEvidence onChanged={onAnswersChanged} packageId={packageId} evidenceId={photoName} label={`Foto/rekaman baris ${rowIndex+1}`} editable={canEdit}/>
                        ) : hasStatusChoice && statusLabel && /^[□☐\s]*$/.test(cell) ? (
                          <label className="s3doc-table-choice">
                            <input
                              type="radio"
                              name={statusKey}
                              disabled={!canEdit}
                              checked={answers[statusKey] === statusLabel}
                              onChange={() => update(statusKey, statusLabel)}
                              aria-label={`${row[1] || row[0] || `Baris ${rowIndex + 1}`}: ${statusLabel}`}
                            />
                          </label>
                        ) : /periode konsistensi|periode verifikasi/i.test(row[0] ?? '') && periodStart && periodEnd && editableCell ? (
                          <span className="s3doc-autofill">{periodStart} s.d. {periodEnd}</span>
                        ) : projectValue !== undefined && editableCell ? (
                          <span className="s3doc-autofill" title="Dari data paket JALA MUTU">{projectValue}</span>
                        ) : sourceChoices(cell) ? (
                          renderSourceChoices(cell, cellKey)
                        ) : editableCell ? (
                          <input
                            type="text"
                            value={answers[cellKey] ?? ''}
                            disabled={!canEdit}
                            placeholder="Isi"
                            aria-label={
                              `Baris ${rowIndex + 1}, ` +
                              `kolom ${columnIndex + 1}`
                            }
                            onChange={event =>
                              update(
                                cellKey,
                                event.target.value,
                              )
                            }
                          />
                        ) : (
                          <span>{cell}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p className="s3doc-muted">
              Tabel ini belum memiliki data baris.
            </p>
          )}
        </div>
      );
    }

    if (sourceChoices(item.label)) {
      return renderSourceChoices(item.label, inputKey);
    }

    if (item.options.length > 0) {
      return (
        <select
          value={answers[inputKey] ?? ''}
          disabled={!canEdit}
          onChange={event =>
            update(inputKey, event.target.value)
          }
        >
          <option value="">Belum diperiksa</option>
          {item.options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

      const autoValue = automaticPeriod || automaticDate || automaticProjectValue(item.label, projectInfo);
    if (autoValue !== undefined) {
      return <div className="s3doc-autofill" title="Dari data paket JALA MUTU">{autoValue}</div>;
    }

    if (/^no\.?\s*dokumen|^nomor dokumen/i.test(textLabel)) return <input type="text" value={answers[inputKey]??''} disabled={!canEdit} placeholder="Nomor dokumen (jika tersedia)" onChange={e=>update(inputKey,e.target.value)}/>;
    if (/^tanggal\b/i.test(textLabel)) return <input type="date" value={answers[inputKey]??''} disabled={!canEdit} onChange={e=>update(inputKey,e.target.value)}/>;
    return (
      <textarea
        rows={2}
        value={answers[inputKey] ?? ''}
        disabled={!canEdit}
        placeholder="Isi hasil pemeriksaan"
        onChange={event =>
          update(inputKey, event.target.value)
        }
      />
    );
  }

  return (
    <section className="wf-panel s3doc">
      <div className="s3doc-head">
        <div>
          <h3>
            <ClipboardCheck size={16} />
            Verifikasi dan Validasi Berkala
          </h3>
          <p>
            Pemeriksaan menurut jenis survei
          </p>
        </div>

        <span className="s3doc-counter">
          {entered} isian tersimpan · {readiness[phase].done}/{readiness[phase].total} wajib terjawab
          {readiness[phase].uncertain ? ` · ${readiness[phase].uncertain} bagian perlu verifikasi` : ''}
        </span>
      </div>

      <div className="s3doc-tabs">
        {PHASES.map(item => (
          <button
            type="button"
            key={item.id}
            className={
              phase === item.id ? 'active' : ''
            }
            onClick={() => setPhase(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="s3doc-surveys">
        {surveyTypes.map(type => (
          <button
            key={type}
            type="button"
            className={
              survey === type ? 'active' : ''
            }
            onClick={() => setSurvey(type)}
          >
            {type}
          </button>
        ))}

        {survey === 'PCI' && (
          <select
            value={pciMethod}
            aria-label="Metode PCI"
            onChange={event =>
              setPciMethod(
                event.target.value as
                  'PCI Manual' | 'PCI AI',
              )
            }
          >
            <option value="PCI Manual">
              PCI Manual
            </option>
            <option value="PCI AI">
              PCI Berbasis AI
            </option>
          </select>
        )}
      </div>

      {!template ? (
        <div className="s3doc-warning">
          <AlertTriangle size={15} />
          Formulir pemeriksaan belum tersedia.
        </div>
      ) : (
        <div className="s3doc-sections">
          {sections.map(([title, items], index) => (
            <details
              key={title}
              className="s3doc-section"
              open={index === 0 ? true : undefined}
            >
              <summary>
                <strong>{isAttachmentSection(title)?`Lampiran · ${title}`:title}</strong>
                <span>{items.length} bagian isian</span>
              </summary>

              <div className="s3doc-items">
                {items.map(item => (
                  <div
                    key={item.code}
                    className="s3doc-item"
                  >
                    {item.inputType !== 'JSON' &&
                      !isDocumentDecoration(item.label) && !isAttachmentSection(item.section) && (
                        <div className="s3doc-label">
                          {sourceChoices(item.label)?.prefix || (sourceChoices(item.label) ? 'Pilih hasil pemeriksaan' : item.label)}
                        </div>
                      )}

                    {renderItem(item)}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
      {template&&<DocumentAttachments scope={`${packageId}:form-${template.id}`} categories={template.items.filter(item=>isAttachmentSection(item.section)&&item.inputType!=='JSON').map(item=>item.label)} editable={canEdit} onChanged={onAnswersChanged}/>}
    </section>
  );
}
