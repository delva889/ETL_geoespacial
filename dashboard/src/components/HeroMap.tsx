import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { Pause, Play } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const RECORRIDO = [
  { nombre: 'La Serena', cuenca: 'Guadiana', lat: 38.87, lng: -5.149 },
  { nombre: 'Almendra', cuenca: 'Duero', lat: 41.2187, lng: -6.1782 },
  { nombre: 'Mequinenza', cuenca: 'Ebro', lat: 41.3379, lng: -0.0397 },
  { nombre: 'Buendía', cuenca: 'Tajo', lat: 40.3699, lng: -2.6006 },
  { nombre: 'Iznájar', cuenca: 'Guadalquivir', lat: 37.2689, lng: -4.2921 },
  { nombre: 'Valdecañas', cuenca: 'Tajo', lat: 39.8196, lng: -5.4322 },
];

const desplazamiento = () => (typeof window !== 'undefined' && window.innerWidth > 1024 ? 0.12 : 0);

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function HeroMap() {
  const mapRef = useRef<LeafletMap | null>(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReduced());
  const l = RECORRIDO[i];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setI((n) => (n + 1) % RECORRIDO.length), 8000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    mapRef.current?.flyTo([l.lat, l.lng - desplazamiento()], 12, { duration: prefersReduced() ? 0 : 3.5 });
  }, [l]);

  const center: [number, number] = [l.lat, l.lng - desplazamiento()];

  return (
    <>
      <div className="absolute inset-0" aria-hidden="true">
        <MapContainer
          center={center}
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
          style={{ height: '100%', width: '100%', background: '#070a10' }}
        >
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        </MapContainer>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,16,0.88)_0%,rgba(7,10,16,0.55)_45%,rgba(7,10,16,0.1)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgba(7,10,16,0.85),transparent)]" />
      </div>

      <div className="order-last relative mx-5 mb-8 sm:mx-0 sm:mb-0 sm:absolute sm:right-8 sm:bottom-8 z-10 sm:w-[320px] rounded-2xl bg-night/60 backdrop-blur-md border border-white/15 text-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-white/60">Embalse en pantalla</p>
            <p className="text-[18px] font-semibold tracking-tight truncate" aria-live="polite">{l.nombre}</p>
            <p className="text-[13px] text-white/70">Cuenca del {l.cuenca}</p>
          </div>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pausar el recorrido por embalses' : 'Reanudar el recorrido por embalses'}
            className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="num text-[12px] text-white/70">
            {l.lat.toFixed(3)}° N  {Math.abs(l.lng).toFixed(3)}° {l.lng < 0 ? 'W' : 'E'}
          </p>
          <div className="flex gap-1.5" aria-hidden="true">
            {RECORRIDO.map((r, k) => (
              <span key={r.nombre} className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? 'w-5 bg-white' : 'w-1.5 bg-white/35'}`} />
            ))}
          </div>
        </div>
      </div>
      <p className="hidden sm:block absolute left-8 bottom-3 z-10 text-[10px] text-white/45">Imagen: Esri World Imagery</p>
    </>
  );
}
