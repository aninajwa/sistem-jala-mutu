import { useEffect, useState } from 'react';
import { readLocal, writeLocal } from '../repository/localPersistence';
import type { WorkflowRole } from '../model';
import { canAuthorStage6Note } from '../stage6Presentation';

type Note = { id:string; createdAt:string; authorRole:'Direktorat / Pusat'; authorId:string; recipient:'Penyedia Jasa / Ketua Tim'|'PIC Balai / Pengguna Jasa'; reference:string; text:string };
export const stage6NotesKey = (packageId:string) => `jala-context-note-v1:${encodeURIComponent(packageId)}:stage:6`;

type HistoricNote={id:string;stage:string;author:string;recipientId:string;timestamp:string;text:string;ref?:string;withdrawn?:boolean};
/** Read-only cross-stage projection: source notes remain in their original local keys. */
function readDirectorateHistory(packageId:string):HistoricNote[]{
  const prefix=`jala-context-note-v1:${encodeURIComponent(packageId)}:`;
  const results:HistoricNote[]=[];
  try {
    for(let i=0;i<window.localStorage.length;i++){
      const key=window.localStorage.key(i)??'';
      if(!key.startsWith(prefix)||key===stage6NotesKey(packageId))continue;
      const stage=key.includes(':stage:')?key.split(':stage:')[1].replace(/:.+$/, ''):key.includes(':audit:2')?'5':'Lainnya';
      const raw=readLocal<unknown>(key,[]);
      if(!Array.isArray(raw))continue;
      for(const entry of raw){
        if(!entry||typeof entry!=='object')continue;
        const n=entry as Record<string,unknown>;
        if(n.authorLabel!=='Direktorat / Pusat')continue;
        if(typeof n.text!=='string'||typeof n.recordedAt!=='string')continue;
        results.push({id:String(n.id??n.recordedAt),stage:stage==='4'?'4':stage,
          author:'Direktorat',recipientId:String(n.recipientId??''),timestamp:n.recordedAt,
          text:n.withdrawnAt?'Catatan telah ditarik oleh penulis.':n.text,
          withdrawn:!!n.withdrawnAt,ref:typeof n.objectRef==='string'?n.objectRef:undefined});
      }
    }
  }catch{/* Local browsing unavailable: preserve current-stage notes. */}
  return results.sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
}

export function Stage6DirectorateNotes({packageId,role,principalId}:{packageId:string;role:WorkflowRole;principalId?:string}) {
  const key = stage6NotesKey(packageId);
  const [notes,setNotes] = useState<Note[]>(()=>readLocal<Note[]>(key,[]));
  const [historical,setHistorical]=useState<HistoricNote[]>(()=>readDirectorateHistory(packageId));
  const [recipient,setRecipient] = useState<Note['recipient']>('PIC Balai / Pengguna Jasa');
  const [reference,setReference] = useState('Penerimaan data');
  const [content,setContent] = useState('');
  const [error,setError] = useState('');
  const isDirectorate = canAuthorStage6Note(role);
  useEffect(()=>{
    setNotes(readLocal<Note[]>(key,[]));
    setHistorical(readDirectorateHistory(packageId));
    const refresh=(event:StorageEvent)=>{if(event.key?.startsWith(`jala-context-note-v1:${encodeURIComponent(packageId)}:`)||event.key===null){setNotes(readLocal<Note[]>(key,[]));setHistorical(readDirectorateHistory(packageId));}};
    window.addEventListener('storage',refresh);
    return ()=>window.removeEventListener('storage',refresh);
  },[key]);
  if(role==='Admin')return null;
  const visible = notes.filter(note=>isDirectorate||note.recipient===role).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  if (!isDirectorate && visible.length===0) return null;
  function submit(){
    if(!isDirectorate)return;
    const text=content.trim();
    if(text.length<3||text.length>2000){setError('Catatan harus terdiri dari 3–2.000 karakter.');return;}
    try {
      const note:Note={id:`S6-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,createdAt:new Date().toISOString(),authorRole:'Direktorat / Pusat',authorId:principalId||'Direktorat / Pusat',recipient,reference,text};
      const next=[...readLocal<Note[]>(key,[]),note];
      writeLocal(key,next);setNotes(next);setContent('');setError('');
    } catch {setError('Catatan tidak tersimpan. Periksa penyimpanan browser.');}
  }
  return <section className="stage6-note-workspace" aria-label="Catatan pengawasan Direktorat">
    {isDirectorate && <div className="stage6-note-editor">
      <div className="stage6-section-heading"><h3>Catatan pengawasan</h3><span>Koordinasi, bukan keputusan penerimaan</span></div>
      <div className="stage6-form-grid">
        <label>Tujuan catatan<select value={recipient} onChange={event=>setRecipient(event.target.value as Note['recipient'])}>
          <option value="PIC Balai / Pengguna Jasa">Balai / Pengguna Jasa</option>
          <option value="Penyedia Jasa / Ketua Tim">Penyedia Jasa</option>
        </select></label>
        <label>Konteks<select value={reference} onChange={event=>setReference(event.target.value)}>
          <option>Penerimaan data</option><option>Audit Tingkat 3</option><option>Temuan & tindak lanjut</option><option>Dokumen penyerahan</option>
        </select></label>
      </div>
      <label className="stage6-note-label">Isi catatan<textarea value={content} maxLength={2000} rows={3} placeholder="Tuliskan hal yang perlu ditinjau pihak terkait…" onChange={event=>setContent(event.target.value)} /></label>
      {error && <p role="alert" className="stage6-error">{error}</p>}
      <div className="stage6-note-actions"><span>Catatan tersimpan lokal; tidak mengubah hasil audit atau BA.</span><button type="button" className="wf-button primary" onClick={submit}>Simpan catatan</button></div>
    </div>}
    <div className="stage6-notes-history">
      <h3>Riwayat catatan</h3>
      {visible.length===0&&(!isDirectorate||historical.length===0)?<p className="stage6-empty">Belum ada catatan yang dapat ditampilkan.</p>:<ul className="stage6-note-list">{visible.map(note=><li key={note.id}>
        <div><strong>{note.reference}</strong><span>{note.createdAt.slice(0,16).replace('T',' ')} · Untuk {note.recipient==='PIC Balai / Pengguna Jasa'?'Balai':'Penyedia'}</span></div>
        <p>{note.text}</p>
      </li>)}{isDirectorate&&historical.map(note=><li key={`historical:${note.stage}:${note.id}`} className="stage6-historical">
        <div><strong className="stage6-note-stage">Tahap {note.stage} · Catatan Direktorat</strong><span>{new Date(note.timestamp).toLocaleString('id-ID')}</span></div>
        {note.ref&&<small>Objek: {note.ref}</small>}<p>{note.text}</p>
      </li>)}</ul>}
    </div>
  </section>;
}
