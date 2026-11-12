import {buildMasterReferences, displayMasterCode, type MasterCategory, type MasterReference} from './masterReference';

export const MASTER_REGISTRY_KEY='jala-master-registry-v1';
export type MasterEntry={id:string;category:MasterCategory;name:string;fields:Record<string,string>;createdAt:string};
export type MasterRow=MasterReference&{fields:Record<string,string>;recordState:'Referensi bawaan'|'Referensi lokal'|'Referensi lama';};
export type FieldSpec={key:string;label:string;kind:'text'|'number'|'textarea'|'survey';required?:boolean;hint?:string};
export const fieldSpecs:Record<MasterCategory,FieldSpec[]>={
 'Balai & wilayah':[
  {key:'name',label:'Nama Balai',kind:'text',required:true},
  {key:'kodeResmi',label:'Kode Balai',kind:'text'},
  {key:'provinsi',label:'Provinsi',kind:'text'},
  {key:'wilayahKerja',label:'Wilayah Kerja',kind:'textarea'},
 ],
 'Jenis survei':[
  {key:'name',label:'Nama jenis survei',kind:'text',required:true},
  {key:'kodeResmi',label:'Kode referensi (jika tersedia)',kind:'text'},
  {key:'metode',label:'Metode atau deskripsi survei',kind:'textarea'},
  {key:'satuanVolume',label:'Satuan Volume Kegiatan',kind:'text'},
  {key:'sistemTujuan',label:'Sistem Tujuan',kind:'text'},
 ],
 'Parameter mutu':[
  {key:'name',label:'Nama parameter uji',kind:'text',required:true},
  {key:'surveyId',label:'Jenis survei terkait',kind:'survey',required:true},
  {key:'kodeParameter',label:'Kode parameter',kind:'text',required:true},
  {key:'satuan',label:'Satuan parameter',kind:'text'},
  {key:'keterangan',label:'Keterangan',kind:'textarea'},
 ],
 'Alat survei':[
  {key:'name',label:'Nama alat survei',kind:'text',required:true},
  {key:'surveyId',label:'Jenis survei terkait',kind:'survey',required:true},
  {key:'merekTipe',label:'Merek / tipe',kind:'text'},
  {key:'nomorSeri',label:'Nomor seri',kind:'text',required:true},
  {key:'penyedia',label:'Pengelola Alat',kind:'text'},
  {key:'kelas',label:'Kelas Alat',kind:'text'},
  {key:'tahunPerolehan',label:'Tahun perolehan',kind:'number'},
  {key:'kondisi',label:'Kondisi Fisik',kind:'text'},
  {key:'kepemilikan',label:'Keterangan kepemilikan',kind:'text'},
 ],
 'Personel':[
  {key:'name',label:'Nama personel',kind:'text',required:true},
  {key:'penyedia',label:'Organisasi',kind:'text'},
  {key:'pendidikan',label:'Pendidikan',kind:'text'},
  {key:'pengalamanTahun',label:'Pengalaman (tahun)',kind:'number'},
  {key:'kualifikasiCatatan',label:'Catatan Kualifikasi',kind:'textarea'},
 ],
};
const lower=(s:string)=>s.trim().toLocaleLowerCase('id-ID');
export function registryRows(balais:readonly string[],surveys:readonly string[],docs:readonly {id:string;nama:string;kategori:string;status:string}[],entries:readonly MasterEntry[]):MasterRow[]{
 const old=buildMasterReferences(balais,surveys,docs);
 const rows:MasterRow[]=old.map(r=>({...r,fields:{},recordState:r.origin==='Bawaan'?'Referensi bawaan':'Referensi lama'}));
 for(const e of entries){
  if(!fieldSpecs[e.category]||!e.name?.trim()||!e.id)continue;
  const duplicate=rows.some(r=>r.id===e.id||(r.category===e.category&&lower(r.name)===lower(e.name)));
  if(duplicate)continue;
  rows.push({id:e.id,code:displayMasterCode(e.category,rows.filter(r=>r.category===e.category).length),name:e.name.trim(),category:e.category,origin:'Ditambahkan',status:'Aktif',fields:{...e.fields},recordState:'Referensi lokal'});
 }
 return rows;
}
export function validateMasterEntry(category:MasterCategory,form:Record<string,string>,rows:readonly MasterRow[]):string[]{
 const failures:string[]=[];
 for(const field of fieldSpecs[category]){
  if(field.required&&!String(form[field.key]??'').trim())failures.push(`${field.label} wajib diisi.`);
 }
 const name=String(form.name??'').trim();
 if(name.length>160)failures.push('Nama terlalu panjang (maksimum 160 karakter).');
 if(category!=='Personel'&&rows.some(r=>r.category===category&&lower(r.name)===lower(name)))failures.push('Nama referensi sudah tersedia pada kategori ini.');
 if(['Alat survei','Parameter mutu'].includes(category)){
  const survey=rows.find(r=>r.id===form.surveyId&&r.category==='Jenis survei');
  if(!survey)failures.push('Pilih jenis survei yang tersedia pada Data Master.');
 }
 if(category==='Alat survei'){
  const serial=lower(form.nomorSeri??'');
  if(serial&&rows.some(r=>r.category===category&&lower(r.fields.nomorSeri??'')===serial))failures.push('Nomor seri alat sudah tercatat.');
 }
 if(category==='Parameter mutu'&&rows.some(r=>r.category===category&&r.fields.surveyId===form.surveyId&&lower(r.fields.kodeParameter??'')===lower(form.kodeParameter??'')&&!!form.kodeParameter?.trim())) failures.push('Kode parameter sudah tercatat untuk jenis survei tersebut.');
 const year=String(form.tahunPerolehan??'').trim();
 if(year&&(!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>new Date().getFullYear()+1))failures.push('Tahun perolehan tidak valid.');
 const exp=String(form.pengalamanTahun??'').trim();
 if(exp&&(!/^\d+(?:\.\d{1,2})?$/.test(exp)||Number(exp)>80))failures.push('Pengalaman harus 0–80 tahun.');
 for(const [key,value] of Object.entries(form))if(String(value).length>2000)failures.push(`Isian ${key} terlalu panjang.`);
 return [...new Set(failures)];
}
export function filterRegistry(rows:readonly MasterRow[],category:MasterCategory,query:string){
 const q=lower(query);
 return rows.filter(r=>r.category===category&&(!q||[r.code,r.name,...Object.values(r.fields)].some(s=>lower(String(s)).includes(q))));
}
export function masterRegistryCsv(rows:readonly MasterRow[],surveyNames:ReadonlyMap<string,string>){
 const escape=(s:string)=>'"'+String(s).replace(/^[\s\uFEFF]*[=+@-]/u,v=>"'"+v).replace(/"/g,'""')+'"';
 const fields=[...new Set(rows.flatMap(r=>Object.keys(r.fields)))].sort();
 const header=['Kode Referensi','Nama','Kategori','Asal','Status referensi',...fields];
 return [header.map(escape).join(','),...rows.map(r=>[r.code,r.name,r.category,r.recordState==='Referensi bawaan'?'Bawaan sistem':r.recordState==='Referensi lokal'?'Ditambahkan':'Data sebelumnya',r.status,...fields.map(f=>f==='surveyId'?surveyNames.get(r.fields[f]??'')??'':r.fields[f]??'')].map(escape).join(','))].join('\r\n')+'\r\n';
}
export function parseRegistry(raw:string|null):MasterEntry[]{
 try{
  if(!raw)return [];
  const data:unknown=JSON.parse(raw);
  if(!Array.isArray(data))return [];
  return data.filter((v):v is MasterEntry=>!!v&&typeof v==='object'&&typeof v.id==='string'&&typeof v.name==='string'&&typeof v.category==='string'&&fieldSpecs[v.category as MasterCategory]&&v.fields&&typeof v.fields==='object'&&!Array.isArray(v.fields)).slice(0,5000).map(v=>({...v,fields:Object.fromEntries(Object.entries(v.fields).filter(([,s])=>typeof s==='string'))}));
 }catch{return []}
}

/** Rincian tidak menduplikasi tabel: hanya atribut yang disimpan, dikelompokkan menurut entitas ERD. */
export type MasterDetailSection={title:string;attributes:{label:string;value:string}[]};
const detailGroups:Record<MasterCategory,{title:string;keys:string[]}[]>={
 'Balai & wilayah':[{title:'Identitas dan wilayah',keys:['kodeResmi','provinsi','wilayahKerja']}],
 'Jenis survei':[{title:'Metode dan referensi kegiatan',keys:['kodeResmi','metode','satuanVolume','sistemTujuan']}],
 'Parameter mutu':[{title:'Parameter dan keterkaitan survei',keys:['surveyId','kodeParameter','satuan','keterangan']}],
 'Alat survei':[
  {title:'Spesifikasi alat',keys:['surveyId','merekTipe','nomorSeri','kelas','tahunPerolehan']},
  {title:'Pengelolaan dan kondisi',keys:['penyedia','kondisi','kepemilikan']},
 ],
 'Personel':[{title:'Organisasi dan kualifikasi',keys:['penyedia','pendidikan','pengalamanTahun','kualifikasiCatatan']}],
};
export function masterDetailSections(row:MasterRow,surveyNames:ReadonlyMap<string,string>):MasterDetailSection[]{
 const specs=new Map(fieldSpecs[row.category].map(field=>[field.key,field.label]));
 return detailGroups[row.category].map(group=>({title:group.title,attributes:group.keys.map(key=>({
  label:specs.get(key)??key,
  value:key==='surveyId'?(surveyNames.get(row.fields[key]??'')??'Belum tercatat'):(row.fields[key]?.trim()||'Belum tercatat'),
 }))}));
}
