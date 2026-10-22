import {baFieldRequiredForDraft,baValuePresent} from './fieldValidation';
import {fieldLabel} from './fieldPresentation';
import {useState} from 'react';
import type {TemplateField} from './docxEngine';
export function BaTemplateFields({fields,values,automatic,editable,onChange}:{fields:TemplateField[];values:Record<string,string>;automatic:Record<string,string>;editable:boolean;onChange:(id:string,value:string)=>void}){
 const [search,setSearch]=useState(''),[onlyMissing,setOnlyMissing]=useState(false);
 const groups=new Map<string,TemplateField[]>();
 for(const field of fields){if(onlyMissing&&baValuePresent(values[field.id]))continue;if(search&&!`${field.label} ${field.section}`.toLowerCase().includes(search.toLowerCase()))continue;const section=field.section||'Identitas dokumen';groups.set(section,[...(groups.get(section)||[]),field]);}
 return <div className="ba-form-sections"><div className="wf-toolbar"><input aria-label="Cari isian BA" placeholder="Cari isian…" value={search} onChange={e=>setSearch(e.target.value)}/><label><input type="checkbox" checked={onlyMissing} onChange={e=>setOnlyMissing(e.target.checked)}/> Belum diisi</label></div>{Array.from(groups).map(([section,items],index)=><details className="ba-form-section" key={section} open={index===0}><summary><strong>{section}</strong><span>{items.filter(f=>baValuePresent(values[f.id])).length}/{items.length} terisi</span></summary><div className="ba-form-grid">{items.map(field=>{
 const known=!!automatic[field.id],label=fieldLabel(field);
 const choices=field.choices??(/^(Valid\/Tidak Valid|Terverifikasi\/Tidak Terverifikasi|Sesuai\/Tidak Sesuai|Selesai\/Dalam Proses\/Belum Dilaksanakan)$/.test(field.label)?field.label.split('/'):undefined);
 return <div className="ba-field-row" key={field.id}><label htmlFor={field.id}>{label}{!baFieldRequiredForDraft(field,fields)?' · bila digunakan':''}{field.tableRow!==undefined?` · baris ${field.tableRow}`:''}</label>{known?<output id={field.id} className="ba-known-value">{values[field.id]}<small>Dari data pemeriksaan</small></output>:choices?<select id={field.id} disabled={!editable} value={values[field.id]??''} onChange={e=>onChange(field.id,e.target.value)}><option value="">Belum diisi</option>{choices.map(option=><option key={option}>{option}</option>)}</select>:/^(Tanggal|Tanggal pembuatan BA)$/.test(label)?<input id={field.id} type="date" disabled={!editable} value={values[field.id]??''} onChange={e=>onChange(field.id,e.target.value)}/>:<textarea id={field.id} rows={field.label.length>100?2:1} disabled={!editable} value={values[field.id]??''} placeholder="Belum diisi" onChange={e=>onChange(field.id,e.target.value)}/>}</div>;
 })}</div></details>)}{!groups.size&&<p>Tidak ada isian yang sesuai filter.</p>}</div>;
}
