import React, { useState } from 'react';
import { View } from 'react-native';
import { Input, Button, useTheme } from 'react-native-elements';

const RegistrationScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const { theme } = useTheme();

  const handleRegister = () => {
    // Handle registration logic here
    console.log({ name, email, password, role });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.medium }}>
      <Input
        placeholder='Name'
        value={name}
        onChangeText={setName}
      />
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
      <Input
        placeholder='Role'
        value={role}
        onChangeText={setRole}
      />
      <Button title='Register' onPress={handleRegister} buttonStyle={{ backgroundColor: theme.colors.primary }} />
    </View>
  );
};

export default RegistrationScreen;