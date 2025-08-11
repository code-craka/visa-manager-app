import React from 'react';
import { Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  disabled,
  error,
  errorText,
  required,
  accessibilityLabel,
  accessibilityHint,
  style
}) => {
  const webStyles = Platform.OS === 'web' ? {
    minHeight: theme.accessibility.minTouchTarget,
    transition: theme.web.transitions.normal,
    ':focus': {
      outline: theme.web.focus.outline,
      outlineOffset: theme.web.focus.outlineOffset,
    },
  } : {};

  return (
    <TextInput
      label={`${label}${required ? ' *' : ''}`}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      disabled={disabled}
      error={error}
      mode="outlined"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityRequired={required}
      helperText={errorText}
      style={[
        {
          minHeight: theme.accessibility.minTouchTarget,
        },
        webStyles,
        style
      ]}
    />
  );
};

export default AccessibleInput;