// ClientSelectionModal - Modal component for selecting clients during task assignment
// Following Material Design patterns with search, filtering, and visual indicators

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Portal,
  Modal,
  Surface,
  Searchbar,
  Text,
  Button,
  Card,
  Chip,
  ActivityIndicator,
  IconButton,
  Divider,
  Avatar,
  List,
} from 'react-native-paper';
import {
  Client,
  ClientStatus,
  VisaType,
  ClientFilters
} from '../types/Client';
import ApiService from '../services/ApiService';
import { theme, statusColors, visaTypeIcons } from '../styles/theme';

interface ClientSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  excludeIds?: number[];
  title?: string;
  subtitle?: string;
}

interface ClientSelectionState {
  clients: Client[];
  filteredClients: Client[];
  searchQuery: string;
  selectedStatus: ClientStatus | 'all';
  loading: boolean;
  error: string | null;
  selectedClientId: number | null;
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  excludeIds = [],
  title = 'Select Client',
  subtitle = 'Choose a client for task assignment'
}) => {
  const [state, setState] = useState<ClientSelectionState>({
    clients: [],
    filteredClients: [],
    searchQuery: '',
    selectedStatus: 'all',
    loading: false,
    error: null,
    selectedClientId: null,
  });

  // Load clients when modal becomes visible
  const loadClients = useCallback(async () => {
    if (!visible) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const filters: ClientFilters = {
        limit: 100, // Load more clients for selection
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const response = await ApiService.getClients(filters);

      if (response.success) {
        // Filter out excluded clients
        const availableClients = response.data.filter(
          client => !excludeIds.includes(client.id)
        );

        setState(prev => ({
          ...prev,
          clients: availableClients,
          filteredClients: availableClients,
          loading: false,
          error: null
        }));
      } else {
        throw new Error((response as any).error);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load clients',
        loading: false
      }));
    }
  }, [visible, excludeIds]);

  // Filter clients based on search query and status
  const filterClients = useCallback(() => {
    let filtered = [...state.clients];

    // Apply search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.visaType.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (state.selectedStatus !== 'all') {
      filtered = filtered.filter(client => client.status === state.selectedStatus);
    }

    setState(prev => ({ ...prev, filteredClients: filtered }));
  }, [state.clients, state.searchQuery, state.selectedStatus]);

  // Debounced search handler
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setState(prev => ({ ...prev, searchQuery: query }));
      }, 300);
    };
  }, []);

  // Status filter handler
  const handleStatusFilter = useCallback((status: ClientStatus | 'all') => {
    setState(prev => ({ ...prev, selectedStatus: status }));
  }, []);

  // Client selection handler
  const handleClientSelect = useCallback((client: Client) => {
    setState(prev => ({ ...prev, selectedClientId: client.id }));
  }, []);

  // Confirm selection handler
  const handleConfirmSelection = useCallback(() => {
    const selectedClient = state.clients.find(c => c.id === state.selectedClientId);
    if (selectedClient) {
      onSelect(selectedClient);
      onClose();
      // Reset state
      setState(prev => ({
        ...prev,
        selectedClientId: null,
        searchQuery: '',
        selectedStatus: 'all'
      }));
    }
  }, [state.clients, state.selectedClientId, onSelect, onClose]);

  // Close handler with state reset
  const handleClose = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedClientId: null,
      searchQuery: '',
      selectedStatus: 'all'
    }));
    onClose();
  }, [onClose]);

  // Helper function to get status color
  const getStatusColor = useCallback((status: ClientStatus): string => {
    return statusColors[status] || theme.colors.surface;
  }, []);

  // Helper function to get visa type icon
  const getVisaTypeIcon = useCallback((visaType: VisaType): string => {
    return visaTypeIcons[visaType] || 'file-document';
  }, []);

  // Status filter options
  const statusFilters = useMemo(() => [
    { key: 'all', label: 'All' },
    { key: ClientStatus.PENDING, label: 'Pending' },
    { key: ClientStatus.IN_PROGRESS, label: 'In Progress' },
    { key: ClientStatus.UNDER_REVIEW, label: 'Under Review' },
    { key: ClientStatus.APPROVED, label: 'Approved' },
    { key: ClientStatus.COMPLETED, label: 'Completed' },
  ], []);

  // Memoized client item component for performance
  const ClientSelectionItem = React.memo<{ item: Client; isSelected: boolean }>(
    ({ item, isSelected }) => (
      <Card
        style={[
          styles.clientCard,
          isSelected && styles.selectedClientCard
        ]}
        onPress={() => handleClientSelect(item)}
      >
        <Card.Content>
          <View style={styles.clientHeader}>
            <View style={styles.clientInfo}>
              <Avatar.Icon
                size={40}
                icon={getVisaTypeIcon(item.visaType)}
                style={[
                  styles.clientAvatar,
                  { backgroundColor: theme.colors.primaryContainer }
                ]}
              />
              <View style={styles.clientDetails}>
                <Text variant="titleMedium" style={styles.clientName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={styles.clientEmail} numberOfLines={1}>
                  {item.email}
                </Text>
                {item.phone && (
                  <Text variant="bodySmall" style={styles.clientPhone} numberOfLines={1}>
                    {item.phone}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.clientMeta}>
              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(item.status) }
                ]}
                textStyle={styles.chipText}
                compact
              >
                {item.status.replace('_', ' ').toUpperCase()}
              </Chip>
              
              <Chip
                icon={getVisaTypeIcon(item.visaType)}
                style={styles.visaChip}
                textStyle={styles.chipText}
                compact
              >
                {item.visaType.toUpperCase()}
              </Chip>
            </View>
          </View>

          {item.notes && (
            <Text variant="bodySmall" style={styles.clientNotes} numberOfLines={2}>
              Notes: {item.notes}
            </Text>
          )}

          <Text variant="bodySmall" style={styles.clientDate}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <IconButton
                icon="check-circle"
                iconColor={theme.colors.primary}
                size={24}
              />
            </View>
          )}
        </Card.Content>
      </Card>
    ),
    (prevProps, nextProps) => {
      return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.name === nextProps.item.name &&
        prevProps.item.email === nextProps.item.email &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.item.visaType === nextProps.item.visaType &&
        prevProps.isSelected === nextProps.isSelected
      );
    }
  );

  // Client item renderer
  const renderClientItem = useCallback(({ item }: { item: Client }) => {
    const isSelected = state.selectedClientId === item.id;
    return <ClientSelectionItem item={item} isSelected={isSelected} />;
  }, [state.selectedClientId]);

  // Load clients when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadClients();
    }
  }, [visible, loadClients]);

  // Apply filters when search or status changes
  useEffect(() => {
    filterClients();
  }, [filterClients]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.modalSurface}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="headlineSmall" style={styles.title}>
                {title}
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {subtitle}
              </Text>
            </View>
            <IconButton
              icon="close"
              onPress={handleClose}
              style={styles.closeButton}
            />
          </View>

          <Divider style={styles.headerDivider} />

          {/* Search bar */}
          <Searchbar
            placeholder="Search clients by name, email, or visa type..."
            value={state.searchQuery}
            onChangeText={debouncedSearch}
            style={styles.searchBar}
            iconColor={theme.colors.primary}
          />

          {/* Status filter chips */}
          <View style={styles.filterContainer}>
            <Text variant="labelMedium" style={styles.filterLabel}>
              Filter by status:
            </Text>
            <View style={styles.chipContainer}>
              {statusFilters.map(filter => (
                <Chip
                  key={filter.key}
                  selected={state.selectedStatus === filter.key}
                  onPress={() => handleStatusFilter(filter.key as ClientStatus | 'all')}
                  style={[
                    styles.filterChip,
                    state.selectedStatus === filter.key && styles.selectedFilterChip
                  ]}
                  textStyle={styles.chipText}
                  compact
                >
                  {filter.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Loading state */}
          {state.loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading clients...
              </Text>
            </View>
          )}

          {/* Error state */}
          {state.error && (
            <Card style={styles.errorCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.errorTitle}>
                  Error
                </Text>
                <Text variant="bodyMedium" style={styles.errorMessage}>
                  {state.error}
                </Text>
                <Button
                  mode="contained"
                  onPress={loadClients}
                  style={styles.retryButton}
                >
                  Retry
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Client list */}
          {!state.loading && !state.error && (
            <FlatList
              data={state.filteredClients}
              renderItem={renderClientItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.clientList}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text variant="titleMedium" style={styles.emptyTitle}>
                    No clients found
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyMessage}>
                    {state.searchQuery || state.selectedStatus !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No clients available for selection'
                    }
                  </Text>
                </View>
              }
            />
          )}

          {/* Action buttons */}
          <View style={styles.actionContainer}>
            <Button
              mode="outlined"
              onPress={handleClose}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmSelection}
              disabled={!state.selectedClientId}
              style={styles.selectButton}
            >
              Select Client
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: theme.spacing.medium,
    justifyContent: 'center',
  },
  modalSurface: {
    borderRadius: theme.borderRadius.large,
    maxHeight: '90%',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.large,
    paddingBottom: theme.spacing.medium,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  closeButton: {
    margin: 0,
  },
  headerDivider: {
    marginHorizontal: theme.spacing.large,
  },
  searchBar: {
    margin: theme.spacing.large,
    marginBottom: theme.spacing.medium,
    elevation: theme.elevation.level1,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.large,
    marginBottom: theme.spacing.medium,
  },
  filterLabel: {
    marginBottom: theme.spacing.small,
    color: theme.colors.onSurface,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.small,
  },
  filterChip: {
    marginBottom: theme.spacing.small,
  },
  selectedFilterChip: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 10,
  },
  loadingContainer: {
    padding: theme.spacing.xlarge,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.medium,
    color: theme.colors.onSurface,
  },
  errorCard: {
    margin: theme.spacing.large,
    backgroundColor: theme.colors.errorContainer,
  },
  errorTitle: {
    color: theme.colors.error,
    marginBottom: theme.spacing.small,
  },
  errorMessage: {
    color: theme.colors.error,
    marginBottom: theme.spacing.medium,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  clientList: {
    flex: 1,
    paddingHorizontal: theme.spacing.large,
  },
  listContent: {
    paddingBottom: theme.spacing.medium,
  },
  clientCard: {
    marginBottom: theme.spacing.medium,
    elevation: theme.elevation.level1,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedClientCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primaryContainer,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.small,
  },
  clientInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  clientAvatar: {
    marginRight: theme.spacing.medium,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  clientEmail: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  clientPhone: {
    color: theme.colors.onSurfaceVariant,
  },
  clientMeta: {
    alignItems: 'flex-end',
    gap: theme.spacing.small,
  },
  statusChip: {
    height: 24,
  },
  visaChip: {
    backgroundColor: theme.colors.secondaryContainer,
    height: 24,
  },
  clientNotes: {
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.small,
    fontStyle: 'italic',
  },
  clientDate: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: theme.spacing.small,
  },
  selectedIndicator: {
    position: 'absolute',
    top: theme.spacing.small,
    right: theme.spacing.small,
  },
  emptyContainer: {
    padding: theme.spacing.xlarge,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.small,
    textAlign: 'center',
  },
  emptyMessage: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.large,
    paddingTop: theme.spacing.medium,
    gap: theme.spacing.medium,
  },
  cancelButton: {
    flex: 1,
  },
  selectButton: {
    flex: 1,
  },
});

export default ClientSelectionModal;