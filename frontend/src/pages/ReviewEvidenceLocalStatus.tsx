import {useEffect,useState} from 'react';
import {attachmentRepository} from '../workflow/repository/attachmentRepository';
import {checkLocalReviewEvidence,type LocalReviewEvidenceStatus} from './reviewEvidenceLocal';

const labels:Record<LocalReviewEvidenceStatus,string>={
 'tersedia-lokal':'Berkas dapat dibaca di perangkat ini (belum diverifikasi pemeriksa / server)',
 'tidak-tersedia-lokal':'Berkas tidak ditemukan di perangkat ini',
 'tidak-dapat-diperiksa':'Penyimpanan lokal tidak dapat diperiksa',
 'referensi-belum-terpetakan':'Referensi belum terpetakan ke kunci lampiran paket',
};
export function ReviewEvidenceLocalStatus({packageId,reference}:{packageId:string;reference:string}){
 const [status,setStatus]=useState<LocalReviewEvidenceStatus|null>(null);
 useEffect(()=>{let active=true;setStatus(null);void checkLocalReviewEvidence(packageId,reference,attachmentRepository.get).then(result=>{if(active)setStatus(result);});return()=>{active=false;};},[packageId,reference]);
 return <small role="status">Referensi: {reference} · {status?labels[status]:'Memeriksa berkas lokal…'}</small>;
}
