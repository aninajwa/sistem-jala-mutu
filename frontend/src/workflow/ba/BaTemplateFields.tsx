import { useId, useState } from "react";
import { baFieldRequiredForDraft, baFieldComplete } from "./fieldValidation";
import { fieldLabel } from "./fieldPresentation";
import type { TemplateField } from "./docxEngine";

type Props = {
  fields: TemplateField[];
  values: Record<string, string>;
  automatic: Record<string, string>;
  editable: boolean;
  onChange: (id: string, value: string) => void;
};

export function BaTemplateFields({ fields, values, automatic, editable, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [selection, setSelection] = useState("");
  const [editingField, setEditingField] = useState("");
  const prefix = useId();
  const groups = new Map<string, TemplateField[]>();
  const term = search.trim().toLocaleLowerCase("id-ID");

  for (const field of fields) {
    if (onlyMissing && field.id !== editingField && (!baFieldRequiredForDraft(field, fields) || baFieldComplete(field, values[field.id]))) continue;
    if (term && !`${field.label} ${field.section ?? ""}`.toLocaleLowerCase("id-ID").includes(term)) continue;
    const section = field.section || "Identitas dokumen";
    const group = groups.get(section);
    if (group) group.push(field);
    else groups.set(section, [field]);
  }
  const sections = [...groups.keys()];
  const active = groups.has(selection) ? selection : sections[0];
  const items = groups.get(active) ?? [];
  const current = sections.indexOf(active);
  const mandatory = fields.filter((field) => baFieldRequiredForDraft(field, fields));
  const complete = mandatory.filter((field) => baFieldComplete(field, values[field.id])).length;

  return (
    <div className="ba-form-sections">
      <div className="wf-toolbar ba-field-controls">
        <label>Bagian formulir
          <select aria-label="Bagian formulir" value={active ?? ""} disabled={!sections.length} onChange={(event) => setSelection(event.target.value)}>
            {!sections.length && <option value="">Belum ada hasil</option>}
            {sections.map((section) => <option key={section}>{section}</option>)}
          </select>
        </label>
        <label>Cari isian BA<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label><input type="checkbox" checked={onlyMissing} onChange={(event) => setOnlyMissing(event.target.checked)} /> Wajib dan belum diisi</label>
      </div>
      <p role="status">{complete} dari {mandatory.length} isian wajib lengkap</p>
      {items.length ? (
        <section className="ba-form-section" aria-labelledby={`${prefix}-section`}>
          <h3 id={`${prefix}-section`}>{active}</h3>
          <div className="ba-form-grid">
            {items.map((field) => {
              const id = `${prefix}-${field.id}`;
              const label = fieldLabel(field);
              const value = values[field.id] ?? "";
              const required = baFieldRequiredForDraft(field, fields);
              const choices = field.choices ?? (/^(Valid\/Tidak Valid|Terverifikasi\/Tidak Terverifikasi|Sesuai\/Tidak Sesuai|Selesai\/Dalam Proses\/Belum Dilaksanakan)$/.test(field.label) ? field.label.split("/") : undefined);
              return (
                <div className="ba-field-row" key={field.id} onFocus={() => setEditingField(field.id)} onBlur={() => setEditingField("")}>
                  <label htmlFor={id}>{label}{required ? " · wajib" : " · bila digunakan"}{field.tableRow !== undefined ? ` · baris ${field.tableRow}` : ""}</label>
                  {automatic[field.id] ? <output id={id} className="ba-known-value">{value}<small>Dari data pemeriksaan</small></output>
                    : choices ? <select id={id} disabled={!editable} value={value} onChange={(event) => onChange(field.id, event.target.value)}>
                        <option value="">Belum diisi</option>
                        {choices.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    : /^(Tanggal|Tanggal pembuatan BA)$/.test(label) ? <input id={id} type="date" disabled={!editable} value={value} onChange={(event) => onChange(field.id, event.target.value)} />
                    : <textarea id={id} rows={field.label.length > 100 ? 2 : 1} disabled={!editable} value={value} onChange={(event) => onChange(field.id, event.target.value)} />}
                </div>
              );
            })}
          </div>
          <div className="wf-toolbar">
            <button type="button" className="wf-button" disabled={current <= 0} onClick={() => setSelection(sections[current - 1])}>Bagian sebelumnya</button>
            <button type="button" className="wf-button" disabled={current >= sections.length - 1} onClick={() => setSelection(sections[current + 1])}>Bagian berikutnya</button>
          </div>
        </section>
      ) : <p>Tidak ada isian yang sesuai filter.</p>}
    </div>
  );
}
