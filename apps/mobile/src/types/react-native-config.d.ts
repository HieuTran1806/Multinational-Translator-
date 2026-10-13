declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    GOOGLE_MAPS_ANDROID_API_KEY?: string;
    GOOGLE_MAPS_IOS_API_KEY?: string;
  }
  export const Config: NativeConfig;
  export default Config;
}
