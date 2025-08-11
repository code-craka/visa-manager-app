import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { webSocketService } from '../../services/WebSocketService';
import { theme } from '../../styles/theme';

const ConnectionStatus: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const wsConnected = webSocketService.isConnected();

  const getStatusColor = () => {
    if (!isOnline) return theme.colors.error;
    if (!wsConnected) return theme.colors.warning;
    return theme.colors.success;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!wsConnected) return 'Connecting...';
    return 'Online';
  };

  return (
    <View style={styles.container}>
      <Chip
        icon={isOnline && wsConnected ? 'wifi' : 'wifi-off'}
        style={[styles.chip, { backgroundColor: getStatusColor() }]}
        textStyle={styles.chipText}
      >
        {getStatusText()}
      </Chip>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.small,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: 'white',
    fontSize: theme.fontSizes.small,
  },
});

export default ConnectionStatus;