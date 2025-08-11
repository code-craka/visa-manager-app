import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface ResponsiveProps {
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop?: ReactNode;
  children?: ReactNode;
  style?: any;
}

const ResponsiveContainer: React.FC<ResponsiveProps> = ({
  mobile,
  tablet,
  desktop,
  children,
  style
}) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const renderContent = () => {
    if (isMobile && mobile) return mobile;
    if (isTablet && tablet) return tablet;
    if (isDesktop && desktop) return desktop;
    return children;
  };

  return (
    <View style={[styles.container, style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ResponsiveContainer;