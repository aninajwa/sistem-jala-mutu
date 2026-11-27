import rawCatalog from './templateCatalog.json';
import type {OperationalWorkflowState,SurveyType} from '../model';
export type BaKind='kalibrasi'|'konsistensi'|'internal'|'duaMingguan'|'bertahap'|'audit'|'penerimaan';
export type TemplateField={id:string;part:string;paragraph:number;match:number;placeholder:string;label:string;context:string;survey?:string;section?:string;tableRow?:number;tableColumn?:number;columnLabel?:string;required?:boolean;choices?:string[];target?:{kind:string;table?:number;row?:number;column?:number;columns?:number[];paragraphs?:number[]}};
export type BaTemplate={id:BaKind;title:string;filename:string;source:string;sha256:string;fields:TemplateField[];attachmentRequirements?:string[];bodyRanges:Record<string,number[]>};
export const BA_TEMPLATES=rawCatalog as unknown as BaTemplate[];
/** Applicability follows the named survey sections in the original templates. */
export function fieldsFor(template:BaTemplate,survey:SurveyType){return template.fields.filter(f=>{
 if(f.survey)return f.survey===survey;
 const section=f.section??'';
 if(/Survei Profil Memanjang|Untuk Alat IRI/i.test(section))return survey==='IRI';
 if(/Survei Kondisi Perkerasan Jalan \(PCI\)/i.test(section))return survey==='PCI';
 if(/Survei Jembatan/i.test(section))return survey==='Jembatan';
 if(/Survei Lainnya/i.test(section))return !['IRI','PCI','Jembatan'].includes(survey);
 return true;
});}
export function automaticFields(template:BaTemplate,state:OperationalWorkflowState,survey:SurveyType,range:{start:string;end:string},auditLevel:1|2|3=1){
 const values:Record<string,string>={};
 for(const field of fieldsFor(template,survey)){
  const label=field.label.toLowerCase().trim();let value='';
  if(/^(diisi nomor dokumen|nomor ba)/.test(label))value=template.id==='penerimaan'?state.acceptance.finalAcceptanceBa??'':template.id==='audit'?state.audits[auditLevel-1].baNumber:template.id==='kalibrasi'?state.productionApprovalBa:state.cycle.certificateId;
  // Enter the activity date explicitly; the simulation clock is not activity evidence.
  else if(/^jenis surve[yi]$/.test(label)&&(!field.tableRow||field.tableRow===1&&/^3\.1\b/.test(field.section??'')))value=survey;
  else if(/^(ruas|ruas\/lokasi)$/.test(label)&&!field.tableRow)value=state.project.routes.join(', ');
  else if(/^(lokasi kegiatan|lokasi inspeksi|lokasi audit|lokasi pelaksanaan konsistensi|lokasi pelaksanaan kalibrasi dan validasi|lokasi survei)$/.test(label))value=state.project.routes.join(', ');
  else if(/^(periode|tanggal awal - tanggal akhir periode 2 minggu)$/.test(label)&&!field.target)value=range.start&&range.end?`${range.start} s.d. ${range.end}`:'';
  else if(label==='penyedia jasa')value=state.project.contractor;
  else if(/^(nama paket|nama pekerjaan|nama proyek)$/.test(label))value=state.project.packageName;
  else if(/^(nomor kontrak|no\.? kontrak)$/.test(label))value=state.project.contractNumber??'';
  else if(/^(satuan kerja|satker)$/.test(label))value=state.project.satker;
  else if(label==='balai')value=state.project.balai;
  else if(/ketentuan dalam kontrak atau kerangka/.test(label))value=state.project.contractNumber?`Kontrak ${state.project.contractNumber}`:'';
  if(value)values[field.id]=value;
 }
 return values;
}
