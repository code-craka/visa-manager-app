import React from 'react';
import { Platform } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
  disabled,
  loading,
  icon,
  accessibilityLabel,
  accessibilityHint,
  style
}) => {
  const webStyles = Platform.OS === 'web' ? {
    minHeight: theme.accessibility.minTouchTarget,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: theme.web.transitions.normal,
    ':focus': {
      outline: theme.web.focus.outline,
      outlineOffset: theme.web.focus.outlineOffset,
    },
    ':hover': !disabled ? {
      transform: 'translateY(-1px)',
      boxShadow: theme.web.shadows.medium,
    } : {},
  } : {};

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      style={[
        {
          minHeight: theme.accessibility.minTouchTarget,
        },
        webStyles,
        style
      ]}
    >
      {title}
    </PaperButton>
  );
};

export default AccessibleButton;