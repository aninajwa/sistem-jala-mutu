import { useState, type FormEvent } from 'react';
import { Check, X } from 'lucide-react';

import { balais, surveiTypes } from '../../lib/demoData';
import type { DemoStore, RecordType } from '../../types';

export function DataDialog({type,editing,store,onClose,onSave}:{type: RecordType;editing:string|null;store: DemoStore;onClose:()=>void;onSave:(t: RecordType,f:Record<string,string>)=>void}){
 const row=type==='survey'?store.surveys.find(x=>x.id===editing):type==='finding'?store.findings.find(x=>x.id===editing):type==='doc'?store.docs.find(x=>x.id===editing):undefined;
 const [form,setForm]=useState<Record<string,string>>(()=>row?Object.fromEntries(Object.entries(row).map(([k,v])=>[k,String(v)])):{});
 const set=(k:string,v:string)=>setForm(old=>({...old,[k]:v}));
 const titles={survey:editing?'Edit entri survei':'Entri survei baru',finding:editing?'Edit temuan':'Catat temuan baru',doc:editing?'Perbarui dokumen':'Tambah dokumen mutu',master:'Tambah referensi master'};
 const submit=(e:FormEvent)=>{e.preventDefault();onSave(type,form)};
 const input=(key:string,label:string,placeholder='',kind='text')=><div className="field" key={key}><label>{label}</label><input type={kind} value={form[key]||''} onChange={e=>set(key,e.target.value)} placeholder={placeholder} required data-testid={`input-form-${key}`}/></div>;
 const select=(key:string,label:string,options:string[])=><div className="field" key={key}><label>{label}</label><select value={form[key]||options[0]} onChange={e=>set(key,e.target.value)} data-testid={`select-form-${key}`}>{options.map(x=><option key={x}>{x}</option>)}</select></div>;
 return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="dialog" role="dialog" aria-modal="true" aria-label={titles[type]}><div className="dialog-head"><h2>{titles[type]}</h2><button className="btn sm" onClick={onClose} aria-label="Tutup dialog" data-testid="button-close-dialog"><X size={15}/></button></div><form className="dialog-content" onSubmit={submit}>
  {type==='survey'&&<div className="form-grid">{select('balai','Balai',balais)}{select('jenis','Jenis survei',surveiTypes)}{input('ruas','Nama ruas','Contoh: Medan â€“ Binjai')}{select('alat','Alat survei',['Profilometer Laser','Kamera Survei','FWD Dynatest','Video Log','Total Station'])}{input('tanggal','Tanggal survei','','date')}{input('km','Panjang ruas (km)','0','number')}{select('status','Status validasi',['Draft','Verifikasi','Lulus','Perlu Perbaikan','Diserahkan'])}{input('hasil','Hasil awal','Contoh: IRI 2,14 m/km')}</div>}
  {type==='finding'&&<div className="form-grid">{input('ruas','Ruas terkait','Nama ruas')}{input('jenis','Jenis temuan','Mis. Konsistensi data')}{select('prioritas','Prioritas',['Kritis','Tinggi','Sedang','Rendah'])}{select('status','Status tindakan',['Diusulkan','Disetujui','Dilaksanakan','Verifikasi Ulang','Selesai'])}{input('pic','PIC','Nama penanggung jawab')}{input('due','Jatuh tempo','','date')}</div>}
  {type==='doc'&&<div className="form-grid">{input('nama','Nama dokumen','Nama file atau dokumen')}{select('kategori','Kategori',['Kalibrasi','Validasi','Verifikasi berkala','Berita acara','Bukti pendukung'])}{input('versi','Versi dokumen','v1.0')}{select('status','Status',['Lengkap','Perlu Dilengkapi','Dalam Review'])}</div>}
  {type==='master'&&<div className="form-grid">{input('nama','Nama referensi','Nama referensi baru')}{select('kategori','Kelompok referensi',['Jenis survei','Alat survei','Balai & wilayah','Personel','Parameter mutu'])}</div>}
  <div className="form-actions"><button type="button" className="btn" onClick={onClose} data-testid="button-cancel-form">Batal</button><button type="submit" className="btn primary" data-testid="button-submit-form"><Check size={13}/>{editing?'Simpan perubahan':'Simpan data'}</button></div>
  </form></div></div>;
}
