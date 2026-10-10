// Storage can be disabled by browser policy; retain session state in memory in that case.
const sessionFlags = new Set<string>();
export function hasAdSessionFlag(key: string): boolean {
  if (sessionFlags.has(key)) return true;
  try { return sessionStorage.getItem(key) === "true"; } catch { return false; }
}
export function setAdSessionFlag(key: string): void {
  sessionFlags.add(key);
  try { sessionStorage.setItem(key, "true"); } catch { /* The in-memory flag remains usable. */ }
}
