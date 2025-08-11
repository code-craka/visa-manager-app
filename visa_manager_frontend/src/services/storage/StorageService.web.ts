import { StorageInterface, StorageOptions } from './StorageInterface';

export class WebStorageService implements StorageInterface {
  private storage: Storage;
  private prefix: string;

  constructor(options: StorageOptions = {}) {
    this.storage = options.encrypt ? sessionStorage : localStorage;
    this.prefix = options.prefix || '';
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const item = this.storage.getItem(this.getKey(key));
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (parsed.ttl && Date.now() > parsed.ttl) {
        await this.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const item = {
      value,
      timestamp: Date.now(),
    };
    this.storage.setItem(this.getKey(key), JSON.stringify(item));
  }

  async removeItem(key: string): Promise<void> {
    this.storage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    if (this.prefix) {
      const keys = await this.getAllKeys();
      await this.multiRemove(keys);
    } else {
      this.storage.clear();
    }
  }

  async getAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    const results: Array<[string, string | null]> = [];
    for (const key of keys) {
      const value = await this.getItem(key);
      results.push([key, value]);
    }
    return results;
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    for (const [key, value] of keyValuePairs) {
      await this.setItem(key, value);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key);
    }
  }
}