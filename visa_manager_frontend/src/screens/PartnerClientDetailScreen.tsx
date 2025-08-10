// Partner Client Detail Screen - Restricted view for partners
// Requirements: 6.1, 6.2, 6.3 - Partner-specific client information display with data masking

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  Surface,
  Divider,
  Badge,
  IconButton
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RestrictedClient, ClientStatus, VisaType } from '../types/Client';
import ApiService from '../services/ApiService';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

interface PartnerClientDetailScreenProps {
  navigation: any;
  route: {
    params: {
      clientId: number;
      clientName: string;
      taskId?: number;
    };
  };
}

// Navigation component wrapper for React Navigation compatibility
interface NavigationProps {
  navigation: any;
  route: any;
}

const PartnerClientDetailScreenComponent: React.FC<PartnerClientDetailScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { user } = useAuth();
  const { clientId, clientName, taskId } = route.params;
  const [client, setClient] = useState<RestrictedClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: clientName || 'Client Details',
      headerRight: () => (
        <IconButton
          icon="refresh"
          onPress={handleRefresh}
          iconColor={theme.colors.onPrimary}
        />
      ),
    });
    loadClientDetails();
  }, [clientId, taskId]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getPartnerClientById(clientId, taskId);

      if (response.success) {
        setClient(response.data);
      } else {
        Alert.alert('Access Denied', response.error || 'You do not have access to this client');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading client details:', error);
      Alert.alert('Error', 'Failed to load client details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClientDetails();
    setRefreshing(false);
  };

  const getStatusColor = (status: ClientStatus): string => {
    const statusColors = {
      [ClientStatus.PENDING]: '#FF9800',
      [ClientStatus.IN_PROGRESS]: '#2196F3',
      [ClientStatus.DOCUMENTS_REQUIRED]: '#FF5722',
      [ClientStatus.UNDER_REVIEW]: '#9C27B0',
      [ClientStatus.APPROVED]: '#4CAF50',
      [ClientStatus.REJECTED]: '#F44336',
      [ClientStatus.COMPLETED]: '#8BC34A'
    };
    return statusColors[status] || '#757575';
  };

  const getVisaTypeIcon = (visaType: VisaType): string => {
    const visaIcons = {
      [VisaType.TOURIST]: 'camera',
      [VisaType.BUSINESS]: 'briefcase',
      [VisaType.STUDENT]: 'school',
      [VisaType.WORK]: 'hammer-wrench',
      [VisaType.FAMILY]: 'account-group',
      [VisaType.TRANSIT]: 'airplane-takeoff'
    };
    return visaIcons[visaType] || 'passport';
  };

  const formatStatusText = (status: ClientStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatVisaTypeText = (visaType: VisaType): string => {
    return visaType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderRestrictedNotice = () => (
    <Surface style={styles.restrictedNotice}>
      <View style={styles.restrictedHeader}>
        <MaterialCommunityIcons
          name="shield-lock"
          size={20}
          color={theme.colors.error}
        />
        <Title style={styles.restrictedTitle}>Restricted View</Title>
      </View>
      <Paragraph style={styles.restrictedText}>
        You are viewing limited client information. Some details have been masked or filtered for privacy and security.
      </Paragraph>
    </Surface>
  );

  const renderClientInfo = () => {
    if (!client) return null;

    return (
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="account"
              size={24}
              color={theme.colors.primary}
            />
            <Title style={styles.cardTitle}>Client Information</Title>
          </View>

          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Name:</Paragraph>
            <Paragraph style={styles.infoValue}>{client.name}</Paragraph>
          </View>

          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Email:</Paragraph>
            <View style={styles.maskedContainer}>
              <Paragraph style={styles.infoValue}>{client.email}</Paragraph>
              <Badge style={styles.maskedBadge} size={16}>MASKED</Badge>
            </View>
          </View>

          {client.phone && (
            <View style={styles.infoRow}>
              <Paragraph style={styles.infoLabel}>Phone:</Paragraph>
              <View style={styles.maskedContainer}>
                <Paragraph style={styles.infoValue}>{client.phone}</Paragraph>
                <Badge style={styles.maskedBadge} size={16}>MASKED</Badge>
              </View>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Visa Type:</Paragraph>
            <View style={styles.visaTypeContainer}>
              <MaterialCommunityIcons
                name={getVisaTypeIcon(client.visaType)}
                size={20}
                color={theme.colors.primary}
              />
              <Paragraph style={styles.infoValue}>
                {formatVisaTypeText(client.visaType)}
              </Paragraph>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Status:</Paragraph>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(client.status) + '20' }
              ]}
              textStyle={{ color: getStatusColor(client.status) }}
            >
              {formatStatusText(client.status)}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderNotes = () => {
    if (!client?.notes) return null;

    return (
      <Card style={styles.notesCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="note-text"
              size={24}
              color={theme.colors.primary}
            />
            <Title style={styles.cardTitle}>Notes</Title>
            <Badge style={styles.filteredBadge} size={16}>FILTERED</Badge>
          </View>
          <Paragraph style={styles.notesText}>{client.notes}</Paragraph>
          <Paragraph style={styles.notesDisclaimer}>
            * Notes have been filtered to remove sensitive information
          </Paragraph>
        </Card.Content>
      </Card>
    );
  };

  const renderTimestamps = () => {
    if (!client) return null;

    return (
      <Card style={styles.timestampCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="clock"
              size={24}
              color={theme.colors.primary}
            />
            <Title style={styles.cardTitle}>Timeline</Title>
          </View>

          <View style={styles.timestampRow}>
            <Paragraph style={styles.timestampLabel}>Created:</Paragraph>
            <Paragraph style={styles.timestampValue}>
              {new Date(client.createdAt).toLocaleString()}
            </Paragraph>
          </View>

          <View style={styles.timestampRow}>
            <Paragraph style={styles.timestampLabel}>Last Updated:</Paragraph>
            <Paragraph style={styles.timestampValue}>
              {new Date(client.updatedAt).toLocaleString()}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Paragraph style={styles.loadingText}>Loading client details...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {renderRestrictedNotice()}
      {renderClientInfo()}
      {renderNotes()}
      {renderTimestamps()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurface,
  },
  restrictedNotice: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.errorContainer,
    elevation: 2,
  },
  restrictedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restrictedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: theme.colors.error,
  },
  restrictedText: {
    fontSize: 14,
    color: theme.colors.error,
    lineHeight: 20,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
    borderRadius: 8,
  },
  notesCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
    borderRadius: 8,
  },
  timestampCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    elevation: 2,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    color: theme.colors.onSurface,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface + '80',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    flex: 1,
  },
  maskedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  maskedBadge: {
    backgroundColor: theme.colors.error + '20',
    color: theme.colors.error,
    marginLeft: 8,
  },
  filteredBadge: {
    backgroundColor: theme.colors.warning + '20',
    color: theme.colors.warning,
  },
  visaTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 12,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
    marginBottom: 8,
  },
  notesDisclaimer: {
    fontSize: 12,
    color: theme.colors.onSurface + '60',
    fontStyle: 'italic',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestampLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface + '80',
    width: 100,
  },
  timestampValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    flex: 1,
  },
});

// Navigation wrapper component
const PartnerClientDetailScreen: React.FC<NavigationProps> = (props) => {
  return <PartnerClientDetailScreenComponent {...props} />;
};

export default PartnerClientDetailScreen;