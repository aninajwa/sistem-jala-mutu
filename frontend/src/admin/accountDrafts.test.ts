import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAccountDraft, parseAccountDrafts, scopeForRole, validateAccountDraft } from './accountDrafts';
const assignment = { role:'PIC Balai / Pengguna Jasa' as const, scopeType:'balai' as const, scopeRef:'BAL-VALIDASI' };
const base = { username:'contoh.admin',email:'contoh@example.org',organization:'Instansi Uji',assignments:[assignment] };
test('ERD username/email required, with case-insensitive duplicates',()=>{
 const saved=createAccountDraft(base,[],'d-1','2026-11-12T01:00:00Z');
 assert.equal(validateAccountDraft({...base,username:'CONTOH.ADMIN'},[saved])?.includes('Username'),true);
 assert.equal(validateAccountDraft({...base,username:'baru',email:'CONTOH@EXAMPLE.ORG'},[saved])?.includes('Email'),true);
 assert.ok(validateAccountDraft({...base,username:'x'},[]));
});
test('Balai and package assignments require scope; admin is not a reviewer',()=>{
 assert.ok(validateAccountDraft({...base,assignments:[{...assignment,scopeRef:''}]},[]));
 assert.ok(validateAccountDraft({...base,assignments:[{...assignment,role:'Admin'}]},[]));
 assert.deepEqual(scopeForRole.Admin,['sistem']);
 assert.equal(validateAccountDraft({...base,assignments:[{role:'Admin',scopeType:'sistem',scopeRef:''}]},[]),null);
});
test('many-to-many roles supported but identical assignments rejected',()=>{
 assert.equal(validateAccountDraft({...base,assignments:[assignment,{role:'Direktorat / Pusat',scopeType:'nasional',scopeRef:''}]},[]),null);
 assert.ok(validateAccountDraft({...base,assignments:[assignment,assignment]},[]));
});
test('no passwords, logins or approved access are created by session drafts',()=>{
 const record=createAccountDraft(base,[],'draft','now');
 assert.deepEqual(Object.keys(record).sort(),['assignments','createdAt','email','id','organization','username'].sort());
 assert.deepEqual(parseAccountDrafts('{broken'),[]);
});
test('invalid persisted records are discarded without destroying valid entries',()=>{
 const record=createAccountDraft(base,[],'draft','now');
 assert.deepEqual(parseAccountDrafts(JSON.stringify([{},record])).map(x=>x.id),['draft']);
});
