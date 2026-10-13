import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Map: undefined;
  List: undefined;
  Offline: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  PoiDetail: { poiId: number; title?: string };
};
