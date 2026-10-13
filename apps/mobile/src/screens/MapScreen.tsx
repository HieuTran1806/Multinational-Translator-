import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import type { PoiSummary } from '../api/types';
import { AppButton, Banner, EmptyView, LoadingView } from '../components/StateViews';
import { isMapsConfigured } from '../config/env';
import type { RootStackParamList } from '../navigation/types';
import { useOnline } from '../network/useOnline';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

const CU_CHI: Region = { latitude: 11.1, longitude: 106.49, latitudeDelta: 0.18, longitudeDelta: 0.18 };

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Asks for foreground location only when the user taps "My location".
 * Returns false when denied; the app keeps working with manual POI selection.
 * iOS: the system prompt is shown by MapView when showsUserLocation becomes true
 * (requires NSLocationWhenInUseUsageDescription in Info.plist).
 */
async function requestForegroundLocation(t: { locationRationaleTitle: string; locationRationale: string }) {
  if (Platform.OS !== 'android') {
    return true;
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
    title: t.locationRationaleTitle,
    message: t.locationRationale,
    buttonPositive: 'OK',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export default function MapScreen() {
  const { api, t, narrationLanguage } = useApp();
  const online = useOnline();
  const navigation = useNavigation<Nav>();
  const mapRef = useRef<MapView>(null);
  const [pois, setPois] = useState<PoiSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<PoiSummary | null>(null);
  const [showUser, setShowUser] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const centeredOnUser = useRef(false);
  const mapsConfigured = isMapsConfigured();

  const load = useCallback(async () => {
    setError(false);
    try {
      const page = await api.listPublished(narrationLanguage ?? 'vi');
      setPois(page.items);
    } catch {
      setError(true);
    }
  }, [api, narrationLanguage]);

  useEffect(() => {
    if (mapsConfigured && online) {
      load();
    }
  }, [load, mapsConfigured, online]);

  const goList = () => navigation.navigate('Tabs', { screen: 'List' });

  if (!mapsConfigured) {
    return <EmptyView message={t.mapNotConfigured} action={{ label: t.openList, onPress: goList }} />;
  }
  if (online === false) {
    return <EmptyView message={t.mapOffline} action={{ label: t.openList, onPress: goList }} />;
  }
  if (pois === null && !error) {
    return <LoadingView label={t.loading} />;
  }

  const onLocate = async () => {
    const ok = await requestForegroundLocation(t);
    setLocationDenied(!ok);
    if (ok) {
      centeredOnUser.current = false;
      setShowUser(true);
    }
  };

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={CU_CHI}
        showsUserLocation={showUser}
        showsMyLocationButton={false}
        onUserLocationChange={e => {
          const c = e.nativeEvent.coordinate;
          if (c && !centeredOnUser.current) {
            centeredOnUser.current = true;
            mapRef.current?.animateToRegion({ latitude: c.latitude, longitude: c.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
          }
        }}
        onPress={() => setSelected(null)}
      >
        {(pois ?? []).map(p => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.name}
            pinColor={selected?.id === p.id ? colors.terracotta : colors.olive}
            onPress={e => {
              e.stopPropagation?.();
              setSelected(p);
            }}
          />
        ))}
      </MapView>

      <View style={styles.topOverlay} pointerEvents="box-none">
        {error && <Banner kind="error" message={t.networkError} />}
        {locationDenied && <Banner kind="warning" message={t.locationDenied} />}
        {pois && pois.length === 0 && <Banner message={t.noPois} />}
      </View>

      <View style={styles.locate}>
        <AppButton compact variant="secondary" label={`⌖ ${t.locateMe}`} onPress={onLocate} />
        {error && <AppButton compact label={t.retry} onPress={load} />}
      </View>

      {selected && (
        <View style={styles.sheet} accessibilityLabel="POI preview">
          <Text style={font.h2}>{selected.name}</Text>
          <Text style={font.caption}>{selected.code}</Text>
          <AppButton
            label={t.viewDetail}
            onPress={() => navigation.navigate('PoiDetail', { poiId: selected.id, title: selected.name })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topOverlay: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, gap: spacing.sm },
  locate: { position: 'absolute', right: spacing.md, bottom: 200, gap: spacing.sm },
  sheet: {
    position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, backgroundColor: colors.paper,
    borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
});
