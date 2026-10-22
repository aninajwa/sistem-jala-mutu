import test from 'node:test';import assert from 'node:assert/strict';
import {technicalFields} from './technicalMapping';import {BA_TEMPLATES,automaticFields} from './docxEngine';import {createDemoWorkflow} from '../demoScenario';
test('known IRI regression values populate source placeholders, never signature identities',()=>{
 const state=createDemoWorkflow('complete'),template=BA_TEMPLATES.find(t=>t.id==='kalibrasi')!;
 const mapped=technicalFields(template,state,'IRI',{start:'2027-01-01',end:'2027-01-14'});
 for(const field of template.fields.filter(f=>/5\.4/.test(f.section??'')))if(/Nilai A\s*\(/i.test(field.context))assert.equal(mapped[field.id],String(state.productionTests.IRI.coefficientA));
 for(const field of template.fields.filter(f=>/nama|instansi|jabatan/i.test(f.label)))assert.equal(mapped[field.id],undefined);
 state.productionTests.IRI.evidenceReference='';const noEvidence=technicalFields(template,state,'IRI',{start:'',end:''});assert.ok(!template.fields.some(f=>/5\.4/.test(f.section??'')&&noEvidence[f.id]));
});
test('audit mapping uses the selected level and keeps unknown details empty',()=>{
 const state=createDemoWorkflow('complete'),template=BA_TEMPLATES.find(t=>t.id==='audit')!;state.audits[1].baNumber='BALAI-BA';state.audits[1].decisionNote='Catatan Balai';
 const mapped=technicalFields(template,state,'IRI',{start:'',end:''},2);
 assert.equal(mapped[template.fields.find(f=>f.label==='Diisi nomor dokumen')!.id],'BALAI-BA');
 assert.equal(mapped[template.fields.find(f=>f.label==='Nama')!.id],undefined);
});

test('BA tables do not fabricate repeated survey rows or put routes into unrelated result sections',()=>{
 const state=createDemoWorkflow('complete'),template=BA_TEMPLATES.find(t=>t.id==='internal')!;
 const mapped=automaticFields(template,state,'IRI',{start:'2027-01-01',end:'2027-01-14'});
 const surveyFields=template.fields.filter(field=>field.label==='Jenis Survei');
 assert.equal(surveyFields.length,3);assert.equal(mapped[surveyFields[0].id],'IRI');
 assert.equal(mapped[surveyFields[1].id],undefined);assert.equal(mapped[surveyFields[2].id],undefined);
 for(const field of template.fields.filter(field=>field.tableRow&&/^(ruas|ruas\/lokasi)$/i.test(field.label)))assert.equal(mapped[field.id],undefined);
});

test('audit BA ringkasan memakai unit sampel ter-normalisasi, bukan jumlah rekaman harian',()=>{
 const state=createDemoWorkflow('complete'),template=BA_TEMPLATES.find(t=>t.id==='audit')!;
 state.audits[1].sampleUnits=[
  {id:'IRI-U1',sourceRecordId:'IRI-001',surveyType:'IRI',road:'Medan – Binjai',unitType:'segment',unitKey:'0+000-0+050',reviewStatus:'Valid',evidenceReference:'EVID-IRI-U1'},
  {id:'IRI-U2',sourceRecordId:'IRI-001',surveyType:'IRI',road:'Medan – Binjai',unitType:'segment',unitKey:'0+050-0+100',reviewStatus:'Tidak Valid',evidenceReference:'EVID-IRI-U2'},
 ];
 state.corrections.push({...state.corrections[0],id:'AUD-T2-1',surveyType:'IRI',blockedStage:'Audit Tingkat 2'});
 const mapped=technicalFields(template,state,'IRI',{start:'',end:''},2);
 const count=template.fields.find(f=>f.section==='10.1 Ringkasan Temuan'&&f.tableRow===1&&f.tableColumn===2)!;
 const findings=template.fields.find(f=>f.section==='10.1 Ringkasan Temuan'&&f.tableRow===1&&f.tableColumn===3)!;
 assert.equal(mapped[count.id],'2');assert.equal(mapped[findings.id],'1');
});


test('BA audit memakai denominator unit sampling yang tersimpan, bukan jumlah rekaman harian',()=>{
 const state=createDemoWorkflow('complete'),template=BA_TEMPLATES.find(t=>t.id==='audit')!;
 state.audits[1].samplingCoverage={IRI:{sourceRecords:2,sampledSourceRecords:1,populationUnits:40,sampledUnits:4}};
 const mapped=technicalFields(template,state,'IRI',{start:'',end:''},2);
 const field=template.fields.find(f=>f.section==='1.4 Metode Sampling'&&/persentase data/i.test(f.label))!;
 assert.equal(mapped[field.id],'10% (4 dari 40 unit)');
});

test('BA penerimaan hanya memetakan keputusan dan semester yang benar-benar ada pada paket',()=>{
 const state=createDemoWorkflow('complete'),template=BA_TEMPLATES.find(t=>t.id==='penerimaan')!;state.project.semester='Semester II';
 const mapped=technicalFields(template,state,'IRI',{start:'2027-05-01',end:'2027-05-31'});
 const decision=template.fields.find(f=>f.label==='Keputusan penerimaan')!,semester=template.fields.find(f=>f.label==='Periode penerimaan')!;
 assert.equal(mapped[decision.id],'DITERIMA');assert.match(mapped[semester.id],/Semester II/);
 const external=template.fields.find(f=>/Status (?:INVI-J|InSlope|InDrain)/i.test(f.label));if(external)assert.equal(mapped[external.id],undefined);
});

test('setiap tujuh BA memiliki autofill berbasis data yang tersedia tanpa mengisi identitas penandatangan',()=>{
 const state=createDemoWorkflow('complete');
 for(const template of BA_TEMPLATES){
  const mapped={...automaticFields(template,state,'IRI',{start:'2027-05-01',end:'2027-05-31'}),...technicalFields(template,state,'IRI',{start:'2027-05-01',end:'2027-05-31'},2)};
  assert.ok(Object.keys(mapped).length>0,`${template.id} tidak memiliki autofill berbasis source`);
  for(const field of template.fields.filter(f=>/tanda tangan|nip/i.test(`${f.label} ${f.context}`)))assert.equal(mapped[field.id],undefined,`${template.id} mengisi identitas resmi`);
 }
});
