import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type SurveyStatus = {
  id: string;
  balai: string;
  tanggal: string;
  status: string;
};

type BalaiOsmMapProps = {
  surveys: SurveyStatus[];
};

const regions = [
  { id: 'sumatera-utara', name: 'Sumatera Utara', balai: 'Balai Sumatera Utara', lat: 3.5952, lon: 98.6722 },
  { id: 'jawa-barat', name: 'Jawa Barat', balai: 'Balai Jawa Barat', lat: -6.9175, lon: 107.6191 },
  { id: 'kalimantan-timur', name: 'Kalimantan Timur', balai: 'Balai Kalimantan Timur', lat: -0.5022, lon: 117.1536 },
  { id: 'sulawesi-selatan', name: 'Sulawesi Selatan', balai: 'Balai Sulawesi Selatan', lat: -5.1477, lon: 119.4327 },
  { id: 'nusa-tenggara', name: 'Nusa Tenggara', balai: 'Balai Nusa Tenggara', lat: -8.5833, lon: 116.1167 },
];

function markerColor(status?: string) {
  if (status === 'Lulus') return '#16a17a';
  if (status === 'Verifikasi') return '#e6a72e';
  if (status === 'Perlu Perbaikan') return '#d95450';
  return '#8299a6';
}

function latestSurvey(surveys: SurveyStatus[], balai: string) {
  return surveys
    .filter(survey => survey.balai === balai)
    .reduce<SurveyStatus | undefined>(
      (latest, survey) => !latest || survey.tanggal > latest.tanggal ? survey : latest,
      undefined,
    );
}

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

export function BalaiOsmMap({ surveys }: BalaiOsmMapProps) {
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

    for (const region of regions) {
      const survey = latestSurvey(surveys, region.balai);
      const status = survey?.status || 'Tidak ada data';
      const marker = L.circleMarker([region.lat, region.lon], {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: markerColor(survey?.status),
        fillOpacity: 1,
      });
      marker.bindTooltip(region.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -5],
        opacity: 0.96,
      });
      marker.bindPopup(() => {
        const content = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = region.name;
        const detail = document.createElement('div');
        detail.textContent = survey ? `${status} · ${survey.id} · ${survey.tanggal}` : 'Tidak ada survei pada filter ini';
        content.append(title, detail);
        return content;
      });
      layer.addLayer(marker);
    }
  }, [surveys]);

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
