
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ClientListScreen from '../screens/ClientListScreen';
import TaskAssignmentScreen from '../screens/TaskAssignmentScreen';
import CommissionReportScreen from '../screens/CommissionReportScreen';
import NotificationScreen from '../screens/NotificationScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegistrationScreen} />
        <Stack.Screen name="ClientList" component={ClientListScreen} />
        <Stack.Screen name="TaskAssignment" component={TaskAssignmentScreen} />
        <Stack.Screen name="CommissionReport" component={CommissionReportScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
