/** Development/test fixture only. Not imported by the operational app. */
import { createDemoWorkflow } from '../workflow/demoScenario';
import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import type { VolumeRow } from './volumeProgress';
import type { BalaiLocation, BalaiGeographyAdapter } from '../design/b/geo/adapter';
export function createBIDemoFixture(role:WorkflowRole){
 const packages:Record<string,OperationalWorkflowState>={};const volumes:VolumeRow[]=[];const locations:BalaiLocation[]=[];
 const scenarios=[{id:'BI-TEST-A',balai:'Balai Simulasi A',checkpoint:'verval-finding',lat:3.6,lng:98.7},{id:'BI-TEST-B',balai:'Balai Simulasi B',checkpoint:'audit3-directorate',lat:-7,lng:110},{id:'BI-TEST-C',balai:'Balai Simulasi C',checkpoint:'complete',lat:-7.3,lng:112.7}] as const;
 for(const [i,s] of scenarios.entries()){
  const state=createDemoWorkflow(s.checkpoint);state.role=role;state.project={...state.project,id:s.id,packageName:`Paket Simulasi ${i+1}`,balai:s.balai};
  const seed=state.dailyRecords.filter(r=>r.surveyType==='IRI'||r.surveyType==='PCI');
  // Additional isolated sessions are explicitly test records, not evidence of unique coverage.
  state.dailyRecords.push(...[1,2,3].flatMap(month=>seed.map((r,j)=>({...r,id:`${s.id}-TEST-${month}-${j}`,date:`2027-0${month}-15`,lengthKm:5+i+month+j,state:'Tercatat' as const}))));
  packages[s.id]=state;
  for(const surveyType of ['IRI','PCI'])volumes.push({packageId:s.id,locationId:`${s.id}-LOKASI`,surveyType,semester:'Semester I',unit:'km',target:100,realized:30+i*25,sourceId:`SIMULASI-${s.id}-${surveyType}`,verified:true});
  locations.push({id:s.id,label:`Titik uji ${i+1}`,latitude:s.lat,longitude:s.lng,balai:s.balai,sourceId:s.id,sourceSystem:'Fixture simulasi BI'});
 }
 const allowed=role==='Direktorat / Pusat'||role==='Admin'?Object.keys(packages):['BI-TEST-A'];
 const scoped=Object.fromEntries(Object.entries(packages).filter(([id])=>allowed.includes(id)));
 const geography:BalaiGeographyAdapter={available:true,async load(signal){return signal.aborted?[]:locations.filter(r=>allowed.includes(r.id));}};
 return {packages:scoped,volumes:volumes.filter(r=>allowed.includes(r.packageId)),geography,workflow:Object.values(scoped)[0]};
}
