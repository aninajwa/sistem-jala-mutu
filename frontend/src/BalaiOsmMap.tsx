import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { validMapPoints, type VerifiedMapPoint } from './mapGeometryValidation';

type SurveyStatus = {
  id: string;
  balai: string;
  tanggal: string;
  status: string;
};

type BalaiOsmMapProps = {
  surveys: SurveyStatus[];
  verifiedPoints?: readonly VerifiedMapPoint[];
};

const controlButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  padding: 0,
  border: '1px solid #b9cbd3',
  borderRadius: 4,
  background: 'rgba(255,255,255,.96)',
  color: '#24475c',
  fontSize: 19,
  fontWeight: 600,
  lineHeight: '28px',
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(29,64,80,.16)',
};

const NO_POINTS: readonly VerifiedMapPoint[] = [];

export function BalaiOsmMap({ surveys, verifiedPoints = NO_POINTS }: BalaiOsmMapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!mapElement.current) return;

    const map = L.map(mapElement.current, {
      attributionControl: false,
      zoomControl: false,
      scrollWheelZoom: false,
      zoomSnap: 0.5,
      minZoom: 3,
      maxZoom: 18,
    });
    mapRef.current = map;

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 3,
      maxZoom: 19,
    });
    tiles.on('tileerror', () => setTileError(true));
    tiles.on('tileload', () => setTileError(false));
    tiles.addTo(map);

    const markers = L.layerGroup().addTo(map);
    markerLayer.current = markers;
    map.fitBounds([[7, 92], [-12, 142]], { padding: [2, 2], maxZoom: 4, animate: false });

    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserver.observe(mapElement.current);
    window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerLayer.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markerLayer.current;
    if (!layer) return;
    layer.clearLayers();

    // Only explicitly sourced coordinates can become markers. Survey records alone have no geometry.
    const points = validMapPoints(verifiedPoints);
    for (const point of points) {
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 6, color: '#135b83', weight: 2, fillOpacity: 0.75,
      });
      // Leaflet text popup is not HTML; never interpolate external labels into HTML.
      marker.bindTooltip(point.label, { direction: 'top' });
      marker.addTo(layer);
    }
    if (points.length && mapRef.current) {
      mapRef.current.fitBounds(L.latLngBounds(points.map(p => [p.latitude, p.longitude] as [number, number])),
        { padding: [24, 24], maxZoom: 12, animate: false });
    }
    void surveys;
  }, [surveys, verifiedPoints]);

  const zoom = (step: number) => mapRef.current?.setZoom((mapRef.current.getZoom() || 4) + step);

  return (
    <div
      style={{ height: 230, borderRadius: 5, overflow: 'hidden', background: '#e7f1f4', position: 'relative' }}
      data-testid="map-layer-openstreetmap"
      aria-label="Peta sebaran QA/QC dengan layer OpenStreetMap"
    >
      <div ref={mapElement} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 500, display: 'grid', gap: 5 }}>
        <button type="button" style={controlButtonStyle} aria-label="Perbesar peta" data-testid="button-map-zoom-in" onClick={event => { event.stopPropagation(); zoom(1); }}>+</button>
        <button type="button" style={controlButtonStyle} aria-label="Perkecil peta" data-testid="button-map-zoom-out" onClick={event => { event.stopPropagation(); zoom(-1); }}>−</button>
      </div>
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        data-testid="link-map-attribution"
        style={{ position: 'absolute', right: 0, bottom: 0, zIndex: 500, padding: '2px 5px', background: 'rgba(255,255,255,.88)', color: '#315b70', fontSize: 9, textDecoration: 'none' }}
      >
        © OpenStreetMap contributors
      </a>
      {tileError && (
        <div role="status" data-testid="status-map-tile-error" style={{ position: 'absolute', left: 8, bottom: 8, zIndex: 500, maxWidth: '70%', padding: '5px 8px', borderRadius: 4, background: 'rgba(255,255,255,.94)', color: '#8e3834', fontSize: 9, boxShadow: '0 1px 4px rgba(29,64,80,.16)' }}>
          Sebagian tile OSM gagal dimuat. Periksa koneksi lalu muat ulang peta.
        </div>
      )}
    </div>
  );
}
