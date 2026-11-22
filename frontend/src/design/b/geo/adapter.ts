import {
  validateMapPoint,
  type VerifiedMapPoint,
} from "../../../mapGeometryValidation";
export type BalaiLocation = VerifiedMapPoint & { balai: string };
export interface BalaiGeographyAdapter {
  readonly available: boolean;
  load(signal: AbortSignal): Promise<readonly unknown[]>;
}
/** No endpoint is invented. A backend integration must supply scoped, sourced geography. */
export const unavailableGeography: BalaiGeographyAdapter = {
  available: false,
  async load() {
    return [];
  },
};
export function scopedBalaiLocations(
  values: readonly unknown[],
  allowed: ReadonlySet<string>,
): BalaiLocation[] {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const point = validateMapPoint(value),
      balai = (value as { balai?: unknown })?.balai;
    if (
      !point ||
      typeof balai !== "string" ||
      !allowed.has(balai) ||
      seen.has(point.id)
    )
      return [];
    seen.add(point.id);
    return [{ ...point, balai }];
  });
}
