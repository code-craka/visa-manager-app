import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Surface, 
  DataTable, 
  ProgressBar,
  Chip,
  List,
  Divider,
  Text,
  Badge,
  IconButton,
  Snackbar,
  ActivityIndicator,
  Portal,
  Modal,
  FAB
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useApiService, DashboardStats, Task, Notification } from '../services/ApiService';
import { ClientStatsWidget } from '../components';
import { theme } from '../styles/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  welcomeCard: {
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 8
  },
  welcomeTitle: {
    textAlign: 'center',
    color: theme.colors.primary
  },
  welcomeSubtitle: {
    textAlign: 'center',
    textTransform: 'capitalize'
  },
  card: {
    margin: 16,
    marginBottom: 8
  },
  marginVertical: {
    marginVertical: 8
  },
  marginTop: {
    marginTop: 8
  },
  cardTitle: {
    color: theme.colors.primary,
    marginBottom: 16
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statCard: {
    padding: 16,
    margin: 4,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  statNumberGreen: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  statNumberOrange: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800'
  },
  statNumberRed: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336'
  },
  statLabel: {
    color: '#666',
    textAlign: 'center'
  },
  progressContainer: {
    marginTop: 16
  },
  progressLabel: {
    marginBottom: 8,
    fontWeight: '600'
  },
  progressBar: {
    height: 8,
    borderRadius: 4
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666'
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  actionButton: {
    margin: 4,
    width: '30%'
  },
  actionButtonGreen: {
    margin: 4,
    width: '30%',
    backgroundColor: '#4CAF50'
  },
  actionButtonOrange: {
    margin: 4,
    width: '30%',
    backgroundColor: '#FF9800'
  },
  actionButtonPurple: {
    margin: 4,
    width: '30%',
    backgroundColor: '#9C27B0'
  },
  notificationBadge: {
    backgroundColor: '#F44336',
    marginLeft: 8
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chipText: {
    fontSize: 10
  },
  chipCompleted: {
    backgroundColor: '#E8F5E8'
  },
  chipInProgress: {
    backgroundColor: '#FFF3E0'
  },
  chipPending: {
    backgroundColor: '#FFEBEE'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16
  },
  unreadBadge: {
    backgroundColor: '#F44336'
  },
  viewAllButton: {
    marginTop: 8
  },
  signOutButton: {
    borderColor: '#F44336'
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary
  },
  connectionStatus: {
    alignItems: 'center'
  },
  connectionText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  chipConnected: {
    backgroundColor: '#E8F5E8'
  },
  chipDisconnected: {
    backgroundColor: '#FFEBEE'
  }
});

interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const DashboardScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { callApi, apiService } = useApiService();
  const { 
    isConnected: wsConnected, 
    connectionState, 
    notifications: realtimeNotifications, 
    unreadCount,
    dashboardStats: realtimeStats,
    clientStats: realtimeClientStats,
    lastUpdate,
    markNotificationAsRead 
  } = useRealtime();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Merge real-time stats with local stats
  useEffect(() => {
    if (realtimeStats) {
      setStats(prev => ({ ...prev, ...realtimeStats }));
    }
  }, [realtimeStats]);

  // Use real-time notifications if available, otherwise use local
  const displayNotifications = realtimeNotifications.length > 0 ? realtimeNotifications : notifications;

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashboardStats, tasksResponse, notificationsResponse] = await Promise.all([
        callApi(() => apiService.getDashboardStats()),
        callApi(() => apiService.getTasks({ page: 1, limit: 5 })),
        callApi(() => apiService.getNotifications(1, 5, true))
      ]);
      
      if (dashboardStats) {
        setStats(dashboardStats);
      }
      if (tasksResponse) {
        setRecentTasks(tasksResponse);
      }
      // Only use local notifications if no real-time ones are available
      if (realtimeNotifications.length === 0 && notificationsResponse) {
        setNotifications(notificationsResponse);
      }
      setSnackbarMessage(`Dashboard updated successfully ${wsConnected ? '(Live)' : ''}`);
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setSnackbarMessage('Failed to load dashboard data');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [callApi, apiService, realtimeNotifications.length, wsConnected]);

  // Auto-refresh dashboard every 30 seconds
  useEffect(() => {
    loadDashboardData();
    
    const refreshInterval = setInterval(() => {
      if (!refreshing) {
        loadDashboardData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [loadDashboardData, refreshing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  }, [signOut]);

  const handleNavigateToClients = useCallback(() => navigation.navigate('Clients'), [navigation]);
  const handleNavigateToTasks = useCallback(() => navigation.navigate('TaskAssignment'), [navigation]);
  const handleNavigateToCommission = useCallback(() => navigation.navigate('Commission'), [navigation]);
  const handleNavigateToNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const handleCreateClient = useCallback(() => navigation.navigate('Clients', { screen: 'ClientForm', params: { mode: 'create' } }), [navigation]);
  const handleCreateTask = useCallback(() => navigation.navigate('TaskAssignment'), [navigation]);

  const renderStatsCard = () => {
    const isAgency = user?.role === 'agency';
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>
            {isAgency ? 'Agency Overview' : 'Partner Overview'}
          </Title>
          
          <View style={styles.statsContainer}>
            <Surface style={styles.statCard}>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.statNumber}>
                  {isAgency ? (stats.total_clients || 0) : (stats.pending_tasks || 0)}
                </Text>
              )}
              <Text style={styles.statLabel}>
                {isAgency ? 'Total Clients' : 'New Tasks'}
              </Text>
            </Surface>

            <Surface style={styles.statCard}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Text style={styles.statNumberGreen}>
                  {stats.completed_tasks || 0}
                </Text>
              )}
              <Text style={styles.statLabel}>
                Completed Tasks
              </Text>
            </Surface>

            <Surface style={styles.statCard}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FF9800" />
              ) : (
                <Text style={styles.statNumberOrange}>
                  {stats.pending_tasks || 0}
                </Text>
              )}
              <Text style={styles.statLabel}>
                Pending Tasks
              </Text>
            </Surface>

            <Surface style={styles.statCard}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <Text style={styles.statNumberRed}>
                  ${(isAgency ? stats.total_commission : stats.total_earned)?.toFixed(2) || '0.00'}
                </Text>
              )}
              <Text style={styles.statLabel}>
                {isAgency ? 'Total Commission' : 'Total Earned'}
              </Text>
            </Surface>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Task Progress</Text>
            <ProgressBar 
              progress={
                (stats.total_tasks || 0) > 0 
                  ? (stats.completed_tasks || 0) / (stats.total_tasks || 0) 
                  : 0
              }
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {stats.completed_tasks || 0} of {stats.total_tasks || 0} tasks completed
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderQuickActions = () => {
    const isAgency = user?.role === 'agency';
    
    return (
      <Card style={[styles.card, styles.marginVertical]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Quick Actions</Title>
          
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              onPress={handleNavigateToClients}
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              icon="account-group"
            >
              {isAgency ? 'Manage Clients' : 'View Tasks'}
            </Button>

            {isAgency && (
              <Button
                mode="contained"
                onPress={handleCreateClient}
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                icon="account-plus"
              >
                Add Client
              </Button>
            )}

            {isAgency && (
              <Button
                mode="contained"
                onPress={handleNavigateToTasks}
                style={styles.actionButtonGreen}
                icon="plus"
              >
                Assign Task
              </Button>
            )}

            <Button
              mode="contained"
              onPress={handleNavigateToCommission}
              style={styles.actionButtonOrange}
              icon="currency-usd"
            >
              {isAgency ? 'View Payments' : 'View Earnings'}
            </Button>

            <Button
              mode="contained"
              onPress={handleNavigateToNotifications}
              style={styles.actionButtonPurple}
              icon="bell"
            >
              Notifications
              {(unreadCount > 0 || displayNotifications.length > 0) && (
                <Badge style={styles.notificationBadge}>
                  {unreadCount > 0 ? unreadCount : displayNotifications.length}
                </Badge>
              )}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderRecentTasks = () => (
    <Card style={[styles.card, styles.marginVertical]}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.cardTitle}>Recent Tasks</Title>
          <IconButton 
            icon="refresh" 
            onPress={onRefresh}
            disabled={refreshing}
          />
        </View>
        
        {recentTasks.length > 0 ? (
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Client</DataTable.Title>
              <DataTable.Title>Type</DataTable.Title>
              <DataTable.Title numeric>Status</DataTable.Title>
            </DataTable.Header>

            {recentTasks.map((task) => (
              <DataTable.Row key={task.id}>
                <DataTable.Cell>{task.client_name || `Client ${task.client_id}`}</DataTable.Cell>
                <DataTable.Cell>{task.task_type}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <Chip 
                    mode="outlined"
                    textStyle={styles.chipText}
                    style={
                      task.status === 'completed' ? styles.chipCompleted :
                      task.status === 'in_progress' ? styles.chipInProgress : 
                      styles.chipPending
                    }
                  >
                    {task.status.replace('_', ' ')}
                  </Chip>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        ) : (
          <Paragraph style={styles.emptyText}>
            No recent tasks found
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  const renderNotifications = () => (
    <Card style={[styles.card, styles.marginVertical]}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.cardTitle}>
            Recent Notifications
          </Title>
          <View style={styles.connectionStatus}>
            <Chip 
              mode="outlined" 
              compact
              textStyle={styles.connectionText}
              style={wsConnected ? styles.chipConnected : styles.chipDisconnected}
            >
              {wsConnected ? 'Live' : 'Offline'}
            </Chip>
          </View>
        </View>
        
        {displayNotifications.length > 0 ? (
          <View>
            {displayNotifications.slice(0, 3).map((notification) => (
              <View key={notification.id}>
                <List.Item
                  title={notification.title}
                  description={notification.message}
                  left={(props) => (
                    <List.Icon 
                      {...props} 
                      icon={
                        notification.type === 'urgent' ? 'alert' :
                        notification.type === 'task' ? 'clipboard-list' :
                        notification.type === 'payment' ? 'currency-usd' : 
                        'information'
                      }
                      color={
                        notification.type === 'urgent' ? '#F44336' :
                        notification.type === 'task' ? '#4CAF50' :
                        notification.type === 'payment' ? '#FF9800' : 
                        theme.colors.primary
                      }
                    />
                  )}
                  right={(props) => !notification.read && (
                    <Badge {...props} style={styles.unreadBadge}>•</Badge>
                  )}
                  onPress={() => markNotificationAsRead(notification.id)}
                />
                <Divider />
              </View>
            ))}
            
            <Button 
              mode="text" 
              onPress={handleNavigateToNotifications}
              style={styles.viewAllButton}
            >
              View All Notifications ({unreadCount} unread)
            </Button>
          </View>
        ) : (
          <Paragraph style={styles.emptyText}>
            No new notifications
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Surface style={styles.welcomeCard}>
          <Title style={styles.welcomeTitle}>
            Welcome back, {user?.displayName || user?.email}!
          </Title>
          <Paragraph style={styles.welcomeSubtitle}>
            {user?.role} Dashboard
          </Paragraph>
        </Surface>

        {renderStatsCard()}
        
        {/* Client Statistics Widget - Only show for agencies */}
        {user?.role === 'agency' && (
          <ClientStatsWidget 
            stats={realtimeClientStats || (stats.clientStats ? {
              totalClients: stats.totalClients || 0,
              pending: stats.clientStats.pending || 0,
              inProgress: stats.clientStats.inProgress || 0,
              underReview: stats.clientStats.underReview || 0,
              completed: stats.clientStats.completed || 0,
              approved: stats.clientStats.approved || 0,
              rejected: stats.clientStats.rejected || 0,
              documentsRequired: stats.clientStats.documentsRequired || 0
            } : null)}
            loading={isLoading}
            showProgress={true}
            showStatusBreakdown={true}
          />
        )}
        
        {renderQuickActions()}
        {renderRecentTasks()}
        {renderNotifications()}

        <Card style={[styles.card, styles.marginTop]}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleSignOut}
              style={styles.signOutButton}
              textColor="#F44336"
              icon="logout"
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Floating Action Button for Quick Actions */}
      {user?.role === 'agency' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={handleCreateTask}
          label="New Task"
        />
      )}
    </View>
  );
};

export default DashboardScreen;