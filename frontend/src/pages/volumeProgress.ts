/** Contract location volume (ERD LOKASI_PEKERJAAN). Realization must be
 * verified by the data producer as non-overlapping, not raw session distance. */
export type VolumeRow = { packageId:string; locationId:string; surveyType:string; semester:string; unit:string; target:number; realized:number|null; sourceId:string; verified:boolean };
export function projectVolume(rows:readonly VolumeRow[], allowed:ReadonlySet<string>, survey='Semua') {
  const scoped=rows.filter(r=>allowed.has(r.packageId)&&(survey==='Semua'||r.surveyType===survey));
  const identity=(r:VolumeRow)=>JSON.stringify([r.packageId,r.locationId,r.surveyType,r.semester]);
  const counts=new Map<string,number>(); for(const r of scoped) counts.set(identity(r),(counts.get(identity(r))??0)+1);
  return scoped.filter(r=>r.locationId&&r.sourceId&&r.unit&&r.semester&&counts.get(identity(r))===1&&Number.isFinite(r.target)&&r.target>0).map(r=>({...r,percent:r.verified&&r.realized!==null&&Number.isFinite(r.realized)&&r.realized>=0 ? r.realized/r.target*100 : null}));
}
