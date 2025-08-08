// ClientListScreen - Comprehensive client management with search and filtering
// Following Material Design patterns with optimized React performance

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import {
  Searchbar,
  Chip,
  Card,
  Text,
  Button,
  FAB,
  ActivityIndicator,
  Portal,
  Dialog,
  IconButton,
  Divider,
  Snackbar
} from 'react-native-paper';
import {
  Client,
  ClientStatus,
  VisaType,
  ClientFilters
} from '../types/Client';
import ApiService from '../services/ApiService';
import { theme, statusColors, visaTypeIcons } from '../styles/theme';

interface ClientListScreenProps {
  navigation: any; // Will be properly typed when navigation is set up
}

interface ClientListState {
  clients: Client[];
  searchQuery: string;
  selectedStatus: ClientStatus | 'all';
  sortBy: 'name' | 'date' | 'visaType';
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  showDeleteDialog: boolean;
  clientToDelete: Client | null;
  snackbarVisible: boolean;
  snackbarMessage: string;
}

const ClientListScreen: React.FC<ClientListScreenProps> = ({ navigation }) => {
  const [state, setState] = useState<ClientListState>({
    clients: [],
    searchQuery: '',
    selectedStatus: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    loading: true,
    refreshing: false,
    error: null,
    page: 1,
    hasMore: true,
    showDeleteDialog: false,
    clientToDelete: null,
    snackbarVisible: false,
    snackbarMessage: '',
  });

  // Debounced search with 300ms delay
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setState(prev => ({
          ...prev,
          searchQuery: query,
          page: 1,
          clients: [] // Reset clients for new search
        }));
      }, 300);
    };
  }, []);

  // Memoized filter options for status chips
  const statusFilters = useMemo(() => [
    { key: 'all', label: 'All', count: 0 },
    { key: ClientStatus.PENDING, label: 'Pending', count: 0 },
    { key: ClientStatus.IN_PROGRESS, label: 'In Progress', count: 0 },
    { key: ClientStatus.UNDER_REVIEW, label: 'Under Review', count: 0 },
    { key: ClientStatus.COMPLETED, label: 'Completed', count: 0 },
    { key: ClientStatus.APPROVED, label: 'Approved', count: 0 },
    { key: ClientStatus.REJECTED, label: 'Rejected', count: 0 },
  ], []);

  // Load clients from API with filtering and pagination
  const loadClients = useCallback(async (
    isRefreshing = false,
    loadMore = false
  ) => {
    try {
      const currentPage = loadMore ? state.page + 1 : 1;

      setState(prev => ({
        ...prev,
        loading: !isRefreshing && !loadMore,
        refreshing: isRefreshing,
        error: null,
        page: currentPage
      }));

      const filters: ClientFilters = {
        search: state.searchQuery || undefined,
        status: state.selectedStatus !== 'all' ? state.selectedStatus : undefined,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        page: currentPage,
        limit: 20
      };

      const response = await ApiService.getClients(filters);

      if (response.success) {
        const newClients = response.data;
        const hasMoreData = response.pagination ?
          (response.pagination.page < response.pagination.totalPages) : false;

        setState(prev => ({
          ...prev,
          clients: loadMore ? [...prev.clients, ...newClients] : newClients,
          loading: false,
          refreshing: false,
          hasMore: hasMoreData,
          error: null
        }));
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load clients',
        loading: false,
        refreshing: false
      }));
    }
  }, [state.searchQuery, state.selectedStatus, state.sortBy, state.sortOrder, state.page]);

  // Memoized handlers for performance optimization
  const handleStatusFilter = useCallback((status: ClientStatus | 'all') => {
    setState(prev => ({
      ...prev,
      selectedStatus: status,
      page: 1,
      clients: [] // Reset for new filter
    }));
  }, []);

  const handleSort = useCallback((sortBy: 'name' | 'date' | 'visaType') => {
    setState(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
      clients: [] // Reset for new sort
    }));
  }, []);

  const handleClientPress = useCallback((client: Client) => {
    // Navigation will be implemented when navigation is set up
    console.log('Navigate to client details:', client.id);
    // navigation.navigate('ClientDetails', { clientId: client.id });
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    // Navigation will be implemented when navigation is set up
    console.log('Navigate to edit client:', client.id);
    // navigation.navigate('ClientForm', { clientId: client.id, mode: 'edit' });
  }, []);

  const handleCreateClient = useCallback(() => {
    // Navigation will be implemented when navigation is set up
    console.log('Navigate to create client');
    // navigation.navigate('ClientForm', { mode: 'create' });
  }, []);

  const handleRefresh = useCallback(() => {
    loadClients(true, false);
  }, [loadClients]);

  const handleLoadMore = useCallback(() => {
    if (state.hasMore && !state.loading) {
      loadClients(false, true);
    }
  }, [state.hasMore, state.loading, loadClients]);

  // Delete client functionality
  const handleDeleteClient = useCallback((client: Client) => {
    setState(prev => ({
      ...prev,
      showDeleteDialog: true,
      clientToDelete: client
    }));
  }, []);

  const confirmDeleteClient = useCallback(async () => {
    if (!state.clientToDelete) return;

    try {
      const response = await ApiService.deleteClient(state.clientToDelete.id);

      if (response.success) {
        setState(prev => ({
          ...prev,
          clients: prev.clients.filter(c => c.id !== state.clientToDelete!.id),
          showDeleteDialog: false,
          clientToDelete: null,
          snackbarVisible: true,
          snackbarMessage: 'Client deleted successfully'
        }));
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        showDeleteDialog: false,
        clientToDelete: null,
        snackbarVisible: true,
        snackbarMessage: error.message || 'Failed to delete client'
      }));
    }
  }, [state.clientToDelete]);

  // Helper function to get status color
  const getStatusColor = useCallback((status: ClientStatus): string => {
    return statusColors[status] || theme.colors.surface;
  }, []);

  // Helper function to get visa type icon
  const getVisaTypeIcon = useCallback((visaType: VisaType): string => {
    return visaTypeIcons[visaType] || 'file-document';
  }, []);

  // Client item renderer with optimized performance
  const renderClientItem = useCallback(({ item }: { item: Client }) => (
    <Card style={styles.clientCard} onPress={() => handleClientPress(item)}>
      <Card.Content>
        <View style={styles.clientHeader}>
          <Text variant="titleMedium" style={styles.clientName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.clientActions}>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.chipText}
              compact
            >
              {item.status.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>
        </View>

        <Text variant="bodyMedium" style={styles.clientEmail} numberOfLines={1}>
          {item.email}
        </Text>

        {item.phone && (
          <Text variant="bodySmall" style={styles.clientPhone} numberOfLines={1}>
            {item.phone}
          </Text>
        )}

        <Divider style={styles.divider} />

        <View style={styles.clientDetails}>
          <Chip
            icon={getVisaTypeIcon(item.visaType)}
            style={styles.visaChip}
            textStyle={styles.chipText}
            compact
          >
            {item.visaType.toUpperCase()}
          </Chip>

          <View style={styles.clientMeta}>
            <Text variant="bodySmall" style={styles.clientDate}>
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <IconButton
              icon="pencil"
              size={16}
              onPress={() => handleEditClient(item)}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={16}
              onPress={() => handleDeleteClient(item)}
              style={styles.actionButton}
              iconColor={theme.colors.error}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  ), [handleClientPress, handleEditClient, handleDeleteClient, getStatusColor, getVisaTypeIcon]);

  // Load initial data
  useEffect(() => {
    loadClients();
  }, [state.searchQuery, state.selectedStatus, state.sortBy, state.sortOrder]);

  // Loading state
  if (state.loading && state.clients.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>Loading clients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <Searchbar
        placeholder="Search clients by name, email, or visa type..."
        value={state.searchQuery}
        onChangeText={debouncedSearch}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
        elevation={2}
      />

      {/* Status filter chips */}
      <View style={styles.filterContainer}>
        <Text variant="labelMedium" style={styles.filterLabel}>Filter by status:</Text>
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

      {/* Sort options */}
      <View style={styles.sortContainer}>
        <Text variant="labelMedium" style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {[
            { key: 'date', label: 'Date' },
            { key: 'name', label: 'Name' },
            { key: 'visaType', label: 'Visa Type' }
          ].map(sortOption => (
            <Button
              key={sortOption.key}
              mode={state.sortBy === sortOption.key ? 'contained' : 'outlined'}
              onPress={() => handleSort(sortOption.key as 'name' | 'date' | 'visaType')}
              style={styles.sortButton}
              labelStyle={styles.sortButtonLabel}
              compact
            >
              {sortOption.label}
              {state.sortBy === sortOption.key && (state.sortOrder === 'asc' ? ' ↑' : ' ↓')}
            </Button>
          ))}
        </View>
      </View>

      {/* Error state */}
      {state.error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.errorTitle}>Error</Text>
            <Text variant="bodyMedium" style={styles.errorMessage}>{state.error}</Text>
            <Button
              mode="contained"
              onPress={() => loadClients()}
              style={styles.retryButton}
            >
              Retry
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Client list */}
      <FlatList
        data={state.clients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.clientList}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          state.loading && state.clients.length > 0 ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !state.loading ? (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyTitle}>No clients found</Text>
              <Text variant="bodyMedium" style={styles.emptyMessage}>
                {state.searchQuery || state.selectedStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first client'
                }
              </Text>
              {(!state.searchQuery && state.selectedStatus === 'all') && (
                <Button
                  mode="contained"
                  onPress={handleCreateClient}
                  style={styles.emptyCreateButton}
                >
                  Create First Client
                </Button>
              )}
            </View>
          ) : null
        }
      />

      {/* Create client FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateClient}
        label="Add Client"
        color={theme.colors.onPrimary}
      />

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog
          visible={state.showDeleteDialog}
          onDismiss={() => setState(prev => ({ ...prev, showDeleteDialog: false, clientToDelete: null }))}
        >
          <Dialog.Title>Delete Client</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete {state.clientToDelete?.name}? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setState(prev => ({ ...prev, showDeleteDialog: false, clientToDelete: null }))}>
              Cancel
            </Button>
            <Button onPress={confirmDeleteClient} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={state.snackbarVisible}
        onDismiss={() => setState(prev => ({ ...prev, snackbarVisible: false }))}
        duration={3000}
      >
        {state.snackbarMessage}
      </Snackbar>
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
    marginTop: theme.spacing.medium,
    color: theme.colors.onSurface,
  },
  searchBar: {
    margin: theme.spacing.medium,
    elevation: theme.elevation.level2,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.small,
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
  sortContainer: {
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  sortLabel: {
    marginBottom: theme.spacing.small,
    color: theme.colors.onSurface,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.small,
  },
  sortButton: {
    marginBottom: theme.spacing.small,
  },
  sortButtonLabel: {
    fontSize: 12,
  },
  errorCard: {
    margin: theme.spacing.medium,
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
  },
  listContent: {
    paddingHorizontal: theme.spacing.medium,
    paddingBottom: 100, // Space for FAB
  },
  clientCard: {
    marginBottom: theme.spacing.medium,
    elevation: theme.elevation.level2,
    borderRadius: theme.borderRadius.medium,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  clientName: {
    flex: 1,
    color: theme.colors.onSurface,
    marginRight: theme.spacing.small,
  },
  clientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    height: 24,
  },
  clientEmail: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.small,
  },
  clientPhone: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.small,
  },
  divider: {
    marginVertical: theme.spacing.small,
  },
  clientDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visaChip: {
    backgroundColor: theme.colors.primaryContainer,
    height: 24,
  },
  chipText: {
    fontSize: 10,
  },
  clientMeta: {
    flex: 1,
    alignItems: 'center',
  },
  clientDate: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
    marginLeft: theme.spacing.small,
  },
  loadingMore: {
    padding: theme.spacing.medium,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xlarge,
    paddingHorizontal: theme.spacing.medium,
  },
  emptyTitle: {
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.small,
    textAlign: 'center',
  },
  emptyMessage: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.large,
  },
  emptyCreateButton: {
    marginTop: theme.spacing.medium,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.medium,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default ClientListScreen;