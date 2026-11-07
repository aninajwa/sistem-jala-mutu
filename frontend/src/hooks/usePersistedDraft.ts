import {createContext,createElement,useCallback,useContext,useState,type Dispatch,type ReactNode,type SetStateAction} from 'react';
import {readLocal,writeLocal} from '../workflow/repository/localPersistence';
const DraftPersistenceContext=createContext(true);
export function DraftPersistenceBoundary({enabled,children}:{enabled:boolean;children:ReactNode}){
 return createElement(DraftPersistenceContext.Provider,{value:enabled},children);
}
export function useDraftPersistenceAllowed(){return useContext(DraftPersistenceContext);}
export function persistDraftValue<T>(key:string,value:T,enabled=true){
 if(!enabled)return;
 writeLocal(key,value);
}
/** Actor/package-scoped UI drafts. Switching keys never writes the old draft into the new scope. */
export function usePersistedDraft<T>(key:string,initial:T|(()=>T),persist=true):[T,Dispatch<SetStateAction<T>>]{
 const persistenceAllowed=useContext(DraftPersistenceContext);
 const shouldPersist=persist&&persistenceAllowed;
 const fallback=()=>typeof initial==='function'?(initial as ()=>T)():initial;
 const load=()=>shouldPersist?readLocal<T>(key,fallback()):fallback();
 const [entry,setEntry]=useState(()=>({key,value:load()}));
 const value=entry.key===key?entry.value:load();
 const setValue=useCallback<Dispatch<SetStateAction<T>>>(action=>{
  setEntry(previous=>{
   const base=previous.key===key?previous.value:load();
   const next=typeof action==='function'?(action as (old:T)=>T)(base):action;
   try{persistDraftValue(key,next,shouldPersist);}catch(error){console.error('Draft belum tersimpan ke perangkat.',error);}
   return {key,value:next};
  });
  },[key,shouldPersist]);
 return [value,setValue];
}
