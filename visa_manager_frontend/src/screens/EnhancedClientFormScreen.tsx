// Enhanced Client Form Screen with Comprehensive Error Handling and Validation
// Requirements: 1.3, 3.4, 3.5, 4.4

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  HelperText,
  Portal,
  Dialog,
  ActivityIndicator,
  Snackbar,
  Appbar,
  Menu,
  Divider,
  IconButton,
  Chip,
  Banner,
} from 'react-native-paper';
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  VisaType,
  ClientStatus,
} from '../types/Client';
import ApiService from '../services/ApiService';
import { theme, statusColors, visaTypeIcons } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useClientFormValidation } from '../hooks/useFormValidation';
import { useNetworkStatus, useNetworkAwareRequest } from '../hooks/useNetworkStatus';
import { useErrorHandler, ClientErrorBoundary } from '../components/ClientErrorBoundary';

interface EnhancedClientFormScreenProps {
  navigation?: any;
  route?: {
    params?: {
      clientId?: number;
      mode: 'create' | 'edit';
    };
  };
}

interface FormState {
  loading: boolean;
  saving: boolean;
  initialLoading: boolean;
  showUnsavedDialog: boolean;
  snackbarVisible: boolean;
  snackbarMessage: string;
  snackbarType: 'success' | 'error' | 'info';
  visaTypeMenuVisible: boolean;
  statusMenuVisible: boolean;
  emailValidating: boolean;
  emailValidationResult: { isUnique: boolean; reason?: string } | null;
}

const EnhancedClientFormScreen: React.FC<EnhancedClientFormScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { clientId, mode } = route?.params || { mode: 'create' };
  const isEditMode = mode === 'edit' && clientId;

  // Network status and error handling
  const { networkStatus, networkError } = useNetworkStatus();
  const { executeRequest, isRetrying } = useNetworkAwareRequest();
  const { handleError } = useErrorHandler();

  // Form validation
  const {
    formData,
    updateField,
    touchField,
    getFieldError,
    getFieldStatus,
    validateAll,
    resetForm,
    isValid,
    hasErrors,
    isValidating,
  } = useClientFormValidation({
    name: '',
    email: '',
    phone: '',
    visaType: VisaType.TOURIST,
    status: ClientStatus.PENDING,
    notes: '',
  });

  // Form state
  const [state, setState] = useState<FormState>({
    loading: false,
    saving: false,
    initialLoading: !!isEditMode,
    showUnsavedDialog: false,
    snackbarVisible: false,
    snackbarMessage: '',
    snackbarType: 'info',
    visaTypeMenuVisible: false,
    statusMenuVisible: false,
    emailValidating: false,
    emailValidationResult: null,
  });

  // Track if form has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing client data for edit mode
  useEffect(() => {
    if (isEditMode) {
      loadClientData();
    }
  }, [isEditMode, clientId]);

  // Track form changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const loadClientData = async () => {
    try {
      setState(prev => ({ ...prev, initialLoading: true }));

      const client = await executeRequest(
        () => ApiService.getClientById(clientId!),
        { maxRetries: 2, waitForConnection: true }
      );

      if (client.success) {
        const clientData = client.data;
        // Update form data without triggering validation
        Object.keys(clientData).forEach(key => {
          if (key in formData) {
            updateField(key as keyof typeof formData, (clientData as any)[key] || '');
          }
        });
        setHasUnsavedChanges(false);
      } else {
        showSnackbar('Failed to load client data', 'error');
        navigation?.goBack();
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setState(prev => ({ ...prev, initialLoading: false }));
    }
  };

  // Email uniqueness validation with debouncing
  const validateEmailUniqueness = useCallback(async (email: string) => {
    if (!email || email.length < 3) {
      setState(prev => ({ ...prev, emailValidationResult: null }));
      return;
    }

    try {
      setState(prev => ({ ...prev, emailValidating: true }));

      const result = await executeRequest(
        () => ApiService.validateEmailUniqueness(email, isEditMode ? clientId : undefined),
        { maxRetries: 1, retryDelay: 500 }
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          emailValidationResult: result.data,
          emailValidating: false,
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, emailValidating: false }));
      // Don't show error for email validation failures
      console.warn('Email validation failed:', error);
    }
  }, [isEditMode, clientId, executeRequest]);

  // Debounced email validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && getFieldStatus('email').isTouched) {
        validateEmailUniqueness(formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, validateEmailUniqueness, getFieldStatus]);

  // Show snackbar message
  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setState(prev => ({
      ...prev,
      snackbarMessage: message,
      snackbarType: type,
      snackbarVisible: true,
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    try {
      // Validate all fields
      const isFormValid = validateAll();
      
      if (!isFormValid) {
        showSnackbar('Please fix the errors before submitting', 'error');
        return;
      }

      // Check email uniqueness for new clients or email changes
      if (state.emailValidationResult && !state.emailValidationResult.isUnique) {
        showSnackbar('Email address is already in use', 'error');
        return;
      }

      setState(prev => ({ ...prev, saving: true }));

      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        visaType: formData.visaType,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      };

      const result = await executeRequest(
        () => isEditMode 
          ? ApiService.updateClient(clientId!, clientData as UpdateClientRequest)
          : ApiService.createClient(clientData as CreateClientRequest),
        { maxRetries: 2, waitForConnection: true }
      );

      if (result.success) {
        setHasUnsavedChanges(false);
        showSnackbar(
          isEditMode ? 'Client updated successfully' : 'Client created successfully',
          'success'
        );
        
        // Navigate back after showing success message
        setTimeout(() => {
          navigation?.goBack();
        }, 1500);
      } else {
        // Handle specific error cases
        let errorMessage = result.error || 'Failed to save client';
        
        if (result.errorCode === 'DUPLICATE_EMAIL') {
          errorMessage = 'This email address is already in use by another client';
        } else if (result.errorCode === 'VALIDATION_FAILED') {
          errorMessage = 'Please check your input and try again';
        }
        
        showSnackbar(errorMessage, 'error');
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  }, [formData, validateAll, state.emailValidationResult, isEditMode, clientId, executeRequest, navigation, showSnackbar, handleError]);

  // Handle back navigation with unsaved changes check
  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges) {
      setState(prev => ({ ...prev, showUnsavedDialog: true }));
    } else {
      navigation?.goBack();
    }
  }, [hasUnsavedChanges, navigation]);

  // Memoized visa type options
  const visaTypeOptions = useMemo(() => 
    Object.values(VisaType).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      icon: visaTypeIcons[type as VisaType] || 'passport',
    }))
  , []);

  // Memoized status options
  const statusOptions = useMemo(() => 
    Object.values(ClientStatus).map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      color: statusColors[status],
    }))
  , []);

  // Show loading screen for edit mode
  if (state.initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading client data...</Text>
      </View>
    );
  }

  return (
    <ClientErrorBoundary>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleBackPress} />
          <Appbar.Content title={isEditMode ? 'Edit Client' : 'New Client'} />
          <Appbar.Action
            icon="check"
            onPress={handleSubmit}
            disabled={state.saving || !isValid || isValidating}
          />
        </Appbar.Header>

        {/* Network status banner */}
        {networkStatus.isOffline && (
          <Banner
            visible={true}
            actions={[]}
            icon="wifi-off"
            style={styles.offlineBanner}
          >
            You are currently offline. Changes will be saved when connection is restored.
          </Banner>
        )}

        {/* Retry banner */}
        {isRetrying && (
          <Banner
            visible={true}
            actions={[]}
            icon="refresh"
            style={styles.retryBanner}
          >
            <View style={styles.retryContent}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.retryText}>Retrying request...</Text>
            </View>
          </Banner>
        )}

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.formCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Client Information
                </Text>

                {/* Name Field */}
                <TextInput
                  label="Full Name *"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  onBlur={() => touchField('name')}
                  mode="outlined"
                  style={styles.input}
                  error={getFieldStatus('name').hasError}
                  disabled={state.saving}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <HelperText type="error" visible={getFieldStatus('name').hasError}>
                  {getFieldError('name')}
                </HelperText>

                {/* Email Field with uniqueness validation */}
                <View style={styles.emailContainer}>
                  <TextInput
                    label="Email Address *"
                    value={formData.email}
                    onChangeText={(value) => updateField('email', value)}
                    onBlur={() => touchField('email')}
                    mode="outlined"
                    style={styles.input}
                    error={getFieldStatus('email').hasError || Boolean(state.emailValidationResult && !state.emailValidationResult.isUnique)}
                    disabled={state.saving}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    right={
                      state.emailValidating ? (
                        <TextInput.Icon icon={() => <ActivityIndicator size="small" />} />
                      ) : state.emailValidationResult?.isUnique === true ? (
                        <TextInput.Icon icon="check-circle" />
                      ) : state.emailValidationResult?.isUnique === false ? (
                        <TextInput.Icon icon="alert-circle" />
                      ) : null
                    }
                  />
                  <HelperText 
                    type="error" 
                    visible={getFieldStatus('email').hasError || Boolean(state.emailValidationResult && !state.emailValidationResult.isUnique)}
                  >
                    {getFieldError('email') || 
                     (state.emailValidationResult && !state.emailValidationResult.isUnique && 'Email address is already in use')}
                  </HelperText>
                  {state.emailValidationResult?.isUnique && (
                    <HelperText type="info" visible={true}>
                      Email is available
                    </HelperText>
                  )}
                </View>

                {/* Phone Field */}
                <TextInput
                  label="Phone Number"
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  onBlur={() => touchField('phone')}
                  mode="outlined"
                  style={styles.input}
                  error={getFieldStatus('phone').hasError}
                  disabled={state.saving}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
                <HelperText type="error" visible={getFieldStatus('phone').hasError}>
                  {getFieldError('phone')}
                </HelperText>

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Visa Details
                </Text>

                {/* Visa Type Selector */}
                <View style={styles.selectorContainer}>
                  <Text variant="bodyMedium" style={styles.selectorLabel}>
                    Visa Type *
                  </Text>
                  <Menu
                    visible={state.visaTypeMenuVisible}
                    onDismiss={() => setState(prev => ({ ...prev, visaTypeMenuVisible: false }))}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setState(prev => ({ ...prev, visaTypeMenuVisible: true }))}
                        style={[styles.selectorButton, getFieldStatus('visaType').hasError && styles.errorBorder]}
                        contentStyle={styles.selectorButtonContent}
                        disabled={state.saving}
                        icon={visaTypeIcons[formData.visaType as VisaType] || 'passport'}
                      >
                        {visaTypeOptions.find(opt => opt.value === formData.visaType)?.label || 'Select Visa Type'}
                      </Button>
                    }
                  >
                    {visaTypeOptions.map((option) => (
                      <Menu.Item
                        key={option.value}
                        onPress={() => {
                          updateField('visaType', option.value);
                          touchField('visaType');
                          setState(prev => ({ ...prev, visaTypeMenuVisible: false }));
                        }}
                        title={option.label}
                        leadingIcon={option.icon}
                      />
                    ))}
                  </Menu>
                  <HelperText type="error" visible={getFieldStatus('visaType').hasError}>
                    {getFieldError('visaType')}
                  </HelperText>
                </View>

                {/* Status Selector */}
                <View style={styles.selectorContainer}>
                  <Text variant="bodyMedium" style={styles.selectorLabel}>
                    Status *
                  </Text>
                  <Menu
                    visible={state.statusMenuVisible}
                    onDismiss={() => setState(prev => ({ ...prev, statusMenuVisible: false }))}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setState(prev => ({ ...prev, statusMenuVisible: true }))}
                        style={[styles.selectorButton, getFieldStatus('status').hasError && styles.errorBorder]}
                        contentStyle={styles.selectorButtonContent}
                        disabled={state.saving}
                      >
                        {statusOptions.find(opt => opt.value === formData.status)?.label || 'Select Status'}
                      </Button>
                    }
                  >
                    {statusOptions.map((option) => (
                      <Menu.Item
                        key={option.value}
                        onPress={() => {
                          updateField('status', option.value);
                          touchField('status');
                          setState(prev => ({ ...prev, statusMenuVisible: false }));
                        }}
                        title={option.label}
                      />
                    ))}
                  </Menu>
                  <HelperText type="error" visible={getFieldStatus('status').hasError}>
                    {getFieldError('status')}
                  </HelperText>
                </View>

                <Divider style={styles.divider} />

                {/* Notes Field */}
                <TextInput
                  label="Additional Notes"
                  value={formData.notes}
                  onChangeText={(value) => updateField('notes', value)}
                  onBlur={() => touchField('notes')}
                  mode="outlined"
                  style={styles.notesInput}
                  error={getFieldStatus('notes').hasError}
                  disabled={state.saving}
                  multiline
                  numberOfLines={4}
                  placeholder="Enter any additional information about the client..."
                />
                <HelperText type="error" visible={getFieldStatus('notes').hasError}>
                  {getFieldError('notes')}
                </HelperText>
                <HelperText type="info" visible={!getFieldStatus('notes').hasError}>
                  {formData.notes.length}/2000 characters
                </HelperText>
              </Card.Content>
            </Card>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={state.saving}
                disabled={state.saving || !isValid || isValidating || networkStatus.isOffline}
                style={styles.submitButton}
                contentStyle={styles.buttonContent}
              >
                {state.saving ? 'Saving...' : (isEditMode ? 'Update Client' : 'Create Client')}
              </Button>

              <Button
                mode="outlined"
                onPress={handleBackPress}
                disabled={state.saving}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
              >
                Cancel
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Unsaved Changes Dialog */}
        <Portal>
          <Dialog 
            visible={state.showUnsavedDialog} 
            onDismiss={() => setState(prev => ({ ...prev, showUnsavedDialog: false }))}
          >
            <Dialog.Title>Unsaved Changes</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                You have unsaved changes. Are you sure you want to leave without saving?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setState(prev => ({ ...prev, showUnsavedDialog: false }))}>
                Stay
              </Button>
              <Button
                onPress={() => {
                  setState(prev => ({ ...prev, showUnsavedDialog: false }));
                  navigation?.goBack();
                }}
              >
                Leave
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Snackbar for notifications */}
        <Snackbar
          visible={state.snackbarVisible}
          onDismiss={() => setState(prev => ({ ...prev, snackbarVisible: false }))}
          duration={state.snackbarType === 'success' ? 3000 : 5000}
          action={{
            label: 'Dismiss',
            onPress: () => setState(prev => ({ ...prev, snackbarVisible: false })),
          }}
          style={[
            styles.snackbar,
            state.snackbarType === 'error' && styles.errorSnackbar,
            state.snackbarType === 'success' && styles.successSnackbar,
          ]}
        >
          {state.snackbarMessage}
        </Snackbar>
      </View>
    </ClientErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.medium,
    color: theme.colors.onSurface,
  },
  offlineBanner: {
    backgroundColor: theme.colors.errorContainer,
  },
  retryBanner: {
    backgroundColor: theme.colors.primaryContainer,
  },
  retryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    marginLeft: theme.spacing.small,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.medium,
    paddingBottom: theme.spacing.xlarge,
  },
  formCard: {
    marginBottom: theme.spacing.medium,
    elevation: theme.elevation.level2,
  },
  sectionTitle: {
    marginBottom: theme.spacing.medium,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  input: {
    marginBottom: theme.spacing.small,
  },
  emailContainer: {
    marginBottom: theme.spacing.small,
  },
  notesInput: {
    marginBottom: theme.spacing.small,
    minHeight: 100,
  },
  divider: {
    marginVertical: theme.spacing.large,
  },
  selectorContainer: {
    marginBottom: theme.spacing.medium,
  },
  selectorLabel: {
    marginBottom: theme.spacing.small,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  selectorButton: {
    marginBottom: theme.spacing.small,
  },
  selectorButtonContent: {
    height: 48,
    justifyContent: 'flex-start',
  },
  errorBorder: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  buttonContainer: {
    gap: theme.spacing.medium,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    borderColor: theme.colors.outline,
  },
  buttonContent: {
    height: 48,
  },
  snackbar: {
    marginBottom: theme.spacing.medium,
  },
  errorSnackbar: {
    backgroundColor: theme.colors.error,
  },
  successSnackbar: {
    backgroundColor: theme.colors.primary,
  },
});

export default EnhancedClientFormScreen;