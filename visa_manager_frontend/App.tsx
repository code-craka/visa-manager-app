import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from 'react-native-elements';
import { theme } from './src/styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppNavigator />
    </ThemeProvider>
  );
}

export default App;
