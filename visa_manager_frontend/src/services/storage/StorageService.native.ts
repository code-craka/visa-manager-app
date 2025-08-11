import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageInterface, StorageOptions } from './StorageInterface';

export class NativeStorageService implements StorageInterface {
  private prefix: string;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || '';
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const item = await AsyncStorage.getItem(this.getKey(key));
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
    await AsyncStorage.setItem(this.getKey(key), JSON.stringify(item));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    if (this.prefix) {
      const keys = await this.getAllKeys();
      await this.multiRemove(keys);
    } else {
      await AsyncStorage.clear();
    }
  }

  async getAllKeys(): Promise<string[]> {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length));
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    const prefixedKeys = keys.map(key => this.getKey(key));
    const results = await AsyncStorage.multiGet(prefixedKeys);
    
    return results.map(([key, value], index) => {
      if (!value) return [keys[index], null];
      
      try {
        const parsed = JSON.parse(value);
        if (parsed.ttl && Date.now() > parsed.ttl) {
          this.removeItem(keys[index]);
          return [keys[index], null];
        }
        return [keys[index], parsed.value];
      } catch {
        return [keys[index], null];
      }
    });
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    const prefixedPairs = keyValuePairs.map(([key, value]) => [
      this.getKey(key),
      JSON.stringify({ value, timestamp: Date.now() })
    ]);
    await AsyncStorage.multiSet(prefixedPairs);
  }

  async multiRemove(keys: string[]): Promise<void> {
    const prefixedKeys = keys.map(key => this.getKey(key));
    await AsyncStorage.multiRemove(prefixedKeys);
  }
}