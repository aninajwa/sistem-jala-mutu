import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';

type Schedule = { startDate: string; endDate: string };
export type Stage3BPeriod = { number: number; start: string; end: string };
type Props = { packageId: string; activePeriod: number; onPeriodChange: (number: number) => void;
  surveyStartDate?: string; surveyEndDate?: string; editable?: boolean; onRangeChange?: (range:{start:string;end:string})=>void };
const KEY = 'jala-mutu-3b-schedule-v2-';
function valid(date: string) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + 'T00:00:00Z')); }
function plus(date: string, days: number) { const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10); }
function read(id: string): Schedule { try { const value=JSON.parse(localStorage.getItem(KEY+id)||'null');
  if(value)return {startDate:value.startDate||'',endDate:value.endDate||''};
  const old=JSON.parse(localStorage.getItem('jala-mutu-3b-period-settings-'+id)||'null');
  return {startDate:old?.startDate||'',endDate:''}; }catch{return {startDate:'',endDate:''};} }
export function Stage3BPeriodSelector({packageId,activePeriod,onPeriodChange,surveyStartDate='',surveyEndDate='',editable=true,onRangeChange}:Props){
  const [fallback,setFallback]=useState<Schedule>(()=>read(packageId));
  useEffect(()=>{setFallback(read(packageId));onPeriodChange(1);},[packageId]);
  const start=valid(surveyStartDate)?surveyStartDate:fallback.startDate;
  const end=valid(surveyEndDate)?surveyEndDate:fallback.endDate;
  const periods=useMemo(()=>{const output:Stage3BPeriod[]=[];
    if(!valid(start)||!valid(end)||start>end)return output;
    let current=start;while(current<=end&&output.length<100){const endDate=plus(current,13);const finish=endDate<end?endDate:end;
      output.push({number:output.length+1,start:current,end:finish});current=plus(finish,1);}
    return output;
  },[start,end]);
  useEffect(()=>{if(periods.length&&activePeriod>periods.length)onPeriodChange(periods.length);},[periods.length,activePeriod,onPeriodChange]);
  const current=periods.find(p=>p.number===activePeriod);
  useEffect(()=>{onRangeChange?.({start:current?.start||'',end:current?.end||''});},[current?.start,current?.end,onRangeChange]);
  function setDate(which:keyof Schedule,value:string){const next={...fallback,[which]:value};setFallback(next);localStorage.setItem(KEY+packageId,JSON.stringify(next));}
  return <section className="wf-panel"><div className="wf-panel-head"><h3><CalendarDays size={16}/> Periode Pemeriksaan QA/QC</h3></div>
    <div style={{padding:16,display:'grid',gap:12}}>
      <p className="wf-note">Periode 14 hari dibuat berdasarkan jadwal survei. Pemeriksaan harian/mingguan dan validasi internal tetap dicatat sesuai kegiatan asalnya.</p>
      <div className="wf-grid equal">
        <div className="wf-field"><label>Mulai pelaksanaan survei</label><input type="date" value={start} disabled={!editable||valid(surveyStartDate)} onChange={e=>setDate('startDate',e.target.value)}/><small>{valid(surveyStartDate)?'Dari data paket':'Fallback jadwal survei'}</small></div>
        <div className="wf-field"><label>Selesai pelaksanaan survei</label><input type="date" value={end} disabled={!editable||valid(surveyEndDate)} onChange={e=>setDate('endDate',e.target.value)}/><small>{valid(surveyEndDate)?'Dari data paket':'Fallback jadwal survei'}</small></div>
      </div>
      {valid(start)&&valid(end)&&start>end&&<div role="alert" className="wf-callout danger">Tanggal selesai harus sesudah tanggal mulai.</div>}
      {!periods.length&&<div className="wf-note">Lengkapi tanggal mulai dan selesai survei untuk menampilkan semua periode otomatis.</div>}
      {!!periods.length&&<><strong>{periods.length} periode terjadwal</strong>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',maxHeight:150,overflowY:'auto'}}>{periods.map(p=><button type="button" key={p.number} className={`wf-button ${p.number===activePeriod?'primary':''}`} onClick={()=>onPeriodChange(p.number)} title={`${p.start} — ${p.end}`}>Periode {p.number}</button>)}</div>
        {current&&<div className="wf-callout"><strong>Periode {current.number}: {current.start} – {current.end}</strong><div className="wf-note">Jawaban checklist, evidence dan hasil review tersimpan per periode. Periode terjadwal bukan berarti sudah selesai.</div></div>}
      </>}
    </div></section>;
}
