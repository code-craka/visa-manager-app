import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const LoginScreen = ({ navigation }: any) => {
  const { signIn, showSignIn, setShowSignIn, showSignUp, setShowSignUp } = useAuth();

  const handleSignIn = () => {
    signIn();
  };

  const handleSignUp = () => {
    setShowSignUp(true);
    setShowSignIn(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Visa Manager
      </Text>

      <Text style={styles.subtitle}>
        Sign in to manage your visa workflow
      </Text>

      <Button
        title="Sign In"
        onPress={handleSignIn}
        buttonStyle={styles.signInButton}
        titleStyle={styles.buttonText}
        icon={{
          name: 'login',
          type: 'material',
          size: 20,
          color: 'white',
          style: { marginRight: 10 }
        }}
      />

      <Button
        title="Create Account"
        onPress={handleSignUp}
        buttonStyle={styles.signUpButton}
        titleStyle={styles.buttonText}
        type="outline"
        icon={{
          name: 'person-add',
          type: 'material',
          size: 20,
          color: theme.colors.primary,
          style: { marginRight: 10 }
        }}
      />

      <Text style={styles.termsText}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.large,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: theme.fontSizes.header,
    fontWeight: 'bold',
    marginBottom: theme.spacing.large,
    textAlign: 'center',
    color: theme.colors.primary
  },
  subtitle: {
    fontSize: theme.fontSizes.medium,
    marginBottom: theme.spacing.xlarge,
    textAlign: 'center',
    color: theme.colors.text
  },
  signInButton: {
    backgroundColor: theme.colors.primary,
    marginVertical: theme.spacing.medium,
    borderRadius: 8,
    paddingVertical: 15
  },
  signUpButton: {
    borderColor: theme.colors.primary,
    marginVertical: theme.spacing.small,
    borderRadius: 8,
    paddingVertical: 15
  },
  buttonText: {
    fontSize: theme.fontSizes.medium,
    fontWeight: '600'
  },
  termsText: {
    fontSize: theme.fontSizes.small,
    marginTop: theme.spacing.large,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20
  },

});

export default LoginScreen;