import type {TemplateField} from './docxEngine';
/** UI labels only; source text and field coordinates remain unchanged in the DOCX. */
export function fieldLabel(field:TemplateField){
 const context=field.context.trim();
 if(/^Nomor:/i.test(context))return 'Nomor BA';
 if(/^Pada hari ini/i.test(context))return ['Hari pelaksanaan','Tanggal pelaksanaan','Bulan pelaksanaan'][field.match]??field.label;
 if(/^Nama\s*:/i.test(context)){
  if(/\bNIP\s*:/i.test(context))return ['Nama pihak pertama','NIP pihak pertama','Satuan kerja pihak pertama','Alamat pihak pertama'][field.match]??field.label;
  if(/Perusahaan\s*:/i.test(context))return ['Nama pihak kedua','Jabatan pihak kedua','Perusahaan pihak kedua','Alamat pihak kedua'][field.match]??field.label;
 }
 if(/^Catatan hasil audit/i.test(context))return `Catatan hasil audit · bagian ${field.match+1}`;
 if(/^Tindakan perbaikan yang/i.test(context))return `Tindak lanjut · bagian ${field.match+1}`;
 if(/^Dibuat di:/i.test(context))return field.match===0?'Tempat pembuatan BA':'Tanggal pembuatan BA';
 if(/^\(\.{3,}\)$/.test(context))return 'Nama pada blok tanda tangan';
 if(/^dd\/mm\/yyyy$/i.test(field.label))return 'Tanggal';
 return field.columnLabel||field.label;
}
