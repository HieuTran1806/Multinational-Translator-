/**
 * Thuyết minh đa ngôn ngữ — mobile app (React Native CLI + TypeScript).
 * Guests can browse and listen without signing in (MVP assumption, see docs).
 */
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/state/AppContext';
import { colors } from './src/theme';

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.sand, primary: colors.olive, card: colors.paper, text: colors.charcoal },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AppProvider>
        <NavigationContainer theme={theme}>
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
