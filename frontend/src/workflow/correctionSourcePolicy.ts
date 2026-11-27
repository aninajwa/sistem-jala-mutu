/** Source-stage pairs used by existing source workspaces and manual entry.
 * Administrative reminders are not technical QA/QC findings. */
export const manualCorrectionSources = ['Validasi produksi','Verval 14 hari','Validasi sistem LRS'] as const;
const stages: Readonly<Record<string,string>> = {
 'Validasi produksi':'Validasi produksi', 'Uji coba gagal':'Validasi produksi',
 'Verval 14 hari':'Verval 14 hari', 'Temuan proses verval':'Verval 14 hari',
 'Validasi sistem LRS':'Gerbang RNI/LRS', 'Pemeriksaan kalibrasi':'Kalibrasi',
 'Persiapan':'Persiapan',
};
export function correctionSourceStage(source:string):string|undefined { return Object.hasOwn(stages,source)?stages[source]:undefined; }
export function isAdministrativeReminder(source:string):boolean {
 return typeof source === 'string' && (source.startsWith('Notifikasi H+0') || source === 'Pengingat H+0 terlewat');
}
