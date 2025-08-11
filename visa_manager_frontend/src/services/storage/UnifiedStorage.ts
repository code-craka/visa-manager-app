import { PlatformUtils } from '../../utils/PlatformUtils';
import { StorageInterface, StorageOptions } from './StorageInterface';
import { WebStorageService } from './StorageService.web';
import { NativeStorageService } from './StorageService.native';

export class UnifiedStorage implements StorageInterface {
  private storage: StorageInterface;

  constructor(options: StorageOptions = {}) {
    if (PlatformUtils.isWeb) {
      this.storage = new WebStorageService(options);
    } else {
      this.storage = new NativeStorageService(options);
    }
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return this.storage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return this.storage.removeItem(key);
  }

  async clear(): Promise<void> {
    return this.storage.clear();
  }

  async getAllKeys(): Promise<string[]> {
    return this.storage.getAllKeys();
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    return this.storage.multiGet(keys);
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    return this.storage.multiSet(keyValuePairs);
  }

  async multiRemove(keys: string[]): Promise<void> {
    return this.storage.multiRemove(keys);
  }

  // Convenience methods
  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  async setObject<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }
}

// Default instance
export const storage = new UnifiedStorage({
  prefix: 'visa_manager_',
});