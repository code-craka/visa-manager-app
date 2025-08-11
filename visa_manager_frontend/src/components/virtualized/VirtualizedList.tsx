import React, { useMemo } from 'react';
import { FlatList, Platform } from 'react-native';

interface VirtualizedListProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactElement;
  itemHeight: number;
  height: number;
  keyExtractor?: (item: any, index: number) => string;
}

const VirtualizedList: React.FC<VirtualizedListProps> = ({
  data,
  renderItem,
  itemHeight,
  height,
  keyExtractor
}) => {
  const memoizedData = useMemo(() => data, [data]);

  if (Platform.OS === 'web') {
    return (
      <div style={{ height, overflow: 'auto' }}>
        {memoizedData.map((item, index) => (
          <div key={keyExtractor ? keyExtractor(item, index) : index}>
            {renderItem({ item, index })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <FlatList
      data={memoizedData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};

export default VirtualizedList;