import 'react-native-gesture-handler';
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { RealtimeProvider } from './src/context/RealtimeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/styles/theme';

const App = () => {
  return (
    <PaperProvider theme={{
      colors: {
        primary: theme.colors.primary,
        background: theme.colors.background,
      }
    }}>
      <AuthProvider>
        <RealtimeProvider>
          <AppNavigator />
        </RealtimeProvider>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;