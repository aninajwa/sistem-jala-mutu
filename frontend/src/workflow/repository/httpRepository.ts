import type { WorkflowRepository } from './contracts';
/** Planned adapter. Server authorization/version validation are required; no automatic fallback on rejection. */
export function createHttpWorkflowRepository(base='/api'):WorkflowRepository{
 async function request(path:string,method='GET',body?:unknown):Promise<any>{
  const response=await fetch(base+path,{method,credentials:'include',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const text=await response.text();
  let result:unknown;try{result=text?JSON.parse(text):undefined;}catch{throw {code:'UNAVAILABLE',message:'Respons API bukan JSON yang valid.'};}
  if(!response.ok)throw result??{code:response.status===403?'FORBIDDEN':'UNAVAILABLE',message:`HTTP ${response.status}`};return result;
 }
 const id=(value:string)=>encodeURIComponent(value);
 return {
  listPackages:()=>request('/paket'),getPackage:key=>request(`/paket/${id(key)}`),
  saveDraft:(key,state,expectedVersion)=>request(`/paket/${id(key)}`,'PATCH',{state,expectedVersion}),
  saveChecklist:(identity,templateId,answers,expectedVersion)=>request(`/paket/${id(identity.packageId)}/checklists`,'PUT',{...identity,templateId,answers,expectedVersion}),
  setPeriod:identity=>request(`/paket/${id(identity.packageId)}/periods`,'POST',identity),
  submit:(identity,stage,expectedVersion)=>request(`/paket/${id(identity.packageId)}/submissions`,'POST',{...identity,stage,expectedVersion}),
  review:(identity,stage,decision,note,expectedVersion)=>request(`/paket/${id(identity.packageId)}/reviews`,'POST',{...identity,stage,decision,note,expectedVersion}),
  audit:(identity,level,payload,expectedVersion)=>request(`/paket/${id(identity.packageId)}/audits`,'POST',{...identity,level,payload,expectedVersion}),
  followUp:(identity,payload,expectedVersion)=>request(`/paket/${id(identity.packageId)}/follow-ups`,'POST',{...identity,payload,expectedVersion}),
  document:(identity,payload,expectedVersion)=>request(`/paket/${id(identity.packageId)}/documents`,'POST',{...identity,payload,expectedVersion}),
 };
}
