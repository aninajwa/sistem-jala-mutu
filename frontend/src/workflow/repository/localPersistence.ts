/** Compatibility adapter. Existing keys are retained; reads never migrate or delete data. */
export interface KeyValueRepository {
  getItem(key:string):string|null;
  setItem(key:string,value:string):void;
  removeItem(key:string):void;
}
function driver():Storage|undefined {return typeof globalThis.localStorage==='undefined'?undefined:globalThis.localStorage;}
export const localPersistence:KeyValueRepository={
  getItem(key){return driver()?.getItem(key)??null;},
  setItem(key,value){const storage=driver();if(!storage)throw new Error('Penyimpanan lokal tidak tersedia.');storage.setItem(key,value);},
  removeItem(key){driver()?.removeItem(key);},
};
export const readLocal=<T,>(key:string,fallback:T):T=>{try{const value=localPersistence.getItem(key);return value===null?fallback:JSON.parse(value) as T;}catch{return fallback;}};
export function writeLocal<T>(key:string,value:T){localPersistence.setItem(key,JSON.stringify(value));}
