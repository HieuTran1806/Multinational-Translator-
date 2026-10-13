import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LoadingView } from '../components/StateViews';
import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import MapScreen from '../screens/MapScreen';
import OfflineScreen from '../screens/OfflineScreen';
import PoiDetailScreen from '../screens/PoiDetailScreen';
import PoiListScreen from '../screens/PoiListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useApp } from '../state/AppContext';
import { colors } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const iconStyles = StyleSheet.create({ icon: { fontSize: 18 } });
const icon = (glyph: string) => ({ color }: { color: string }) => <Text style={[iconStyles.icon, { color }]}>{glyph}</Text>;

function Tabs() {
  const { t } = useApp();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.forest,
        tabBarActiveTintColor: colors.olive,
        tabBarInactiveTintColor: colors.stone,
        tabBarStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: t.tabMap, tabBarIcon: icon('⌖') }} />
      <Tab.Screen name="List" component={PoiListScreen} options={{ title: t.tabList, tabBarIcon: icon('☰') }} />
      <Tab.Screen name="Offline" component={OfflineScreen} options={{ title: t.tabOffline, tabBarIcon: icon('⇩') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t.tabSettings, tabBarIcon: icon('⚙') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { ready, narrationLanguage, t } = useApp();
  if (!ready) {
    return <LoadingView label="…" />;
  }
  if (!narrationLanguage) {
    return <LanguageSelectScreen />;
  }
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.forest, headerStyle: { backgroundColor: colors.paper } }}>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="PoiDetail" component={PoiDetailScreen} options={({ route }) => ({ title: route.params.title ?? t.viewDetail })} />
    </Stack.Navigator>
  );
}
