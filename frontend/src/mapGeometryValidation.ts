/** Validates external point geometry before any marker is rendered. Never geocode a Balai name. */
export type VerifiedMapPoint = {
  id: string; label: string; latitude: number; longitude: number;
  sourceId: string; sourceSystem: string;
};
export function validateMapPoint(value: unknown): VerifiedMapPoint | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const text = (key: string) => typeof v[key] === 'string' ? (v[key] as string).trim() : '';
  const id = text('id'), label = text('label'), sourceId = text('sourceId'), sourceSystem = text('sourceSystem');
  if (!id || !label || !sourceId || !sourceSystem || id.length > 160 || label.length > 240) return null;
  if (typeof v.latitude !== 'number' || typeof v.longitude !== 'number') return null;
  if (!Number.isFinite(v.latitude) || !Number.isFinite(v.longitude)) return null;
  if (v.latitude < -90 || v.latitude > 90 || v.longitude < -180 || v.longitude > 180) return null;
  // A zero/zero pair is frequently a missing-coordinate sentinel, never display it as a real survey point.
  if (v.latitude === 0 && v.longitude === 0) return null;
  return {id,label,latitude:v.latitude,longitude:v.longitude,sourceId,sourceSystem};
}
export function validMapPoints(values: readonly unknown[]): VerifiedMapPoint[] {
  const ids = new Set<string>();
  return values.map(validateMapPoint).filter((v):v is VerifiedMapPoint => {
    if (!v || ids.has(v.id)) return false;
    ids.add(v.id); return true;
  });
}
