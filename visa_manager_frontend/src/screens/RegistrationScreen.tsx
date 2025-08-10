import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, ButtonGroup } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const RegistrationScreen = ({ navigation }: any) => {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  const { signUp, showSignUp, setShowSignUp, setShowSignIn, syncUserWithBackend } = useAuth();
  const roles = ['Partner', 'Agency'];
  const roleValues: ('partner' | 'agency')[] = ['partner', 'agency'];

  const handleSignUp = () => {
    signUp();
  };

  const handleSignIn = () => {
    setShowSignIn(true);
    setShowSignUp(false);
  };

  const handleAfterSignUp = async () => {
    try {
      // Sync user with backend and set role after successful signup
      await syncUserWithBackend(roleValues[selectedRoleIndex]);
      Alert.alert(
        'Success',
        'Account created successfully! Welcome to Visa Manager.',
      );
    } catch (error: any) {
      console.error('Post-signup sync error:', error);
      Alert.alert(
        'Setup Incomplete',
        'Account created but role setup failed. You can set your role later in settings.'
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>
        Join Visa Manager
      </Text>

      <Text style={styles.subtitle}>
        Choose your account type and create your account
      </Text>

      <View style={styles.roleSection}>
        <Text style={styles.roleTitle}>
          Select Account Type:
        </Text>
        <ButtonGroup
          onPress={setSelectedRoleIndex}
          selectedIndex={selectedRoleIndex}
          buttons={roles}
          containerStyle={styles.buttonGroup}
          selectedButtonStyle={styles.selectedButton}
          selectedTextStyle={styles.selectedButtonText}
          textStyle={styles.buttonText}
        />
        <Text style={styles.roleDescription}>
          {selectedRoleIndex === 0
            ? 'Partner: Handle tasks assigned by agencies'
            : 'Agency: Create clients and assign tasks to partners'
          }
        </Text>
      </View>

      <Button
        title="Create Account"
        onPress={handleSignUp}
        buttonStyle={styles.signUpButton}
        titleStyle={styles.buttonTitleStyle}
        icon={{
          name: 'person-add',
          type: 'material',
          size: 20,
          color: 'white',
          style: { marginRight: 10 }
        }}
      />

      <Button
        title="Already have an account? Sign In"
        type="clear"
        onPress={handleSignIn}
        titleStyle={styles.linkText}
      />

      <Text style={styles.termsText}>
        By signing up, you agree to our Terms of Service and Privacy Policy
      </Text>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  contentContainer: {
    padding: theme.spacing.large,
    justifyContent: 'center',
    minHeight: '100%'
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
    marginBottom: theme.spacing.large,
    textAlign: 'center',
    color: theme.colors.text
  },
  roleSection: {
    marginVertical: theme.spacing.medium
  },
  roleTitle: {
    fontSize: theme.fontSizes.medium,
    marginBottom: theme.spacing.small,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center'
  },
  buttonGroup: {
    marginBottom: theme.spacing.medium,
    borderRadius: 8,
    borderColor: theme.colors.primary
  },
  selectedButton: {
    backgroundColor: theme.colors.primary
  },
  selectedButtonText: {
    color: '#fff'
  },
  buttonText: {
    color: theme.colors.primary
  },
  roleDescription: {
    fontSize: theme.fontSizes.small,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.large
  },
  signUpButton: {
    backgroundColor: theme.colors.primary,
    marginVertical: theme.spacing.medium,
    borderRadius: 8,
    paddingVertical: 15
  },
  buttonTitleStyle: {
    fontSize: theme.fontSizes.medium,
    fontWeight: '600'
  },
  linkText: {
    color: theme.colors.primary
  },
  termsText: {
    fontSize: theme.fontSizes.small,
    marginTop: theme.spacing.large,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20
  },

});

export default RegistrationScreen;