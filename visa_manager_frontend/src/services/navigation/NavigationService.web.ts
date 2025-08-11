import { NavigationInterface, NavigationParams } from './NavigationInterface';

export class WebNavigationService implements NavigationInterface {
  private history: any;

  setHistory(history: any) {
    this.history = history;
  }

  navigate(routeName: string, params?: NavigationParams): void {
    if (!this.history) return;
    
    const path = this.getPathForRoute(routeName);
    const search = params ? `?${new URLSearchParams(params).toString()}` : '';
    this.history.push(`${path}${search}`);
  }

  goBack(): void {
    if (!this.history) return;
    this.history.goBack();
  }

  replace(routeName: string, params?: NavigationParams): void {
    if (!this.history) return;
    
    const path = this.getPathForRoute(routeName);
    const search = params ? `?${new URLSearchParams(params).toString()}` : '';
    this.history.replace(`${path}${search}`);
  }

  reset(routeName: string, params?: NavigationParams): void {
    if (!this.history) return;
    
    const path = this.getPathForRoute(routeName);
    const search = params ? `?${new URLSearchParams(params).toString()}` : '';
    this.history.push(`${path}${search}`);
    
    // Clear history stack
    window.history.replaceState(null, '', `${path}${search}`);
  }

  getCurrentRoute(): string | null {
    if (!this.history) return null;
    return this.history.location.pathname;
  }

  canGoBack(): boolean {
    return window.history.length > 1;
  }

  private getPathForRoute(routeName: string): string {
    const routeMap: { [key: string]: string } = {
      'Login': '/login',
      'Dashboard': '/dashboard',
      'ClientList': '/clients',
      'ClientForm': '/clients/form',
      'TaskAssignment': '/tasks/assignment',
      'CommissionReport': '/commission',
      'Notifications': '/notifications',
    };

    return routeMap[routeName] || `/${routeName.toLowerCase()}`;
  }
}