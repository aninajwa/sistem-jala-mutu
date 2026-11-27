import test from 'node:test';
import assert from 'node:assert/strict';
import { correctionActionChange, correctionActionErrors, correctionAllowsNotApplicable, correctionCompatibleActions } from './correctionActionPolicy';
import {createDemoWorkflow} from './demoScenario';
import {correctionMutationError} from './checkpoint09Corrections';
import type {CorrectionCase} from './model';
const base=()=>createDemoWorkflow('verval-finding');
const item=(patch:Partial<CorrectionCase>)=>({...base().corrections[0],...patch});
test('tindakan personel tidak dipaksa mengisi validitas data dan raw',()=>{
 const c=item({actionType:'Pelatihan ulang personel',fieldDataValid:'Tidak Berlaku'});
 assert.equal(correctionAllowsNotApplicable(c),true);assert.deepEqual(correctionActionErrors(c),[]);
 assert.ok(!correctionCompatibleActions(c).includes('Koreksi pemrosesan dengan bukti'));
});
test('data invalid tidak dapat diproses ulang dengan mengabaikan validitas',()=>{
 for(const fieldDataValid of ['Tidak','Tidak Berlaku'] as const)assert.ok(correctionActionErrors(item({actionType:'Koreksi pemrosesan dengan bukti',fieldDataValid})).length);
});
test('guard menolak pengajuan ulang dengan bukti pelaksanaan lama dan pemalsuan hasil pada draf',()=>{
 const s=base();s.role='Penyedia Jasa / Ketua Tim';
 const c=s.corrections[0];
 const next=(p:Partial<CorrectionCase>)=>({...s,corrections:[{...c,...p}]});
 assert.ok(correctionMutationError(s,next({executionReference:'OLD'})));
 assert.ok(correctionMutationError(s,next({status:'Menunggu Persetujuan',approval:'Diajukan',executionReference:'OLD'})));
 assert.equal(correctionMutationError(s,next({status:'Menunggu Persetujuan',approval:'Diajukan'})),undefined);
});

test('validitas data tidak dikenal atau kosong ditolak pada usulan',()=>{
 for(const value of ['', 'Tidak diketahui']) assert.ok(correctionActionErrors(item({fieldDataValid:value as CorrectionCase['fieldDataValid']})).length);
});
test('perubahan tindakan mengosongkan bukti teknis dan nilai usulan di UI dan domain',()=>{
 const s=base(); s.role='Penyedia Jasa / Ketua Tim';
 const c={...s.corrections[0],ruleChecks:{'Bukti lama':true},ruleNumbers:{'Angka lama':10},proposedValue:'Nilai lama',provinceUpdateBa:'BA lama',verification:{surveyor:false,teamLeader:false,balai:false}};
 s.corrections=[c];
 const actionType='Pelatihan ulang personel';
 const next=(patch:Partial<CorrectionCase>)=>({...s,corrections:[{...c,...patch}]});
 assert.match(correctionMutationError(s,next({actionType}))??'',/pengosongan/);
 assert.equal(correctionMutationError(s,next(correctionActionChange(c,actionType))),undefined);
});
