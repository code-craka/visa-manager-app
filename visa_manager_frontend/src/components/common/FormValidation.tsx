import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, HelperText } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface ValidationMessageProps {
  error?: string;
  visible?: boolean;
  type?: 'error' | 'info';
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  error,
  visible = true,
  type = 'error'
}) => {
  if (!error || !visible) return null;

  return (
    <HelperText 
      type={type}
      visible={visible}
      style={[
        styles.helperText,
        type === 'error' && styles.errorText
      ]}
    >
      {error}
    </HelperText>
  );
};

interface FormFieldProps {
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  label?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  children,
  error,
  required,
  label
}) => (
  <View style={styles.fieldContainer}>
    {label && (
      <Text style={[styles.label, required && styles.requiredLabel]}>
        {label}{required && ' *'}
      </Text>
    )}
    {children}
    <ValidationMessage error={error} visible={!!error} />
  </View>
);

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: theme.spacing.medium,
  },
  label: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.small,
  },
  requiredLabel: {
    color: theme.colors.error,
  },
  helperText: {
    fontSize: theme.fontSizes.small,
    marginTop: theme.spacing.small / 2,
  },
  errorText: {
    color: theme.colors.error,
  },
});