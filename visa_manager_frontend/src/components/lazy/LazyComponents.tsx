import React, { Suspense } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { theme } from '../../styles/theme';

// Direct imports for all platforms (avoiding dynamic imports)
import ClientListScreen from '../../screens/ClientListScreen';
import ClientFormScreen from '../../screens/ClientFormScreen';
import TaskAssignmentScreen from '../../screens/TaskAssignmentScreen';
import CommissionReportScreen from '../../screens/CommissionReportScreen';
import NotificationScreen from '../../screens/NotificationScreen';

export const LazyClientListScreen = ClientListScreen;
export const LazyClientFormScreen = ClientFormScreen;
export const LazyTaskAssignmentScreen = TaskAssignmentScreen;
export const LazyCommissionReportScreen = CommissionReportScreen;
export const LazyNotificationScreen = NotificationScreen;

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

// HOC for consistent loading with optional suspense
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    if (Platform.OS === 'web') {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Component {...props} />
        </Suspense>
      );
    }
    return <Component {...props} />;
  };
};