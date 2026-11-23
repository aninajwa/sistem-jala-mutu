import {LendutanPeriodReview} from './LendutanPeriodReview';
import {legacyPeriodAnswers} from './repository/legacyPeriodArchive';
import type {SurveyType,WorkflowRole} from './model';
import type {ChecklistProjectInfo} from './checklistProjectValues';
import {SourceDocumentChecklist} from './SourceDocumentChecklist';

export function Stage3BOperationalForms({phase,packageId,surveyTypes,role,projectInfo,pciManual=true,periodStart,periodEnd,selectedSurvey,onSurveyChange,onAnswersChanged,readOnly=false}:{phase:'consistency'|'internal'|'periodic14';packageId:string;surveyTypes:SurveyType[];role:WorkflowRole;selectedSurvey?:SurveyType;onSurveyChange?:(survey:SurveyType)=>void;projectInfo?:ChecklistProjectInfo;periodStart?:string;periodEnd?:string;pciManual?:boolean;onAnswersChanged?:()=>void;readOnly?:boolean}){
 const historical=legacyPeriodAnswers(packageId);
 const provider = role === 'Penyedia Jasa / Ketua Tim';
 const balai = role === 'PIC Balai / Pengguna Jasa';
 if (!provider && !balai) return null;
 return (
   <section className="stage3b-work" id="pemeriksaan-berkala" aria-label="Pemeriksaan berkala">
     <div className="stage3b-work-content">
       {(selectedSurvey ?? surveyTypes[0]) === 'Lendutan' && phase !== 'consistency' ? (
         <div>
           {provider && surveyTypes.length > 1 && (
             <label>Jenis survei
               <select aria-label="Jenis survei checklist sumber" value={selectedSurvey ?? surveyTypes[0]}
                 onChange={e => onSurveyChange?.(e.target.value as SurveyType)}>
                 {surveyTypes.map(type => <option key={type}>{type}</option>)}
               </select>
             </label>
           )}
           <LendutanPeriodReview scope={packageId} phase={phase} role={role} readOnly={readOnly}
             onChanged={() => onAnswersChanged?.()} />
         </div>
       ) : (
         <SourceDocumentChecklist key={`${packageId}:${phase}`} packageId={packageId}
           phase={phase} defaultSurvey={selectedSurvey} onSurveyChange={onSurveyChange}
           hideSurveySelector={balai} surveyTypes={surveyTypes} role={role}
           compactPeriodic editableRoles={readOnly ? [] : phase === 'periodic14' ? ['PIC Balai / Pengguna Jasa'] : ['Penyedia Jasa / Ketua Tim']}
           projectInfo={projectInfo ? {...projectInfo, periodStart, periodEnd} : undefined}
           pciManual={pciManual} onAnswersChanged={onAnswersChanged} />
       )}
     </div>
     {historical.length > 0 && (
       <details className="stage3b-work-history">
         <summary>Riwayat pemeriksaan ({historical.length})</summary>
         <dl>{historical.map(row => <div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
       </details>
     )}
   </section>
 );
}
