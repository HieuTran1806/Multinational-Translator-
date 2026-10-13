import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** true = online, false = offline, null = unknown yet. */
export function useOnline(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    return NetInfo.addEventListener(state => {
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
  }, []);
  return online;
}
