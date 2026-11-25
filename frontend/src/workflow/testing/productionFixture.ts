import type {OperationalWorkflowState} from '../model';
import {CALIBRATION_REVIEW_SUBJECTS,calibrationSourceSignature} from '../calibrationReview';
/** Isolated test input only. Never loaded into the operational package list. */
export function withProductionReferences(state:OperationalWorkflowState){
 const common={road:state.project.routes[0]||'Ruas uji',staStart:'0+000',staEnd:'5+000',coordinates:'98.0, 3.0',methodEquipmentCompliant:true,dataProcessed:true,secondRaterChecked:true};
 Object.assign(state.productionTests.PCI,{productionDetails:{...common,pciSegmentReference:'SEKSI-UJI-01',pciDistressReference:'FORM-PCI-01',pciComparisonReference:'GROUNDTRUTH-01',pciModelVersion:'MODEL-UJI-01',pciBenchmarkReference:'BENCHMARK-01',pciPerformanceReport:'EVALUASI-01'}});
 Object.assign(state.productionTests.Lendutan,{sensorCount:7,productionDetails:{...common,deflectionLocation:'STA 0+100',deflectionCoordinates:'98.0, 3.0',deflectionResultReference:'HASIL-LENDUTAN-01'}});
 Object.assign(state.productionTests.Jembatan,{productionDetails:{...common,bridgeSample1Id:'BR-UJI-1',bridgeSample1Spans:2,bridgeSample1SpanLength:7,bridgeSample1Reference:'FORM-1',bridgeSample2Id:'BR-UJI-2',bridgeSample2SpanLength:41,bridgeSample2Reference:'FORM-2',bridgeSample3Id:'BR-UJI-3',bridgeSample3SpanLength:16,bridgeSample3Reference:'FORM-3',bridgeReportIntro:'BAB-I',bridgeReportResult:'BAB-II',bridgeReportEvaluation:'BAB-III',bridgeReportConclusion:'BAB-IV',bridgeReportAttachment:'LAMPIRAN-UJI'}});
 Object.assign(state.productionTests.Lereng,{productionDetails:{...common,locationReference:'STA 0+100',slopeGeometry:'Form geometri',slopeMaterial:'Form material',failureCondition:'Longsoran',drainageCondition:'Baik',protectionStructure:'Tercatat',instrumentation:'Tidak ada; diperiksa',photoReference:'FOTO-UJI',sketchReference:'SKETSA-UJI',inSlopeReference:'INSLOPE-UJI'}});
 Object.assign(state.productionTests.Drainase,{productionDetails:{...common,segmentId:'DR-UJI-1',channelType:'Terbuka',material:'Beton',widthM:'0.5',depthM:'0.5',conditionClass:'Baik',obstructionSediment:'Tidak ada',flowCondition:'Lancar',outletCondition:'Baik',inDrainReference:'INDRAIN-UJI',inspectionReference:'INSPEKSI-UJI'}});
 Object.assign(state.productionTests['Lalu Lintas'],{productionDetails:{...common,tcId:'TC-UJI-01',direction:'Normal',lane:'L1',method:'Manual',motorcycleCount:10,lightVehicleCount:10,busCount:0,truckCount:0,otherVehicleCount:0,recapReference:'REKAP-UJI'}});
 Object.assign(state.productionTests.RNI,{productionDetails:{...common,linkDescription:'LINK-UJI',lrpReference:'LRP-UJI',crossSectionInventory:'FORM-PENAMPANG',inventoryAttributes:'FORM-42-PARAMETER',gpsReference:'GNSS-UJI',rawDataReference:'RAW-UJI'}});
 return state;
}

/**
 * Isolated test input only: records the four PIC calibration-review sections as
 * 'Sesuai' for every survey type in the package, bound to the current calibration
 * material. Stage 2+ gates require this since the dirah-fe calibration review rule.
 * Call it after calibrations/checklist are final; editing them later invalidates it.
 */
export function withSuitableCalibrationReviews(state:OperationalWorkflowState){
 for(const type of state.project.surveyTypes){
  const section={result:'Sesuai' as const,note:'Kalibrasi diperiksa Balai (fixture uji).',evidenceReference:`BA-KAL-${type}-UJI`,reviewedAt:state.simulationDate,reviewer:'PIC Balai / Pengguna Jasa' as const,sourceSignature:calibrationSourceSignature(state,type)};
  state.calibrationReviews={...state.calibrationReviews,[type]:{...section,subject:'Alat dan personel',sections:Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject=>[subject,{...section}]))}};
 }
 return state;
}
