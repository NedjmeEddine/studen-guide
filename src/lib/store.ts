import { useCallback, useEffect, useState } from "react";

const EVT = "ss-store";

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
export function writeJSON(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
}
export function clearPrefix(prefix: string) {
  for (const k of Object.keys(localStorage)) if (k.startsWith(prefix)) localStorage.removeItem(k);
  window.dispatchEvent(new CustomEvent(EVT, { detail: prefix }));
}

/** localStorage-backed state; hydrates after mount to avoid SSR mismatch. */
export function useStored<T>(key: string, fallback: T) {
  const [val, setVal] = useState<T>(fallback);
  useEffect(() => {
    setVal(readJSON(key, fallback));
    const on = (e: Event) => {
      const k = (e as CustomEvent).detail as string;
      const isExact = k === key;
      const isPrefix = k.endsWith(":") ? key.startsWith(k) : key.startsWith(k + ":");
      if (isExact || isPrefix) setVal(readJSON(key, fallback));
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((v: T) => writeJSON(key, v), [key]);
  return [val, set] as const;
}

/** Re-render on any store change (for the progress pill). */
export function useStoreTick() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const on = () => setT((x) => x + 1);
    window.addEventListener(EVT, on);
    setT(1);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return t;
}
