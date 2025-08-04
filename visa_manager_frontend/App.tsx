import React from 'react';
import { ThemeProvider } from 'react-native-elements';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/styles/theme';

const App = () => {
  return (
    <ThemeProvider theme={{
      colors: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
      },
    }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
