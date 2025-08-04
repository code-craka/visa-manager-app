import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email.trim(), password);
      // Navigation will be handled by the AuthNavigator based on auth state
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{
      flex: 1,
      padding: theme.spacing.large,
      justifyContent: 'center',
      backgroundColor: '#fff'
    }}>
      <Text style={{
        fontSize: theme.fontSizes.header,
        fontWeight: 'bold',
        marginBottom: theme.spacing.large,
        textAlign: 'center',
        color: theme.colors.primary
      }}>
        Visa Manager Login
      </Text>

      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        leftIcon={{ type: 'material', name: 'email', color: theme.colors.primary }}
        inputStyle={{ color: '#333' }}
        disabled={isLoading}
      />

      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        leftIcon={{ type: 'material', name: 'lock', color: theme.colors.primary }}
        inputStyle={{ color: '#333' }}
        disabled={isLoading}
      />

      <Button
        title={isLoading ? 'Signing In...' : 'Login'}
        onPress={handleLogin}
        buttonStyle={{
          backgroundColor: theme.colors.primary,
          marginVertical: theme.spacing.medium,
          borderRadius: 8,
          paddingVertical: 12
        }}
        disabled={isLoading}
        loading={isLoading}
      />

      <Button
        title="Don't have an account? Register"
        type="clear"
        onPress={() => navigation.navigate('Register')}
        titleStyle={{ color: theme.colors.primary }}
        disabled={isLoading}
      />

      {isLoading && (
        <View style={{
          marginTop: theme.spacing.medium,
          alignItems: 'center'
        }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

export default LoginScreen;