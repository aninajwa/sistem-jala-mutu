import {readLocal,writeLocal} from './localPersistence';
const DATABASE='jala-mutu-stage3b-evidence-local',STORE='files',INDEX='jala-local-attachment-index-v1';
export const ATTACHMENT_CHANGED='jala-attachment-changed';
export type LocalFile={file:File;name:string;savedAt:string;digest?:string};
export type AttachmentMetadata={name:string;size:number;mimeType:string;updatedAt:string;digest:string};
function transaction(key:string,value?:LocalFile|null):Promise<LocalFile|null>{
 return new Promise((resolve,reject)=>{const open=indexedDB.open(DATABASE,1);open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains(STORE))open.result.createObjectStore(STORE);};open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction(STORE,value===undefined?'readonly':'readwrite'),store=tx.objectStore(STORE);const request=value===undefined?store.get(key):value===null?store.delete(key):store.put(value,key);let record:LocalFile|null=null;request.onsuccess=()=>{record=value===undefined?(request.result??null):value;};tx.oncomplete=()=>{db.close();resolve(record);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error??new Error('Transaksi lampiran dibatalkan.'));};};});
}
function index(){return readLocal<Record<string,AttachmentMetadata>>(INDEX,{});}
function notify(key:string){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(ATTACHMENT_CHANGED,{detail:{key}}));}
export const attachmentRepository={
 get:(key:string)=>transaction(key),
 metadata:index,
 async put(key:string,file:File){const bytes=await file.arrayBuffer(),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');const record:LocalFile={file,name:file.name,savedAt:new Date().toISOString(),digest};await transaction(key,record);writeLocal(INDEX,{...index(),[key]:{name:file.name,size:file.size,mimeType:file.type,updatedAt:record.savedAt,digest}});notify(key);return record;},
 async remove(key:string){await transaction(key,null);const next=index();delete next[key];writeLocal(INDEX,next);notify(key);},
};
export function downloadLocalFile(record:LocalFile){const url=URL.createObjectURL(record.file),link=document.createElement('a');link.href=url;link.download=record.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
