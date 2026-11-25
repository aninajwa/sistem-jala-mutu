import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Plus, Minus, MapPin } from "lucide-react";
import indonesia from "./indonesia-natural-earth.json";
import {
  scopedBalaiLocations,
  unavailableGeography,
  type BalaiGeographyAdapter,
  type BalaiLocation,
} from "./adapter";
export function DirectorateMap({
  balais,
  selected,
  onSelect,
  adapter = unavailableGeography,
}: {
  balais: readonly { name: string; packages: number }[];
  selected: string;
  onSelect: (balai: string) => void;
  adapter?: BalaiGeographyAdapter;
}) {
  const target = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    layer = useRef<L.LayerGroup | null>(null),
    country = useRef<L.GeoJSON | null>(null),
    streets = useRef<L.TileLayer | null>(null),
    callback = useRef(onSelect);
  callback.current = onSelect;
  const [locations, setLocations] = useState<BalaiLocation[]>([]),
    [state, setState] = useState<"unavailable" | "loading" | "ready" | "error">(
      "unavailable",
    ),
    [tiles, setTiles] = useState(false),
    [tileError, setTileError] = useState(false);
  const names = balais
    .map((b) => b.name)
    .sort()
    .join("|");
  useEffect(() => {
    if (!adapter.available) {
      setState("unavailable");
      setLocations([]);
      return;
    }
    const abort = new AbortController();
    setState("loading");
    adapter.load(abort.signal).then(
      (values) => {
        if (abort.signal.aborted) return;
        setLocations(scopedBalaiLocations(values, new Set(names.split("|"))));
        setState("ready");
      },
      () => {
        if (!abort.signal.aborted) {
          setLocations([]);
          setState("error");
        }
      },
    );
    return () => abort.abort();
  }, [adapter, names]);
  useEffect(() => {
    if (!target.current) return;
    const view = L.map(target.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      minZoom: 3,
      maxZoom: 16,
    });
    map.current = view;
    view.fitBounds(
      [
        [-11.5, 94],
        [6, 141],
      ],
      { padding: [12, 12], animate: false },
    );
    country.current = L.geoJSON(indonesia as never, {
      style: {
        color: "#438d9a",
        weight: 1.2,
        fillColor: "#d2e8e5",
        fillOpacity: 1,
      },
      interactive: false,
    }).addTo(view);
    layer.current = L.layerGroup().addTo(view);
    const resize = new ResizeObserver(() =>
      view.invalidateSize({ pan: false }),
    );
    resize.observe(target.current);
    return () => {
      resize.disconnect();
      view.remove();
      map.current = null;
      layer.current = null;
      streets.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    for (const location of locations) {
      const point = L.circleMarker([location.latitude, location.longitude], {
        radius: selected === location.balai ? 8 : 6,
        color: "#0d697d",
        fillColor: "#148e98",
        fillOpacity: 0.85,
        weight: 2,
      });
      const label = document.createElement("span");
      label.textContent = location.label;
      point.bindTooltip(label);
      point.on("click", () => callback.current(location.balai));
      point.addTo(layer.current);
    }
    const focused = locations.filter((p) => p.balai === selected);
    if (focused.length)
      map.current.fitBounds(
        L.latLngBounds(
          focused.map((p) => [p.latitude, p.longitude] as [number, number]),
        ),
        { maxZoom: 11, padding: [30, 30], animate: false },
      );
  }, [locations, selected]);
  useEffect(() => {
    country.current?.setStyle({ fillOpacity: tiles && !tileError ? 0.12 : 1 });
  }, [tiles, tileError]);
  useEffect(() => {
    if (!map.current) return;
    if (tiles) {
      const raster = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 18 },
      );
      raster.on("tileerror", () => setTileError(true));
      raster.addTo(map.current);
      raster.bringToBack();
      streets.current = raster;
    } else if (streets.current) {
      streets.current.remove();
      streets.current = null;
      setTileError(false);
    }
  }, [tiles]);
  return (
    <div className="b-geography" data-testid="directorate-map">
      <div className="b-map-canvas">
        <span className="c-map-caption">
          Indonesia <small>Peta pengawasan</small>
        </span>
        <div
          ref={target}
          className="b-map-leaflet"
          aria-label="Peta dasar Indonesia, bukan warna kepatuhan"
        />
        <div className="b-map-controls">
          <button
            aria-label="Perbesar peta"
            onClick={() => map.current?.zoomIn()}
          >
            <Plus size={17} />
          </button>
          <button
            aria-label="Perkecil peta"
            onClick={() => map.current?.zoomOut()}
          >
            <Minus size={17} />
          </button>
          <button
            aria-label="Tampilkan seluruh Indonesia"
            onClick={() =>
              map.current?.fitBounds(
                [
                  [-11.5, 94],
                  [6, 141],
                ],
                { animate: false },
              )
            }
          >
            <LocateFixed size={17} />
          </button>
        </div>
        <div className="b-map-attribution">
          <a
            href="https://www.naturalearthdata.com/about/terms-of-use/"
            target="_blank"
            rel="noreferrer"
          >
            Natural Earth · dasar geografis
          </a>
          {tiles && (
            <>
              {" "}
              ·{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
              >
                © OpenStreetMap
              </a>
            </>
          )}
        </div>
      </div>
      <div className="b-map-state" role="status">
        <MapPin size={16} />
        <span>
          {state === "loading"
            ? "Memuat lokasi bersumber…"
            : state === "error"
              ? "Lokasi belum dapat dimuat. Peta dasar tetap tersedia."
              : locations.length
                ? `${locations.length} lokasi dengan referensi sumber`
                : "Lokasi Balai belum tersedia. Pilih Balai untuk melihat ringkasan paket."}
        </span>
      </div>
      {tileError && (
        <p role="status" className="b-map-warning">
          Tile jalan belum dapat dimuat. Batas Indonesia tetap tersedia secara
          lokal.
        </p>
      )}
      <div className="b-map-selection">
        <label>
          Balai pada peta / cakupan
          <select
            aria-label="Pilih Balai pada peta"
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="Semua Balai">Semua Balai</option>
            {balais.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name} · {b.packages} paket
              </option>
            ))}
          </select>
        </label>
      </div>
      <details className="c-map-options">
        <summary>Opsi dan sumber peta</summary>
        <div className="c-map-options-body">
          {" "}
          <label className="b-map-layer">
            <input
              type="checkbox"
              checked={tiles}
              onChange={(e) => setTiles(e.target.checked)}
            />
            Peta jalan OSM
          </label>
          <section className="c-map-shortcuts">
            <h3>Pintasan Balai</h3>
            <div
              className="b-map-balai-buttons"
              aria-label="Pilih wilayah pengawasan"
            >
              {balais.map((b) => (
                <button
                  key={b.name}
                  aria-pressed={selected === b.name}
                  onClick={() => onSelect(b.name)}
                >
                  {b.name}
                  <span>{b.packages} paket</span>
                </button>
              ))}
            </div>
          </section>
          <section className="c-map-source">
            <h3>Sumber peta</h3>
            <p>
              Peta dasar Natural Earth 1:110m v5.1.2 (Public Domain), bukan
              batas administratif operasional atau indikator kelulusan. Pilihan
              Balai mengikuti paket dalam akses. Lokasi hanya tampil dengan
              koordinat dan referensi sumber yang sah; data lokasi Balai belum
              tersedia.
            </p>
          </section>
        </div>
      </details>
    </div>
  );
}
