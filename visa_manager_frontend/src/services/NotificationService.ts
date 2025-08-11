import { Platform } from 'react-native';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'web') return true;

    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  async show(options: NotificationOptions): Promise<void> {
    if (Platform.OS === 'web') {
      await this.showWebNotification(options);
    } else {
      await this.showNativeNotification(options);
    }
  }

  private async showWebNotification(options: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') return;

    if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: true,
      });
    } else {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        tag: options.tag,
        data: options.data,
      });
    }
  }

  private async showNativeNotification(options: NotificationOptions): Promise<void> {
    // Native notifications would be handled by push notification service
    console.log('Native notification:', options);
  }

  isSupported(): boolean {
    return Platform.OS === 'web' ? 'Notification' in window : true;
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }
}

export default new NotificationService();