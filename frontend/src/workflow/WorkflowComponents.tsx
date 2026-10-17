import type { ReactNode } from 'react';
import { CheckCircle2, CircleAlert, FileCheck2, LockKeyhole } from 'lucide-react';

export type ChecklistItemModel = {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  note?: string;
};

export function ChecklistStatus({complete,total}:{complete:number;total:number}) {
  const ready=total>0&&complete===total;
  return <span className={`wf-status ${ready?'good':'warn'}`}>{complete}/{total} siap</span>;
}

export function ChecklistItem({item,onChange}:{item:ChecklistItemModel;onChange:(checked:boolean)=>void}) {
  return <label className="wf-row wf-check" data-testid={`row-${item.id}`}>
    <input type="checkbox" data-testid={`check-${item.id}`} checked={item.checked} disabled={item.disabled} onChange={event=>onChange(event.target.checked)}/>
    <span><strong>{item.label}</strong>{item.note&&<small className="wf-note" style={{display:'block'}}>{item.note}</small>}</span>
  </label>;
}

export function ChecklistPanel({title,items,onChange,icon:Icon=FileCheck2}:{title:string;items:ChecklistItemModel[];onChange:(id:string,checked:boolean)=>void;icon?:any}) {
  const complete=items.filter(item=>item.checked).length;
  return <section className="wf-panel" data-testid={`checklist-panel-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}>
    <div className="wf-panel-head"><h3><Icon size={14}/>{title}</h3><ChecklistStatus complete={complete} total={items.length}/></div>
    <div className="wf-body">{items.map(item=><ChecklistItem key={item.id} item={item} onChange={checked=>onChange(item.id,checked)}/>)}</div>
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
