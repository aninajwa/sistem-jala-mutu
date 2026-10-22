import {legacyPeriodFileKeys} from './repository/legacyPeriodArchive';
import {SOURCE_FORM_CHANGED} from './repository/workflowReconciliation';
import {formSections,questionsInBlocks} from './formSections';
import type {ChecklistProjectInfo} from './checklistProjectValues';
import {SourceResultTables,sourceCellEditable,sourceCellKey} from './SourceResultTables';
import {DocumentAttachments,documentAttachmentId} from './DocumentAttachments';
import {useEffect,useMemo,useState} from 'react';
import type {SurveyType,WorkflowRole} from './model';
import {documentQuestions,sourceQuestionSelection,sourceQuestionAnswered,sourceKeyValueTable,sourceDocument,sourceDocumentKey,type SourceQuestion,type SourceBlock} from './sourceDocumentModel';
import {validateSourceDocument} from './sourceFormValidation';
import {readLocal,writeLocal} from './repository/localPersistence';
export function SourceDocumentChecklist({packageId,phase,surveyTypes,role,editableRoles,onCompletionChange,onAnswersChanged,onSurveyChange,additionalAttachmentCategories=[],legacyEvidenceIds=[],projectInfo,defaultSurvey,hideSurveySelector=false,pciManual=true}:{additionalAttachmentCategories?:string[];legacyEvidenceIds?:string[];projectInfo?:ChecklistProjectInfo;defaultSurvey?:SurveyType;hideSurveySelector?:boolean;pciManual?:boolean;packageId:string;phase:string;surveyTypes:SurveyType[];role:WorkflowRole;editableRoles:WorkflowRole[];onCompletionChange?:(survey:SurveyType,complete:boolean)=>void;onAnswersChanged?:()=>void;onSurveyChange?:(survey:SurveyType)=>void}){
 const [survey,setSurvey]=useState<SurveyType>(defaultSurvey??surveyTypes[0]??'IRI');
 useEffect(()=>{if(defaultSurvey&&surveyTypes.includes(defaultSurvey))setSurvey(defaultSurvey);else if(!surveyTypes.includes(survey)&&surveyTypes[0])setSurvey(surveyTypes[0]);},[defaultSurvey,surveyTypes,survey]);
 const document=surveyTypes.includes(survey)?sourceDocument(survey,phase,pciManual,Number(packageId.match(/::audit-(\d+)/)?.[1]??1)):undefined,key=sourceDocumentKey(packageId,document?.id??'missing');
 const [revision,setRevision]=useState(0),[filter,setFilter]=useState('all'),[notice,setNotice]=useState('');
 const answers=useMemo(()=>readLocal<Record<string,string>>(key,document?.derivedFrom?readLocal(sourceDocumentKey(packageId,document.derivedFrom),{}):{}),[key,revision]);
 const questions=useMemo(()=>document?documentQuestions(document):[],[document]);
 const validation=document?validateSourceDocument(document,answers,projectInfo):undefined;
 const complete=!!validation?.complete,canEdit=editableRoles.includes(role)&&surveyTypes.includes(survey);
 useEffect(()=>{onCompletionChange?.(survey,complete);},[survey,complete,onCompletionChange]);
 function persist(id:string,value:string){if(!canEdit)return;try{writeLocal(key,{...readLocal<Record<string,string>>(key,document?.derivedFrom?readLocal(sourceDocumentKey(packageId,document.derivedFrom),{}):{}),[id]:value});setRevision(old=>old+1);onAnswersChanged?.();window.dispatchEvent(new Event(SOURCE_FORM_CHANGED));setNotice('Isian tersimpan.');}catch{setNotice('Penyimpanan gagal; isian belum tersimpan.');}}
 function update(id:string,value:string){const question=questions.find(item=>item.id===id);if(!question)return;if(question.multiple){try{const selected=JSON.parse(value);if(!Array.isArray(selected)||!selected.every(option=>question.options.includes(option)))return;}catch{return;}}else if(!question.options.includes(value))return;persist(id,value);}
 function updateCell(id:string,value:string){if(!document)return;const valid=document.tables.some(table=>table.rows.some((row,i)=>row.some((cell,j)=>(i>0||sourceKeyValueTable(table.rows))&&sourceCellKey(table.table,i+1,j+1)===id&&sourceCellEditable(cell))));if(valid)persist(id,value);}
 const blocks:SourceBlock[]=document?.blocks??document?.tables.map(table=>({kind:'table',table:table.table,heading:table.heading,chapter:table.chapter}))??[];
 const attachmentStart=blocks.findIndex(block=>block.kind==='heading'&&/^(?:[A-Z]\.\s*)?LAMPIRAN$/i.test(block.text??''));
 const attachmentCategories=attachmentStart<0?[]:blocks.slice(attachmentStart+1).filter(block=>block.kind==='paragraph'&&!/^\[/.test(block.text??'')).map(block=>block.text!).filter(Boolean);
 const chapters=formSections(blocks);
 function renderQuestion(item:SourceQuestion){if(filter==='missing'&&sourceQuestionAnswered(item,answers[item.id]??'')||filter==='attention'&&!/^(tidak|belum)/i.test(answers[item.id]??''))return null;
 const table=document?.tables.find(table=>table.table===item.table),noteColumn=table?.rows[0]?.findIndex(label=>/keterangan|catatan/i.test(label))??-1;
 return <div className="structured-checklist-item" key={item.id}><div className="structured-checklist-question"><span>{item.number}</span><strong>{item.label}</strong></div><fieldset className="structured-checklist-options" aria-label={item.label}>{item.options.map(option=><label className={`structured-choice ${sourceQuestionSelection(item,answers[item.id]??'').includes(option)?'selected':''}`} key={option}><input type={item.multiple?'checkbox':'radio'} name={`${key}:${item.id}`} disabled={!canEdit} checked={sourceQuestionSelection(item,answers[item.id]??'').includes(option)} onChange={()=>{const selected=sourceQuestionSelection(item,answers[item.id]??'');update(item.id,item.multiple?JSON.stringify(selected.includes(option)?selected.filter(value=>value!==option):[...selected,option]):option);}}/>{option}</label>)}</fieldset>{noteColumn>=0&&<details><summary>Catatan</summary><textarea rows={2} aria-label={`Catatan ${item.number||item.label}`} disabled={!canEdit} value={answers[sourceCellKey(item.table,item.row,noteColumn+1)]??''} onChange={e=>updateCell(sourceCellKey(item.table,item.row,noteColumn+1),e.target.value)}/></details>}</div>;
 }
 function renderBlocks(selected:SourceBlock[]){return selected.map((block,index)=>{
 if(block.kind==='heading')return null;
 if(attachmentStart>=0&&blocks.indexOf(block)>attachmentStart)return null;
 if(block.kind==='paragraph'){
  const question=questions.find(item=>item.paragraph===block.id);if(question)return <div key={block.id}>{renderQuestion(question)}</div>;
  if(!block.text)return null;
  if(!/^\[.*\]$/.test(block.text.trim())&&/\[[^\]]+\]/.test(block.text))return <div className="wf-fields" key={block.id}>{Array.from(block.text.matchAll(/\[([^\]]+)\]/g)).map((match,i)=><label className="wf-field" key={i}>{match[1]}<input disabled={!canEdit} type={/DD\/MM\/YYYY/i.test(match[1])?'date':'text'} placeholder={match[1]} value={answers[`paragraph:${block.id}:m${i}`]??''} onChange={e=>persist(`paragraph:${block.id}:m${i}`,e.target.value)}/></label>)}</div>;
  if(/^\[.*\]$/.test(block.text.trim())||/_{3,}|\.{3,}/.test(block.text))return <label className="wf-field" key={block.id}>{(/^\s*[^:]+:/.test(block.text)?block.text.split(':')[0]:block.heading)||'Keterangan'}<textarea rows={2} disabled={!canEdit} placeholder={block.text.replace(/^\[|\]$/g,'')} value={answers[`paragraph:${block.id}:text`]??''} onChange={e=>persist(`paragraph:${block.id}:text`,e.target.value)}/></label>;
  return <p className="wf-note" key={block.id}>{block.text}</p>;
 }
 const table=document?.tables.find(item=>item.table===block.table);if(!table||!document)return null;
 if(table.rows[0]?.some(cell=>/KEMENTERIAN|DIREKTORAT JENDERAL/i.test(cell)))return null;
 const items=questions.filter(item=>item.table===table.table);
 return <div className="source-table-section" key={`table:${table.table}`}>{/dokumentasi|lampiran/i.test(table.heading??'')&&<p><a href={`#${documentAttachmentId(`${packageId}:form-${document.id}`)}`}>Kelola berkas di Dokumen &amp; Lampiran</a></p>}{items.map(renderQuestion)}{items.length?<details><summary>Rincian hasil</summary><SourceResultTables projectInfo={projectInfo} document={document} answers={answers} editable={canEdit} onChange={updateCell} onlyTable={table.table}/></details>:<SourceResultTables projectInfo={projectInfo} document={document} answers={answers} editable={canEdit} onChange={updateCell} onlyTable={table.table}/>}</div>;
 });}
 return <section className="wf-panel source-exact-checklist"><div className="wf-panel-head"><h3>Formulir pemeriksaan {survey==='PCI'?(pciManual?'PCI Manual':'PCI AI'):survey}</h3><span>{validation?`${validation.completed}/${validation.required} wajib`: `${questions.filter(item=>sourceQuestionAnswered(item,answers[item.id]??'')).length}/${questions.length} jawaban`}</span></div><div className="wf-body"><div className="wf-toolbar">{!hideSurveySelector&&<label>Jenis survei<select aria-label="Jenis survei checklist sumber" disabled={!surveyTypes.length} value={survey} onChange={e=>{setSurvey(e.target.value as SurveyType);onSurveyChange?.(e.target.value as SurveyType);}}>{!surveyTypes.length&&<option value={survey}>Lingkup survei belum ditetapkan</option>}{surveyTypes.map(type=><option key={type}>{type}</option>)}</select></label>}<label>Tampilkan<select aria-label="Filter checklist sumber" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Semua butir</option><option value="missing">Belum dijawab</option><option value="attention">Perlu pemeriksaan</option></select></label></div>
 {validation&&validation.issues.length>0&&<p className="wf-callout warn" role="status">{validation.issues.length} isian wajib belum valid. {validation.issues.slice(0,2).map(issue=>issue.label).join(' · ')}{validation.issues.length>2?' · …':''}</p>}
 {!canEdit&&<p className="stage-readonly-note">Baca saja · pemeriksaan oleh {editableRoles.join(' / ')}.</p>}
 {!document?<p role="alert">{surveyTypes.length?'Formulir kegiatan ini belum tersedia. Kelengkapan belum dapat dinilai.':'Lingkup jenis survei paket belum ditetapkan. Tidak ada formulir yang dapat diisi.'}</p>:<>{chapters.map((chapter,index)=>{
 const groups=chapter.groups.filter(group=>group.blocks.some(block=>block.kind!=='heading'&&(attachmentStart<0||blocks.indexOf(block)<=attachmentStart)));
 if(!groups.length)return null;
 const content=groups.map((group,i)=>{const body=renderBlocks(group.blocks);if(!group.label||group.label===chapter.label)return <div key={i}>{body}</div>;
 const items=questionsInBlocks(questions,group.blocks);
 return <details className="structured-checklist-section" key={i} open={!chapter.label&&i===0}><summary><strong>{group.label}</strong>{items.length>0&&<span>{items.filter(item=>sourceQuestionAnswered(item,answers[item.id]??'')).length}/{items.length} terjawab</span>}</summary>{body}</details>;});
 return chapter.label?<details className="structured-checklist-section operational-form-chapter" key={`${chapter.label}:${index}`} open={index===0}><summary><strong>{chapter.label}</strong></summary>{content}</details>:<div key={index}>{content}</div>;
 })}<DocumentAttachments scope={`${packageId}:form-${document.id}`} legacyFileKeys={legacyPeriodFileKeys(packageId,survey==='PCI'?(pciManual?'PCI Manual':'PCI AI'):survey,phase)} legacyEvidenceIds={legacyEvidenceIds} categories={[...new Set([...attachmentCategories,...additionalAttachmentCategories])]} linkTargets={questions.map(item=>({id:`${document.id}:${item.id}`,label:`${item.number} ${item.label}`.trim()}))} editable={canEdit} onChanged={onAnswersChanged}/></>}
 {notice&&<small role="status">{notice}</small>}<small>Jawaban, hasil sistem dan keputusan pemeriksa dicatat terpisah.</small></div></section>;
}
