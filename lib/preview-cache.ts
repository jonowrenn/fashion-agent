type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const globalCache = globalThis as typeof globalThis & {
  __fashionAgentPreviewCache?: Map<string, CacheEntry<unknown>>;
};

function getCacheStore(): Map<string, CacheEntry<unknown>> {
  if (!globalCache.__fashionAgentPreviewCache) {
    globalCache.__fashionAgentPreviewCache = new Map();
  }
  return globalCache.__fashionAgentPreviewCache;
}

export function getCachedValue<T>(key: string): T | null {
  const store = getCacheStore();
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number): void {
  getCacheStore().set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}
