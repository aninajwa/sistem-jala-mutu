import { useEffect, useRef, useState } from 'react';

import {attachmentRepository,downloadLocalFile,type LocalFile as SavedFile} from './repository/attachmentRepository';

export function Stage3BFileEvidence({ packageId, evidenceId, label, editable,onChanged }: {onChanged?:()=>void;
  packageId: string; evidenceId: string; label: string; editable: boolean;
}) {
  const key = `${packageId}:${evidenceId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [record, setRecord] = useState<SavedFile | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let live = true;setRecord(null);attachmentRepository.get(key).then(v => {if(live)setRecord(v);}).catch(() => {if(live)setError('Penyimpanan browser tidak tersedia.');});return()=>{live=false;}; }, [key]);
  async function save(file:File){if(!editable)return;try{const next=await attachmentRepository.put(key,file);setRecord(next);setError('');onChanged?.();}catch{setError('Penyimpanan berkas/metadata gagal. Muat ulang untuk memeriksa hasil.');}}
  async function remove(){if(!editable)return;try{await attachmentRepository.remove(key);setRecord(null);onChanged?.();}catch{setError('Gagal menghapus berkas.');}}
  function download(){if(record)downloadLocalFile(record);}
  const photo=/foto|gambar|visual|screenshot|tangkapan layar/i.test(label);
  return <div className="s3doc-file-evidence" style={{padding:12,border:'1px dashed #94b9cc',borderRadius:8,background:'#f6f9fc',display:'grid',gap:8}}>
    <strong>{label}</strong>
    <input ref={inputRef} type="file" hidden accept={photo?'image/*,.pdf':undefined} disabled={!editable} aria-label={`Unggah ${label}`} onChange={e=>{const f=e.target.files?.[0];if(f)void save(f);e.target.value='';}}/>
    {record?<div><strong style={{color:'#176747'}}>{record.name}</strong><div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}><button type="button" onClick={download}>Unduh berkas</button>{editable&&<><button type="button" onClick={()=>inputRef.current?.click()}>Ganti berkas</button><button type="button" onClick={()=>void remove()}>Hapus</button></>}</div></div>:editable?<button type="button" style={{padding:'10px 14px',border:'1px solid #92b6ce',background:'white',borderRadius:6,fontWeight:600,color:'#165b91',cursor:'pointer'}} onClick={()=>inputRef.current?.click()}>↑ {photo?'Unggah foto/gambar':'Unggah dokumen'}</button>:<span>Belum ada bukti</span>}
    <small style={{color:'#7a6436'}}>Disimpan hanya di browser perangkat ini; belum diunggah ke server.</small>
    {error&&<small role="alert" style={{color:'#b42318'}}>{error}</small>}
  </div>;
}
