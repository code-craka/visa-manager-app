import { NavigationInterface, NavigationParams } from './NavigationInterface';

export class NativeNavigationService implements NavigationInterface {
  private navigator: any;

  setNavigator(navigator: any) {
    this.navigator = navigator;
  }

  navigate(routeName: string, params?: NavigationParams): void {
    if (!this.navigator) return;
    this.navigator.navigate(routeName, params);
  }

  goBack(): void {
    if (!this.navigator) return;
    this.navigator.goBack();
  }

  replace(routeName: string, params?: NavigationParams): void {
    if (!this.navigator) return;
    this.navigator.replace(routeName, params);
  }

  reset(routeName: string, params?: NavigationParams): void {
    if (!this.navigator) return;
    this.navigator.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  }

  getCurrentRoute(): string | null {
    if (!this.navigator) return null;
    return this.navigator.getCurrentRoute()?.name || null;
  }

  canGoBack(): boolean {
    if (!this.navigator) return false;
    return this.navigator.canGoBack();
  }
}