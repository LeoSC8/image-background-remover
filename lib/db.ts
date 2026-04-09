/**
 * Get D1 database binding from Cloudflare Workers context.
 * Mirrors the approach used in lib/auth.ts.
 */
export function getD1() {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-context__")]
  return ctx?.env?.DB
}
