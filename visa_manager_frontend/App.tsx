import 'react-native-gesture-handler';
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { RealtimeProvider } from './src/context/RealtimeContext';
import PlatformNavigator from './src/navigation/PlatformNavigator';
import { SecurityProvider } from './src/components/security';
import { theme } from './src/styles/theme';

const App = () => {
  return (
    <SecurityProvider>
      <PaperProvider theme={{
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
        }
      }}>
        <AuthProvider>
          <RealtimeProvider>
            <PlatformNavigator />
          </RealtimeProvider>
        </AuthProvider>
      </PaperProvider>
    </SecurityProvider>
  );
};

export default App;