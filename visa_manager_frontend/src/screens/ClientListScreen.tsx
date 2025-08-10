// ClientListScreen - Comprehensive client management with search and filtering
// Following Material Design patterns with optimized React performance

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
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
  Snackbar,
  Badge,
  Banner
} from 'react-native-paper';
import {
  Client,
  ClientStatus,
  VisaType,
  ClientFilters,
  ClientStats
} from '../types/Client';
import ApiService from '../services/ApiService';
import { theme, statusColors, visaTypeIcons } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useClientRealtime } from '../hooks/useClientRealtime';
import { useNetworkStatus, useNetworkAwareRequest } from '../hooks/useNetworkStatus';
import { useErrorHandler, ClientErrorBoundary } from '../components/ClientErrorBoundary';
import { usePerformanceMonitor, useRenderPerformance, useListPerformance } from '../hooks/usePerformanceMonitor';

interface ClientListScreenProps {
  navigation?: any; // Optional navigation prop for flexibility
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
  // Real-time state
  connectionStatus: string;
  isConnected: boolean;
  clientStats: ClientStats | null;
  realtimeUpdates: number; // Counter for real-time updates
}

const ClientListScreen: React.FC<ClientListScreenProps> = ({ navigation }) => {
  const { getAuthToken } = useAuth();
  
  // Performance monitoring
  const { trackRenderStart, trackRenderEnd, trackApiCall, trackCacheHit, trackCacheMiss } = usePerformanceMonitor('ClientListScreen');
  const { renderCount } = useRenderPerformance('ClientListScreen');
  
  // Network status and error handling
  const { networkStatus, networkError } = useNetworkStatus();
  const { executeRequest, isRetrying } = useNetworkAwareRequest();
  const { handleError } = useErrorHandler();
  
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
    // Real-time state
    connectionStatus: 'DISCONNECTED',
    isConnected: false,
    clientStats: null,
    realtimeUpdates: 0,
  });

  // Initialize ApiService with auth token getter and user ID
  useEffect(() => {
    if (ApiService && ApiService.setAuthTokenGetter) {
      ApiService.setAuthTokenGetter(getAuthToken);
    }
  }, [getAuthToken]);

  // Set current user ID for caching when user is available
  useEffect(() => {
    const { user } = useAuth();
    if (user?.id && ApiService.setCurrentUserId) {
      ApiService.setCurrentUserId(user.id);
    }
  }, []);

  // Real-time WebSocket integration
  const { connect, disconnect, isConnected } = useClientRealtime({
    onClientCreated: useCallback((client: Client) => {
      setState(prev => ({
        ...prev,
        clients: [client, ...prev.clients],
        realtimeUpdates: prev.realtimeUpdates + 1,
        snackbarVisible: true,
        snackbarMessage: `New client "${client.name}" added`
      }));
    }, []),

    onClientUpdated: useCallback((client: Client) => {
      setState(prev => ({
        ...prev,
        clients: prev.clients.map(c => c.id === client.id ? client : c),
        realtimeUpdates: prev.realtimeUpdates + 1,
        snackbarVisible: true,
        snackbarMessage: `Client "${client.name}" updated`
      }));
    }, []),

    onClientDeleted: useCallback((clientId: number, clientName: string) => {
      setState(prev => ({
        ...prev,
        clients: prev.clients.filter(c => c.id !== clientId),
        realtimeUpdates: prev.realtimeUpdates + 1,
        snackbarVisible: true,
        snackbarMessage: `Client "${clientName}" deleted`
      }));
    }, []),

    onClientStats: useCallback((stats: ClientStats) => {
      setState(prev => ({
        ...prev,
        clientStats: stats
      }));
    }, []),

    onConnectionStatusChange: useCallback((status: string) => {
      setState(prev => ({
        ...prev,
        connectionStatus: status,
        isConnected: status === 'CONNECTED'
      }));
    }, [])
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          await connect(token);
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, getAuthToken]);

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

  // Memoized filter options for status chips with client counts
  const statusFilters = useMemo(() => {
    const counts = state.clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<ClientStatus, number>);

    return [
      { key: 'all', label: 'All', count: state.clients.length },
      { key: ClientStatus.PENDING, label: 'Pending', count: counts[ClientStatus.PENDING] || 0 },
      { key: ClientStatus.IN_PROGRESS, label: 'In Progress', count: counts[ClientStatus.IN_PROGRESS] || 0 },
      { key: ClientStatus.UNDER_REVIEW, label: 'Under Review', count: counts[ClientStatus.UNDER_REVIEW] || 0 },
      { key: ClientStatus.COMPLETED, label: 'Completed', count: counts[ClientStatus.COMPLETED] || 0 },
      { key: ClientStatus.APPROVED, label: 'Approved', count: counts[ClientStatus.APPROVED] || 0 },
      { key: ClientStatus.REJECTED, label: 'Rejected', count: counts[ClientStatus.REJECTED] || 0 },
    ];
  }, [state.clients]);

  // Memoized filtered and sorted clients for better performance
  const filteredAndSortedClients = useMemo(() => {
    trackRenderStart();
    
    let filtered = [...state.clients];

    // Apply search filter if query exists
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (state.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'visaType':
          aValue = a.visaType.toLowerCase();
          bValue = b.visaType.toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    trackRenderEnd();
    return filtered;
  }, [state.clients, state.searchQuery, state.selectedStatus, state.sortBy, state.sortOrder, trackRenderStart, trackRenderEnd]);

  // Monitor list performance
  const { itemCount } = useListPerformance('ClientList', filteredAndSortedClients.length);

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

      const response = await trackApiCall(
        () => executeRequest(
          () => ApiService.getClients(filters),
          { maxRetries: 2, waitForConnection: true }
        ),
        'getClients'
      );

      if (response.success) {
        // Track cache performance
        if (response.message?.includes('cache')) {
          trackCacheHit();
        } else {
          trackCacheMiss();
        }

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
        throw new Error(response.error || 'Failed to load clients');
      }
    } catch (error: any) {
      handleError(error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load clients',
        loading: false,
        refreshing: false
      }));
    }
  }, [state.searchQuery, state.selectedStatus, state.sortBy, state.sortOrder, state.page, executeRequest, handleError, trackApiCall, trackCacheHit, trackCacheMiss]);

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
    if (navigation?.navigate) {
      navigation.navigate('ClientForm', { clientId: client.id, client, mode: 'edit' });
    } else {
      console.log('Navigate to client details:', client.id);
    }
  }, [navigation]);

  const handleEditClient = useCallback((client: Client) => {
    if (navigation?.navigate) {
      navigation.navigate('ClientForm', { clientId: client.id, client, mode: 'edit' });
    } else {
      console.log('Navigate to edit client:', client.id);
    }
  }, [navigation]);

  const handleCreateClient = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate('ClientForm', { mode: 'create' });
    } else {
      console.log('Navigate to create client');
    }
  }, [navigation]);

  const handleAssignTask = useCallback((client: Client) => {
    if (navigation?.navigate) {
      navigation.navigate('TaskAssignment', { clientId: client.id, selectedClient: client });
    } else {
      console.log('Navigate to task assignment for client:', client.id);
    }
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    loadClients(true, false);
  }, [loadClients]);

  const handleLoadMore = useCallback(() => {
    if (state.hasMore && !state.loading) {
      loadClients(false, true);
    }
  }, [state.hasMore, state.loading, loadClients]);

  // Delete client functionality with enhanced error handling
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
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await ApiService.deleteClient(state.clientToDelete.id);

      if (response.success) {
        // Remove client from local state
        setState(prev => ({
          ...prev,
          clients: prev.clients.filter(c => c.id !== state.clientToDelete!.id),
          showDeleteDialog: false,
          clientToDelete: null,
          loading: false,
          snackbarVisible: true,
          snackbarMessage: `Client "${state.clientToDelete!.name}" deleted successfully`
        }));

        // Refresh the list to ensure consistency
        setTimeout(() => {
          loadClients(true, false);
        }, 1000);
      } else {
        throw new Error((response as any).error);
      }
    } catch (error: any) {
      let errorMessage = 'Failed to delete client';
      
      // Handle specific error cases
      if (error.message?.includes('active tasks') || error.message?.includes('HAS_ACTIVE_TASKS')) {
        errorMessage = `Cannot delete "${state.clientToDelete?.name}" because they have active tasks. Please complete or cancel all tasks first.`;
      } else if (error.message?.includes('not found') || error.message?.includes('access denied')) {
        errorMessage = `Client "${state.clientToDelete?.name}" not found or access denied.`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        showDeleteDialog: false,
        clientToDelete: null,
        loading: false,
        snackbarVisible: true,
        snackbarMessage: errorMessage
      }));
    }
  }, [state.clientToDelete, loadClients]);

  // Helper function to get status color
  const getStatusColor = useCallback((status: ClientStatus): string => {
    return statusColors[status] || theme.colors.surface;
  }, []);

  // Helper function to get visa type icon
  const getVisaTypeIcon = useCallback((visaType: VisaType): string => {
    return visaTypeIcons[visaType] || 'file-document';
  }, []);

  // Memoized client item component for performance optimization
  const ClientItem = React.memo<{ item: Client }>(({ item }) => (
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
              icon="clipboard-plus"
              size={16}
              onPress={() => handleAssignTask(item)}
              style={styles.actionButton}
              iconColor={theme.colors.primary}
              testID={`assign-task-${item.id}`}
            />
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
              testID={`delete-client-${item.id}`}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  ), (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.email === nextProps.item.email &&
      prevProps.item.phone === nextProps.item.phone &&
      prevProps.item.status === nextProps.item.status &&
      prevProps.item.visaType === nextProps.item.visaType &&
      prevProps.item.updatedAt === nextProps.item.updatedAt
    );
  });

  // Client item renderer with optimized performance
  const renderClientItem = useCallback(({ item }: { item: Client }) => (
    <ClientItem item={item} />
  ), []);

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
    <ClientErrorBoundary>
      <View style={styles.container}>
        {/* Network status banner */}
        {networkStatus.isOffline && (
          <Banner
            visible={true}
            actions={[]}
            icon="wifi-off"
            style={styles.offlineBanner}
          >
            You are currently offline. Data may not be up to date.
          </Banner>
        )}

        {/* Retry banner */}
        {isRetrying && (
          <Banner
            visible={true}
            actions={[]}
            icon="refresh"
            style={styles.retryBanner}
          >
            <View style={styles.retryContent}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.retryText}>Retrying request...</Text>
            </View>
          </Banner>
        )}

        {/* Search bar */}
        <Searchbar
          placeholder="Search clients by name, email, or visa type..."
          value={state.searchQuery}
          onChangeText={debouncedSearch}
          style={styles.searchBar}
          iconColor={theme.colors.primary}
          elevation={2}
          editable={!networkStatus.isOffline}
        />

      {/* Connection status indicator */}
      <View style={styles.connectionStatus}>
        <View style={styles.connectionIndicator}>
          <View style={[
            styles.connectionDot,
            { backgroundColor: state.isConnected ? '#4CAF50' : '#F44336' }
          ]} />
          <Text variant="bodySmall" style={styles.connectionText}>
            {state.isConnected ? 'Live updates active' : 'Reconnecting...'}
          </Text>
          {state.realtimeUpdates > 0 && (
            <Badge size={16} style={styles.updatesBadge}>
              {state.realtimeUpdates}
            </Badge>
          )}
        </View>
        {state.clientStats && (
          <Text variant="bodySmall" style={styles.statsText}>
            {state.clientStats.totalClients} clients • {state.clientStats.pending} pending
          </Text>
        )}
      </View>

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
        data={filteredAndSortedClients}
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        getItemLayout={(data, index) => ({
          length: 120, // Approximate height of each client card
          offset: 120 * index,
          index,
        })}
      />

      {/* Create client FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateClient}
        label="Add Client"
        color={theme.colors.onPrimary}
      />

      {/* Enhanced delete confirmation dialog with client details */}
      <Portal>
        <Dialog
          visible={state.showDeleteDialog}
          onDismiss={() => setState(prev => ({ ...prev, showDeleteDialog: false, clientToDelete: null }))}
          style={styles.deleteDialog}
        >
          <Dialog.Title style={styles.deleteDialogTitle}>
            <Text variant="headlineSmall" style={{ color: theme.colors.error }}>
              Delete Client
            </Text>
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.deleteWarningText}>
              Are you sure you want to permanently delete this client? This action cannot be undone.
            </Text>
            
            {state.clientToDelete && (
              <Card style={styles.clientDetailsCard}>
                <Card.Content>
                  <View style={styles.clientDetailRow}>
                    <Text variant="labelMedium" style={styles.clientDetailLabel}>Name:</Text>
                    <Text variant="bodyMedium" style={styles.clientDetailValue}>
                      {state.clientToDelete.name}
                    </Text>
                  </View>
                  
                  <View style={styles.clientDetailRow}>
                    <Text variant="labelMedium" style={styles.clientDetailLabel}>Email:</Text>
                    <Text variant="bodyMedium" style={styles.clientDetailValue}>
                      {state.clientToDelete.email}
                    </Text>
                  </View>
                  
                  {state.clientToDelete.phone && (
                    <View style={styles.clientDetailRow}>
                      <Text variant="labelMedium" style={styles.clientDetailLabel}>Phone:</Text>
                      <Text variant="bodyMedium" style={styles.clientDetailValue}>
                        {state.clientToDelete.phone}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.clientDetailRow}>
                    <Text variant="labelMedium" style={styles.clientDetailLabel}>Visa Type:</Text>
                    <Chip
                      icon={getVisaTypeIcon(state.clientToDelete.visaType)}
                      style={styles.visaTypeChip}
                      textStyle={styles.chipText}
                      compact
                    >
                      {state.clientToDelete.visaType.toUpperCase()}
                    </Chip>
                  </View>
                  
                  <View style={styles.clientDetailRow}>
                    <Text variant="labelMedium" style={styles.clientDetailLabel}>Status:</Text>
                    <Chip
                      mode="outlined"
                      style={[styles.statusDetailChip, { backgroundColor: getStatusColor(state.clientToDelete.status) }]}
                      textStyle={styles.chipText}
                      compact
                    >
                      {state.clientToDelete.status.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </View>
                  
                  <View style={styles.clientDetailRow}>
                    <Text variant="labelMedium" style={styles.clientDetailLabel}>Created:</Text>
                    <Text variant="bodyMedium" style={styles.clientDetailValue}>
                      {new Date(state.clientToDelete.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}
            
            <Text variant="bodySmall" style={styles.deleteNoteText}>
              Note: Clients with active tasks cannot be deleted. Please complete or cancel all associated tasks first.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.deleteDialogActions}>
            <Button 
              onPress={() => setState(prev => ({ ...prev, showDeleteDialog: false, clientToDelete: null }))}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button 
              onPress={confirmDeleteClient} 
              mode="contained"
              buttonColor={theme.colors.error}
              textColor="#FFFFFF"
              style={styles.deleteButton}
              loading={state.loading}
              disabled={state.loading}
            >
              {state.loading ? 'Deleting...' : 'Delete Client'}
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
  </ClientErrorBoundary>
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
  offlineBanner: {
    backgroundColor: theme.colors.errorContainer,
  },
  retryBanner: {
    backgroundColor: theme.colors.primaryContainer,
  },
  retryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    marginLeft: theme.spacing.small,
  },
  searchBar: {
    margin: theme.spacing.medium,
    elevation: theme.elevation.level2,
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    backgroundColor: theme.colors.surfaceVariant,
    marginHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    borderRadius: theme.borderRadius.small,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.small,
  },
  connectionText: {
    color: theme.colors.onSurfaceVariant,
    marginRight: theme.spacing.small,
  },
  updatesBadge: {
    backgroundColor: theme.colors.primary,
  },
  statsText: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
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
  // Delete dialog styles
  deleteDialog: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  deleteDialogTitle: {
    paddingBottom: theme.spacing.small,
  },
  deleteWarningText: {
    marginBottom: theme.spacing.medium,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  clientDetailsCard: {
    marginVertical: theme.spacing.medium,
    backgroundColor: theme.colors.surfaceVariant,
    elevation: 1,
  },
  clientDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
    paddingVertical: theme.spacing.small,
  },
  clientDetailLabel: {
    flex: 1,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  clientDetailValue: {
    flex: 2,
    textAlign: 'right',
    color: theme.colors.onSurface,
  },
  visaTypeChip: {
    backgroundColor: theme.colors.primaryContainer,
    height: 24,
  },
  statusDetailChip: {
    height: 24,
  },
  deleteNoteText: {
    marginTop: theme.spacing.medium,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  deleteDialogActions: {
    paddingTop: theme.spacing.medium,
  },
  cancelButton: {
    marginRight: theme.spacing.small,
  },
  deleteButton: {
    minWidth: 120,
  },
});

export default ClientListScreen;