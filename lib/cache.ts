import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      if (now - entry.timestamp > entry.ttl) {
        // Expired, remove it
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      logger.error(`[Cache] Error reading ${key}:`, error);
      return null;
    }
  }
  
  static async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      logger.error(`[Cache] Error writing ${key}:`, error);
    }
  }
  
  static async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`[Cache] Cache hit for ${key}`);
      return cached;
    }
    
    logger.debug(`[Cache] Cache miss for ${key}, fetching...`);
    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);
    return fresh;
  }
  
  static async invalidate(key: string): Promise<void> {
    await AsyncStorage.removeItem(`cache_${key}`);
  }
  
  static async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  }
}


