import {readLocal,writeLocal} from './localPersistence';
import type {WorkflowRole} from '../model';
/** Draft PP C.4.b/c, C.5.b/c. Sampling 5%: temporary user decision, 22 Oct 2026. */
export const LENDUTAN_PERIOD_RATE=5;
export const INTERNAL_PARAMETERS=['Pemeriksaan format dan kelengkapan data','Pemeriksaan kesesuaian hasil dengan metode yang ditetapkan','Identifikasi data yang perlu perbaikan','Validasi koordinat dan kesesuaian dengan sistem referensi lokasi','Cross-check antara personel penilai'];
export const JOINT_PARAMETERS=['Sampling data','Pemeriksaan peralatan','Peninjauan format data'];
export type LendutanPeriodRecord={values:Record<string,string>;history:{at:string;actor:WorkflowRole;field:string;before:string;after:string}[]};
export const lendutanPeriodKey=(scope:string,phase:string)=>`jala-lendutan-period-v1:${scope}:${phase}`;
export const readLendutanPeriod=(scope:string,phase:string)=>readLocal<LendutanPeriodRecord>(lendutanPeriodKey(scope,phase),{values:{},history:[]});
export function saveLendutanPeriod(scope:string,phase:string,role:WorkflowRole,field:string,value:string){
 const owner=phase==='internal'?'Penyedia Jasa / Ketua Tim':'PIC Balai / Pengguna Jasa';
 if(!['internal','periodic14'].includes(phase)||role!==owner)throw new Error('Isian ini menjadi kewenangan '+owner+'.');
 const allowed=[...(phase==='internal'?INTERNAL_PARAMETERS:JOINT_PARAMETERS),'Kesimpulan','Rekomendasi','Data valid','Data tidak valid','Tindakan perbaikan','total','sample','sampleReference'];
 if(!allowed.includes(field))throw new Error('Isian pemeriksaan tidak dikenal.');
 const before=readLendutanPeriod(scope,phase);if(before.values[field]===value)return;
 writeLocal(lendutanPeriodKey(scope,phase),{values:{...before.values,[field]:value},history:[...before.history,{at:new Date().toISOString(),actor:role,field,before:before.values[field]??'',after:value}]});
}
export function lendutanSampling(total:string,sample:string,reference:string){
 const count=(s:string)=>/^\d+$/.test(s.trim())?Number(s):NaN;
 const n=count(total),k=count(sample);
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(k)||n<=0||k<0||k>n)return {valid:false,complete:false,label:'Belum dapat dinilai',reason:'Isi total titik > 0 dan jumlah sampel bilangan bulat, tidak melebihi total.'};
 const minimum=Math.ceil(n*LENDUTAN_PERIOD_RATE/100),valid=k>=minimum;
 return {valid:valid&&!!reference.trim(),complete:!!reference.trim(),label:valid?'Memenuhi':'Tidak Memenuhi',reason:`${k}/${n} titik (${(k/n*100).toFixed(2)}%); minimum ${minimum} titik (5%).${reference.trim()?'':' Lengkapi daftar/referensi titik sampel.'}`};
}
export function lendutanPeriodStatus(scope:string,phase:string){
 const {values}=readLendutanPeriod(scope,phase),parameters=phase==='internal'?INTERNAL_PARAMETERS:JOINT_PARAMETERS;
 const required=[...parameters,'Kesimpulan','Rekomendasi',...(phase==='internal'?['Data valid','Data tidak valid','Tindakan perbaikan']:[])];
 const missing=required.filter(key=>!values[key]?.trim());
 const sample=phase==='periodic14'?lendutanSampling(values.total??'',values.sample??'',values.sampleReference??''):undefined;
 const concerns=sample&&!sample.valid?[sample.reason]:[];
 const complete=!missing.length&&(!sample||sample.complete);
 return {complete,concerns,reason:missing.length?'Lengkapi hasil pemeriksaan manual: '+missing.join(', '):sample&&!sample.complete?sample.reason:'',sourceHash:'DraftPP-C4-C5-user-sampling-5pct-2026-10-22'};
}
