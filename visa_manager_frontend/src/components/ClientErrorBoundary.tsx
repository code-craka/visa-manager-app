// Client Error Boundary Component
// Requirements: 1.3, 3.4, 3.5, 4.4

import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Text,
  Button,
  IconButton,
  Portal,
  Dialog,
  ActivityIndicator,
} from 'react-native-paper';
import { theme } from '../styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

export class ClientErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (__DEV__) {
      console.error('ClientErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: In production, send error to crash reporting service
    // Example: Crashlytics.recordError(error);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    });
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  getErrorMessage = (error: Error): string => {
    // Provide user-friendly error messages based on error type
    if (error.message.includes('Network request failed')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (error.message.includes('JSON')) {
      return 'There was a problem processing the server response. Please try again.';
    }

    if (error.message.includes('Authentication')) {
      return 'Your session has expired. Please log in again.';
    }

    if (error.message.includes('Permission')) {
      return 'You do not have permission to perform this action.';
    }

    if (error.message.includes('Validation')) {
      return 'The information provided is invalid. Please check your input and try again.';
    }

    // Default message for unknown errors
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };

  getErrorTitle = (error: Error): string => {
    if (error.message.includes('Network')) {
      return 'Connection Error';
    }

    if (error.message.includes('Authentication')) {
      return 'Authentication Error';
    }

    if (error.message.includes('Permission')) {
      return 'Permission Error';
    }

    if (error.message.includes('Validation')) {
      return 'Validation Error';
    }

    return 'Application Error';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const errorTitle = this.getErrorTitle(this.state.error);
      const errorMessage = this.getErrorMessage(this.state.error);

      return (
        <View style={styles.container}>
          <Card style={styles.errorCard}>
            <Card.Content>
              <View style={styles.errorHeader}>
                <IconButton
                  icon="alert-circle"
                  size={48}
                  iconColor={theme.colors.error}
                  style={styles.errorIcon}
                />
                <Text variant="headlineSmall" style={styles.errorTitle}>
                  {errorTitle}
                </Text>
              </View>

              <Text variant="bodyLarge" style={styles.errorMessage}>
                {errorMessage}
              </Text>

              {this.state.retryCount > 0 && (
                <Text variant="bodySmall" style={styles.retryInfo}>
                  Retry attempt {this.state.retryCount} of {this.maxRetries}
                </Text>
              )}

              <View style={styles.actionButtons}>
                {canRetry && (
                  <Button
                    mode="contained"
                    onPress={this.handleRetry}
                    style={styles.retryButton}
                    icon="refresh"
                  >
                    Try Again
                  </Button>
                )}

                <Button
                  mode="outlined"
                  onPress={this.handleReset}
                  style={styles.resetButton}
                >
                  Reset
                </Button>

                {__DEV__ && (
                  <Button
                    mode="text"
                    onPress={this.toggleDetails}
                    style={styles.detailsButton}
                  >
                    {this.state.showDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                )}
              </View>

              {/* Development error details */}
              {__DEV__ && this.state.showDetails && (
                <View style={styles.errorDetails}>
                  <Text variant="labelMedium" style={styles.detailsTitle}>
                    Error Details (Development Only)
                  </Text>
                  <Text variant="bodySmall" style={styles.detailsText}>
                    {this.state.error.name}: {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <Text variant="bodySmall" style={styles.stackTrace}>
                      {this.state.error.stack}
                    </Text>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Error details dialog */}
          <Portal>
            <Dialog
              visible={this.state.showDetails && !__DEV__}
              onDismiss={this.toggleDetails}
            >
              <Dialog.Title>Error Details</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium">
                  Error ID: {Date.now().toString(36)}
                </Text>
                <Text variant="bodySmall" style={styles.errorCode}>
                  {this.state.error.name}: {this.state.error.message}
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={this.toggleDetails}>Close</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping screens with error boundary
export function withClientErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  customFallback?: ReactNode
) {
  const WithErrorBoundary = (props: P) => (
    <ClientErrorBoundary fallback={customFallback}>
      <WrappedComponent {...props} />
    </ClientErrorBoundary>
  );

  WithErrorBoundary.displayName = `withClientErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundary;
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error caught:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
    backgroundColor: theme.colors.background,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    elevation: theme.elevation.level3,
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.large,
  },
  errorIcon: {
    margin: 0,
  },
  errorTitle: {
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.small,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: theme.spacing.large,
    color: theme.colors.onSurface,
  },
  retryInfo: {
    textAlign: 'center',
    marginBottom: theme.spacing.medium,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actionButtons: {
    gap: theme.spacing.medium,
    alignItems: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
  resetButton: {
    minWidth: 120,
  },
  detailsButton: {
    marginTop: theme.spacing.small,
  },
  errorDetails: {
    marginTop: theme.spacing.large,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.small,
  },
  detailsTitle: {
    color: theme.colors.error,
    marginBottom: theme.spacing.small,
    fontWeight: '600',
  },
  detailsText: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.small,
    fontFamily: 'monospace',
  },
  stackTrace: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  errorCode: {
    marginTop: theme.spacing.small,
    fontFamily: 'monospace',
    color: theme.colors.onSurfaceVariant,
  },
});

export default ClientErrorBoundary;