// Demo component to test ClientSelectionModal integration
// This file can be used for manual testing and development

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import ClientSelectionModal from './ClientSelectionModal';
import { Client } from '../types/Client';
import { theme } from '../styles/theme';

const ClientSelectionModalDemo: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    console.log('Selected client:', client);
  };

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Client Selection Modal Demo
      </Text>

      <Button
        mode="contained"
        onPress={handleOpenModal}
        style={styles.openButton}
      >
        Open Client Selection Modal
      </Button>

      {selectedClient && (
        <Card style={styles.selectedCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.selectedTitle}>
              Selected Client:
            </Text>
            <Text variant="bodyLarge">{selectedClient.name}</Text>
            <Text variant="bodyMedium">{selectedClient.email}</Text>
            <Text variant="bodySmall">
              {selectedClient.visaType} • {selectedClient.status}
            </Text>
          </Card.Content>
        </Card>
      )}

      <ClientSelectionModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSelect={handleClientSelect}
        title="Demo Client Selection"
        subtitle="Choose a client for demonstration"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.large,
    backgroundColor: theme.colors.background,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.large,
    color: theme.colors.primary,
  },
  openButton: {
    marginBottom: theme.spacing.large,
  },
  selectedCard: {
    marginTop: theme.spacing.large,
    backgroundColor: theme.colors.primaryContainer,
  },
  selectedTitle: {
    marginBottom: theme.spacing.small,
    color: theme.colors.primary,
  },
});

export default ClientSelectionModalDemo;