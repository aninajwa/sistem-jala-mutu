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
import {saveDocumentDraft,transitionDocument} from './documentService';
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
 const selected=identity.period===(state.activeCyclePeriod??1)?state.cycle:state.cycleHistory?.[String(identity.period)]??{...INITIAL_WORKFLOW.cycle,selectedTypes:state.project.surveyTypes,certificateId:'',periodCompleted:false};
 const context=identity.period>0?{...state,cycle:selected}:state;
 const range=identity.period>0?periodRange(state.project.id,identity.period,state.project.surveyStartDate,state.project.surveyEndDate):{start:state.project.surveyStartDate??'',end:state.project.surveyEndDate??''};
 const automatic={...automaticFields(template,context,identity.survey as SurveyType,range),...technicalFields(template,context,identity.survey as SurveyType,range,identity.auditLevel)};
 if(identity.kind==='audit')for(const f of template.fields)if(f.label==='Diisi nomor dokumen')automatic[f.id]=state.audits[identity.auditLevel-1].baNumber;
 const actors=documentActors(identity),locked=latest?.status==='submitted-local'||latest?.status==='reviewed-local',editable=actors.authors.includes(state.role)&&!locked;
 const values:Record<string,string>=locked?latest.fields:{...automatic,...draft,__year:state.simulationDate.slice(0,4)};
 const fields=fieldsFor(template,identity.survey as SurveyType),missing=baFieldErrors(identity.kind,identity.survey as SurveyType,values);
 const stale=!!latest?.sourceFingerprint&&latest.sourceFingerprint!==documentFingerprint(context,identity);
 function update(id:string,value:string){try{saveDocumentDraft(context,identity,{...draft,[id]:value});setDraft(old=>({...old,[id]:value}));setNotice('Draft tersimpan di perangkat.');}catch(error){setNotice(String(error));}}
 function act(action:DocumentAction){try{transitionDocument(context,identity,action,values,template.sha256,missing.length,note,latest?.version??0);setVersions(documentRepository.read(identity).versions);setNote('');setNotice('Status dokumen diperbarui. Belum merupakan pengesahan resmi.');}catch(error){setNotice(error instanceof Error?error.message:String(error));}}
 async function generate(download=false,version?:BaVersion){setBusy(true);try{const bytes=fillDocx(await loadTemplate(template),template,version?.fields??values,identity.survey as SurveyType);if(download){if(!version&&editable){const current=documentRepository.read(identity).versions.at(-1);if(current?.status==='submitted-local'||current?.status==='reviewed-local')throw new Error('Dokumen berubah di tab lain. Muat ulang.');documentRepository.addVersion(identity,{actor:state.role,templateHash:template.sha256,status:'local-draft',fields:values});setVersions(documentRepository.read(identity).versions);}saveBlob(bytes,`${identity.kind}-${identity.packageId}-p${identity.period}-${identity.survey}-r${version?.version??(editable?versions.length+1:latest?.version??0)}-DRAFT.docx`);setNotice('DOCX dibuat dari template sumber; belum ditandatangani.');}else if(preview.current){preview.current.replaceChildren();await renderAsync(new Blob([new Uint8Array(bytes)]),preview.current,undefined,{inWrapper:true,renderHeaders:true,renderFooters:true});}}catch(error){setNotice(error instanceof Error?error.message:String(error));}finally{setBusy(false);}}
 const actions:DocumentAction[]=latest?.status==='submitted-local'?['approve','revise','reject']:latest?.status==='reviewed-local'?['reopen']:['submit'];
 const labels:Record<DocumentAction,string>={submit:'Ajukan pemeriksaan BA',approve:'Selesaikan pemeriksaan BA',revise:'Minta revisi BA',reject:'Tolak BA',reopen:'Buka revisi baru'};
 const canAct=(action:DocumentAction)=>action==='submit'||action==='reopen'?actors.authors.includes(state.role):actors.reviewer===state.role;
 return <><section className="wf-panel"><div className="wf-panel-head"><h2>{template.title}</h2><span className="wf-status info">{DOCUMENT_STATUS_LABELS[latest?.status??'local-draft']}</span></div><div className="wf-body"><div className="ba-status-strip"><span>{missing.length} isian belum lengkap</span><span>Pemeriksa: {actors.reviewer}</span><span>Belum disahkan resmi</span></div>{stale&&<p role="alert" className="wf-callout warn">Data sumber berubah. Revisi sebelumnya tetap diarsipkan; minta revisi dan ajukan kembali.</p>}{latest?.reviewNote&&<p className="wf-callout">Catatan pemeriksaan: {latest.reviewNote}</p>}
 <div className="wf-toolbar"><button className="wf-button" onClick={()=>setShowFields(v=>!v)}>{showFields?'Tutup isian':'Lengkapi isian template'}</button><button className="wf-button" disabled={busy} onClick={()=>generate()}>Pratinjau DOCX</button><button className="wf-button" disabled={busy||(!editable&&!latest)} onClick={()=>generate(true)}>Unduh DOCX draft</button><button className="wf-button" onClick={onBack}>Kembali ke tahap</button></div>
 {latest?.status==='submitted-local'&&actors.reviewer===state.role&&<label className="wf-field">Catatan pemeriksaan BA<textarea aria-label="Catatan pemeriksaan BA" rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Wajib untuk revisi atau penolakan"/></label>}
 <div className="wf-toolbar">{actions.filter(canAct).map(action=>{const errors=documentActionErrors(context,identity,action,latest,missing.length,note);return <div className="ba-action" key={action}><button className={`wf-button ${action==='submit'||action==='approve'?'primary':''}`} disabled={busy||!!errors.length} title={errors.join(' ')} onClick={()=>act(action)}>{labels[action]}</button>{!!errors.length&&<small>{errors[0]}</small>}</div>;})}</div>
 {notice&&<p role="status" className="wf-callout">{notice}</p>}{showFields&&<BaTemplateFields fields={fields} values={values} automatic={locked?{}:automatic} editable={editable} onChange={update}/>}
 <details><summary>Status pengesahan</summary><p className="wf-note">Nomor BA, unduhan, dan pemeriksaan lokal belum membuktikan tanda tangan atau TTE resmi.</p></details></div></section>
 <DocumentAttachments scope={`${identity.packageId}:ba-${identity.kind}-p${identity.period}-${identity.survey}-audit${identity.auditLevel}`} categories={template.attachmentRequirements??[...new Set(fields.filter(field=>/lampiran|dokumentasi|data mentah/i.test(`${field.section} ${field.label}`)).map(field=>fieldLabelForAttachment(field)))]} onChanged={()=>refreshAttachments(old=>old+1)} editable={editable}/>
 <details className="wf-panel" open><summary className="wf-panel-head">Pratinjau dokumen</summary><div ref={preview} className="ba-document-preview"><p>Klik Pratinjau DOCX.</p></div></details>
 <details className="wf-panel"><summary className="wf-panel-head">Riwayat dokumen ({versions.length})</summary><div className="wf-body">{!versions.length&&<p>Belum ada revisi.</p>}{[...versions].reverse().map(version=><div className="wf-row" key={version.id}><div><strong>Revisi {version.version} · {DOCUMENT_STATUS_LABELS[version.status]}</strong><small>{version.createdAt} · {version.actor}</small>{version.reviewNote&&<p>{version.reviewNote}</p>}</div><button className="wf-button" disabled={busy} onClick={()=>generate(true,version)}>Unduh revisi {version.version}</button></div>)}</div></details></>;
}
