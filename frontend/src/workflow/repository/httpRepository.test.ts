import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpWorkflowRepository} from './httpRepository';
test('API adapter transmits expectedVersion and preserves 204 success',async()=>{
 const original=globalThis.fetch;let request:RequestInit|undefined;let url='';
 globalThis.fetch=(async(input,init)=>{url=String(input);request=init;return new Response(null,{status:204});}) as typeof fetch;
 try{await createHttpWorkflowRepository().submit({packageId:'p/1',periodId:'period-2',surveyType:'IRI'},'Tahap 3B',7);assert.equal(url,'/api/paket/p%2F1/submissions');assert.equal(request?.credentials,'include');assert.equal(JSON.parse(request?.body as string).expectedVersion,7);assert.equal(JSON.parse(request?.body as string).periodId,'period-2');}finally{globalThis.fetch=original;}
});
test('server denial is propagated without silently saving a local approval',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=(async()=>{calls++;return new Response(JSON.stringify({code:'FORBIDDEN',message:'Akses ditolak'}),{status:403});}) as typeof fetch;
 try{await assert.rejects(createHttpWorkflowRepository().review({packageId:'p'},'Tahap 2','Disetujui','',1),(error:any)=>error.code==='FORBIDDEN');assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
test('non JSON API response is reported as unavailable',async()=>{
 const original=globalThis.fetch;globalThis.fetch=(async()=>new Response('<html>maintenance</html>',{status:503})) as typeof fetch;
 try{await assert.rejects(createHttpWorkflowRepository().getPackage('p'),(error:any)=>error.code==='UNAVAILABLE');}finally{globalThis.fetch=original;}
});
