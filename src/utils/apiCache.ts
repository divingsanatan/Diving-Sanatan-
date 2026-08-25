"use client";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh TTL

/**
 * Client-side Stale-While-Revalidate cached fetch helper.
 * Returns cached data immediately if available, while revalidating in background.
 */
export async function cachedFetch<T>(
  url: string,
  fetchOptions?: RequestInit,
  onRevalidate?: (freshData: T) => void
): Promise<T> {
  const cacheKey = `ds_api_cache_${url}`;
  const now = Date.now();

  // 1. Check memory cache first
  if (memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey)!;
    // Revalidate in background asynchronously
    fetchAndCache<T>(url, fetchOptions, cacheKey)
      .then((fresh) => {
        if (fresh && onRevalidate) onRevalidate(fresh);
      })
      .catch((err) => console.warn("Background revalidate error:", err));

    return entry.data as T;
  }

  // 2. Check localStorage/sessionStorage cache if in browser environment
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        memoryCache.set(cacheKey, parsed);

        // Revalidate in background asynchronously
        fetchAndCache<T>(url, fetchOptions, cacheKey)
          .then((fresh) => {
            if (fresh && onRevalidate) onRevalidate(fresh);
          })
          .catch((err) => console.warn("Background revalidate error:", err));

        return parsed.data;
      }
    } catch (e) {
      // Storage access blocked or invalid
    }
  }

  // 3. Cache miss: Perform direct fetch synchronously
  return await fetchAndCache<T>(url, fetchOptions, cacheKey);
}

async function fetchAndCache<T>(
  url: string,
  fetchOptions?: RequestInit,
  cacheKey?: string
): Promise<T> {
  const key = cacheKey || `ds_api_cache_${url}`;
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data = (await res.json()) as T;

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  memoryCache.set(key, entry);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      // Ignore quota errors
    }
  }

  return data;
}

/**
 * Clear cached endpoint or all client caches
 */
export function clearApiCache(url?: string) {
  if (url) {
    const cacheKey = `ds_api_cache_${url}`;
    memoryCache.delete(cacheKey);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(cacheKey);
      } catch (e) {}
    }
  } else {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith("ds_api_cache_")) {
            sessionStorage.removeItem(k);
          }
        });
      } catch (e) {}
    }
  }
}
