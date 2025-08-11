import React from 'react';
import { Platform } from 'react-native';
import AppNavigator from './AppNavigator';
import WebNavigator from './WebNavigator';

const PlatformNavigator = () => {
  if (Platform.OS === 'web') {
    return <WebNavigator />;
  }
  return <AppNavigator />;
};

export default PlatformNavigator;