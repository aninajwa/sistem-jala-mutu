import {BaGenerator} from './ba/BaGenerator';
import { localPersistence } from './repository/localPersistence';
import { useEffect, useMemo, useState } from 'react';
import type { OperationalWorkflowState } from './model';
import { workflowDocumentReferences } from './flowRules';
import { STAGE3B_DOCX_CANDIDATES } from './stage3bChecklistData.docx-candidate';
import { BA_SOURCE_TEMPLATES } from './baSourceTemplates';

type BaKind = 'kalibrasi' | 'konsistensi' | 'internal' | 'duaMingguan' | 'bertahap' | 'audit' | 'penerimaan';
type DraftFields = Record<string, string>;
type CatalogItem = { id: BaKind; title: string; stage: string; source: string; sections: string[]; owner: string };
const CATALOG: CatalogItem[] = [
  { id: 'kalibrasi', title: 'BA Kalibrasi dan Validasi', stage: 'Tahap 1–2', source: 'FORMAT BERITA ACARA KALIBRASI DAN VALIDASI.docx', owner: 'Tim kalibrasi/validasi', sections: ['Pendahuluan', 'Tim Pelaksana', 'Peralatan yang Dikalibrasi', 'Proses Kalibrasi', 'Proses Validasi', 'Hasil Kalibrasi dan Validasi', 'Jadwal Kalibrasi dan Validasi Berikutnya', 'Penutup dan Tanda Tangan', 'Lampiran'] },
  { id: 'konsistensi', title: 'BA Konsistensi', stage: 'Tahap 3B · Konsistensi', source: 'FORMAT BERITA ACARA KONSISTENSI.docx', owner: 'Tim pelaksana konsistensi', sections: ['Pendahuluan', 'Tim Pelaksana', 'Tahapan Kegiatan Konsistensi', 'Hasil Kegiatan Konsistensi', 'Lokasi dan Hasil Pengujian Konsistensi', 'Temuan dan Tindak Lanjut', 'Kesimpulan', 'Penutup dan Tanda Tangan'] },
  { id: 'internal', title: 'BA Verifikasi dan Validasi Internal Penyedia Jasa', stage: 'Tahap 3B · Validasi Internal', source: 'FORMAT BERITA ACARA VERIFIKASI DAN VALIDASI INTERNAL PENYEDIA JASA.docx', owner: 'Penyedia Jasa', sections: ['Pendahuluan', 'Tim Pelaksana', 'Ruang Lingkup Validasi dan Verifikasi', 'Tahapan Kegiatan Validasi dan Verifikasi Internal', 'Hasil Validasi dan Verifikasi Internal', 'Identifikasi dan Mitigasi Risiko', 'Temuan dan Tindak Lanjut', 'Kesimpulan', 'Penutup dan Tanda Tangan'] },
  { id: 'duaMingguan', title: 'BA Verifikasi dan Validasi 2-Mingguan', stage: 'Tahap 3B · V&V 14 Hari', source: 'FORMAT BERITA ACARA VERIFIKASI DAN VALIDASI 2.docx', owner: 'Tim V&V / Pengguna Jasa', sections: ['Pendahuluan', 'Tim Pelaksana', 'Ruang Lingkup Verifikasi dan Validasi', 'Kegiatan Validasi', 'Kegiatan Verifikasi', 'Identifikasi dan Mitigasi Risiko', 'Temuan dan Tindak Lanjut', 'Kesimpulan', 'Penutup dan Tanda Tangan'] },
  { id: 'bertahap', title: 'BA Verifikasi dan Validasi Bertahap', stage: 'Tahap 4', source: 'FORMAT BERITA ACARA VERIFIKASI DAN VALIDASI BERTAHAP.docx', owner: 'Pengguna Jasa / PPK Fisik / Penyedia', sections: ['Pendahuluan', 'Tim Pelaksana', 'Ruang Lingkup Verifikasi dan Validasi', 'Tahapan Kegiatan Inspeksi Kondisi Jalan', 'Hasil Verifikasi dan Validasi Bertahap', 'Identifikasi dan Mitigasi Risiko', 'Temuan dan Tindak Lanjut', 'Kesimpulan', 'Penutup dan Tanda Tangan'] },
  { id: 'audit', title: 'Dokumen Pemeriksaan Audit Data', stage: 'Tahap 5', source: 'FORMAT CHECKLIST AUDIT DATA SURVEY KONDISI JALAN.docx', owner: 'Tim Audit', sections: ['Informasi Umum', 'Checklist Audit per Jenis Survei', 'Temuan dan Tindak Lanjut', 'Hasil Pemeriksaan / Referensi BA Audit'] },
  { id: 'penerimaan', title: 'BA Penerimaan Data', stage: 'Tahap 6', source: 'BERITA ACARA PENERIMAAN DATA.docx', owner: 'Pihak Pertama / Pihak Kedua', sections: ['Nomor dan Para Pihak', 'Data yang Diserahkan per Jenis Survei', 'Hasil Audit / Verifikasi dan Validasi', 'Keputusan Penerimaan Data', 'Catatan dan Tindakan Perbaikan', 'Periode/Semester', 'Tanda Tangan Para Pihak dan Persetujuan'] },
];
const safeRead = (key: string): DraftFields => {
  try { const raw=localPersistence.getItem(key); const data=raw?JSON.parse(raw):{}; return data && typeof data==='object'&&!Array.isArray(data)?data:{}; }
  catch { return {}; }
};
const clean = (s?: string | null) => s?.trim() || 'Belum tersedia';
export function LegacyWorkflowDocuments({state, period=1, periodRange, onNavigate}: {state: OperationalWorkflowState;period?:number;periodRange?:{start:string;end:string};onNavigate?:(selection:string)=>void}) {
  const initialNavigation=(()=>{try {return JSON.parse(localPersistence.getItem('jala-ba-navigation-v2')||'{}') as {packageId?:string;kind?:BaKind;period?:number};}catch{return {} as {packageId?:string;kind?:BaKind;period?:number};}})();
  const requested=initialNavigation.packageId===state.project.id?initialNavigation:{};
  const [kind,setKind] = useState<BaKind>(requested.kind||'konsistensi');
  const originSelection = (()=>{try{return localPersistence.getItem('jala-ba-return-to') || '/packages:Ringkasan Paket';}catch{return '/packages:Ringkasan Paket';}})();
  const lockedKind=Boolean(requested.kind);
  const [survey,setSurvey] = useState<string>('');
  const [auditLevel,setAuditLevel] = useState<1|2|3>(1);
  const [draft,setDraft] = useState<DraftFields>({});
  const scope = state.project.surveyTypes;
  const selectedSurvey = scope.includes(survey as typeof scope[number]) ? survey : scope[0] || '';
  const spec = CATALOG.find(item=>item.id===kind)!;
  const isPeriodic = kind==='konsistensi'||kind==='internal'||kind==='duaMingguan';
  const effectivePeriod=isPeriodic?(requested.period||period):0;
  const cacheKey = `jala-ba-draft-v1:${state.project.id}:${kind}:p${effectivePeriod}:${selectedSurvey||'paket'}${kind==='audit'?`:audit-${auditLevel}`:''}`;
  useEffect(()=>{setDraft(safeRead(cacheKey));},[cacheKey]);
  const setField=(name:string,value:string)=>{if(!mayEdit)return;setDraft(prev=>{const next={...prev,[name]:value};try{localPersistence.setItem(cacheKey,JSON.stringify(next));}catch{}return next;});};
  const selectedCycle=isPeriodic&&effectivePeriod!==(state.activeCyclePeriod??1)?state.cycleHistory?.[String(effectivePeriod)]??state.cycle:state.cycle;
  const references=workflowDocumentReferences({...state,cycle:selectedCycle});
  const relatedCorrections=state.corrections.filter(c=>c.status!=='Ditutup'&&(!selectedSurvey||c.surveyType===selectedSurvey));
  const periodText=isPeriodic?`Periode ${effectivePeriod}${periodRange?.start&&periodRange?.end?` (${periodRange.start} s.d. ${periodRange.end})`:''}`:'Mengikuti tahap terkait';
  const presentRecords=useMemo(()=>state.dailyRecords.filter(row=>(!selectedSurvey||row.surveyType===selectedSurvey)&&(!isPeriodic||!periodRange?.start||row.date>=periodRange.start&&row.date<=periodRange.end)),[state.dailyRecords,selectedSurvey,isPeriodic,periodRange]);
  const isProvider=state.role==='Penyedia Jasa / Ketua Tim';
  const isBalai=state.role==='PIC Balai / Pengguna Jasa';
  const mayEdit=(kind==='internal'||kind==='konsistensi'||kind==='kalibrasi')?isProvider:(kind==='duaMingguan'||kind==='bertahap'||kind==='penerimaan')?isBalai:state.role===(['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat'] as const)[auditLevel-1];
  const auditData=state.audits[auditLevel-1];
  const auditSamples=state.dailyRecords.filter(r=>auditData.sampleIds.includes(r.id)&&(!selectedSurvey||r.surveyType===selectedSurvey));
  const auditFindings=state.corrections.filter(c=>c.blockedStage===`Audit tingkat ${auditLevel}`);
  const calRecords=state.calibrations.filter(record=>record.surveyType===selectedSurvey);
  const productionTest=state.productionTests[selectedSurvey as keyof typeof state.productionTests];
  const relatedAudit=state.audits.map((audit,index)=>({audit,level:index+1}));
  const sourceDetails=kind==='kalibrasi'?[
    ['Peralatan dan hasil kalibrasi',calRecords.length?calRecords.map(record=>[`Alat: ${record.equipment}`,`Nomor seri: ${record.serialNumber}`,`Jenis kalibrasi: ${record.calibrationKind}`,`Terakhir: ${record.lastCalibrated}`,`Berlaku sampai: ${record.dueDate}`,`Penanggung jawab: ${record.personInCharge}`,`Referensi sertifikat: ${record.certificateReference||'Belum tercatat'}`].join(' · ')).join('\n'):'Belum ada rekaman kalibrasi untuk jenis survei ini'],
    ['Hasil validasi produksi (Tahap 2)',productionTest?`Panjang uji: ${productionTest.trialKm} km; seksi: ${productionTest.sections}; pengulangan: ${productionTest.repeats}; koefisien A: ${productionTest.coefficientA}; B: ${productionTest.coefficientB}; R²: ${productionTest.rSquared}; CV: ${productionTest.coefficientVariation}%. Nilai ini catatan sumber, bukan keputusan persetujuan.`:'Belum ada rekaman uji produksi']
  ]:kind==='bertahap'?[
    ['Verifikasi dan data yang diserahkan',Object.entries(state.submission).filter(([,v])=>typeof v!=='object').map(([k,v])=>`${k}: ${String(v??'')}`).join(' · ')]
  ]:kind==='penerimaan'?[
    ['Keputusan penerimaan',`Keputusan: ${state.acceptance.acceptanceDecision||'Belum diperiksa'}; Catatan: ${state.acceptance.acceptanceRejectionReason||'Belum tersedia'}`],
    ['Hasil audit terkait',relatedAudit.map(({audit,level})=>`Tingkat ${level}: ${audit.status}; Referensi: ${audit.baNumber||'belum ada'}`).join('\n')]
  ]:[];
  // Only collect values the source systems do not already hold. Legacy section drafts stay in storage.
  const extraFields: [string,string][] = [
    ['nomor','Nomor BA (jika sudah diberikan)'],['tanggal','Tanggal kegiatan / BA'],
    ['lokasi','Lokasi kegiatan'],['tim','Nama tim dan jabatan yang belum tersedia'],
    ['dasar','Dasar hukum / pedoman tambahan'],['penandatangan','Nama pihak penandatangan (belum berarti tanda tangan sah)'],
    ['catatan','Catatan tambahan yang akan dicantumkan di lampiran'],
  ];
  const stage3bSnapshot=useMemo(()=>{
    if(!isPeriodic) return null;
    const packageId=effectivePeriod===1?state.project.id:`${state.project.id}::period-${effectivePeriod}`;
    let raw:Record<string,string>={};
    try {raw=JSON.parse(localPersistence.getItem(`jala-mutu-stage3b-docx-${packageId}-v1`)||'{}') as Record<string,string>;}catch{}
    const phase=kind==='konsistensi'?'consistency':kind==='internal'?'internal':'periodic14';
    const templates=STAGE3B_DOCX_CANDIDATES.filter(t=>t.phase===phase&&(t.survey===selectedSurvey||(selectedSurvey==='PCI'&&t.survey.startsWith('PCI'))));
    const rows: {label:string;value:string}[]=[];
    for(const template of templates){
      for(const item of template.items){
        const prefix=`${packageId}::${template.id}::${item.code}::`;
        for(const [key,value] of Object.entries(raw)){
          if(key.startsWith(prefix)&&String(value).trim())rows.push({label:item.label,value:String(value).trim()});
        }
      }
    }
    return {total:templates.reduce((n,t)=>n+t.items.length,0),answered:rows.length,rows};
  },[kind,selectedSurvey,effectivePeriod,state.project.id,isPeriodic]);
  const sourceBlocks=BA_SOURCE_TEMPLATES[kind] || [];
  const surveyRoutes=state.project.routes;
  const isTemplateValue=(v:string)=> /^\s*\[.*\]\s*$/.test(v)||/^\s*$/.test(v);
  const displayValue=(value:unknown)=>value===undefined||value===null||String(value).trim()===''?'[Belum tercatat]':String(value);
  const recordStatus=(record:(typeof calRecords)[number])=>record.certificateReference?'Sertifikat tercatat':'Perlu verifikasi';
  const enrichTable=(rows:string[][],index:number):string[][]=>{
    if(!rows.length)return rows;
    const header=rows[0].map(h=>h.trim().toLowerCase());
    const has=(x:string)=>header.some(h=>h.includes(x));
    if(kind==='kalibrasi' && has('jenis peralatan') && has('nomor seri')){
      return calRecords.length?[rows[0],...calRecords.map((r,i)=>[String(i+1),displayValue(r.equipment),displayValue((r as unknown as Record<string,unknown>).brand||(r as unknown as Record<string,unknown>).model),displayValue(r.serialNumber),displayValue(r.year)])]:rows;
    }
    if((kind==='kalibrasi'||kind==='konsistensi') && has('status kalibrasi') && has('jenis peralatan')){
      return calRecords.length?[rows[0],...calRecords.map((r,i)=>[String(i+1),displayValue(r.equipment),recordStatus(r),displayValue(r.certificateReference)])]:rows;
    }
    if(has('jenis survei') && (has('ruas jalan')||has('ruas/lokasi')) && !has('temuan')){
      return [rows[0],...[selectedSurvey].map((v,i)=>[String(i+1),v,surveyRoutes.join(', ')||'[Belum tercatat]', '[Belum tercatat]',isPeriodic?periodText:'[Periode belum dicatat]'])];
    }
    if(has('jenis survei') && has('temuan') && has('status')){
      return relatedCorrections.length?[rows[0],...relatedCorrections.map((c,i)=>[String(i+1),selectedSurvey,c.rejectionReason||'[Keterangan belum tercatat]',c.status])]:rows;
    }
    if(has('ruas jalan') && (has('hasil validasi')||has('status verifikasi')||has('hasil verifikasi'))){
      // Do not infer VALID/LULUS from a package status or missing measurement.
      return surveyRoutes.length?[rows[0],...surveyRoutes.map((route,i)=>[String(i+1),route,'[Menunggu hasil pemeriksaan]', '[Belum tercatat]'])]:rows;
    }
    if(kind==='audit' && has('jenis survey') && has('ruas/lokasi') && has('periode')){
      return [rows[0],[selectedSurvey,surveyRoutes.join(', ')||'[Belum tercatat]',periodText,state.project.contractor]];
    }
    if(kind==='penerimaan' && (has('no. ruas') || has('nama ruas'))){
      // A display route name is not a verified official road number or distance.
      return surveyRoutes.length?[rows[0],...surveyRoutes.map((route,i)=>rows[0].map((h,j)=>j===0?String(i+1):/nama ruas/i.test(h)?route:/jenis survei/i.test(h)?selectedSurvey:/periode/i.test(h)?(draft.periode||'[Belum tercatat]'):'/'.includes(h)?'[Belum tercatat]':'[Belum tercatat]'))]:rows;
    }
    return rows;
  };
  const sourcePlaceholder=(input:string)=>input
    .replace(/\[Diisi nomor dokumen\]/gi, draft.nomor||'[Nomor belum diberikan]')
    .replace(/\[dd\/mm\/yyyy\]/gi, draft.tanggal||'[Tanggal belum dicatat]')
    .replace(/\[Lokasi (?:kegiatan|inspeksi|audit|pelaksanaan[^\]]*)\]/gi, draft.lokasi||'[Lokasi belum dicatat]')
    .replace(/\[Nama (?:proyek|pekerjaan)\]/gi,state.project.packageName)
    .replace(/\[Nama penyedia jasa\]/gi,state.project.contractor)
    .replace(/\[Nama (?:Balai|pengguna jasa)\]/gi,state.project.balai)
    .replace(/\[Nama Ruas\]/gi,state.project.routes.join(', ')||'[Nama Ruas]')
    .replace(/\[Periode\]/gi,isPeriodic?periodText:'[Periode belum tercatat]');
  const templateBlocks=useMemo(()=>{
    if(kind==='penerimaan'){
      const heads=sourceBlocks.flatMap((block,index)=>block.type==='p'&&block.text==='BERITA ACARA PENERIMAAN DATA'?[index]:[]);
      const pattern=selectedSurvey==='IRI'?/survei profil memanjang/i:selectedSurvey==='PCI'?/survei kondisi perkerasan jalan/i:selectedSurvey==='Lendutan'?/survei kekuatan struktur perkerasan/i:selectedSurvey==='Jembatan'?/survei jembatan/i:selectedSurvey==='Lereng'?/survei lereng/i:selectedSurvey==='Drainase'?/survei kondisi drainase/i:selectedSurvey==='Lalu Lintas'?/survei lalu lintas/i:/survei inventori jaringan jalan/i;
      const chosen=heads.findIndex((start,i)=>sourceBlocks.slice(start,heads[i+1]??sourceBlocks.length).some(block=>block.type==='p'&&pattern.test(block.text)));
      if(chosen>=0)return sourceBlocks.slice(heads[chosen],heads[chosen+1]??sourceBlocks.length);
      return [];
    }
    if(kind==='audit'){
      // Preserve common audit headings and summary; include only survey-specific checks.
      const keywords:Record<string,string[]>= {IRI:['iri','ketidakrataan'],PCI:['pci','perkerasan'],Lendutan:['lendutan'],Jembatan:['jembatan'],Lereng:['lereng'],Drainase:['drainase'],'Lalu Lintas':['lalu lintas'],RNI:['rni','inventori']};
      const tests=keywords[selectedSurvey]||[];
      let section='';
      return sourceBlocks.filter(block=>{
        if(block.type==='p'){
          const label=block.text.toLowerCase();
          if(/(?:survei|survey) (?:iri|pci|lendutan|jembatan|lereng|drainase|lalu lintas|rni|inventori|ketidakrataan|kondisi perkerasan)/i.test(label))section=label;
          return true;
        }
        if(block.rows[0]?.some(x=>x.includes('Item yang Diperiksa'))){
          return tests.some(t=>section.includes(t)) || (tests.length===0);
        }
        return true;
      });
    }
    return sourceBlocks;
  },[kind,sourceBlocks,selectedSurvey]);
  const [previewOpen,setPreviewOpen]=useState(false);
  useEffect(()=>{setPreviewOpen(false);},[kind,selectedSurvey,effectivePeriod]);
  const printDraft=()=>{setPreviewOpen(true);window.setTimeout(()=>window.print(),150);};
  return <div className="ba-workspace" style={{display:'grid',gap:16}}>
    <style>{`@media print { body * { visibility:hidden!important; } .ba-print-zone,.ba-print-zone * {visibility:visible!important;} .ba-print-zone{position:absolute!important;left:0!important;top:0!important;width:100%!important;padding:12mm!important;color:#111!important;background:white!important;} .ba-no-print{display:none!important;} .ba-print-zone textarea,.ba-print-zone input{border:0!important;color:#111!important;} .ba-print-zone table{break-inside:auto!important;} .ba-print-zone tr{break-inside:avoid!important;} .ba-print-zone p{orphans:3;widows:3;} @page{size:A4;margin:14mm 13mm;} }`}</style>
    <div className="wf-toolbar ba-no-print" style={{justifyContent:'space-between',flexWrap:'wrap'}}><button type="button" className="wf-button" onClick={()=>onNavigate?.(originSelection)}>← Kembali ke tahap asal</button><button type="button" className="wf-button" onClick={()=>{window.location.href='/documents?submodule=%2Fdocuments%3ABerita%20acara'}}>Daftar BA paket</button></div>
    <section className="wf-panel ba-no-print"><div className="wf-panel-head"><h3>Susun Berita Acara</h3><span className="wf-status warn">Draft</span></div><div className="wf-body">
      <p className="wf-note" style={{margin:'0 0 12px'}}>Informasi teknis berasal dari tahap pemeriksaan; isian ini hanya untuk informasi yang belum tersedia. Paket: <strong>{state.project.packageName}</strong> · {periodText}. Data yang belum tercatat perlu dilengkapi sebelum diajukan.</p>
      <div className="wf-fields">
        <div className="wf-field"><label>Jenis dokumen</label>{lockedKind?<div className="wf-callout" style={{marginTop:4}}><strong>{spec.title}</strong><div>{spec.stage}</div></div>:<select value={kind} onChange={e=>setKind(e.target.value as BaKind)}>{CATALOG.map(item=><option key={item.id} value={item.id}>{item.title} — {item.stage}</option>)}</select>}</div>
        {kind==='audit'&&<div className="wf-field"><label>Tingkat audit</label><select value={auditLevel} onChange={e=>setAuditLevel(Number(e.target.value) as 1|2|3)}><option value={1}>Tingkat 1 · Internal Penyedia</option><option value={2}>Tingkat 2 · PIC Balai</option><option value={3}>Tingkat 3 · Direktorat</option></select></div>}
        <div className="wf-field"><label>Jenis survei</label><select value={selectedSurvey} onChange={e=>setSurvey(e.target.value)}>{scope.map(item=><option key={item} value={item}>{item}</option>)}</select></div>
      </div>
      <div className="wf-callout" style={{marginTop:12}}><strong>{spec.stage} · {spec.owner}</strong><div>{periodText}</div><div>{mayEdit?"Anda dapat melengkapi draft ini.":"Dokumen hanya dapat dilihat pada peran ini."}</div></div>
      <div className="wf-fields" style={{marginTop:14}}>
        {extraFields.map(([name,label])=><div className="wf-field" key={name}><label>{label}</label>{name.startsWith('bagian-')||name==='tim'||name==='penandatangan'||name==='dasar'?<textarea rows={3} value={draft[name]||''} disabled={!mayEdit} onChange={e=>setField(name,e.target.value)} placeholder={`Isi ${label.toLowerCase()} berdasarkan dokumen/bukti resmi`}/>:<input value={draft[name]||''} disabled={!mayEdit} onChange={e=>setField(name,e.target.value)} placeholder="Belum diisi"/>}</div>)}
      </div>
      <div className="wf-toolbar" style={{marginTop:12}}><button type="button" className="wf-button" onClick={()=>setPreviewOpen(v=>!v)}>{previewOpen?"Tutup pratinjau":"Lihat pratinjau BA"}</button><button type="button" className="wf-button primary" onClick={printDraft}>Cetak draft PDF</button></div>
    </div></section>
    <section className="wf-panel ba-print-zone" style={{display:previewOpen?undefined:'none',background:'#fff',color:'#1b2733'}}><div className="wf-body" style={{maxWidth:950,margin:'0 auto',fontFamily:'Arial, sans-serif',lineHeight:1.5}}>
      <div style={{textAlign:'center',borderBottom:'2px solid #172d42',padding:14}}><strong style={{fontSize:16}}>DRAFT · {spec.title.toUpperCase()}</strong><div style={{fontSize:11}}>Pratinjau mengikuti teks dan tabel dari {spec.source}; belum disahkan / bukan salinan bertanda tangan.</div></div>
      <div className="ba-cover-info" style={{border:'1px solid #cbd5e1',padding:12,margin:'14px 0',fontSize:12}}>
        <strong>DATA PAKET TERHUBUNG</strong><div>Paket: {state.project.packageName} · ID: {state.project.id}</div><div>Balai: {state.project.balai} · Penyedia: {state.project.contractor}</div><div>Jenis survei: {selectedSurvey} · {periodText} · Ruas: {state.project.routes.join(', ')}</div>
      </div>
      {templateBlocks.map((block,index)=>block.type==='p'?<p key={index} style={{fontWeight:block.strong?700:400,whiteSpace:'pre-wrap',fontSize:12,margin:'6px 0',breakInside:'avoid'}}>{sourcePlaceholder(block.text)}</p>:<table key={index} style={{borderCollapse:'collapse',tableLayout:'fixed',width:'100%',margin:'12px 0',fontSize:11}}><tbody>{enrichTable(block.rows,index).map((cells,row)=><tr key={row}>{cells.map((cell,col)=><td key={col} style={{border:'1px solid #657483',padding:6,whiteSpace:'pre-wrap',verticalAlign:'top',overflowWrap:'anywhere'}}>{sourcePlaceholder(cell)||' '}</td>)}</tr>)}</tbody></table>)}
      <div style={{breakBefore:'page',borderTop:'1px solid #cbd5e1',marginTop:22,paddingTop:12}}><h3 style={{fontSize:14}}>LAMPIRAN DATA PEMERIKSAAN TERCATAT</h3>
        <p style={{fontSize:11}}>Lampiran ini mengambil hasil sumber yang sudah ada. Nilai yang belum tercatat pada template utama tetap harus dilengkapi; tidak berarti pemeriksaan otomatis lulus.</p>
        {sourceDetails.map(([label,value])=><div key={label} style={{marginTop:10,breakInside:'avoid'}}><strong style={{fontSize:12}}>{label}</strong><p style={{whiteSpace:'pre-wrap',fontSize:11}}>{value}</p></div>)}
        {stage3bSnapshot&&<div style={{marginTop:10}}><strong>Checklist {selectedSurvey} · {periodText}</strong><p>{stage3bSnapshot.rows.length} jawaban tercatat</p><table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}><tbody>{stage3bSnapshot.rows.map((r,i)=><tr key={i}><td style={{border:'1px solid #94a3b8',padding:5}}>{r.label}</td><td style={{border:'1px solid #94a3b8',padding:5}}>{r.value}</td></tr>)}</tbody></table></div>}
        {kind==='audit'&&<div style={{marginTop:10}}><strong>Audit Tingkat {auditLevel}</strong><p>Status: {auditData.status} · Referensi: {auditData.baNumber||'Belum ada'} · Catatan: {auditData.decisionNote||'Belum tercatat'}</p><table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}><tbody>{Object.entries(auditData.reviewChecks||{}).map(([key,value])=><tr key={key}><td style={{border:'1px solid #94a3b8',padding:5}}>{key}</td><td style={{border:'1px solid #94a3b8',padding:5}}>{value?'Diperiksa':'Belum diperiksa'}</td></tr>)}</tbody></table><p>Sampel {auditSamples.length} · Temuan {auditFindings.length}</p></div>}
        <div style={{marginTop:12}}><strong>Temuan terbuka</strong><p>{relatedCorrections.length} temuan · {presentRecords.length} rekaman kegiatan {selectedSurvey}</p>{relatedCorrections.map(c=><p key={c.id} style={{fontSize:11}}>{c.id}: {c.rejectionReason} ({c.status})</p>)}</div>
        {draft.tim&&<p>Tim pelaksana tambahan: {draft.tim}</p>}{draft.dasar&&<p>Pedoman tambahan: {draft.dasar}</p>}{draft.catatan&&<p>Catatan tambahan: {draft.catatan}</p>}{draft.penandatangan&&<p>Calon penandatangan: {draft.penandatangan} — tanda tangan belum diverifikasi</p>}
      </div>
    </div></section>
    <details className="wf-panel ba-no-print"><summary style={{padding:12,cursor:"pointer",fontWeight:600}}>Nomor / referensi dokumen dari sistem sumber ({references.length}, bukan berkas BA)</summary><div className="wf-body"><div className="wf-table"><table><thead><tr><th>Dokumen</th><th>Referensi</th><th>Status sumber</th></tr></thead><tbody>{references.map((row,index)=><tr key={`${row.name}-${index}`}><td>{row.name}</td><td>{row.reference}</td><td>{row.status}</td></tr>)}</tbody></table></div></div></details>
  </div>;
}
export function WorkflowDocuments(props:Parameters<typeof LegacyWorkflowDocuments>[0]){return <><BaGenerator {...props}/><details className="wf-panel"><summary className="wf-panel-head">Catatan dan pratinjau versi terdahulu (arsip)</summary><LegacyWorkflowDocuments {...props}/></details></>;}
