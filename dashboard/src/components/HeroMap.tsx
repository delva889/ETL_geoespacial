import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { Pause, Play } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Centroides tomados del propio data.geojson del proyecto.
const LAMINAS = [
  { nombre: 'Almendra', cuenca: 'Duero', lat: 41.2187, lng: -6.1782 },
  { nombre: 'Mequinenza', cuenca: 'Ebro', lat: 41.3379, lng: -0.0397 },
  { nombre: 'Buendía', cuenca: 'Tajo', lat: 40.3699, lng: -2.6006 },
  { nombre: 'Orellana', cuenca: 'Guadiana', lat: 39.0471, lng: -5.396 },
  { nombre: 'Valdecañas', cuenca: 'Tajo', lat: 39.8196, lng: -5.4322 },
  { nombre: 'Iznájar', cuenca: 'Guadalquivir', lat: 37.2689, lng: -4.2921 },
];

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const gms = (v: number, pos: string, neg: string) => {
  const a = Math.abs(v);
  const g = Math.floor(a);
  const m = Math.floor((a - g) * 60);
  const s = Math.round(((a - g) * 60 - m) * 60);
  return `${g}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″ ${v < 0 ? neg : pos}`;
};

/** Lámina satelital enmarcada como una hoja cartográfica, que recorre grandes embalses. */
export default function HeroMap() {
  const mapRef = useRef<LeafletMap | null>(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReduced());
  const l = LAMINAS[i];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setI((n) => (n + 1) % LAMINAS.length), 9000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    mapRef.current?.flyTo([l.lat, l.lng], 12, { duration: prefersReduced() ? 0 : 3.5 });
  }, [l]);

  return (
    <figure className="m-0">
      {/* Margen superior de la hoja */}
      <div className="flex items-end justify-between gap-4 pb-2 border-b border-ink">
        <p className="font-serif text-xl sm:text-2xl leading-none">
          Embalse de {l.nombre}
          <span className="text-muted">, cuenca del {l.cuenca}</span>
        </p>
        <p className="margin-note hidden sm:block shrink-0">Lámina {i + 1} de {LAMINAS.length}</p>
      </div>

      <div className="relative plate-ticks p-[6px]">
        <div className="relative aspect-[16/10] sm:aspect-[21/9] bg-paper-2 overflow-hidden" aria-hidden="true">
          <MapContainer
            center={[l.lat, l.lng]}
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
          {/* Retícula central fina, como la cruz de una lámina */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-paper/40" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-paper/40" />
          </div>
        </div>
      </div>

      {/* Margen inferior: coordenadas, fuente y control de pausa */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-2 border-t border-ink">
        <p className="num text-[12px] text-ink-2">
          {gms(l.lat, 'N', 'S')}&ensp;{gms(l.lng, 'E', 'W')}
        </p>
        <div className="flex items-center gap-4">
          <p className="margin-note">Imagen Esri World Imagery</p>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pausar recorrido por embalses' : 'Reanudar recorrido por embalses'}
            className="w-11 h-11 -my-2 flex items-center justify-center border border-transparent hover:border-ink transition-colors duration-200"
          >
            {playing ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
          </button>
        </div>
      </div>
    </figure>
  );
}
