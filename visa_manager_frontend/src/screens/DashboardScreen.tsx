import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, useTheme } from 'react-native-elements';

const DashboardScreen = ({ route }) => {
  const { userRole } = route.params; // 'agency' or 'partner'
  const { theme } = useTheme();

  const [dashboardData, setDashboardData] = useState({
    totalClients: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalCommission: 0,
    newlyAssignedTasks: 0,
    earnedCommissions: 0,
  });

  useEffect(() => {
    // Fetch dashboard data based on userRole
    // Replace with your actual API endpoints
    if (userRole === 'agency') {
      fetch('http://localhost:3000/api/dashboard/agency')
        .then((response) => response.json())
        .then((data) => setDashboardData(data))
        .catch((error) => console.error(error));
    } else if (userRole === 'partner') {
      fetch('http://localhost:3000/api/dashboard/partner')
        .then((response) => response.json())
        .then((data) => setDashboardData(data))
        .catch((error) => console.error(error));
    }
  }, [userRole]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {userRole === 'agency' ? 'Agency Dashboard' : 'Partner Dashboard'}
      </Text>

      {userRole === 'agency' && (
        <View>
          <Card containerStyle={{ backgroundColor: theme.colors.background }}>
            <Card.Title style={{ color: theme.colors.primary }}>Overview</Card.Title>
            <Card.Divider />
            <Text style={{ color: theme.colors.text }}>Total Clients: {dashboardData.totalClients}</Text>
            <Text style={{ color: theme.colors.text }}>Pending Tasks: {dashboardData.pendingTasks}</Text>
            <Text style={{ color: theme.colors.text }}>Completed Tasks: {dashboardData.completedTasks}</Text>
            <Text style={{ color: theme.colors.text }}>Total Commission Earnings: ${dashboardData.totalCommission}</Text>
          </Card>
        </View>
      )}

      {userRole === 'partner' && (
        <View>
          <Card containerStyle={{ backgroundColor: theme.colors.background }}>
            <Card.Title style={{ color: theme.colors.primary }}>Overview</Card.Title>
            <Card.Divider />
            <Text style={{ color: theme.colors.text }}>Newly Assigned Tasks: {dashboardData.newlyAssignedTasks}</Text>
            <Text style={{ color: theme.colors.text }}>Total Completed Tasks: {dashboardData.completedTasks}</Text>
            <Text style={{ color: theme.colors.text }}>Earned Commissions: ${dashboardData.earnedCommissions}</Text>
          </Card>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default DashboardScreen;