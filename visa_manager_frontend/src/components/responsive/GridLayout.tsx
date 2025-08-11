import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface GridLayoutProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  spacing?: number;
  style?: any;
}

const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  spacing = 16,
  style
}) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const getColumns = () => {
    if (isMobile) return columns.mobile || 1;
    if (isTablet) return columns.tablet || 2;
    if (isDesktop) return columns.desktop || 3;
    return 1;
  };

  const columnCount = getColumns();
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: Math.ceil(childrenArray.length / columnCount) }).map((_, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { marginBottom: spacing }]}>
          {Array.from({ length: columnCount }).map((_, colIndex) => {
            const childIndex = rowIndex * columnCount + colIndex;
            const child = childrenArray[childIndex];
            
            if (!child) return <View key={colIndex} style={styles.emptyCell} />;
            
            return (
              <View 
                key={colIndex} 
                style={[
                  styles.cell, 
                  { 
                    flex: 1 / columnCount,
                    marginRight: colIndex < columnCount - 1 ? spacing : 0 
                  }
                ]}
              >
                {child}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
  },
  emptyCell: {
    flex: 1,
  },
});

export default GridLayout;