/** Read-only BI projection; input must already be restricted to the user's packages.
 * Session distance is not unique road coverage or physical contract progress. */
import type { OperationalWorkflowState } from '../workflow/model';
export function projectBI(packages: Record<string, OperationalWorkflowState>, survey = 'Semua', period = 'Semua periode') {
  const sessions = Object.entries(packages).flatMap(([packageId, state]) => {
    const counts = new Map<string,number>();
    for (const r of state.dailyRecords) counts.set(r.id,(counts.get(r.id) ?? 0)+1);
    return state.dailyRecords.filter(r => {
      if (r.state !== 'Tercatat' || !r.id || counts.get(r.id) !== 1 || (survey !== 'Semua' && r.surveyType !== survey)) return false;
      if (period.startsWith('Bulan ') && r.date.slice(0,7) !== period.slice(6)) return false;
      if (period.startsWith('Tahun ') && r.date.slice(0,4) !== period.slice(6)) return false;
      return true;
    }).map(r => ({packageId, packageName: state.project.packageName, ...r}));
  });
  const cases = Object.entries(packages).flatMap(([packageId,state]) => {
    const counts = new Map<string,number>();
    for (const c of state.corrections) counts.set(c.id,(counts.get(c.id) ?? 0)+1);
    return state.corrections.filter(c => {
      if (!c.id || counts.get(c.id) !== 1 || (survey !== 'Semua' && c.surveyType !== survey)) return false;
      return true;
    }).map(c => ({packageId, packageName: state.project.packageName, ...c}));
  });
  const daily = new Map<string, number>();
  // Only show recorded session distance for a single survey type, not a cross-survey total.
  if (survey !== 'Semua') for (const r of sessions) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !Number.isFinite(r.lengthKm) || r.lengthKm <= 0) continue;
    daily.set(r.date, (daily.get(r.date) ?? 0) + r.lengthKm);
  }
  return {sessions,cases,distance:[...daily].sort(([a],[b])=>a.localeCompare(b)).map(([name,value])=>({name,value:Math.round(value*1000)/1000}))};
}
