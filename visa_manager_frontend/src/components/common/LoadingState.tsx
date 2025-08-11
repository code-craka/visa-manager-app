import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  size?: 'small' | 'large';
}

const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  children,
  message = 'Loading...',
  size = 'large'
}) => {
  if (!loading) return <>{children}</>;

  return (
    <View style={[
      styles.container,
      Platform.OS === 'web' && styles.webContainer
    ]}>
      <ActivityIndicator 
        size={size} 
        color={theme.colors.primary}
        style={styles.indicator}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.large,
  },
  webContainer: {
    transition: theme.web.transitions.normal,
  },
  indicator: {
    marginBottom: theme.spacing.medium,
  },
  message: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default LoadingState;