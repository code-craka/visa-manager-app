import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { theme } from '../styles/theme';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ClientListScreen from '../screens/ClientListScreen';
import ClientFormScreen from '../screens/ClientFormScreen';
import TaskAssignmentScreen from '../screens/TaskAssignmentScreen';
import CommissionReportScreen from '../screens/CommissionReportScreen';
import NotificationScreen from '../screens/NotificationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack for login/register flows
const AuthStack = () => (
  <Stack.Navigator
    initialRouteName="Login"
    screenOptions={{
      headerStyle: { backgroundColor: theme.colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    }}
  >
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ title: 'Sign In' }}
    />
    <Stack.Screen
      name="Register"
      component={RegistrationScreen}
      options={{ title: 'Create Account' }}
    />
  </Stack.Navigator>
);

// Client Stack for client-related screens
const ClientStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: theme.colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    }}
  >
    <Stack.Screen
      name="ClientList"
      component={ClientListScreen}
      options={{ title: 'Clients', headerShown: false }}
    />
    <Stack.Screen
      name="ClientForm"
      component={ClientFormScreen}
      options={{ title: 'Client Form', headerShown: false }}
    />
  </Stack.Navigator>
);

// Main App Tabs for authenticated users
const MainTabs = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, backgroundColor: color }} />
          ),
          title: user?.role === 'agency' ? 'Agency Dashboard' : 'Partner Dashboard'
        }}
      />

      <Tab.Screen
        name="Clients"
        component={ClientStack}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, backgroundColor: color }} />
          ),
          title: 'Clients',
          headerShown: false
        }}
      />

      {user?.role === 'agency' && (
        <Tab.Screen
          name="TaskAssignment"
          component={TaskAssignmentScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <View style={{ width: 24, height: 24, backgroundColor: color }} />
            ),
            title: 'Assign Tasks'
          }}
        />
      )}

      <Tab.Screen
        name="Commission"
        component={CommissionReportScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, backgroundColor: color }} />
          ),
          title: user?.role === 'agency' ? 'Payments' : 'Earnings'
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, backgroundColor: color }} />
          ),
          title: 'Notifications'
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
