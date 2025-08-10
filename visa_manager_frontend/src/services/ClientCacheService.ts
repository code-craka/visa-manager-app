// ClientCacheService - Client data caching with proper invalidation strategies
// Requirements: 2.1, 2.2, 2.3, 8.2

import { Client, ClientFilters, ClientStats } from '../types/Client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface ClientListCacheKey {
  filters: ClientFilters;
  userId: string;
}

class ClientCacheService {
  private clientCache = new Map<number, CacheEntry<Client>>();
  private clientListCache = new Map<string, CacheEntry<Client[]>>();
  private clientStatsCache = new Map<string, CacheEntry<ClientStats>>();
  
  // Cache TTL configurations (in milliseconds)
  private readonly CLIENT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLIENT_LIST_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly CLIENT_STATS_TTL = 1 * 60 * 1000; // 1 minute

  /**
   * Generate cache key for client list based on filters
   */
  private generateListCacheKey(filters: ClientFilters, userId: string): string {
    const key: ClientListCacheKey = { filters, userId };
    return JSON.stringify(key);
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Cache individual client
   */
  cacheClient(client: Client): void {
    this.clientCache.set(client.id, {
      data: client,
      timestamp: Date.now(),
      ttl: this.CLIENT_TTL
    });
  }

  /**
   * Get cached client by ID
   */
  getCachedClient(clientId: number): Client | null {
    const entry = this.clientCache.get(clientId);
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    
    // Remove expired entry
    if (entry) {
      this.clientCache.delete(clientId);
    }
    
    return null;
  }

  /**
   * Cache client list with filters
   */
  cacheClientList(clients: Client[], filters: ClientFilters, userId: string): void {
    const cacheKey = this.generateListCacheKey(filters, userId);
    this.clientListCache.set(cacheKey, {
      data: clients,
      timestamp: Date.now(),
      ttl: this.CLIENT_LIST_TTL
    });

    // Also cache individual clients
    clients.forEach(client => this.cacheClient(client));
  }

  /**
   * Get cached client list
   */
  getCachedClientList(filters: ClientFilters, userId: string): Client[] | null {
    const cacheKey = this.generateListCacheKey(filters, userId);
    const entry = this.clientListCache.get(cacheKey);
    
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    
    // Remove expired entry
    if (entry) {
      this.clientListCache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Cache client statistics
   */
  cacheClientStats(stats: ClientStats, userId: string): void {
    this.clientStatsCache.set(userId, {
      data: stats,
      timestamp: Date.now(),
      ttl: this.CLIENT_STATS_TTL
    });
  }

  /**
   * Get cached client statistics
   */
  getCachedClientStats(userId: string): ClientStats | null {
    const entry = this.clientStatsCache.get(userId);
    
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    
    // Remove expired entry
    if (entry) {
      this.clientStatsCache.delete(userId);
    }
    
    return null;
  }

  /**
   * Invalidate client cache when client is updated
   */
  invalidateClient(clientId: number): void {
    this.clientCache.delete(clientId);
    
    // Invalidate all client lists that might contain this client
    this.clientListCache.clear();
    
    // Invalidate all client stats as they might be affected
    this.clientStatsCache.clear();
  }

  /**
   * Invalidate client cache when client is created
   */
  invalidateOnClientCreate(userId: string): void {
    // Clear all client lists for this user
    const keysToDelete: string[] = [];
    this.clientListCache.forEach((_, key) => {
      try {
        const parsedKey: ClientListCacheKey = JSON.parse(key);
        if (parsedKey.userId === userId) {
          keysToDelete.push(key);
        }
      } catch (error) {
        // Invalid key format, remove it
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.clientListCache.delete(key));
    
    // Invalidate client stats
    this.clientStatsCache.delete(userId);
  }

  /**
   * Invalidate client cache when client is deleted
   */
  invalidateOnClientDelete(clientId: number, userId: string): void {
    this.clientCache.delete(clientId);
    this.invalidateOnClientCreate(userId); // Same invalidation logic
  }

  /**
   * Update cached client with new data
   */
  updateCachedClient(updatedClient: Client): void {
    // Update individual client cache
    this.cacheClient(updatedClient);
    
    // Update client in all cached lists
    this.clientListCache.forEach((entry, key) => {
      if (this.isValidCacheEntry(entry)) {
        const updatedList = entry.data.map(client => 
          client.id === updatedClient.id ? updatedClient : client
        );
        
        this.clientListCache.set(key, {
          ...entry,
          data: updatedList,
          timestamp: Date.now() // Refresh timestamp
        });
      }
    });
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.clientCache.clear();
    this.clientListCache.clear();
    this.clientStatsCache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredEntries(): void {
    // Clear expired individual clients
    this.clientCache.forEach((entry, key) => {
      if (!this.isValidCacheEntry(entry)) {
        this.clientCache.delete(key);
      }
    });

    // Clear expired client lists
    this.clientListCache.forEach((entry, key) => {
      if (!this.isValidCacheEntry(entry)) {
        this.clientListCache.delete(key);
      }
    });

    // Clear expired client stats
    this.clientStatsCache.forEach((entry, key) => {
      if (!this.isValidCacheEntry(entry)) {
        this.clientStatsCache.delete(key);
      }
    });
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    clientCacheSize: number;
    clientListCacheSize: number;
    clientStatsCacheSize: number;
  } {
    return {
      clientCacheSize: this.clientCache.size,
      clientListCacheSize: this.clientListCache.size,
      clientStatsCacheSize: this.clientStatsCache.size
    };
  }

  /**
   * Preload clients into cache
   */
  preloadClients(clients: Client[]): void {
    clients.forEach(client => this.cacheClient(client));
  }

  /**
   * Check if client list should be refreshed based on cache age
   */
  shouldRefreshClientList(filters: ClientFilters, userId: string): boolean {
    const cacheKey = this.generateListCacheKey(filters, userId);
    const entry = this.clientListCache.get(cacheKey);
    
    if (!entry) return true;
    
    // Refresh if cache is more than half expired
    const halfTTL = this.CLIENT_LIST_TTL / 2;
    return Date.now() - entry.timestamp > halfTTL;
  }
}

// Export singleton instance
export const clientCacheService = new ClientCacheService();

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  clientCacheService.clearExpiredEntries();
}, 5 * 60 * 1000);

export default clientCacheService;