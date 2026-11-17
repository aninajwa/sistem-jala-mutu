import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_WORKFLOW,evaluateProductionTest} from './model';

function slope(details:Record<string,string>){
  const data=structuredClone(INITIAL_WORKFLOW.productionTests.Lereng);
  data.productionDetails=details;
  return evaluateProductionTest('Lereng',data).checks;
}
function accepted(checks:ReturnType<typeof slope>,name:string){
  const check=checks.find(x=>x.label===name);
  assert.ok(check,'Pemeriksaan tidak ditemukan: '+name);
  return check.pass;
}
const GEOM='Geometri dan material/kondisi lereng tercatat';
const PROTECT='Bangunan pengaman dan instrumentasi tercatat';

test('field dari formulir Lereng digunakan oleh evaluasi produksi',()=>{
 const checks=slope({geometry:'kemiringan 30 derajat',materialCondition:'tanah',engineeringStructure:'dinding penahan',instrumentation:'alat ukur'});
 assert.equal(accepted(checks,GEOM),true);
 assert.equal(accepted(checks,PROTECT),true);
});
test('rekaman lama menggunakan key slopeGeometry/slopeMaterial/protectionStructure tetap diterima',()=>{
 const checks=slope({slopeGeometry:'1:2',slopeMaterial:'batuan',protectionStructure:'angkur',instrumentation:'sensor'});
 assert.equal(accepted(checks,GEOM),true);
 assert.equal(accepted(checks,PROTECT),true);
});
test('field kosong tidak berubah menjadi seolah-olah lengkap',()=>{
 const checks=slope({geometry:'',materialCondition:'',engineeringStructure:'',instrumentation:''});
 assert.equal(accepted(checks,GEOM),false);
 assert.equal(accepted(checks,PROTECT),false);
});
