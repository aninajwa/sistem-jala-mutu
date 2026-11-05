import { PACKAGE_WORKFLOW_ITEMS } from '../workflow/roleNavigation';

export const SERVER_STAGE3A = '/entry:Survei harian';
export const SERVER_STAGE3B = '/verification:Verval 14 hari';

export function serverPackageStage(selection: string) {
  if (selection === SERVER_STAGE3A) return 'stage3a-prototype' as const;
  if (selection === SERVER_STAGE3B) return 'stage3b-readonly' as const;
  if (selection === '/packages:Ringkasan Paket' || selection === '/entry:Persiapan & SPMK' || selection === '/documents:Kalibrasi & personel' || selection === '/entry:Validasi produksi') return 'implemented' as const;
  return PACKAGE_WORKFLOW_ITEMS.some(item => item.selection === selection) ? 'placeholder' as const : 'other' as const;
}
