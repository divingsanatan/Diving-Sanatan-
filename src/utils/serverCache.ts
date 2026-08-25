interface ServerCacheEntry<T> {
  data: T;
  expiry: number;
}

const serverCache = new Map<string, ServerCacheEntry<any>>();

/**
 * Retrieves data from server in-memory TTL cache, or executes the fetcher function.
 * @param key Unique key for this cache entry
 * @param ttlSeconds Time-to-live in seconds (default 60s)
 * @param fetcher Async function to fetch fresh data
 */
export async function getOrSetServerCache<T>(
  key: string,
  ttlSeconds: number = 60,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = serverCache.get(key);

  if (existing && now < existing.expiry) {
    return existing.data as T;
  }

  const data = await fetcher();
  if (data !== undefined && data !== null) {
    serverCache.set(key, {
      data,
      expiry: now + ttlSeconds * 1000,
    });
  }

  return data;
}

/**
 * Invalidate specific cache key or keys matching a prefix
 */
export function invalidateServerCache(keyOrPrefix?: string) {
  if (!keyOrPrefix) {
    serverCache.clear();
    return;
  }

  for (const key of serverCache.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      serverCache.delete(key);
    }
  }
}
