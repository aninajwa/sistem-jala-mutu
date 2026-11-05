import { isValidReviewDate } from '../pages/reviewDateValidation';
import type { ReportFilter, ReportRow } from './model';
export function filterError(f:ReportFilter):string {
 if((f.start&&!isValidReviewDate(f.start))||(f.end&&!isValidReviewDate(f.end)))return 'Tanggal filter tidak valid.';
 if(f.start&&f.end&&f.start>f.end)return 'Tanggal awal harus sebelum atau sama dengan tanggal akhir.';
 return '';
}
export function filterReport(rows:ReportRow[],f:ReportFilter):ReportRow[]{
 if(filterError(f))return [];
 return rows.filter(r=>(!f.packageId||r.packageId===f.packageId)&&(!f.balai||r.balai===f.balai)&&(!f.survey||r.survey===f.survey)&&(!f.status||r.status===f.status)&&(!f.start||!!r.date&&r.date>=f.start)&&(!f.end||!!r.date&&r.date<=f.end));
}
export function summarizeReport(rows:ReportRow[]) {
 return {records:rows.length,packages:new Set(rows.map(r=>r.packageId)).size,undated:rows.filter(r=>!r.date).length,statuses:[...new Set(rows.map(r=>r.status))].sort().map(status=>({status,count:rows.filter(r=>r.status===status).length}))};
}
