import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
}

class OfflineService {
  private readonly QUEUE_KEY = 'offline_queue';
  private queue: OfflineAction[] = [];

  async initialize(): Promise<void> {
    await this.loadQueue();
  }

  async addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    const offlineAction: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    this.queue.push(offlineAction);
    await this.saveQueue();
  }

  async processQueue(apiService: any): Promise<void> {
    const actionsToProcess = [...this.queue];
    this.queue = [];

    for (const action of actionsToProcess) {
      try {
        await this.executeAction(action, apiService);
      } catch (error) {
        console.error('Failed to process offline action:', error);
        // Re-add failed action to queue
        this.queue.push(action);
      }
    }

    await this.saveQueue();
  }

  private async executeAction(action: OfflineAction, apiService: any): Promise<void> {
    const { type, endpoint, data } = action;

    switch (type) {
      case 'CREATE':
        await apiService.post(endpoint, data);
        break;
      case 'UPDATE':
        await apiService.put(endpoint, data);
        break;
      case 'DELETE':
        await apiService.delete(endpoint);
        break;
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueData = Platform.OS === 'web' 
        ? localStorage.getItem(this.QUEUE_KEY)
        : await AsyncStorage.getItem(this.QUEUE_KEY);

      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const queueData = JSON.stringify(this.queue);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(this.QUEUE_KEY, queueData);
      } else {
        await AsyncStorage.setItem(this.QUEUE_KEY, queueData);
      }
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }
}

export default new OfflineService();