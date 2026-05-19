/**
 * Low-level localStorage adapter for Speech Adventure core training data.
 *
 * This is the ONLY file in the codebase that calls window.localStorage
 * for domain data (profile, progress, observations, selected sound).
 * All storage modules delegate here so there is a single seam to swap
 * to IndexedDB, a remote API, or a test stub in the future.
 *
 * UI preferences (theme, sidebar) are managed by their own components
 * and are intentionally NOT routed through here.
 */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Read a raw string value. Returns null when the key is absent or on SSR. */
export function localRead(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Write a raw string value. No-ops silently on SSR or when storage is full. */
export function localWrite(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable — silently fail for now
  }
}

/** Remove a key. No-ops silently on SSR. */
export function localRemove(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

/** Check whether a key exists (non-null). Returns false on SSR. */
export function localHas(key: string): boolean {
  return localRead(key) !== null;
}
