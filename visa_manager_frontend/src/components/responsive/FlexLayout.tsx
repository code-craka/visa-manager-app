import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface FlexLayoutProps {
  children: ReactNode;
  direction?: {
    mobile?: 'row' | 'column';
    tablet?: 'row' | 'column';
    desktop?: 'row' | 'column';
  };
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  wrap?: boolean;
  spacing?: number;
  style?: any;
}

const FlexLayout: React.FC<FlexLayoutProps> = ({
  children,
  direction = { mobile: 'column', tablet: 'row', desktop: 'row' },
  justify = 'flex-start',
  align = 'stretch',
  wrap = false,
  spacing = 16,
  style
}) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const getDirection = () => {
    if (isMobile) return direction.mobile || 'column';
    if (isTablet) return direction.tablet || 'row';
    if (isDesktop) return direction.desktop || 'row';
    return 'column';
  };

  const flexDirection = getDirection();
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[
      styles.container,
      {
        flexDirection,
        justifyContent: justify,
        alignItems: align,
        flexWrap: wrap ? 'wrap' : 'nowrap',
      },
      style
    ]}>
      {childrenArray.map((child, index) => (
        <View 
          key={index}
          style={[
            styles.item,
            {
              marginRight: flexDirection === 'row' && index < childrenArray.length - 1 ? spacing : 0,
              marginBottom: flexDirection === 'column' && index < childrenArray.length - 1 ? spacing : 0,
            }
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    // Base item styles
  },
});

export default FlexLayout;