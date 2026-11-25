/** A review reference is an exact local attachment key only when it belongs to this package.
 * Human-readable document labels and unrelated keys must not be resolved by guesswork. */
export function localReviewAttachmentKey(packageId:string, reference:string):string|null {
  const id=packageId.trim();
  const key=reference.trim();
  if(!id||!key||key!==reference||key.length>512||/[\u0000-\u001f]/.test(key))return null;
  return key.startsWith(`${id}:`) && key.length>id.length+1 ? key : null;
}
export type LocalReviewEvidenceStatus='tersedia-lokal'|'tidak-tersedia-lokal'|'tidak-dapat-diperiksa'|'referensi-belum-terpetakan';
export async function checkLocalReviewEvidence(packageId:string,reference:string,get:(key:string)=>Promise<{file:File}|null>):Promise<LocalReviewEvidenceStatus>{
 const key=localReviewAttachmentKey(packageId,reference);
 if(!key)return 'referensi-belum-terpetakan';
 try {const record=await get(key);return record?.file instanceof Blob?'tersedia-lokal':'tidak-tersedia-lokal';}
 catch{return 'tidak-dapat-diperiksa';}
}
