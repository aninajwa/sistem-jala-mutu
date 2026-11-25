import {useState} from 'react';
import type {OperationalWorkflowState} from '../model';
import type {BaIdentity} from './documentRepository';
import {documentSourceSnapshot} from './documentSourceSnapshot';
import {attachmentRepository,downloadLocalFile} from '../repository/attachmentRepository';
/** Only evidence already linked to this document's source scope; no package-wide guessing. */
export function DocumentSourceEvidence({state,identity}:{state:OperationalWorkflowState;identity:BaIdentity}){
 const [notice,setNotice]=useState('');
 const snapshot=documentSourceSnapshot(state,identity), prefix=`${identity.packageId}:ba-${identity.kind}-p${identity.period}-${identity.survey}-audit${identity.auditLevel}:documents:`;
 const metadata=attachmentRepository.metadata();
 const linkedSourceKeys=Object.values({...snapshot.attachmentLinks.form,...snapshot.attachmentLinks.lendutan} as Record<string,{fileKey?:string;detached?:boolean}>).filter(link=>!link.detached&&!!link.fileKey).map(link=>link.fileKey!);
 const files=Object.entries({...snapshot.attachments,...Object.fromEntries(linkedSourceKeys.map(key=>[key,metadata[key]]))}).filter(([key,meta])=>!key.startsWith(prefix)&&!!meta);
 return <section className="wf-panel"><div className="wf-panel-head"><h3>Sumber dari tahap paket</h3></div><div className="wf-body"><p className="wf-note">Data identitas dan hasil yang tersedia dibaca dari tahap terkait. Isian BA tidak mengubah data teknis sumber. Berkas di bawah telah terkait pada lingkup sumber; lampiran khusus BA dikelola terpisah.</p><p>{Object.keys({...snapshot.answers,...snapshot.legacyAnswers}).length} jawaban sumber tercatat · {files.length} referensi berkas sumber.</p>{!files.length&&<p>Belum ada berkas sumber tertaut yang teridentifikasi pada lingkup ini. Periksa Lampiran pada tahap asal.</p>}{files.map(([key,meta])=><div className="wf-row" key={key}><span>{meta!.name}<small>{key.includes(':form-')||linkedSourceKeys.includes(key)?'Tertaut pada formulir sumber':'Lampiran lingkup tahap; keterkaitan per survei perlu ditinjau'} · {meta!.size} byte</small></span><button className="wf-button" onClick={async()=>{try{const file=await attachmentRepository.get(key);if(file)downloadLocalFile(file);else setNotice('Referensi tercatat, tetapi berkas belum tersedia di perangkat ini.');}catch{setNotice('Berkas sumber belum dapat dibaca.');}}}>Unduh sumber</button></div>)}{notice&&<p role="status">{notice}</p>}</div></section>;
}
