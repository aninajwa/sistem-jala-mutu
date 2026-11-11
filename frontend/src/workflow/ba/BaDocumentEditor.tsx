import {documentIdentityErrors} from './documentContext09';
import {DocumentSourceEvidence} from './DocumentSourceEvidence';
import {DocumentReviewSummary} from './DocumentReviewSummary';
import {documentPurposes,documentTitles} from '../documents/documentCatalog';
import {baFieldErrors} from './fieldValidation';
import {DocumentAttachments} from '../DocumentAttachments';
import {ATTACHMENT_CHANGED} from '../repository/attachmentRepository';
import {technicalFields} from './technicalMapping';
import {useEffect,useRef,useState} from 'react';
import {renderAsync} from 'docx-preview';
import {INITIAL_WORKFLOW,type OperationalWorkflowState,type SurveyType} from '../model';
import {BA_TEMPLATES,fieldsFor,automaticFields,fillDocx,loadTemplate} from './docxEngine';
import {documentRepository,type BaIdentity,type BaVersion} from './documentRepository';
import {documentActors,DOCUMENT_STATUS_LABELS,documentActionErrors,documentFingerprint,type DocumentAction} from './documentWorkflow';
import {saveDocumentDraft,saveDraftVersion,transitionDocument} from './documentService';
import {BaTemplateFields} from './BaTemplateFields';
import {periodRange} from '../stages/periodSchedule';
const fieldLabelForAttachment=(field:{label:string;section?:string})=>field.label;
export function saveBlob(bytes:Uint8Array,name:string){const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function BaDocumentEditor({state,identity,onBack}:{state:OperationalWorkflowState;identity:BaIdentity;onBack:()=>void}){
 const [,refreshAttachments]=useState(0);useEffect(()=>{const changed=()=>refreshAttachments(old=>old+1);window.addEventListener(ATTACHMENT_CHANGED,changed);return()=>window.removeEventListener(ATTACHMENT_CHANGED,changed);},[]);
 const template=BA_TEMPLATES.find(t=>t.id===identity.kind)!;
 const stored=documentRepository.read(identity);
 const [draft,setDraft]=useState(stored.draft),[versions,setVersions]=useState(stored.versions),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[showFields,setShowFields]=useState(false),[note,setNote]=useState('');
 const preview=useRef<HTMLDivElement>(null),latest=versions.at(-1);
 useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key&&!event.key.startsWith('jala-ba-source-v1:'))return;const next=documentRepository.read(identity);setDraft(next.draft);setVersions(next.versions);setNotice('Dokumen diperbarui dari tab lain. Periksa revisi sebelum melanjutkan.');preview.current?.replaceChildren();};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[identity.packageId,identity.kind,identity.period,identity.survey,identity.auditLevel]);
 const selected=identity.period===(state.activeCyclePeriod??1)?state.cycle:state.cycleHistory?.[String(identity.period)]??{...INITIAL_WORKFLOW.cycle,selectedTypes:state.project.surveyTypes,certificateId:'',periodCompleted:false};
 const context=identity.period>0?{...state,cycle:selected}:state;
 const range=identity.period>0?periodRange(state.project.id,identity.period,state.project.surveyStartDate,state.project.surveyEndDate):{start:state.project.surveyStartDate??'',end:state.project.surveyEndDate??''};
 const automatic={...automaticFields(template,context,identity.survey as SurveyType,range,identity.auditLevel as 1|2|3),...technicalFields(template,context,identity.survey as SurveyType,range,identity.auditLevel)};
 const identityErrors=documentIdentityErrors(state,identity);
 const actors=documentActors(identity),locked=latest?.status==='submitted-local'||latest?.status==='reviewed-local',editable=!identityErrors.length&&actors.authors.includes(state.role)&&!locked;
 const values:Record<string,string>=locked?latest.fields:{...draft,...automatic,__year:draft.__year??''};
 const fields=fieldsFor(template,identity.survey as SurveyType),missing=baFieldErrors(identity.kind,identity.survey as SurveyType,values);
 const fingerprint=documentFingerprint(context,identity);
 const stale=!!latest?.sourceFingerprint&&latest.sourceFingerprint!==fingerprint;
 const valuesSignature=JSON.stringify(values);
 useEffect(()=>{preview.current?.replaceChildren();},[fingerprint,valuesSignature]);
 function update(id:string,value:string){try{saveDocumentDraft(context,identity,{...draft,[id]:value});setDraft(old=>({...old,[id]:value}));setNotice('Draft tersimpan di perangkat.');}catch(error){setNotice(String(error));}}
 function save(){try{saveDraftVersion(context,identity,values,template.sha256,latest?.version??0);setVersions(documentRepository.read(identity).versions);setNotice('Revisi draft tersimpan di perangkat.');}catch(error){setNotice(error instanceof Error?error.message:String(error));}}
 function act(action:DocumentAction){try{transitionDocument(context,identity,action,values,template.sha256,missing.length,note,latest?.version??0);setVersions(documentRepository.read(identity).versions);setNote('');setNotice('Status dokumen diperbarui. Belum merupakan pengesahan resmi.');}catch(error){setNotice(error instanceof Error?error.message:String(error));}}
 async function generate(download=false,version?:BaVersion){setBusy(true);setNotice('');try{if(!download)preview.current?.replaceChildren();const bytes=fillDocx(await loadTemplate(template),template,version?.fields??values,identity.survey as SurveyType);if(download){saveBlob(bytes,`${identity.kind}-${identity.packageId}-p${identity.period}-${identity.survey}-r${version?.version??(latest?.version??0)}-DRAFT.docx`);setNotice('DOCX dibuat dari template sumber; belum ditandatangani.');}else if(preview.current){preview.current.replaceChildren();await renderAsync(new Blob([new Uint8Array(bytes)]),preview.current,undefined,{inWrapper:true,renderHeaders:true,renderFooters:true});}}catch(error){setNotice(error instanceof Error?error.message:String(error));}finally{setBusy(false);}}
 const actions:DocumentAction[]=latest?.status==='submitted-local'?['approve','revise','reject']:latest?.status==='reviewed-local'?['reopen']:['submit'];
 const labels:Record<DocumentAction,string>={submit:'Ajukan pemeriksaan BA',approve:'Selesaikan pemeriksaan BA',revise:'Minta revisi BA',reject:'Tolak BA',reopen:'Buka revisi baru'};
 const canAct=(action:DocumentAction)=>!identityErrors.length&&(action==='submit'&&(identity.kind==='duaMingguan'||identity.kind==='bertahap')?state.role==='Penyedia Jasa / Ketua Tim':action==='submit'||action==='reopen'?actors.authors.includes(state.role):actors.reviewer===state.role);
 const waitingReview=latest?.status==='submitted-local';
 const myReview=waitingReview&&actors.reviewer===state.role;
 const needsRevision=latest?.status==='revision-requested-local'||latest?.status==='rejected-local';
 const workflowGuidance=myReview
  ? actors.authors.includes(state.role)
    ? 'Pemeriksaan internal: periksa isi dan bukti sebelum mencatat keputusan lokal. Pemeriksaan oleh role yang sama belum membuktikan pemisahan identitas pemeriksa dan penyiap.'
    : 'Periksa isi, bukti, dan kesesuaian dengan tahap sumber. Pilih selesai diperiksa, minta revisi, atau tolak sesuai hasil dan kewenangan.'
  : needsRevision&&actors.authors.includes(state.role)
    ? `Dokumen ${latest?.status==='rejected-local'?'ditolak':'perlu revisi'}. Baca alasan pemeriksa, lengkapi bagian yang diminta, simpan revisi, lalu ajukan ulang.`
  : waitingReview
    ? `Dokumen sedang menunggu pemeriksaan ${actors.reviewer}. Versi yang telah diajukan tidak boleh diedit.`
  : editable
    ? 'Lengkapi isian yang menjadi tanggung jawab Anda. Simpan draft, periksa sumber, lalu ajukan setelah seluruh syarat terpenuhi.'
  : 'Dokumen ini hanya dapat ditinjau sesuai hak akses Anda; pembukaan atau unduhan bukan persetujuan resmi.';
 return <><section className="wf-panel"><div className="wf-panel-head"><h2>{documentTitles[identity.kind]}</h2><span className="wf-status info">{!latest&&!Object.keys(draft).length?'Belum disusun':DOCUMENT_STATUS_LABELS[latest?.status??'local-draft']}</span></div><div className="wf-body"><div className="ba-status-strip"><span>{missing.length} isian wajib draft belum lengkap</span><span>{actors.authors.includes(actors.reviewer)?'Pemeriksaan lokal/internal oleh role: ':'Pemeriksa: '}{actors.reviewer}</span><span>Belum disahkan resmi</span></div>{stale&&<p role="alert" className="wf-callout warn">Data sumber berubah. Revisi sebelumnya tetap diarsipkan; minta revisi dan ajukan kembali.</p>}{latest?.reviewNote&&<p className="wf-callout">Catatan pemeriksaan: {latest.reviewNote}</p>}
 {identityErrors.length>0&&<p role="alert" className="wf-callout warn">{identityErrors.join(' ')}</p>}
 <p>{documentPurposes[identity.kind]}</p><p className="wf-callout" role="status">{workflowGuidance}</p>
 <div className="document-summary-grid"><dl><dt>Konteks</dt><dd>{state.project.packageName} · {state.project.balai}<small>{identity.survey} · {identity.period?`Periode ${identity.period}`:'Nonberkala'}</small></dd></dl><dl><dt>Penyiap dokumen</dt><dd>{actors.authors.join(' / ')}</dd></dl><dl><dt>Langkah berikutnya</dt><dd>{!latest&&!Object.keys(draft).length?`Belum disiapkan oleh ${actors.authors.join(' / ')}`:editable?'Lengkapi isian manual, periksa sumber, lalu ajukan.':latest?.status==='submitted-local'&&actors.reviewer===state.role?'Tinjau ringkasan, bukti dan catatan sebelum pemeriksaan.':latest?.status==='submitted-local'?`Menunggu pemeriksaan ${actors.reviewer}`:'Pantau status dan riwayat dokumen.'}</dd></dl></div>
 <p className="wf-note">{editable?'Isian tersimpan otomatis di perangkat. Gunakan Simpan revisi draft untuk menambahkan rekaman ke riwayat.':'Akses baca saja untuk identitas dan status dokumen ini.'}</p><div className="wf-toolbar">{editable&&<button className="wf-button" disabled={busy} onClick={save}>Simpan revisi draft</button>}<button hidden={!editable} className="wf-button" onClick={()=>setShowFields(v=>!v)}>{showFields?'Tutup rincian':editable?'Lengkapi isian template':'Lihat rincian dokumen'}</button><button className="wf-button" disabled={busy} onClick={()=>generate()}>Pratinjau DOCX</button><button className="wf-button" disabled={busy||(!editable&&!latest&&!Object.keys(draft).length)} onClick={()=>generate(true)}>Unduh DOCX draft</button><button type="button" className="wf-button" onClick={onBack}>Kembali ke halaman sebelumnya</button></div>
 {latest?.status==='submitted-local'&&actors.reviewer===state.role&&<label className="wf-field">Catatan pemeriksaan (wajib jika meminta revisi atau menolak)<textarea aria-label="Catatan pemeriksaan BA" rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Tulis temuan, bagian yang harus diperbaiki, serta rujukan bukti jika ada. Jangan mengubah hasil survei melalui BA."/></label>}
 <div className="wf-toolbar">{actions.filter(canAct).map(action=>{const errors=documentActionErrors(context,identity,action,latest,missing.length,note);return <div className="ba-action" key={action}><button type="button" className={`wf-button ${action==='submit'||action==='approve'?'primary':''}`} disabled={busy||!!errors.length} title={errors.join(' ')} onClick={()=>act(action)}>{labels[action]}</button>{!!errors.length&&<small>{errors[0]}</small>}</div>;})}</div>
 {notice&&<p role="status" className="wf-callout">{notice}</p>}{editable&&showFields&&identity.kind==='penerimaan'&&<label className="wf-field">Tahun pelaksanaan BA · wajib untuk draft<input aria-label="Tahun pelaksanaan BA" type="number" min={1900} max={2200} disabled={!editable} value={values.__year??''} onChange={event=>update('__year',event.target.value)}/></label>}{!editable&&<DocumentReviewSummary fields={fields} values={values} automatic={locked?{}:automatic}/>}{editable&&showFields&&<BaTemplateFields fields={fields} values={values} automatic={locked?{}:automatic} editable={editable} onChange={(id,value)=>{preview.current?.replaceChildren();update(id,value);}}/>}
 <details><summary>Status pengesahan</summary><p className="wf-note">Nomor BA, unduhan, dan pemeriksaan lokal belum membuktikan tanda tangan atau TTE resmi.</p></details></div></section>
 <DocumentSourceEvidence state={context} identity={identity}/>
 <DocumentAttachments title="Lampiran khusus dokumen ini" scope={`${identity.packageId}:ba-${identity.kind}-p${identity.period}-${identity.survey}-audit${identity.auditLevel}`} categories={template.attachmentRequirements??[...new Set(fields.filter(field=>/lampiran|dokumentasi|data mentah/i.test(`${field.section} ${field.label}`)).map(field=>fieldLabelForAttachment(field)))]} onChanged={()=>refreshAttachments(old=>old+1)} editable={editable}/>
 <details className="wf-panel" open><summary className="wf-panel-head">Pratinjau dokumen</summary><div ref={preview} className="ba-document-preview" aria-busy={busy}><p>Klik Pratinjau DOCX. Isian yang belum tersedia akan ditandai pada draft.</p></div></details>
 <details className="wf-panel"><summary className="wf-panel-head">Riwayat dokumen ({versions.length})</summary><div className="wf-body">{!versions.length&&<p>Belum ada revisi.</p>}{[...versions].reverse().map(version=><div className="wf-row" key={version.id}><div><strong>Revisi {version.version} · {DOCUMENT_STATUS_LABELS[version.status]}</strong><small>{version.createdAt} · {version.actor}</small>{version.reviewNote&&<p>{version.reviewNote}</p>}</div><button className="wf-button" disabled={busy} onClick={()=>generate(true,version)}>Unduh revisi {version.version}</button></div>)}</div></details></>;
}
