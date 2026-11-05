import type { Principal } from '../workflow/repository/contracts';
import { readLocalReports } from './adapter';
import type { OperationalWorkflowState } from '../workflow/model';
import { REPORT_NAMES, type ReportFilter, type ReportKind } from './model';
import { filterError, filterReport } from './query';
/** Escape delimiters, Unicode and spreadsheet formula injection, including leading controls. */
export function csvCell(value:string):string {
 const safe=/^[\s\u0000-\u001f]*[=+@-]/.test(value)?`'${value}`:value;
 return `"${safe.replace(/"/g,'""')}"`;
}
export function createReportCsv(packages:Record<string,OperationalWorkflowState>,principal:Principal,kind:ReportKind,filter:ReportFilter){
 const snapshot=readLocalReports(packages,principal);
 if(snapshot.denied)throw new Error('Ekspor teknis tidak tersedia untuk peran ini.');
 if(filterError(filter))throw new Error(filterError(filter));
 const rows=filterReport(snapshot.rows[kind],filter);
 if(!rows.length)throw new Error('Tidak ada rekaman untuk diekspor pada filter ini.');
 const period=`${filter.start||'Tanpa batas awal'} s.d. ${filter.end||'Tanpa batas akhir'}`;
 const table=[['Laporan',REPORT_NAMES[kind]],['Sifat','Informatif; bukan dokumen resmi atau keputusan pengesahan'],['Sumber','Penyimpanan lokal frontend; belum terhubung API laporan/SMD'],['Peran',principal.role],['Periode',period],['Filter paket',filter.packageId||'Semua paket dalam penugasan'],['Filter Balai',filter.balai||'Semua dalam penugasan'],['Filter survei',filter.survey||'Semua'],['Filter status',filter.status||'Semua'],['Peringatan data',snapshot.warnings.join(' | ')||'Tidak ada identitas ganda'],['ID Paket','Nama paket','Balai','Jenis survei','Tanggal','Dasar tanggal','Status sumber','Referensi','Konteks'],...rows.map(r=>[r.packageId,r.packageName,r.balai,r.survey,r.date||'Tanggal belum tersedia',r.dateBasis,r.status,r.reference,r.context])];
 return {filename:`jala-${kind}-${filter.start||'awal'}-${filter.end||'akhir'}.csv`,content:'\uFEFF'+table.map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n',count:rows.length};
}
export function downloadReport(file:ReturnType<typeof createReportCsv>){
 const url=URL.createObjectURL(new Blob([file.content],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=file.filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
