import { useEffect, useRef, useState } from 'react';

const DATABASE = 'jala-mutu-stage3b-evidence-local';
const STORE = 'files';
type SavedFile = { file: File; name: string; savedAt: string };

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DATABASE, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function access(key: string, value?: SavedFile | null): Promise<SavedFile | null> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, value === undefined ? 'readonly' : 'readwrite');
    const req = value === undefined ? tx.objectStore(STORE).get(key) :
      value === null ? tx.objectStore(STORE).delete(key) : tx.objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve(value === undefined ? (req.result as SavedFile | undefined) ?? null : value);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export function Stage3BFileEvidence({ packageId, evidenceId, label, editable }: {
  packageId: string; evidenceId: string; label: string; editable: boolean;
}) {
  const key = `${packageId}:${evidenceId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [record, setRecord] = useState<SavedFile | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let live = true;setRecord(null);access(key).then(v => {if(live)setRecord(v);}).catch(() => {if(live)setError('Penyimpanan browser tidak tersedia.');});return()=>{live=false;}; }, [key]);
  async function save(file:File){try{const next={file,name:file.name,savedAt:new Date().toISOString()};await access(key,next);setRecord(next);setError('');}catch{setError('Gagal menyimpan berkas lokal.');}}
  async function remove(){try{await access(key,null);setRecord(null);}catch{setError('Gagal menghapus berkas.');}}
  function download(){if(!record)return;const url=URL.createObjectURL(record.file);const a=document.createElement('a');a.href=url;a.download=record.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const photo=/foto|gambar|visual|screenshot|tangkapan layar/i.test(label);
  return <div className="s3doc-file-evidence" style={{padding:12,border:'1px dashed #94b9cc',borderRadius:8,background:'#f6f9fc',display:'grid',gap:8}}>
    <strong>{label}</strong>
    <input ref={inputRef} type="file" hidden accept={photo?'image/*,.pdf':undefined} disabled={!editable} aria-label={`Unggah ${label}`} onChange={e=>{const f=e.target.files?.[0];if(f)void save(f);e.target.value='';}}/>
    {record?<div><strong style={{color:'#176747'}}>{record.name}</strong><div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}><button type="button" onClick={download}>Unduh berkas</button>{editable&&<><button type="button" onClick={()=>inputRef.current?.click()}>Ganti berkas</button><button type="button" onClick={()=>void remove()}>Hapus</button></>}</div></div>:editable?<button type="button" style={{padding:'10px 14px',border:'1px solid #92b6ce',background:'white',borderRadius:6,fontWeight:600,color:'#165b91',cursor:'pointer'}} onClick={()=>inputRef.current?.click()}>↑ {photo?'Unggah foto/gambar':'Unggah dokumen'}</button>:<span>Belum ada bukti</span>}
    <small style={{color:'#7a6436'}}>Disimpan hanya di browser perangkat ini; belum diunggah ke server.</small>
    {error&&<small role="alert" style={{color:'#b42318'}}>{error}</small>}
  </div>;
}
