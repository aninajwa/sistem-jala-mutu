/** Local entity identity only, never an authorization token. getRandomValues works on HTTP. */
export function createLocalId(
  provider:
    | (Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">>)
    | undefined = globalThis.crypto,
): string {
  if (typeof provider?.randomUUID === "function") {
    try {
      return provider.randomUUID();
    } catch {
      /* Fall back to CSPRNG UUID v4. */
    }
  }
  if (typeof provider?.getRandomValues !== "function") {
    throw new Error(
      "Pembuat ID aman tidak tersedia pada browser ini. Gunakan browser yang mendukung Web Crypto.",
    );
  }
  const bytes = provider.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
