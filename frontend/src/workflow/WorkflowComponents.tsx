import { useEffect, useRef, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, FileCheck2, LockKeyhole } from 'lucide-react';

export type ChecklistItemModel = {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  note?: string;
  answer?: 'Ya' | 'Tidak' | null;
  onAnswer?: (answer: 'Ya' | 'Tidak' | null) => void;
};

export function nextChecklistAnswer(answer: 'Ya' | 'Tidak' | null): 'Ya' | 'Tidak' | null {
  return answer === null ? 'Ya' : answer === 'Ya' ? 'Tidak' : null;
}

export function ChecklistStatus({complete,total,label='siap'}:{complete:number;total:number;label?:string}) {
  const ready=total>0&&complete===total;
  return <span className={`wf-status ${ready?'good':'warn'}`}>{complete}/{total} {label}</span>;
}

export function ChecklistItem({item,onChange}:{item:ChecklistItemModel;onChange:(checked:boolean)=>void}) {
  const inputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(inputRef.current)inputRef.current.indeterminate=item.onAnswer!==undefined&&item.answer==='Tidak';},[item.answer,item.onAnswer]);
  const cycle=()=>item.onAnswer?.(nextChecklistAnswer(item.answer ?? null));
  return <label className="wf-row wf-check" data-testid={`row-${item.id}`}>
    <input ref={inputRef} type="checkbox" data-testid={`check-${item.id}`} checked={item.onAnswer?item.answer==='Ya':item.checked} aria-checked={item.onAnswer&&item.answer==='Tidak'?'mixed':item.answer==='Ya'} data-answer={item.onAnswer?(item.answer??'Belum dijawab'):undefined} aria-label={item.onAnswer?`${item.label}: ${item.answer??'Belum dijawab'}`:undefined} disabled={item.disabled} onClick={item.onAnswer?event=>{event.preventDefault();cycle();}:undefined} onChange={item.onAnswer?undefined:event=>onChange(event.target.checked)}/>
    <span><strong>{item.label}</strong>{item.note&&<small className="wf-note" style={{display:'block'}}>{item.note}</small>}</span>
  </label>;
}

export function ChecklistPanel({title,items,onChange,onAnswer,answerLabel='siap',icon:Icon=FileCheck2}:{title:string;items:ChecklistItemModel[];onChange:(id:string,checked:boolean)=>void;onAnswer?:(id:string,answer:'Ya'|'Tidak'|null)=>void;answerLabel?:string;icon?:any}) {
  const complete=items.filter(item=>item.checked).length;
  return <section className="wf-panel" data-testid={`checklist-panel-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}>
    <div className="wf-panel-head"><h3><Icon size={14}/>{title}</h3><ChecklistStatus complete={complete} total={items.length} label={answerLabel}/></div>
    <div className="wf-body">{items.map(item=><ChecklistItem key={item.id} item={onAnswer?{...item,onAnswer:answer=>onAnswer(item.id,answer)}:item} onChange={checked=>onChange(item.id,checked)} />)}</div>
  </section>;
}

export function EvidenceField({label,value,onChange,placeholder='Nomor dokumen, nama file, atau referensi source',helper,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;placeholder?:string;helper?:string;disabled?:boolean}) {
  return <label className="wf-field">
    <span>{label}</span>
    <input value={value} disabled={disabled} onChange={event=>onChange(event.target.value)} placeholder={placeholder}/>
    {helper&&<small className="wf-note">{helper}</small>}
  </label>;
}

export type ValidationResultRow = {
  label: string;
  actual: ReactNode;
  requirement?: ReactNode;
  pass: boolean;
  source?: string;
};

export function ValidationResultTable({rows,title='Hasil system-check'}:{rows:ValidationResultRow[];title?:string}) {
  return <div className="wf-table" data-testid="validation-result-table">
    <table><thead><tr><th>{title}</th><th>Hasil source</th><th>Standar pembanding</th><th>Status</th></tr></thead>
      <tbody>{rows.map((row,index)=><tr key={`${row.label}-${index}`}>
        <td><strong>{row.label}</strong>{row.source&&<div className="wf-note">{row.source}</div>}</td>
        <td>{row.actual}</td><td>{row.requirement??'Mengikuti konfigurasi QA/QC'}</td>
        <td><span className={`wf-status ${row.pass?'good':'bad'}`}>{row.pass?'Sesuai':'Tidak sesuai'}</span></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export type GateSummaryItem = { label:string; ready:boolean; detail?:string };
export function GateSummary({title='Ringkasan gerbang',items}:{title?:string;items:GateSummaryItem[]}) {
  const ready=items.every(item=>item.ready);
  return <section className={`wf-callout ${ready?'':'warn'}`} data-testid="gate-summary">
    <div className="wf-toolbar" style={{justifyContent:'space-between'}}><strong>{title}</strong><span className={`wf-status ${ready?'good':'warn'}`}>{ready?'Siap lanjut':'Tertahan'}</span></div>
    <div style={{marginTop:8}}>{items.map(item=><div className="wf-row" key={item.label}>
      <span>{item.label}{item.detail&&<small className="wf-note" style={{display:'block'}}>{item.detail}</small>}</span>
      {item.ready?<CheckCircle2 size={15} aria-label="Siap"/>:<CircleAlert size={15} aria-label="Tertahan"/>}
    </div>)}</div>
    {!ready&&<div className="wf-note" style={{marginTop:6}}><LockKeyhole size={12} style={{display:'inline',marginRight:4}}/>Tahap berikutnya tetap terkunci sampai item wajib siap.</div>}
  </section>;
}
