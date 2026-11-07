import test from 'node:test';
import assert from 'node:assert/strict';
import { collectServerPackages, filterServerPackages, loadServerCorrections, normalizeCorrectionResponse, packageFailureState, scopePackagesToIdentity, type PackagePage, type ServerDashboardPackage } from './serverDashboard';

const page=(number:number,data:PackagePage['data']):PackagePage=>({data,page:number,page_size:50});
const pkg=(id:number)=>({paket_id:id,nama_paket:`Paket ${id}`,balai_id:id%2?10:20});

test('paginates all package pages and deduplicates by paket_id',async()=>{
 const seen:number[]=[];
 const result=await collectServerPackages(async n=>{seen.push(n);return n===1?page(1,[...Array.from({length:49},(_,i)=>pkg(i+1)),pkg(50)]):page(2,[pkg(50),pkg(51)]);},new AbortController().signal);
 assert.deepEqual(seen,[1,2]);assert.equal(result.length,51);assert.equal(result.filter(x=>x.id==='50').length,1);
});

test('validates page sequence and aborts pagination',async()=>{
 await assert.rejects(()=>collectServerPackages(async()=>({data:[],page:2,page_size:50}),new AbortController().signal),/kontrak/);
 const controller=new AbortController();controller.abort();
 await assert.rejects(()=>collectServerPackages(async()=>page(1,[]),controller.signal));
});

test('maps correction cases once by kasus_id and preserves supported statuses',()=>{
 const rows=normalizeCorrectionResponse([
   {kasus_temuan:{kasus_id:4,status:'Terbuka'},koreksi_data:[{koreksi_id:100}]},
   {kasus_temuan:{kasus_id:5,status:'Ditutup'}},
   {kasus_temuan:{kasus_id:4,status:'Terbuka'}},
 ]);
 assert.deepEqual(rows,[{id:4,status:'Terbuka'},{id:5,status:'Ditutup'}]);
 assert.throws(()=>normalizeCorrectionResponse([{kasus_temuan:{kasus_id:4,status:'Unknown'}}]),/Skema/);
 assert.throws(()=>normalizeCorrectionResponse({kasus_temuan:[]}),/array/);
});

test('correction reads use bounded concurrency and retain per-package failures',async()=>{
 const packages:ServerDashboardPackage[]=Array.from({length:11},(_,i)=>({id:String(i+1),name:`P${i+1}`,balaiId:null}));
 let active=0,maxActive=0;
 const result=await loadServerCorrections(packages,new AbortController().signal,async id=>{
   active++;maxActive=Math.max(active,maxActive);await Promise.resolve();active--;
   if(id==='3')throw new Error('403 scope');
   return [{kasus_temuan:{kasus_id:Number(id),status:id==='2'?'Ditutup':'Terbuka'}}];
 });
 assert.ok(maxActive<=4);assert.equal(Object.keys(result.data).length,10);assert.match(result.errors['3'],/403 scope/);
});

test('package and balai filters only narrow the server-provided package set',()=>{
 const packages:ServerDashboardPackage[]=[{id:'1',name:'A',balaiId:10},{id:'2',name:'B',balaiId:20}];
 assert.deepEqual(filterServerPackages(packages,'10','Semua paket').map(x=>x.id),['1']);
 assert.deepEqual(filterServerPackages(packages,'Semua Balai','2').map(x=>x.id),['2']);
});

test('assignment scope is enforced before dashboard corrections are fetched',()=>{
 const rows:ServerDashboardPackage[]=[{id:'1',name:'owned',balaiId:10,createdBy:7},{id:'2',name:'other',balaiId:20,createdBy:8}];
 const identity={pengguna_id:7,peran:[{peran_id:3,nama:'penyedia_jasa'},{peran_id:4,nama:'pic_balai'}],penugasan:[{peran_id:3,scope_balai_id:null,scope_paket_id:null},{peran_id:4,scope_balai_id:10,scope_paket_id:null}]};
 assert.deepEqual(scopePackagesToIdentity(rows,'Penyedia Jasa / Ketua Tim',identity).map(x=>x.id),['1']);
 assert.deepEqual(scopePackagesToIdentity(rows,'PIC Balai / Pengguna Jasa',identity).map(x=>x.id),['1']);
 assert.throws(()=>scopePackagesToIdentity(rows,'Admin',{...identity,penugasan:[]}),/cakupan/);
});

test('distinguishes unavailable scope response from transient/server error and starts in loading',async()=>{
 assert.equal(packageFailureState({status:403}).status,'unavailable');
 assert.equal(packageFailureState(new Error('offline')).status,'error');
 const hook=await import('node:fs/promises').then(fs=>fs.readFile(new URL('./useServerDashboard.ts',import.meta.url),'utf8'));
 assert.match(hook,/packages: \{ status: 'loading' \}/);
 assert.match(hook,/corrections: \{ status: 'loading' \}/);
});

test('authenticated dashboard repository has only GET requests and no browser persistence',async()=>{
 const [repository,hook,app]=await Promise.all([
   import('node:fs/promises').then(fs=>fs.readFile(new URL('./serverDashboard.ts',import.meta.url),'utf8')),
   import('node:fs/promises').then(fs=>fs.readFile(new URL('./useServerDashboard.ts',import.meta.url),'utf8')),
   import('node:fs/promises').then(fs=>fs.readFile(new URL('../App.tsx',import.meta.url),'utf8')),
 ]);
 assert.doesNotMatch(repository,/localStorage|sessionStorage|\.setItem\s*\(/);
 assert.doesNotMatch(repository,/method\s*:/);
 assert.match(hook,/AbortController/);
 assert.match(app,/dashboardAuthenticated=\{Boolean\(authenticatedRole\)\}/);
 assert.match(app,/useDemoStore\(packageStore\.activeRole, !authenticatedRole\)/);
});
