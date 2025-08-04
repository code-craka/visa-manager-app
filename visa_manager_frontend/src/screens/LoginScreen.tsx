import React, { useState } from 'react';
import { View } from 'react-native';
import { Input, Button, useTheme } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleLogin = () => {
    // Simulate successful login and navigate to dashboard
    // In a real app, you would authenticate with your backend and get the user's role
    const userRole = email.includes('agency') ? 'agency' : 'partner'; // Dummy logic for role
    navigation.navigate('Dashboard', { userRole });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.medium }}>
      <Input
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
      />
      <Input
        placeholder='Password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title='Login' onPress={handleLogin} buttonStyle={{ backgroundColor: theme.colors.primary }} />
    </View>
  );
};

export default LoginScreen;