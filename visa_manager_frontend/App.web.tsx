import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';

const theme = {
  colors: {
    primary: '#8D05D4',
    secondary: '#1976d2',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
  },
};

const App: React.FC = () => {
  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <Text style={styles.title}>Visa Manager App</Text>
        <Text style={styles.subtitle}>Web Version</Text>
        <Text style={styles.description}>
          React Native Web implementation is now configured and ready for development.
        </Text>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8D05D4',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#666',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    maxWidth: 400,
  },
});

export default App;