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
    style={style}
  >
    {title}
  </PaperButton>
);

export default Button;