import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Input, Button, ButtonGroup } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const RegistrationScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { signUp, syncUserWithBackend } = useAuth();
  const roles = ['Partner', 'Agency'];
  const roleValues: ('partner' | 'agency')[] = ['partner', 'agency'];

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // Step 1: Create user with Neon Auth
      await signUp(email.trim(), password, name.trim());

      // Step 2: Sync user with backend and set role
      await syncUserWithBackend(roleValues[selectedRoleIndex]);

      Alert.alert(
        'Success',
        'Account created successfully! You can now log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );

    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{
        padding: theme.spacing.large,
        justifyContent: 'center',
        minHeight: '100%'
      }}
    >
      <Text style={{
        fontSize: theme.fontSizes.header,
        fontWeight: 'bold',
        marginBottom: theme.spacing.large,
        textAlign: 'center',
        color: theme.colors.primary
      }}>
        Create Account
      </Text>

      <Input
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        leftIcon={{ type: 'material', name: 'person', color: theme.colors.primary }}
        inputStyle={{ color: '#333' }}
        disabled={isLoading}
      />

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

      <Input
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        leftIcon={{ type: 'material', name: 'lock-outline', color: theme.colors.primary }}
        inputStyle={{ color: '#333' }}
        disabled={isLoading}
      />

      <View style={{ marginVertical: theme.spacing.medium }}>
        <Text style={{
          fontSize: theme.fontSizes.body,
          marginBottom: theme.spacing.small,
          color: '#333',
          fontWeight: '600'
        }}>
          Select Account Type:
        </Text>
        <ButtonGroup
          onPress={setSelectedRoleIndex}
          selectedIndex={selectedRoleIndex}
          buttons={roles}
          containerStyle={{
            marginBottom: theme.spacing.medium,
            borderRadius: 8,
            borderColor: theme.colors.primary
          }}
          selectedButtonStyle={{ backgroundColor: theme.colors.primary }}
          selectedTextStyle={{ color: '#fff' }}
          textStyle={{ color: theme.colors.primary }}
          disabled={isLoading}
        />
        <Text style={{
          fontSize: theme.fontSizes.small,
          color: '#666',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          {selectedRoleIndex === 0
            ? 'Partner: Handle tasks assigned by agencies'
            : 'Agency: Create clients and assign tasks to partners'
          }
        </Text>
      </View>

      <Button
        title={isLoading ? 'Creating Account...' : 'Register'}
        onPress={handleRegister}
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
        title="Already have an account? Login"
        type="clear"
        onPress={() => navigation.navigate('Login')}
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
    </ScrollView>
  );
};

export default RegistrationScreen;