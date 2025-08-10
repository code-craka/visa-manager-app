// Partner Client List Screen - Restricted view for partners
// Requirements: 6.1, 6.2, 6.3 - Partner-specific client information display with data masking

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Text
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  Searchbar,
  FAB,
  Surface,
  IconButton,
  Badge
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RestrictedClient, ClientStatus, VisaType } from '../types/Client';
import ApiService from '../services/ApiService';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

interface PartnerClientListScreenProps {
  navigation: any;
}

const PartnerClientListScreen: React.FC<PartnerClientListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<RestrictedClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<RestrictedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ClientStatus | 'all'>('all');

  // Load clients on screen focus
  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  // Filter clients when search query or status filter changes
  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, selectedStatus]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getPartnerAccessibleClients();

      if (response.success) {
        setClients(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to load clients');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const filterClients = () => {
    let filtered = clients;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(client => client.status === selectedStatus);
    }

    setFilteredClients(filtered);
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

  const handleClientPress = (client: RestrictedClient) => {
    navigation.navigate('PartnerClientDetail', { 
      clientId: client.id,
      clientName: client.name 
    });
  };

  const renderStatusFilter = () => {
    const statuses: (ClientStatus | 'all')[] = [
      'all',
      ClientStatus.PENDING,
      ClientStatus.IN_PROGRESS,
      ClientStatus.DOCUMENTS_REQUIRED,
      ClientStatus.UNDER_REVIEW,
      ClientStatus.APPROVED,
      ClientStatus.REJECTED,
      ClientStatus.COMPLETED
    ];

    return (
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              mode={selectedStatus === item ? 'flat' : 'outlined'}
              selected={selectedStatus === item}
              onPress={() => setSelectedStatus(item)}
              style={[
                styles.filterChip,
                selectedStatus === item && { backgroundColor: theme.colors.primary }
              ]}
              textStyle={selectedStatus === item ? { color: 'white' } : undefined}
            >
              {item === 'all' ? 'All' : formatStatusText(item)}
            </Chip>
          )}
        />
      </View>
    );
  };

  const renderClientItem = ({ item }: { item: RestrictedClient }) => (
    <Card style={styles.clientCard} onPress={() => handleClientPress(item)}>
      <Card.Content>
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Title style={styles.clientName}>{item.name}</Title>
            <Paragraph style={styles.clientEmail}>{item.email}</Paragraph>
            {item.phone && (
              <Paragraph style={styles.clientPhone}>{item.phone}</Paragraph>
            )}
          </View>
          <View style={styles.clientMeta}>
            <MaterialCommunityIcons
              name={getVisaTypeIcon(item.visaType)}
              size={24}
              color={theme.colors.primary}
              style={styles.visaIcon}
            />
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) + '20' }
              ]}
              textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
            >
              {formatStatusText(item.status)}
            </Chip>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Paragraph style={styles.notes} numberOfLines={2}>
              {item.notes}
            </Paragraph>
          </View>
        )}

        <View style={styles.clientFooter}>
          <Paragraph style={styles.dateText}>
            Updated: {new Date(item.updatedAt).toLocaleDateString()}
          </Paragraph>
          <Badge style={styles.restrictedBadge} size={16}>
            Restricted View
          </Badge>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="account-search"
        size={64}
        color={theme.colors.disabled}
      />
      <Title style={styles.emptyTitle}>No Accessible Clients</Title>
      <Paragraph style={styles.emptyText}>
        You don't have access to any clients yet. Clients will appear here when tasks are assigned to you.
      </Paragraph>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Paragraph style={styles.loadingText}>Loading accessible clients...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.searchContainer}>
        <Searchbar
          placeholder="Search clients..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </Surface>

      {renderStatusFilter()}

      <View style={styles.headerContainer}>
        <Title style={styles.headerTitle}>
          Accessible Clients ({filteredClients.length})
        </Title>
        <Paragraph style={styles.headerSubtitle}>
          Restricted view - Only task-related information shown
        </Paragraph>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClientItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  searchContainer: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    borderRadius: 8,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: 'transparent',
  },
  searchInput: {
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurface + '80',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  clientCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfo: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  clientEmail: {
    fontSize: 14,
    color: theme.colors.onSurface + '80',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: theme.colors.onSurface + '60',
  },
  clientMeta: {
    alignItems: 'center',
  },
  visaIcon: {
    marginBottom: 8,
  },
  statusChip: {
    height: 24,
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline + '20',
  },
  notes: {
    fontSize: 14,
    color: theme.colors.onSurface + '70',
    fontStyle: 'italic',
  },
  clientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.onSurface + '60',
  },
  restrictedBadge: {
    backgroundColor: theme.colors.error + '20',
    color: theme.colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurface + '70',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default PartnerClientListScreen;