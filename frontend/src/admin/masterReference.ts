export type MasterCategory='Balai & wilayah'|'Jenis survei'|'Alat survei'|'Personel'|'Parameter mutu';
export type MasterReference={id:string;code:string;name:string;category:MasterCategory;origin:'Bawaan'|'Ditambahkan';status:'Aktif'};
export const MASTER_CATEGORIES:MasterCategory[]=['Balai & wilayah','Jenis survei','Alat survei','Personel','Parameter mutu'];
const prefix:Record<MasterCategory,string>={'Balai & wilayah':'BAL','Jenis survei':'SRV','Alat survei':'ALT','Personel':'PRS','Parameter mutu':'PAR'};
/** Local display IDs, not official codes assigned by DJBM. */
export const displayMasterCode=(category:MasterCategory,index:number)=>`REF-${prefix[category]}-${String(index+1).padStart(3,'0')}`;
export function buildMasterReferences(balais:readonly string[],surveys:readonly string[],docs:readonly {id:string;nama:string;kategori:string;status:string}[]):MasterReference[]{
 const all:MasterReference[]=[];
 const add=(name:string,category:MasterCategory,index:number)=>all.push({id:`BUILTIN-${category}-${index}`,code:displayMasterCode(category,index),name,category,origin:'Bawaan',status:'Aktif'});
 balais.forEach((n,i)=>add(n,'Balai & wilayah',i));surveys.forEach((n,i)=>add(n,'Jenis survei',i));
 for(const d of docs){if(!MASTER_CATEGORIES.includes(d.kategori as MasterCategory)||d.status!=='Aktif'||!d.nama.trim())continue;
  const category=d.kategori as MasterCategory;
  if(all.some(v=>v.category===category&&v.name.trim().toLocaleLowerCase('id-ID')===d.nama.trim().toLocaleLowerCase('id-ID')))continue;
  all.push({id:d.id,code:d.id,name:d.nama,category,origin:'Ditambahkan',status:'Aktif'});
 }
 return all;
}
export function filterMasterReferences(rows:readonly MasterReference[],category:MasterCategory,query:string){
 const needle=query.trim().toLocaleLowerCase('id-ID');
 return rows.filter(r=>r.category===category&&(!needle||[r.code,r.name,r.id].some(v=>v.toLocaleLowerCase('id-ID').includes(needle))));
}
export function masterReferenceCounts(rows:readonly MasterReference[]){return {balai:rows.filter(r=>r.category==='Balai & wilayah').length,survey:rows.filter(r=>r.category==='Jenis survei').length,tools:rows.filter(r=>r.category==='Alat survei').length,people:rows.filter(r=>r.category==='Personel').length,parameters:rows.filter(r=>r.category==='Parameter mutu').length,total:rows.length,added:rows.filter(r=>r.origin==='Ditambahkan').length};}
export function masterCsv(rows:readonly MasterReference[]){const esc=(value:string)=>'"'+value.replace(/^[\s\uFEFF]*[=+@-]/u,match=>"'"+match).replace(/"/g,'""')+'"';return ['Kode,Nama,Kategori,Asal,Status',...rows.map(r=>[r.code,r.name,r.category,r.origin,r.status].map(esc).join(','))].join('\r\n')+'\r\n';}
