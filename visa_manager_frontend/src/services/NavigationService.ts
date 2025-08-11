import { Platform } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

class NavigationService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  navigate(routeName: string, params?: any) {
    if (Platform.OS === 'web') {
      // Web navigation using browser history
      const url = this.getWebUrl(routeName, params);
      window.history.pushState(null, '', url);
    } else {
      // Native navigation
      if (this.navigationRef) {
        this.navigationRef.navigate(routeName, params);
      }
    }
  }

  goBack() {
    if (Platform.OS === 'web') {
      window.history.back();
    } else {
      if (this.navigationRef) {
        this.navigationRef.goBack();
      }
    }
  }

  reset(routeName: string, params?: any) {
    if (Platform.OS === 'web') {
      const url = this.getWebUrl(routeName, params);
      window.history.replaceState(null, '', url);
    } else {
      if (this.navigationRef) {
        this.navigationRef.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        });
      }
    }
  }

  private getWebUrl(routeName: string, params?: any): string {
    const routeMap: Record<string, string> = {
      'Login': '/login',
      'Register': '/register',
      'Dashboard': '/dashboard',
      'ClientList': '/clients',
      'ClientForm': params?.mode === 'create' ? '/clients/new' : `/clients/${params?.clientId}/edit`,
      'TaskAssignment': '/tasks',
      'Commission': '/commission',
      'Notifications': '/notifications',
    };

    return routeMap[routeName] || '/dashboard';
  }

  getCurrentRoute() {
    if (Platform.OS === 'web') {
      return window.location.pathname;
    } else {
      return this.navigationRef?.getCurrentRoute()?.name;
    }
  }
}

export default new NavigationService();