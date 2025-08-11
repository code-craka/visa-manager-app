export interface NavigationParams {
  [key: string]: any;
}

export interface NavigationInterface {
  navigate(routeName: string, params?: NavigationParams): void;
  goBack(): void;
  replace(routeName: string, params?: NavigationParams): void;
  reset(routeName: string, params?: NavigationParams): void;
  getCurrentRoute(): string | null;
  canGoBack(): boolean;
}

export interface RouteConfig {
  name: string;
  path?: string;
  component: React.ComponentType<any>;
  exact?: boolean;
}