import {useEffect,useMemo,useState,type FormEvent} from 'react';
import {ArrowDownToLine,Building2,Database,Eye,FileCheck2,Plus,Search,Users,Wrench,X} from 'lucide-react';
import {KPI,PageHeading,Section} from '../components/app/AppComponents';
import {balais,surveiTypes} from '../lib/demoData';
import {localPersistence} from '../workflow/repository/localPersistence';
import type {PageProps} from '../types';
import {masterReferenceCounts,type MasterCategory} from '../admin/masterReference';
import {MASTER_REGISTRY_KEY,fieldSpecs,filterRegistry,masterRegistryCsv,parseRegistry,registryRows,validateMasterEntry,masterDetailSections,type MasterEntry,type MasterRow} from '../admin/masterRegistry';

const labels:Record<MasterCategory,string>={'Balai & wilayah':'Balai & Wilayah','Jenis survei':'Jenis Survei','Alat survei':'Alat Survei','Personel':'Personel','Parameter mutu':'Parameter Uji'};
type Area='balai'|'survei'|'sumber';
const areaFor=(tab:string):Area=>tab==='Alat & personel'||tab==='Alat survei'||tab==='Personel'?'sumber':tab==='Jenis survei'||tab==='Parameter mutu'?'survei':'balai';
const actionFor=(category:MasterCategory)=>category==='Balai & wilayah'?'Tambah Balai':category==='Alat survei'?'Tambah Alat Survei':category==='Personel'?'Tambah Personel':category==='Jenis survei'?'Tambah Jenis Survei':'Tambah Parameter Uji';

export default function MasterPage(p:PageProps){
 const area=areaFor(p.activeTab);
 const [sub,setSub]=useState<MasterCategory>('Jenis survei');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<MasterRow|null>(null);
 const [creating,setCreating]=useState(false);
 const [form,setForm]=useState<Record<string,string>>({});
 const [errors,setErrors]=useState<string[]>([]);
 const [entries,setEntries]=useState<MasterEntry[]>(()=>parseRegistry(localPersistence.getItem(MASTER_REGISTRY_KEY)));
 const [notice,setLocalNotice]=useState('');
 useEffect(()=>{setQuery('');setSelected(null);setCreating(false);setErrors([]);setSub(p.activeTab==='Personel'?'Personel':p.activeTab==='Parameter mutu'?'Parameter mutu':p.activeTab==='Alat survei'?'Alat survei':areaFor(p.activeTab)==='sumber'?'Alat survei':'Jenis survei')},[p.activeTab]);
 const category:MasterCategory=area==='balai'?'Balai & wilayah':area==='survei'?(sub==='Parameter mutu'?'Parameter mutu':'Jenis survei'):(sub==='Personel'?'Personel':'Alat survei');
 const records=useMemo(()=>registryRows(balais,surveiTypes,p.store.docs,entries),[p.store.docs,entries]);
 const totals=useMemo(()=>masterReferenceCounts(records),[records]);
 const shown=useMemo(()=>filterRegistry(records,category,query),[records,category,query]);
 const inCategory=useMemo(()=>filterRegistry(records,category,''),[records,category]);
 const surveyChoices=useMemo(()=>records.filter(r=>r.category==='Jenis survei'),[records]);
 const surveyNames=useMemo(()=>new Map(surveyChoices.map(r=>[r.id,r.name])),[surveyChoices]);
 const changeCategory=(next:MasterCategory)=>{setSub(next);setQuery('');setSelected(null);setCreating(false);setErrors([]);setLocalNotice('');};
 const add=()=>{setForm({});setErrors([]);setCreating(true);setSelected(null);setLocalNotice('');};
 const close=()=>{setCreating(false);setSelected(null);setErrors([]);};
 const save=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  const clean=Object.fromEntries(Object.entries(form).map(([key,value])=>[key,value.trim()]));
  const failures=validateMasterEntry(category,clean,records);
  if(failures.length){setErrors(failures);return;}
  const newEntry:MasterEntry={id:`${Date.now()}-${Math.random().toString(36).slice(2,9)}`,category,name:clean.name,fields:Object.fromEntries(Object.entries(clean).filter(([key])=>key!=='name')),createdAt:new Date().toISOString()};
  const updated=[...entries,newEntry];
  try{localPersistence.setItem(MASTER_REGISTRY_KEY,JSON.stringify(updated));}
  catch{setErrors(['Referensi tidak dapat disimpan. Coba lagi.']);return;}
  setEntries(updated);setCreating(false);setErrors([]);setQuery('');setLocalNotice(`${labels[category]} berhasil disimpan.`);
 };
 const exportCsv=()=>{
  const blob=new Blob(['\uFEFF'+masterRegistryCsv(shown,surveyNames)],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  try{const a=document.createElement('a');a.href=url;a.download=`jala-mutu-master-${category.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.csv`;document.body.appendChild(a);a.click();a.remove();}
  finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
 };
 const areaTitle=area==='balai'?'Balai & Wilayah':area==='survei'?'Referensi Survei':'Alat & Personel';
 const currentEntry=selected?entries.find(item=>item.id===selected.id):undefined;
 const detailGroups=selected?masterDetailSections(selected,surveyNames):[];
 const originLabel=(origin:string)=>origin==='Referensi bawaan'?'Bawaan sistem':origin==='Referensi lokal'?'Ditambahkan':origin==='Referensi lama'?'Data sebelumnya':origin;
 const emptyTitle=`Belum ada ${labels[category].toLowerCase()} yang tercatat.`;
 return <>
  <PageHeading label={areaTitle} detail={area==='balai'?'Referensi wilayah dan Balai':area==='survei'?'Jenis survei dan parameter uji':'Referensi peralatan dan personel survei'} action={<div className="toolbar">
   {inCategory.length>0&&<button className="btn" type="button" onClick={exportCsv} data-testid="button-export-master"><ArrowDownToLine size={13}/>Ekspor CSV</button>}
   {inCategory.length>0&&<button className="btn primary" type="button" onClick={add} data-testid="button-add-reference"><Plus size={13}/>{actionFor(category)}</button>}
  </div>}/>
  <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
   <KPI icon={Building2} label="Balai tercatat" value={String(totals.balai)} note="referensi tersedia" testId="kpi-master-balai"/>
   <KPI icon={FileCheck2} label="Jenis survei" value={String(totals.survey)} note="referensi tersedia" tone="green" testId="kpi-master-types"/>
   <KPI icon={Wrench} label="Alat terdaftar" value={String(totals.tools)} note="referensi tersedia" tone="blue" testId="kpi-master-tools"/>
   <KPI icon={Users} label="Personel terdaftar" value={String(totals.people)} note="referensi tersedia" tone="green" testId="kpi-master-staff"/>
  </div>
  <Section title={labels[category]} icon={Database}>
   {area!=='balai'&&<div className="tabs" aria-label="Jenis referensi dalam kelompok" style={{flexWrap:'wrap'}}>{(area==='survei'?['Jenis survei','Parameter mutu']:['Alat survei','Personel']).map(c=><button key={c} className={`tab ${category===c?'active':''}`} type="button" onClick={()=>changeCategory(c as MasterCategory)} aria-pressed={category===c}>{labels[c as MasterCategory]}</button>)}</div>}
   <div className="panel-body">
    {inCategory.length>0&&<div className="toolbar" style={{justifyContent:'flex-start',marginBottom:12}}>
      <label style={{display:'flex',alignItems:'center',gap:8,flex:'1 1 280px',maxWidth:540}}><Search size={15}/><input style={{width:'100%',minWidth:0}} aria-label={`Cari ${labels[category]}`} value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Cari ${labels[category].toLowerCase()} atau kode`}/></label>
      {!!query.trim()&&<button type="button" className="btn sm" onClick={()=>setQuery('')}>Hapus pencarian</button>}
    </div>}
    {!!notice&&<div role="status" className="notice">{notice}</div>}
    {shown.length>0?<div className="table-wrap"><table data-testid="table-master"><thead><tr><th>Kode Referensi</th><th>Nama</th>{category==='Alat survei'&&<th>Nomor seri</th>}{category==='Parameter mutu'&&<th>Jenis survei</th>}{category==='Personel'&&<th>Organisasi</th>}{category==='Balai & wilayah'&&<th>Provinsi</th>}<th>Asal</th><th>Aksi</th></tr></thead><tbody>{shown.map(r=><tr key={r.id}><td>{r.code}</td><td><strong>{r.name}</strong></td>{category==='Alat survei'&&<td>{r.fields.nomorSeri||'—'}</td>}{category==='Parameter mutu'&&<td>{surveyNames.get(r.fields.surveyId)||'—'}</td>}{category==='Personel'&&<td>{r.fields.penyedia||'—'}</td>}{category==='Balai & wilayah'&&<td>{r.fields.provinsi||'—'}</td>}<td>{originLabel(r.recordState)}</td><td><button className="btn sm" type="button" onClick={()=>setSelected(r)} aria-label={`Detail ${r.name}`}><Eye size={12}/>Detail</button></td></tr>)}</tbody></table></div>:
     <div className="empty" role="status"><Database size={22}/><p>{query.trim()?'Tidak ada referensi yang cocok dengan pencarian.':emptyTitle}</p>
      {query.trim()?<button className="btn" type="button" onClick={()=>setQuery('')}>Hapus pencarian</button>:<button className="btn primary" type="button" onClick={add} data-testid="button-add-reference"><Plus size={13}/>{actionFor(category)}</button>}
     </div>}
   </div>
  </Section>
  {creating&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="dialog" role="dialog" aria-modal="true" aria-label={actionFor(category)}><div className="dialog-head"><h2>{actionFor(category)}</h2><button className="btn sm" type="button" onClick={close} aria-label="Tutup form"><X size={15}/></button></div><form className="dialog-content" onSubmit={save}>
   <div className="form-grid">{fieldSpecs[category].map(field=><div className="field" key={field.key}><label htmlFor={`master-${field.key}`}>{field.label}{field.required?' *':''}</label>
    {field.kind==='survey'?<select id={`master-${field.key}`} required={field.required} value={form[field.key]??''} onChange={e=>setForm(f=>({...f,[field.key]:e.target.value}))}><option value="">Pilih jenis survei</option>{surveyChoices.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>:
     field.kind==='textarea'?<textarea id={`master-${field.key}`} value={form[field.key]??''} onChange={e=>setForm(f=>({...f,[field.key]:e.target.value}))} rows={2} maxLength={2000}/>:
     <input id={`master-${field.key}`} type={field.kind==='number'?'number':'text'} min={field.kind==='number'?'0':undefined} step={field.key==='pengalamanTahun'?'0.01':'1'} required={field.required} maxLength={field.kind==='text'?2000:undefined} value={form[field.key]??''} onChange={e=>setForm(f=>({...f,[field.key]:e.target.value}))}/>}
    {field.hint&&<small className="subtle">{field.hint}</small>}
   </div>)}</div>
   {errors.length>0&&<div className="notice" role="alert">{errors.join(' ')}</div>}
   <div className="form-actions"><button type="button" className="btn" onClick={close}>Batal</button><button type="submit" className="btn primary" data-testid="button-submit-master">Simpan</button></div>
  </form></div></div>}
  {selected&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="dialog" role="dialog" aria-modal="true" aria-label={`Detail ${labels[selected.category]}`} style={{maxWidth:640}}>
   <div className="dialog-head"><h2>Detail {labels[selected.category]}</h2><button className="btn sm" type="button" onClick={close} aria-label="Tutup detail"><X size={15}/></button></div>
   <div className="dialog-content" style={{maxHeight:'min(72vh,680px)',overflowY:'auto'}}>
    <div style={{padding:'4px 0 12px',borderBottom:'1px solid var(--border, #e2e8f0)'}}>
     <strong style={{display:'block',fontSize:16,overflowWrap:'anywhere'}}>{selected.name}</strong>
     <span className="subtle">{selected.code} · {originLabel(selected.recordState)}</span>
    </div>
    {detailGroups.map(group=><section key={group.title} style={{paddingTop:10}} aria-label={group.title}>
      <h3 style={{fontSize:13,margin:'6px 0 8px'}}>{group.title}</h3>
      {group.attributes.map(attribute=><div className="quality-check" key={attribute.label}><span>{attribute.label}</span><strong style={{overflowWrap:'anywhere',whiteSpace:'pre-wrap',textAlign:'right',maxWidth:'65%'}}>{attribute.value}</strong></div>)}
    </section>)}
    <section style={{paddingTop:10}} aria-label="Informasi pencatatan">
     <h3 style={{fontSize:13,margin:'6px 0 8px'}}>Informasi pencatatan</h3>
     <div className="quality-check"><span>Status referensi</span><strong>{selected.status}</strong></div>
     <div className="quality-check"><span>Asal data</span><strong>{originLabel(selected.recordState)}</strong></div>
     {currentEntry?.createdAt&&Number.isFinite(Date.parse(currentEntry.createdAt))&&<div className="quality-check"><span>Waktu pencatatan</span><strong>{new Date(currentEntry.createdAt).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}</strong></div>}
    </section>
    <div className="form-actions"><button className="btn" type="button" onClick={close}>Tutup</button></div>
   </div></div></div>}

 </>;
}
