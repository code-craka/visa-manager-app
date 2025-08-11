import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { theme } from '../../styles/theme';
import ErrorTracking from '../../utils/ErrorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorTracking.captureError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.message}>
                An unexpected error occurred. Please try again.
              </Text>
              {__DEV__ && this.state.error && (
                <Text style={styles.errorDetails}>
                  {this.state.error.message}
                </Text>
              )}
              <Button
                mode="contained"
                onPress={this.handleRetry}
                style={styles.button}
              >
                Try Again
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
    backgroundColor: theme.colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.medium,
  },
  message: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.medium,
  },
  errorDetails: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.medium,
    padding: theme.spacing.small,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.borderRadius.small,
  },
  button: {
    marginTop: theme.spacing.medium,
  },
});

export default ErrorBoundary;