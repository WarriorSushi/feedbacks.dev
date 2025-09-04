// Simple in-memory cache for optimizing navigation performance
class NavigationCache {
  private cache = new Map<string, any>();
  private timestamps = new Map<string, number>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: any): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  get(key: string): any | null {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;

    // Check if expired
    if (Date.now() - timestamp > this.TTL) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  has(key: string): boolean {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return false;

    if (Date.now() - timestamp > this.TTL) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return false;
    }

    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Generate cache key for user-specific data
  getUserCacheKey(userId: string, dataType: string): string {
    return `${userId}:${dataType}`;
  }
}

export const navCache = new NavigationCache();