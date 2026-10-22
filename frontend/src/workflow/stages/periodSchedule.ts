import { localPersistence } from '../repository/localPersistence';
export function periodRange(
  packageId: string,
  period: number,
  start?: string,
  end?: string,
) {
  let saved: { startDate?: string; endDate?: string } = {};
  try {
    saved = JSON.parse(
      localPersistence.getItem(`jala-mutu-3b-schedule-v2-${packageId}`) || "{}",
    );
  } catch {
    /* optional fallback */
  }
  const first = start || saved.startDate,
    finish = end || saved.endDate;
  if (!first || !finish) return { start: "", end: "" };
  const date = new Date(first + "T00:00:00Z");
  if (!Number.isFinite(date.getTime())) return { start: "", end: "" };
  date.setUTCDate(date.getUTCDate() + (period - 1) * 14);
  const from = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() + 13);
  const to = date.toISOString().slice(0, 10);
  return { start: from, end: to > finish ? finish : to };
}
