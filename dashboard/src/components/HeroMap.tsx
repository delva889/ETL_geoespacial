import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Centroides tomados del propio data.geojson del proyecto.
const OBJETIVOS = [
  { nombre: 'Almendra', cuenca: 'Duero', lat: 41.2187, lng: -6.1782 },
  { nombre: 'Mequinenza', cuenca: 'Ebro', lat: 41.3379, lng: -0.0397 },
  { nombre: 'Buendía', cuenca: 'Tajo', lat: 40.3699, lng: -2.6006 },
  { nombre: 'Orellana', cuenca: 'Guadiana', lat: 39.0471, lng: -5.396 },
  { nombre: 'Valdecañas', cuenca: 'Tajo', lat: 39.8196, lng: -5.4322 },
  { nombre: 'Iznájar', cuenca: 'Guadalquivir', lat: 37.2689, lng: -4.2921 },
];

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function HeroMap() {
  const mapRef = useRef<LeafletMap | null>(null);
  const [i, setI] = useState(0);
  const t = OBJETIVOS[i];

  useEffect(() => {
    if (reduceMotion()) return;
    const id = setInterval(() => setI((n) => (n + 1) % OBJETIVOS.length), 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([t.lat, t.lng], 12, { duration: reduceMotion() ? 0 : 3.2 });
  }, [t]);

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[t.lat, t.lng]}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        boxZoom={false}
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
      </MapContainer>

      {/* Capas de lectura */}
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-void/40 pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="scanline h-1/3 w-full" /></div>

      {/* Retícula de objetivo */}
      <div className="hidden lg:block absolute right-[22%] top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 border border-signal/50" />
          <div className="absolute left-1/2 -top-6 h-6 w-px bg-signal/60" />
          <div className="absolute left-1/2 -bottom-6 h-6 w-px bg-signal/60" />
          <div className="absolute top-1/2 -left-6 w-6 h-px bg-signal/60" />
          <div className="absolute top-1/2 -right-6 w-6 h-px bg-signal/60" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-signal" />
        </div>
      </div>

      {/* HUD */}
      <div className="hidden sm:block absolute right-4 lg:right-8 bottom-24 font-data text-[11px] text-fg-soft bg-void/80 border border-line px-4 py-3 min-w-[230px]">
        <div className="flex items-center gap-2 text-signal mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-signal live-dot" /> OBJETIVO {String(i + 1).padStart(2, '0')}/{String(OBJETIVOS.length).padStart(2, '0')}
        </div>
        <div className="font-display text-base text-fg font-semibold">Embalse de {t.nombre}</div>
        <div className="text-muted">Cuenca del {t.cuenca}</div>
        <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3">
          <span className="text-muted">LAT</span><span>{t.lat.toFixed(4)}° N</span>
          <span className="text-muted">LON</span><span>{Math.abs(t.lng).toFixed(4)}° {t.lng < 0 ? 'W' : 'E'}</span>
        </div>
      </div>
      <div className="absolute right-2 bottom-2 font-data text-[9px] text-muted/80">
        Imagen: Esri World Imagery
      </div>
    </div>
  );
}
