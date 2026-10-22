export type DataReceipt={kind:'manual'|'local'|'file'|'api';reference?:string;receivedAt?:string;system?:string;fileDigest?:string};
/** A legacy source-mode label is not a transport receipt. API display requires a connected adapter. */
export function dataOrigin(mode:string|undefined,receipt?:DataReceipt,apiConnected=false){
 if(receipt?.kind==='api'&&apiConnected&&receipt.reference&&receipt.receivedAt&&receipt.system)return {label:'Diterima dari sistem sumber',detail:`${receipt.system} · diterima ${receipt.receivedAt}`,readOnly:true};
 if(receipt?.kind==='file'&&receipt.fileDigest&&receipt.reference)return {label:'Diimpor dari berkas',detail:`Berkas ${receipt.reference}; nilai hasil impor dapat diperiksa.`,readOnly:false};
 if(mode==='Pencatatan manual'||mode==='Input manual fallback'||receipt?.kind==='manual')return {label:'Pencatatan manual',detail:'Nilai dicatat oleh Penyedia di perangkat ini.',readOnly:false};
 if(mode==='Lampiran / bukti kegiatan'||mode==='Import/evidence')return {label:'Lampiran hasil uji',detail:'Berkas pendukung dikelola pada Dokumen & Lampiran; nilai yang dicatat bukan hasil impor otomatis.',readOnly:false};
 return {label:'Data lokal tersimpan',detail:'Belum ada bukti penerimaan dari API. Nilai lokal dapat diperiksa dan diperbaiki oleh Penyedia.',readOnly:false};
}
