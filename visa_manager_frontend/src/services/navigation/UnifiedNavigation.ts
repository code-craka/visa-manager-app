import { PlatformUtils } from '../../utils/PlatformUtils';
import { NavigationInterface, NavigationParams } from './NavigationInterface';
import { WebNavigationService } from './NavigationService.web';
import { NativeNavigationService } from './NavigationService.native';

class UnifiedNavigationService implements NavigationInterface {
  private service: NavigationInterface;

  constructor() {
    if (PlatformUtils.isWeb) {
      this.service = new WebNavigationService();
    } else {
      this.service = new NativeNavigationService();
    }
  }

  setNavigator(navigator: any) {
    if (this.service instanceof WebNavigationService) {
      this.service.setHistory(navigator);
    } else if (this.service instanceof NativeNavigationService) {
      this.service.setNavigator(navigator);
    }
  }

  navigate(routeName: string, params?: NavigationParams): void {
    this.service.navigate(routeName, params);
  }

  goBack(): void {
    this.service.goBack();
  }

  replace(routeName: string, params?: NavigationParams): void {
    this.service.replace(routeName, params);
  }

  reset(routeName: string, params?: NavigationParams): void {
    this.service.reset(routeName, params);
  }

  getCurrentRoute(): string | null {
    return this.service.getCurrentRoute();
  }

  canGoBack(): boolean {
    return this.service.canGoBack();
  }
}

export const navigationService = new UnifiedNavigationService();