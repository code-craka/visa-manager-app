import { Platform } from 'react-native';

export type PlatformType = 'web' | 'ios' | 'android' | 'native';

export class PlatformUtils {
  static get current(): PlatformType {
    if (Platform.OS === 'web') return 'web';
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'native';
  }

  static get isWeb(): boolean {
    return Platform.OS === 'web';
  }

  static get isMobile(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  static get isIOS(): boolean {
    return Platform.OS === 'ios';
  }

  static get isAndroid(): boolean {
    return Platform.OS === 'android';
  }

  static select<T>(options: {
    web?: T;
    ios?: T;
    android?: T;
    native?: T;
    default?: T;
  }): T | undefined {
    if (this.isWeb && options.web !== undefined) return options.web;
    if (this.isIOS && options.ios !== undefined) return options.ios;
    if (this.isAndroid && options.android !== undefined) return options.android;
    if (this.isMobile && options.native !== undefined) return options.native;
    return options.default;
  }

  static getBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
    if (!this.isWeb) return 'mobile';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  static isTouchDevice(): boolean {
    if (this.isMobile) return true;
    if (!this.isWeb) return false;
    
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}

export const platformSelect = PlatformUtils.select.bind(PlatformUtils);