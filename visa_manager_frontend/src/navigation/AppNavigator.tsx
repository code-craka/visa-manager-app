import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Button } from 'react-native-paper';
import { theme } from '../styles/theme';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ClientListScreen from '../screens/ClientListScreen';
import ClientFormScreen from '../screens/ClientFormScreen';
import PartnerClientListScreen from '../screens/PartnerClientListScreen';
import PartnerClientDetailScreen from '../screens/PartnerClientDetailScreen';
import TaskAssignmentScreen from '../screens/TaskAssignmentScreen';
import CommissionReportScreen from '../screens/CommissionReportScreen';
import NotificationScreen from '../screens/NotificationScreen';

// Type definitions for navigation
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PartnerClientList: undefined;
  PartnerClientDetail: {
    clientId: number;
    clientName: string;
    taskId?: number;
  };
  ClientList: undefined;
  ClientForm: {
    clientId?: number;
    client?: any;
    mode: 'create' | 'edit';
  };
  TaskAssignment: {
    clientId?: number;
    taskId?: number;
    selectedClient?: any;
  };
};

type TabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  TaskAssignment: {
    clientId?: number;
    taskId?: number;
    selectedClient?: any;
  };
  Commission: undefined;
  Notifications: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
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
const ClientStack = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      {user?.role === 'partner' ? (
        <>
          <Stack.Screen
            name="PartnerClientList"
            component={PartnerClientListScreen}
            options={{ title: 'Accessible Clients', headerShown: false }}
          />
          <Stack.Screen
            name="PartnerClientDetail"
            component={PartnerClientDetailScreen}
            options={{ title: 'Client Details' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="ClientList"
            component={ClientListScreen}
            options={{ 
              title: 'Clients', 
              headerShown: false,
              headerRight: () => null
            }}
          />
          <Stack.Screen
            name="ClientForm"
            component={ClientFormScreen}
            options={({ route }) => ({
              title: route.params?.mode === 'edit' ? 'Edit Client' : 'Add Client',
              headerShown: true
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

// Task Assignment Stack
const TaskStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: theme.colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    }}
  >
    <Stack.Screen
      name="TaskAssignment"
      component={TaskAssignmentScreen}
      options={{ title: 'Task Assignment', headerShown: true }}
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
          component={TaskStack}
          options={{
            tabBarIcon: ({ color }) => (
              <View style={{ width: 24, height: 24, backgroundColor: color }} />
            ),
            title: 'Assign Tasks',
            headerShown: false
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
