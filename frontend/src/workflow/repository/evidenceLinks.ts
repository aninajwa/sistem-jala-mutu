import {readLocal,writeLocal} from './localPersistence';
export type EvidenceLink={category:string;categories?:string[];items?:string[];status:string;fileKey?:string;detached?:boolean;history?:EvidenceLinkChange[]};
export type EvidenceLinkChange={at:string;action:string;before:{categories:string[];items:string[];status:string};after:{categories:string[];items:string[];status:string}};
export const evidenceCategories=(link?:EvidenceLink)=>[...new Set(link?.categories??(link?.category?[link.category]:[]))];
export const evidenceLinksKey=(scope:string)=>`${scope}:documents:links`;
export const readEvidenceLinks=(scope:string)=>readLocal<Record<string,EvidenceLink>>(evidenceLinksKey(scope),{});
/** Explicit user edits only. Legacy category is retained; no file or other scope is removed. */
export function updateEvidenceLink(scope:string,key:string,patch:Partial<EvidenceLink>,action:string){
 const links=readEvidenceLinks(scope),old=links[key]??{category:'Dokumen pendukung',status:'Tersedia'};
 const next={...old,...patch};
 if(patch.categories){next.categories=[...new Set(patch.categories)];next.category=next.categories[0]??old.category;}
 const snapshot=(value:EvidenceLink)=>({categories:evidenceCategories(value),items:value.items??[],status:value.status});
 next.history=[...(old.history??[]),{at:new Date().toISOString(),action,before:snapshot(old),after:snapshot(next)}];
 writeLocal(evidenceLinksKey(scope),{...links,[key]:next});return next;
}
