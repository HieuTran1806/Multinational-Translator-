import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useT } from '../../i18n/LanguageContext.jsx';

/** Centered on the demo area; re-fit to the actual markers as soon as they load. */
const INITIAL_VIEW = { center: [11.13, 106.48], zoom: 12 };
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const PIN_SVG =
  '<svg viewBox="0 0 32 40" width="28" height="36" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M16 1C8.8 1 3 6.8 3 14c0 9.5 13 25 13 25s13-15.5 13-25C29 6.8 23.2 1 16 1z" ' +
  'fill="#4f5d3a" stroke="#fff9ee" stroke-width="1.5"/><circle cx="16" cy="14" r="5.5" fill="#fff9ee"/></svg>';

const pinIcon = () =>
  L.divIcon({
    className: 'tm-marker',
    html: PIN_SVG,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30],
  });

function popupNode(poi, onOpen, detailsLabel) {
  const div = document.createElement('div');
  div.className = 'tm-popup';
  div.innerHTML =
    `<strong class="tm-popup-name">${escapeHtml(poi.name)}</strong>` +
    (poi.category ? `<div class="tm-popup-meta">${escapeHtml(poi.category)}</div>` : '') +
    `<button type="button" class="tm-popup-btn">${escapeHtml(detailsLabel)}</button>`;
  div.querySelector('button').addEventListener('click', () => onOpen?.(poi));
  return div;
}

/**
 * UC03 interactive map: OpenStreetMap tiles, one marker per POI, clustered when zoomed out
 * (A2 — zooming into a cluster/spiderfy lets the visitor pick a specific POI), a locate-me control
 * (A1 — denial keeps the map usable) and tile-failure detection with retry (E1).
 */
export default function PoiMap({ pois, onOpen }) {
  const t = useT();
  const tRef = useRef(t);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const onOpenRef = useRef(onOpen);
  const locateLayerRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const [mapNonce, setMapNonce] = useState(0);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoNotice, setGeoNotice] = useState(null);

  useEffect(() => {
    onOpenRef.current = onOpen;
    tRef.current = t;
  }, [onOpen, t]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const map = L.map(container, { ...INITIAL_VIEW, zoomControl: true, attributionControl: true });
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: ATTRIBUTION });

    let failures = 0;
    tiles.on('tileload', () => {
      failures = 0;
      setTilesFailed(false);
    });
    tiles.on('tileerror', () => {
      failures += 1;
      if (failures >= 3) setTilesFailed(true); // E1: map tile service unreachable
    });
    tiles.addTo(map);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      disableClusteringAtZoom: 16,
      showCoverageOnHover: false,
    });
    cluster.addTo(map);

    mapRef.current = map;
    clusterRef.current = cluster;

    // Leaflet needs a nudge when its container appears/changes size (mobile layout switches).
    const resize = () => map.invalidateSize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      map.stop();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      locateLayerRef.current = null;
    };
  }, [mapNonce]);

  useEffect(() => {
    const cluster = clusterRef.current;
    const map = mapRef.current;
    if (!cluster || !map) return;

    cluster.clearLayers();
    for (const poi of pois) {
      const marker = L.marker([poi.latitude, poi.longitude], { title: poi.name, icon: pinIcon() });
      marker.bindPopup(() => popupNode(poi, (p) => onOpenRef.current?.(p), tRef.current('map.details')), { closeButton: false, minWidth: 180 });
      cluster.addLayer(marker);
    }
    if (pois.length > 0) {
      const bounds = L.latLngBounds(pois.map((p) => [p.latitude, p.longitude])).pad(0.25);
      lastBoundsRef.current = bounds;
      map.fitBounds(bounds, { maxZoom: 16 });
    } else {
      lastBoundsRef.current = null;
    }
  }, [pois]);

  /** Back to the demo/POI area after panning away or locating yourself somewhere else. */
  const fitToPois = () => {
    if (lastBoundsRef.current && mapRef.current) mapRef.current.fitBounds(lastBoundsRef.current);
  };

  const locate = () => {
    const map = mapRef.current;
    if (!map) return;
    setGeoNotice(null);
    if (!navigator.geolocation) {
      setGeoNotice(t('map.geoUnsupported'));
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latlng = [coords.latitude, coords.longitude];
        if (locateLayerRef.current) map.removeLayer(locateLayerRef.current);
        locateLayerRef.current = L.layerGroup([
          L.circleMarker(latlng, { radius: 7, color: '#fff9ee', weight: 3, fillColor: '#a65f3b', fillOpacity: 1 }),
          L.circle(latlng, { radius: Math.max(coords.accuracy ?? 50, 30), color: '#a65f3b', weight: 1, fillOpacity: 0.1 }),
        ]).addTo(map);
        map.setView(latlng, Math.max(map.getZoom(), 15));
        setGeoBusy(false);
      },
      () => {
        // A1 — permission denied or unavailable: keep exploring from the current/default center.
        setGeoBusy(false);
        setGeoNotice(t('map.geoFailed'));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  };

  const retryMap = () => {
    setTilesFailed(false);
    setMapNonce((n) => n + 1);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label={t('map.aria')} />

      <div className="absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={locate}
          disabled={geoBusy}
          className="inline-flex items-center gap-2 rounded-lg border border-stone/30 bg-white px-3 py-2 text-sm font-semibold text-charcoal shadow hover:bg-sand/60 disabled:opacity-60"
        >
          {geoBusy ? t('map.locating') : t('map.myLocation')}
        </button>
        {pois.length > 0 && (
          <button
            type="button"
            onClick={fitToPois}
            className="inline-flex items-center gap-2 rounded-lg border border-olive/40 bg-white px-3 py-2 text-sm font-semibold text-olive shadow hover:bg-sand/60"
          >
            {t('map.backToPois')}
          </button>
        )}
      </div>

      {geoNotice && (
        <div
          role="status"
          className="absolute bottom-3 left-3 z-[1000] max-w-xs rounded-lg border border-stone/30 bg-white px-3 py-2 text-xs text-charcoal shadow"
        >
          {geoNotice}
        </div>
      )}

      {tilesFailed && (
        <div
          role="alert"
          className="absolute inset-x-3 top-3 z-[1000] flex items-center justify-between gap-3 rounded-lg border border-danger/40 bg-white px-3 py-2 text-sm text-danger shadow"
        >
          <span>{t('map.tilesFailed')}</span>
          <button
            type="button"
            onClick={retryMap}
            className="shrink-0 rounded-md bg-danger px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
          >
            {t('map.reload')}
          </button>
        </div>
      )}
    </div>
  );
}
