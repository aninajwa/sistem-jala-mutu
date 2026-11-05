import type {listPackageDocuments} from './documentCatalog';
type Row=ReturnType<typeof listPackageDocuments>[number];
export function documentInsights(rows:Row[]){
 const records=[...new Map(rows.map(r=>[r.id,r])).values()];
 const buckets=[['Draft','local-draft'],['Menunggu pemeriksaan','submitted-local'],['Perlu revisi / ditolak','revision'],['Pemeriksaan selesai','reviewed-local'],['Referensi / status lain','other']] as const;
 const groups=buckets.map(([label,status])=>({label,count:records.filter(r=>status==='revision'?['revision-requested-local','rejected-local'].includes(r.localStatus):status==='other'?!['local-draft','submitted-local','revision-requested-local','rejected-local','reviewed-local'].includes(r.localStatus):r.localStatus===status).length}));
 return {total:records.length,groups,stale:records.filter(r=>r.stale).length,packages:new Set(records.map(r=>r.identity.packageId)).size};
}
export function DocumentInsights09({rows}:{rows:Row[]}){
 const data=documentInsights(rows);
 return <section className="cp09-insights" aria-label="Dashboard internal Dokumen Mutu"><h3>Status dokumen tercatat dalam filter</h3><p>{data.total} identitas dokumen unik · {data.packages} paket · {data.stale} referensi sumber berubah.</p>{!data.total?<p role="status">Belum ada dokumen tercatat sesuai filter. Kelengkapan atau persentase kepatuhan belum dapat disimpulkan.</p>:<figure aria-label="Distribusi status dokumen lokal"><dl>{data.groups.map(group=><div className="cp09-insight-row" key={group.label}><dt>{group.label}</dt><dd className="cp09-bar" aria-hidden="true"><span style={{width:`${group.count/data.total*100}%`}}/></dd><dd>{group.count}</dd></div>)}</dl><figcaption>Denominator: {data.total} dokumen tercatat setelah filter, bukan jumlah revisi, lampiran, atau BA yang seharusnya dibuat. Tag sumber berubah dapat melekat pada status mana pun; tidak ditambahkan ke total. Pemeriksaan lokal selesai belum berarti BA disahkan.</figcaption></figure>}</section>;
}
