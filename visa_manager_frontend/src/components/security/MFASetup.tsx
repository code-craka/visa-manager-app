import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, Switch } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';

const MFASetup: React.FC = () => {
  const { enableMFA, disableMFA, isMFAEnabled } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleMFAToggle = async () => {
    setLoading(true);
    try {
      if (isMFAEnabled) {
        await disableMFA();
      } else {
        await enableMFA();
      }
    } catch (error) {
      console.error('MFA toggle failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>Multi-Factor Authentication</Text>
        <Text style={styles.description}>
          Add an extra layer of security to your account by enabling multi-factor authentication.
        </Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable MFA</Text>
          <Switch
            value={isMFAEnabled}
            onValueChange={handleMFAToggle}
            disabled={loading}
            color={theme.colors.primary}
          />
        </View>

        <Text style={styles.status}>
          Status: {isMFAEnabled ? 'Enabled' : 'Disabled'}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: theme.spacing.medium,
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...theme.typography.titleMedium,
    marginBottom: theme.spacing.small,
    color: theme.colors.onSurface,
  },
  description: {
    ...theme.typography.bodyMedium,
    marginBottom: theme.spacing.medium,
    color: theme.colors.onSurfaceVariant,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
  },
  switchLabel: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  },
  status: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});

export default MFASetup;