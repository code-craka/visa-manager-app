import { Platform } from 'react-native';

export class SecurityUtils {
  // XSS Protection - Sanitize HTML input
  static sanitizeHtml(input: string): string {
    if (Platform.OS !== 'web') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Input validation
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }

  // CSRF Token generation
  static generateCSRFToken(): string {
    if (Platform.OS !== 'web') return '';
    
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Secure token storage
  static async storeSecureToken(key: string, token: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use sessionStorage for web (more secure than localStorage)
      sessionStorage.setItem(key, token);
    } else {
      // Use secure storage for native
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(key, token);
    }
  }

  static async getSecureToken(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return sessionStorage.getItem(key);
    } else {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.getItem(key);
    }
  }

  static async removeSecureToken(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      sessionStorage.removeItem(key);
    } else {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem(key);
    }
  }
}