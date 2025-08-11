import React, { useState } from 'react';
import { Platform } from 'react-native';
import { TextInput } from 'react-native-paper';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  error?: boolean;
  errorText?: string;
  style?: any;
}

const Input: React.FC<InputProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebInput {...props} />;
  }
  return <NativeInput {...props} />;
};

const WebInput: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  numberOfLines,
  disabled,
  error,
  errorText,
  style
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={numberOfLines}
      disabled={disabled}
      error={error}
      mode="outlined"
      style={[
        {
          transition: 'all 0.2s ease',
          transform: focused ? 'scale(1.02)' : 'scale(1)',
        },
        style
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      helperText={errorText}
    />
  );
};

const NativeInput: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  numberOfLines,
  disabled,
  error,
  errorText,
  style
}) => (
  <TextInput
    label={label}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    secureTextEntry={secureTextEntry}
    multiline={multiline}
    numberOfLines={numberOfLines}
    disabled={disabled}
    error={error}
    mode="outlined"
    style={style}
    helperText={errorText}
  />
);

export default Input;