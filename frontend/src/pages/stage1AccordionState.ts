export const STAGE1_SECTIONS = ['overview', 'teams_equipment', 'calibrations'] as const;
export type Stage1Section = typeof STAGE1_SECTIONS[number];
export type Stage1TeamField = 'nama_tim' | 'penyedia_id' | 'jenis_survei_id';

export function stage1SectionFromDeepLink(search: string, hash = ''): Stage1Section | '' {
  const params = new URLSearchParams(search);
  const requested = params.get('stage1Section');
  if (STAGE1_SECTIONS.some(section => section === requested)) return requested as Stage1Section;
  if (params.has('stage1IriSection')) return 'overview';
  const anchor = hash.replace(/^#/, '').toLowerCase();
  if (anchor.startsWith('stage1-iri-') || anchor === 'stage1-iri') return 'overview';
  if (anchor === 'stage1-overview') return 'overview';
  if (anchor === 'stage1-teams-equipment') return 'teams_equipment';
  if (anchor === 'stage1-calibrations') return 'calibrations';
  return '';
}

export function stage1TeamValidationField(message: string): Stage1TeamField | null {
  if (/nama tim/i.test(message)) return 'nama_tim';
  if (/penyedia jasa/i.test(message)) return 'penyedia_id';
  if (/jenis survei/i.test(message)) return 'jenis_survei_id';
  return null;
}

export function iriSectionFromDeepLink(search: string, sections: readonly string[]): string {
  const requested = new URLSearchParams(search).get('stage1IriSection');
  if (!requested) return '';
  return sections.find(section => section.toLowerCase().replace(/\s+/g, '-') === requested.toLowerCase()) ?? '';
}
