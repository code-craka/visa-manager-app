import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Memory cache
    this.memoryCache.set(key, item);

    // Persistent cache for mobile
    if (Platform.OS !== 'web') {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to cache to AsyncStorage:', error);
      }
    } else {
      // Web localStorage
      try {
        localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to cache to localStorage:', error);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data;
    }

    // Check persistent cache
    try {
      let itemStr: string | null = null;
      
      if (Platform.OS !== 'web') {
        itemStr = await AsyncStorage.getItem(key);
      } else {
        itemStr = localStorage.getItem(key);
      }

      if (itemStr) {
        const item: CacheItem<T> = JSON.parse(itemStr);
        if (this.isValid(item)) {
          // Update memory cache
          this.memoryCache.set(key, item);
          return item.data;
        } else {
          // Remove expired item
          this.remove(key);
        }
      }
    } catch (error) {
      console.warn('Failed to get from cache:', error);
    }

    return null;
  }

  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to remove from cache:', error);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  private isValid<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }
}

export default new CacheService();