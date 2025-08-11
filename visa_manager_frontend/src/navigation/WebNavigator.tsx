import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Web Layout Component
const WebLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <nav style={{
      width: '250px',
      backgroundColor: theme.colors.primary,
      padding: '20px',
      color: 'white'
    }}>
      <h2>Visa Manager</h2>
      {/* Navigation links will be added here */}
    </nav>
    <main style={{ flex: 1, padding: '20px' }}>
      {children}
    </main>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

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

  return user ? <WebLayout>{children}</WebLayout> : <Navigate to="/login" replace />;
};

// Web Navigator
const WebNavigator = () => {
  const { user, isLoading } = useAuth();

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
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginScreen />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <RegistrationScreen />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients" 
          element={
            <ProtectedRoute>
              <ClientListScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients/new" 
          element={
            <ProtectedRoute>
              <ClientFormScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients/:id/edit" 
          element={
            <ProtectedRoute>
              <ClientFormScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <TaskAssignmentScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/commission" 
          element={
            <ProtectedRoute>
              <CommissionReportScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <NotificationScreen />
            </ProtectedRoute>
          } 
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default WebNavigator;