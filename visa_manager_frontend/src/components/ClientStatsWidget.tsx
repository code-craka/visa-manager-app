import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Surface, 
  ProgressBar,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import { ClientStats } from '../types/Client';
import { theme } from '../styles/theme';

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8
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
    padding: 12,
    margin: 4,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
    minHeight: 70
  },
  statCardLarge: {
    padding: 16,
    margin: 4,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
    minHeight: 80
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  statNumberLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  statNumberGreen: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  statNumberOrange: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800'
  },
  statNumberRed: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336'
  },
  statNumberBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  statNumberPurple: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9C27B0'
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 4
  },
  progressContainer: {
    marginTop: 16
  },
  progressLabel: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 14
  },
  progressBar: {
    height: 8,
    borderRadius: 4
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  statusChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'center'
  },
  statusChip: {
    margin: 2
  },
  chipPending: {
    backgroundColor: '#FFF3E0'
  },
  chipInProgress: {
    backgroundColor: '#E3F2FD'
  },
  chipUnderReview: {
    backgroundColor: '#F3E5F5'
  },
  chipCompleted: {
    backgroundColor: '#E8F5E8'
  },
  chipApproved: {
    backgroundColor: '#E8F5E8'
  },
  chipRejected: {
    backgroundColor: '#FFEBEE'
  },
  chipDocuments: {
    backgroundColor: '#FFF8E1'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  }
});

interface ClientStatsWidgetProps {
  stats: ClientStats | null;
  loading?: boolean;
  showProgress?: boolean;
  showStatusBreakdown?: boolean;
}

const ClientStatsWidget: React.FC<ClientStatsWidgetProps> = ({
  stats,
  loading = false,
  showProgress = true,
  showStatusBreakdown = true
}) => {
  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Client Statistics</Title>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 8 }}>Loading client statistics...</Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Client Statistics</Title>
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 16 }}>
            No client statistics available
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const totalClients = stats.totalClients;
  const activeClients = stats.pending + stats.inProgress + stats.underReview;
  const completedClients = stats.completed + stats.approved;
  const completionRate = totalClients > 0 ? (completedClients / totalClients) : 0;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Client Statistics</Title>
        
        {/* Main Stats */}
        <View style={styles.statsContainer}>
          <Surface style={styles.statCardLarge}>
            <Text style={styles.statNumberLarge}>{totalClients}</Text>
            <Text style={styles.statLabel}>Total Clients</Text>
          </Surface>

          <Surface style={styles.statCardLarge}>
            <Text style={styles.statNumberGreen}>{completedClients}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Surface>
        </View>

        {/* Status Breakdown */}
        <View style={styles.statsContainer}>
          <Surface style={styles.statCard}>
            <Text style={styles.statNumberOrange}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <Text style={styles.statNumberBlue}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <Text style={styles.statNumberPurple}>{stats.underReview}</Text>
            <Text style={styles.statLabel}>Under Review</Text>
          </Surface>
        </View>

        <View style={styles.statsContainer}>
          <Surface style={styles.statCard}>
            <Text style={styles.statNumberGreen}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <Text style={styles.statNumberRed}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <Text style={styles.statNumberOrange}>{stats.documentsRequired}</Text>
            <Text style={styles.statLabel}>Docs Required</Text>
          </Surface>
        </View>

        {/* Progress Bar */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Completion Progress</Text>
            <ProgressBar 
              progress={completionRate}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {completedClients} of {totalClients} clients completed ({Math.round(completionRate * 100)}%)
            </Text>
          </View>
        )}

        {/* Status Chips */}
        {showStatusBreakdown && totalClients > 0 && (
          <View style={styles.statusChipsContainer}>
            {stats.pending > 0 && (
              <Chip 
                style={[styles.statusChip, styles.chipPending]}
                textStyle={{ fontSize: 10 }}
                compact
              >
                {stats.pending} Pending
              </Chip>
            )}
            {stats.inProgress > 0 && (
              <Chip 
                style={[styles.statusChip, styles.chipInProgress]}
                textStyle={{ fontSize: 10 }}
                compact
              >
                {stats.inProgress} In Progress
              </Chip>
            )}
            {stats.underReview > 0 && (
              <Chip 
                style={[styles.statusChip, styles.chipUnderReview]}
                textStyle={{ fontSize: 10 }}
                compact
              >
                {stats.underReview} Under Review
              </Chip>
            )}
            {stats.approved > 0 && (
              <Chip 
                style={[styles.statusChip, styles.chipApproved]}
                textStyle={{ fontSize: 10 }}
                compact
              >
                {stats.approved} Approved
              </Chip>
            )}
            {stats.completed > 0 && (
              <Chip 
                style={[styles.statusChip, styles.chipCompleted]}
                textStyle={{ fontSize: 10 }}
                compact
              >
                {stats.completed} Completed
              </Chip>
            )}
            {stats.rejected > 0 && (
              <Chip 
                style={[styles.statusChip, styles.chipRejected]}
                textStyle={{ fontSize: 10 }}
                compact
              >
                {stats.rejected} Rejected
              </Chip>
            )}
            {stats.documentsRequired > 0 && (
              <Chip 
                style={[styles.statusChip, styles.chipDocuments]}
                textStyle={{ fontSize: 10 }}
                compact
              >
                {stats.documentsRequired} Docs Needed
              </Chip>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default ClientStatsWidget;