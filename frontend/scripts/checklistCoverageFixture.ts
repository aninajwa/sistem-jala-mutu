import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../src/workflow/demoScenario';
import {withProductionReferences} from '../src/workflow/testing/productionFixture';
import {withCompleteDailyRecord} from '../src/workflow/testing/dailyRecordFixture';
import {sourceDocument,sourceDocumentKey,type SourceDocument} from '../src/workflow/sourceDocumentModel';
import {sourceFormFixture} from '../src/workflow/testing/sourceFormFixture';
import {CALIBRATION_REVIEW_SUBJECTS,calibrationSourceSignature} from '../src/workflow/calibrationReview';
import {evaluateStageGate} from '../src/workflow/workflowGate';
import {dailyChecks,evaluateDailySurvey} from '../src/workflow/surveyStandards';
import {periodicRecords,submittedPeriodicRecords} from '../src/workflow/periodicRecords';
import type {SurveyType,DailySurveyRecord} from '../src/workflow/model';

/** Synthetic prior-stage prerequisites for isolated form access; not evidence of a real handover. */
export function checklistCoverageFixture(doc:Pick<SourceDocument,'survey'|'phase'>){
 const type=(doc.survey.startsWith('PCI')?'PCI':doc.survey) as SurveyType;
 const custom=withProductionReferences(createDemoWorkflow('complete'));
 custom.project.id='CP09-TEST';
 custom.project.packageName='Paket pengujian keterlacakan checklist';
 custom.project.surveyTypes=[type];
 custom.project.surveyStartDate='2027-01-01'; custom.project.surveyEndDate='2027-12-31';
 custom.activeCyclePeriod=1; custom.corrections=[];
 custom.productionTests.PCI.pciManual=doc.survey!=='PCI AI';
 const template=custom.calibrations.find(c=>c.surveyType===type)??custom.calibrations[0];
 custom.calibrations=[{...template,id:'CAL-SOURCE-TEST',surveyType:type,standardReference:'STANDAR-UJI',certificateReference:'CERT-UJI'}];
 custom.calibrationChecklist[type]=true;
 const fields:Partial<Record<SurveyType,Record<string,string>>>={
   PCI:{pciMethod:custom.productionTests.PCI.pciManual?'Manual':'AI',pci:'78',sampleUnit:'SEG-1',distressForm:'FORM-PCI-UJI'},
   Jembatan:{inspection:'Detail',condition:'2',elementForm:'FORM-JBT-UJI'},
   Lereng:{activity:'Inventarisasi baru',kmStart:'0',kmEnd:'1',middleCoordinate:'98.67,3.59',endCoordinate:'98.68,3.60',riskForm:'FORM-LRG-UJI'},
   Drainase:{drainageForm:'FORM-DRN-UJI'},
   'Lalu Lintas':{trafficMethod:'Menerus',classification:'Klasifikasi uji',plannedMinutes:'1440',maxGap:'0',logbook:'RAW-TC-UJI'},
 };
 const original=custom.dailyRecords.find(r=>r.surveyType===type)!;
 assert.ok(original,`No test record for ${type}`);
 let record:DailySurveyRecord={...original,date:'2027-01-07',state:'Tercatat',technicalData:{...original.technicalData,...fields[type]}};
 if(type==='Lereng')record={...record,slopeFailureType:'Longsoran'};
 if(type==='IRI'||type==='RNI'||type==='Lendutan')record=withCompleteDailyRecord(record);
 else record={...record,dailyToolCheck:Object.fromEntries(dailyChecks(record).map(key=>[key,true]))};
 assert.deepEqual(evaluateDailySurvey(record),[],`Daily fixture ${doc.survey}`);
 custom.dailyRecords=[record];
 // Provider form remains editable. A Balai periodic form requires a confirmed prior submission.
 const submitted=doc.phase==='periodic14';
 custom.cycle={...custom.cycle,selectedTypes:[type],periodCompleted:submitted,submittedRecordIds:submitted?[record.id]:undefined,
  heldRecordIds:[],certificateId:'',userReview:'Belum Diperiksa',surveyReviews:{},reviewPendingTypes:[],requiresReview:false,providerResubmissionRequired:false};
 const sourceAnswers:Record<string,string>={};
 const cal=sourceDocument(type,'calibration',custom.productionTests.PCI.pciManual)!;
 assert.ok(cal,`No calibration source for ${doc.survey}`);
 // Calibration is seeded only when it is a prerequisite, not when calibration itself is under test.
 if(submitted){
  sourceAnswers[sourceDocumentKey(custom.project.id,cal.id)]=JSON.stringify(sourceFormFixture(cal,custom.project));
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>sourceAnswers[key]??null}});
  try{
   const section={result:'Sesuai' as const,reviewer:'PIC Balai / Pengguna Jasa' as const,reviewedAt:custom.simulationDate,note:'Prasyarat fixture akses checklist',evidenceReference:'CAL-TEST',sourceSignature:calibrationSourceSignature(custom,type)};
   custom.calibrationReviews={[type]:{...section,subject:CALIBRATION_REVIEW_SUBJECTS[0],sections:Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject=>[subject,section]))}};
   const gate=evaluateStageGate(custom,'Tahap 2','PIC Balai / Pengguna Jasa');
   assert.equal(gate.readyToComplete,true,`${doc.survey}: ${gate.blockers.join('; ')}`);
   assert.equal(periodicRecords(custom).eligible.length,1,`${doc.survey}: fixture record must be eligible`);
   assert.equal(submittedPeriodicRecords(custom).confirmed,true,`${doc.survey}: fixture snapshot must be confirmed`);
  }finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
 }
 return {custom,sourceAnswers,type};
}
