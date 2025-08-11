import React, { lazy, Suspense } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { theme } from '../../styles/theme';

// Lazy load large components (web only)
export const LazyClientListScreen = Platform.OS === 'web' 
  ? lazy(() => import('../../screens/ClientListScreen'))
  : require('../../screens/ClientListScreen').default;

export const LazyClientFormScreen = Platform.OS === 'web'
  ? lazy(() => import('../../screens/ClientFormScreen'))
  : require('../../screens/ClientFormScreen').default;

export const LazyTaskAssignmentScreen = Platform.OS === 'web'
  ? lazy(() => import('../../screens/TaskAssignmentScreen'))
  : require('../../screens/TaskAssignmentScreen').default;

export const LazyCommissionReportScreen = Platform.OS === 'web'
  ? lazy(() => import('../../screens/CommissionReportScreen'))
  : require('../../screens/CommissionReportScreen').default;

export const LazyNotificationScreen = Platform.OS === 'web'
  ? lazy(() => import('../../screens/NotificationScreen'))
  : require('../../screens/NotificationScreen').default;

// Loading component
const LoadingFallback = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background
  }}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
);

// HOC for lazy loading with suspense (web only)
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P> | React.LazyExoticComponent<React.ComponentType<P>>
) => {
  return (props: P) => {
    if (Platform.OS === 'web' && 'render' in Component) {
      // Lazy component
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Component {...props} />
        </Suspense>
      );
    }
    // Regular component
    const RegularComponent = Component as React.ComponentType<P>;
    return <RegularComponent {...props} />;
  };
};