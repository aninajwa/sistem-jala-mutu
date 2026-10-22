import {LendutanPeriodReview} from './LendutanPeriodReview';
import {sourceInspectionStatus} from './repository/sourceChecklistRepository';
import {legacyPeriodAnswers} from './repository/legacyPeriodArchive';
import {RoleWorkSection} from './RoleWorkSection';
import {useCallback,useEffect,useState} from 'react';
import type {SurveyType,WorkflowRole} from './model';
import type {ChecklistProjectInfo} from './checklistProjectValues';
import {SourceDocumentChecklist} from './SourceDocumentChecklist';

const activities=[['consistency','Konsistensi'],['internal','V&V Internal'],['periodic14','V&V Bersama / 2-Mingguan']] as const;
export function Stage3BOperationalForms({packageId,surveyTypes,role,projectInfo,pciManual=true,periodStart,periodEnd,selectedSurvey,onSurveyChange,onCompletionChange,onAnswersChanged}:{packageId:string;surveyTypes:SurveyType[];role:WorkflowRole;selectedSurvey?:SurveyType;onSurveyChange?:(survey:SurveyType)=>void;projectInfo?:ChecklistProjectInfo;periodStart?:string;periodEnd?:string;pciManual?:boolean;onCompletionChange?:(phase:'consistency'|'internal'|'periodic14',complete:boolean)=>void;onAnswersChanged?:()=>void}){
 const historical=legacyPeriodAnswers(packageId);
 const [activity,setActivity]=useState<'consistency'|'internal'|'periodic14'>(role==='PIC Balai / Pengguna Jasa'?'periodic14':'consistency');
 useEffect(()=>setActivity(role==='PIC Balai / Pengguna Jasa'?'periodic14':'consistency'),[role]);
 const updateCompletion=useCallback(()=>{for(const [phase] of activities){const complete=surveyTypes.length>0&&surveyTypes.every(survey=>{return sourceInspectionStatus(packageId,survey,phase,pciManual,projectInfo?{...projectInfo,periodStart,periodEnd}:undefined).complete;});onCompletionChange?.(phase,complete);}},[packageId,surveyTypes.join('|'),pciManual,onCompletionChange,projectInfo,periodStart,periodEnd]);
 useEffect(updateCompletion,[updateCompletion]);
 return <section id="pemeriksaan-berkala"><div className="wf-toolbar" role="tablist" aria-label="Kegiatan pemeriksaan berkala">{activities.map(([key,label])=><button role="tab" aria-selected={activity===key} key={key} className={`wf-button ${activity===key?'primary':''}`} onClick={()=>setActivity(key)}>{label}</button>)}</div>
 <RoleWorkSection primary={activity==='periodic14'?role==='PIC Balai / Pengguna Jasa':role==='Penyedia Jasa / Ketua Tim'} title={activity==='periodic14'?'Pemeriksaan bersama Balai':'Pemeriksaan internal Penyedia'}>{(selectedSurvey??surveyTypes[0])==='Lendutan'&&activity!=='consistency'?<div>{role!=='PIC Balai / Pengguna Jasa'&&surveyTypes.length>1&&<label>Jenis survei<select aria-label="Jenis survei checklist sumber" value={selectedSurvey??surveyTypes[0]} onChange={e=>onSurveyChange?.(e.target.value as SurveyType)}>{surveyTypes.map(type=><option key={type}>{type}</option>)}</select></label>}<LendutanPeriodReview scope={packageId} phase={activity} role={role} onChanged={()=>{updateCompletion();onAnswersChanged?.();}}/></div>:<SourceDocumentChecklist key={`${packageId}:${activity}`} packageId={packageId} phase={activity} defaultSurvey={selectedSurvey} onSurveyChange={onSurveyChange} hideSurveySelector={role==='PIC Balai / Pengguna Jasa'} surveyTypes={surveyTypes} role={role} editableRoles={activity==='periodic14'?['PIC Balai / Pengguna Jasa']:['Penyedia Jasa / Ketua Tim']} projectInfo={projectInfo?{...projectInfo,periodStart,periodEnd}:undefined} pciManual={pciManual} onCompletionChange={updateCompletion} onAnswersChanged={()=>{updateCompletion();onAnswersChanged?.();}}/>}</RoleWorkSection>
 {historical.length>0&&<details className="wf-panel"><summary className="wf-panel-head">Riwayat pemeriksaan · {historical.length} catatan</summary><div className="wf-body"><p className="wf-note">Catatan terdahulu dipertahankan sebagai riwayat; tidak otomatis menjadi keputusan formulir aktif.</p><dl>{historical.map(row=><div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div></details>}
 </section>;
}
