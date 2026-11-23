import { localPersistence } from './repository/localPersistence';
import { useEffect, useMemo, useState } from 'react';

type Schedule = { startDate: string; endDate: string };
export type Stage3BPeriod = { number: number; start: string; end: string };
type Props = { onScheduleChange?:(schedule:Schedule)=>void; packageId: string; activePeriod: number; onPeriodChange: (number: number) => void;
  surveyStartDate?: string; surveyEndDate?: string; editable?: boolean; onRangeChange?: (range:{start:string;end:string})=>void };
const KEY = 'jala-mutu-3b-schedule-v2-';
function valid(date: string) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + 'T00:00:00Z')); }
function plus(date: string, days: number) { const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10); }
function read(id: string): Schedule { try { const value=JSON.parse(localPersistence.getItem(KEY+id)||'null');
  if(value)return {startDate:value.startDate||'',endDate:value.endDate||''};
  const old=JSON.parse(localPersistence.getItem('jala-mutu-3b-period-settings-'+id)||'null');
  return {startDate:old?.startDate||'',endDate:''}; }catch{return {startDate:'',endDate:''};} }
export function Stage3BPeriodSelector({packageId,activePeriod,onPeriodChange,surveyStartDate='',surveyEndDate='',editable=true,onRangeChange,onScheduleChange}:Props){
  const [fallback,setFallback]=useState<Schedule>(()=>read(packageId));
  const [editing,setEditing]=useState(false),[draft,setDraft]=useState<Schedule>({startDate:'',endDate:''}),[scheduleError,setScheduleError]=useState('');
  useEffect(()=>{setFallback(read(packageId));},[packageId]);
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
  function saveSchedule(){if(!editable)return;if(!valid(draft.startDate)||!valid(draft.endDate)||draft.startDate>draft.endDate){setScheduleError('Isi tanggal mulai dan selesai survei yang benar.');return;}setFallback(draft);localPersistence.setItem(KEY+packageId,JSON.stringify(draft));onScheduleChange?.(draft);setEditing(false);setScheduleError('');}

  const formatDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return <div className="stage3b-period-control">
      {editable&&<button type="button" className="wf-button" onClick={()=>{setDraft({startDate:start,endDate:end});setEditing(true);}}>Ubah jadwal survei</button>}
      {editable&&editing&&<div className="wf-grid equal"><label className="wf-field">Mulai pelaksanaan survei<input type="date" value={draft.startDate} onChange={event=>setDraft(old=>({...old,startDate:event.target.value}))}/></label><label className="wf-field">Selesai pelaksanaan survei<input type="date" value={draft.endDate} onChange={event=>setDraft(old=>({...old,endDate:event.target.value}))}/></label><div className="wf-toolbar"><button type="button" className="wf-button primary" onClick={saveSchedule}>Simpan jadwal survei</button><button type="button" className="wf-button" onClick={()=>setEditing(false)}>Batal</button></div>{scheduleError&&<p role="alert">{scheduleError}</p>}</div>}
      {valid(start)&&valid(end)&&start>end&&<div role="alert" className="wf-callout danger">Tanggal selesai harus sesudah tanggal mulai.</div>}
      {!periods.length&&<div className="wf-note">Lengkapi tanggal mulai dan selesai survei untuk menampilkan semua periode otomatis.</div>}
      {!!periods.length&&<label className="wf-field">Periode pemeriksaan<select aria-label="Periode pemeriksaan" value={activePeriod} onChange={e=>onPeriodChange(Number(e.target.value))}>{periods.map(period => {
        const range = formatDate.formatRange(new Date(period.start), new Date(period.end));
        return <option key={period.number} value={period.number}>{period.number} · {range}</option>;
      })}</select></label>}
  </div>;
}
