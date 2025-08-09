// ClientFormScreen - Comprehensive client creation and editing form
// Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  HelperText,
  Chip,
  Portal,
  Dialog,
  ActivityIndicator,
  Snackbar,
  Appbar,
  Menu,
  Divider,
  IconButton,
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

interface ClientFormScreenProps {
  navigation?: any;
  route?: {
    params?: {
      clientId?: number;
      mode: 'create' | 'edit';
    };
  };
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  visaType: VisaType;
  status: ClientStatus;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  visaType?: string;
  status?: string;
  notes?: string;
}

interface ValidationState {
  isValid: boolean;
  errors: FormErrors;
}

const ClientFormScreen: React.FC<ClientFormScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { clientId, mode } = route?.params || { mode: 'create' };
  const isEditMode = mode === 'edit' && clientId;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    visaType: VisaType.TOURIST,
    status: ClientStatus.PENDING,
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(isEditMode);

  // UI state
  const [visaTypeMenuVisible, setVisaTypeMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing client data for edit mode
  useEffect(() => {
    if (isEditMode) {
      loadClientData();
    }
  }, [isEditMode, clientId]);

  const loadClientData = async () => {
    if (!clientId) return;

    try {
      setInitialLoading(true);
      const response = await ApiService.getClientById(clientId);

      if (response.success) {
        const client = response.data;
        setFormData({
          name: client.name,
          email: client.email,
          phone: client.phone || '',
          visaType: client.visaType,
          status: client.status,
          notes: client.notes || '',
        });
      } else {
        showSnackbar('Failed to load client data');
        navigation?.goBack();
      }
    } catch (error) {
      console.error('Error loading client:', error);
      showSnackbar('Error loading client data');
      navigation?.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  // Real-time validation
  const validateField = useCallback((field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.length > 255) return 'Name must not exceed 255 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
        return undefined;

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (value.length > 255) return 'Email must not exceed 255 characters';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return undefined;

      case 'phone':
        if (value && value.trim()) {
          if (value.length > 50) return 'Phone number must not exceed 50 characters';
          if (!/^\+?[\d\s\-\(\)]+$/.test(value)) return 'Please enter a valid phone number';
        }
        return undefined;

      case 'notes':
        if (value && value.length > 2000) return 'Notes must not exceed 2000 characters';
        return undefined;

      default:
        return undefined;
    }
  }, []);

  // Form validation
  const validateForm = useCallback((): ValidationState => {
    const newErrors: FormErrors = {};

    newErrors.name = validateField('name', formData.name);
    newErrors.email = validateField('email', formData.email);
    newErrors.phone = validateField('phone', formData.phone);
    newErrors.notes = validateField('notes', formData.notes);

    if (!formData.visaType) {
      newErrors.visaType = 'Visa type is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    const hasErrors = Object.values(newErrors).some(error => error !== undefined);

    return {
      isValid: !hasErrors,
      errors: newErrors,
    };
  }, [formData, validateField]);

  // Handle field changes with real-time validation
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Real-time validation
    const fieldError = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  }, [validateField]);

  // Handle visa type selection
  const handleVisaTypeSelect = useCallback((visaType: VisaType) => {
    setFormData(prev => ({ ...prev, visaType }));
    setHasUnsavedChanges(true);
    setVisaTypeMenuVisible(false);
    setErrors(prev => ({ ...prev, visaType: undefined }));
  }, []);

  // Handle status selection
  const handleStatusSelect = useCallback((status: ClientStatus) => {
    setFormData(prev => ({ ...prev, status }));
    setHasUnsavedChanges(true);
    setStatusMenuVisible(false);
    setErrors(prev => ({ ...prev, status: undefined }));
  }, []);

  // Show snackbar message
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const validation = validateForm();
    setErrors(validation.errors);

    if (!validation.isValid) {
      showSnackbar('Please fix the errors before submitting');
      return;
    }

    try {
      setSaving(true);

      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        visaType: formData.visaType,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      };

      let response;
      if (isEditMode) {
        response = await ApiService.updateClient(clientId!, clientData as UpdateClientRequest);
      } else {
        response = await ApiService.createClient(clientData as CreateClientRequest);
      }

      if (response.success) {
        setHasUnsavedChanges(false);
        showSnackbar(isEditMode ? 'Client updated successfully' : 'Client created successfully');
        
        // Navigate back after a short delay to show the success message
        setTimeout(() => {
          navigation?.goBack();
        }, 1500);
      } else {
        showSnackbar(response.error || 'Failed to save client');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      showSnackbar('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, isEditMode, clientId, navigation, showSnackbar]);

  // Handle back navigation with unsaved changes check
  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigation?.goBack();
    }
  }, [hasUnsavedChanges, navigation]);

  // Memoized visa type options
  const visaTypeOptions = useMemo(() => 
    Object.values(VisaType).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      icon: visaTypeIcons[type],
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
  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading client data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackPress} />
        <Appbar.Content title={isEditMode ? 'Edit Client' : 'New Client'} />
        <Appbar.Action
          icon="check"
          onPress={handleSubmit}
          disabled={saving}
        />
      </Appbar.Header>

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
                onChangeText={(value) => handleFieldChange('name', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
                disabled={saving}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              {/* Email Field */}
              <TextInput
                label="Email Address *"
                value={formData.email}
                onChangeText={(value) => handleFieldChange('email', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.email}
                disabled={saving}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>

              {/* Phone Field */}
              <TextInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => handleFieldChange('phone', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.phone}
                disabled={saving}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}
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
                  visible={visaTypeMenuVisible}
                  onDismiss={() => setVisaTypeMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setVisaTypeMenuVisible(true)}
                      style={[styles.selectorButton, errors.visaType && styles.errorBorder]}
                      contentStyle={styles.selectorButtonContent}
                      disabled={saving}
                      icon={visaTypeIcons[formData.visaType]}
                    >
                      {visaTypeOptions.find(opt => opt.value === formData.visaType)?.label || 'Select Visa Type'}
                    </Button>
                  }
                >
                  {visaTypeOptions.map((option) => (
                    <Menu.Item
                      key={option.value}
                      onPress={() => handleVisaTypeSelect(option.value)}
                      title={option.label}
                      leadingIcon={option.icon}
                    />
                  ))}
                </Menu>
                <HelperText type="error" visible={!!errors.visaType}>
                  {errors.visaType}
                </HelperText>
              </View>

              {/* Status Selector */}
              <View style={styles.selectorContainer}>
                <Text variant="bodyMedium" style={styles.selectorLabel}>
                  Status *
                </Text>
                <Menu
                  visible={statusMenuVisible}
                  onDismiss={() => setStatusMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setStatusMenuVisible(true)}
                      style={[styles.selectorButton, errors.status && styles.errorBorder]}
                      contentStyle={styles.selectorButtonContent}
                      disabled={saving}
                    >
                      {statusOptions.find(opt => opt.value === formData.status)?.label || 'Select Status'}
                    </Button>
                  }
                >
                  {statusOptions.map((option) => (
                    <Menu.Item
                      key={option.value}
                      onPress={() => handleStatusSelect(option.value)}
                      title={option.label}
                    />
                  ))}
                </Menu>
                <HelperText type="error" visible={!!errors.status}>
                  {errors.status}
                </HelperText>
              </View>

              <Divider style={styles.divider} />

              {/* Notes Field */}
              <TextInput
                label="Additional Notes"
                value={formData.notes}
                onChangeText={(value) => handleFieldChange('notes', value)}
                mode="outlined"
                style={styles.notesInput}
                error={!!errors.notes}
                disabled={saving}
                multiline
                numberOfLines={4}
                placeholder="Enter any additional information about the client..."
              />
              <HelperText type="error" visible={!!errors.notes}>
                {errors.notes}
              </HelperText>
              <HelperText type="info" visible={!errors.notes}>
                {formData.notes.length}/2000 characters
              </HelperText>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {saving ? 'Saving...' : (isEditMode ? 'Update Client' : 'Create Client')}
            </Button>

            <Button
              mode="outlined"
              onPress={handleBackPress}
              disabled={saving}
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
        <Dialog visible={showUnsavedDialog} onDismiss={() => setShowUnsavedDialog(false)}>
          <Dialog.Title>Unsaved Changes</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You have unsaved changes. Are you sure you want to leave without saving?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowUnsavedDialog(false)}>Stay</Button>
            <Button
              onPress={() => {
                setShowUnsavedDialog(false);
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
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
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
});

export default ClientFormScreen;