/** Calendar-day helpers for server notification due dates (no DOM/CSS imports, unit-testable). */
export function daysLeft(date: string, today = new Date()) {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}
export function dueText(date: string | null, today = new Date()) {
  if (!date) return '';
  const left = daysLeft(date, today);
  return left < 0 ? `Lewat ${-left} hari` : left === 0 ? 'Jatuh tempo hari ini' : `Tenggat ${left} hari lagi`;
}
