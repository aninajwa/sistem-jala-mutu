import type { OperationalWorkflowState } from '../workflow/model';
export type ReportKind = 'activities' | 'reviews' | 'corrections';
export const REPORT_NAMES: Record<ReportKind,string> = {
 activities:'Rekap aktivitas survei', reviews:'Rekap pemeriksaan terkini', corrections:'Rekap tindakan perbaikan',
};
export type ReportRow = {
 key:string; packageId:string; packageName:string; balai:string; survey:string;
 date:string; dateBasis:string; status:string; reference:string; context:string;
};
export type ReportSnapshot = {packages:Record<string,OperationalWorkflowState>; rows:Record<ReportKind,ReportRow[]>; warnings:string[]; denied:boolean};
export type ReportFilter = {start:string;end:string;packageId:string;balai:string;survey:string;status:string};
export const EMPTY_FILTER:ReportFilter = {start:'',end:'',packageId:'',balai:'',survey:'',status:''};
