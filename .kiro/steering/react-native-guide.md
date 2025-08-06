---
inclusion: fileMatch
fileMatchPattern: '**/src/screens/*|**/src/components/*|**/src/context/*'
---

# React Native Implementation Guide

## Component Structure
```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { theme } from '../styles/theme';

interface Props {
  // Define all props with TypeScript interfaces
}

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Use proper hooks with TypeScript
  const [state, setState] = useState<StateType>(initialState);
  
  // Memoize callbacks to prevent re-renders
  const handleAction = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Memoize computed values
  const computedValue = useMemo(() => {
    return expensiveComputation(state);
  }, [state]);
  
  return (
    <View style={styles.container}>
      {/* Use React Native Paper components */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.background,
  },
});

export default ComponentName;
```

## Authentication Context Usage
```typescript
import { useAuth } from '../context/AuthContext';

const { user, isLoading, getAuthToken, syncUserWithBackend } = useAuth();

// Get JWT template token
const token = await getAuthToken(); // Uses 'neon' template
```

## Material Design Theme
```typescript
// Use consistent theme colors
const theme = {
  colors: {
    primary: '#8D05D4', // Electric Violet
    secondary: '#1976d2',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
};
```

## Performance Best Practices
- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Implement proper cleanup in `useEffect`
- Use `React.memo` for pure components when needed