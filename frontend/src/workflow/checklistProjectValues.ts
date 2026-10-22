export type ChecklistProjectInfo={periodStart?:string;periodEnd?:string;packageName:string;contractor:string;balai:string;satker:string;ppk:string;routes:string[];contractNumber?:string};
export function projectChecklistValue(label:string,project?:ChecklistProjectInfo):string|undefined{
 if(!project)return undefined;
 const key=label.trim().toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ');
 if(/^periode(?: pemeriksaan| survei| verifikasi| konsistensi)?$/.test(key)&&project.periodStart&&project.periodEnd)return `${project.periodStart} s.d. ${project.periodEnd}`;
 if(/nama (proyek|project|paket)|nama pekerjaan|^nama kontrak$/.test(key))return project.packageName;
 if(/nomor kontrak|no kontrak/.test(key))return project.contractNumber||undefined;
 if(/^(penyedia jasa|nama penyedia)$/.test(key))return project.contractor;
 if(/^(pengguna jasa|nama balai)$/.test(key))return project.balai;
 if(/nama satker|satuan kerja/.test(key))return project.satker;
 if(/nama ppk/.test(key))return project.ppk;
 if(/^(lokasi|ruas jalan)\s*$/.test(key)&&project.routes.length)return project.routes.join(', ');
 return undefined;
}
