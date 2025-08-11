import React, { lazy, Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { theme } from '../../styles/theme';

// Lazy load large components
export const LazyClientListScreen = lazy(() => import('../../screens/ClientListScreen'));
export const LazyClientFormScreen = lazy(() => import('../../screens/ClientFormScreen'));
export const LazyTaskAssignmentScreen = lazy(() => import('../../screens/TaskAssignmentScreen'));
export const LazyCommissionReportScreen = lazy(() => import('../../screens/CommissionReportScreen'));
export const LazyNotificationScreen = lazy(() => import('../../screens/NotificationScreen'));

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

// HOC for lazy loading with suspense
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};