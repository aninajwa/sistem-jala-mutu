import {useCallback,useState,type Dispatch,type SetStateAction} from 'react';
import {readLocal,writeLocal} from '../workflow/repository/localPersistence';
/** Actor/package-scoped UI drafts. Switching keys never writes the old draft into the new scope. */
export function usePersistedDraft<T>(key:string,initial:T|(()=>T)):[T,Dispatch<SetStateAction<T>>]{
 const load=()=>readLocal<T>(key,typeof initial==='function'?(initial as ()=>T)():initial);
 const [entry,setEntry]=useState(()=>({key,value:load()}));
 const value=entry.key===key?entry.value:load();
 const setValue=useCallback<Dispatch<SetStateAction<T>>>(action=>{
  setEntry(previous=>{
   const base=previous.key===key?previous.value:load();
   const next=typeof action==='function'?(action as (old:T)=>T)(base):action;
   try{writeLocal(key,next);}catch(error){console.error('Draft belum tersimpan ke perangkat.',error);}
   return {key,value:next};
  });
 },[key]);
 return [value,setValue];
}
