import {useCallback, useEffect, useState} from 'react';
import {ATTACHMENT_CHANGED, attachmentRepository} from './repository/attachmentRepository';
import {readEvidenceLinks, evidenceCategories} from './repository/evidenceLinks';
import {readLocal} from './repository/localPersistence';
import {STAGE0_LEGACY_EVIDENCE_IDS, summarizeStage0Evidence} from './stage0EvidenceStatus';
import './stage0EvidenceOverview.css';

const STATUS: Record<string,string> = {
  'berkas-lokal': 'Berkas tercatat di perangkat',
  'perlu-perbaikan': 'Berkas perlu perbaikan',
  'referensi': 'Hanya nomor / referensi',
  'belum-tercatat': 'Belum tercatat',
};

type Props = {packageId:string; role:string};
export function Stage0EvidenceOverview({packageId,role}:Props){
  const [revision,refresh]=useState(0);
  const scope=`${packageId}:stage0`;
  const [availableKeys,setAvailableKeys]=useState<Set<string>>(new Set());
  const metadata=attachmentRepository.metadata();
  const links=readEvidenceLinks(scope);
  const legacy=readLocal<Record<string,{reference?:string;fileName?:string}>>('jala-mutu-evidence-v1',{});
  const rowsInput=Object.entries(links).map(([key,link])=>({
    key,fileKey:link.fileKey,categories:evidenceCategories(link),status:link.status,detached:link.detached,
  }));
  const legacyReferences=Object.fromEntries(STAGE0_LEGACY_EVIDENCE_IDS.map(id=>[id,legacy[`${packageId}:${id}`]??{}]));
  const legacyKeys=STAGE0_LEGACY_EVIDENCE_IDS.flatMap(id=>Object.keys(metadata).filter(key=>key===`${packageId}:${id}` || key.startsWith(`${packageId}:${id}:additional:`)));
  const declaredKeys=[...new Set([...rowsInput.map(item=>item.fileKey??item.key),...Object.keys(metadata).filter(key=>key.startsWith(`${scope}:documents:`)),...legacyKeys])];
  const checkFiles=useCallback(()=>{
    let current=true;
    void Promise.all(declaredKeys.map(async key=>[key,Boolean(await attachmentRepository.get(key))] as const))
      .then(entries=>{if(current)setAvailableKeys(new Set(entries.filter(([,exists])=>exists).map(([key])=>key)));})
      .catch(()=>{if(current)setAvailableKeys(new Set());});
    return ()=>{current=false;};
  // Metadata keys capture actual changes via refresh events; avoid re-reading on each render.
  },[packageId,revision]);
  useEffect(()=>checkFiles(),[checkFiles]);
  useEffect(()=>{
    const changed=()=>refresh(value=>value+1);
    window.addEventListener(ATTACHMENT_CHANGED,changed);
    return ()=>window.removeEventListener(ATTACHMENT_CHANGED,changed);
  },[]);
  // Old standalone attachments are listed under legacy keys; do not mistake them for categories linked by user.
  const legacyLinked=legacyKeys.map(key=>({key,categories:[STAGE0_LEGACY_EVIDENCE_IDS.find((id)=>key===`${packageId}:${id}`||key.startsWith(`${packageId}:${id}:additional:`))||''].map(id=>{
      const index=STAGE0_LEGACY_EVIDENCE_IDS.indexOf(id as typeof STAGE0_LEGACY_EVIDENCE_IDS[number]);
      return index<0?'':(['Laporan Pendahuluan','Program Mutu / Quality Management Plan','RMPK','RKK','RMLLP','Bukti Koordinasi'] as const)[index];
    }),status:'Tersedia'}));
  const scopeLinked=Object.keys(metadata).filter(key=>key.startsWith(`${scope}:documents:`)&&!links[key]).map(key=>({key,categories:[],status:'Tersedia'}));
  const rows=summarizeStage0Evidence({links:[...rowsInput,...legacyLinked,...scopeLinked],availableKeys,legacyReferences});
  const recorded=rows.filter(row=>row.status==='berkas-lokal').length;
  const referential=rows.filter(row=>row.status==='referensi').length;
  return <section className="wf-panel stage0-evidence-overview" aria-label="Ringkasan bukti persiapan">
    <div className="wf-panel-head"><h3>Ringkasan bukti pendahuluan</h3><span>{recorded}/{rows.length} kategori memiliki berkas lokal</span></div>
    <div className="wf-body">
      <p className="wf-note">{role==='Penyedia Jasa / Ketua Tim'
       ? 'Periksa kelengkapan dokumen dan referensi sebelum mengajukan laporan kepada Balai.'
       : role==='PIC Balai / Pengguna Jasa'
       ? 'Gunakan daftar ini untuk menelusuri bukti sebelum menentukan hasil review.'
       : 'Ringkasan pemantauan bukti; keputusan dan pemeriksaan teknis dilakukan oleh role yang berwenang.'}</p>
      <div className="stage0-evidence-list">{rows.map(row=><div key={row.category} className="stage0-evidence-item">
        <strong>{row.category}</strong><span className={`stage0-evidence-status stage0-evidence-${row.status}`}>{STATUS[row.status]}</span>
      </div>)}</div>
      <div className="stage0-evidence-bottom"><small>{referential} kategori hanya memiliki referensi; referensi tidak membuktikan file tersedia. Berkas lokal belum berarti sudah diunggah ke server atau diverifikasi Balai.</small>
      <button type="button" className="wf-button" onClick={()=>refresh(old=>old+1)}>Perbarui pemeriksaan bukti</button></div>
      <p className="wf-note">Ringkasan ini tidak mengganti checklist persiapan, penilaian terhadap KAK, atau keputusan Balai. Rincian dokumen dapat diperiksa pada bagian Dokumen &amp; Lampiran di bawah.</p>
    </div>
  </section>;
}
