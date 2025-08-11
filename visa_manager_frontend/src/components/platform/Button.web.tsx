import React from 'react';
import { Button as PaperButton } from 'react-native-paper';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: any;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
  disabled,
  loading,
  icon,
  style
}) => (
  <PaperButton
    mode={mode}
    onPress={onPress}
    disabled={disabled}
    loading={loading}
    icon={icon}
    style={[
      {
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
      },
      style
    ]}
    onMouseEnter={(e: any) => {
      if (!disabled) {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      }
    }}
    onMouseLeave={(e: any) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = 'none';
    }}
  >
    {title}
  </PaperButton>
);

export default Button;