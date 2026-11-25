import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, GeoJSON, Tooltip, ScaleControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Search, X, Plus, Minus, LocateFixed } from 'lucide-react';
import {
  loadEmbalses, loadCaudales, useLastUpdate, normalizar, estadoDe, ESTADOS, fmt, copernicusBrowserUrl,
  type Embalse, type CaudalEntry, type EmbalseFeature, type Estado,
} from '../lib/data';

const BASEMAPS = {
  satelite: {
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagen © Esri, Maxar, Earthstar Geographics',
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  },
  relieve: {
    label: 'Relieve',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri y colaboradores',
  },
  claro: {
    label: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap · © CARTO',
  },
} as const;
type BasemapKey = keyof typeof BASEMAPS;

const POLY_ZOOM = 9;
const initialZoom = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? 5 : 6);
const AXIS = { fontSize: 12, fill: '#3c3a35', fontFamily: "'JetBrains Mono', monospace" };
const TOOLTIP_STYLE = { backgroundColor: '#111110', border: 0, borderRadius: 0, fontSize: 12, color: '#f5f4ef' };
const fechaCorta = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

function MapEvents({ onZoom, onMove }: { onZoom: (z: number) => void; onMove: (ll: [number, number] | null) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
    mousemove: (e) => onMove([e.latlng.lat, e.latlng.lng]),
    mouseout: () => onMove(null),
  });
  return null;
}

export default function Visor() {
  const info = useLastUpdate();
  const [embalses, setEmbalses] = useState<Embalse[] | null>(null);
  const [error, setError] = useState(false);
  const [caudales, setCaudales] = useState<CaudalEntry[]>([]);
  const [cuenca, setCuenca] = useState('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [basemap, setBasemap] = useState<BasemapKey>('satelite');
  const [zoom, setZoom] = useState(initialZoom);
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showCaudales, setShowCaudales] = useState(false);

  const mapRef = useRef<LeafletMap | null>(null);
  const geoRef = useRef<LeafletGeoJSON | null>(null);
  const mapBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadEmbalses()
      .then((g) => setEmbalses(g.features.map(normalizar)))
      .catch(() => setError(true));
    loadCaudales().then(setCaudales).catch(() => setCaudales([]));
  }, []);

  const byFeature = useMemo(() => {
    const m = new WeakMap<object, Embalse>();
    embalses?.forEach((e) => m.set(e.feature, e));
    return m;
  }, [embalses]);

  const cuencas = useMemo(
    () => ['Todas', ...Array.from(new Set((embalses ?? []).map((e) => e.cuenca))).sort((a, b) => a.localeCompare(b, 'es'))],
    [embalses],
  );

  const visibles = useMemo(
    () => (embalses ?? []).filter((e) => cuenca === 'Todas' || e.cuenca === cuenca),
    [embalses, cuenca],
  );

  const selected = useMemo(() => embalses?.find((e) => e.id === selectedId) ?? null, [embalses, selectedId]);

  const stats = useMemo(() => {
    const conDatos = visibles.filter((e) => e.pct !== null);
    const cap = conDatos.reduce((s, e) => s + e.capacidad, 0);
    const emb = conDatos.reduce((s, e) => s + (e.embalsada ?? 0), 0);
    const conteo: Record<Estado, number> = { excelente: 0, optimo: 0, alerta: 0, critico: 0, nodata: 0 };
    visibles.forEach((e) => conteo[estadoDe(e.pct)]++);
    return {
      cap, emb,
      pct: cap > 0 ? (emb / cap) * 100 : 0,
      variacion: conDatos.reduce((s, e) => s + e.variacion, 0),
      gwh: visibles.reduce((s, e) => s + e.mwh, 0) / 1000,
      valor: visibles.reduce((s, e) => s + e.valor, 0) / 1e6,
      conteo,
      top: [...visibles].filter((e) => e.mwh > 0).sort((a, b) => b.mwh - a.mwh).slice(0, 10),
    };
  }, [visibles]);

  const porCuenca = useMemo(() => {
    const acc: Record<string, { name: string; cap: number; emb: number; variacion: number }> = {};
    (embalses ?? []).forEach((e) => {
      if (e.pct === null) return;
      acc[e.cuenca] ??= { name: e.cuenca, cap: 0, emb: 0, variacion: 0 };
      acc[e.cuenca].cap += e.capacidad;
      acc[e.cuenca].emb += e.embalsada ?? 0;
      acc[e.cuenca].variacion += e.variacion;
    });
    return Object.values(acc)
      .map((c) => ({ ...c, pct: c.cap ? +((c.emb / c.cap) * 100).toFixed(1) : 0, variacion: +c.variacion.toFixed(1) }))
      .sort((a, b) => b.pct - a.pct);
  }, [embalses]);

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !embalses) return [];
    return embalses
      .filter((e) => e.nombre.toLowerCase().includes(q))
      .sort((a, b) => (b.pct !== null ? 1 : 0) - (a.pct !== null ? 1 : 0) || b.capacidad - a.capacidad)
      .slice(0, 8);
  }, [query, embalses]);

  const select = useCallback((e: Embalse, fly = true) => {
    setSelectedId(e.id);
    setQuery('');
    setSearchOpen(false);
    const map = mapRef.current;
    if (!map || !fly) return;
    if (window.innerWidth < 1024) mapBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const bounds = L.geoJSON(e.feature as unknown as GeoJSON.Feature).getBounds();
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 13, duration: 1.4 });
    else if (e.center) map.flyTo(e.center, 12, { duration: 1.4 });
  }, []);

  const resetView = () => {
    setSelectedId(null);
    mapRef.current?.flyTo([39.6, -3.6], initialZoom(), { duration: 1 });
  };

  useEffect(() => {
    if (cuenca === 'Todas' || !mapRef.current || visibles.length === 0) return;
    const b = L.latLngBounds(visibles.filter((e) => e.center).map((e) => e.center!));
    if (b.isValid()) mapRef.current.flyToBounds(b, { padding: [40, 40], maxZoom: 9, duration: 1 });
  }, [cuenca, visibles]);

  useEffect(() => {
    if (!showCaudales) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowCaudales(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCaudales]);

  const polyStyle = useCallback(
    (f?: GeoJSON.Feature): PathOptions => {
      const e = f ? byFeature.get(f as unknown as EmbalseFeature) : undefined;
      const color = ESTADOS[estadoDe(e?.pct ?? null)].color;
      const isSel = e?.id === selectedId;
      return {
        fillColor: color,
        fillOpacity: isSel ? 0.75 : 0.5,
        color: isSel ? '#ffffff' : color,
        weight: isSel ? 2.5 : 1.2,
        opacity: 1,
      };
    },
    [byFeature, selectedId],
  );

  useEffect(() => {
    geoRef.current?.setStyle(polyStyle as (f?: GeoJSON.Feature) => PathOptions);
  }, [polyStyle]);

  const featureCollection = useMemo(
    () => ({ type: 'FeatureCollection', features: visibles.map((e) => e.feature) }) as unknown as GeoJSON.FeatureCollection,
    [visibles],
  );

  const bm = BASEMAPS[basemap];

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-16 text-ink-2">
        No se han podido cargar los datos. Recarga la página; si persiste, el fichero data.geojson no está publicado.
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1360px] mx-auto px-5 sm:px-8 pt-12 pb-24 flex flex-col gap-10">
      {/* Cabecera */}
      <div className="grid md:grid-cols-12 gap-x-8 gap-y-4 items-end">
        <h1 className="md:col-span-8 text-[48px] sm:text-[72px] leading-[0.92] tracking-[-0.02em]">
          Estado de los embalses de España
        </h1>
        {info?.timestamp && (
          <p className="md:col-span-4 text-[15px] text-ink-2 md:text-right">
            Datos del {fechaCorta(info.timestamp)}.<br className="hidden md:block" /> Se actualizan cada lunes.
          </p>
        )}
      </div>

      {/* Cifras */}
      <dl className="grid grid-cols-2 lg:grid-cols-5 border-y border-ink">
        <Cifra label="Llenado medio" nota={cuenca === 'Todas' ? 'España' : cuenca}>
          <span style={{ color: ESTADOS[estadoDe(stats.pct)].color }}>{embalses ? fmt(stats.pct, 1) : '–'}</span>
          <Unidad>%</Unidad>
        </Cifra>
        <Cifra label="Agua embalsada" nota={`de ${fmt(stats.cap)} hm³ de capacidad`} border>
          {embalses ? fmt(stats.emb) : '–'}<Unidad>hm³</Unidad>
        </Cifra>
        <Cifra label="Cambio semanal" nota="embalses con lectura" borderLg>
          <span className={stats.variacion < 0 ? 'text-st-critico' : 'text-cobalt'}>
            {embalses ? `${stats.variacion > 0 ? '+' : ''}${fmt(stats.variacion, 1)}` : '–'}
          </span>
          <Unidad>hm³</Unidad>
        </Cifra>
        <Cifra label="Energía almacenada" nota="estimación" border>
          {embalses ? fmt(stats.gwh, 1) : '–'}<Unidad>GWh</Unidad>
        </Cifra>
        <Cifra label="Valor orientativo" nota="a precio OMIE" borderLg className="col-span-2 lg:col-span-1 border-t lg:border-t-0 border-rule">
          {embalses ? fmt(stats.valor, 1) : '–'}<Unidad>M€</Unidad>
        </Cifra>
      </dl>

      {/* Mapa y ficha */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="flex flex-col min-w-0">
          {/* Controles sobre el mapa, fuera de la imagen */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 pb-3">
            <div className="relative sm:w-80">
              <label htmlFor="buscar" className="margin-note block mb-1.5">Buscar embalse</label>
              <div className="flex items-center border border-ink bg-paper focus-within:outline focus-within:outline-2 focus-within:outline-cobalt">
                <Search size={16} strokeWidth={1.5} className="ml-3 shrink-0 text-ink-2" aria-hidden="true" />
                <input
                  id="buscar"
                  name="buscar"
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(ev) => { setQuery(ev.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter' && resultados[0]) select(resultados[0]); }}
                  placeholder="Almendra, Mequinenza…"
                  className="w-full bg-transparent px-2.5 h-11 text-[15px] outline-none placeholder:text-muted"
                />
              </div>
              {searchOpen && resultados.length > 0 && (
                <ul className="absolute z-[700] mt-px w-full bg-paper border border-ink max-h-72 overflow-auto">
                  {resultados.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => select(r)}
                        className="w-full text-left px-3 py-2.5 hover:bg-ink hover:text-paper flex items-center gap-2.5 transition-colors duration-200"
                      >
                        <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: ESTADOS[estadoDe(r.pct)].color }} aria-hidden="true" />
                        <span className="text-[15px] truncate">{r.nombre}</span>
                        <span className="text-[12px] opacity-70 ml-auto shrink-0">{r.cuenca}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sm:w-52">
              <label htmlFor="cuenca" className="margin-note block mb-1.5">Cuenca</label>
              <select
                id="cuenca"
                value={cuenca}
                onChange={(ev) => { setCuenca(ev.target.value); setSelectedId(null); }}
                className="w-full h-[46px] border border-ink px-3 text-[15px] outline-none focus-visible:outline-2 focus-visible:outline-cobalt"
              >
                {cuencas.map((c) => <option key={c} value={c}>{c === 'Todas' ? 'Todas las cuencas' : c}</option>)}
              </select>
            </div>

            <fieldset className="sm:ml-auto">
              <legend className="margin-note mb-1.5">Mapa base</legend>
              <div className="flex border border-ink">
                {(Object.keys(BASEMAPS) as BasemapKey[]).map((k, i) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={basemap === k}
                    onClick={() => setBasemap(k)}
                    className={`h-11 px-4 text-[14px] transition-colors duration-200 ${i > 0 ? 'border-l border-ink' : ''} ${
                      basemap === k ? 'bg-ink text-paper' : 'hover:bg-paper-2'
                    }`}
                  >
                    {BASEMAPS[k].label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div ref={mapBoxRef} className="relative border border-ink h-[62vh] min-h-[460px] lg:h-[70vh] lg:min-h-[600px] scroll-mt-20 overflow-hidden">
            <MapContainer
              center={[39.6, -3.6]}
              zoom={initialZoom()}
              minZoom={4}
              maxZoom={17}
              preferCanvas
              zoomControl={false}
              ref={mapRef}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer key={basemap} url={bm.url} attribution={bm.attribution} maxZoom={19} />
              {basemap === 'satelite' && <TileLayer key="labels" url={BASEMAPS.satelite.labels} opacity={0.7} />}
              <ScaleControl position="bottomleft" imperial={false} />
              <MapEvents onZoom={setZoom} onMove={setCursor} />

              {zoom >= POLY_ZOOM ? (
                <GeoJSON
                  key={`poly-${cuenca}-${visibles.length}`}
                  ref={geoRef}
                  data={featureCollection}
                  style={polyStyle}
                  onEachFeature={(f, layer) => {
                    const e = byFeature.get(f as unknown as EmbalseFeature);
                    if (!e) return;
                    layer.bindTooltip(
                      `${e.nombre}  ${e.pct !== null ? `${fmt(e.pct, 1)} %` : 'sin lectura'}`,
                      { className: 'embalse-tip', sticky: true },
                    );
                    layer.on('click', () => select(e, false));
                  }}
                />
              ) : (
                visibles.map((e) => {
                  if (!e.center) return null;
                  const estado = estadoDe(e.pct);
                  const isSel = e.id === selectedId;
                  const radius = estado === 'nodata' ? 3 : Math.max(4, Math.sqrt(e.capacidad) * 0.36);
                  return (
                    <CircleMarker
                      key={e.id}
                      center={e.center}
                      radius={isSel ? radius + 3 : radius}
                      pathOptions={{
                        fillColor: ESTADOS[estado].color,
                        fillOpacity: estado === 'nodata' ? 0.6 : 0.9,
                        color: isSel ? '#111110' : '#ffffff',
                        weight: isSel ? 2.5 : 1,
                      }}
                      eventHandlers={{ click: () => select(e) }}
                    >
                      <Tooltip className="embalse-tip" direction="top" offset={[0, -radius]}>
                        {e.nombre}  {e.pct !== null ? `${fmt(e.pct, 1)} %` : 'sin lectura'}
                      </Tooltip>
                    </CircleMarker>
                  );
                })
              )}
            </MapContainer>

            {/* Zoom */}
            <div className="absolute right-3 top-3 z-[500] flex flex-col border border-ink bg-paper">
              <MapBtn label="Acercar" onClick={() => mapRef.current?.zoomIn()}><Plus size={16} strokeWidth={1.5} /></MapBtn>
              <MapBtn label="Alejar" onClick={() => mapRef.current?.zoomOut()}><Minus size={16} strokeWidth={1.5} /></MapBtn>
              <MapBtn label="Ver toda España" onClick={resetView}><LocateFixed size={16} strokeWidth={1.5} /></MapBtn>
            </div>

            {/* Coordenadas */}
            <p className="hidden sm:block absolute right-3 bottom-6 z-[500] num text-[11px] bg-paper border border-ink px-2 py-1">
              {cursor ? `${cursor[0].toFixed(4)}° N  ${Math.abs(cursor[1]).toFixed(4)}° ${cursor[1] < 0 ? 'W' : 'E'}` : 'EPSG:4326'}
              <span className="text-muted">  z{zoom}</span>
            </p>

            {!embalses && (
              <div className="absolute inset-0 z-[600] flex items-center justify-center bg-paper/80" aria-live="polite">
                <p className="text-ink-2">Cargando 805 embalses…</p>
              </div>
            )}
          </div>

          {/* Leyenda, bajo el mapa como en una hoja */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-[13px] text-ink-2">
            <span className="margin-note">Llenado</span>
            {(Object.keys(ESTADOS) as Estado[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-2">
                <span className="w-3 h-3 shrink-0" style={{ backgroundColor: ESTADOS[k].color }} aria-hidden="true" />
                {ESTADOS[k].label}
                {k !== 'nodata' && <span className="text-muted">{ESTADOS[k].rango}</span>}
                <span className="num text-[11px] text-muted">({stats.conteo[k]})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Ficha */}
        <aside className="border border-ink bg-paper flex flex-col lg:mt-[80px] lg:h-[70vh] lg:min-h-[600px] overflow-hidden" aria-live="polite">
          {selected ? (
            <Ficha e={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <>
              <div className="px-5 pt-5 pb-4 border-b border-ink">
                <h2 className="text-[32px] leading-none">Más energía almacenada</h2>
                <p className="text-[14px] text-ink-2 mt-2">Elige un embalse aquí o en el mapa para ver su ficha.</p>
              </div>
              <ol className="flex-1 overflow-y-auto">
                {stats.top.map((e, i) => (
                  <li key={e.id} className="border-b border-rule">
                    <button
                      type="button"
                      onClick={() => select(e)}
                      className="w-full text-left px-5 py-3 flex items-baseline gap-3 hover:bg-ink hover:text-paper transition-colors duration-200"
                    >
                      <span className="num text-[11px] opacity-60 w-5">{i + 1}</span>
                      <span className="text-[15px] truncate flex-1">{e.nombre}</span>
                      <span className="num text-[13px] shrink-0">{fmt(e.mwh / 1000, 1)} GWh</span>
                    </button>
                  </li>
                ))}
                {embalses && stats.top.length === 0 && <li className="p-5 text-ink-2">Esta cuenca no tiene embalses con estimación de energía.</li>}
              </ol>
              <button
                type="button"
                onClick={() => setShowCaudales(true)}
                className="m-4 h-12 border border-ink px-4 flex items-center justify-between text-[15px] hover:bg-ink hover:text-paper transition-colors duration-200"
              >
                Ver caudales de {caudales.length} estaciones
                <span className="num text-[11px] opacity-70">SAIH</span>
              </button>
            </>
          )}
        </aside>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-x-12 gap-y-16 pt-8 border-t border-ink">
        <Grafico titulo="Llenado por cuenca" nota="Agua embalsada sobre capacidad, solo embalses con lectura.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porCuenca} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#d6d3c8" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={AXIS} axisLine={{ stroke: '#111110' }} tickLine={false} unit=" %" />
              <YAxis dataKey="name" type="category" width={104} tick={{ ...AXIS, fontFamily: "'Geist Sans', sans-serif", fontSize: 13, fill: '#111110' }} axisLine={false} tickLine={false} />
              <RTooltip cursor={{ fill: '#ebe9e1' }} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#f5f4ef' }} formatter={(v: number) => [`${fmt(v, 1)} %`, 'Llenado']} />
              <Bar dataKey="pct" barSize={14}>
                {porCuenca.map((c) => <Cell key={c.name} fill={ESTADOS[estadoDe(c.pct)].color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Grafico>
        <Grafico titulo="Cambio en la última semana" nota="Variación neta de volumen por cuenca, en hm³.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porCuenca} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#d6d3c8" horizontal={false} />
              <XAxis type="number" tick={AXIS} axisLine={{ stroke: '#111110' }} tickLine={false} />
              <YAxis dataKey="name" type="category" width={104} tick={{ ...AXIS, fontFamily: "'Geist Sans', sans-serif", fontSize: 13, fill: '#111110' }} axisLine={false} tickLine={false} />
              <RTooltip cursor={{ fill: '#ebe9e1' }} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#f5f4ef' }} formatter={(v: number) => [`${v > 0 ? '+' : ''}${fmt(v, 1)} hm³`, 'Cambio']} />
              <ReferenceLine x={0} stroke="#111110" />
              <Bar dataKey="variacion" barSize={14}>
                {porCuenca.map((c) => <Cell key={c.name} fill={c.variacion < 0 ? '#e0400f' : '#0038ff'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Grafico>
      </div>

      {showCaudales && <Caudales data={caudales} onClose={() => setShowCaudales(false)} />}
    </div>
  );
}

// ---------------- Subcomponentes ----------------

function Unidad({ children }: { children: React.ReactNode }) {
  return <span className="text-[15px] text-muted ml-1.5 font-sans">{children}</span>;
}

function Cifra({ label, nota, children, border, borderLg, className = '' }: {
  label: string; nota: string; children: React.ReactNode; border?: boolean; borderLg?: boolean; className?: string;
}) {
  return (
    <div className={`py-6 pr-4 ${border ? 'border-l border-rule pl-5' : ''} ${borderLg ? 'lg:border-l lg:border-rule lg:pl-5' : ''} ${className}`}>
      <dt className="text-[14px] text-ink-2">{label}</dt>
      <dd className="num text-[34px] sm:text-[40px] leading-none tracking-[-0.03em] mt-3">{children}</dd>
      <dd className="text-[13px] text-muted mt-2 truncate">{nota}</dd>
    </div>
  );
}

function MapBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="w-11 h-11 flex items-center justify-center border-b last:border-b-0 border-ink hover:bg-ink hover:text-paper transition-colors duration-200">
      {children}
    </button>
  );
}

function Grafico({ titulo, nota, children }: { titulo: string; nota: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[36px] leading-none">{titulo}</h2>
      <p className="text-[14px] text-ink-2 mt-2 mb-6">{nota}</p>
      <div className="h-[340px]">{children}</div>
    </section>
  );
}

function Ficha({ e, onClose }: { e: Embalse; onClose: () => void }) {
  const estado = estadoDe(e.pct);
  const color = ESTADOS[estado].color;
  const energiaPct = e.mwhMax > 0 ? (e.mwh / e.mwhMax) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-5 pb-4 border-b border-ink flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-ink-2">Cuenca del {e.cuenca}</p>
          <h2 className="text-[40px] leading-[0.95] mt-1 break-words">{e.nombre}</h2>
          {e.center && (
            <p className="num text-[11px] text-muted mt-2">
              {e.center[0].toFixed(4)}° N  {Math.abs(e.center[1]).toFixed(4)}° {e.center[1] < 0 ? 'W' : 'E'}
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar ficha"
          className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center hover:bg-ink hover:text-paper transition-colors duration-200">
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <Bloque titulo="Agua">
        {e.pct !== null ? (
          <>
            <div className="flex items-baseline justify-between">
              <p className="num text-[48px] leading-none tracking-[-0.03em]" style={{ color }}>
                {fmt(e.pct, 1)}<span className="text-[18px] ml-1">%</span>
              </p>
              <p className="text-[14px]" style={{ color }}>{ESTADOS[estado].label}</p>
            </div>
            <div className="h-2 bg-paper-2 mt-4" role="presentation"><div className="h-full" style={{ width: `${e.pct}%`, backgroundColor: color }} /></div>
            <Tabla filas={[
              ['Embalsada', `${fmt(e.embalsada ?? 0)} hm³`],
              ['Capacidad', `${fmt(e.capacidad)} hm³`],
              ['Cambio semanal', `${e.variacion > 0 ? '+' : ''}${fmt(e.variacion, 1)} hm³`],
            ]} />
          </>
        ) : (
          <p className="text-[15px] text-ink-2">Este embalse no tiene lectura de nivel en la última actualización.</p>
        )}
      </Bloque>

      {e.mwhMax > 0 && (
        <Bloque titulo="Energía estimada">
          <div className="flex items-baseline justify-between">
            <p className="num text-[24px]">{fmt(e.mwh)} <span className="text-[13px] font-sans text-muted">MWh</span></p>
            <p className="num text-[12px] text-muted">máx. {fmt(e.mwhMax)}</p>
          </div>
          <div className="h-2 bg-paper-2 mt-3" role="presentation"><div className="h-full bg-ink" style={{ width: `${energiaPct}%` }} /></div>
          <p className="text-[14px] text-ink-2 mt-3">Valor orientativo a precio OMIE: <span className="num">{fmt(e.valor)} €</span></p>
        </Bloque>
      )}

      {e.escena && (
        <Bloque titulo="Escena Sentinel-2">
          <Tabla filas={[
            ['Satélite', e.escena.satelite],
            ['Tesela MGRS', e.escena.tile],
            ['Fecha de captura', new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(e.escena.fecha))],
            ['Producto', 'L2A, color verdadero'],
          ]} />
          <div className="grid gap-2 mt-4">
            {e.center && (
              <a href={copernicusBrowserUrl(e.center[0], e.center[1], e.escena.fecha)} target="_blank" rel="noopener noreferrer"
                className="btn btn-ink justify-center">
                Abrir en Copernicus Browser
              </a>
            )}
            <a href={e.escena.url} target="_blank" rel="noopener noreferrer" className="link text-[14px] text-center py-2">
              Descargar el GeoTIFF de la tesela completa
            </a>
          </div>
        </Bloque>
      )}
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-5 border-b border-rule last:border-b-0">
      <h3 className="margin-note mb-3">{titulo}</h3>
      {children}
    </section>
  );
}

function Tabla({ filas }: { filas: [string, string][] }) {
  return (
    <dl className="mt-4 text-[14px]">
      {filas.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-1.5 border-t border-rule">
          <dt className="text-ink-2">{k}</dt>
          <dd className="num text-[13px] text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Caudales({ data, onClose }: { data: CaudalEntry[]; onClose: () => void }) {
  const [q, setQ] = useState('');
  const lista = useMemo(() => {
    const t = q.toLowerCase();
    return data
      .filter((c) => c.nombre.toLowerCase().includes(t) || c.cuenca.toLowerCase().includes(t))
      .sort((a, b) => b.caudal - a.caudal);
  }, [data, q]);
  const max = lista[0]?.caudal || 1;

  return (
    <div className="fixed inset-0 z-[2000] bg-ink/60 flex items-center justify-center p-4 overscroll-contain" onClick={onClose}>
      <div className="bg-paper border border-ink w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(ev) => ev.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="caudales-titulo">
        <div className="px-6 pt-6 pb-4 border-b border-ink flex items-start gap-4">
          <div className="flex-1">
            <h2 id="caudales-titulo" className="text-[40px] leading-none">Caudales de los ríos</h2>
            <p className="text-[14px] text-ink-2 mt-2">{data.length} estaciones de aforo de los SAIH, del caudal mayor al menor.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar caudales"
            className="w-11 h-11 flex items-center justify-center hover:bg-ink hover:text-paper transition-colors duration-200">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-6 py-4 border-b border-rule">
          <label htmlFor="buscar-caudal" className="sr-only">Buscar río, estación o cuenca</label>
          <div className="flex items-center border border-ink">
            <Search size={16} strokeWidth={1.5} className="ml-3 text-ink-2" aria-hidden="true" />
            <input id="buscar-caudal" name="buscar-caudal" autoComplete="off" value={q} onChange={(ev) => setQ(ev.target.value)}
              placeholder="Río Miño, Ebro…"
              className="w-full bg-transparent px-2.5 h-11 text-[15px] outline-none placeholder:text-muted" />
          </div>
        </div>
        <ul className="flex-1 overflow-auto overscroll-contain">
          {lista.map((c, i) => (
            <li key={`${c.nombre}-${i}`} className="px-6 py-3 grid grid-cols-[1fr_auto] gap-x-6 items-center border-b border-rule">
              <div className="min-w-0">
                <p className="text-[15px] truncate" title={c.nombre}>{c.nombre}</p>
                <p className="text-[13px] text-muted">{c.cuenca}</p>
              </div>
              <div className="text-right">
                <p className="num text-[14px]">{fmt(c.caudal, 2)} <span className="text-[11px] text-muted">m³/s</span></p>
                <div className="w-28 h-1 bg-paper-2 mt-1.5 ml-auto"><div className="h-full bg-cobalt" style={{ width: `${(c.caudal / max) * 100}%` }} /></div>
              </div>
            </li>
          ))}
          {lista.length === 0 && <li className="p-10 text-center text-ink-2">Ninguna estación coincide con «{q}».</li>}
        </ul>
      </div>
    </div>
  );
}
