import { useCallback, useState, type ReactNode } from 'react';
import {
  Activity, Archive, ArrowRight, BadgeCheck, BookOpen, CalendarClock,
  Check, CheckCircle2, ClipboardCheck, ClipboardList, Clock3, Eye, FileCheck2, FileText,
  Gauge, HardDrive, LockKeyhole, MapPinned, Plus, RotateCcw, Save, ShieldCheck,
  Timer, TriangleAlert, Wrench
} from 'lucide-react';
import './workflow.css';
import { ProductionCalculator } from './ProductionCalculator';
import { Stage3BSourceChecklist } from './Stage3BSourceChecklist';
import { Stage3BPeriodSelector } from './Stage3BPeriodSelector';
import { WORKFLOW_ROLE_OPTIONS, WORKFLOW_ROLE_SCOPE, VALIDATION_SOURCE_OPTIONS, STAGE3_SOURCE_MODE_PRESENTATION, STAGE3_SOURCE_NOTE, STAGE3_ROLE_GUIDANCE, STAGE4_ROLE_GUIDANCE, STAGE5_ROLE_GUIDANCE, STAGE6_ROLE_GUIDANCE, AUDIT_LEVEL_PRESENTATION } from './workflowConfig';
import { ChecklistPanel, EvidenceField, GateSummary, ValidationResultTable } from './WorkflowComponents';
import { AuditReadOnlySummary } from './AuditReadOnlySummary';
import { ACCEPTANCE_CRITERIA, AcceptanceCriteriaPanel, type AcceptanceCriterion } from './AcceptanceCriteriaPanel';
import { SourceAlignmentChecklist } from './SourceAlignmentChecklist';
import { EvidenceAttachment } from './EvidenceAttachment';
import { ProductionValidationChecklist } from './ProductionValidationChecklist';
import { WorkflowNextAction } from './WorkflowNextAction';
import { StageOwnershipBanner } from './StageOwnershipBanner';
import { SURVEY_REFERENCES, PRODUCTION_REFERENCE_CHECKS, productionFields, dailyFields, dailyChecks, evaluateDailySurvey } from './surveyStandards';
import { WorkflowDocuments } from './WorkflowDocuments';
import { buildAuditSamplePlan } from './auditSamplePlan';
import { auditSampleIntegrity } from './auditSampleIntegrity';
import { RULE_SCENARIOS, RULE_CHECKS, RULE_NUMBERS, specialCorrectionErrors } from './correctionRules';
import { AUDIT_REVIEW_CHECKS, fieldReadiness, semesterTwoReadiness, canMarkFinalReport, termReadiness, correctionClosureErrors, applyClosedCorrection, dueScheduledBackup } from './flowRules';
import {
  OperationalWorkflowState, PreparationState, CalibrationRecord, ProductionTest, DailySurveyRecord,
  VervalCycle, SubmissionState, AuditLevel, AcceptanceTerm, CorrectionCase, BackupSnapshot,
  WorkflowEvent, SurveyType, WorkflowRole, ApprovalState, SURVEY_TYPES, PREPARATION_SOURCE_REVIEWS,
  PREPARATION_FIELD_PLAN, PREPARATION_COORDINATION, PREPARATION_DOCUMENTS, CYCLE_PROTOCOLS,
  CYCLE_SHARED_PROTOCOLS, SUBMISSION_DOCUMENTS, INTERNAL_AUDIT_CHECKS, CORRECTION_ACTIONS, CORRECTION_GUIDANCE,
  INITIAL_WORKFLOW, DEFAULT_SEMESTER_TWO, evaluateProductionTest, samplingRule, cycleDueDate, evaluateLrsGate, notificationsFor, daysBetween,
} from './model';

export type OperationalWorkflowWorkspaceProps = {
  selection: string;
  state: OperationalWorkflowState;
  onUpdate: (updater: (current: OperationalWorkflowState) => OperationalWorkflowState, activity: string, object: string) => void;
  setNotice: (message: string) => void;
  onNavigate: (selection:string) => void;
};

type NumericProductionKey = { [K in keyof ProductionTest]-?: NonNullable<ProductionTest[K]> extends number ? K : never }[keyof ProductionTest];
const roleOptions = WORKFLOW_ROLE_OPTIONS;
const roleScope = WORKFLOW_ROLE_SCOPE;
const labels: Partial<Record<keyof ProductionTest, string>> = {
  trialKm:'Panjang uji (km)', sections:'Jumlah seksi', sectionLengthKm:'Panjang setiap seksi (km)', repeats:'Pengulangan',
  speedTrials40:'Ulangan pada 40 km/jam', speedTrials50:'Ulangan pada 50 km/jam', speedTrialsAbove60:'Ulangan di atas 60 km/jam', coefficientA:'Koefisien A',
  coefficientB:'Koefisien B', rSquared:'RÂ²', coefficientVariation:'Koefisien variasi (%)',
  f1Before:'F1 sebelum QA', f1After:'F1 sesudah QA', meanAveragePrecision:'mAP',
  segmentsWithinFive:'Segmen selisih â‰¤5 poin (%)', segmentsAtLeastFifteen:'Segmen selisih â‰¥15 poin (%)',
  standardDeviation:'Simpangan baku', fwdLoad:'Beban FWD (kN)', locations:'Jumlah lokasi',
  trafficHours:'Durasi rekam (jam)',
  lwdCorrelationPoints:'Titik korelasi LWD terhadap FWD',lwdRepeats:'Ulangan pengukuran LWD',
  lwdDifferenceMicrons:'Selisih ulangan LWD (Âµm)',lwdDifferencePercent:'Selisih ulangan LWD (%)',
};
const equipmentOptions = ['Profilometer Laser','IRI Tipe Respon','FWD Dynatest','LWD','Kamera Survei','GPS Geodetik','GPS Navigasi','Video Log','Total Station','Traffic Counter','Formulir Survei'];
const dailyEquipment: Record<SurveyType,string[]> = {
  IRI:['Profilometer Laser','IRI Tipe Respon'], PCI:['Kamera Survei','Formulir Survei'],
  Lendutan:['FWD Dynatest','LWD'], Jembatan:['Formulir Survei','Total Station','GPS Geodetik'],
  Lereng:['GPS Navigasi','Formulir Survei'], RNI:['Video Log','Formulir Survei'],
  'Lalu Lintas':['Traffic Counter','Kamera Survei','Formulir Survei'], Drainase:['Formulir Survei','Kamera Survei'],
};
const systemsByType: Record<SurveyType,string> = { IRI:'SMD Jalan',PCI:'SMD Jalan',Lendutan:'SMD Jalan',Jembatan:'INVI-J',Lereng:'InSlope',Drainase:'InDrain','Lalu Lintas':'SMD Jalan',RNI:'SMD Jalan' };
const SYSTEM_TARGET_ORDER = ['SMD Jalan','INVI-J','InSlope','InDrain'] as const;
const testId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const idNow = (prefix: string) => `${prefix}-${Date.now().toString().slice(-7)}`;
function auditValue(value:unknown) {
  if(value===undefined)return 'â€”';
  if(Array.isArray(value))return value.length<=2?JSON.stringify(value):`${value.length} item (${value.slice(0,2).map(item=>typeof item==='object'&&item?String((item as {id?:string}).id??'rekaman'):String(item)).join(', ')}â€¦)`;
  if(value&&typeof value==='object')return `{${Object.keys(value as object).slice(0,5).join(', ')}${Object.keys(value as object).length>5?', â€¦':''}}`;
  return String(value).slice(0,100);
}
function collectAuditChanges(before:unknown,after:unknown,path=''):Array<{path:string;before:string;after:string}> {
  if(Object.is(before,after)||path==='events')return [];
  if(before&&after&&typeof before==='object'&&typeof after==='object'&&!Array.isArray(before)&&!Array.isArray(after)){
    const oldObject=before as Record<string,unknown>;
    const newObject=after as Record<string,unknown>;
    return [...new Set([...Object.keys(oldObject),...Object.keys(newObject)])]
      .flatMap(key=>collectAuditChanges(oldObject[key],newObject[key],path?`${path}.${key}`:key))
      .slice(0,6);
  }
  if(Array.isArray(before)&&Array.isArray(after)&&before.every(item=>item&&typeof item==='object')&&after.every(item=>item&&typeof item==='object')){
    const identify=(item:unknown,index:number)=>{const row=item as Record<string,unknown>;return String(row.id??row.level??row.type??index);};
    const oldRows=new Map(before.map((item,index)=>[identify(item,index),item]));
    const newRows=new Map(after.map((item,index)=>[identify(item,index),item]));
    return [...new Set([...oldRows.keys(),...newRows.keys()])].flatMap(key=>{
      if(!oldRows.has(key))return [{path:`${path}[${key}]`,before:'â€”',after:auditValue(newRows.get(key))}];
      if(!newRows.has(key))return [{path:`${path}[${key}]`,before:auditValue(oldRows.get(key)),after:'â€”'}];
      return collectAuditChanges(oldRows.get(key),newRows.get(key),`${path}[${key}]`);
    }).slice(0,6);
  }
  return [{path:path||'workflow',before:auditValue(before),after:auditValue(after)}];
}
const defaultDaily = (date='2027-06-10',road='Medan â€“ Binjai',surveyType:SurveyType='IRI'): Omit<DailySurveyRecord,'id'> => ({
  date,time:'08:00',surveyType,road,lengthKm:0,trafficDurationMinutes:0,lane:'Lajur 1',direction:'Normal',weather:'Cerah',
   surfaceDry:true,glareFree:true,speedAndLaneCompliant:true,tool:dailyEquipment[surveyType][0],operator:'D. Prasetyo',
  driver:'B. Santoso',poi:'',disturbances:'',eventNotes:'',dailyToolCheck:{'Bounce test':false,'GPS':false,'Baterai':false,'Penyimpanan':false},
   rawValue:'',cleanedValue:'',cleaningReason:'',state:'Tercatat',technicalData:{},
});
const defaultCase = (state: OperationalWorkflowState): CorrectionCase => ({
  id:idNow('KOR'),source:'Validasi produksi',blockedStage:'Validasi produksi',road:state.project.routes[0]||'',
  stationing:'STA 0+000 â€“ 0+100',rejectionReason:'',severity:'Mayor',owner:'PIC survei',dueDate:state.simulationDate,
  rootCause:'',fieldDataValid:'',surveyType:'IRI',actionType:'',evidence:'',proposedValue:'',
  approval:'Draft',retest:'Belum Diuji',status:'Terbuka',returnStage:'Validasi produksi',
  originalValue:state.dailyRecords.find(record=>record.surveyType==='IRI'&&record.road===(state.project.routes[0]||''))?.rawValue||'Belum ada nilai raw tertaut',
  linkedRecordId:state.dailyRecords.find(record=>record.surveyType==='IRI'&&record.road===(state.project.routes[0]||''))?.id,
  verification:{surveyor:false,teamLeader:false,balai:false}, reviewNote:'',
});
const invalidateTerm1=(acceptance:OperationalWorkflowState['acceptance'])=>({
  ...acceptance,
  terms:acceptance.terms.map(term=>term.id==='T1'?{...term,complete:false}:term),
  finalReport:false,
  finalAcceptance:false,
});
const resetAuditLevels=():OperationalWorkflowState['audits']=>[
  {...INITIAL_WORKFLOW.audits[0],sampleIds:[]},
  {...INITIAL_WORKFLOW.audits[1],sampleIds:[]},
  {...INITIAL_WORKFLOW.audits[2],sampleIds:[]},
];
const invalidateDependentStages=(state:OperationalWorkflowState,reason:string):OperationalWorkflowState=>({
  ...state,
  productionApproval:'Draft',
  productionApprovalBa:'',
  bridgeInspectionPermit:false,
  submission:{...state.submission,validationStatus:'Draft',validationMessage:reason},
  audits:resetAuditLevels(),
  acceptance:{
    ...state.acceptance,
    terms:state.acceptance.terms.map(term=>term.id==='T1'||term.id==='T3'||term.id==='T4'?{...term,complete:false}:term),
    semesterTwoRevalidation:false,
    finalReport:false,
    finalAcceptance:false,
  },
});
const invalidateVervalStages=(state:OperationalWorkflowState,reason:string):OperationalWorkflowState=>({
  ...state,
  submission:{...state.submission,validationStatus:'Draft',validationMessage:reason},
  audits:resetAuditLevels(),
  acceptance:{
    ...state.acceptance,
    terms:state.acceptance.terms.map(term=>term.id==='T2'||term.id==='T3'||term.id==='T4'?{...term,complete:false}:term),
    semesterTwoRevalidation:false,
    finalReport:false,
    finalAcceptance:false,
  },
});
function Badge({ children, tone='info' }: {children: ReactNode; tone?:'good'|'warn'|'bad'|'info'}) { return <span className={`wf-status ${tone}`}>{children}</span>; }
function Panel({ title, icon: Icon=Activity, extra, children }: {title:string;icon?:any;extra?:any;children:any}) {
  return <section className="wf-panel"><div className="wf-panel-head"><h3><Icon size={14}/>{title}</h3>{extra}</div><div className="wf-body">{children}</div></section>;
}
function Field({ label, children, full=false }: {label:string;children:any;full?:boolean}) { return <div className={`wf-field ${full?'full':''}`}><label>{label}</label>{children}</div>; }
function Button({ children, onClick, kind='', disabled=false, id }: {children:any;onClick:()=>void;kind?:string;disabled?:boolean;id:string}) { return <button type="button" data-testid={id} className={`wf-button ${kind}`} disabled={disabled} onClick={onClick}>{children}</button>; }
function CheckRow({label,checked,onChange,id,detail,disabled=false}:{label:string;checked:boolean;onChange:(v:boolean)=>void;id:string;detail?:string;disabled?:boolean}) {
  return <label className="wf-row wf-check" data-testid={`row-${id}`}><input type="checkbox" data-testid={`check-${id}`} checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/><span>{label}{detail&&<span className="wf-note" style={{display:'block'}}>{detail}</span>}</span></label>;
}
function Select({value,onChange,options,id,disabled=false}:{value:string;onChange:(v:string)=>void;options:string[];id:string;disabled?:boolean}) {
  return <select value={value} data-testid={id} disabled={disabled} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;
}

export function OperationalWorkflowWorkspace({selection,state,onUpdate,setNotice,onNavigate}:OperationalWorkflowWorkspaceProps) {
  const recognized = [
    '/entry:Persiapan & SPMK','/documents:Kalibrasi & personel','/entry:Validasi produksi','/entry:Survei harian',
    '/verification:Verval 14 hari','/entry:Gerbang RNI/LRS','/verification:Audit tingkat 1â€“3',
    '/reports:Penerimaan & termin','/actions:Koreksi berbukti','/notifications:Pengingat & eskalasi',
    '/audit:Peran & backup','/reports:Matriks cakupan diagram',
    '/documents:BA & dokumen workflow',
  ];
  const goToBA = (kind: 'kalibrasi'|'konsistensi'|'internal'|'duaMingguan'|'bertahap'|'audit'|'penerimaan', period=0) => {
    try { localStorage.setItem('jala-ba-navigation-v2', JSON.stringify({packageId:state.project.id,kind,period})); } catch {}
    try { localStorage.setItem('jala-ba-return-to',selection); } catch {}
    onNavigate('/documents:BA & dokumen workflow');
  };
  const baAccess = (kind: 'kalibrasi'|'konsistensi'|'internal'|'duaMingguan'|'bertahap'|'audit'|'penerimaan', label:string, period=0) =>
    <button type="button" className="wf-button" onClick={()=>goToBA(kind,period)}><FileText size={14}/>{label}</button>;
  const [draft,setDraft] = useState<Record<string,string>>({});
  const [prodType,setProdType] = useState<SurveyType>('IRI');
  const [daily,setDaily] = useState(()=>defaultDaily(state.simulationDate,state.project.routes[0]||'',state.project.surveyTypes[0]||'IRI'));
  const [dailySource,setDailySource] = useState<(typeof VALIDATION_SOURCE_OPTIONS)[number]>('Sinkronisasi sistem sumber');
  const [dailyTool,setDailyTool] = useState<Record<string,boolean>>({});
  const [newCalibration,setNewCalibration] = useState<Partial<CalibrationRecord>>({});
  const [calEditId,setCalEditId] = useState('');
  const [calibrationSurvey,setCalibrationSurvey] = useState<SurveyType>(
    state.project.surveyTypes[0] || 'IRI'
  );
  const [calFormOpen,setCalFormOpen] = useState(false);
  const [calFormRecordId,setCalFormRecordId] = useState('');
  const [newCase,setNewCase] = useState<CorrectionCase>(()=>defaultCase(state));
  const [caseId,setCaseId] = useState('');
  const [auditLevel,setAuditLevel] = useState<1|2|3>(1);
  const [
  stage3BCompletion,
  setStage3BCompletion,
] = useState({
  consistency: false,
  internal: false,
  periodic14: false,
});
  const [activeStage3BPeriod,setActiveStage3BPeriod] = useState(1);
  const [stage3bPeriodRange,setStage3BPeriodRange] = useState<{start:string;end:string}>({start:'',end:''});
  const [stage3BStatus,setStage3BStatus] = useState<Record<string,boolean>>({});
  const onStage3BCompletion = useCallback((phase:'consistency'|'internal'|'periodic14',complete:boolean) => {
    setStage3BCompletion(current => current[phase] === complete ? current : {...current,[phase]:complete});
  }, []);
  const [auditId,setAuditId] = useState('');
  const [backupMedia,setBackupMedia] = useState<string[]>(['Perangkat kerja']);
  const [acceptDraft,setAcceptDraft] = useState<Record<string,string>>({});
  const test = state.productionTests[prodType];
  const evaluation = evaluateProductionTest(prodType,test);
  const lrs = evaluateLrsGate(state.submission,state.simulationDate);
  const selectedCycleTypes = state.cycle.selectedTypes;
  const dueCycle = cycleDueDate(state.cycle.lastCompletedDate);
  const evaluateCycleConsistency=(types:SurveyType[],iriCv:number|null,pciSd:number|null,reRating:VervalCycle['reRatingStatus']):VervalCycle['consistency']=>{
    if(!types.length)return 'Belum Diperiksa';
    const iriPass=!types.includes('IRI')||iriCv!==null&&Number.isFinite(iriCv)&&iriCv>=0&&iriCv<=5;
    const pciPass=!types.includes('PCI')||pciSd!==null&&Number.isFinite(pciSd)&&pciSd>=0&&pciSd<=8;
    if(types.includes('IRI')&&iriCv!==null&&iriCv>5||types.includes('PCI')&&pciSd!==null&&pciSd>8||reRating==='Tidak Sesuai')return 'Tidak Konsisten';
    if(reRating==='Belum Diperiksa'||types.includes('IRI')&&iriCv===null||types.includes('PCI')&&pciSd===null)return 'Belum Diperiksa';
    return iriPass&&pciPass&&reRating==='Sesuai'?'Konsisten':'Tidak Konsisten';
  };
  const deadlineRows = notificationsFor(state);
  const selectedCase = state.corrections.find(c=>c.id===caseId) || state.corrections[0];
  const commit = (activity:string, object:string, updater:(current:OperationalWorkflowState)=>OperationalWorkflowState, notice?:string) => {
    const eventId=idNow('EVT');
    onUpdate(current=>{
      const next=updater(current);
      const changes=collectAuditChanges(current,next);
      const event:WorkflowEvent={
        id:eventId,date:current.simulationDate,actor:current.role,action:activity,object,
        oldValue:changes.map(change=>`${change.path}: ${change.before}`).join(' Â· ').slice(0,600)||'Tidak ada perubahan nilai',
        newValue:changes.map(change=>`${change.path}: ${change.after}`).join(' Â· ').slice(0,600)||'Tidak ada perubahan nilai',
      };
      return {...next,events:[event,...next.events]};
    },activity,object);
    if(notice) setNotice(notice);
  };
  const setPreparation = (updater:(p:PreparationState)=>PreparationState, activity:string, object:string, notice?:string) =>
    commit(activity,object,s=>{
      const preparation=updater(s.project.preparation);
      const invalidateMethod=preparation.reportApproval==='Perlu Revisi'||preparation.reportApproval==='Ditolak';
      const next={...s,project:{...s.project,preparation}};
      return invalidateMethod?invalidateDependentStages(next,'Laporan pendahuluan perlu revisi; validasi dan audit harus diulang.'):next;
    },notice);
  const updateCycle = (patch:Partial<VervalCycle>, activity:string) =>
    commit(activity,state.project.packageName,s=>{
      const changed=Object.entries(patch).some(([key,value])=>!Object.is(s.cycle[key as keyof VervalCycle],value));
      if(!changed)return s;
      const next=invalidateVervalStages(s,'Data atau protokol verval berubah; validasi dan audit perlu diulang.');
      const changesTest=['selectedTypes','checkedProtocols','iriCoefficientVariation','pciAiStandardDeviation','reRatingStatus'].some(key=>key in patch);
      return {...next,cycle:{...s.cycle,...patch,...(changesTest?{userReview:'Belum Diperiksa' as const,bridgeFieldValidation:false,finalPeriodValidation:false}:{}),...(!('certificateId' in patch)&&changesTest?{certificateId:''}:{})}};
    });
  const updateSubmission = (patch:Partial<SubmissionState>, activity:string) =>
    commit(activity,state.project.packageName,s=>{
      const submission={...s.submission,...patch};
      if(!('validationStatus' in patch))submission.validationStatus='Draft';
      const changedInput=Object.keys(patch).some(key=>key!=='validationStatus'&&key!=='validationMessage');
      const invalidatesDownstream=(changedInput||patch.validationStatus==='Draft')&&(s.submission.validationStatus==='VALID'||s.audits.some(audit=>audit.status!=='Belum Dimulai'));
      if(!invalidatesDownstream)return {...s,submission};
      submission.validationStatus='Draft';
      submission.validationMessage='Bukti penyerahan berubah; validasi dan audit perlu diulang.';
      return {
        ...s,
        submission,
        audits:[
          {...INITIAL_WORKFLOW.audits[0],sampleIds:[]},
          {...INITIAL_WORKFLOW.audits[1],sampleIds:[]},
          {...INITIAL_WORKFLOW.audits[2],sampleIds:[]},
        ] as OperationalWorkflowState['audits'],
        acceptance:{
          ...s.acceptance,
          terms:s.acceptance.terms.map(term=>term.id==='T3'||term.id==='T4'?{...term,complete:false}:term),
          semesterTwoRevalidation:false,
          finalReport:false,
          finalAcceptance:false,
        },
      };
    });
  const setCheck = (group:'sourceReviews'|'fieldPlan'|'coordination'|'documents',key:string,value:boolean) =>
    commit('Perbarui checklist persiapan',key,s=>{
      const invalidated=invalidateDependentStages(s,'Checklist persiapan berubah; validasi dan audit harus diulang.');
      return {...invalidated,project:{...invalidated.project,preparation:{...s.project.preparation,[group]:{...s.project.preparation[group],[key]:value},reportApproval:'Draft'}}};
    });
  const saveText = (key:string,value:string) => setDraft(old=>({...old,[key]:value}));
  const heading = (eyebrow:string,title:string,detail:string,tag='WORKSPACE PAKET') =>
    <div className="wf-head"><div><div className="wf-eyebrow">{eyebrow} Â· QA/QC JALAN 2027</div><h1 className="wf-title">{title}</h1><div className="wf-subtitle">{detail}</div></div><span className="wf-badge"><span aria-hidden="true">â—</span>{tag}</span></div>;

  const toggleMap = (map:Record<string,boolean>,key:string,on:boolean,fn:(next:Record<string,boolean>)=>void) => fn({...map,[key]:on});
  const renderChecklist = (title:string,icon:any,items:string[],checked:Record<string,boolean>,onToggle:(key:string,on:boolean)=>void,disabled=false) =>
    <ChecklistPanel
      title={title}
      icon={icon}
      items={items.map(item=>({id:`${testId(title)}-${testId(item)}`,label:item,checked:!!checked[item],disabled}))}
      onChange={(id,value)=>{const item=items.find(candidate=>`${testId(title)}-${testId(candidate)}`===id);if(item)onToggle(item,value);}}
    />;

  const preparationScreen = () => {
    const prep=state.project.preparation;
    const canPrepareInput=state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin';
    const canReviewPreparation=state.role==='PIC Balai / Pengguna Jasa'||state.role==='Admin';
    const allItems=[...PREPARATION_SOURCE_REVIEWS.map(x=>prep.sourceReviews[x]),...PREPARATION_FIELD_PLAN.map(x=>prep.fieldPlan[x]),...PREPARATION_COORDINATION.map(x=>prep.coordination[x]),...PREPARATION_DOCUMENTS.map(x=>prep.documents[x])];
    const complete=allItems.filter(Boolean).length;
    const approve = (status:ApprovalState) => {
      if(status==='Diajukan'&&(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin')){setNotice('Peran Penyedia Jasa / Ketua Tim diperlukan untuk mengajukan laporan.');return;}
      if(status!=='Diajukan'&&(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin')){setNotice('Peran PIC Balai / Pengguna Jasa diperlukan untuk meninjau laporan.');return;}
      if(status!=='Diajukan'&&prep.reportApproval!=='Diajukan'){setNotice('Ajukan laporan terlebih dahulu sebelum revisi atau persetujuan.');return;}
      if(status==='Diajukan'&&complete!==allItems.length){setNotice('Checklist persiapan belum lengkap.');return;}
      setPreparation(p=>({...p,reportApproval:status,reviewerNote:draft.reviewerNote??p.reviewerNote}),`Status laporan pendahuluan: ${status}`,state.project.packageName,`Status persiapan menjadi ${status}`);
    };
    const savePackage=()=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa diperlukan untuk mengubah ruang lingkup paket.');return;}
      const packageName=draft.packageName??state.project.packageName;
      const spmkDate=draft.spmkDate??state.project.spmkDate;
      const contractor=draft.contractor??state.project.contractor;
      const satker=draft.satker??state.project.satker;
      const ppk=draft.ppk??state.project.ppk;
      const balai=draft.balai??state.project.balai;
      const semester=(draft.semester as 'Semester I'|'Semester II')??state.project.semester;
      const surveyTypes=(draft.types??state.project.surveyTypes.join('|')).split('|').filter(Boolean) as SurveyType[];
      const routes=(draft.routes??state.project.routes.join(', ')).split(',').map(route=>route.trim()).filter(Boolean);
      if(!surveyTypes.length||!routes.length){setNotice('Paket memerlukan minimal satu jenis survei dan satu ruas.');return;}
      const packageChanged=packageName!==state.project.packageName||spmkDate!==state.project.spmkDate||contractor!==state.project.contractor||satker!==state.project.satker||ppk!==state.project.ppk||balai!==state.project.balai||semester!==state.project.semester||routes.join('|')!==state.project.routes.join('|')||surveyTypes.join('|')!==state.project.surveyTypes.join('|');
      const scopeChanged=routes.join('|')!==state.project.routes.join('|')||surveyTypes.join('|')!==state.project.surveyTypes.join('|');
      // Perubahan administratif tidak membatalkan pemeriksaan teknis. Perubahan lingkup harus ditinjau ulang.
      commit('Simpan konfigurasi paket',state.project.id,s=>{
        const allowedProtocolKeys=new Set(surveyTypes.flatMap(type=>CYCLE_PROTOCOLS[type].map(protocol=>`${type} Â· ${protocol}`)));
        const checkedProtocols=Object.fromEntries(Object.entries(s.cycle.checkedProtocols).filter(([key])=>CYCLE_SHARED_PROTOCOLS.includes(key)||allowedProtocolKeys.has(key)));
        const cycle=scopeChanged?{
          ...s.cycle,
          selectedTypes:s.cycle.selectedTypes.filter(type=>surveyTypes.includes(type)),
          checkedProtocols:Object.fromEntries([
            ...surveyTypes.flatMap(type=>CYCLE_PROTOCOLS[type].map(protocol=>[`${type} Â· ${protocol}`,false])),
            ...CYCLE_SHARED_PROTOCOLS.map(protocol=>[protocol,false]),
          ]),
          iriCoefficientVariation:null,
          pciAiStandardDeviation:null,
          reRatingStatus:'Belum Diperiksa' as const,
          consistency:'Belum Diperiksa' as const,
          bridgeFieldValidation:false,
          finalPeriodValidation:false,
          certificateId:'',
        }:{...s.cycle,selectedTypes:s.cycle.selectedTypes.filter(type=>surveyTypes.includes(type)),checkedProtocols};
        return {
          ...s,
          project:{
            ...s.project,
            packageName,spmkDate,contractor,satker,ppk,balai,semester,
            routes,surveyTypes,
            preparation:{...s.project.preparation,reportApproval:scopeChanged?'Draft':s.project.preparation.reportApproval},
          },
          cycle,
          calibrationChecklist:scopeChanged?{...s.calibrationChecklist,...Object.fromEntries(surveyTypes.map(type=>[type,false]))} as Record<SurveyType,boolean>:s.calibrationChecklist,
          productionApproval:scopeChanged?'Draft':s.productionApproval,
          productionApprovalBa:scopeChanged?'':s.productionApprovalBa,
          bridgeInspectionPermit:scopeChanged?false:s.bridgeInspectionPermit,
          submission:scopeChanged?{...s.submission,validationStatus:'Draft',validationMessage:'Ruang lingkup paket berubah; jalankan ulang validasi dan audit.'}:s.submission,
          audits:scopeChanged?resetAuditLevels():s.audits,
          acceptance:scopeChanged?{...s.acceptance,terms:s.acceptance.terms.map(term=>({...term,complete:false})),semesterTwoRevalidation:false,finalReport:false,finalAcceptance:false}:s.acceptance,
        };
      },scopeChanged?'Lingkup teknis berubah; pemeriksaan dan keputusan terkait perlu diulang.':packageChanged?'Identitas paket diperbarui tanpa menghapus persetujuan teknis.':'Ruang lingkup paket tersimpan tanpa perubahan');
      setDaily(current=>({...current,road:routes.includes(current.road)?current.road:routes[0],surveyType:surveyTypes.includes(current.surveyType)?current.surveyType:surveyTypes[0],tool:!surveyTypes.includes(current.surveyType)&&surveyTypes[0]==='Lalu Lintas'?'Traffic Counter':current.tool}));
    };
    return <>{heading(
  'Tahap 0 Â· persiapan',
  'Survei pendahuluan & persiapan QA/QC',
  'Lengkapi telaah awal, rencana survei, koordinasi, dan dokumen pendahuluan sebelum paket masuk ke kalibrasi dan validasi awal.'
)}
  <div className="workflow-data-origin">
    <span className="origin-badge contract">DATA PAKET</span>
    <div>
      <strong>Informasi paket kontrak</strong>
      <span>Identitas, ruas, dan lingkup survei mengikuti data paket. Penyedia tidak mengubah ruang lingkup kontrak dari halaman ini.</span>
    </div>
  </div>

  <div className="wf-banner">
    <div>
      <strong>{state.project.packageName}</strong><br/>
      <span>{state.project.id} Â· {state.project.balai} Â· SPMK {state.project.spmkDate}</span>
    </div>
    <Badge tone={prep.reportApproval==='Disetujui'?'good':prep.reportApproval==='Ditolak'?'bad':'warn'}>
      {prep.reportApproval}
    </Badge>
  </div>

  <GateSummary title="Kesiapan menuju Kalibrasi & Validasi Awal" items={[
    {
      label:'Checklist survei pendahuluan lengkap',
      ready:complete===allItems.length,
      detail:`${complete}/${allItems.length} item`
    },
    {
      label:'Review PIC Balai selesai',
      ready:prep.reportApproval==='Disetujui',
      detail:prep.reportApproval
    },
  ]}/>

  <Panel title="Informasi Paket" icon={FileText}>
    <div className="package-readonly-grid">
      <div><small>Nama paket</small><strong>{state.project.packageName}</strong></div>
      <div><small>SPMK</small><strong>{state.project.spmkDate}</strong></div>
      <div><small>Penyedia jasa</small><strong>{state.project.contractor}</strong></div>
      <div><small>Balai</small><strong>{state.project.balai}</strong></div>
      <div><small>Satker</small><strong>{state.project.satker}</strong></div>
      <div><small>PPK</small><strong>{state.project.ppk}</strong></div>
      <div className="wide"><small>Ruas</small><strong>{state.project.routes.join(', ')}</strong></div>
      <div className="wide">
        <small>Lingkup survei</small>
        <div className="package-scope" style={{marginTop:5}}>
          {state.project.surveyTypes.map(type=><span key={type}>{type}</span>)}
        </div>
      </div>
    </div>
  </Panel>

  {state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin' ? (
    <div className="workflow-role-block provider">
      <div className="workflow-data-origin">
        <span className="origin-badge provider">INPUT PENYEDIA</span>
        <div>
          <strong>Kelengkapan persiapan</strong>
          <span>Lengkapi kegiatan dan dokumen yang menjadi tanggung jawab Penyedia sebelum diajukan ke PIC Balai.</span>
        </div>
      </div>

      <Panel
  title="Dokumen & Bukti Persiapan"
  icon={FileText}
>
  <div className="evidence-grid">

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-laporan-pendahuluan"
      label="Laporan Pendahuluan"
      editable={canPrepareInput}
      required
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-program-mutu"
      label="Program Mutu / Quality Management Plan"
      editable={canPrepareInput}
      required
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-rmpk"
      label="RMPK"
      editable={canPrepareInput}
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-rkk"
      label="RKK"
      editable={canPrepareInput}
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-rmllp"
      label="RMLLP"
      editable={canPrepareInput}
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-koordinasi"
      label="Bukti Koordinasi"
      editable={canPrepareInput}
    />

  </div>
</Panel>

<div className="wf-grid equal">
        {renderChecklist(
          'Telaah data awal',
          BookOpen,
          PREPARATION_SOURCE_REVIEWS,
          prep.sourceReviews,
          (k,v)=>setCheck('sourceReviews',k,v),
          !canPrepareInput
        )}

        {renderChecklist(
          'Rencana survei lapangan',
          MapPinned,
          PREPARATION_FIELD_PLAN,
          prep.fieldPlan,
          (k,v)=>setCheck('fieldPlan',k,v),
          !canPrepareInput
        )}

        {renderChecklist(
          'Koordinasi & uji kesiapan',
          Activity,
          PREPARATION_COORDINATION,
          prep.coordination,
          (k,v)=>setCheck('coordination',k,v),
          !canPrepareInput
        )}

        {renderChecklist(
          'Dokumen pendahuluan',
          FileCheck2,
          PREPARATION_DOCUMENTS,
          prep.documents,
          (k,v)=>setCheck('documents',k,v),
          !canPrepareInput
        )}
      </div>

      <Panel title="Pengajuan ke PIC Balai" icon={ArrowRight}>
        <div className="workflow-action-copy">
          <strong>{complete===allItems.length?'Persiapan lengkap dan siap diajukan':'Persiapan belum lengkap'}</strong>
          <span>
            {complete===allItems.length
              ? 'Setelah diajukan, isian Penyedia menjadi bahan review PIC Balai.'
              : `Masih ada ${allItems.length-complete} item yang perlu dilengkapi.`}
          </span>
        </div>

        {prep.reportApproval==='Perlu Revisi'&&prep.reviewerNote&&(
          <div className="review-note important">
            <small>CATATAN PIC BALAI</small>
            <strong>Perlu perbaikan</strong>
            <p>{prep.reviewerNote}</p>
          </div>
        )}

        <div className="wf-toolbar" style={{marginTop:12}}>
          <Button
            id="button-prep-submit"
            kind="primary"
            disabled={
              complete!==allItems.length ||
              prep.reportApproval==='Diajukan'
            }
            onClick={()=>approve('Diajukan')}
          >
            <ArrowRight size={13}/>
            {prep.reportApproval==='Diajukan'?'Menunggu Review':'Ajukan untuk Review'}
          </Button>
        </div>
      </Panel>
    </div>
  ) : (
    <div className="workflow-role-block reviewer">
      <div className="workflow-data-origin">
        <span className="origin-badge reviewer">REVIEW PIC BALAI</span>
        <div>
          <strong>Pemeriksaan pengajuan Penyedia</strong>
          <span>Data dan checklist Penyedia ditampilkan read-only. PIC Balai memberi catatan dan keputusan review.</span>
        </div>
      </div>

      <Panel
        title="Review Persiapan"
        icon={ClipboardCheck}
        extra={
          <Badge tone={prep.reportApproval==='Disetujui'?'good':prep.reportApproval==='Perlu Revisi'?'bad':'warn'}>
            {prep.reportApproval}
          </Badge>
        }
      >
        <div className="wf-kpis">
          <div className="wf-kpi">
            <div className="wf-kpi-label">Kelengkapan Penyedia</div>
            <div className="wf-kpi-value">{complete}/{allItems.length}</div>
          </div>
          <div className="wf-kpi">
            <div className="wf-kpi-label">Status</div>
            <div className="wf-kpi-value" style={{fontSize:13}}>{prep.reportApproval}</div>
          </div>
        </div>

        <Field label="Catatan PIC Balai" full>
          <textarea
            data-testid="input-prep-review-note"
            disabled={!canReviewPreparation}
            value={draft.reviewerNote??prep.reviewerNote}
            onChange={e=>saveText('reviewerNote',e.target.value)}
            placeholder="Tuliskan catatan, klarifikasi, atau alasan perbaikan."
          />
        </Field>

        {prep.reviewerNote&&(
          <div className="review-note">
            <small>CATATAN REVIEW</small>
            <p>{prep.reviewerNote}</p>
          </div>
        )}

        <div className="wf-toolbar" style={{marginTop:12}}>
          <Button
            id="button-prep-revise"
            kind="danger"
            disabled={prep.reportApproval!=='Diajukan'}
            onClick={()=>approve('Perlu Revisi')}
          >
            Minta Perbaikan
          </Button>

          <Button
            id="button-prep-approve"
            disabled={
              complete!==allItems.length ||
              prep.reportApproval!=='Diajukan'
            }
            onClick={()=>approve('Disetujui')}
          >
            <Check size={13}/>
            Setujui Persiapan
          </Button>
        </div>
      </Panel>

      <Panel
  title="Dokumen & Bukti Persiapan"
  icon={FileText}
>
  <div className="evidence-grid">

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-laporan-pendahuluan"
      label="Laporan Pendahuluan"
      editable={canPrepareInput}
      required
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-program-mutu"
      label="Program Mutu / Quality Management Plan"
      editable={canPrepareInput}
      required
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-rmpk"
      label="RMPK"
      editable={canPrepareInput}
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-rkk"
      label="RKK"
      editable={canPrepareInput}
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-rmllp"
      label="RMLLP"
      editable={canPrepareInput}
    />

    <EvidenceAttachment
      packageId={state.project.id}
      evidenceId="stage0-koordinasi"
      label="Bukti Koordinasi"
      editable={canPrepareInput}
    />

  </div>
</Panel>

<div className="wf-grid equal">
        {renderChecklist(
          'Telaah data awal',
          BookOpen,
          PREPARATION_SOURCE_REVIEWS,
          prep.sourceReviews,
          ()=>{},
          true
        )}

        {renderChecklist(
          'Rencana survei lapangan',
          MapPinned,
          PREPARATION_FIELD_PLAN,
          prep.fieldPlan,
          ()=>{},
          true
        )}

        {renderChecklist(
          'Koordinasi & uji kesiapan',
          Activity,
          PREPARATION_COORDINATION,
          prep.coordination,
          ()=>{},
          true
        )}

        {renderChecklist(
          'Dokumen pendahuluan',
          FileCheck2,
          PREPARATION_DOCUMENTS,
          prep.documents,
          ()=>{},
          true
        )}
      </div>
    </div>
  )}
</>;
  };

    const calibrationScreen = () => {
    /*
     * Tahap 1:
     * - Penyedia melengkapi penugasan alat/personel dan bukti.
     * - Checklist mengikuti lampiran Kalibrasi & Validasi.
     * - Kesiapan dihitung sistem.
     * - PIC Balai / Direktorat membaca secara read-only.
     *
     * Tidak ada approval Balai khusus di Tahap 1.
     */

    const canEditCalibration =
      state.role === 'Penyedia Jasa / Ketua Tim';

    const scopedSurveyTypes =
      state.project.surveyTypes;

    const activeSurvey =
      scopedSurveyTypes.includes(calibrationSurvey)
        ? calibrationSurvey
        : scopedSurveyTypes[0] || 'IRI';

    const equipmentForSurvey =
      dailyEquipment[activeSurvey] || [];

    const surveyRecords =
      state.calibrations.filter(
        record =>
          record.surveyType === activeSurvey
      );

    const isCalibrationRecordReady = (
      record: CalibrationRecord
    ) =>
      record.condition === 'Baik' &&
      daysBetween(
        state.simulationDate,
        record.dueDate
      ) >= 0 &&
      record.qualificationValid &&
      record.trainingVerified;

    const isSurveyReady = (
      type: SurveyType
    ) => {
      const records =
        state.calibrations.filter(
          record =>
            record.surveyType === type
        );

      return (
        records.length > 0 &&
        records.every(
          isCalibrationRecordReady
        ) &&
        !!state.calibrationChecklist[type]
      );
    };

    const readySurveyCount =
      scopedSurveyTypes.filter(
        isSurveyReady
      ).length;

    const allSurveyReady =
      scopedSurveyTypes.length > 0 &&
      readySurveyCount ===
        scopedSurveyTypes.length;

    const setTypeCheck = (
      type: SurveyType,
      value: boolean
    ) => {
      if (!canEditCalibration) return;

      commit(
        `Checklist kalibrasi & validasi ${type}`,
        type,
        s => ({
          ...invalidateDependentStages(
            s,
            `Checklist kalibrasi ${type} berubah; validasi dan audit harus diperiksa kembali.`
          ),
          calibrationChecklist: {
            ...s.calibrationChecklist,
            [type]: value,
          },
        }),
      );
    };

    const beginAddCalibration = () => {
      if (!canEditCalibration) return;

      const id = idNow('CAL');

      setCalEditId('');
      setCalFormRecordId(id);

      setNewCalibration({
        id,
        surveyType: activeSurvey,
        equipment:
          equipmentForSurvey[0] || '',
        condition: 'Baik',
        calibrationKind:
          'Referensi tahunan',
        lastCalibrated:
          state.simulationDate,
        dueDate:
          state.simulationDate,
        qualificationValid: false,
        trainingVerified: false,
      });

      setCalFormOpen(true);
    };

    const beginEditCalibration = (
      record: CalibrationRecord
    ) => {
      if (!canEditCalibration) return;

      setCalibrationSurvey(
        record.surveyType ||
          activeSurvey
      );

      setCalEditId(record.id);
      setCalFormRecordId(record.id);
      setNewCalibration({
        ...record,
      });

      setCalFormOpen(true);
    };

    const cancelCalibrationForm = () => {
      setCalFormOpen(false);
      setCalEditId('');
      setCalFormRecordId('');
      setNewCalibration({});
    };

    const addCalibration = () => {
      if (!canEditCalibration) {
        setNotice(
          'Hanya Penyedia Jasa / Ketua Tim yang dapat mengubah penugasan alat dan personel.'
        );
        return;
      }

      const surveyType =
        newCalibration.surveyType ||
        activeSurvey;

      if (
        !newCalibration.equipment?.trim() ||
        !newCalibration.serialNumber?.trim() ||
        !newCalibration.personInCharge?.trim() ||
        !newCalibration.dueDate?.trim()
      ) {
        setNotice(
          'Jenis survei, alat, nomor seri, PIC/personel, dan masa berlaku wajib dilengkapi.'
        );
        return;
      }

      if (
        !newCalibration.standardReference?.trim()
      ) {
        setNotice(
          'Metode atau standar kalibrasi/validasi wajib dicatat.'
        );
        return;
      }

      const lastCalibrated =
        newCalibration.lastCalibrated ||
        state.simulationDate;

      const dueDate =
        newCalibration.dueDate ||
        state.simulationDate;

      if (dueDate < lastCalibrated) {
        setNotice(
          'Tanggal berlaku tidak boleh lebih awal dari tanggal kalibrasi.'
        );
        return;
      }

      const recordId =
        calFormRecordId ||
        calEditId ||
        idNow('CAL');

      const rec: CalibrationRecord = {
        id: recordId,
        equipment:
          newCalibration.equipment,
        serialNumber:
          newCalibration.serialNumber,
        year:
          Number(
            newCalibration.year
          ) ||
          new Date(
            state.simulationDate
          ).getFullYear(),
        condition:
          newCalibration.condition ||
          'Baik',
        calibrationKind:
          newCalibration.calibrationKind ||
          'Referensi tahunan',
        lastCalibrated,
        dueDate,
        personInCharge:
          newCalibration.personInCharge,
        qualificationValid:
          !!newCalibration.qualificationValid,
        trainingVerified:
          !!newCalibration.trainingVerified,
        standardReference:
          newCalibration.standardReference ||
          '',
        certificateReference:
          newCalibration.certificateReference ||
          '',
        surveyType,
      };

      commit(
        calEditId
          ? 'Perbarui penugasan alat & personel'
          : 'Tambah penugasan alat & personel',
        `${surveyType} Â· ${rec.equipment}`,
        s => ({
          ...invalidateDependentStages(
            s,
            'Data alat/personel berubah; kesiapan dan validasi produksi perlu diperiksa kembali.'
          ),

          calibrations:
            calEditId
              ? s.calibrations.map(
                  item =>
                    item.id === calEditId
                      ? rec
                      : item
                )
              : [
                  ...s.calibrations,
                  rec,
                ],
        }),
        calEditId
          ? 'Penugasan alat/personel diperbarui.'
          : 'Penugasan alat/personel ditambahkan.',
      );

      setCalibrationSurvey(
        surveyType
      );

      cancelCalibrationForm();
    };

    const changeSurvey = (
      type: SurveyType
    ) => {
      setCalibrationSurvey(type);
      setCalFormOpen(false);
      setCalEditId('');
      setCalFormRecordId('');
      setNewCalibration({});
    };

    return (
      <>
        {heading(
          'Tahap 1 Â· kesiapan',
          'Kalibrasi & Validasi Awal',
          'Pastikan alat, personel, kalibrasi/validasi, kualifikasi dan bukti pendukung siap sebelum uji coba produksi.'
        )}
        <div className="workflow-data-origin">
          <span className="origin-badge provider">
            PENYEDIA
          </span>

          <div>
            <strong>
              Penugasan alat, personel dan bukti kesiapan
            </strong>

            <span>
              Penyedia melengkapi data yang digunakan pada paket. PIC Balai dan Direktorat membacanya secara read-only.
            </span>
          </div>
        </div>


        {/* ================================================
            JENIS SURVEI
            ================================================ */}

      <Panel
          title="Jenis Survei"
          icon={ClipboardCheck}
        >
          <div className="calibration-survey-tabs">
            {scopedSurveyTypes.map(type => (
              <button
                type="button"
                key={type}
                className={`wf-button ${
                  activeSurvey === type
                    ? 'primary'
                    : ''
                }`}
                onClick={() =>
                  changeSurvey(type)
                }
              >
                {type}

                <span
                  className={`calibration-tab-status ${
                    isSurveyReady(type)
                      ? 'ready'
                      : ''
                  }`}
                >
                  {isSurveyReady(type)
                    ? 'Siap'
                    : 'Belum siap'}
                </span>
              </button>
            ))}
          </div>
        </Panel>


        {/* ================================================
            ALAT & PERSONEL TERSIMPAN
            ================================================ */}

        <Panel
          title={`Alat & Personel Paket Â· ${activeSurvey}`}
          icon={ShieldCheck}
        >
          <div className="calibration-panel-heading">
            <div>
              <strong>
                Penugasan yang sudah tersimpan
              </strong>

              <span>
                Alat yang ditampilkan mengikuti jenis survei yang dipilih.
              </span>
            </div>

            {canEditCalibration &&
              !calFormOpen && (
                <Button
                  id="button-open-calibration-form"
                  kind="primary"
                  onClick={
                    beginAddCalibration
                  }
                >
                  <Plus size={13} />
                  Tambah penugasan
                </Button>
              )}
          </div>

          {surveyRecords.length === 0 ? (
            <div className="wf-callout warn">
              Belum ada alat/personel yang ditugaskan untuk {activeSurvey}.
            </div>
          ) : (
            <div className="calibration-record-list">
              {surveyRecords.map(record => {
                const ready =
                  isCalibrationRecordReady(
                    record
                  );

                return (
                  <details
                    className="calibration-record-card"
                    key={record.id}
                  >
                    <summary>
                      <div className="calibration-record-summary">
                        <div>
                          <strong>
                            {record.equipment}
                          </strong>

                          <span>
                            {record.serialNumber}
                            {' Â· '}
                            {record.personInCharge}
                          </span>
                        </div>

                        <Badge
                          tone={
                            ready
                              ? 'good'
                              : 'warn'
                          }
                        >
                          {ready
                            ? 'Siap'
                            : 'Perlu dilengkapi'}
                        </Badge>
                      </div>
                    </summary>

                    <div className="calibration-record-detail">
                      <div className="package-readonly-grid">
                        <div>
                          <small>
                            Jenis survei
                          </small>
                          <strong>
                            {record.surveyType}
                          </strong>
                        </div>

                        <div>
                          <small>
                            Kondisi
                          </small>
                          <strong>
                            {record.condition}
                          </strong>
                        </div>

                        <div>
                          <small>
                            Kalibrasi
                          </small>
                          <strong>
                            {record.calibrationKind}
                          </strong>
                        </div>

                        <div>
                          <small>
                            Kalibrasi terakhir
                          </small>
                          <strong>
                            {record.lastCalibrated}
                          </strong>
                        </div>

                        <div>
                          <small>
                            Berlaku sampai
                          </small>
                          <strong>
                            {record.dueDate}
                          </strong>
                        </div>

                        <div>
                          <small>
                            PIC / personel
                          </small>
                          <strong>
                            {record.personInCharge}
                          </strong>
                        </div>
                      </div>

                      <div className="calibration-record-flags">
                        <Badge
                          tone={
                            record.qualificationValid
                              ? 'good'
                              : 'warn'
                          }
                        >
                          {record.qualificationValid
                            ? 'Kualifikasi tercatat'
                            : 'Kualifikasi belum tercatat'}
                        </Badge>

                        <Badge
                          tone={
                            record.trainingVerified
                              ? 'good'
                              : 'warn'
                          }
                        >
                          {record.trainingVerified
                            ? 'Pelatihan tercatat'
                            : 'Pelatihan belum tercatat'}
                        </Badge>
                      </div>

                      <div className="calibration-record-evidence">
                        <EvidenceAttachment
                          packageId={
                            state.project.id
                          }
                          evidenceId={`calibration-certificate-${record.id}`}
                          label="Sertifikat / bukti kalibrasi"
                          editable={false}
                          compact
                        />

                        <EvidenceAttachment
                          packageId={
                            state.project.id
                          }
                          evidenceId={`calibration-person-${record.id}`}
                          label="Bukti kualifikasi / pelatihan"
                          editable={false}
                          compact
                        />
                      </div>

                      {canEditCalibration && (
                        <div className="wf-toolbar">
                          <Button
                            id={`button-edit-calibration-${record.id}`}
                            onClick={() =>
                              beginEditCalibration(
                                record
                              )
                            }
                          >
                            Edit penugasan
                          </Button>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </Panel>


        {/* ================================================
            FORM TAMBAH / EDIT
            hanya muncul ketika user meminta
            ================================================ */}

        {canEditCalibration &&
          calFormOpen && (
            <Panel
              title={
                calEditId
                  ? 'Edit Penugasan Alat & Personel'
                  : 'Tambah Penugasan Alat & Personel'
              }
              icon={Plus}
            >
              <div className="workflow-data-origin">
                <span className="origin-badge provider">
                  INPUT PENYEDIA
                </span>

                <div>
                  <strong>
                    {calEditId
                      ? 'Perbarui rekaman'
                      : 'Tambahkan rekaman baru'}
                  </strong>

                  <span>
                    Isi berdasarkan alat dan personel yang benar-benar digunakan pada jenis survei ini.
                  </span>
                </div>
              </div>

              <div className="wf-fields">
                <Field label="Jenis survei">
                  <select
                    value={
                      newCalibration.surveyType ||
                      activeSurvey
                    }
                    onChange={e => {
                      const type =
                        e.target
                          .value as SurveyType;

                      setCalibrationSurvey(
                        type
                      );

                      setNewCalibration(
                        previous => ({
                          ...previous,
                          surveyType: type,
                          equipment:
                            dailyEquipment[
                              type
                            ]?.[0] ||
                            '',
                        })
                      );
                    }}
                  >
                    {scopedSurveyTypes.map(
                      type => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Alat">
                  <select
                    value={
                      newCalibration.equipment ||
                      ''
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          equipment:
                            e.target.value,
                        })
                      )
                    }
                  >
                    {(
                      dailyEquipment[
                        (newCalibration.surveyType ||
                          activeSurvey) as SurveyType
                      ] || []
                    ).map(item => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Nomor seri">
                  <input
                    value={
                      newCalibration.serialNumber ||
                      ''
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          serialNumber:
                            e.target.value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Tahun alat">
                  <input
                    type="number"
                    value={
                      newCalibration.year ||
                      ''
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          year:
                            Number(
                              e.target.value
                            ),
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Kondisi">
                  <select
                    value={
                      newCalibration.condition ||
                      'Baik'
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          condition:
                            e.target.value,
                        })
                      )
                    }
                  >
                    <option>Baik</option>
                    <option>
                      Perlu servis
                    </option>
                    <option>
                      Tidak layak
                    </option>
                  </select>
                </Field>

                <Field label="Jenis kalibrasi">
                  <select
                    value={
                      newCalibration.calibrationKind ||
                      'Referensi tahunan'
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          calibrationKind:
                            e.target.value as CalibrationRecord['calibrationKind'],
                        })
                      )
                    }
                  >
                    <option>
                      Referensi tahunan
                    </option>
                    <option>
                      Relatif berkala
                    </option>
                  </select>
                </Field>

                <Field label="PIC / personel">
                  <input
                    value={
                      newCalibration.personInCharge ||
                      ''
                    }
                    placeholder="Nama personel"
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          personInCharge:
                            e.target.value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Kalibrasi terakhir">
                  <input
                    type="date"
                    value={
                      newCalibration.lastCalibrated ||
                      state.simulationDate
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          lastCalibrated:
                            e.target.value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Berlaku sampai">
                  <input
                    type="date"
                    value={
                      newCalibration.dueDate ||
                      state.simulationDate
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          dueDate:
                            e.target.value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Metode / standar kalibrasi">
                  <input
                    value={
                      newCalibration.standardReference ||
                      ''
                    }
                    placeholder="Nomor / nama metode atau standar"
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          standardReference:
                            e.target.value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Nomor / referensi sertifikat">
                  <input
                    value={
                      newCalibration.certificateReference ||
                      ''
                    }
                    placeholder="Nomor sertifikat / dokumen"
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          certificateReference:
                            e.target.value,
                        })
                      )
                    }
                  />
                </Field>
              </div>

              <div className="calibration-form-checks">
                <label className="wf-pill">
                  <input
                    type="checkbox"
                    checked={
                      !!newCalibration.qualificationValid
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          qualificationValid:
                            e.target.checked,
                        })
                      )
                    }
                  />
                  Kualifikasi personel tercatat
                </label>

                <label className="wf-pill">
                  <input
                    type="checkbox"
                    checked={
                      !!newCalibration.trainingVerified
                    }
                    onChange={e =>
                      setNewCalibration(
                        previous => ({
                          ...previous,
                          trainingVerified:
                            e.target.checked,
                        })
                      )
                    }
                  />
                  Pelatihan / kompetensi tercatat
                </label>
              </div>

              <div className="calibration-form-evidence">
                <EvidenceAttachment
                  packageId={
                    state.project.id
                  }
                  evidenceId={`calibration-certificate-${calFormRecordId}`}
                  label="Sertifikat / bukti kalibrasi"
                  description="Unggah dokumen bila tersedia, atau catat nomor/referensi sertifikat pada form."
                  editable
                  compact
                />

                <EvidenceAttachment
                  packageId={
                    state.project.id
                  }
                  evidenceId={`calibration-person-${calFormRecordId}`}
                  label="Bukti kualifikasi / pelatihan"
                  description="Dokumen kualifikasi, kompetensi atau pelatihan personel."
                  editable
                  compact
                />
              </div>

              <div className="wf-toolbar calibration-form-actions">
                <Button
                  id="button-cancel-calibration"
                  onClick={
                    cancelCalibrationForm
                  }
                >
                  Batal
                </Button>

                <Button
                  id="button-save-calibration"
                  kind="primary"
                  onClick={
                    addCalibration
                  }
                >
                  {calEditId
                    ? 'Simpan Perubahan'
                    : 'Simpan Penugasan'}
                </Button>
              </div>
            </Panel>
          )}


        {/* ================================================
            CHECKLIST DRAFT PP
            ================================================ */}

        <SourceAlignmentChecklist
          packageId={
            state.project.id
          }
          phase="calibration"
          surveyTypes={[
            activeSurvey,
          ]}
          role={state.role}
          editableRoles={[
            'Penyedia Jasa / Ketua Tim',
          ]}
          title={`Checklist Kalibrasi & Validasi Â· ${activeSurvey}`}
          defaultSurvey={
            activeSurvey
          }
          hideSurveySelector
          onCompletionChange={(
            survey,
            complete
          ) => {
            if (
              state.calibrationChecklist[
                survey
              ] === complete
            ) {
              return;
            }

            setTypeCheck(
              survey,
              complete
            );
          }}
        />


        {/* ================================================
            STATUS OTOMATIS
            ================================================ */}

        <Panel
          title="Kesiapan per Jenis Survei"
          icon={ShieldCheck}
        >
          <div className="calibration-readiness-list">
            {scopedSurveyTypes.map(type => {
              const records =
                state.calibrations.filter(
                  record =>
                    record.surveyType ===
                    type
                );

              const recordsReady =
                records.length > 0 &&
                records.every(
                  isCalibrationRecordReady
                );

              const checklistReady =
                !!state
                  .calibrationChecklist[
                  type
                ];

              const ready =
                recordsReady &&
                checklistReady;

              return (
                <div
                  className="wf-row"
                  key={type}
                >
                  <div>
                    <strong>
                      {type}
                    </strong>

                    <span
                      className="wf-note"
                      style={{
                        display:
                          'block',
                      }}
                    >
                      {!records.length
                        ? 'Belum ada penugasan alat/personel.'
                        : !recordsReady
                          ? 'Kesiapan alat/personel belum terpenuhi.'
                          : !checklistReady
                            ? 'Checklist Kalibrasi & Validasi belum lengkap.'
                            : 'Siap untuk masuk Validasi Produksi.'}
                    </span>
                  </div>

                  <Badge
                    tone={
                      ready
                        ? 'good'
                        : 'warn'
                    }
                  >
                    {ready
                      ? 'Siap'
                      : 'Belum siap'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Panel>


        {/* ================================================
            CTA TAHAP BERIKUTNYA
            ================================================ */}

        <Panel
          title="Tahap Berikutnya"
          icon={ArrowRight}
        >
          <div className="stage-next-action">
            <div>
              <strong>
                {allSurveyReady
                  ? 'Kalibrasi & Validasi Awal siap'
                  : `${readySurveyCount} dari ${scopedSurveyTypes.length} jenis survei siap`}
              </strong>

              <span>
                Tahap Validasi Produksi terbuka setelah seluruh jenis survei dalam lingkup memenuhi kesiapan.
              </span>
            </div>

            <Button
              id="button-stage1-next"
              kind="primary"
              disabled={
                !allSurveyReady
              }
              onClick={() =>
                onNavigate(
                  '/entry:Validasi produksi'
                )
              }
            >
              Lanjut ke Validasi Produksi
              <ArrowRight size={13} />
            </Button>
          </div>
        </Panel>
        <Panel title="Berita Acara Kalibrasi dan Validasi" icon={FileText}>
          <p className="wf-note">Setelah data alat, personel, dan hasil kalibrasi dicatat, susun satu draft BA untuk jenis survei terkait. Hasil validasi produksi dari Tahap 2 dapat ikut ditampilkan sebagai data pendukung.</p>
          {baAccess('kalibrasi','Buka BA Kalibrasi & Validasi')}
        </Panel>
      </>
    );
  };

  const productionScreen = () => {
    const canEnterProduction=state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin';
    const canReviewProduction=state.role==='PIC Balai / Pengguna Jasa'||state.role==='Admin';

    const sourceIsSynced=
      test.sourceMode==='Sinkronisasi sistem sumber' ||
      test.sourceMode==='Sinkronisasi source/SMD';

      const sourceIsImport =
  test.sourceMode === 'Lampiran / bukti kegiatan' ||
  test.sourceMode === 'Import/evidence';

const sourceIsManual =
  test.sourceMode === 'Pencatatan manual' ||
  test.sourceMode === 'Input manual fallback';

const sourceModeLabel =
  sourceIsSynced
    ? 'Data terintegrasi'
    : sourceIsImport
      ? 'Import / lampiran hasil uji'
      : 'Manual fallback';

    const updateField = <
  K extends keyof ProductionTest
>(
  key: K,
  value: ProductionTest[K],
) => {
  if (
    state.role !==
      'Penyedia Jasa / Ketua Tim' &&
    state.role !== 'Admin'
  ) {
    setNotice(
      'Penyedia Jasa mengisi uji produksi.',
    );
    return;
  }

  commit(
    `Ubah uji produksi ${prodType}`,
    `${prodType} · ${String(
      labels[key] ?? key,
    )}`,
    s => ({
      ...invalidateDependentStages(
        s,
        `Hasil uji ${prodType} berubah; validasi dan audit harus diulang.`,
      ),

      productionTestDates: {
        ...s.productionTestDates,
        [prodType]:
          s.simulationDate,
      },

      productionTests: {
        ...s.productionTests,

        [prodType]: {
          ...s.productionTests[
            prodType
          ],

          [key]: value,
        },
      },
    }),
  );
};
    const boolFields: Array<'deflectionBowlOrdered'|'bridgePersonnelPassed'|'ratersAgree'|'stationingConsistent'|'pciManual'|'pciBenchmarkBalanced'|'bridgeTrialReportComplete'> = prodType==='PCI'?(test.pciManual?['pciManual','ratersAgree','stationingConsistent']:['pciManual','pciBenchmarkBalanced']):prodType==='Jembatan'?['bridgePersonnelPassed','bridgeTrialReportComplete','ratersAgree','stationingConsistent']:prodType==='Lendutan'?(test.deflectionMethod==='LWD'?[]:['deflectionBowlOrdered']):prodType==='Lalu Lintas'||prodType==='IRI'?[]:prodType==='RNI'?['stationingConsistent']:['ratersAgree','stationingConsistent'];
    const scopedTypes=state.project.surveyTypes;
    const allSelectedPassed=scopedTypes.length>0&&scopedTypes.every(type=>evaluateProductionTest(type,state.productionTests[type]).passed);
    const calibrationReady=state.calibrations.length>0&&state.calibrations.every(c=>daysBetween(state.simulationDate,c.dueDate)>=0&&c.qualificationValid&&c.trainingVerified&&c.condition==='Baik')&&scopedTypes.length>0&&scopedTypes.every(type=>state.calibrationChecklist[type]);
    const reviewReady=state.project.preparation.reportApproval==='Disetujui'&&calibrationReady&&allSelectedPassed;
    const submitForReview = () => {
  if (
    state.role !== 'Penyedia Jasa / Ketua Tim' &&
    state.role !== 'Admin'
  ) {
    setNotice(
      'Peran Penyedia Jasa / Ketua Tim diperlukan untuk mengajukan hasil validasi produksi.',
    );
    return;
  }

  if (!reviewReady) {
    setNotice(
      'Pengajuan tertahan sampai persiapan, kalibrasi/personel, dan seluruh uji produksi dalam lingkup memenuhi pemeriksaan.',
    );
    return;
  }

  commit(
    'Ajukan hasil validasi produksi',
    state.project.packageName,
    s => ({
      ...s,

      productionApproval: 'Diajukan',

      productionSubmissionNote:
        draft.providerSubmissionNote ??
        s.productionSubmissionNote ??
        '',

      productionApprovalNote: '',
    }),
    'Hasil validasi produksi diajukan ke PIC Balai',
  );

  setDraft(current => ({
    ...current,
    providerSubmissionNote: '',
  }));
};
    const decideReview=(decision:'Perlu Revisi'|'Disetujui')=>{
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Peran PIC Balai / Pengguna Jasa diperlukan untuk meninjau metode.');return;}
      if(state.productionApproval!=='Diajukan'&&state.productionApproval!=='Perlu Revisi'){setNotice('Ajukan metode terlebih dahulu sebelum keputusan Pengguna Jasa.');return;}
      if(decision==='Disetujui'&&!reviewReady){setNotice('Persetujuan tertahan sampai seluruh gerbang persiapan, kalibrasi dan uji produksi lulus.');return;}
      const ba=decision==='Disetujui'?(draft.methodBa||state.productionApprovalBa||''):state.productionApprovalBa;
      commit(`Keputusan metode: ${decision}`,state.project.packageName,s=>({...s,productionApproval:decision,productionApprovalBa:ba,productionApprovalNote:draft.reviewerProductionNote??s.productionApprovalNote,bridgeInspectionPermit:decision==='Disetujui'&&scopedTypes.includes('Jembatan')?true:s.bridgeInspectionPermit}),decision==='Disetujui'?'Referensi BA persetujuan metode dicatat pada simulasi':'Metode dikembalikan untuk revisi');
    };
    return <>{heading(
  'Tahap 2 Â· validasi produksi',
  'Validasi Produksi Data / Uji Coba',
  'Data hasil uji diperiksa otomatis terhadap ketentuan QA/QC. Penyedia melengkapi bukti yang belum tersedia, kemudian PIC Balai melakukan review.'
)}
  <Panel title="Dokumen Hasil Uji & Persetujuan" icon={FileText}>
    <p className="wf-note">BA Kalibrasi dan Validasi disusun dari hasil Tahap 1–2. Persetujuan alat/metode diterbitkan setelah hasil uji ditinjau dan disetujui Pengguna Jasa.</p>
    <div className="wf-toolbar">{baAccess('kalibrasi','Lihat BA Kalibrasi (dokumen Tahap 1)')}</div>
    <div className="wf-callout" style={{marginTop:10}}>
      <strong>Persetujuan Alat & Metode: {state.productionApproval}</strong>
      <div>{state.productionApproval==='Disetujui' ? `Referensi: ${state.productionApprovalBa||'Belum dicatat'}` : 'Belum ada persetujuan. Dokumen persetujuan tidak boleh diterbitkan sebelum review lulus.'}</div>
    </div>
  </Panel>
  <Panel
    title="Jenis Survei yang Diperiksa"
    icon={Gauge}
    extra={
      <Badge tone={evaluation.passed?'good':'warn'}>
        {evaluation.passed?'Sesuai':'Perlu pemeriksaan'}
      </Badge>
    }
  >
    <div className="wf-toolbar">
      {scopedTypes.map(type=>
        <button
          key={type}
          data-testid={`button-production-type-${testId(type)}`}
          className={`wf-button ${prodType===type?'primary':''}`}
          onClick={()=>setProdType(type)}
        >
          {type}
        </button>
      )}
    </div>

    <div className="wf-note" style={{marginTop:8}}>
      Jenis survei aktif: <strong>{prodType}</strong>
    </div>
  </Panel>

  <ProductionValidationChecklist
  type={prodType}
  test={test}
  editable={
    canEnterProduction &&
    !sourceIsSynced
  }
  onUpdate={updateField}
/>

  <div className="production-workspace-columns">

    <div className="production-column">

      <Panel title="Data Hasil Uji" icon={Archive}>
        <div className="workflow-data-origin">
          <span className="origin-badge source">
            {test.sourceMode==='Sinkronisasi sistem sumber'
              ? 'SISTEM SUMBER'
              : 'INPUT PENYEDIA'}
          </span>

          <div>
            <strong>{sourceModeLabel}</strong>

            <span>
  {sourceIsSynced
    ? 'Data hasil uji dibaca dari sistem sumber dan tidak dapat diubah di JALA MUTU.'
    : sourceIsImport
      ? 'Gunakan file hasil uji bila data belum tersedia melalui integrasi sistem sumber.'
      : 'Gunakan pencatatan manual hanya sebagai fallback bila integrasi dan file hasil uji tidak tersedia.'}
</span>
          </div>
        </div>

        <div className="wf-fields">
          <Field label="Sumber data hasil uji">
            <Select
              id="select-production-source-mode"
              disabled={!canEnterProduction}
              value={test.sourceMode??'Import/evidence'}
              options={[...VALIDATION_SOURCE_OPTIONS]}
              onChange={value =>
  updateField(
    'sourceMode',
    value as ProductionTest[
      'sourceMode'
    ],
  )
}
            />
          </Field>

          <div className="wf-callout production-source-guidance">
  {sourceIsSynced ? (
    <>
      <strong>Sumber utama tersedia.</strong>
      <span>
        Nilai teknis berasal dari sistem sumber.
        Penyedia tidak perlu mengetik ulang data.
        Bukti tambahan tetap dapat dilampirkan bila diperlukan.
      </span>
    </>
  ) : sourceIsImport ? (
    <>
      <strong>Import / lampiran digunakan sebagai fallback.</strong>
      <span>
        Lampirkan file hasil uji atau dokumen sumber.
        Data yang belum terbaca dapat dilengkapi oleh Penyedia.
      </span>
    </>
  ) : (
    <>
      <strong>Manual fallback.</strong>
      <span>
        Digunakan hanya jika data tidak tersedia melalui
        sistem sumber maupun file hasil uji.
        Jelaskan alasan penggunaan fallback.
      </span>
    </>
  )}
</div>

          <EvidenceField
  label={
    sourceIsSynced
      ? 'Referensi record sistem sumber'
      : sourceIsImport
        ? 'Referensi file hasil uji'
        : 'Referensi pendukung fallback'
  }
  value={test.evidenceReference ?? ''}
  onChange={value =>
    updateField(
      'evidenceReference',
      value,
    )
  }
  disabled={
    !canEnterProduction ||
    sourceIsSynced
  }
  helper={
    sourceIsSynced
      ? 'Nantinya terisi otomatis dari backend: ID record, sistem sumber, dan waktu sinkronisasi.'
      : sourceIsImport
        ? 'Cantumkan nama file atau nomor dokumen hasil uji yang diimport.'
        : 'Cantumkan bukti yang mendukung pencatatan manual.'
  }
/>
        </div>

        {sourceIsManual && (
  <Field
    label="Alasan penggunaan manual fallback"
    full
  >
    <textarea
      value={String(
        test.productionDetails?.fallbackReason ?? '',
      )}
      onChange={event =>
        updateField('productionDetails', {
          ...test.productionDetails,
          fallbackReason: event.target.value,
        })
      }
      placeholder="Contoh: integrasi sistem sumber belum tersedia / data uji belum dapat disinkronkan."
    />
  </Field>
)}

      <EvidenceAttachment
          packageId={state.project.id}
          evidenceId={`production-trial-${prodType}`}
          label="Bukti pendukung uji coba"
          description={
            sourceIsSynced
              ? 'Bukti tambahan bila diperlukan untuk review.'
              : 'Lampiran atau referensi wajib mendukung data yang dicatat sebagai fallback.'
          }
          editable={canEnterProduction}
          required={!sourceIsSynced}
        />
      </Panel>

      <Panel
        title="Status Jenis Survei dalam Paket"
        icon={ClipboardCheck}
        extra={
          <Badge tone={allSelectedPassed?'good':'warn'}>
            {scopedTypes.filter(
              type=>evaluateProductionTest(
                type,
                state.productionTests[type]
              ).passed
            ).length}
            {' '}dari {scopedTypes.length} jenis selesai
          </Badge>
        }
      >
        {scopedTypes.map(type=>{
          const result=evaluateProductionTest(
            type,
            state.productionTests[type]
          );

          return <div
            className="wf-row"
            key={type}
            data-testid={`production-scope-${testId(type)}`}
          >
            <span>
              <strong>{type}</strong>
              <span className="wf-note" style={{display:'block'}}>
                {result.passed
                  ? 'Seluruh pemeriksaan terpenuhi'
                  : `${result.checks.filter(check=>check.pass).length} dari ${result.checks.length} pemeriksaan sesuai`}
              </span>
            </span>

            <Badge tone={result.passed?'good':'bad'}>
              {result.passed?'Sesuai':'Tertahan'}
            </Badge>
          </div>
        })}

        <GateSummary
          title="Kesiapan menuju Pelaksanaan Survei"
          items={[
            {
              label:'Persiapan telah disetujui',
              ready:state.project.preparation.reportApproval==='Disetujui'
            },
            {
              label:'Kalibrasi dan personel siap',
              ready:calibrationReady
            },
            {
              label:'Seluruh jenis survei memenuhi pemeriksaan otomatis',
              ready:allSelectedPassed,
              detail:`${
                scopedTypes.filter(
                  type=>evaluateProductionTest(
                    type,
                    state.productionTests[type]
                  ).passed
                ).length
              }/${scopedTypes.length} jenis`
            },
            {
              label:'Review PIC Balai selesai',
              ready:state.productionApproval==='Disetujui',
              detail:state.productionApproval
            },
          ]}
        />
      </Panel>

      {sourceIsManual &&
  prodType === 'IRI' && (
  <details
    className="wf-panel production-helper"
    data-testid="production-calculator-optional"
  >
    <summary
      className="wf-panel-head"
      style={{ cursor: 'pointer' }}
    >
      <h3>
        <Gauge size={14} />
        Alat bantu manual
      </h3>

      <Badge tone="info">
        Opsional
      </Badge>
    </summary>

    <ProductionCalculator
      key={`${prodType}-${!!test.pciManual}`}
      type={prodType}
      pciManual={test.pciManual}
      onApply={patch => {
        if (
          state.role !==
            'Penyedia Jasa / Ketua Tim' &&
          state.role !== 'Admin'
        ) {
          setNotice(
            'Hanya Penyedia yang dapat memakai fallback manual.',
          );
          return;
        }

        commit(
          `Preview kalkulasi lokal ${prodType}`,
          prodType,
          s => ({
            ...invalidateDependentStages(
              s,
              'Data fallback berubah; validasi berikutnya perlu diperiksa ulang.',
            ),

            productionTestDates: {
              ...s.productionTestDates,
              [prodType]:
                s.simulationDate,
            },

            productionTests: {
              ...s.productionTests,

              [prodType]: {
                ...s.productionTests[
                  prodType
                ],
                ...patch,
                sourceMode:
                  'Input manual fallback',
              },
            },
          }),
        );
      }}
    />
  </details>
)}

    </div>

    <div className="production-column">

      <Panel title="Hasil Pemeriksaan Otomatis" icon={CheckCircle2}>
        <div className="workflow-data-origin">
          <span className="origin-badge system">HASIL SISTEM</span>

          <div>
            <strong>Pemeriksaan otomatis JALA MUTU</strong>
            <span>
              Data hasil uji dibandingkan dengan ketentuan QA/QC. Hasil sistem bukan pengganti keputusan reviewer.
            </span>
          </div>
        </div>

        <ValidationResultTable
          rows={evaluation.checks.map(check=>({
            label:check.label,
            actual:check.actual,
            requirement:'Ketentuan QA/QC',
            pass:check.pass,
            source:test.sourceMode??'Import/evidence'
          }))}
        />

        <div className="wf-toolbar" style={{marginTop:12}}>
          <Badge tone={evaluation.passed?'good':'bad'}>
            {evaluation.passed
              ? 'Sesuai'
              : 'Ditemukan ketidaksesuaian'}
          </Badge>

          {!evaluation.passed&&
            <Button
              id="button-production-create-correction"
              kind="danger"
              onClick={()=>{
                const c=defaultCase(state);
                c.source='Uji coba gagal';
                c.blockedStage='Validasi produksi';
                c.surveyType=prodType;
                c.rejectionReason=`Belum memenuhi hasil evaluasi ${prodType}`;

                commit(
                  'Buka kasus dari uji produksi',
                  c.id,
                  s=>({...s,corrections:[c,...s.corrections]}),
                  'Kasus koreksi dibuat; data menunggu uji ulang'
                );

                setCaseId(c.id);
              }}
            >
              Buka Tindakan Perbaikan
            </Button>
          }
        </div>
      </Panel>

      {(
  state.productionApproval === 'Perlu Revisi' ||
  state.productionApproval === 'Disetujui' ||
  state.productionApproval === 'Ditolak'
) &&
  state.productionApprovalNote?.trim() && (
        <div className="review-note important">
          <small>CATATAN REVIEW</small>
          <strong>
            {state.productionApproval==='Perlu Revisi'
              ? 'Perlu perbaikan'
              : 'Catatan PIC Balai'}
          </strong>
          <p>{state.productionApprovalNote}</p>
        </div>
      )}

      {state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin' ? (
        <Panel
          title="Pengajuan ke PIC Balai"
          icon={FileCheck2}
          extra={
            <Badge tone={
              state.productionApproval==='Disetujui'
                ?'good'
                :state.productionApproval==='Perlu Revisi'
                  ?'bad'
                  :'warn'
            }>
              {state.productionApproval}
            </Badge>
          }
        >
          <div className="workflow-data-origin">
            <span className="origin-badge provider">INPUT PENYEDIA</span>
            <div>
              <strong>
  Ajukan hasil validasi produksi
</strong>

<span>
  Pengajuan dapat dikirim setelah seluruh jenis survei
  dalam lingkup memenuhi pemeriksaan Tahap 2.
  PIC Balai kemudian meninjau data, bukti,
  dan hasil pemeriksaan sistem.
</span>
            </div>
          </div>

          <Field
  label="Catatan / keterangan Penyedia"
  full
>
  <textarea
    data-testid="input-production-submission-note"
    value={
      draft.providerSubmissionNote ??
      state.productionSubmissionNote ??
      ''
    }
    onChange={event =>
      saveText(
        'providerSubmissionNote',
        event.target.value,
      )
    }
    placeholder="Contoh: uji coba seluruh jenis survei telah dilaksanakan dan bukti pendukung telah dilengkapi."
  />
</Field>

          <div className="wf-toolbar" style={{marginTop:10}}>
            <Button
              id="button-production-submit-review"
              kind="primary"
              disabled={
                !reviewReady ||
                state.productionApproval==='Diajukan'
              }
              onClick={submitForReview}
            >
              <ArrowRight size={13}/>
              {state.productionApproval==='Diajukan'
                ?'Menunggu Review'
                :'Ajukan untuk Review'}
            </Button>
          </div>
        </Panel>
      ) : state.role==='PIC Balai / Pengguna Jasa' ? (
        <Panel
          title="Review PIC Balai"
          icon={FileCheck2}
          extra={
            <Badge tone={
              state.productionApproval==='Disetujui'
                ?'good'
                :state.productionApproval==='Perlu Revisi'
                  ?'bad'
                  :'warn'
            }>
              {state.productionApproval}
            </Badge>
          }
        >
          <div className="workflow-data-origin">
            <span className="origin-badge reviewer">REVIEW BALAI</span>

            <div>
              <strong>Keputusan reviewer</strong>
              <span>Checklist, data hasil uji, dan hasil pemeriksaan sistem dibaca sebagai bahan review.</span>
            </div>
          </div>

          <div className="wf-fields">
            <Field label="Referensi BA">
              <input
                data-testid="input-production-approval-ba"
                value={draft.methodBa??state.productionApprovalBa}
                onChange={e=>saveText('methodBa',e.target.value)}
                placeholder="Nomor atau referensi BA"
              />
            </Field>

            <Field label="Catatan PIC Balai">
  <textarea
    data-testid="input-production-review-note"
    value={
      draft.reviewerProductionNote ??
      state.productionApprovalNote ??
      ''
    }
    onChange={event =>
      saveText(
        'reviewerProductionNote',
        event.target.value,
      )
    }
    placeholder="Tuliskan hasil review, klarifikasi, atau alasan perbaikan."
  />
</Field>
          </div>

          <div className="wf-toolbar" style={{marginTop:10}}>
            <Button
              id="button-production-request-revision"
              kind="danger"
              disabled={
                state.productionApproval!=='Diajukan' &&
                state.productionApproval!=='Perlu Revisi'
              }
              onClick={()=>decideReview('Perlu Revisi')}
            >
              Minta Perbaikan
            </Button>

            <Button
              id="button-production-approve-method"
              disabled={
                !reviewReady ||
                state.productionApproval==='Disetujui'
              }
              onClick={()=>decideReview('Disetujui')}
            >
              <Check size={13}/>
              Setujui
            </Button>
          </div>

          {state.productionApprovalBa&&(
            <div className="wf-callout" style={{marginTop:9}}>
              Referensi BA: <strong>{state.productionApprovalBa}</strong>
            </div>
          )}
        </Panel>
      ) : (
        <Panel title="Status Review" icon={ShieldCheck}>
          <div className="workflow-data-origin">
            <span className="origin-badge monitoring">MONITORING</span>
            <div>
              <strong>Read-only</strong>
              <span>Peran ini dapat melihat hasil sistem dan keputusan PIC Balai tanpa mengubah pengajuan.</span>
            </div>
          </div>

          <div className="wf-row">
            <span>Status review</span>
            <Badge tone={
              state.productionApproval==='Disetujui'
                ?'good'
                :state.productionApproval==='Perlu Revisi'
                  ?'bad'
                  :'warn'
            }>
              {state.productionApproval}
            </Badge>
          </div>

          {state.productionApprovalBa&&
            <div className="wf-row">
              <span>Referensi BA</span>
              <strong>{state.productionApprovalBa}</strong>
            </div>
          }
        </Panel>
      )}

      {scopedTypes.includes('Jembatan')&&(
        <Panel title="Izin Pemeriksaan Jembatan" icon={ShieldCheck}>
          <div className="wf-row">
            <span>Status izin</span>
            <Badge tone={state.bridgeInspectionPermit?'good':'warn'}>
              {state.bridgeInspectionPermit?'Terbit':'Belum terbit'}
            </Badge>
          </div>
        </Panel>
      )}

    </div>
  </div>
</>;
  };

  const dailyScreen = () => {
    const toolChecks=dailyChecks(daily);
    const preparationReady=state.project.preparation.reportApproval==='Disetujui';
    const calibrationReady=state.calibrations.length>0&&state.calibrations.every(c=>daysBetween(state.simulationDate,c.dueDate)>=0&&c.qualificationValid&&c.trainingVerified&&c.condition==='Baik')&&state.project.surveyTypes.length>0&&state.project.surveyTypes.every(type=>state.calibrationChecklist[type]);
    const methodApproved=state.productionApproval==='Disetujui'&&state.project.surveyTypes.every(type=>evaluateProductionTest(type,state.productionTests[type]).passed);
    const bridgePermitRequired=daily.surveyType==='Jembatan';
    const stageReady=preparationReady&&calibrationReady&&methodApproved&&(!bridgePermitRequired||state.bridgeInspectionPermit);
    const sourceMode=STAGE3_SOURCE_MODE_PRESENTATION[dailySource];
    const sourceReadOnly=dailySource==='Sinkronisasi sistem sumber';
    const sourceFieldHint=sourceReadOnly?'Data kegiatan akan ditampilkan otomatis setelah tersedia dari sistem sumber.':'Lengkapi hanya informasi yang belum tersedia pada sumber yang dipilih.';
    const technicalErrors=sourceReadOnly?[]:evaluateDailySurvey({...daily,dailyToolCheck:dailyTool},state.dailyRecords);
    const fieldQuality=!sourceReadOnly&&technicalErrors.length===0;
    const gate=stageReady&&!sourceReadOnly&&fieldQuality;
    const weeklyRecords=state.dailyRecords.filter(record=>{const age=daysBetween(record.date,state.simulationDate);return state.project.surveyTypes.includes(record.surveyType)&&state.project.routes.includes(record.road)&&age>=0&&age<7;});
    const weeklyKm=weeklyRecords.filter(record=>record.state==='Tercatat').reduce((total,record)=>total+record.lengthKm,0);
    const weeklyByType=SURVEY_TYPES.map(type=>({type,count:weeklyRecords.filter(record=>record.surveyType===type).length}));
    const saveRecord=()=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa / Ketua Tim diperlukan untuk mencatat survei harian.');return;}
      if(!daily.road||!daily.operator||!daily.rawValue){setNotice('Isi ruas, operator dan nilai raw sebelum mencatat survei.');return;}
      if(!state.project.routes.includes(daily.road)||!state.project.surveyTypes.includes(daily.surveyType)){setNotice('Pilih ruas dan jenis survei yang termasuk dalam lingkup paket.');return;}
      if(daily.surveyType==='Lereng'&&!daily.slopeFailureType?.trim()){setNotice('Jenis keruntuhan lereng wajib untuk sampling 10% per jenis keruntuhan.');return;}
      if(!stageReady){setNotice('Pengumpulan tertahan sampai laporan pendahuluan, kalibrasi, persetujuan metode dan izin jembatan (bila perlu) lulus.');return;}
      if(sourceReadOnly){setNotice('Data kegiatan pada mode sinkronisasi menunggu data dari sistem sumber.');return;}
      if(!fieldQuality&&daily.state!=='Survei Ulang'){setNotice(technicalErrors.join(' '));return;}
      if(daily.state==='Survei Ulang'&&!daily.eventNotes.trim()){setNotice('Alasan survei ulang wajib dicatat pada kolom catatan event.');return;}
      if(!Number.isFinite(daily.lengthKm)||daily.lengthKm<0||!daily.date||daily.date>state.simulationDate){setNotice('Panjang tidak boleh negatif dan tanggal tidak boleh di masa depan.');return;}
      const record:DailySurveyRecord={...daily,id:idNow('HARIAN'),dailyToolCheck:{...dailyTool},cleanedValue:daily.rawValue,cleaningReason:''};
      commit('Catat survei harian',record.id,s=>{
        const invalidatesDownstream=s.submission.validationStatus==='VALID'||s.audits.some(audit=>audit.status!=='Belum Dimulai');
        const next={...s,cycle:s.cycle.periodCompleted?{...s.cycle,periodCompleted:false,certificateId:'',userReview:'Belum Diperiksa' as const,finalPeriodValidation:false,finalToolUnchanged:false}:s.cycle};
        if(!invalidatesDownstream)return {...next,dailyRecords:[record,...s.dailyRecords]};
        return {
          ...next,
          dailyRecords:[record,...s.dailyRecords],
          submission:{...s.submission,validationStatus:'Draft',validationMessage:'Rekaman lapangan berubah; jalankan ulang validasi sebelum audit.'},
          audits:[
            {...INITIAL_WORKFLOW.audits[0],sampleIds:[]},
            {...INITIAL_WORKFLOW.audits[1],sampleIds:[]},
            {...INITIAL_WORKFLOW.audits[2],sampleIds:[]},
          ] as OperationalWorkflowState['audits'],
          acceptance:{
            ...s.acceptance,
            terms:s.acceptance.terms.map(term=>term.id==='T3'||term.id==='T4'?{...term,complete:false}:term),
            semesterTwoRevalidation:false,
            finalReport:false,
            finalAcceptance:false,
          },
        };
      },'Rekaman lapangan dicatat; validasi/audit sebelumnya dibatalkan bila datanya berubah');
      setDaily(defaultDaily(state.simulationDate,state.project.routes[0]||'',state.project.surveyTypes[0]||'IRI'));setDailyTool({});
    };
    const makeBackup=()=>{
      if(backupMedia.length<2){setNotice('Pilih minimal dua media pengamanan data.');return;}
      const backup:BackupSnapshot={id:idNow('BKP'),createdAt:`${state.simulationDate} ${daily.time||'08:00'}`,media:backupMedia,includesRaw:true,includesProcessed:true,note:'Catatan pengamanan data rekaman lapangan'};
      commit('Catat pengamanan data',backup.id,s=>({...s,backups:[backup,...s.backups]}),'Catatan pengamanan data tersimpan');
    };
    const dailyStageReady=state.dailyRecords.some(record=>record.state==='Tercatat');
    const stage3AHas14DayMaterial =
  state.dailyRecords.some(record => {
    const age = daysBetween(
      record.date,
      state.simulationDate,
    );

    return (
      record.state === 'Tercatat' &&
      age >= 14
    );
  });
    const canEnterDaily=state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin';
    const incompleteItems=technicalErrors.filter(error=>/wajib diisi|belum lengkap|harus diisi|belum tersedia/i.test(error));
    const checkItems=technicalErrors.filter(error=>!incompleteItems.includes(error));
    const weeklySummary=<Panel title="Ringkasan laporan mingguan" icon={Activity}><div className="wf-callout">Periode tujuh hari sampai {state.simulationDate}; angka dibentuk dari rekaman lapangan tersimpan.</div><div className="wf-kpis"><div className="wf-kpi"><div className="wf-kpi-label">Catatan minggu ini</div><div className="wf-kpi-value">{weeklyRecords.length}</div></div><div className="wf-kpi"><div className="wf-kpi-label">Panjang tercatat</div><div className="wf-kpi-value">{weeklyKm.toFixed(1)} km</div></div><div className="wf-kpi"><div className="wf-kpi-label">Survei ulang</div><div className="wf-kpi-value">{weeklyRecords.filter(record=>record.state==='Survei Ulang').length}</div></div></div><div className="wf-pill-list">{weeklyByType.filter(row=>row.count>0).map(row=><span className="wf-pill" key={row.type} data-testid={`weekly-survey-type-${testId(row.type)}`}>{row.type} Â· {row.count}</span>)}{weeklyRecords.length===0&&<span className="wf-note">Belum ada catatan dalam periode ini.</span>}</div></Panel>;
    const stage3AGate=<GateSummary title="Status Tahap 3A â†’ verval berkala" items={[
         {label:'Ada rekaman kegiatan lapangan',ready:dailyStageReady,detail:dailyStageReady?`${state.dailyRecords.filter(r=>r.state==='Tercatat').length} rekaman tercatat`:'Belum ada rekaman tercatat'},
         {label:'Ada data tercatat untuk bahan verval',ready:state.dailyRecords.some(r=>r.state==='Tercatat'),detail:'Verval menggunakan rekaman kegiatan yang tercatat'},
         {label:'Bukti/check harian tersedia',ready:state.dailyRecords.some(r=>Object.values(r.dailyToolCheck).some(Boolean)),detail:'Checklist mengikuti jenis/metode survei'},{
  label:
    'Bahan periode 14 hari tersedia',

  ready:
    stage3AHas14DayMaterial,

  detail:
    stage3AHas14DayMaterial
      ? 'Rekaman periode siap masuk verifikasi berkala'
      : 'Belum tersedia rentang rekaman 14 hari',
},
       ]}/>;
    return <>{heading('Tahap 3A Â· pengumpulan data','Survei harian','Pantau pelaksanaan survei harian, kelengkapan bukti QA/QC, kondisi alat, dan kesiapan menuju verifikasi berkala.')}
      <div className="wf-grid">
        <Panel title="Data kegiatan & kewenangan" icon={Activity}>
          <div className="wf-fields">
            <Field label="Sumber data kegiatan">{canEnterDaily?<Select id="select-daily-source" value={dailySource} options={[...VALIDATION_SOURCE_OPTIONS]} onChange={v=>setDailySource(v as (typeof VALIDATION_SOURCE_OPTIONS)[number])}/>:<input value={dailySource} readOnly/>}</Field>
            <Field label="Status sumber"><div><Badge tone={sourceReadOnly?'good':dailySource==='Lampiran / bukti kegiatan'?'info':'warn'}>{sourceMode.badge}</Badge><div className="wf-note" style={{marginTop:5}}>{sourceMode.detail}</div></div></Field>
          </div>
          <div className="wf-note" style={{marginTop:8}}>
            Data yang telah tersedia dari sistem terintegrasi ditampilkan sebagai data referensi dan tidak diubah dari halaman ini. Penyedia hanya melengkapi informasi atau bukti yang belum tersedia.
          </div>
          <div className="wf-callout" style={{marginTop:10}}><strong>{state.role}:</strong> {STAGE3_ROLE_GUIDANCE[state.role]}</div>
        </Panel>
        <GateSummary title="Kesiapan masuk pengumpulan data" items={[
          {label:'Tahap 0 persiapan',ready:preparationReady,detail:preparationReady?'Lengkap':'Lengkapi persiapan'},
          {label:'Tahap 1 alat & personel',ready:calibrationReady,detail:calibrationReady?'Siap':'Belum siap'},
          {label:'Tahap 2 validasi produksi',ready:methodApproved,detail:methodApproved?'Disetujui':'Belum disetujui'},
        ]}/>
      </div>
      {canEnterDaily&&<div className="wf-stage3a-stack">
        <Panel title={sourceReadOnly?"Data kegiatan dari sistem sumber":dailySource==='Lampiran / bukti kegiatan'?"Kelengkapan data dari lampiran":"Pencatatan manual kegiatan"} icon={MapPinned} extra={<Badge tone={gate?'good':sourceReadOnly?'info':'bad'}>{gate?'Kondisi memenuhi':sourceReadOnly?'Menunggu data':'Kondisi tertahan'}</Badge>}>
          <div className="wf-callout" style={{marginBottom:10}}><strong>{sourceMode.badge}.</strong> {sourceFieldHint}</div>{sourceReadOnly?<div className="wf-callout"><strong>Belum ada rekaman tersinkron.</strong><div className="wf-note" style={{marginTop:5}}>Saat data tersedia, metadata seperti ruas, waktu, koordinat, alat, personel, dan hasil survei akan tampil sebagai data sumber. Penyedia kemudian melengkapi checklist, bukti, atau catatan yang memang belum tersedia.</div></div>:<div className="wf-fields">
            <Field label="Tanggal"><input type="date" data-testid="input-daily-date" value={daily.date} readOnly={sourceReadOnly} onChange={e=>setDaily(d=>({...d,date:e.target.value}))}/></Field>
            <Field label="Waktu"><input type="time" data-testid="input-daily-time" value={daily.time} readOnly={sourceReadOnly} onChange={e=>setDaily(d=>({...d,time:e.target.value}))}/></Field>
            <Field label="Jenis survei"><Select id="select-daily-survey-type" value={daily.surveyType} options={state.project.surveyTypes} disabled={sourceReadOnly} onChange={v=>{setDaily(d=>({...d,surveyType:v as SurveyType,tool:dailyEquipment[v as SurveyType][0],technicalData:{},state:'Tercatat'}));setDailyTool({});}}/></Field>
            <Field label="Ruas"><Select id="select-daily-road" value={daily.road} options={state.project.routes} disabled={sourceReadOnly} onChange={v=>setDaily(d=>({...d,road:v}))}/></Field>
            <Field label="Panjang cakupan (km; boleh 0 untuk objek/titik)"><input type="number" min="0" step="0.001" data-testid="input-daily-length" value={daily.lengthKm} readOnly={sourceReadOnly} onChange={e=>setDaily(d=>({...d,lengthKm:Number(e.target.value)}))}/></Field>
            {daily.surveyType==='Lalu Lintas'&&<Field label="Durasi data lalu lintas tersedia (menit)"><input type="number" min="0" step="1" data-testid="input-daily-traffic-duration" value={daily.trafficDurationMinutes} onChange={e=>setDaily(d=>({...d,trafficDurationMinutes:Number(e.target.value)}))}/></Field>}
            {daily.surveyType==='Lereng'&&<Field label="Jenis keruntuhan lereng"><input data-testid="input-daily-slope-failure" value={daily.slopeFailureType??''} onChange={e=>setDaily(d=>({...d,slopeFailureType:e.target.value}))}/></Field>}
            <Field label="Lajur"><input data-testid="input-daily-lane" value={daily.lane} readOnly={sourceReadOnly} onChange={e=>setDaily(d=>({...d,lane:e.target.value}))}/></Field>
            <Field label="Arah"><Select id="select-daily-direction" value={daily.direction} options={['Normal','Opposite']} disabled={sourceReadOnly} onChange={v=>setDaily(d=>({...d,direction:v as DailySurveyRecord['direction']}))}/></Field>
            <Field label="Cuaca"><Select id="select-daily-weather" value={daily.weather} options={['Cerah','Berawan','Hujan']} disabled={sourceReadOnly} onChange={v=>setDaily(d=>({...d,weather:v as DailySurveyRecord['weather']}))}/></Field>
            <Field label="Alat"><Select id="select-daily-tool" value={daily.tool} options={dailyEquipment[daily.surveyType]} disabled={sourceReadOnly} onChange={v=>setDaily(d=>({...d,tool:v,technicalData:{...d.technicalData,...(daily.surveyType==='IRI'?{iriClass:v==='IRI Tipe Respon'?'Kelas 3':'Kelas 1'}:daily.surveyType==='Lendutan'?{method:v==='LWD'?'LWD':'FWD'}:{})}}))}/></Field>
            <Field label="Operator"><input data-testid="input-daily-operator" value={daily.operator} readOnly={sourceReadOnly} onChange={e=>setDaily(d=>({...d,operator:e.target.value}))}/></Field>
            <Field label="Pengemudi"><input data-testid="input-daily-driver" value={daily.driver} readOnly={sourceReadOnly} onChange={e=>setDaily(d=>({...d,driver:e.target.value}))}/></Field>
            <Field label="POI"><input data-testid="input-daily-poi" value={daily.poi} readOnly={sourceReadOnly} onChange={e=>setDaily(d=>({...d,poi:e.target.value}))}/></Field>
            {['IRI','PCI'].includes(daily.surveyType)&&<CheckRow id="daily-surface-dry" label="Permukaan kering" checked={daily.surfaceDry} onChange={v=>setDaily(d=>({...d,surfaceDry:v}))}/>}
            {daily.surveyType==='PCI'&&<CheckRow id="daily-glare-free" label="Tidak melawan silau matahari (citra)" checked={daily.glareFree} onChange={v=>setDaily(d=>({...d,glareFree:v}))}/>}
            {daily.surveyType==='IRI'&&<CheckRow id="daily-speed-lane" label="Kecepatan konstan & jejak roda sesuai" checked={daily.speedAndLaneCompliant} onChange={v=>setDaily(d=>({...d,speedAndLaneCompliant:v}))}/>}

            {dailyFields(daily).map(field=><Field key={field.key} label={field.label.replace(' (simulasi)','')}>{field.options
              ? <select data-testid={`input-daily-technical-${field.key}`} value={daily.technicalData?.[field.key]??''} disabled={sourceReadOnly} onChange={e=>{const value=e.target.value;setDaily(d=>({...d,technicalData:{...d.technicalData,[field.key]:value},...(field.key==='method'?{tool:value==='LWD'?'LWD':'FWD Dynatest'}:field.key==='iriClass'?{tool:value==='Kelas 3'?'IRI Tipe Respon':'Profilometer Laser'}:{})}));setDailyTool({});}}><option value="">Pilihâ€¦</option>{field.options.map(o=><option key={o}>{o}</option>)}</select>
              : <input type={field.numeric?'number':'text'} step="any" data-testid={`input-daily-technical-${field.key}`} value={daily.technicalData?.[field.key]??''} readOnly={sourceReadOnly} onChange={e=>{const value=e.target.value;setDaily(d=>({...d,technicalData:{...d.technicalData,[field.key]:value}}));}}/>}</Field>)}
            <Field label="Faktor pengganggu"><input data-testid="input-daily-disturbances" value={daily.disturbances} onChange={e=>setDaily(d=>({...d,disturbances:e.target.value}))}/></Field>
            <Field label="Catatan event"><input data-testid="input-daily-events" value={daily.eventNotes} onChange={e=>setDaily(d=>({...d,eventNotes:e.target.value}))}/></Field>
            <Field label="Ringkasan hasil / nilai referensi"><input data-testid="input-daily-raw" value={daily.rawValue} readOnly={sourceReadOnly} onChange={e=>setDaily(d=>({...d,rawValue:e.target.value}))} placeholder={sourceReadOnly?"Menunggu data dari sistem sumber":"Isi ringkasan dari sumber kegiatan"}/></Field>
            <Field label="Nilai yang ditampilkan di QA/QC"><input data-testid="input-daily-cleaned" value={daily.rawValue} readOnly/></Field>
            <div className="wf-callout wf-field full">Data sumber tetap menjadi referensi utama. Bila ada ketidaksesuaian, catat temuan/tindak lanjut dan gunakan hasil terbaru setelah perbaikan diverifikasi.</div>
          </div>}
          <div className={`wf-callout ${gate?'':sourceReadOnly?'':'danger'}`} style={{marginTop:12}}>{sourceReadOnly?'Status: menunggu data kegiatan dari sistem sumber.':<>Gerbang berantai <strong>{gate?'LOLOS':'TAHAN'}</strong> Â· persiapan {preparationReady?'lulus':'tertahan'}, kalibrasi {calibrationReady?'siap':'tertahan'}, metode {methodApproved?'disetujui':'belum disetujui'}, izin jembatan {!bridgePermitRequired||state.bridgeInspectionPermit?'siap':'tertahan'}, kondisi lapangan {fieldQuality?'sesuai':'perlu diperiksa'}.</>}</div>
          {!!technicalErrors.length&&<div className="wf-callout warn" style={{marginTop:8}}><strong>Status kelengkapan:</strong><div className="wf-pill-list" style={{marginTop:7}}>{incompleteItems.length>0&&<span className="wf-pill">{incompleteItems.length} data belum lengkap</span>}{checkItems.length>0&&<span className="wf-pill">{checkItems.length} hal perlu diperiksa</span>}</div><details style={{marginTop:7}}><summary>Lihat rincian</summary><ul>{technicalErrors.map((error,i)=><li key={`${i}-${error}`}>{error}</li>)}</ul></details></div>}
          <div className="wf-toolbar"><Button id="button-daily-resurvey" kind="danger" disabled={sourceReadOnly||!stageReady||state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} onClick={()=>setDaily(d=>({...d,state:'Survei Ulang'}))}><RotateCcw size={13}/>Tandai survei ulang</Button><Button id="button-daily-save" kind="primary" disabled={sourceReadOnly||!stageReady||state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'||(!fieldQuality&&daily.state!=='Survei Ulang')} onClick={saveRecord}><Save size={13}/>{daily.state==='Survei Ulang'?'Catat kebutuhan survei ulang':'Catat lapangan'}</Button></div>
        </Panel>
        <div>
          <Panel title="Pemeriksaan harian alat" icon={Wrench}>{sourceReadOnly?<div className="wf-callout">Checklist harian akan mengikuti jenis alat/metode pada rekaman yang diterima dari sistem sumber.</div>:<>{toolChecks.map(k=><CheckRow key={k} id={`daily-tool-${testId(k)}`} label={k} checked={!!dailyTool[k]} onChange={v=>toggleMap(dailyTool,k,v,setDailyTool)}/>)}<p className="wf-note">Checklist tersimpan bersama rekaman saat dicatat.</p></>}</Panel>
          <Panel title="Pengamanan data harian" icon={HardDrive}><div className="wf-callout warn">Catat media pengamanan data yang digunakan untuk menjaga ketersediaan salinan kegiatan survei.</div><div className="wf-pill-list">{['Perangkat kerja','Media eksternal','Penyimpanan jaringan'].map(m=><label className="wf-pill" key={m}><input type="checkbox" data-testid={`check-backup-media-${testId(m)}`} checked={backupMedia.includes(m)} onChange={e=>setBackupMedia(old=>e.target.checked?[...old,m]:old.filter(x=>x!==m))}/>{m}</label>)}</div><div className="wf-toolbar" style={{marginTop:10}}><Button id="button-create-daily-backup" disabled={!state.dailyRecords.length} onClick={makeBackup}><Archive size={13}/>Catat pengamanan</Button><Badge tone="info">{state.backups.length} catatan pengamanan</Badge></div></Panel>
          {weeklySummary}
          {stage3AGate}
        </div>
      </div>}
       {!canEnterDaily&&<Panel title="Monitoring kegiatan lapangan" icon={Eye}><div className="wf-callout">Pada peran ini, Survei Harian ditampilkan sebagai monitoring. Pencatatan kegiatan dan bukti dilakukan oleh Penyedia Jasa / Ketua Tim; Balai meninjau hasilnya pada proses verifikasi/validasi.</div><div className="wf-kpis"><div className="wf-kpi"><div className="wf-kpi-label">Rekaman tercatat</div><div className="wf-kpi-value">{state.dailyRecords.filter(r=>r.state==='Tercatat').length}</div></div><div className="wf-kpi"><div className="wf-kpi-label">Data ditahan</div><div className="wf-kpi-value">{state.dailyRecords.filter(r=>r.state==='Ditahan').length}</div></div><div className="wf-kpi"><div className="wf-kpi-label">Survei ulang</div><div className="wf-kpi-value">{state.dailyRecords.filter(r=>r.state==='Survei Ulang').length}</div></div></div></Panel>}
       <Panel title="Bukti kegiatan survei" icon={FileText}>
         <div className="stage-evidence-grid">
           <EvidenceAttachment
             packageId={state.project.id}
             evidenceId={`stage3a-${daily.surveyType}-evidence`}
             label={`Bukti kegiatan ${daily.surveyType}`}
             editable={canEnterDaily}
           />

           <EvidenceAttachment
             packageId={state.project.id}
             evidenceId={`stage3a-${daily.surveyType}-daily-check`}
             label="Checklist / catatan pemeriksaan harian"
             editable={canEnterDaily}
           />
         </div>

         {!canEnterDaily&&(
           <div className="wf-note" style={{marginTop:8}}>
             Bukti kegiatan ditampilkan read-only. Pencatatan dan pelengkapan bukti dilakukan oleh Penyedia Jasa / Ketua Tim.
           </div>
         )}
       </Panel>

       <Panel title="Rekaman lapangan terbaru" icon={ClipboardList}>{state.dailyRecords.length?<div className="wf-table"><table data-testid="table-daily-records"><thead><tr><th>ID / waktu</th><th>Jenis Â· ruas Â· km</th><th>Lajur / arah</th><th>Cuaca / alat</th><th>Raw â†’ cleaned</th><th>Status / pemeriksaan</th></tr></thead><tbody>{state.dailyRecords.map(r=><tr key={r.id} data-testid={`row-daily-${r.id}`}><td>{r.id}<div className="wf-note">{r.date} {r.time}</div></td><td>{r.surveyType} Â· {r.road}<div className="wf-note">{r.lengthKm} km Â· {r.surveyType==='Lalu Lintas'?`${r.trafficDurationMinutes} menit Â· `:''}POI {r.poi||'â€”'}</div><details><summary>Metadata teknis</summary>{r.technicalData?dailyFields(r).map(f=><div className="wf-note" key={f.key}>{f.label}: {r.technicalData?.[f.key]||'â€”'}</div>):<span className="wf-note">Rekaman lama; metadata acuan 2026 belum diperiksa.</span>}</details></td><td>{r.lane} Â· {r.direction}</td><td>{r.weather} Â· {r.tool}<div className="wf-note">{r.operator} / {r.driver}</div></td><td>{r.rawValue} â†’ {r.cleanedValue||'â€”'}<div className="wf-note">{r.cleaningReason||'Tanpa koreksi'}</div></td><td><Badge tone={r.state==='Tercatat'?'good':'warn'}>{r.state}</Badge><div className="wf-note">{dailyChecks(r).filter(k=>r.dailyToolCheck[k]).length}/{dailyChecks(r).length} pemeriksaan</div></td></tr>)}</tbody></table></div>:<div className="wf-empty">Belum ada rekaman tersimpan. Lengkapi metadata dan gerbang kondisi untuk mencatat.</div>}</Panel>
       {!canEnterDaily&&<>{weeklySummary}{stage3AGate}</>}
    </>;
  };

  const switchStage3BPeriod=(number:number)=>{
    if(number===activeStage3BPeriod)return;
    onUpdate(current=>{
      const history={...(current.cycleHistory||{}),[String(activeStage3BPeriod)]:{...current.cycle}};
      const target=history[String(number)];
      const fresh:VervalCycle={...current.cycle,
        lastCompletedDate:'',periodCompleted:false,heldRecordIds:[],checkedProtocols:{},
        iriCoefficientVariation:null,pciAiStandardDeviation:null,reRatingStatus:'Belum Diperiksa',
        consistency:'Belum Diperiksa',bridgeFieldValidation:false,finalPeriodValidation:false,
        certificateId:'',userReview:'Belum Diperiksa',userReviewNote:'',affectedTool:''};
      return {...current,cycleHistory:history,cycle:target?{...target}:{...fresh}};
    },'Pilih periode verval',`Periode ${number}`);
    setActiveStage3BPeriod(number);
    setDraft(d=>({...d,cycleBa:''}));
    setStage3BCompletion({consistency:false,internal:false,periodic14:false});
  };

  const cycleScreen=()=>{
    const due=daysBetween(state.simulationDate,dueCycle);
    const consistencyResult=evaluateCycleConsistency(selectedCycleTypes,state.cycle.iriCoefficientVariation,state.cycle.pciAiStandardDeviation,state.cycle.reRatingStatus);
    const canPrepareCycle=state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin';
    const canReviewCycle=state.role==='PIC Balai / Pengguna Jasa'||state.role==='Admin';
    const allProtocols=[...selectedCycleTypes.flatMap(t=>CYCLE_PROTOCOLS[t].map(p=>`${t} Â· ${p}`)),...CYCLE_SHARED_PROTOCOLS];
    const checked=allProtocols.filter(x=>state.cycle.checkedProtocols[x]).length;
    const updateConsistencyMetric=(key:'iriCoefficientVariation'|'pciAiStandardDeviation',value:number|null)=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa diperlukan untuk mencatat hasil konsistensi.');return;}
      const iriCv=key==='iriCoefficientVariation'?value:state.cycle.iriCoefficientVariation;
      const pciSd=key==='pciAiStandardDeviation'?value:state.cycle.pciAiStandardDeviation;
      updateCycle({[key]:value,consistency:evaluateCycleConsistency(selectedCycleTypes,iriCv,pciSd,state.cycle.reRatingStatus)},`Catat ${key==='iriCoefficientVariation'?'IRI CV':'PCI AI SD'} verval`);
    };
    const updateReRating=(value:VervalCycle['reRatingStatus'])=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa diperlukan untuk mencatat penilaian ulang.');return;}
      updateCycle({reRatingStatus:value,consistency:evaluateCycleConsistency(selectedCycleTypes,state.cycle.iriCoefficientVariation,state.cycle.pciAiStandardDeviation,value)},'Catat kesesuaian penilaian ulang');
    };
    const updateProtocol=(key:string,value:boolean)=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa diperlukan untuk mengisi protokol verval.');return;}
      updateCycle({checkedProtocols:{...state.cycle.checkedProtocols,[key]:value}},'Checklist protokol verval');
    };
    const holdLast14Days=()=>{
    const failedTypes=selectedCycleTypes.filter(type=>type==='IRI'&&(state.cycle.iriCoefficientVariation??0)>5||type==='PCI'&&(state.cycle.pciAiStandardDeviation??0)>8||state.cycle.reRatingStatus==='Tidak Sesuai');
    const heldIds=state.dailyRecords.filter(record=>record.state==='Tercatat'&&(failedTypes.length?failedTypes:selectedCycleTypes).includes(record.surveyType)&&state.project.routes.includes(record.road)&&(!state.cycle.affectedTool||record.tool===state.cycle.affectedTool)&&daysBetween(record.date,state.simulationDate)>=0&&daysBetween(record.date,state.simulationDate)<14).map(record=>record.id);
      commit('Tahan data 14 hari terakhir',heldIds.join(', ')||state.project.packageName,s=>{
        const invalidated=invalidateVervalStages(s,'Verval tidak konsisten; selesaikan koreksi dan ulangi validasi, penyerahan, dan audit.');
        return {...invalidated,cycle:{...s.cycle,consistency:'Tidak Konsisten',certificateId:'',heldRecordIds:[...new Set([...s.cycle.heldRecordIds,...heldIds])]},dailyRecords:s.dailyRecords.map(record=>heldIds.includes(record.id)?{...record,state:'Ditahan'}:record)};
      },heldIds.length?'Data lapangan pada rentang 14 hari terakhir ditahan':'Konsistensi gagal; belum ada catatan lapangan di rentang 14 hari untuk ditandai');
    };
    const saveCycle=()=>{
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('BA verval berkala dicatat oleh PIC Balai / Pengguna Jasa setelah review.');return;}
      if(!stage3BCompletion.consistency||!stage3BCompletion.internal||!stage3BCompletion.periodic14||!selectedCycleTypes.length||checked!==allProtocols.length||consistencyResult!=='Konsisten'||state.cycle.userReview!=='Sesuai'||!(draft.cycleBa??state.cycle.certificateId).trim()){setNotice('Verval tertahan: evidence/protokol harus lengkap, system-check konsisten, keputusan Balai harus Sesuai, dan nomor BA harus terisi.');return;}
      if(state.corrections.some(item=>item.source==='Konsistensi gagal'&&item.status!=='Ditutup')){setNotice('Tahan data masih memiliki kasus koreksi terbuka; selesaikan dan uji ulang terlebih dahulu.');return;}
      const certificateId=(draft.cycleBa??state.cycle.certificateId).trim();
      const heldIds=new Set(state.cycle.heldRecordIds);
      commit('Catat BA verval Balai 14 hari',certificateId,s=>{
        const invalidated=invalidateVervalStages(s,'BA verval baru tercatat; validasi LRS dan audit perlu diulang.');
        return {...invalidated,cycle:{...s.cycle,lastCompletedDate:s.simulationDate,certificateId,consistency:'Konsisten',heldRecordIds:[]},dailyRecords:s.dailyRecords.map(record=>heldIds.has(record.id)&&record.state==='Ditahan'?{...record,state:'Tercatat'}:record)};
      });
      setNotice('BA verval Balai dicatat pada paket saat ini.');
    };
    const updateFieldValidation=(key:'bridgeFieldValidation'|'finalPeriodValidation',value:boolean)=>{
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Peran PIC Balai / Pengguna Jasa diperlukan untuk validasi lapangan dan periode.');return;}
      updateCycle({[key]:value},key==='bridgeFieldValidation'?'Validasi lapangan jembatan':'Validasi akhir periode');
    };
    const reviewEvidence=(patch:Partial<VervalCycle>)=>{
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Pemeriksaan proses, validasi lapangan dan bukti akhir dicatat oleh Pengguna Jasa.');return;}
      updateCycle(patch,'Catat pemeriksaan Pengguna Jasa dan bukti akhir periode');
      if(patch.userReview==='Temuan'&&!state.corrections.some(c=>c.source==='Temuan proses verval'&&c.status!=='Ditutup')){
        const c={...defaultCase(state),source:'Temuan proses verval',blockedStage:'Verval 14 hari',returnStage:'Verval 14 hari',rejectionReason:state.cycle.userReviewNote||'Pengguna Jasa menemukan ketidaksesuaian proses/hasil verval'};
        commit('Buka kasus dari pemeriksaan proses verval',c.id,s=>({...s,corrections:[c,...s.corrections]}));
      }
    };
    return <>{heading('Tahap 3B Â· verifikasi dan validasi berkala','Verval berkala 14 hari','Penyedia menyiapkan bukti dan checklist periode; hasil pemeriksaan dirangkum sistem, lalu PIC Balai / Pengguna Jasa meninjau, memberi catatan/keputusan, dan mencatat BA berkala.')}
      <Panel title="Berita Acara Periode" icon={FileText}>
        <p className="wf-note">Pilih BA sesuai kegiatan. Paket dan periode aktif terisi otomatis; draft belum berarti disetujui.</p>
        <div className="wf-toolbar" style={{flexWrap:'wrap'}}>
          {baAccess('konsistensi','Susun BA Konsistensi',activeStage3BPeriod)}
          {baAccess('internal','Susun BA V&V Internal',activeStage3BPeriod)}
          {baAccess('duaMingguan','Susun BA V&V 2-Mingguan',activeStage3BPeriod)}
        </div>
      </Panel>
      <Stage3BPeriodSelector packageId={state.project.id} activePeriod={activeStage3BPeriod} onPeriodChange={switchStage3BPeriod} onRangeChange={setStage3BPeriodRange}
        surveyStartDate={state.project.surveyStartDate} surveyEndDate={state.project.surveyEndDate}
        editable={state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin'} />
      <Stage3BSourceChecklist
  projectInfo={state.project}
  packageId={activeStage3BPeriod===1?state.project.id:`${state.project.id}::period-${activeStage3BPeriod}`}
  surveyTypes={
    selectedCycleTypes.length
      ? selectedCycleTypes
      : state.project
          .surveyTypes
  }
  role={state.role}
  periodStart={stage3bPeriodRange.start}
  periodEnd={stage3bPeriodRange.end}
  onCompletionChange={onStage3BCompletion}
/>

      <Panel title="Bukti Verval Berkala" icon={FileText}>
        <div className="stage-evidence-grid">
          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId={`stage3b-repeatability-${activeStage3BPeriod}`}
            label="Bukti repeatability / hasil pemeriksaan berkala"
            editable={canPrepareCycle}
          />

          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId={`stage3b-supporting-evidence-${activeStage3BPeriod}`}
            label="Bukti pendukung periode"
            editable={canPrepareCycle}
          />

        </div>
      </Panel>
      <div className="wf-grid">
        <Panel title="Jadwal siklus" icon={CalendarClock}>
          <div className="wf-kpis">
            <div className="wf-kpi"><div className="wf-kpi-label">Periode aktif</div><div className="wf-kpi-value">{activeStage3BPeriod}</div></div>
            <div className="wf-kpi"><div className="wf-kpi-label">Mulai periode</div><div className="wf-kpi-value" style={{fontSize:13}}>{stage3bPeriodRange.start||'Jadwal belum tersedia'}</div></div>
            <div className="wf-kpi"><div className="wf-kpi-label">Akhir periode</div><div className="wf-kpi-value" style={{fontSize:13}}>{stage3bPeriodRange.end||'Jadwal belum tersedia'}</div></div>
          </div>
          <div className="wf-note">Jadwal berasal dari periode survei aktif; tidak otomatis menjadi hasil review atau BA.</div>
        </Panel>
        <Panel title="Cakupan pemeriksaan periode" icon={ClipboardList}>
          <p className="wf-note">Jenis survei berikut berasal dari lingkup paket. Ini bukan daftar untuk menghapus kewajiban pemeriksaan. Pemeriksaan yang berlaku mengikuti jenis survei, dokumen sumber, dan periode aktif.</p>
          <div className="wf-pill-list" style={{marginTop:10}}>
            {state.project.surveyTypes.map(type=><span className="wf-pill" key={type}><CheckCircle2 size={12}/>{type}</span>)}
          </div>
          <div className="wf-note" style={{marginTop:10}}>
            {state.cycle.periodCompleted ? 'Penyedia telah menandai periode sebagai selesai.' : 'Periode belum ditandai selesai oleh Penyedia.'}
          </div>
          {canPrepareCycle && <CheckRow id="cycle-period-completed" label="Tandai akhir pemeriksaan periode ini" checked={state.cycle.periodCompleted} onChange={value=>updateCycle({periodCompleted:value},'Tandai akhir pemeriksaan periode')}/>}
        </Panel>
      </div>
      <div className="wf-grid">
        
        <div>
           
          <Panel title="Hasil pemeriksaan teknis dan bukti" icon={FileCheck2}>
            <div className="workflow-data-origin">
              <span className="origin-badge provider">{canPrepareCycle?'INPUT PENYEDIA / FALLBACK':'HASIL PEMERIKSAAN'}</span>
              <div>
                <strong>{canPrepareCycle?'Lengkapi hasil bila integrasi sumber belum tersedia':'Hasil yang disiapkan Penyedia'}</strong>
                <span>Nilai di bawah saat ini berasal dari rekaman workflow, bukan diklaim telah tersinkronisasi dari API SMD Jalan. Jika integrasi tersedia, nilai dari sumber harus ditampilkan otomatis dan read-only. Pemeriksaan sistem menilai nilai yang tercatat terhadap batas yang relevan.</span>
              </div>
            </div>
             {selectedCycleTypes.includes('IRI')&&<Field label="IRI CV (maks. 5%)"><input type="number" min="0" step="0.1" data-testid="input-cycle-iri-cv" value={state.cycle.iriCoefficientVariation??''} readOnly={!canPrepareCycle} onChange={e=>updateConsistencyMetric('iriCoefficientVariation',e.target.value===''?null:Number(e.target.value))}/></Field>}
             {selectedCycleTypes.includes('PCI')&&<Field label="PCI AI SD (maks. 8)"><input type="number" min="0" step="0.1" data-testid="input-cycle-pci-ai-sd" value={state.cycle.pciAiStandardDeviation??''} readOnly={!canPrepareCycle} onChange={e=>updateConsistencyMetric('pciAiStandardDeviation',e.target.value===''?null:Number(e.target.value))}/></Field>}
             <Field label="Penilaian ulang visual"><Select id="select-cycle-rerating" value={state.cycle.reRatingStatus} options={['Belum Diperiksa','Sesuai','Tidak Sesuai']} disabled={!canPrepareCycle} onChange={v=>updateReRating(v as VervalCycle['reRatingStatus'])}/></Field>
             <div className={`wf-callout ${consistencyResult==='Konsisten'?'':'danger'}`} data-testid="cycle-consistency-result">Hasil pemeriksaan konsistensi: <strong>{consistencyResult}</strong>. Parameter mengikuti acuan teknis yang berlaku pada jenis survei.</div>
             {selectedCycleTypes.includes('Jembatan')&&<CheckRow id="cycle-bridge-field-validation" label="Validasi lapangan jembatan oleh Pengguna Jasa" checked={state.cycle.bridgeFieldValidation} disabled={!canReviewCycle} onChange={v=>updateFieldValidation('bridgeFieldValidation',v)}/>}
             {state.cycle.periodCompleted&&<CheckRow id="cycle-final-period-validation" label="Validasi periode akhir" checked={state.cycle.finalPeriodValidation} disabled={!canReviewCycle} onChange={v=>updateFieldValidation('finalPeriodValidation',v)}/>}
             <Field label="Alat/rater terkait data yang ditahan" full><input data-testid="input-cycle-affected-tool" value={state.cycle.affectedTool??''} readOnly={!canPrepareCycle} onChange={e=>updateCycle({affectedTool:e.target.value},'Identifikasi alat terkait HOLD')} placeholder="Nama alat; kosong = seluruh alat jenis yang gagal"/></Field>
             <div className="wf-toolbar" style={{marginTop:10}}>
               <Button id="button-cycle-hold" kind="danger" disabled={!canPrepareCycle||consistencyResult!=='Tidak Konsisten'} onClick={holdLast14Days}>Tahan data periode</Button>
               <Button id="button-cycle-create-case" disabled={!canPrepareCycle||consistencyResult!=='Tidak Konsisten'||state.corrections.some(item=>item.source==='Konsistensi gagal'&&item.status!=='Ditutup')} onClick={()=>{if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa diperlukan.');return;}const c={...defaultCase(state),source:'Konsistensi gagal',blockedStage:'Verval 14 hari',returnStage:'Verval 14 hari',rejectionReason:'Hasil verval tidak konsisten'};commit('Buka kasus verval',c.id,s=>({...s,corrections:[c,...s.corrections]}));}}>Buka kasus</Button>
               <Button id="button-cycle-complete" kind="primary" onClick={saveCycle} disabled={state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'||!stage3BCompletion.consistency||!stage3BCompletion.internal||!stage3BCompletion.periodic14||!selectedCycleTypes.length||checked!==allProtocols.length||consistencyResult!=='Konsisten'||state.cycle.userReview!=='Sesuai'||!(draft.cycleBa??state.cycle.certificateId).trim()}>Catat BA Balai</Button>
             </div>
             {state.cycle.heldRecordIds.length>0&&<div className="wf-callout danger" style={{marginTop:9}}>{state.cycle.heldRecordIds.length} rekaman dalam periode ditahan sampai koreksi ditutup dan verval ulang lulus.</div>}
            {state.cycle.consistency==='Tidak Konsisten'&&<div className="wf-callout danger" style={{marginTop:9}}>HOLD aktif Â· data 14 hari terakhir belum boleh diteruskan. Hasil uji ulang harus konsisten sebelum kembali.</div>}
          </Panel>
        </div>
      </div>
      <Panel title={canReviewCycle?'Form review PIC Balai':'Hasil review PIC Balai'} icon={ClipboardCheck}>
        {canReviewCycle ? (
          <>
            <div className="wf-callout">Khusus PIC Balai / Pengguna Jasa: periksa data, hasil konsistensi, checklist dan evidence Penyedia sebelum memberikan keputusan. Temuan harus ditindaklanjuti dan tidak boleh dianggap lolos.</div>
            <div className="wf-fields">
              <Field label="Catatan hasil pemeriksaan" full>
                <textarea data-testid="input-cycle-user-review-note" rows={3} value={state.cycle.userReviewNote??''} onChange={e=>reviewEvidence({userReviewNote:e.target.value})} placeholder="Tuliskan catatan Balai, temuan, atau alasan keputusan" />
              </Field>
              <Field label="Keputusan review Pengguna Jasa">
                <Select id="select-cycle-user-review" value={state.cycle.userReview??'Belum Diperiksa'} options={['Belum Diperiksa','Sesuai','Temuan']} onChange={v=>reviewEvidence({userReview:v as VervalCycle['userReview']})}/>
              </Field>
              {selectedCycleTypes.includes('Jembatan')&&<>
                <Field label="Cakupan validasi jembatan (%)"><input data-testid="input-cycle-bridge-percent" type="number" min="0" max="100" value={state.cycle.bridgeValidatedPercent??''} onChange={e=>reviewEvidence({bridgeValidatedPercent:Number(e.target.value)})}/></Field>
                <Field label="Referensi laporan validasi lapangan"><input data-testid="input-cycle-bridge-report" value={state.cycle.bridgeValidationReport??''} onChange={e=>reviewEvidence({bridgeValidationReport:e.target.value})}/></Field>
              </>}
              {state.cycle.periodCompleted && <>
                <Field label="Lokasi uji validasi akhir"><input data-testid="input-cycle-final-location" value={state.cycle.finalValidationLocation??''} onChange={e=>reviewEvidence({finalValidationLocation:e.target.value})} placeholder="Isi bila pemeriksaan akhir dilakukan"/></Field>
                <CheckRow id="cycle-tool-unchanged" label="Uji akhir membuktikan alat tidak berubah" checked={!!state.cycle.finalToolUnchanged} onChange={v=>reviewEvidence({finalToolUnchanged:v})}/>
              </>}
              <Field label="Nomor BA V&V 2-Mingguan (bila sudah diterbitkan)">
                <input data-testid="input-cycle-ba" value={draft.cycleBa??state.cycle.certificateId} onChange={e=>saveText('cycleBa',e.target.value)} placeholder="Belum ada nomor BA" />
              </Field>
            </div>
            <p className="wf-note">Nomor BA dan keputusan hanya dicatat oleh PIC Balai. Draft dan finalisasi BA terstruktur akan ditangani pada modul BA berikutnya.</p>
          </>
        ) : (
          <div className="package-readonly-grid">
            <div><small>Keputusan Pengguna Jasa</small><strong>{state.cycle.userReview??'Belum Diperiksa'}</strong></div>
            <div><small>Nomor BA V&V 2-Mingguan</small><strong>{state.cycle.certificateId||'Belum diterbitkan'}</strong></div>
            <div className="wide"><small>Catatan PIC Balai</small><strong>{state.cycle.userReviewNote?.trim()||'Belum ada catatan dari PIC Balai'}</strong></div>
            {selectedCycleTypes.includes('Jembatan')&&<div><small>Validasi jembatan</small><strong>{state.cycle.bridgeValidatedPercent===undefined?'Belum tercatat':`${state.cycle.bridgeValidatedPercent}%`}</strong></div>}
            {state.cycle.periodCompleted&&<>
              <div><small>Lokasi uji validasi akhir</small><strong>{state.cycle.finalValidationLocation||'Belum dicatat'}</strong></div>
              <div><small>Konfirmasi kondisi alat</small><strong>{state.cycle.finalToolUnchanged?'Sudah dikonfirmasi':'Belum dikonfirmasi'}</strong></div>
            </>}
            <div className="wide"><small>Akses</small><strong>{state.role==='Direktorat / Pusat'?'Monitoring Direktorat — hanya baca':'Hasil review Balai — hanya baca untuk Penyedia'}</strong></div>
          </div>
        )}
      </Panel>
      <GateSummary title="Gerbang Tahap 3 â†’ Tahap 4" items={[
        {label:'Periode survei selesai',ready:state.cycle.periodCompleted,detail:state.cycle.periodCompleted?'Ditandai selesai':'Masih dalam masa survei'},
        {
  label:
    'Checklist Konsistensi lengkap',
  ready:
    stage3BCompletion
      .consistency,
},

{
  label:
    'Validasi Internal lengkap',
  ready:
    stage3BCompletion
      .internal,
},

{
  label:
    'V&V 2-Mingguan lengkap',
  ready:
    stage3BCompletion
      .periodic14,
},
        {label:'System-check konsistensi',ready:consistencyResult==='Konsisten',detail:consistencyResult},
        {label:'Keputusan Balai',ready:state.cycle.userReview==='Sesuai',detail:state.cycle.userReview??'Belum Diperiksa'},
        {label:'BA verval Balai',ready:!!state.cycle.certificateId,detail:state.cycle.certificateId||'Belum dicatat'},
        {label:'Tidak ada HOLD / kasus verval terbuka',ready:state.cycle.heldRecordIds.length===0&&!state.corrections.some(c=>c.blockedStage==='Verval 14 hari'&&c.status!=='Ditutup'),detail:state.cycle.heldRecordIds.length?`${state.cycle.heldRecordIds.length} rekaman ditahan`:'Tidak ada rekaman ditahan'},
      ]}/></>;
  };

  const submissionScreen=()=>{
    const canPrepare=state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin';
    const documentItems=[...SUBMISSION_DOCUMENTS];
    const docsPassed=documentItems.every(x=>state.submission.requiredDocuments[x]);
    const requiredTargets=SYSTEM_TARGET_ORDER.filter(system=>state.project.surveyTypes.some(type=>systemsByType[type]===system));
    const targetAssignments=requiredTargets.map(system=>({system,types:state.project.surveyTypes.filter(type=>systemsByType[type]===system)}));
    const targetsPassed=requiredTargets.length>0;
    const packageReferenced=!!state.submission.rawFileName.trim()&&!!state.submission.cleanedFileName.trim();
    const fieldErrors=fieldReadiness(state);
    const preAuditReady=!fieldErrors.length&&lrs.passed&&docsPassed&&packageReferenced;
    const readyToSubmit=preAuditReady&&state.audits[0].status==='Lulus'&&targetsPassed;
    const updateReq=(key:string,value:boolean)=>updateSubmission({requiredDocuments:{...state.submission.requiredDocuments,[key]:value}},'Periksa dokumen mutu');
    const validate=()=>{
      if(!canPrepare){setNotice('Penyiapan dan penyerahan paket data dilakukan oleh Penyedia Jasa / Ketua Tim.');return;}
      if(!readyToSubmit){setNotice('Penyerahan masih tertahan. Pastikan Tahap 3 selesai, dokumen mutu lengkap, gerbang RNI/LRS lulus, paket data tersedia, Audit Tingkat 1 lulus, dan tujuan sistem sesuai jenis survei.');return;}
      const result=evaluateLrsGate(state.submission,state.simulationDate);
      if(!result.passed){setNotice('Gerbang RNI/LRS belum lulus. Tindak lanjuti ketidaksesuaian sebelum penyerahan.');return;}
      const destination=requiredTargets.join(', ');
      updateSubmission({targetSystems:requiredTargets,validationStatus:'VALID',validationMessage:`Paket data siap diteruskan ke ${destination}.`},'Konfirmasi kesiapan penyerahan');
      setNotice(`Paket data ditandai siap diteruskan ke ${destination}.`);
    };
    const openLrsCase=()=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Peran ini hanya dapat memantau hasil gerbang RNI/LRS.');return;}
      const existing=state.corrections.find(item=>item.source==='Validasi sistem LRS'&&item.status!=='Ditutup');
      if(existing){setCaseId(existing.id);setNotice('Kasus RNI/LRS terbuka sudah ada. Lanjutkan pada Tindakan Perbaikan.');return;}
      const surveyType=state.project.surveyTypes.includes('RNI')?'RNI':state.project.surveyTypes[0]||'IRI';
      const c=defaultCase(state);
      c.source='Validasi sistem LRS';c.blockedStage='Gerbang RNI/LRS';c.returnStage='Gerbang RNI/LRS';c.surveyType=surveyType;
      c.originalValue=state.dailyRecords.find(record=>record.surveyType===surveyType)?.rawValue||'Belum ada nilai sumber tertaut';
      c.rejectionReason=lrs.checks.filter(check=>!check.pass).map(check=>`${check.label}: ${check.actual}`).join(' Â· ')||'Gerbang RNI/LRS belum memenuhi kriteria';
      commit('Buka kasus koreksi gerbang RNI/LRS',c.id,s=>({...s,corrections:[c,...s.corrections]}),'Kasus RNI/LRS dibuka; tindak lanjuti lalu lakukan pemeriksaan ulang');
      setCaseId(c.id);
    };
    const qualityChecks=[
      {label:'Format kode & struktur data',ready:!!state.submission.formatGlossaryCompliant,detail:state.submission.formatGlossaryCompliant?'Sesuai':'Belum dikonfirmasi'},
      {label:'Koordinat dan ikatan LRS',ready:!!state.submission.coordinatesBoundToLrs,detail:state.submission.coordinatesBoundToLrs?'Terikat LRS':'Belum lengkap'},
      {label:'Konsistensi STA antar data',ready:state.submission.stationingConsistent,detail:state.submission.stationingConsistent?'Konsisten':'Perlu diperiksa'},
      {label:'Pemisahan data sumber dan data tervalidasi',ready:state.submission.rawSeparated&&state.submission.cleanedSeparated,detail:state.submission.rawSeparated&&state.submission.cleanedSeparated?'Terpisah':'Belum lengkap'},
      {label:'Topologi/geometri',ready:state.submission.topologyErrors===0&&!!state.submission.geometryFormat,detail:state.submission.geometryFormat?`${state.submission.geometryFormat} Â· ${state.submission.topologyErrors} kesalahan`:'Format belum dipilih'},
    ];
    const isBalaiReview=state.role==='PIC Balai / Pengguna Jasa';
    const stage4Title=canPrepare?'Penyiapan data & gerbang RNI/LRS':isBalaiReview?'Review kesiapan data & gerbang RNI/LRS':'Monitoring kesiapan data & gerbang RNI/LRS';
    const stage4Detail=canPrepare
      ?'Siapkan paket data, lengkapi dokumen mutu, periksa keterikatan RNI/LRS, lalu teruskan paket ke audit.'
      :isBalaiReview
        ?'Tinjau ringkasan kesiapan paket yang disiapkan Penyedia. Perubahan data tetap dilakukan oleh Penyedia sebelum masuk audit.'
        :'Pantau status kesiapan paket sebagai konteks sebelum audit/review tingkat pusat.';
    const readinessItems=[
      {label:'Tahap 3 selesai',ready:fieldErrors.length===0,detail:fieldErrors.length?`${fieldErrors.length} item tahap sebelumnya belum terpenuhi`:'Verval dan pemeriksaan tahap sebelumnya lengkap'},
      {label:'Dokumen mutu lengkap',ready:docsPassed,detail:`${documentItems.filter(x=>state.submission.requiredDocuments[x]).length}/${documentItems.length} dokumen`},
      {label:'Gerbang RNI/LRS',ready:lrs.passed,detail:lrs.passed?'Lulus':'Ada kriteria yang belum terpenuhi'},
      {label:'Paket data tersedia',ready:packageReferenced,detail:packageReferenced?'Data sumber & tervalidasi tercatat':'Referensi paket data belum lengkap'},
    ];
    const auditGateItems=[
      {label:'Penyiapan data lengkap',ready:preAuditReady,detail:preAuditReady?'Siap diaudit':'Lengkapi gerbang dan paket data'},
      {label:'Audit Tingkat 1',ready:state.audits[0].status==='Lulus',detail:state.audits[0].status},
      {label:'Tujuan sistem sesuai',ready:targetsPassed,detail:targetsPassed?`${requiredTargets.length} sistem ditetapkan otomatis`:'Belum ada jenis survei pada paket'},
    ];
    const readOnlyDocRows=documentItems.map((x,i)=><div className="wf-row" key={x} data-testid={`stage4-review-doc-${i}`}><span>{x}</span><Badge tone={state.submission.requiredDocuments[x]?'good':'warn'}>{state.submission.requiredDocuments[x]?'Tercatat':'Belum'}</Badge></div>);
    return <>{heading('Tahap 4 Â· penyiapan data',stage4Title,stage4Detail)}
      <Panel title="Berita Acara V&V Bertahap" icon={FileText}><p className="wf-note">Draft dibuat dari hasil pemeriksaan bertahap, bukan otomatis disahkan.</p>{baAccess('bertahap','Susun BA V&V Bertahap')}</Panel>
      <div className="wf-callout" style={{marginBottom:12}}><strong>{state.role}:</strong> {STAGE4_ROLE_GUIDANCE[state.role]}</div>
      <GateSummary title={canPrepare?'Kesiapan Tahap 4':'Ringkasan kesiapan paket'} items={readinessItems}/>

      <Panel title="Bukti & Paket Data" icon={Archive}>
        <div className="stage-evidence-grid">
          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId="stage4-raw-package"
            label="Paket / referensi data sumber"
            editable={canPrepare}
          />

          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId="stage4-validated-package"
            label="Paket / referensi data tervalidasi"
            editable={canPrepare}
          />

          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId="stage4-quality-document"
            label="Dokumen mutu pendukung"
            editable={canPrepare}
          />
        </div>

        {!canPrepare&&(
          <div className="wf-note" style={{marginTop:8}}>
            Paket data disiapkan oleh Penyedia. Pada peran ini dokumen ditampilkan sebagai bahan review atau monitoring.
          </div>
        )}
      </Panel>
      <div className="wf-callout" data-testid="stage4-process-guide" style={{marginBottom:12}}>
        <strong>Urutan kerja:</strong> Penyedia menyiapkan data sumber dan data tervalidasi terpisah, melengkapi dokumen mutu, lalu memeriksa gerbang RNI/LRS. Setelah audit internal Tingkat 1 dan kesiapan paket terpenuhi, status penyerahan dapat dikonfirmasi. Status VALID di sini adalah catatan workflow, bukan bukti berhasil unggah ke sistem eksternal.
      </div>
      <SourceAlignmentChecklist packageId={state.project.id} phase="staged" surveyTypes={state.project.surveyTypes} role={state.role} editableRoles={['PIC Balai / Pengguna Jasa','Admin']} title="Checklist Verifikasi Data"/>

      {canPrepare?<div className="wf-grid" style={{marginTop:12,alignItems:'start'}}>
        <div style={{display:'grid',gap:12,alignContent:'start'}}>
          <Panel title="Pemeriksaan mutu paket data" icon={ClipboardCheck} extra={<Badge tone={qualityChecks.every(x=>x.ready)?'good':'warn'}>{qualityChecks.filter(x=>x.ready).length}/{qualityChecks.length}</Badge>}>
            {qualityChecks.map((item,i)=><div className="wf-row" key={item.label} data-testid={`stage4-quality-${i}`}><span>{item.label}<span className="wf-note" style={{display:'block'}}>{item.detail}</span></span><Badge tone={item.ready?'good':'warn'}>{item.ready?'Siap':'Periksa'}</Badge></div>)}
            <div className="wf-note" style={{marginTop:10}}>Pemeriksaan mencakup format, kelengkapan, keterikatan spasial, konsistensi antar data, dan kewajaran sebelum paket masuk audit.</div>
          </Panel>
          <Panel title="Dokumen mutu Tahap 0â€“3" icon={BookOpen} extra={<Badge tone={docsPassed?'good':'warn'}>{documentItems.filter(x=>state.submission.requiredDocuments[x]).length}/{documentItems.length}</Badge>}>
            <div className="wf-note" style={{marginBottom:8}}>Pastikan bukti kalibrasi/validasi, verval berkala, temuan, dan tindak lanjut yang diwajibkan sudah tercatat.</div>
            {documentItems.map(x=><CheckRow key={x} id={`submission-doc-${testId(x)}`} label={x} checked={!!state.submission.requiredDocuments[x]} disabled={!canPrepare} onChange={v=>updateReq(x,v)}/>)}
          </Panel>
          <Panel title="Kesiapan integrasi data" icon={ArrowRight} extra={<Badge tone={targetsPassed?'good':'warn'}>{targetsPassed?'Otomatis':'Belum tersedia'}</Badge>}>
            <div className="wf-note" style={{marginBottom:8}}>Tujuan integrasi mengikuti konfigurasi paket dan tidak dipilih manual oleh pengguna.</div>
            {targetAssignments.length?targetAssignments.map(({system,types})=><div className="wf-row" key={system} data-testid={`target-system-${testId(system)}`}><span><strong>{system}</strong><span className="wf-note" style={{display:'block'}}>{types.join(' Â· ')}</span></span><Badge tone="good">Terkonfigurasi</Badge></div>):<div className="wf-callout warn">Belum ada jenis survei pada paket sehingga sistem tujuan belum dapat ditentukan.</div>}
          </Panel>
          <Panel title="Lanjut ke audit & penyerahan" icon={ShieldCheck}>
            <GateSummary title="Gerbang Tahap 4 â†’ Tahap 5" items={auditGateItems}/>
            <div className="wf-callout" style={{marginTop:10}}>{state.submission.validationMessage||'Belum ada konfirmasi kesiapan penyerahan.'}</div>
            <div className="wf-toolbar" style={{marginTop:10}}>
              <Button id="button-go-audit-one" disabled={!preAuditReady} onClick={()=>onNavigate('/verification:Audit tingkat 1â€“3')}><ClipboardCheck size={13}/>Lanjut Audit Tingkat 1</Button>
              <Button id="button-submission-validate" kind="primary" disabled={!readyToSubmit||!canPrepare} onClick={validate}><Check size={13}/>Konfirmasi siap diserahkan</Button>
            </div>
          </Panel>
        </div>
        <div style={{display:'grid',gap:12,alignContent:'start'}}>
          <Panel title="Gerbang RNI / LRS" icon={MapPinned} extra={<Badge tone={lrs.passed?'good':'bad'}>{lrs.passed?'Lulus':'Tertahan'}</Badge>}>
            {lrs.checks.map((c,i)=><div className="wf-row" key={c.label} data-testid={`lrs-gate-check-${i}`}><span>{c.label}<span className="wf-note" style={{display:'block'}}>{c.actual}</span></span><Badge tone={c.pass?'good':'bad'}>{c.pass?'Lulus':'Tertahan'}</Badge></div>)}
            {!lrs.passed&&<div className="wf-toolbar" style={{marginTop:10}}><Button id="button-open-lrs-correction" kind="danger" onClick={openLrsCase}><Wrench size={13}/>Buka tindak lanjut</Button></div>}
            <div className="wf-fields" style={{marginTop:12}}>
              <CheckRow id="submission-route-changed" label="Ada perubahan trase / panjang" checked={state.submission.routeChanged} disabled={!canPrepare} onChange={v=>updateSubmission({routeChanged:v},'Catat perubahan trase')}/>
              <Field label="Deviasi panjang (m)"><input type="number" disabled={!canPrepare} data-testid="input-submission-deviation" value={state.submission.routeLengthDeviation} onChange={e=>updateSubmission({routeLengthDeviation:Number(e.target.value)},'Ubah deviasi panjang')}/></Field>
              <Field label="Format geometri"><Select id="select-submission-geometry" disabled={!canPrepare} value={state.submission.geometryFormat||''} options={['','SHP','GeoJSON']} onChange={v=>updateSubmission({geometryFormat:v as SubmissionState['geometryFormat']},'Pilih format geometri')}/></Field>
              <Field label="Kesalahan topologi"><input type="number" disabled={!canPrepare} data-testid="input-submission-topology" value={state.submission.topologyErrors} onChange={e=>updateSubmission({topologyErrors:Number(e.target.value)},'Ubah hasil topologi')}/></Field>
              <Field label="Tanggal validasi RNI"><input type="date" disabled={!canPrepare} data-testid="input-submission-rni-date" value={state.submission.rniValidatedDate} onChange={e=>updateSubmission({rniValidatedDate:e.target.value},'Ubah tanggal validasi RNI')}/></Field>
              <CheckRow id="submission-stationing" label="STA konsisten antar data" checked={state.submission.stationingConsistent} disabled={!canPrepare} onChange={v=>updateSubmission({stationingConsistent:v},'Validasi STA semua survei')}/>
              <CheckRow id="submission-coordinates" label="Seluruh data berkoordinat dan terikat LRS" checked={!!state.submission.coordinatesBoundToLrs} disabled={!canPrepare} onChange={v=>updateSubmission({coordinatesBoundToLrs:v},'Periksa koordinat dan ikatan LRS')}/>
              <CheckRow id="submission-glossary" label="Format kode & glossary sesuai" checked={!!state.submission.formatGlossaryCompliant} disabled={!canPrepare} onChange={v=>updateSubmission({formatGlossaryCompliant:v},'Periksa format kode & glossary')}/>
              <CheckRow id="submission-raw-separated" label="Data sumber dipisahkan" checked={state.submission.rawSeparated} disabled={!canPrepare} onChange={v=>updateSubmission({rawSeparated:v},'Konfirmasi pemisahan data sumber')}/>
              <CheckRow id="submission-cleaned-separated" label="Data tervalidasi dipisahkan" checked={state.submission.cleanedSeparated} disabled={!canPrepare} onChange={v=>updateSubmission({cleanedSeparated:v},'Konfirmasi pemisahan data tervalidasi')}/>
            </div>
          </Panel>
          <Panel title="Paket data yang disiapkan" icon={Archive}>
            <Field label="Referensi data sumber / raw" full><input disabled={!canPrepare} data-testid="input-submission-raw-file" value={state.submission.rawFileName} onChange={e=>updateSubmission({rawFileName:e.target.value},'Catat referensi data sumber')}/></Field>
            <Field label="Referensi data tervalidasi" full><input disabled={!canPrepare} data-testid="input-submission-clean-file" value={state.submission.cleanedFileName} onChange={e=>updateSubmission({cleanedFileName:e.target.value},'Catat referensi data tervalidasi')}/></Field>
            <Field label="Referensi bukti visual (bila berlaku)" full><input disabled={!canPrepare} data-testid="input-submission-video" value={state.submission.videoLink} onChange={e=>updateSubmission({videoLink:e.target.value},'Catat referensi bukti visual')}/></Field>
            <div className="wf-note">Referensi paket nantinya dapat berasal dari sistem sumber/storage; halaman ini tetap menjadi ringkasan kesiapan QA/QC.</div>
          </Panel>
        </div>
      </div>:
      <div className="wf-grid" style={{marginTop:12,alignItems:'start'}}>
        <div style={{display:'grid',gap:12,alignContent:'start'}}>
          <Panel title={isBalaiReview?'Ringkasan pemeriksaan Penyedia':'Ringkasan mutu paket'} icon={ClipboardCheck} extra={<Badge tone={qualityChecks.every(x=>x.ready)?'good':'warn'}>{qualityChecks.filter(x=>x.ready).length}/{qualityChecks.length}</Badge>}>
            {qualityChecks.map((item,i)=><div className="wf-row" key={item.label} data-testid={`stage4-review-quality-${i}`}><span>{item.label}<span className="wf-note" style={{display:'block'}}>{item.detail}</span></span><Badge tone={item.ready?'good':'warn'}>{item.ready?'Siap':'Perlu tindak lanjut'}</Badge></div>)}
            <div className="wf-callout" style={{marginTop:10}}>{isBalaiReview?'Balai meninjau hasil kesiapan yang disiapkan Penyedia; bila belum sesuai, tindak lanjut dikembalikan ke Penyedia sebelum audit.':'Ringkasan ini menjadi konteks monitoring sebelum audit tingkat pusat.'}</div>
          </Panel>
          <Panel title="Dokumen mutu yang tersedia" icon={BookOpen} extra={<Badge tone={docsPassed?'good':'warn'}>{documentItems.filter(x=>state.submission.requiredDocuments[x]).length}/{documentItems.length}</Badge>}>
            {readOnlyDocRows}
          </Panel>
          <Panel title="Kesiapan integrasi data" icon={ArrowRight} extra={<Badge tone={targetsPassed?'good':'warn'}>{targetsPassed?'Otomatis':'Belum tersedia'}</Badge>}>
            <div className="wf-note" style={{marginBottom:8}}>Tujuan integrasi ditampilkan read-only dan mengikuti konfigurasi paket.</div>
            {targetAssignments.length?targetAssignments.map(({system,types})=><div className="wf-row" key={system} data-testid={`review-target-system-${testId(system)}`}><span><strong>{system}</strong><span className="wf-note" style={{display:'block'}}>{types.join(' Â· ')}</span></span><Badge tone="good">Terkonfigurasi</Badge></div>):<div className="wf-callout warn">Belum ada jenis survei pada paket sehingga sistem tujuan belum dapat ditentukan.</div>}
          </Panel>
          <Panel title={isBalaiReview?'Status menuju Audit Tingkat 1':'Status menuju audit'} icon={ShieldCheck}>
            <GateSummary title="Gerbang Tahap 4 â†’ Tahap 5" items={auditGateItems}/>
            <div className="wf-callout" style={{marginTop:10}}>{state.submission.validationMessage||'Belum ada konfirmasi kesiapan penyerahan dari Penyedia.'}</div>
            {isBalaiReview&&<div className="wf-note" style={{marginTop:10}}>Tahap ini menampilkan kesiapan paket. Keputusan assurance Balai dilakukan pada proses review/audit sesuai kewenangan, bukan dengan mengubah data penyiapan Penyedia di halaman ini.</div>}
          </Panel>
        </div>
        <div style={{display:'grid',gap:12,alignContent:'start'}}>
          <Panel title="Hasil gerbang RNI / LRS" icon={MapPinned} extra={<Badge tone={lrs.passed?'good':'bad'}>{lrs.passed?'Lulus':'Tertahan'}</Badge>}>
            {lrs.checks.map((c,i)=><div className="wf-row" key={c.label} data-testid={`stage4-review-lrs-${i}`}><span>{c.label}<span className="wf-note" style={{display:'block'}}>{c.actual}</span></span><Badge tone={c.pass?'good':'bad'}>{c.pass?'Lulus':'Tertahan'}</Badge></div>)}
            {!lrs.passed&&isBalaiReview&&<div className="wf-callout warn" style={{marginTop:10}}>Ada kriteria RNI/LRS yang belum terpenuhi. Paket belum siap diteruskan; tindak lanjut perlu dilakukan Penyedia pada data/sumber terkait.</div>}
          </Panel>
          <Panel title="Referensi paket data" icon={Archive}>
            <div className="wf-row"><span>Data sumber / raw</span><strong>{state.submission.rawFileName||'Belum tercatat'}</strong></div>
            <div className="wf-row"><span>Data tervalidasi</span><strong>{state.submission.cleanedFileName||'Belum tercatat'}</strong></div>
            <div className="wf-row"><span>Bukti visual</span><strong>{state.submission.videoLink||'Tidak/belum tercatat'}</strong></div>
            <div className="wf-note" style={{marginTop:10}}>Referensi bersifat read-only pada peran ini. Perubahan paket dilakukan oleh Penyedia Jasa / Ketua Tim.</div>
          </Panel>
        </div>
      </div>}
    </>;
  };
  const auditScreen=()=>{
    const audit=state.audits[auditLevel-1];
    const presentation=AUDIT_LEVEL_PRESENTATION[auditLevel];
    const requiredRole=presentation.actor as WorkflowRole;
    const canEditAudit=state.role===requiredRole||state.role==='Admin';
    const scopedTypes=state.project.surveyTypes;
    const auditChecks=AUDIT_REVIEW_CHECKS[auditLevel];
    const sampleIssues=auditSampleIntegrity({audit,records:state.dailyRecords,surveyTypes:scopedTypes,routes:state.project.routes});
    const stage4Ready=fieldReadiness(state).length===0&&lrs.passed&&SUBMISSION_DOCUMENTS.every(key=>state.submission.requiredDocuments[key])&&!!state.submission.rawFileName.trim()&&!!state.submission.cleanedFileName.trim();
    const previousAuditPassed=auditLevel===1||state.audits[auditLevel-2].status==='Lulus';
    const uploadReady=auditLevel===1||state.submission.validationStatus==='VALID';
    const canStart=auditLevel===1?stage4Ready:previousAuditPassed&&uploadReady;
    const startGateItems=[
      {label:auditLevel===1?'Tahap 4 siap diaudit':`Audit Tingkat ${auditLevel-1} lulus`,ready:auditLevel===1?stage4Ready:previousAuditPassed,detail:auditLevel===1?(stage4Ready?'Paket siap masuk audit internal':'Lengkapi penyiapan data/RNI-LRS'):(previousAuditPassed?'Lulus':'Belum lulus')},
      ...(auditLevel>1?[{label:'Status paket/upload siap',ready:uploadReady,detail:state.submission.validationStatus==='VALID'?'VALID':'Belum VALID'}]:[]),
      {label:'Actor audit sesuai',ready:canEditAudit,detail:canEditAudit?'Peran aktif dapat melakukan aksi':`Aksi dilakukan oleh ${requiredRole}`},
    ];
    const makeSamples=()=>{
      if(!canEditAudit){setNotice(`Peran ${requiredRole} diperlukan untuk membuat/menetapkan sampel audit tingkat ${auditLevel}.`);return;}
      if(!canStart){setNotice(auditLevel===1?'Audit Tingkat 1 menunggu Tahap 4 lengkap dan gerbang RNI/LRS lulus.':'Audit tingkat ini menunggu status paket VALID dan audit sebelumnya lulus.');return;}
      const result=buildAuditSamplePlan({
        packageId:state.project.id,
        auditLevel,
        surveyTypes:scopedTypes,
        routes:state.project.routes,
        records:state.dailyRecords,
      });
      if(result.issues.length){setNotice(result.issues.join(' '));return;}
      const samples=result.sampleIds;
      const next:AuditLevel={...audit,status:'Dalam Review',sampleIds:[...new Set(samples)],reviewChecks:{},baNumber:'',decisionNote:''};
      commit(`Siapkan sampel audit tingkat ${auditLevel}`,`Tingkat ${auditLevel}`,s=>({...s,audits:s.audits.map(x=>x.level===auditLevel?next:x.level>auditLevel?{...INITIAL_WORKFLOW.audits[x.level-1],sampleIds:[]}:x) as OperationalWorkflowState['audits'],acceptance:{...s.acceptance,finalReport:false,finalAcceptance:false,terms:s.acceptance.terms.map(t=>t.id==='T3'||t.id==='T4'?{...t,complete:false}:t)}}),samples.length?'Sampel audit berhasil disiapkan':'Belum ada rekaman yang memenuhi cakupan sampel audit.');
    };
    const patchAudit=(patch:Partial<AuditLevel>,activity:string)=>{
      if(!canEditAudit){setNotice(`Peran ${requiredRole} diperlukan untuk mengubah audit tingkat ${auditLevel}.`);return;}
      if(patch.status==='Lulus'){
        const ba=draft[`audit-ba-${auditLevel}`]??audit.baNumber;
        if(!audit.sampleIds.length||!ba.trim()){setNotice(auditLevel===1?'Bukti audit internal memerlukan cakupan rekaman dan referensi dokumen/BA.':'Audit memerlukan sampel dan nomor BA sebelum dinyatakan lulus.');return;}
        if(!canStart){setNotice('Gerbang audit sebelumnya belum terpenuhi.');return;}
        if(state.corrections.some(item=>item.status!=='Ditutup'&&item.blockedStage===`Audit tingkat ${auditLevel}`)){
          setNotice(`Audit tingkat ${auditLevel} belum dapat lulus: ada tindak lanjut audit yang masih terbuka.`);return;
        }
        if(sampleIssues.length){setNotice(`Sampel audit tidak valid: ${sampleIssues.join(' ')}`);return;}
        if(!auditChecks.every(key=>audit.reviewChecks?.[key])){setNotice('Selesaikan checklist pemeriksaan tingkat ini sebelum lulus.');return;}
        const missing=scopedTypes.filter(type=>!audit.sampleIds.some(id=>state.dailyRecords.find(r=>r.id===id)?.surveyType===type));
        if(missing.length){setNotice(`Cakupan sampel belum mencakup: ${missing.join(', ')}.`);return;}
        if(auditLevel===3&&scopedTypes.includes('Jembatan')&&(!audit.bridgeTrustReference?.trim()||!Number.isFinite(audit.bridgeTrustScore)||audit.bridgeTrustScore<0||audit.bridgeTrustScore>100)){setNotice('Catat skor 0â€“100 dan referensi formulir tingkat kepercayaan jembatan FRM-01.');return;}
        patch={...patch,baNumber:ba,decisionNote:draft[`audit-note-${auditLevel}`]??audit.decisionNote};
      }
      if(patch.status==='Ditolak'&&!(draft[`audit-rejection-${auditLevel}`]??'').trim()){setNotice('Alasan penolakan wajib diisi sebelum audit ditolak.');return;}
      const rejectionSource=`Penolakan audit tingkat ${auditLevel}`;
      const existingCase=patch.status==='Ditolak'?state.corrections.find(item=>item.source===rejectionSource&&item.status!=='Ditutup'):undefined;
      let rejectionCase:CorrectionCase|undefined;
      if(patch.status==='Ditolak'&&!existingCase){
        rejectionCase=defaultCase(state);
        rejectionCase.source=rejectionSource;
        rejectionCase.blockedStage=`Audit tingkat ${auditLevel}`;
        rejectionCase.returnStage='Gerbang RNI/LRS';
        rejectionCase.surveyType=state.project.surveyTypes[0]||'IRI';
        rejectionCase.originalValue=state.dailyRecords.find(record=>record.surveyType===rejectionCase?.surveyType)?.rawValue||'Belum ada nilai raw tertaut';
        rejectionCase.rejectionReason=(draft[`audit-rejection-${auditLevel}`]??'').trim();
        rejectionCase.severity=auditLevel===3?'Kritis':'Mayor';
      }
      const invalidates=audit.status==='Lulus'&&(patch.status!==undefined&&patch.status!=='Lulus'||patch.reviewChecks!==undefined||patch.bridgeTrustReference!==undefined||patch.bridgeTrustScore!==undefined);
      commit(activity,`Audit tingkat ${auditLevel}`,s=>({...s,audits:s.audits.map(x=>x.level===auditLevel?{...x,...patch,...(invalidates&&patch.status===undefined?{status:'Dalam Review' as const}:{})}:invalidates&&x.level>auditLevel?{...INITIAL_WORKFLOW.audits[x.level-1],sampleIds:[]}:x) as OperationalWorkflowState['audits'],corrections:rejectionCase?[rejectionCase,...s.corrections]:s.corrections,acceptance:invalidates||patch.status==='Ditolak'?{...s.acceptance,finalReport:false,finalAcceptance:false,terms:s.acceptance.terms.map(t=>t.id==='T3'||t.id==='T4'?{...t,complete:false}:t)}:s.acceptance}));
      if(rejectionCase)setCaseId(rejectionCase.id);
      else if(existingCase)setCaseId(existingCase.id);
    };
    const levelLabels=([1,2,3] as const).map(level=>AUDIT_LEVEL_PRESENTATION[level].label);
    const decisionTitle=auditLevel===1?'Bukti audit internal / kesiapan Penyedia':'Keputusan audit & berita acara';
    const statusLabel=auditLevel===1?'Status kesiapan internal':'Status audit';
    const baLabel=auditLevel===1?'Referensi audit internal / BA':'Nomor berita acara';
    return <>{heading('Tahap 5 Â· audit berjenjang','Audit tingkat 1â€“3','Pemeriksaan dilakukan berurutan. Tingkat 1 mencatat bukti kesiapan internal Penyedia; assurance formal berikutnya dilakukan PIC Balai dan Direktorat sesuai kewenangan.')}
      <div className="wf-callout" data-testid="stage5-process-guide" style={{marginBottom:12}}>
        <strong>Urutan audit:</strong> Tingkat 1 oleh Penyedia, Tingkat 2 oleh PIC Balai, dan Tingkat 3 oleh Direktorat. Catat cakupan serta bukti sebelum keputusan. Sampel dihitung secara konsisten dari rekaman yang tersedia; perubahan rekaman atau aturan sampling membutuhkan pemeriksaan ulang. Nomor BA yang dicatat bukan tanda tangan/pengesahan otomatis.
      </div>
      <SourceAlignmentChecklist packageId={state.project.id} phase="audit" surveyTypes={state.project.surveyTypes} role={state.role} editableRoles={[AUDIT_LEVEL_PRESENTATION[auditLevel].actor as WorkflowRole,'Admin']} title={`Checklist ${AUDIT_LEVEL_PRESENTATION[auditLevel].label}`}/>
      <div className="wf-callout" style={{marginBottom:12}}><strong>{state.role}:</strong> {STAGE5_ROLE_GUIDANCE[state.role]}</div>
      <Panel title="Pilih tingkat pemeriksaan" icon={ShieldCheck}>
        <div className="wf-toolbar">{([1,2,3] as const).map(n=><button key={n} data-testid={`button-audit-level-${n}`} className={`wf-button ${auditLevel===n?'primary':''}`} onClick={()=>setAuditLevel(n)}>{levelLabels[n-1]}</button>)}</div>
        <div className="wf-callout" style={{marginTop:10}}><strong>{presentation.label}</strong><div className="wf-note" style={{marginTop:4}}>{presentation.purpose}</div></div>
        <GateSummary title={`Kesiapan Audit Tingkat ${auditLevel}`} items={startGateItems}/>

        <div className="stage-audit-role">
          <div>
            <small>Pelaksana</small>
            <strong>{requiredRole}</strong>
          </div>

          <div>
            <small>Peran aktif</small>
            <strong>{state.role}</strong>
          </div>

          <div>
            <small>Akses</small>
            <strong>{canEditAudit?'Pemeriksaan & keputusan':'Read-only'}</strong>
          </div>
        </div>

        <div className="stage-evidence-grid" style={{marginTop:10}}>
          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId={`stage5-audit-${auditLevel}-evidence`}
            label={`Bukti Audit Tingkat ${auditLevel}`}
            editable={canEditAudit}
          />

          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId={`stage5-audit-${auditLevel}-ba`}
            label={auditLevel===1?'Dokumen audit internal':`Berita Acara Audit Tingkat ${auditLevel}`}
            editable={canEditAudit}
          />
        </div>
      </Panel>

      <Panel title={`Dokumen hasil audit · Tingkat ${auditLevel}`} icon={FileText}>
        <p className="wf-note">Ringkasan mengikuti sampel, checklist, temuan, dan keputusan audit yang sudah tercatat. Dokumen ini bukan BA Audit resmi sampai format dan pengesahannya ditetapkan.</p>
        <div className="wf-toolbar">
          {baAccess('audit',`Lihat / susun dokumen audit tingkat ${auditLevel}`)}
          <Badge tone={audit.status==='Lulus'?'good':audit.status==='Ditolak'?'bad':'warn'}>{audit.status}</Badge>
        </div>
      </Panel>
      <div className="wf-grid" style={{marginTop:12,alignItems:'start'}}>
        <div style={{display:'grid',gap:12,alignContent:'start'}}>
          <Panel title={`Cakupan & sampling Â· tingkat ${auditLevel}`} icon={ClipboardList} extra={<Badge tone={audit.status==='Lulus'?'good':audit.status==='Ditolak'?'bad':'warn'}>{audit.status}</Badge>}>
            <div className="wf-note" style={{marginBottom:8}}>Cakupan mengikuti jenis survei dan tingkat audit. Aturan sampling ditampilkan dari konfigurasi yang berlaku.</div>
            {sampleIssues.length>0&&audit.sampleIds.length>0&&<div className="wf-callout warn" data-testid="audit-sample-integrity" style={{marginBottom:10}}>Sampel perlu diperiksa ulang sebelum keputusan lulus: {sampleIssues.join(" ")}</div>}
            <div className="wf-table"><table data-testid={`table-sampling-level-${auditLevel}`}><thead><tr><th>Jenis survei</th><th>Protokol cakupan</th><th>Rate</th><th>Satuan</th></tr></thead><tbody>{scopedTypes.map(t=>{const rule=samplingRule(t,auditLevel);return <tr key={t}><td><strong>{t}</strong></td><td>{rule.label}</td><td>{rule.rate}%</td><td>{rule.unit}</td></tr>})}</tbody></table></div>
            <div className="wf-toolbar" style={{marginTop:10}}><Button id={`button-create-samples-${auditLevel}`} kind="primary" onClick={makeSamples} disabled={!canEditAudit||!canStart}><Plus size={13}/>{auditLevel===1?'Catat cakupan audit internal':'Siapkan sampel audit'}</Button><Badge tone="info">{audit.sampleIds.length} rekaman</Badge></div>
            {!canEditAudit&&<div className="wf-callout" style={{marginTop:9}}>Read-only pada peran ini. Aksi Tingkat {auditLevel} dilakukan oleh <strong>{requiredRole}</strong>.</div>}
            {!canStart&&<div className="wf-callout warn" style={{marginTop:9}}>{auditLevel===1?'Tertahan: Tahap 4 belum lengkap.':'Tertahan: paket belum VALID atau audit sebelumnya belum lulus.'}</div>}
            {audit.sampleIds.length>0?<div className="wf-pill-list" style={{marginTop:9}}>{audit.sampleIds.map(id=>{const record=state.dailyRecords.find(row=>row.id===id);return <span className="wf-pill" data-testid={`sample-id-${id}`} key={id}>{id} Â· {record?.surveyType||'jenis tidak diketahui'}</span>})}</div>:<div className="wf-empty">Belum ada rekaman audit/sampel tercatat.</div>}
          </Panel>

          <Panel title="Jejak audit berjenjang" icon={Activity}>
            {state.audits.map((a,i)=><div className="wf-stage" key={a.level} data-testid={`audit-stage-${a.level}`}><span className="wf-stage-num">{a.level}</span><div><strong>{levelLabels[i]}</strong><small>{a.sampleIds.length} rekaman Â· referensi {a.baNumber||'belum dicatat'}</small></div><Badge tone={a.status==='Lulus'?'good':a.status==='Ditolak'?'bad':'warn'}>{a.status}</Badge></div>)}
          </Panel>
        </div>

        <div style={{display:'grid',gap:12,alignContent:'start'}}>
          <Panel title="Peran & kewenangan" icon={BadgeCheck}>
            <div className="wf-row"><span>Pelaksana tingkat ini</span><strong>{requiredRole}</strong></div>
            <div className="wf-row"><span>Peran aktif</span><Badge tone={canEditAudit?'good':'info'}>{state.role}</Badge></div>
            <div className="wf-callout" style={{marginTop:10}}>{presentation.purpose}</div>
            {auditLevel===1&&<div className="wf-note" style={{marginTop:8}}>Audit Tingkat 1 merupakan pemeriksaan internal Penyedia. Audit Tingkat 2 dilakukan PIC Balai / Pengguna Jasa, dan Audit Tingkat 3 dilakukan Direktorat / Pusat.</div>}
          </Panel>

          <Panel title={canEditAudit?decisionTitle:`Ringkasan Audit Tingkat ${auditLevel}`} icon={FileCheck2}>
            {canEditAudit?<>
              {auditChecks.map(key=><CheckRow key={key} id={`audit-review-${auditLevel}-${testId(key)}`} label={key} checked={!!audit.reviewChecks?.[key]} onChange={v=>patchAudit({reviewChecks:{...audit.reviewChecks,[key]:v}},'Catat checklist pemeriksaan audit')}/>) }
              {auditLevel===3&&scopedTypes.includes('Jembatan')&&<Field label="Referensi Form Tingkat Kepercayaan Jembatan FRM-01"><input data-testid="input-audit-bridge-trust-reference" value={audit.bridgeTrustReference??''} onChange={e=>patchAudit({bridgeTrustReference:e.target.value},'Catat formulir kepercayaan jembatan')}/></Field>}
              <Field label={statusLabel}><Select id={`select-audit-status-${auditLevel}`} value={audit.status} options={['Belum Dimulai','Dalam Review','Klarifikasi','Lulus','Ditolak']} onChange={v=>patchAudit({status:v as AuditLevel['status']},`Ubah status audit tingkat ${auditLevel}`)}/></Field>
              <Field label="Catatan pemeriksaan" full><textarea data-testid={`input-audit-note-${auditLevel}`} value={draft[`audit-note-${auditLevel}`]??audit.decisionNote} onChange={e=>saveText(`audit-note-${auditLevel}`,e.target.value)} placeholder="Catatan audit, temuan atau klarifikasi"/></Field>
              <Field label="Alasan penolakan (wajib bila status Ditolak)" full><textarea data-testid={`input-audit-rejection-${auditLevel}`} value={draft[`audit-rejection-${auditLevel}`]??''} onChange={e=>saveText(`audit-rejection-${auditLevel}`,e.target.value)} placeholder="Uraikan ketidaksesuaian yang memicu tindak lanjut."/></Field>
              <Field label={baLabel} full><input data-testid={`input-audit-ba-${auditLevel}`} value={draft[`audit-ba-${auditLevel}`]??audit.baNumber} onChange={e=>saveText(`audit-ba-${auditLevel}`,e.target.value)}/></Field>
              {auditLevel===3&&<Field label="Skor kepercayaan jembatan"><input type="number" data-testid="input-audit-bridge-score" value={audit.bridgeTrustScore} onChange={e=>patchAudit({bridgeTrustScore:Number(e.target.value)},'Ubah skor kepercayaan jembatan')}/></Field>}
              <div className="wf-toolbar" style={{marginTop:10}}><Button id={`button-save-audit-${auditLevel}`} kind="primary" onClick={()=>{if(audit.status==='Ditolak'&&!draft[`audit-rejection-${auditLevel}`]?.trim()){setNotice('Alasan penolakan wajib diisi sebelum audit ditolak.');return;}patchAudit({decisionNote:[draft[`audit-note-${auditLevel}`]||'',audit.status==='Ditolak'?`Alasan: ${draft[`audit-rejection-${auditLevel}`]}`:''].filter(Boolean).join(' Â· '),baNumber:draft[`audit-ba-${auditLevel}`]??audit.baNumber},`Simpan keputusan audit tingkat ${auditLevel}`);setNotice(auditLevel===1?'Bukti audit internal/kesiapan dicatat.':'Keputusan audit dan referensi BA dicatat.');}}><Save size={13}/>{auditLevel===1?'Simpan bukti kesiapan':'Simpan keputusan / BA'}</Button></div>
            </>:<AuditReadOnlySummary level={auditLevel} actor={requiredRole} activeRole={state.role} audit={audit} checks={auditChecks}/>}
          </Panel>
        </div>
      </div>
    </>;
  };

  const acceptanceScreen=()=>{
    const allAuditsPassed=state.audits.every(a=>a.status==='Lulus');
    const semesterEvidence=state.acceptance.semesterTwoEvidence??DEFAULT_SEMESTER_TWO;
    const semesterErrors=semesterTwoReadiness(state);
    const updateSemesterEvidence=(patch:Partial<typeof semesterEvidence>)=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Penyedia Jasa mencatat bukti Semester II.');return;}
      commit('Catat bukti siklus IRI Semester II',state.project.packageName,s=>({...s,acceptance:{...s.acceptance,semesterTwoEvidence:{...DEFAULT_SEMESTER_TWO,...s.acceptance.semesterTwoEvidence,...patch},semesterTwoRevalidation:false,finalAcceptance:false,finalReport:false,terms:s.acceptance.terms.map(t=>t.id==='T4'?{...t,complete:false,progress:0}:t)}}));
    };
    const calibrationReady=state.calibrations.length>0&&state.calibrations.every(c=>daysBetween(state.simulationDate,c.dueDate)>=0&&c.qualificationValid&&c.trainingVerified&&c.condition==='Baik')&&state.project.surveyTypes.length>0&&state.project.surveyTypes.every(type=>state.calibrationChecklist[type]);
    const productionTestsPassed=state.project.surveyTypes.length>0&&state.project.surveyTypes.every(type=>evaluateProductionTest(type,state.productionTests[type]).passed);
    const updateTerm=(id:AcceptanceTerm['id'],patch:Partial<AcceptanceTerm>,activity:string)=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa diperlukan untuk memperbarui termin.');return;}
      if(patch.complete){
        if(!state.acceptance.partialReceipts.includes(`BA penerimaan ${id}`)){setNotice(`BA penerimaan parsial ${id} wajib dicatat sebelum termin dinyatakan selesai.`);return;}
        const errors=termReadiness(state,id);if(errors.length){setNotice(errors.join(' Â· '));return;}
        if(id==='T1'&&(state.project.preparation.reportApproval!=='Disetujui'||!calibrationReady||state.productionApproval!=='Disetujui'||!productionTestsPassed)){setNotice('Termin T1 menunggu laporan pendahuluan, kalibrasi/personel, uji produksi, dan BA metode disetujui.');return;}
        if(id==='T2'&&(!state.dailyRecords.some(record=>record.state==='Tercatat')||!state.cycle.certificateId||state.cycle.consistency!=='Konsisten'||state.cycle.heldRecordIds.length>0)){setNotice('Termin T2 menunggu catatan lapangan yang lolos, BA verval konsisten, dan tidak ada data tertahan.');return;}
        if(id==='T3'&&(state.submission.validationStatus!=='VALID'||state.audits[1].status!=='Lulus'||state.audits[2].status!=='Lulus')){setNotice('Termin T3 menunggu status VALID serta audit Pengguna Jasa dan Direktorat lulus.');return;}
        if(id==='T4'&&(!state.acceptance.semesterTwoRevalidation||!state.acceptance.finalReport)){setNotice('Termin T4 menunggu revalidasi Semester II dan laporan akhir.');return;}
      }
      commit(activity,id,s=>({...s,acceptance:{...s.acceptance,finalAcceptance:false,terms:s.acceptance.terms.map(t=>t.id===id?{...t,...patch}:t)}}));
    };
    const toggleReceipt=(receipt:string,on:boolean)=>{
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Peran PIC Balai / Pengguna Jasa diperlukan untuk mencatat penerimaan parsial.');return;}
      const receiptId=receipt.replace('BA penerimaan ','');
      if(on&&termReadiness(state,receiptId).length){setNotice(termReadiness(state,receiptId).join(' Â· '));return;}
      commit(on?'Catat BA penerimaan parsial':'Hapus BA penerimaan parsial simulasi',receipt,s=>{
      const termId=(['T1','T2','T3','T4'] as const).find(id=>receipt===`BA penerimaan ${id}`);
       return {...s,acceptance:{...s.acceptance,finalAcceptance:false,partialReceipts:on?[...new Set([...s.acceptance.partialReceipts,receipt])]:s.acceptance.partialReceipts.filter(x=>x!==receipt),terms:!on&&termId?s.acceptance.terms.map(term=>term.id===termId?{...term,complete:false}:term):s.acceptance.terms}};
      });
    };
    const acceptanceCriteria=state.acceptance.acceptanceCriteria??{};
    const acceptanceCriteriaReady=ACCEPTANCE_CRITERIA.every(item=>!!acceptanceCriteria[item]);
    const finalReady=state.acceptance.terms.every(t=>t.complete&&state.acceptance.partialReceipts.includes(`BA penerimaan ${t.id}`))&&!semesterErrors.length&&state.acceptance.semesterTwoRevalidation&&state.acceptance.finalReport&&allAuditsPassed&&!state.corrections.some(item=>item.status!=='Ditutup')&&acceptanceCriteriaReady;
    const updateAcceptanceCriterion=(criterion:AcceptanceCriterion,checked:boolean)=>{
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Kriteria penerimaan dinilai oleh PIC Balai / Pengguna Jasa.');return;}
      commit('Nilai kriteria penerimaan data',criterion,s=>({...s,acceptance:{...s.acceptance,acceptanceCriteria:{...(s.acceptance.acceptanceCriteria??{}),[criterion]:checked},acceptanceDecision:'Belum Diperiksa',finalAcceptance:false}}));
    };
    const toggleSemesterTwo=(checked:boolean)=>{
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Peran Pengguna Jasa diperlukan untuk keputusan revalidasi.');return;}
      if(checked){
        if(semesterErrors.length){setNotice(semesterErrors.join(' Â· '));return;}
        if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Peran PIC Balai / Pengguna Jasa diperlukan untuk menandai revalidasi akhir.');return;}
        if(!evaluateProductionTest('IRI',state.productionTests.IRI).passed||!state.calibrations.length||state.calibrations.some(c=>daysBetween(state.simulationDate,c.dueDate)<0||!c.qualificationValid||!c.trainingVerified||c.condition!=='Baik')||!state.calibrationChecklist.IRI){setNotice('Revalidasi IRI Semester II tertahan oleh hasil uji IRI atau kesiapan kalibrasi/personel.');return;}
      }
      commit('Ubah revalidasi Semester II',state.project.packageName,s=>({...s,acceptance:{...s.acceptance,semesterTwoRevalidation:checked,finalAcceptance:false,...(!checked?{terms:s.acceptance.terms.map(t=>t.id==='T4'?{...t,complete:false}:t)}:{})}}));
    };
    const toggleFinalReport=(checked:boolean)=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Penyedia Jasa menyerahkan laporan akhir.');return;}
      if(checked&&!canMarkFinalReport(state)){setNotice('Laporan akhir membutuhkan T1â€“T3 selesai, audit lulus dan referensi laporan. Tidak perlu menunggu T4 (laporan adalah syarat T4).');return;}
      commit('Ubah status laporan akhir',state.project.packageName,s=>({...s,acceptance:{...s.acceptance,finalReport:checked,finalAcceptance:false,...(!checked?{terms:s.acceptance.terms.map(t=>t.id==='T4'?{...t,complete:false}:t)}:{})}}));
    };
    const saveAcceptanceDecision=()=>{
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Keputusan penerimaan data dilakukan oleh PIC Balai / Pengguna Jasa.');return;}
      const decision=(draft.acceptanceDecision??state.acceptance.acceptanceDecision??'Belum Diperiksa') as 'Belum Diperiksa'|'Diterima'|'Ditolak';
      const rejectionReason=draft.acceptanceRejectionReason??state.acceptance.acceptanceRejectionReason??'';
      if(decision==='Ditolak'){
        if(!rejectionReason.trim()){setNotice('Alasan penolakan wajib diisi.');return;}
        commit('Tolak penerimaan data',state.project.packageName,s=>({...s,acceptance:{...s.acceptance,acceptanceDecision:'Ditolak',acceptanceRejectionReason:rejectionReason,finalAcceptance:false}}),'Penolakan dicatat; Penyedia perlu melakukan klarifikasi/tindakan perbaikan.');
        return;
      }
      if(decision!=='Diterima'){setNotice('Pilih keputusan Diterima atau Ditolak.');return;}
      if(!finalReady){setNotice('Penerimaan akhir tertahan oleh kriteria penerimaan, termin, BA, audit, revalidasi, laporan akhir, atau kasus koreksi terbuka.');return;}
      commit('Catat penerimaan akhir',state.project.packageName,s=>({...s,acceptance:{...s.acceptance,acceptanceDecision:'Diterima',acceptanceRejectionReason:'',finalAcceptance:true,finalAcceptanceBa:draft.finalAcceptanceBa||s.acceptance.finalAcceptanceBa||`BA-AKHIR-${s.simulationDate}`}}),'Penerimaan akhir dan referensi BA dicatat.');
    };
    return <>{heading('Tahap 6 Â· penerimaan','Penerimaan data & termin','Catat penerimaan parsial dan progres T1â€“T4. Penerimaan akhir menunggu seluruh termin, audit berjenjang, revalidasi Semester II dan laporan akhir.')}
      <Panel title="Berita Acara Penerimaan Data" icon={FileText}><p className="wf-note">BA mengikuti keputusan dan data yang sudah diperiksa, dengan para pihak sesuai format sumber.</p>{baAccess('penerimaan','Susun BA Penerimaan')}</Panel>
      <div className="wf-callout" style={{marginBottom:12}}><strong>{state.role}:</strong> {STAGE6_ROLE_GUIDANCE[state.role]}</div>

      <Panel title="Dokumen Penerimaan" icon={FileText}>
        <div className="stage-evidence-grid">
          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId="stage6-final-report"
            label="Laporan akhir"
            editable={state.role==='Penyedia Jasa / Ketua Tim'||state.role==='Admin'}
          />

          <EvidenceAttachment
            packageId={state.project.id}
            evidenceId="stage6-final-acceptance-ba"
            label="Berita Acara Penerimaan"
            editable={state.role==='PIC Balai / Pengguna Jasa'||state.role==='Admin'}
          />
        </div>

        {state.role==='Direktorat / Pusat'&&(
          <div className="wf-note" style={{marginTop:8}}>
            Direktorat / Pusat memonitor hasil audit dan penerimaan secara read-only.
          </div>
        )}
      </Panel>
      <div className="wf-kpis"><div className="wf-kpi"><div className="wf-kpi-label">Termin selesai</div><div className="wf-kpi-value">{state.acceptance.terms.filter(t=>t.complete).length}/4</div></div><div className="wf-kpi"><div className="wf-kpi-label">Penerimaan parsial</div><div className="wf-kpi-value">{state.acceptance.partialReceipts.length}</div></div><div className="wf-kpi"><div className="wf-kpi-label">Gerbang akhir</div><div className="wf-kpi-value" style={{fontSize:14}}>{state.acceptance.finalAcceptance?'Diterima':finalReady?'Siap':'Tertahan'}</div></div></div>
      <Panel title="Siklus ulang IRI Semester II â€” bukti terpisah" icon={RotateCcw}>
        <div className="wf-callout">Kalibrasi ulang â†’ validasi ulang â†’ survei IRI â†’ upload VALID (minggu ke-3 November) â†’ sanggah (minggu ke-4 November). Bukti Semester I tidak dianggap bukti Semester II. </div>
        <div className="wf-toolbar"><Button id="button-semester-calibration" onClick={()=>onNavigate('/documents:Kalibrasi & personel')}>Buka kalibrasi ulang</Button><Button id="button-semester-production" onClick={()=>{setProdType('IRI');onNavigate('/entry:Validasi produksi');}}>Buka uji IRI</Button><Button id="button-semester-daily" onClick={()=>onNavigate('/entry:Survei harian')}>Catat survei Semester II</Button></div>
        <div className="wf-fields">
          {(['calibrationDate','validationDate','uploadDate'] as const).map(key=><Field key={key} label={{calibrationDate:'Tanggal kalibrasi ulang',validationDate:'Tanggal validasi ulang',uploadDate:'Tanggal upload Semester II'}[key]}><input type="date" data-testid={`input-semester-two-${key}`} disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} value={semesterEvidence[key]} onChange={e=>updateSemesterEvidence({[key]:e.target.value})}/></Field>)}
          {(['calibrationReference','validationReference','finalReportReference'] as const).map(key=><Field key={key} label={{calibrationReference:'Referensi kalibrasi Semester II',validationReference:'BA validasi IRI Semester II',finalReportReference:'Referensi laporan akhir'}[key]}><input data-testid={`input-semester-two-${key}`} disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} value={semesterEvidence[key]} onChange={e=>updateSemesterEvidence({[key]:e.target.value})}/></Field>)}
          <CheckRow id="semester-two-upload-valid" label="Upload IRI Semester II VALID" disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} checked={semesterEvidence.uploadValid} onChange={v=>updateSemesterEvidence({uploadValid:v})}/>
          <CheckRow id="semester-two-objections" label="Sanggah Semester II sudah ditutup" disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} checked={semesterEvidence.objectionsClosed} onChange={v=>updateSemesterEvidence({objectionsClosed:v})}/>
        </div>
        <div className={`wf-callout ${semesterErrors.length?'warn':''}`} data-testid="semester-two-gate">{semesterErrors.join(' Â· ')||'Bukti siklus Semester II lengkap; Pengguna Jasa dapat menyetujui revalidasi.'}</div>
        {semesterEvidence.uploadDate>'2027-11-21'&&<div className="wf-callout warn">Upload melewati minggu ke-3 November; keterlambatan tetap dicatat, bukan disembunyikan.</div>}
      </Panel>
      <div className="wf-grid">
        <Panel title="Termin kontrak TA 2027" icon={FileCheck2}><div className="wf-table"><table data-testid="table-acceptance-terms">
          <thead><tr><th>Termin</th><th>Milestone</th><th>Bobot</th><th>Jatuh tempo</th><th>Progres</th><th>Status</th></tr></thead>
          <tbody>{state.acceptance.terms.map(term=><tr key={term.id} data-testid={`row-term-${term.id}`}>
            <td><strong>{term.id}</strong></td><td>{term.milestone}<Field label="Catatan"><input data-testid={`input-term-note-${term.id}`} disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} value={acceptDraft[`${term.id}-note`]??term.note} onChange={e=>setAcceptDraft(d=>({...d,[`${term.id}-note`]:e.target.value}))}/></Field></td>
            <td>{term.percentage}%</td><td><input type="date" data-testid={`input-term-date-${term.id}`} disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} value={acceptDraft[`${term.id}-date`]??term.dueDate} onChange={e=>setAcceptDraft(d=>({...d,[`${term.id}-date`]:e.target.value}))}/></td>
            <td><input type="number" min="0" max="100" data-testid={`input-term-progress-${term.id}`} disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} value={acceptDraft[`${term.id}-progress`]??String(term.complete?100:term.progress??0)} onChange={e=>setAcceptDraft(d=>({...d,[`${term.id}-progress`]:e.target.value}))}/>%</td>
            <td><div className="wf-toolbar"><Badge tone={term.complete?'good':'warn'}>{term.complete?'Selesai':'Berjalan'}</Badge><button className="wf-button" data-testid={`button-save-term-${term.id}`} disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} onClick={()=>{const progress=Number(acceptDraft[`${term.id}-progress`]??(term.complete?100:term.progress??0));if(!Number.isFinite(progress)||progress<0||progress>100){setNotice('Progres termin harus antara 0% dan 100%.');return;}updateTerm(term.id,{progress,complete:progress>=100,note:acceptDraft[`${term.id}-note`]??term.note,dueDate:acceptDraft[`${term.id}-date`]??term.dueDate},`Perbarui termin ${term.id}`);}}>Simpan</button></div></td>
          </tr>)}</tbody></table></div></Panel>
        <div>
          <Panel title="Kriteria penerimaan data" icon={ClipboardCheck}><AcceptanceCriteriaPanel values={acceptanceCriteria} readOnly={state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'} onChange={updateAcceptanceCriterion}/></Panel>
          <Panel title="BA penerimaan parsial / bertahap" icon={ClipboardCheck}><div className="wf-callout">PIC Balai / Pengguna Jasa mencatat BA penerimaan secara parsial/bertahap sesuai data yang telah selesai diperiksa dan diterima.</div>{['BA penerimaan T1','BA penerimaan T2','BA penerimaan T3','BA penerimaan T4'].map(r=><CheckRow key={r} id={`receipt-${testId(r)}`} label={r} disabled={state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'} checked={state.acceptance.partialReceipts.includes(r)} onChange={v=>toggleReceipt(r,v)}/>)}</Panel>
          <Panel title="Semester II & keputusan penerimaan" icon={BadgeCheck}><CheckRow id="acceptance-semester-two" label="Revalidasi IRI Semester II selesai" disabled={state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'} checked={state.acceptance.semesterTwoRevalidation} onChange={toggleSemesterTwo}/>
            <CheckRow id="acceptance-final-report" label="Laporan akhir tersedia" disabled={state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'} checked={state.acceptance.finalReport} onChange={toggleFinalReport}/>
            <Field label="Review PIC Balai"><Select id="select-acceptance-decision" value={draft.acceptanceDecision??state.acceptance.acceptanceDecision??'Belum Diperiksa'} options={['Belum Diperiksa','Diterima','Ditolak']} disabled={state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'} onChange={v=>saveText('acceptanceDecision',v)}/></Field>
            <Field label="Alasan penolakan (wajib bila Ditolak)" full><textarea data-testid="input-acceptance-rejection" disabled={state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'} value={draft.acceptanceRejectionReason??state.acceptance.acceptanceRejectionReason??''} onChange={e=>saveText('acceptanceRejectionReason',e.target.value)} placeholder="Uraikan ketidaksesuaian dan tindak lanjut yang diperlukan."/></Field>
            <Field label="Nomor / referensi BA penerimaan akhir"><input data-testid="input-final-acceptance-ba" disabled={state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'} value={draft.finalAcceptanceBa??state.acceptance.finalAcceptanceBa??''} onChange={e=>saveText('finalAcceptanceBa',e.target.value)}/></Field>
            <div className="wf-callout" style={{marginTop:8}}>Kriteria penerimaan: {acceptanceCriteriaReady?'Lengkap':'Belum lengkap'} Â· Audit seluruh tingkat: {allAuditsPassed?'Lulus':'Belum seluruhnya lulus'} Â· kasus koreksi terbuka: {state.corrections.filter(item=>item.status!=='Ditutup').length} Â· penerbit BA: PIC Balai / Pengguna Jasa</div>
            {state.role==='Direktorat / Pusat'&&<div className="wf-callout" style={{marginTop:8}}>Direktorat / Pusat memonitor hasil Audit Tingkat 3 dan status penerimaan. Keputusan penerimaan/BA dicatat oleh PIC Balai / Pengguna Jasa.</div>}
            <Button id="button-final-acceptance" kind="primary" disabled={state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'} onClick={saveAcceptanceDecision}>{state.acceptance.finalAcceptance?'Penerimaan akhir tercatat':'Simpan keputusan penerimaan'}</Button>
          </Panel>
        </div>
      </div></>;
  };

  const correctionScreen=()=>{
    const patchNew=(patch:Partial<CorrectionCase>)=>setNewCase(current=>{
      const next={...current,...patch};
      if('road' in patch||'surveyType' in patch){
        const record=state.dailyRecords.find(record=>record.surveyType===next.surveyType&&record.road===next.road);
        next.originalValue=record?.rawValue||'Belum ada nilai raw tertaut';next.linkedRecordId=record?.id;
      }
      return next;
    });
    const changeCaseType=(surveyType:SurveyType)=>{
      if(!selectedCase)return;
      const raw=state.dailyRecords.find(record=>record.surveyType===surveyType&&record.road===selectedCase.road)?.rawValue||'Belum ada nilai raw tertaut';
      updateCurrent({surveyType,originalValue:raw,linkedRecordId:state.dailyRecords.find(record=>record.surveyType===surveyType&&record.road===selectedCase.road)?.id},'Ubah jenis survei dan tautan raw koreksi');
    };
    const updateCurrent=(patch:Partial<CorrectionCase>,activity:string)=>{
      if(!selectedCase)return;
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Peran aktif ini tidak dapat mengubah kasus koreksi.');return;}
      if(selectedCase.status==='Ditutup'){setNotice('Kasus yang sudah ditutup tidak dapat diubah.');return;}
      const changesProposal=['rootCause','fieldDataValid','surveyType','actionType','evidence','originalValue','proposedValue','returnStage','linkedRecordId','ruleScenario','ruleChecks','ruleNumbers','provinceUpdateBa'].some(key=>key in patch);
      const safePatch=changesProposal?{...patch,verification:{surveyor:false,teamLeader:false,balai:false},approval:'Draft' as const,status:'Terbuka' as const,retest:'Belum Diuji' as const}:patch;
      commit(activity,selectedCase.id,s=>({...s,corrections:s.corrections.map(c=>c.id===selectedCase.id?{...c,...safePatch}:c)}));
    };
    const create=()=>{
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Pilih peran Penyedia Jasa atau Pengguna Jasa untuk membuka kasus.');return;}
      if(!newCase.rejectionReason.trim()||!newCase.road.trim()){setNotice('Ruas dan alasan temuan diperlukan untuk membuka kasus.');return;}
      commit('Buka kasus koreksi berbukti',newCase.id,s=>({...s,corrections:[{...newCase},...s.corrections]}),'Kasus baru tercatat dan menahan tahap asal');
      setCaseId(newCase.id);setNewCase(defaultCase(state));
    };
    const submitAction=()=>{
      if(!selectedCase)return;
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa / Ketua Tim diperlukan untuk mengajukan tindakan.');return;}
      if(selectedCase.status!=='Terbuka'&&selectedCase.status!=='Verifikasi Ulang'){setNotice('Tindakan hanya dapat diajukan dari kasus terbuka atau hasil uji ulang yang gagal.');return;}
      if(!selectedCase.rootCause||!selectedCase.fieldDataValid||!selectedCase.actionType||!selectedCase.evidence.trim()){setNotice('Lengkapi akar masalah, validitas data lapangan, tindakan dan bukti terlebih dahulu.');return;}
      if(selectedCase.fieldDataValid==='Ya'&&selectedCase.actionType!=='Koreksi pemrosesan dengan bukti'){setNotice('Jika data lapangan valid, pilih hanya koreksi pemrosesan berbasis bukti.');return;}
      if(selectedCase.fieldDataValid==='Tidak'&&selectedCase.actionType==='Koreksi pemrosesan dengan bukti'){setNotice('Jika data lapangan tidak valid, pilih tindakan lapangan atau penggantian.');return;}
      if(selectedCase.fieldDataValid==='Tidak Berlaku'&&!selectedCase.source.startsWith('Notifikasi H+0')){setNotice('Tidak Berlaku hanya digunakan untuk tindak lanjut tenggat, bukan koreksi data.');return;}
      if(selectedCase.fieldDataValid==='Ya'&&(!selectedCase.proposedValue.trim()||!selectedCase.originalValue.trim()||selectedCase.originalValue==='Belum ada nilai raw tertaut')){setNotice('Koreksi data memerlukan nilai raw tertaut dan nilai usulan cleaned.');return;}
      if(!selectedCase.verification?.surveyor||!selectedCase.verification?.teamLeader){setNotice('Surveyor dan Team Leader harus memverifikasi bukti sebelum usulan dikirim.');return;}
      const ruleErrors=specialCorrectionErrors(selectedCase);if(ruleErrors.length){setNotice(ruleErrors.join(' Â· '));return;}
      const caseContext=`${selectedCase.rejectionReason} ${selectedCase.rootCause} ${selectedCase.evidence}`.toLowerCase();
      if(selectedCase.surveyType==='PCI'&&/(hujan|genangan)/.test(caseContext)&&selectedCase.actionType==='Koreksi pemrosesan dengan bukti'){setNotice('PCI saat hujan atau genangan tidak boleh dikoreksi; jadwalkan ulang setelah permukaan kering.');return;}
      if(selectedCase.surveyType==='PCI'&&/(alur|amblas)/.test(caseContext)&&selectedCase.actionType==='Koreksi pemrosesan dengan bukti'&&!/(straight.?edge|laser|ukur fisik)/.test(selectedCase.evidence.toLowerCase())){setNotice('Koreksi alur/amblas PCI memerlukan bukti pengukuran fisik dengan straight edge atau laser.');return;}
      if(selectedCase.surveyType==='PCI'&&/(foto|defect|gambar)/.test(caseContext)&&/(tidak sesuai|buruk|kurang)/.test(caseContext)&&selectedCase.actionType!=='Ambil ulang foto/video'){setNotice('Foto defect yang tidak sesuai spesifikasi harus diambil ulang.');return;}
      if(selectedCase.surveyType==='IRI'&&/(kehilangan data|underspeed|macet|parkir)/.test(caseContext)&&selectedCase.fieldDataValid==='Tidak'&&!['Survei ulang sebagian ruas','Survei ulang seluruh ruas'].includes(selectedCase.actionType)){setNotice('Kehilangan data atau underspeed karena lalu lintas mewajibkan survei ulang pada kondisi normal.');return;}
      updateCurrent({status:'Menunggu Persetujuan',approval:'Diajukan'},'Ajukan tindakan koreksi untuk persetujuan');
      setNotice('Usulan terkirim pada alur tindak lanjut; menunggu persetujuan Pengguna Jasa.');
    };
    const approve=()=>{
      if(!selectedCase)return;
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Peran aktif saat ini tidak menyetujui tindakan. Pilih PIC Balai / Pengguna Jasa.');return;}
      if(selectedCase.status!=='Menunggu Persetujuan'||selectedCase.approval!=='Diajukan'){setNotice('Usulan harus berstatus menunggu persetujuan sebelum disetujui.');return;}
      if(!selectedCase.verification?.balai||!selectedCase.reviewNote?.trim()){setNotice('Balai harus memverifikasi bukti dan mencatat dasar keputusan.');return;}
      updateCurrent({approval:'Disetujui',status:'Disetujui'},'Setujui tindakan koreksi');
    };
    const executeAction=()=>{
      if(!selectedCase)return;
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='Admin'){setNotice('Peran Penyedia Jasa diperlukan untuk melaksanakan tindakan.');return;}
      if(selectedCase.status!=='Disetujui'||selectedCase.approval!=='Disetujui'){setNotice('Tindakan belum memperoleh persetujuan Pengguna Jasa.');return;}
      updateCurrent({status:'Dilaksanakan'},'Tandai tindakan telah dilaksanakan');
    };
    const runRetest=()=>{
      if(!selectedCase)return;
      if(state.role!=='Penyedia Jasa / Ketua Tim'&&state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Penyedia atau PIC Balai mencatat/verifikasi hasil uji ulang.');return;}
      if(selectedCase.status!=='Dilaksanakan'&&selectedCase.status!=='Verifikasi Ulang'){setNotice('Laksanakan tindakan terlebih dahulu sebelum uji ulang.');return;}
      const result=draft[`retest-${selectedCase.id}`]??selectedCase.retest;
      if(result!=='Lulus'&&result!=='Gagal'){setNotice('Pilih hasil uji ulang Lulus atau Gagal terlebih dahulu.');return;}
      updateCurrent({status:'Verifikasi Ulang',retest:result},'Catat / verifikasi hasil uji ulang');
    };
    const closeCase=()=>{
      if(!selectedCase)return;
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('PIC Balai / Pengguna Jasa menutup kasus setelah pemeriksaan uji ulang.');return;}
      if(selectedCase.status!=='Verifikasi Ulang'){setNotice('Catat hasil uji ulang terlebih dahulu sebelum menutup kasus.');return;}
      if(selectedCase.retest!=='Lulus'){setNotice('Kasus tidak dapat ditutup sebelum hasil uji ulang lulus.');return;}
      const errors=correctionClosureErrors(state,selectedCase);if(errors.length){setNotice(errors.join(' Â· '));return;}
      commit('Tutup kasus dan terapkan cleaned tanpa menimpa raw',selectedCase.id,s=>applyClosedCorrection(s,selectedCase));
      const destinations:Record<string,string>={'Kalibrasi':'/documents:Kalibrasi & personel','Validasi produksi':'/entry:Validasi produksi','Verval 14 hari':'/verification:Verval 14 hari','Gerbang RNI/LRS':'/entry:Gerbang RNI/LRS','Audit tingkat 1':'/verification:Audit tingkat 1â€“3','Audit tingkat 2':'/verification:Audit tingkat 1â€“3','Audit tingkat 3':'/verification:Audit tingkat 1â€“3','Penerimaan & termin':'/reports:Penerimaan & termin'};
      if(destinations[selectedCase.returnStage])onNavigate(destinations[selectedCase.returnStage]);
      setNotice('Kasus ditutup; cleaned diterapkan bila tertaut, raw tetap utuh. Validasi dan audit terkait wajib diulang.');
    };
    const verifyStep=(key:'surveyor'|'teamLeader'|'balai',value:boolean)=>{
      if(!selectedCase)return;
      const expected=key==='balai'?'PIC Balai / Pengguna Jasa':'Penyedia Jasa / Ketua Tim';
      if(state.role!==expected&&state.role!=='Admin'){setNotice(`Langkah ini memerlukan peran ${expected}.`);return;}
      if(value&&key==='teamLeader'&&!selectedCase.verification?.surveyor||value&&key==='balai'&&!selectedCase.verification?.teamLeader){setNotice('Ikuti urutan Surveyor â†’ Team Leader â†’ Balai.');return;}
      const verification={surveyor:false,teamLeader:false,balai:false,...selectedCase.verification,[key]:value};
      if(!value){verification.balai=false;if(key==='surveyor')verification.teamLeader=false;}
      updateCurrent({verification,...(!value?{approval:'Draft' as const,status:'Terbuka' as const}:{})},`Verifikasi bukti oleh ${key}`);
    };
    const requestCaseRevision=()=>{
      if(!selectedCase)return;
      if(state.role!=='PIC Balai / Pengguna Jasa'&&state.role!=='Admin'){setNotice('Pengguna Jasa mengembalikan usulan.');return;}
      if(!selectedCase.reviewNote?.trim()){setNotice('Catatan revisi wajib diisi.');return;}
      updateCurrent({approval:'Perlu Revisi',status:'Terbuka',retest:'Belum Diuji',verification:{surveyor:false,teamLeader:false,balai:false}},'Kembalikan usulan ke akar masalah');
    };
    const compatibleActions=selectedCase?.fieldDataValid==='Ya'
      ?['Koreksi pemrosesan dengan bukti']
      :selectedCase?.fieldDataValid==='Tidak'
        ?CORRECTION_ACTIONS.filter(action=>action!=='Koreksi pemrosesan dengan bukti')
        :selectedCase?.fieldDataValid==='Tidak Berlaku'?['Investigasi keterlambatan dan rencana tindak lanjut']
        :CORRECTION_ACTIONS;
    return <>{heading('Lintas tahap Â· koreksi','Koreksi berbukti','Telusuri tahap tertahan, akar masalah dan cabang validitas lapangan. Raw asli tidak dapat diubah; setiap koreksi membutuhkan bukti, persetujuan dan uji ulang.')}
      <div className="wf-grid">
        <Panel title="Kasus koreksi terbuka" icon={TriangleAlert} extra={<Badge tone="warn">{state.corrections.filter(c=>c.status!=='Ditutup').length} aktif</Badge>}>
          {state.corrections.length?<div className="wf-table"><table data-testid="table-correction-cases"><thead><tr><th>ID / asal</th><th>Ruas Â· tahap tertahan</th><th>Severity</th><th>Status / uji</th><th>Buka</th></tr></thead><tbody>{state.corrections.map(c=><tr key={c.id} data-testid={`row-correction-${c.id}`}><td><strong>{c.id}</strong><div className="wf-note">{c.source}</div></td><td>{c.road}<div className="wf-note">{c.blockedStage}</div></td><td><Badge tone={c.severity==='Kritis'?'bad':c.severity==='Mayor'?'warn':'info'}>{c.severity}</Badge></td><td>{c.status}<div className="wf-note">Uji: {c.retest}</div></td><td><button className="wf-button" data-testid={`button-open-correction-${c.id}`} onClick={()=>setCaseId(c.id)}>Pilih kasus</button></td></tr>)}</tbody></table></div>:<div className="wf-empty">Belum ada kasus. Form berikut membuka kasus dengan bukti dan tahap asal yang jelas.</div>}
        </Panel>
        <Panel title="Buka kasus baru" icon={Plus}><div className="wf-fields">
          <Field label="Sumber kasus"><Select id="select-case-source" value={newCase.source} options={['Validasi produksi','Verval 14 hari','Validasi sistem LRS','Penolakan audit tingkat 2','Penolakan audit tingkat 3','Pengingat H+0 terlewat']} onChange={v=>patchNew({source:v})}/></Field>
          <Field label="Tahap tertahan"><Select id="select-case-stage" value={newCase.blockedStage} options={['Kalibrasi','Validasi produksi','Verval 14 hari','Gerbang RNI/LRS','Audit tingkat 1','Audit tingkat 2','Audit tingkat 3']} onChange={v=>patchNew({blockedStage:v,returnStage:v})}/></Field>
          <Field label="Ruas"><Select id="select-case-road" value={newCase.road} options={[...new Set([newCase.road,...state.project.routes].filter(Boolean))]} onChange={v=>patchNew({road:v})}/></Field>
           <Field label="Jenis survei"><Select id="select-new-case-type" value={newCase.surveyType} options={[...SURVEY_TYPES]} onChange={v=>patchNew({surveyType:v as SurveyType})}/></Field>
          <Field label="STA"><input data-testid="input-case-stationing" value={newCase.stationing} onChange={e=>patchNew({stationing:e.target.value})}/></Field>
          <Field label="Alasan penolakan / tahan" full><textarea data-testid="input-case-reason" value={newCase.rejectionReason} onChange={e=>patchNew({rejectionReason:e.target.value})}/></Field>
          <Field label="Severity"><Select id="select-case-severity" value={newCase.severity} options={['Kritis','Mayor','Minor']} onChange={v=>patchNew({severity:v as CorrectionCase['severity']})}/></Field>
          <Field label="PIC"><input data-testid="input-case-owner" value={newCase.owner} onChange={e=>patchNew({owner:e.target.value})}/></Field>
          <Field label="Jatuh tempo"><input type="date" data-testid="input-case-due" value={newCase.dueDate} onChange={e=>patchNew({dueDate:e.target.value})}/></Field>
          <div className="wf-field full"><Button id="button-create-correction" kind="primary" onClick={create}><Plus size={13}/>Buka kasus tertahan</Button></div>
        </div></Panel>
      </div>
      {selectedCase&&<div className="wf-grid">
        <Panel title={`Rencana tindakan Â· ${selectedCase.id}`} icon={Wrench} extra={<Badge tone={selectedCase.status==='Ditutup'?'good':selectedCase.status==='Terbuka'?'warn':'info'}>{selectedCase.status}</Badge>}>
          <div className="wf-callout danger">Tahap tertahan: <strong>{selectedCase.blockedStage}</strong> Â· {selectedCase.road} Â· {selectedCase.stationing} Â· {selectedCase.rejectionReason}</div>
          <div className="wf-immutable"><LockKeyhole size={14}/>Raw asli bersifat immutable. Perubahan hanya pada proposed value dengan alasan dan bukti verifikasi.</div>
          <div className="wf-fields" style={{marginTop:11}}>
            <Field label="Akar masalah"><Select id={`select-case-root-${selectedCase.id}`} value={selectedCase.rootCause} options={['','Alat','Personel','Metode','Kondisi lapangan','Pemrosesan']} onChange={v=>updateCurrent({rootCause:v as CorrectionCase['rootCause']},'Ubah akar masalah')}/></Field>
             <Field label="Data lapangan valid?"><Select id={`select-case-valid-${selectedCase.id}`} value={selectedCase.fieldDataValid} options={['','Ya','Tidak',...(selectedCase.source.startsWith('Notifikasi H+0')?['Tidak Berlaku']:[])]} onChange={v=>updateCurrent({fieldDataValid:v as CorrectionCase['fieldDataValid']},'Tentukan cabang validitas lapangan')}/></Field>
             <Field label="Jenis survei"><Select id={`select-case-type-${selectedCase.id}`} value={selectedCase.surveyType} options={[...SURVEY_TYPES]} onChange={v=>changeCaseType(v as SurveyType)}/></Field>
            <Field label="Tindakan"><Select id={`select-case-action-${selectedCase.id}`} value={selectedCase.actionType} options={['',...compatibleActions]} onChange={v=>updateCurrent({actionType:v},'Pilih tindakan perbaikan')}/></Field>
            <Field label="Nilai raw asli (terkunci)"><input data-testid={`input-case-original-${selectedCase.id}`} value={selectedCase.originalValue} readOnly aria-readonly="true"/></Field>
             <Field label="Rekaman lapangan tertaut"><select data-testid="select-correction-record" value={selectedCase.linkedRecordId??''} onChange={e=>{const r=state.dailyRecords.find(r=>r.id===e.target.value);updateCurrent({linkedRecordId:r?.id,originalValue:r?.rawValue||'Belum ada nilai raw tertaut'},'Tautkan rekaman koreksi');}}><option value="">Pilih rekaman</option>{state.dailyRecords.filter(r=>r.road===selectedCase.road&&r.surveyType===selectedCase.surveyType).map(r=><option key={r.id} value={r.id}>{r.id} Â· {r.date} Â· raw {r.rawValue}</option>)}</select></Field>
            <Field label="Usulan nilai cleaned"><input data-testid={`input-case-proposed-${selectedCase.id}`} value={draft[`proposed-${selectedCase.id}`]??selectedCase.proposedValue} onChange={e=>saveText(`proposed-${selectedCase.id}`,e.target.value)}/></Field>
            <Field label="Bukti foto/video / referensi posisi" full><textarea data-testid={`input-case-evidence-${selectedCase.id}`} value={draft[`evidence-${selectedCase.id}`]??selectedCase.evidence} onChange={e=>saveText(`evidence-${selectedCase.id}`,e.target.value)} placeholder="Deskripsikan bukti dan lokasi. Jangan unggah file nyata."/></Field>
            <div className="wf-field full"><Button id={`button-save-case-evidence-${selectedCase.id}`} onClick={()=>updateCurrent({proposedValue:draft[`proposed-${selectedCase.id}`]??selectedCase.proposedValue,evidence:draft[`evidence-${selectedCase.id}`]??selectedCase.evidence},'Simpan usulan nilai dan bukti')}>Simpan usulan & bukti</Button></div>
          </div>
          <div className="wf-callout" style={{marginTop:11}}>{selectedCase.fieldDataValid==='Ya'?'Cabang koreksi penyajian/pemrosesan: raw tetap utuh dan penyesuaian wajib berbasis bukti.':selectedCase.fieldDataValid==='Tidak'?'Cabang tindakan lapangan: pilih survei ulang, re-rating, pelatihan, kalibrasi atau penggantian.':'Tentukan validitas data lapangan untuk mengaktifkan cabang tindakan.'}</div>
          <div className="wf-callout warn" style={{marginTop:9}}><strong>Panduan khusus {selectedCase.surveyType}</strong><ul>{CORRECTION_GUIDANCE[selectedCase.surveyType].map(rule=><li key={rule}>{rule}</li>)}</ul></div>
          <Field label="Skenario aturan koreksi"><Select id="select-correction-scenario" value={selectedCase.ruleScenario||'Umum'} options={['Umum',...(RULE_SCENARIOS[selectedCase.surveyType]||[])]} onChange={v=>updateCurrent({ruleScenario:v,ruleChecks:{},ruleNumbers:{},provinceUpdateBa:''},'Pilih aturan koreksi khusus')}/></Field>
          {(RULE_NUMBERS[selectedCase.ruleScenario||'']||[]).map(key=><Field key={key} label={key}><input type="number" min="0" step="any" data-testid={`input-correction-rule-${testId(key)}`} value={selectedCase.ruleNumbers?.[key]??''} onChange={e=>updateCurrent({ruleNumbers:{...selectedCase.ruleNumbers,[key]:e.target.value===''?NaN:Number(e.target.value)}},'Catat ukuran bukti koreksi')}/></Field>)}
          {(RULE_CHECKS[selectedCase.ruleScenario||'']||[]).map(key=><CheckRow key={key} id={`correction-rule-${testId(key)}`} label={key} checked={!!selectedCase.ruleChecks?.[key]} onChange={v=>updateCurrent({ruleChecks:{...selectedCase.ruleChecks,[key]:v}},'Periksa bukti aturan koreksi')}/>)}
          {selectedCase.ruleScenario==='Pemutakhiran setelah verval Direktorat'&&<Field label="BA Pemutakhiran Data Provinsi"><input data-testid="input-correction-province-ba" value={selectedCase.provinceUpdateBa??''} onChange={e=>updateCurrent({provinceUpdateBa:e.target.value},'Catat BA pemutakhiran jembatan')}/></Field>}
        </Panel>
        <Panel title="Persetujuan, pelaksanaan & retest" icon={ClipboardCheck}>
          <div className="wf-callout">Verifikasi berlapis merupakan langkah yang dicatat, bukan hanya panduan. Mengubah bukti mengembalikan seluruh verifikasi dan persetujuan.</div>
          {(['surveyor','teamLeader','balai'] as const).map(key=><CheckRow key={key} id={`correction-verify-${key}`} label={{surveyor:'Surveyor memeriksa foto/video, posisi alat dan peta',teamLeader:'Team Leader memeriksa nilai dan dasar koreksi',balai:'Balai memverifikasi bukti dan keputusan'}[key]} checked={!!selectedCase.verification?.[key]} onChange={v=>verifyStep(key,v)}/>)}
          <Field label="Catatan persetujuan / alasan revisi"><textarea data-testid="input-case-review-note" value={selectedCase.reviewNote??''} onChange={e=>updateCurrent({reviewNote:e.target.value},'Catat keputusan Balai')}/></Field>
          <Button id="button-case-request-revision" kind="danger" disabled={selectedCase.status!=='Menunggu Persetujuan'} onClick={requestCaseRevision}>Kembalikan untuk revisi</Button>
          <div className="wf-stage"><span className="wf-stage-num">1</span><div><strong>Usulan & bukti</strong><small>{selectedCase.rootCause||'Akar masalah belum diisi'} Â· {selectedCase.actionType||'Tindakan belum dipilih'}</small></div><Badge tone={selectedCase.evidence?'good':'warn'}>{selectedCase.evidence?'Bukti tercatat':'Menunggu bukti'}</Badge></div>
          <div className="wf-stage"><span className="wf-stage-num">2</span><div><strong>Persetujuan Pengguna Jasa</strong><small>Peran aktif saat ini: {state.role}</small></div><Badge tone={selectedCase.approval==='Disetujui'?'good':'warn'}>{selectedCase.approval}</Badge></div>
           <div className="wf-toolbar" style={{margin:'10px 0'}}><Button id={`button-submit-case-${selectedCase.id}`} kind="primary" onClick={submitAction} disabled={selectedCase.status==='Ditutup'||selectedCase.status==='Menunggu Persetujuan'||selectedCase.status==='Disetujui'||selectedCase.status==='Dilaksanakan'}><ArrowRight size={13}/>Ajukan usulan</Button><Button id={`button-approve-case-${selectedCase.id}`} onClick={approve} disabled={selectedCase.status!=='Menunggu Persetujuan'||selectedCase.approval!=='Diajukan'}>Setujui usulan</Button><Button id={`button-execute-case-${selectedCase.id}`} onClick={executeAction} disabled={selectedCase.status!=='Disetujui'||selectedCase.approval!=='Disetujui'}>Tandai dilaksanakan</Button></div>
          <Field label="Hasil uji ulang"><Select id={`select-retest-${selectedCase.id}`} value={draft[`retest-${selectedCase.id}`]??selectedCase.retest} options={['Belum Diuji','Lulus','Gagal']} onChange={v=>saveText(`retest-${selectedCase.id}`,v)}/></Field>
           <div className="wf-toolbar" style={{marginTop:9}}><Button id={`button-retest-case-${selectedCase.id}`} onClick={runRetest} disabled={selectedCase.status!=='Dilaksanakan'&&selectedCase.status!=='Verifikasi Ulang'}>Catat retest</Button><Button id={`button-close-case-${selectedCase.id}`} kind="primary" onClick={closeCase} disabled={selectedCase.status!=='Verifikasi Ulang'||selectedCase.retest!=='Lulus'}>Tutup kasus & kembali ke tahap</Button></div>
          <Field label="Kembali ke tahap" full><Select id={`select-return-stage-${selectedCase.id}`} value={selectedCase.returnStage} options={['Kalibrasi','Validasi produksi','Verval 14 hari','Gerbang RNI/LRS','Audit tingkat 1','Audit tingkat 2','Audit tingkat 3','Penerimaan & termin']} onChange={v=>updateCurrent({returnStage:v},'Tentukan tahap kembali')}/></Field>
          <div className="wf-callout warn" style={{marginTop:10}}>Rantai: surveyor â†’ team leader â†’ Balai. Kasus ditutup hanya setelah uji ulang lulus; objek raw tidak pernah ditimpa.</div>
        </Panel>
      </div>}
    </>;
  };

  const notificationsScreen=()=>{
    const updateDate=(date:string)=>{commit('Ubah tanggal simulasi',date,s=>({...s,simulationDate:date}),'Tanggal simulasi diperbarui; tenggat dihitung ulang');setDaily(current=>({...current,date}));};
    const simulateMissed=(row:{id:string;title:string;object:string})=>{
      if(row.id.startsWith('correction-')||row.id==='scheduled-backup'){setNotice('Tindak lanjuti kasus / jadwal yang ada; tidak membuat kasus eskalasi berulang.');return;}
      const due=deadlineRows.find(item=>item.id===row.id)?.due||state.simulationDate;
      const source=`Notifikasi H+0 Â· ${row.id} Â· ${due}`;
      if(state.corrections.some(item=>item.source===source)){setNotice('Kasus untuk tenggat ini sudah dibuat.');return;}
      const c=defaultCase(state);c.source=source;c.blockedStage=row.id==='cycle-14d'?'Verval 14 hari':row.id.startsWith('calibration-')?'Kalibrasi':'Penerimaan & termin';c.returnStage=c.blockedStage;c.rejectionReason=`Tenggat terlewat: ${row.title}`;c.dueDate=state.simulationDate;c.severity='Mayor';
      commit('Simulasikan respons tenggat terlewat',row.id,s=>({...s,corrections:[c,...s.corrections]}),'Respons H+0 simulasi membuka kasus koreksi untuk tindak lanjut');
    };
    return <>{heading('Monitoring Â· tenggat','Pengingat & eskalasi','Tenggat dihitung dari tanggal simulasi, siklus verval dan termin terbuka. H-30/H-7/H+0 memetakan eskalasi peran; respons H+0 hanya membuat kasus demo.')}
      <div className="wf-grid">
        <Panel title="Tanggal simulasi operasional" icon={CalendarClock}><div className="wf-fields"><Field label="Hari ini (simulasi)"><input type="date" data-testid="input-simulation-date" value={state.simulationDate} onChange={e=>updateDate(e.target.value)}/></Field><div className="wf-field"><label>Jalur eskalasi</label><div className="wf-pill-list"><span className="wf-pill">PIC Balai</span><span className="wf-pill">Atasan langsung</span><span className="wf-pill">Direktorat / Pusat</span></div></div></div><p className="wf-note">Tidak ada pesan, email, atau notifikasi eksternal yang dikirim.</p></Panel>
        <Panel title="Ambang pengingat" icon={Timer}><div className="wf-stage"><span className="wf-stage-num">30</span><div><strong>H-30</strong><small>PIC Balai â†’ atasan â†’ pusat</small></div><Badge tone="info">Pengingat</Badge></div><div className="wf-stage"><span className="wf-stage-num">7</span><div><strong>H-7</strong><small>Eskalasi tenggat segera</small></div><Badge tone="warn">Peringatan</Badge></div><div className="wf-stage"><span className="wf-stage-num">0</span><div><strong>H+0</strong><small>Lewat / jatuh tempo hari ini; siapkan tindak lanjut</small></div><Badge tone="bad">Respons simulasi</Badge></div></Panel>
      </div>
      <Panel title="Antrean tenggat dinamis" icon={Clock3} extra={<Badge tone={deadlineRows.length?'warn':'good'}>{deadlineRows.length} butir dalam rentang pengingat</Badge>}>
        {deadlineRows.length?<div className="wf-table"><table data-testid="table-deadlines"><thead><tr><th>Tenggat</th><th>Objek</th><th>Tanggal batas</th><th>Sisa hari</th><th>Tahap</th><th>Rantai peran</th><th>Respons lokal</th></tr></thead><tbody>{deadlineRows.map(row=><tr key={row.id} data-testid={`row-deadline-${row.id}`}><td><strong>{row.title}</strong></td><td>{row.object}</td><td>{row.due}</td><td>{row.remaining}</td><td><Badge tone={row.stage==='H+0'?'bad':row.stage==='H-7'?'warn':'info'}>{row.stage}</Badge></td><td>PIC Balai â†’ Atasan â†’ Pusat</td><td>{row.stage==='H+0'?<button className="wf-button danger" data-testid={`button-escalate-${row.id}`} onClick={()=>simulateMissed(row)}>Simulasikan eskalasi & kasus</button>:<Badge tone="info">Pengingat lokal</Badge>}</td></tr>)}</tbody></table></div>:<div className="wf-empty">Tidak ada tenggat dalam jendela H-30/H-7/H+0 untuk tanggal simulasi ini.</div>}
      </Panel>
      <Panel title="Respons H+0 sebelumnya" icon={TriangleAlert}>{state.corrections.filter(c=>c.source.startsWith('Notifikasi H+0')||c.source==='Pengingat H+0 terlewat').length?<div className="wf-pill-list">{state.corrections.filter(c=>c.source.startsWith('Notifikasi H+0')||c.source==='Pengingat H+0 terlewat').map(c=><span className="wf-pill" data-testid={`escalation-case-${c.id}`} key={c.id}>{c.id} Â· {c.blockedStage} Â· {c.status}</span>)}</div>:<div className="wf-empty">Tidak ada kasus eskalasi simulasi yang dibuka.</div>}</Panel>
    </>;
  };

  const auditRoleScreen=()=>{
    const changeRole=(role:WorkflowRole)=>commit('Simulasikan peran aktif',role,s=>({...s,role}),'Peran demo berubah; tidak ada autentikasi atau hak akses nyata');
    const mediaOptions=['Perangkat kerja','Media eksternal','Penyimpanan jaringan (simulasi)','Arsip paket (simulasi)'];
    const createBackup=()=>{
      if(backupMedia.length<2){setNotice('Pilih minimal dua media untuk snapshot multi-media.');return;}
      const backup:BackupSnapshot={id:idNow('BKP'),createdAt:`${state.simulationDate} 17:00`,media:backupMedia,includesRaw:true,includesProcessed:true,note:'Snapshot berkala simulasi Â· raw + terproses'};
      commit('Catat snapshot multi-media simulasi',backup.id,s=>({...s,backups:[backup,...s.backups]}),'Riwayat snapshot dicatat secara lokal dalam state demo; bukan backup nyata');
    };
    return <>{heading('Governance demo Â· tanpa login','Peran & backup','Simulasikan cakupan peran dan riwayat snapshot multi-media. Ini bukan autentikasi, otorisasi, upload atau penyimpanan nyata.')}
      <div className="wf-grid">
        <Panel title="Pemilih peran simulasi" icon={LockKeyhole} extra={<Badge tone="warn">Tidak terautentikasi</Badge>}><Field label="Peran aktif"><Select id="select-simulated-role" value={state.role} options={roleOptions} onChange={v=>changeRole(v as WorkflowRole)}/></Field><div className="wf-callout warn" style={{marginTop:10}}>Simulasi peran hanya mengubah aktor yang tercatat pada event demo. Tidak ada login, akun pengguna, sesi, kunci akun atau proteksi akses.</div><div className="wf-stage"><span className="wf-stage-num">R</span><div><strong>Cakupan peran</strong><small>{roleScope[state.role]}</small></div></div></Panel>
        <Panel title="Pilihan media snapshot" icon={HardDrive}><div className="wf-callout warn">Catatan ini tidak menyalin file dan tidak membuktikan backup sungguhan. Perangkat dan media adalah label simulasi.</div><div className="wf-pill-list">{mediaOptions.map(m=><label className="wf-pill" key={m}><input type="checkbox" data-testid={`check-role-backup-${testId(m)}`} checked={backupMedia.includes(m)} onChange={e=>setBackupMedia(old=>e.target.checked?[...old,m]:old.filter(x=>x!==m))}/>{m}</label>)}</div><div className="wf-toolbar" style={{marginTop:10}}><Button id="button-create-role-backup" kind="primary" onClick={createBackup}><Archive size={13}/>Catat snapshot demo</Button><Badge tone="info">{state.backups.length} snapshot tercatat</Badge></div></Panel>
      </div>
      <Panel title="Jadwal snapshot lokal simulasi" icon={CalendarClock}>
        <div className="wf-callout warn">Simulator memproses jadwal saat aplikasi aktif atau tanggal simulasi berubah; bukan scheduler server dan bukan backup file sungguhan. Minimal dua media.</div>
        <div className="wf-fields"><Field label="Interval (hari)"><input data-testid="input-backup-interval" type="number" min="1" max="30" value={draft.backupInterval??String(state.backupSchedule?.intervalDays??7)} onChange={e=>saveText('backupInterval',e.target.value)}/></Field><Field label="Snapshot berikutnya"><input data-testid="input-backup-next-date" type="date" value={draft.backupNextDate??state.backupSchedule?.nextDate??state.simulationDate} onChange={e=>saveText('backupNextDate',e.target.value)}/></Field></div>
        <Button id="button-save-backup-schedule" onClick={()=>{const interval=Number(draft.backupInterval??state.backupSchedule?.intervalDays??7);if(backupMedia.length<2||!Number.isInteger(interval)||interval<1||interval>30){setNotice('Pilih â‰¥2 media dan interval 1â€“30 hari.');return;}commit('Aktifkan jadwal snapshot simulasi',state.project.packageName,s=>dueScheduledBackup({...s,backupSchedule:{enabled:true,intervalDays:interval,nextDate:draft.backupNextDate??s.backupSchedule?.nextDate??s.simulationDate,media:backupMedia}}));}}>Aktifkan / perbarui jadwal</Button>
        {state.backupSchedule?.enabled&&<><span className="wf-note"> Aktif Â· berikutnya {state.backupSchedule.nextDate} Â· {state.backupSchedule.media.join(', ')}</span><Button id="button-stop-backup-schedule" onClick={()=>commit('Hentikan jadwal snapshot simulasi',state.project.id,s=>({...s,backupSchedule:s.backupSchedule?{...s.backupSchedule,enabled:false}:undefined}))}>Hentikan jadwal</Button></>}
      </Panel>
      <Panel title="Riwayat snapshot demo" icon={Archive}>{state.backups.length?<div className="wf-table"><table data-testid="table-backup-history"><thead><tr><th>ID / waktu</th><th>Media simulasi</th><th>Isi</th><th>Catatan</th><th>Status</th></tr></thead><tbody>{state.backups.map(b=><tr key={b.id} data-testid={`row-backup-${b.id}`}><td>{b.id}<div className="wf-note">{b.createdAt}</div></td><td>{b.media.join(', ')||'Tidak dipilih'}</td><td>{[b.includesRaw?'Raw':'',b.includesProcessed?'Terproses':''].filter(Boolean).join(' + ')}</td><td>{b.note}</td><td><Badge tone="warn">Simulasi saja</Badge></td></tr>)}</tbody></table></div>:<div className="wf-empty">Belum ada snapshot simulasi. Membuat snapshot hanya menambah riwayat lokal pada state aplikasi.</div>}</Panel>
       <Panel title="Jejak event operasional" icon={Activity}><div className="wf-table"><table data-testid="table-workflow-events"><thead><tr><th>Tanggal demo</th><th>Aktor demo</th><th>Perubahan</th><th>Objek</th><th>Nilai lama â†’ nilai baru (ringkasan)</th></tr></thead><tbody>{state.events.slice(0,12).map(e=><tr key={e.id} data-testid={`row-event-${e.id}`}><td>{e.date}</td><td>{e.actor}</td><td>{e.action}</td><td>{e.object}</td><td><div className="wf-note">Sebelum: {e.oldValue||'â€”'}</div><div className="wf-note">Sesudah: {e.newValue||'â€”'}</div></td></tr>)}</tbody></table>{!state.events.length&&<div className="wf-empty">Belum ada event workflow demo.</div>}</div></Panel>
    </>;
  };

  const diagramScreen=()=>{
    const coverage=[
      {diagram:'00 Â· Ringkasan alur QA/QC',source:'SPMK â†’ Tahap 0â€“6 â†’ termin & laporan akhir; cabang koreksi dari tahap gagal.',module:'Persiapan & SPMK Â· Kalibrasi & personel Â· Validasi produksi Â· Survei harian Â· Verval 14 hari Â· Gerbang RNI/LRS Â· Audit tingkat 1â€“3 Â· Penerimaan & termin Â· Koreksi berbukti',status:'Terpetakan'},
      {diagram:'01 Â· Persiapan, kalibrasi, validasi produksi',source:'Telaah sumber, rencana lapangan, koordinasi, dokumen, persetujuan laporan; kalibrasi referensi/relatif dan personel; delapan jenis uji dan keputusan ambang.',module:'Persiapan & SPMK Â· Kalibrasi & personel Â· Validasi produksi',status:'Terpetakan'},
      {diagram:'02 Â· Pengumpulan data & verval 14 hari',source:'Quality gate kondisi survei; metadata wajib, backup dan laporan; protokol per jenis, checklist, BA, hold tidak konsisten, jembatan dan validasi akhir.',module:'Survei harian Â· Verval 14 hari Â· Pengingat & eskalasi Â· Koreksi berbukti Â· Peran & backup',status:'Terpetakan'},
      {diagram:'03 Â· Penyiapan, upload, audit & penerimaan',source:'Checklist mutu, gerbang RNI/LRS, pemisahan raw/clean, audit internal, tujuan upload status VALID, audit 1â€“3, BA, penerimaan parsial dan termin.',module:'Gerbang RNI/LRS Â· Audit tingkat 1â€“3 Â· Penerimaan & termin Â· Koreksi berbukti',status:'Terpetakan'},
      {diagram:'04 Â· Tindakan perbaikan & koreksi data',source:'Sumber kasus, tahap tertahan, akar masalah, cabang validitas data lapangan, koreksi hanya dengan bukti, persetujuan, pelaksanaan, uji ulang, close dan kembali ke tahap.',module:'Koreksi berbukti Â· Audit trail pada Peran & backup',status:'Terpetakan'},
      {diagram:'05 Â· Modul monitoring mutu & aliran data',source:'Master, entry, kalibrasi, verval, audit, tindakan, dokumen, notifikasi, analisis kepatuhan, keamanan/audit trail dan tujuan sistem eksternal.',module:'Data Master Â· Entri Survei Â· Persiapan & SPMK Â· Kalibrasi & personel Â· Validasi produksi Â· Survei harian Â· Verval 14 hari Â· Gerbang RNI/LRS Â· Audit tingkat 1â€“3 Â· Koreksi berbukti Â· Penerimaan & termin Â· Dokumen Mutu Â· Pengingat & eskalasi Â· Analisis & Kepatuhan Â· Dashboard & Laporan Â· Keamanan & Audit',status:'Terpetakan'},
    ];
    return <>{heading('Penelusuran sumber Â· 6 diagram','Matriks cakupan diagram','Audit eksplisit sumber Mermaid terhadap layar kerja yang tersedia. Cakupan disajikan apa adanya; area keamanan dan sistem eksternal tetap simulasi, bukan integrasi.')}
      <div className="wf-callout">Matriks memetakan enam diagram, bukan sertifikasi kepatuhan. Cross-check lanjutan menambahkan parameter berbasis pengamatan; benchmark PCI dan laporan jembatan; pemeriksaan PIC, validasi akhir; audit 100% sebelum upload; checklist audit; verifikasi dan penerapan koreksi; bukti siklus Semester II; jadwal snapshot; serta BA yang terhubung ke kontrol dokumen. Semuanya simulasi lokal.</div>
      <Panel title="Temuan yang ditutup dan batas yang tetap berlaku" icon={ClipboardCheck}>
        {['01 / V2,H2,V4: 6 benchmark PCI, 5 ulangan, cabang manual dan Laporan Jembatan Bab Iâ€“IV','02 / PGJ,VL,END1: pemeriksaan Pengguna Jasa, cakupan jembatan â‰¥10%, laporan dan lokasi akhir/alat tetap','03 / B1â†’UPâ†’SVâ†’C1: audit internal sebelum upload, audit berikutnya hanya setelah VALID','04 / KV,APP,EXE,CLOSE,BACK: Surveyorâ†’Team Leaderâ†’Balai, revisi, terapkan cleaned, batalkan validasi lama, buka tahap kembali','00 / SEM2 dan 03 / TD: kalibrasi/uji/survei IRI Semester II, upload/sanggah dan laporan sebagai syarat T4','05 / M3a,M7,M10b: hitung parameter, referensi BA lintas modul dan snapshot terjadwal simulasi'].map(item=><div className="wf-row" key={item}><span>{item}</span><Badge tone="good">Ditambahkan</Badge></div>)}
        <div className="wf-callout warn">Batas yang disengaja: tidak ada autentikasi/kunci akun nyata, integrasi DJBM atau backup file nyata. Sampling 5% berbasis panjang rekaman tetap estimasi karena interval STA per segmen belum tersimpan. Pengukuran GIS/sertifikat/formulir masih berupa referensi bukti simulasi, bukan verifikasi file asli.</div>
      </Panel>
      <Panel title="Cakupan keenam diagram sumber" icon={BookOpen} extra={<Badge tone="good">{coverage.length}/6 dipetakan</Badge>}><div className="wf-table"><table data-testid="table-diagram-coverage"><thead><tr><th>Sumber Mermaid</th><th>Alur yang ditelusuri</th><th>Modul / tahap operasional</th><th>Audit</th></tr></thead><tbody>{coverage.map((r,i)=><tr key={r.diagram} data-testid={`row-diagram-coverage-${i+1}`}><td><strong>{r.diagram}</strong><div className="wf-code">attached_assets/{['00_ringkasan_alur_qaqc_1791377623126.mermaid','01_persiapan_kalibrasi_validasi_produksi_1791377623126.mermaid','02_pengumpulan_data_verval_2mingguan_1791377623126.mermaid','03_penyerahan_upload_audit_berjenjang_1791377623126.mermaid','04_tindakan_perbaikan_koreksi_data_1791377623125.mermaid','05_modul_dashboard_monitoring_mutu_1791377623126.mermaid'][i]}</div></td><td>{r.source}</td><td>{r.module}</td><td><Badge tone="good">{r.status}</Badge></td></tr>)}</tbody></table></div></Panel>
      <div className="wf-grid equal" style={{marginTop:12}}><Panel title="Loop tertahan â†’ koreksi â†’ kembali" icon={RotateCcw}><div className="wf-stage"><span className="wf-stage-num">!</span><div><strong>Ambang / konsistensi / LRS / audit gagal</strong><small>Kasus berbukti menyimpan alasan dan tahap asal.</small></div><Badge tone="warn">Terhubung</Badge></div><div className="wf-stage"><span className="wf-stage-num">â†º</span><div><strong>Uji ulang lulus</strong><small>Status kembali ke tahap tertahan yang dicatat.</small></div><Badge tone="good">Return stage</Badge></div></Panel><Panel title="Batas integrasi & demo" icon={ShieldCheck}><div className="wf-callout warn">Pilihan tujuan sistem, media backup, status upload, peran dan BA hanya data simulasi. Tidak ada autentikasi, file nyata, integrasi DJBM, SMD Jalan, INVI-J, InSlope atau InDrain.</div></Panel></div>
    </>;
  };

  if(!recognized.includes(selection)) return null;
  let content:any;
  switch(selection){
    case '/entry:Persiapan & SPMK': content=preparationScreen(); break;
    case '/documents:Kalibrasi & personel': content=calibrationScreen(); break;
    case '/entry:Validasi produksi': content=productionScreen(); break;
    case '/entry:Survei harian': content=dailyScreen(); break;
    case '/verification:Verval 14 hari': content=cycleScreen(); break;
    case '/entry:Gerbang RNI/LRS': content=submissionScreen(); break;
    case '/verification:Audit tingkat 1â€“3': content=auditScreen(); break;
    case '/reports:Penerimaan & termin': content=acceptanceScreen(); break;
    case '/actions:Koreksi berbukti': content=correctionScreen(); break;
    case '/notifications:Pengingat & eskalasi': content=notificationsScreen(); break;
    case '/audit:Peran & backup': content=auditRoleScreen(); break;
    case '/reports:Matriks cakupan diagram': content=diagramScreen(); break;
    case '/documents:BA & dokumen workflow': content=<>{heading('Kontrol dokumen Â· lintas tahap','BA & dokumen workflow','Referensi terhubung ke status sumber; tidak ada file nyata yang diunggah.')}<WorkflowDocuments state={state} period={activeStage3BPeriod} periodRange={stage3bPeriodRange} onNavigate={onNavigate}/></>;break;
    default:return null;
  }
  return <div className="wf" data-testid="operational-workflow-workspace"><WorkflowNextAction state={state} onNavigate={onNavigate}/><StageOwnershipBanner selection={selection} role={state.role}/>{content}</div>;
}