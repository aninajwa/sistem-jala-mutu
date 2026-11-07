import {FileUploadButton} from './FileUploadButton';
import {Download, Settings2, Paperclip, Trash2} from 'lucide-react';
import './documents/attachmentClean.css';
import {useEffect,useState} from 'react';
import {attachmentRepository,ATTACHMENT_CHANGED,downloadLocalFile,type LocalFile} from './repository/attachmentRepository';
import {readLocal,writeLocal} from './repository/localPersistence';
import {evidenceCategories,readEvidenceLinks,updateEvidenceLink} from './repository/evidenceLinks';
import type { ServerPreparationDocument, ServerChecklist } from '../pages/serverPreparation';
import { addPreparationDocumentVersion, canUseServerDocumentCategory, DIRAH_DOCUMENT_CATEGORIES, documentsForCategory, downloadPreparationDocument, getPreparationDocumentDetail, checklistItemForDocumentCategory, type ServerDocumentDetail } from '../pages/serverPreparationDocuments';
export const documentAttachmentId=(scope:string)=>'documents-'+scope.replace(/[^a-zA-Z0-9_-]/g,'-');
type Target={id:string;label:string};
type ServerPanel={packageId:string;checklist:ServerChecklist|null;documents:ServerPreparationDocument[];loading:boolean;error:string;busy:boolean;editable:boolean;onUpload:(category:string,file:File)=>Promise<void>;onReuse:(category:string,documentId:number)=>Promise<void>;onChanged:()=>void};
type Props={title?:string;scope:string;categories:string[];editable:boolean;onChanged?:()=>void;linkTargets?:Target[];legacyFileKeys?:string[];legacyEvidenceIds?:string[];server?:ServerPanel};
export function DocumentAttachments(props:Props){
 if(props.server)return <ServerDocumentAttachments {...props} server={props.server}/>;
 return <LocalDocumentAttachments {...props}/>;
}
function ServerDocumentAttachments({title='Dokumen & Lampiran',scope,categories,editable,server}:Props&{server:ServerPanel}){
 const [category,setCategory]=useState(categories[0]??DIRAH_DOCUMENT_CATEGORIES[0]);
 const [reuseOpen,setReuseOpen]=useState(false),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[details,setDetails]=useState<Record<number,ServerDocumentDetail|undefined>>({}),[detailErrors,setDetailErrors]=useState<Record<number,string>>({});
 const activeCategory=categories.includes(category)?category:categories[0]??DIRAH_DOCUMENT_CATEGORIES[0];
 const files=documentsForCategory(server.documents,activeCategory);
 async function download(documentId:number,version?:number){setBusy(true);setNotice('');try{await downloadPreparationDocument(server.packageId,documentId,version);setNotice('Unduhan dokumen dimulai.');}catch(error){setNotice(error instanceof Error?error.message:'Gagal mengunduh dokumen.');}finally{setBusy(false);}}
 async function showVersions(documentId:number,page=1){try{const response=await getPreparationDocumentDetail(server.packageId,documentId,page);setDetails(current=>({...current,[documentId]:{...response.data,riwayat_versi:page===1?response.data.riwayat_versi:[...(current[documentId]?.riwayat_versi??[]),...response.data.riwayat_versi]}}));setDetailErrors(current=>({...current,[documentId]:''}));}catch(error){setDetailErrors(current=>({...current,[documentId]:error instanceof Error?error.message:'Riwayat versi gagal dimuat.'}));}}
 async function uploadFile(file:File,versionOf?:ServerPreparationDocument){if(!canUseServerDocumentCategory(activeCategory)||!server.editable||busy||server.busy)return;setBusy(true);setNotice('');try{if(versionOf)await addPreparationDocumentVersion(server.packageId,versionOf,file);else await server.onUpload(activeCategory,file);server.onChanged();setNotice(versionOf?'Versi dokumen berjaya ditambahkan.':'Berkas berjaya diunggah dan ditautkan.');}catch(error){server.onChanged();setNotice(error instanceof Error?error.message:'Operasi dokumen gagal.');}finally{setBusy(false);}}
 async function reuse(documentId:number){if(!server.editable||!canUseServerDocumentCategory(activeCategory))return;setBusy(true);setNotice('');try{await server.onReuse(activeCategory,documentId);server.onChanged();setNotice('Dokumen tersimpan berjaya ditautkan ke checklist.');}catch(error){setNotice(error instanceof Error?error.message:'Dokumen gagal ditautkan.');}finally{setBusy(false);}}
 return <section className="wf-panel documents-area" id={documentAttachmentId(scope)}>
  <div className="wf-panel-head"><h3>{title}</h3><span>{server.documents.length} berkas server</span></div>
  <div className="wf-body">
   <label className="document-category-label">Kategori lampiran<select aria-label="Kategori lampiran" value={activeCategory} onChange={event=>{setCategory(event.target.value);setReuseOpen(false);}}>{categories.map(item=><option key={item}>{item}</option>)}</select></label>
   <details className="document-needs"><summary>Kebutuhan dokumen ({categories.length})</summary><ul className="document-requirements">{categories.map(item=>{const matching=documentsForCategory(server.documents,item);const supported=canUseServerDocumentCategory(item);return <li key={item}>{item}<small> · {!supported?'Tidak disokong backend':matching.length?'Tersedia di server':'Belum tersedia'}</small></li>;})}</ul></details>
   <div className="document-upload-flow"><label className="document-category-label">Jenis lampiran<select value={activeCategory} onChange={event=>{setCategory(event.target.value);setReuseOpen(false);}}>{categories.map(item=><option key={item}>{item}</option>)}</select></label><div className="document-upload-actions"><FileUploadButton disabled={busy||server.busy||!server.editable||!canUseServerDocumentCategory(activeCategory)} disabledLabel={busy||server.busy?'Menyimpan…':!server.editable?'Tidak tersedia':'Kategori tidak didukung'} label="Unggah berkas" inputLabel="Unggah dokumen persiapan ke server" onFiles={selected=>{if(selected[0])void uploadFile(selected[0]);}}/><button type="button" className="wf-button" disabled={busy||server.busy||!server.editable||!canUseServerDocumentCategory(activeCategory)} aria-expanded={reuseOpen} onClick={()=>setReuseOpen(value=>!value)}>Gunakan berkas tersimpan</button></div>{!canUseServerDocumentCategory(activeCategory)?<p className="wf-note">Backend hanya menerima Laporan Pendahuluan dan Program Mutu; kategori ini tiada padanan jenis dokumen atau item bukti.</p>:!server.editable?<p className="wf-note">Upload dan tautan hanya untuk Penyedia pada paket DRAFT dengan persiapan DRAFT atau PERLU_REVISI.</p>:null}{reuseOpen&&<label className="document-category-label">Berkas yang sudah ada<select aria-label="Pilih berkas tersimpan untuk kategori ini" value="" disabled={busy||server.busy} onChange={event=>{const id=Number(event.target.value);if(id)void reuse(id);setReuseOpen(false);}}><option value="">Pilih dokumen paket ini</option>{files.map(item=><option value={item.dokumen_id} key={item.dokumen_id}>#{item.dokumen_id} · {item.judul}</option>)}</select></label>}<p className="wf-note">Berkas dan keterkaitan checklist disimpan melalui backend Anin.</p></div>
   {server.loading&&<p className="wf-note" role="status">Memuat dokumen dari server…</p>}
   {server.error&&<p className="wf-note" role="alert">{server.error}</p>}
   {!server.loading&&!server.error&&files.length===0&&<p className="wf-note">Belum ada dokumen untuk kategori ini di server.</p>}
   {files.map(document=>{const item=server.checklist&&checklistItemForDocumentCategory(server.checklist,activeCategory);const isLinked=item?.bukti_dokumen_id===document.dokumen_id;return <article className="document-file" key={document.dokumen_id}><div className="wf-row"><div className="document-file-info"><Paperclip size={16} aria-hidden="true"/><div><strong>{document.judul}</strong><small>Dokumen #{document.dokumen_id} · {document.jenis_dokumen?.nama} · versi {document.versi_aktif} · {document.dokumen_versi?.find(version=>version.versi_ke===document.versi_aktif)?.nama_file??'PDF'} · {isLinked?`Tertaut ke ${item?.kode}`:`Belum tertaut ke ${item?.kode??'item checklist'}`}</small></div></div><div className="wf-toolbar document-file-actions"><button type="button" className="wf-button" disabled={busy} onClick={()=>void download(document.dokumen_id)}><Download size={14} aria-hidden="true"/> Unduh</button>{editable&&<FileUploadButton disabled={busy||server.busy||!server.editable} label="Ganti" inputLabel={`Tambah versi ${document.judul}`} onFiles={selected=>{if(selected[0])void uploadFile(selected[0],document);}}/>}</div></div><details className="document-advanced" onToggle={event=>{if(event.currentTarget.open&&!details[document.dokumen_id]&&!detailErrors[document.dokumen_id])void showVersions(document.dokumen_id);}}><summary><Settings2 size={13} aria-hidden="true"/> Detail dan riwayat versi</summary>{detailErrors[document.dokumen_id]&&<p role="alert" className="wf-note">{detailErrors[document.dokumen_id]}</p>}{details[document.dokumen_id]?.riwayat_versi.map(version=><p key={version.versi_ke}>Versi {version.versi_ke} · {version.nama_file} · {Math.ceil(version.ukuran_byte/1024)} KB {version.aktif?'· aktif':''}{<button type="button" className="wf-button" disabled={busy} onClick={()=>void download(document.dokumen_id,version.versi_ke)}>Unduh versi</button>}</p>)}{details[document.dokumen_id]?.pagination.has_next&&<button type="button" className="wf-button" onClick={()=>void showVersions(document.dokumen_id,(details[document.dokumen_id]?.pagination.page??1)+1)}>Muat versi terdahulu</button>}{!details[document.dokumen_id]&&!detailErrors[document.dokumen_id]&&<p className="wf-note">Memuat riwayat versi…</p>}{editable&&<p className="wf-note">Versi baru hanya boleh ditambah oleh Penyedia pada paket dan persiapan DRAFT / PERLU_REVISI.</p>}</details></article>;})}
   {notice&&<p role="status">{notice}</p>}
  </div>
 </section>;
}
function LocalDocumentAttachments({title='Dokumen & Lampiran',scope,categories,editable,onChanged,linkTargets=[],legacyFileKeys=[],legacyEvidenceIds=[]}:Props){
 const prefix=`${scope}:documents:`,packageId=scope.split('::')[0].split(':')[0];
 const [revision,refresh]=useState(0),[category,setCategory]=useState(categories[0]??'Dokumen pendukung');
 const [reuseOpen,setReuseOpen]=useState(false),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[available,setAvailable]=useState<Record<string,LocalFile|undefined>>({});
 const links=readEvidenceLinks(scope),metadata=attachmentRepository.metadata();
 const fileKeys=[...new Set([...Object.keys(metadata).filter(key=>key.startsWith(prefix)||legacyFileKeys.includes(key)||legacyEvidenceIds.some(id=>key===`${packageId}:${id}`||key.startsWith(`${packageId}:${id}:additional:`))),...Object.keys(links)])].filter(key=>!links[key]?.detached);
 const files=fileKeys.map(key=>({key,fileKey:links[key]?.fileKey??key,meta:metadata[links[key]?.fileKey??key]})).filter(item=>!!item.meta);
 const signature=files.map(item=>`${item.key}:${item.fileKey}:${item.meta?.digest}`).join('|');
 useEffect(()=>{const update=()=>refresh(old=>old+1);window.addEventListener(ATTACHMENT_CHANGED,update);return()=>window.removeEventListener(ATTACHMENT_CHANGED,update);},[]);
 useEffect(()=>{let live=true;void Promise.all(files.map(async item=>[item.key,(await attachmentRepository.get(item.fileKey))??undefined] as const)).then(items=>{if(live)setAvailable(Object.fromEntries(items));}).catch(()=>setNotice('Sebagian berkas belum dapat dibaca di perangkat ini.'));return()=>{live=false;};},[scope,signature,revision]);
 const legacyReferences=Object.entries(readLocal<Record<string,{reference?:string;fileName?:string}>>('jala-mutu-evidence-v1',{})).filter(([key,value])=>legacyEvidenceIds.some(id=>key===`${packageId}:${id}`)&&(value.reference||value.fileName));
 const effectiveCategory=categories.includes(category)?category:categories[0]??'Dokumen pendukung';
 function changed(){refresh(old=>old+1);onChanged?.();}
 function update(key:string,patch:Parameters<typeof updateEvidenceLink>[2],action:string){if(!editable)return;try{updateEvidenceLink(scope,key,patch,action);changed();}catch{setNotice('Perubahan keterkaitan belum tersimpan.');}}
 async function upload(selected:File[]){if(!editable||busy)return;setBusy(true);try{for(const file of selected){const key=prefix+crypto.randomUUID();await attachmentRepository.put(key,file);updateEvidenceLink(scope,key,{category:effectiveCategory,categories:[effectiveCategory],status:'Tersedia'},'Tambahkan berkas');}changed();setNotice('Berkas tersimpan di perangkat; belum diunggah ke server.');}catch{setNotice('Sebagian berkas belum tersimpan. Periksa daftar sebelum mencoba kembali.');}finally{setBusy(false);}}
 async function reuse(fileKey:string){if(!editable||!fileKey||busy)return;if(files.some(item=>item.fileKey===fileKey)){setNotice('Berkas ini sudah ditautkan. Tambahkan kategori pada keterkaitan yang ada.');return;}setBusy(true);try{const file=await attachmentRepository.get(fileKey);if(!file){setNotice('Referensi ini tidak memiliki berkas yang dapat dibaca di perangkat ini.');return;}updateEvidenceLink(scope,prefix+crypto.randomUUID(),{fileKey,category:effectiveCategory,categories:[effectiveCategory],status:'Tersedia'},'Tautkan berkas tersimpan');changed();}catch{setNotice('Berkas belum dapat ditautkan.');}finally{setBusy(false);}}
 async function replaceDraftFile(key:string,selected:File[]){
  if(!editable||busy||selected.length!==1)return;

  const file=selected[0];

  if(!window.confirm(
   `Ganti lampiran ini dengan ${file.name}? File lama tetap tersimpan di perangkat.`
  ))return;

  setBusy(true);
  const nextKey=prefix+crypto.randomUUID();

  try{
   await attachmentRepository.put(nextKey,file);

   const prior=readEvidenceLinks(scope)[key];
   const selectedCategories=evidenceCategories(prior);

   try{
    updateEvidenceLink(
     scope,nextKey,
     {
      category:selectedCategories[0]??effectiveCategory,
      categories:selectedCategories.length?selectedCategories:[effectiveCategory],
      items:prior?.items??[],
      status:'Tersedia'
     },
     'Ganti berkas: tautkan pengganti'
    );

    updateEvidenceLink(
     scope,key,{detached:true},
     'Ganti berkas: lepaskan tautan lama'
    );
   }catch(error){
    updateEvidenceLink(
     scope,nextKey,{detached:true},
     'Ganti berkas dibatalkan'
    );
    throw error;
   }

   changed();
   setNotice('Berkas pengganti terpasang. File lama tidak dihapus permanen.');
  }catch{
   setNotice('Penggantian gagal. Periksa lampiran sebelum mencoba kembali.');
  }finally{
   setBusy(false);
  }
 }

 function removeDraftLink(key:string,name:string){
  if(!editable||busy)return;

  if(!window.confirm(
   `Hapus ${name} dari lampiran BA ini? File asli tetap tersimpan di perangkat.`
  ))return;

  update(key,{detached:true},'Hapus lampiran salah unggah dari draft');

  setNotice('Lampiran dilepas dari BA. File asli tetap tersimpan.');
 }
 function assignments(key:string){return evidenceCategories(links[key]);}
 return <section className="wf-panel documents-area" id={documentAttachmentId(scope)}>
  <div className="wf-panel-head"><h3>{title}</h3><span>{new Set(files.filter(item=>available[item.key]).map(item=>item.fileKey)).size} berkas</span></div>
  <div className="wf-body">
   {!editable&&categories.length>1&&<label className="document-category-label">Kategori lampiran<select aria-label="Kategori lampiran baca saja" value={effectiveCategory} onChange={event=>setCategory(event.target.value)}>{categories.map(item=><option key={item}>{item}</option>)}</select></label>}
   {!!categories.length&&<details className="document-needs"><summary>Kebutuhan dokumen ({categories.length})</summary><ul className="document-requirements">{categories.map(item=>{const matched=files.filter(file=>assignments(file.key).includes(item)&&available[file.key]);return <li key={item}>{item}<small> · {!matched.length?'Belum tersedia':matched.every(file=>links[file.key]?.status==='Perlu perbaikan')?'Perlu perbaikan':'Tersedia di perangkat'}</small></li>;})}</ul></details>}
   {editable&&<div className="document-upload-flow"><label className="document-category-label">Jenis lampiran<select value={effectiveCategory} onChange={event=>{setCategory(event.target.value);setReuseOpen(false);}}>{[...new Set([...categories,'Dokumen pendukung'])].map(item=><option key={item}>{item}</option>)}</select></label><div className="document-upload-actions"><FileUploadButton disabled={busy} label="Unggah berkas" onFiles={selected=>void upload(selected)}/><button type="button" className="wf-button" disabled={busy} aria-expanded={reuseOpen} onClick={()=>setReuseOpen(value=>!value)}>Gunakan berkas tersimpan</button></div>{reuseOpen&&<label className="document-category-label">Berkas yang sudah ada<select aria-label="Pilih berkas tersimpan untuk kategori ini" value="" disabled={busy} onChange={event=>{void reuse(event.target.value);setReuseOpen(false);}}><option value="">Pilih berkas paket ini</option>{Object.entries(metadata).filter(([key])=>key.startsWith(packageId+':')).map(([key,file])=><option value={key} key={key}>{file.name}</option>)}</select></label>}<p className="wf-note">Tersimpan di perangkat ini, belum tersinkron ke server.</p></div>}
   {legacyEvidenceIds.length>0&&<details className="document-references"><summary>Nomor dan referensi dokumen</summary><p className="wf-note">Referensi saja · file belum tersimpan sampai berkas dapat dibaca di perangkat.</p>{legacyEvidenceIds.map((id,index)=>{const key=`${packageId}:${id}`,records=readLocal<Record<string,{reference?:string;fileName?:string;updatedAt?:string}>>('jala-mutu-evidence-v1',{});return <label className="wf-field" key={id}>Referensi {categories[index]??'Dokumen pendukung'}<input disabled={!editable} value={records[key]?.reference??''} onChange={event=>{if(!editable)return;try{writeLocal('jala-mutu-evidence-v1',{...readLocal('jala-mutu-evidence-v1',{}),[key]:{...records[key],reference:event.target.value,updatedAt:new Date().toISOString()}});changed();}catch{setNotice('Referensi belum tersimpan.');}}}/></label>;})}</details>}
   {legacyReferences.length>0&&<details><summary>Referensi yang telah dicatat ({legacyReferences.length})</summary>{legacyReferences.map(([key,value])=><p key={key}>{value.reference||value.fileName}<small>Referensi tercatat; keberadaan berkas diperiksa terpisah.</small></p>)}</details>}
   {files.filter(item=>assignments(item.key).includes(effectiveCategory)).length===0&&<p className="wf-note">Belum ada dokumen untuk kategori ini.</p>}
   {files.filter(item=>assignments(item.key).includes(effectiveCategory)).map(({key,meta})=>{const link=links[key],assigned=assignments(key),items=link?.items??[];return <article className="document-file" key={key}>
    <div className="wf-row"><div className="document-file-info"><Paperclip size={16} aria-hidden="true"/><div><strong>{meta.name}</strong><small>{(meta.size / 1024 / 1024).toLocaleString('id-ID',{maximumFractionDigits:2})} MB{!available[key]?' · Berkas tidak ditemukan':''}{link?.status==='Perlu perbaikan'?' · Perlu perbaikan':''}</small></div></div><div className="wf-toolbar document-file-actions"><button type="button" className="wf-button" disabled={!available[key]} onClick={()=>{const file=available[key];if(file)downloadLocalFile(file);}}><Download size={14} aria-hidden="true"/> Unduh</button>{editable&&<>
<FileUploadButton
 disabled={busy}
 label="Ganti"
 inputLabel={`Ganti lampiran ${meta.name}`}
 onFiles={selected=>void replaceDraftFile(key,selected)}
/>
<button
 type="button"
 className="wf-button document-unlink"
 title="Hapus lampiran dari BA, file asli tetap tersimpan"
 aria-label={`Hapus ${meta.name} dari lampiran BA`}
 disabled={busy}
 onClick={()=>removeDraftLink(key,meta.name)}
>
 <Trash2 size={16} aria-hidden="true"/>
</button>
</>}</div></div>
    <details className="document-advanced"><summary><Settings2 size={13} aria-hidden="true"/> Detail dan pengaturan lampiran</summary><p className="wf-note">Pengaturan kaitan dan status disimpan sebagai jejak audit; tidak perlu diubah untuk sekadar mengunduh.</p>{editable&&<label className="document-category-label">Status pemeriksaan berkas<select aria-label={`Status ${meta.name}`} value={link?.status??'Tersedia'} onChange={event=>update(key,{status:event.target.value},'Ubah status berkas')}><option>Tersedia</option><option>Perlu perbaikan</option></select></label>}<p className="wf-note">{assigned.length} kategori · {items.length} butir pemeriksaan</p>
     <ul>{assigned.map(item=><li key={item}>{item}{editable&&<button type="button" className="wf-button" aria-label={`Lepaskan kategori ${item} dari ${meta.name}`} onClick={()=>update(key,{categories:assigned.filter(value=>value!==item)},'Lepaskan kategori')}>Lepaskan</button>}</li>)}{items.map(id=><li key={id}>{linkTargets.find(target=>target.id===id)?.label??id}{editable&&<button type="button" className="wf-button" aria-label={`Lepaskan butir ${id} dari ${meta.name}`} onClick={()=>update(key,{items:items.filter(value=>value!==id)},'Lepaskan butir')}>Lepaskan</button>}</li>)}</ul>
     {editable&&<label>Tambah keterkaitan<select aria-label={`Tambah keterkaitan ${meta.name}`} value="" onChange={event=>{const value=event.target.value;if(value.startsWith('category:'))update(key,{categories:[...assigned,value.slice(9)]},'Tautkan kategori');if(value.startsWith('item:'))update(key,{items:[...new Set([...items,value.slice(5)])]},'Tautkan butir');}}><option value="">Pilih kategori atau butir</option><optgroup label="Kategori">{categories.filter(item=>!assigned.includes(item)).map(item=><option value={'category:'+item} key={item}>{item}</option>)}</optgroup>{linkTargets.length>0&&<optgroup label="Butir pemeriksaan">{linkTargets.filter(target=>!items.includes(target.id)).map(target=><option key={target.id} value={'item:'+target.id}>{target.label}</option>)}</optgroup>}</select></label>}
    </details>
    {(link?.history?.length??0)>0&&<details className="document-advanced"><summary>Riwayat perubahan ({link!.history!.length})</summary><ol>{link!.history!.map((entry,index)=><li key={index}>{entry.action} · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString('id-ID')}</time><small>{entry.after.categories.join(', ')} · {entry.after.items.length} butir · {entry.after.status}</small></li>)}</ol></details>}
   </article>;})}
   {notice&&<p role="status">{notice}</p>}
  </div>
 </section>;
}
