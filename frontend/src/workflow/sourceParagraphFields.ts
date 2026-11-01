import type {SourceBlock} from './sourceDocumentModel';
export type ParagraphSlot={id:string;label:string;placeholder:string};
/** Split explicitly labelled placeholders only. Prose and signature placeholders stay intact. */
export function sourceParagraphSlots(block:SourceBlock):ParagraphSlot[]{
 if(block.kind!=='paragraph'||!block.id||!block.text||/[□☐]/.test(block.text)||/tanda tangan|ttd|paraf/i.test(block.text))return [];
 const text=block.text,matches=[...text.matchAll(/\[([^\]]+)\]/g)];
 if(matches.length&&!/^\[.*\]$/.test(text.trim()))return matches.map((m,i)=>({id:`paragraph:${block.id}:m${i}`,label:m[1].trim(),placeholder:m[1]}));
 if(/^\[.*\]$/.test(text.trim()))return [{id:`paragraph:${block.id}:text`,label:block.heading??'Keterangan',placeholder:text}];
 const labels='Nomor Dokumen|No\\. Dokumen|Nama Paket Pekerjaan|Nama Penyedia Jasa|Nomor Kontrak|No\\. Kontrak|Periode Pelaksanaan|Periode Verifikasi|Periode Audit|Periode Data yang Diverifikasi|Tanggal Pengujian|Tanggal Verifikasi|Tanggal Mulai|Tanggal Selesai|Tanggal|Lokasi Uji Konsistensi|Lokasi Kalibrasi/Validasi|Lokasi/Ruas Jalan|Lokasi|Tim QA/QC|Tim Surveyor|Tim Survey|Nama Penilai|Pelaksana Survei|Panjang Segmen Uji|Validator|Periode|Nomor|Nama';
 const slots=[...text.matchAll(new RegExp(`(${labels})\\s*:\\s*(_{3,}|\\.{3,}|//_+)`,'gi'))];
 if(slots.length>1)return slots.map((m,i)=>({id:`paragraph:${block.id}:s${i}`,label:m[1].trim(),placeholder:m[2]}));
 if(/_{3,}|\.{3,}/.test(text))return [{id:`paragraph:${block.id}:text`,label:(/^\s*[^:]+:/.test(text)?text.split(':')[0]:block.heading)||'Keterangan',placeholder:text}];
 return [];
}
