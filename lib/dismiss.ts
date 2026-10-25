/** Per-viewer "dismissed" flags kept in localStorage. Storage can be missing or throw
 *  (private windows, blocked site data), so every access is wrapped and the UI must
 *  work without it (the banner just shows again). */
type Store = Pick<Storage, "getItem" | "setItem">;
const key = (name: string) => `playnext:dismissed:${name}`;

function defaultStore(): Store | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function isDismissed(name: string, store: Store | null = defaultStore()): boolean {
  try {
    return store?.getItem(key(name)) === "1";
  } catch {
    return false;
  }
}

export function dismiss(name: string, store: Store | null = defaultStore()): void {
  try {
    store?.setItem(key(name), "1");
  } catch {
    /* ignore: dismissal just won't persist */
  }
}
