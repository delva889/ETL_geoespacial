import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, GeoJSON, Tooltip, ScaleControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Search, X, Satellite, Download, ExternalLink, Waves, Layers, Crosshair, ChevronRight } from 'lucide-react';
import {
  loadEmbalses, loadCaudales, useLastUpdate, normalizar, estadoDe, ESTADOS, fmt, fechaLarga, copernicusBrowserUrl,
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
  oscuro: {
    label: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap · © CARTO',
  },
} as const;
type BasemapKey = keyof typeof BASEMAPS;

const POLY_ZOOM = 9;
const initialZoom = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? 5 : 6);
const AXIS = { fontSize: 11, fill: '#7d8d9c', fontFamily: "'IBM Plex Mono', monospace" };
const TOOLTIP_STYLE = { backgroundColor: '#0a0f15', border: '1px solid #2c3b4a', borderRadius: 2, fontSize: 12, color: '#e8eef4' };

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

  // ---------- Estadísticas ----------
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
      conDatos: conDatos.length,
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

  // ---------- Acciones ----------
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

  // ---------- Estilos de capa ----------
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
    return <Centered>No se pudieron cargar los datos del modelo.</Centered>;
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Visor cartográfico</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Estado de los embalses de España</h1>
        </div>
        {info?.timestamp && (
          <p className="font-data text-[11px] text-muted flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal live-dot" />
            Actualizado <span className="text-fg-soft">{fechaLarga(info.timestamp)}</span>
            <span className="text-line-strong">·</span> actualización semanal automática
          </p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-line border border-line">
        <Kpi label="Llenado medio" sub={cuenca === 'Todas' ? 'España' : cuenca}>
          <span style={{ color: ESTADOS[estadoDe(stats.pct)].color }}>{embalses ? fmt(stats.pct, 1) : '—'}</span>
          <span className="text-sm text-muted ml-1">%</span>
        </Kpi>
        <Kpi label="Volumen embalsado" sub={`de ${fmt(stats.cap)} hm³ de capacidad`}>
          {embalses ? fmt(stats.emb) : '—'}<span className="text-sm text-muted ml-1">hm³</span>
        </Kpi>
        <Kpi label="Variación semanal" sub="suma de embalses con lectura">
          <span className={stats.variacion < 0 ? 'text-st-critico' : 'text-signal'}>
            {embalses ? `${stats.variacion > 0 ? '+' : ''}${fmt(stats.variacion, 1)}` : '—'}
          </span>
          <span className="text-sm text-muted ml-1">hm³</span>
        </Kpi>
        <Kpi label="Energía almacenada" sub="estimación (MDT + volumen)">
          <span className="text-amber">{embalses ? fmt(stats.gwh, 1) : '—'}</span>
          <span className="text-sm text-muted ml-1">GWh</span>
        </Kpi>
        <Kpi label="Valor estimado" sub="a precio OMIE, orientativo" className="col-span-2 lg:col-span-1">
          {embalses ? fmt(stats.valor, 1) : '—'}<span className="text-sm text-muted ml-1">M€</span>
        </Kpi>
      </div>

      {/* Mapa + panel */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        <div ref={mapBoxRef} className="relative border border-line bg-void h-[62vh] min-h-[480px] lg:h-[72vh] lg:min-h-[600px] scroll-mt-20 overflow-hidden">
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
                    `${e.nombre} · ${e.pct !== null ? `${fmt(e.pct, 1)} %` : 'sin lectura'}`,
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
                      fillOpacity: estado === 'nodata' ? 0.55 : 0.85,
                      color: isSel ? '#ffffff' : '#05080c',
                      weight: isSel ? 2.5 : 1,
                    }}
                    eventHandlers={{ click: () => select(e) }}
                  >
                    <Tooltip className="embalse-tip" direction="top" offset={[0, -radius]}>
                      {e.nombre} · {e.pct !== null ? `${fmt(e.pct, 1)} %` : 'sin lectura'}
                    </Tooltip>
                  </CircleMarker>
                );
              })
            )}
          </MapContainer>

          {/* Controles superpuestos */}
          <div className="absolute top-3 left-3 right-3 z-[500] flex flex-col sm:flex-row gap-2 pointer-events-none">
            <div className="relative pointer-events-auto sm:w-72">
              <div className="flex items-center bg-void/90 backdrop-blur border border-line-strong focus-within:border-signal">
                <Search size={15} className="text-muted ml-3 shrink-0" />
                <input
                  value={query}
                  onChange={(ev) => { setQuery(ev.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter' && resultados[0]) select(resultados[0]); }}
                  placeholder="Buscar embalse…"
                  aria-label="Buscar embalse"
                  className="w-full bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted"
                />
              </div>
              {searchOpen && resultados.length > 0 && (
                <ul className="absolute mt-1 w-full bg-void/95 backdrop-blur border border-line-strong max-h-72 overflow-auto thin-scroll">
                  {resultados.map((r) => (
                    <li key={r.id}>
                      <button
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => select(r)}
                        className="w-full text-left px-3 py-2 hover:bg-raised flex items-center gap-2.5"
                      >
                        <span className="w-2 h-2 shrink-0" style={{ backgroundColor: ESTADOS[estadoDe(r.pct)].color }} />
                        <span className="text-sm truncate">{r.nombre}</span>
                        <span className="font-data text-[10px] text-muted ml-auto shrink-0">{r.cuenca}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <select
              value={cuenca}
              onChange={(ev) => { setCuenca(ev.target.value); setSelectedId(null); }}
              aria-label="Filtrar por cuenca"
              className="pointer-events-auto bg-void/90 backdrop-blur border border-line-strong px-3 py-2 text-sm outline-none focus:border-signal sm:w-48"
            >
              {cuencas.map((c) => <option key={c} value={c}>{c === 'Todas' ? 'Todas las cuencas' : c}</option>)}
            </select>

            <div className="pointer-events-auto sm:ml-auto flex border border-line-strong bg-void/90 backdrop-blur self-start">
              <Layers size={14} className="text-muted mx-2.5 self-center" />
              {(Object.keys(BASEMAPS) as BasemapKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setBasemap(k)}
                  className={`px-3 py-2 text-xs transition-colors ${basemap === k ? 'bg-signal text-void font-medium' : 'text-fg-soft hover:text-fg'}`}
                >
                  {BASEMAPS[k].label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom + reset */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[500] flex flex-col border border-line-strong bg-void/90 backdrop-blur">
            <MapBtn label="Acercar" onClick={() => mapRef.current?.zoomIn()}>+</MapBtn>
            <MapBtn label="Alejar" onClick={() => mapRef.current?.zoomOut()}>−</MapBtn>
            <MapBtn label="Vista de España" onClick={resetView}><Crosshair size={14} /></MapBtn>
          </div>

          {/* Leyenda */}
          <div className="absolute left-3 right-14 sm:right-auto bottom-8 sm:bottom-10 z-[500] bg-void/90 backdrop-blur border border-line-strong px-3 py-2 sm:py-2.5">
            <p className="hidden sm:block font-data text-[10px] text-muted mb-1.5 tracking-wider">LLENADO</p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 sm:block sm:space-y-1">
              {(Object.keys(ESTADOS) as Estado[]).map((k) => (
                <li key={k} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: ESTADOS[k].color }} />
                  <span className="text-fg-soft sm:w-[70px]">{ESTADOS[k].label}</span>
                  <span className="hidden sm:inline font-data text-[10px] text-muted w-12">{ESTADOS[k].rango}</span>
                  <span className="hidden sm:inline font-data text-[10px] text-fg-soft w-7 text-right">{stats.conteo[k]}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coordenadas */}
          <div className="hidden sm:block absolute right-3 bottom-7 z-[500] font-data text-[10.5px] text-fg-soft bg-void/85 border border-line-strong px-2.5 py-1">
            {cursor ? `${cursor[0].toFixed(4)}° N  ${Math.abs(cursor[1]).toFixed(4)}° ${cursor[1] < 0 ? 'W' : 'E'}` : 'EPSG:4326'}
            <span className="text-muted"> · z{zoom}</span>
          </div>

          {!embalses && (
            <div className="absolute inset-0 z-[600] flex items-center justify-center bg-void/70">
              <p className="font-data text-xs text-fg-soft flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-signal live-dot" /> Cargando modelo geoespacial…
              </p>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <aside className="border border-line bg-panel flex flex-col lg:h-[72vh] lg:min-h-[600px] overflow-hidden">
          {selected ? (
            <Detalle e={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <>
              <div className="px-5 pt-5 pb-3 border-b border-line">
                <p className="eyebrow mb-1">Ranking</p>
                <h2 className="font-display font-semibold">Mayor energía almacenada</h2>
                <p className="text-xs text-muted mt-1">Selecciona un embalse en la lista o en el mapa.</p>
              </div>
              <ol className="flex-1 overflow-y-auto thin-scroll divide-y divide-line">
                {stats.top.map((e, i) => {
                  const share = stats.top[0] ? (e.mwh / stats.top[0].mwh) * 100 : 0;
                  return (
                    <li key={e.id}>
                      <button onClick={() => select(e)} className="w-full text-left px-5 py-3 hover:bg-raised transition-colors group">
                        <div className="flex items-baseline gap-3">
                          <span className="font-data text-[11px] text-muted w-5">{String(i + 1).padStart(2, '0')}</span>
                          <span className="text-sm truncate flex-1">{e.nombre}</span>
                          <span className="font-data text-xs text-amber shrink-0">{fmt(e.mwh / 1000, 1)} GWh</span>
                        </div>
                        <div className="ml-8 mt-1.5 h-[3px] bg-line">
                          <div className="h-full bg-amber/80" style={{ width: `${share}%` }} />
                        </div>
                      </button>
                    </li>
                  );
                })}
                {embalses && stats.top.length === 0 && <li className="p-5 text-sm text-muted">Sin datos para esta cuenca.</li>}
              </ol>
              <button
                onClick={() => setShowCaudales(true)}
                className="m-4 flex items-center gap-3 border border-line hover:border-signal p-3 text-left transition-colors group"
              >
                <Waves size={18} className="text-signal shrink-0" strokeWidth={1.5} />
                <span className="flex-1">
                  <span className="block text-sm">Red fluvial y caudales</span>
                  <span className="font-data text-[10px] text-muted">{caudales.length} estaciones SAIH</span>
                </span>
                <ChevronRight size={16} className="text-muted group-hover:text-signal group-hover:translate-x-0.5 transition-all" />
              </button>
            </>
          )}
        </aside>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard titulo="Llenado por cuenca" sub="Volumen embalsado / capacidad de los embalses con lectura (%)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porCuenca} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1f2b37" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={AXIS} axisLine={false} tickLine={false} unit=" %" />
              <YAxis dataKey="name" type="category" width={100} tick={{ ...AXIS, fill: '#b6c3cf' }} axisLine={false} tickLine={false} />
              <RTooltip cursor={{ fill: '#151e28' }} contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${fmt(v, 1)} %`, 'Llenado']} />
              <Bar dataKey="pct" barSize={14}>
                {porCuenca.map((c) => <Cell key={c.name} fill={ESTADOS[estadoDe(c.pct)].color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard titulo="Variación semanal por cuenca" sub="Cambio neto de volumen respecto a la semana anterior (hm³)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porCuenca} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1f2b37" horizontal={false} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{ ...AXIS, fill: '#b6c3cf' }} axisLine={false} tickLine={false} />
              <RTooltip cursor={{ fill: '#151e28' }} contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v > 0 ? '+' : ''}${fmt(v, 1)} hm³`, 'Variación']} />
              <ReferenceLine x={0} stroke="#7d8d9c" />
              <Bar dataKey="variacion" barSize={14}>
                {porCuenca.map((c) => <Cell key={c.name} fill={c.variacion < 0 ? '#ef5b5b' : '#35d0c3'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {showCaudales && <CaudalesModal data={caudales} onClose={() => setShowCaudales(false)} />}
    </div>
  );
}

// ---------------- Subcomponentes ----------------

function Kpi({ label, sub, children, className = '' }: { label: string; sub: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-panel px-5 py-4 ${className}`}>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="font-data text-2xl sm:text-[28px] leading-tight mt-1">{children}</p>
      <p className="text-[10.5px] text-muted/80 mt-1 truncate">{sub}</p>
    </div>
  );
}

function MapBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className="w-9 h-9 flex items-center justify-center text-fg-soft hover:text-signal border-b last:border-b-0 border-line text-lg leading-none">
      {children}
    </button>
  );
}

function ChartCard({ titulo, sub, children }: { titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="border border-line bg-panel p-5">
      <h3 className="font-display font-semibold">{titulo}</h3>
      <p className="text-xs text-muted mt-0.5 mb-5">{sub}</p>
      <div className="h-[320px]">{children}</div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex items-center justify-center p-16 font-data text-sm text-muted">{children}</div>;
}

function Detalle({ e, onClose }: { e: Embalse; onClose: () => void }) {
  const estado = estadoDe(e.pct);
  const color = ESTADOS[estado].color;
  const energiaPct = e.mwhMax > 0 ? (e.mwh / e.mwhMax) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto thin-scroll">
      <div className="px-5 pt-5 pb-4 border-b border-line flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="eyebrow mb-1">Cuenca · {e.cuenca}</p>
          <h2 className="font-display text-xl font-semibold leading-tight">{e.nombre}</h2>
          {e.center && (
            <p className="font-data text-[10.5px] text-muted mt-1">
              {e.center[0].toFixed(4)}° N · {Math.abs(e.center[1]).toFixed(4)}° {e.center[1] < 0 ? 'W' : 'E'}
            </p>
          )}
        </div>
        <button onClick={onClose} aria-label="Cerrar ficha" className="p-1 text-muted hover:text-fg"><X size={18} /></button>
      </div>

      {/* Estado hídrico */}
      <section className="px-5 py-4 border-b border-line">
        <p className="font-data text-[10px] text-muted tracking-wider mb-2">ESTADO HÍDRICO</p>
        {e.pct !== null ? (
          <>
            <div className="flex items-end justify-between">
              <p className="font-data text-4xl" style={{ color }}>{fmt(e.pct, 1)}<span className="text-base ml-1">%</span></p>
              <span className="text-xs px-2 py-0.5 border" style={{ color, borderColor: color }}>{ESTADOS[estado].label}</span>
            </div>
            <div className="h-1.5 bg-line mt-3"><div className="h-full" style={{ width: `${e.pct}%`, backgroundColor: color }} /></div>
            <dl className="grid grid-cols-3 gap-2 mt-4 text-center">
              <Dato k="Embalsada" v={`${fmt(e.embalsada ?? 0)} hm³`} />
              <Dato k="Capacidad" v={`${fmt(e.capacidad)} hm³`} />
              <Dato k="Semana" v={`${e.variacion > 0 ? '+' : ''}${fmt(e.variacion, 1)} hm³`}
                color={e.variacion < 0 ? '#ef5b5b' : e.variacion > 0 ? '#35d0c3' : undefined} />
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted">Sin lectura de nivel en el último ciclo de actualización.</p>
        )}
      </section>

      {/* Energía */}
      {e.mwhMax > 0 && (
        <section className="px-5 py-4 border-b border-line">
          <p className="font-data text-[10px] text-muted tracking-wider mb-2">ENERGÍA POTENCIAL · ESTIMACIÓN</p>
          <div className="flex items-baseline justify-between">
            <p className="font-data text-xl text-amber">{fmt(e.mwh)} <span className="text-xs">MWh</span></p>
            <p className="font-data text-[11px] text-muted">máx. {fmt(e.mwhMax)} MWh</p>
          </div>
          <div className="h-1.5 bg-line mt-2"><div className="h-full bg-amber" style={{ width: `${energiaPct}%` }} /></div>
          <p className="text-xs text-muted mt-3">
            Valor orientativo a precio OMIE: <span className="font-data text-fg-soft">{fmt(e.valor)} €</span>
          </p>
        </section>
      )}

      {/* Sentinel-2 */}
      {e.escena && (
        <section className="px-5 py-4">
          <p className="font-data text-[10px] text-muted tracking-wider mb-2 flex items-center gap-1.5">
            <Satellite size={12} className="text-signal" /> ESCENA SENTINEL-2 VINCULADA
          </p>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Dato k="Plataforma" v={e.escena.satelite} />
            <Dato k="Tesela MGRS" v={e.escena.tile} />
            <Dato k="Captura" v={new Date(e.escena.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} />
          </dl>
          <p className="text-[11px] text-muted mt-3">Nivel L2A · color verdadero (TCI) · seleccionada por menor nubosidad.</p>
          <div className="grid gap-2 mt-3">
            {e.center && (
              <a href={copernicusBrowserUrl(e.center[0], e.center[1], e.escena.fecha)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-signal text-void text-sm font-medium px-3 py-2 hover:bg-fg transition-colors">
                <ExternalLink size={14} /> Ver en Copernicus Browser
              </a>
            )}
            <a href={e.escena.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-line-strong text-sm px-3 py-2 text-fg-soft hover:text-fg hover:border-signal transition-colors">
              <Download size={14} /> GeoTIFF (COG) de la tesela completa
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function Dato({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="bg-void border border-line px-2 py-2">
      <dt className="text-[10px] text-muted">{k}</dt>
      <dd className="font-data text-[12px] mt-0.5" style={color ? { color } : undefined}>{v}</dd>
    </div>
  );
}

function CaudalesModal({ data, onClose }: { data: CaudalEntry[]; onClose: () => void }) {
  const [q, setQ] = useState('');
  const lista = useMemo(() => {
    const t = q.toLowerCase();
    return data
      .filter((c) => c.nombre.toLowerCase().includes(t) || c.cuenca.toLowerCase().includes(t))
      .sort((a, b) => b.caudal - a.caudal);
  }, [data, q]);
  const max = lista[0]?.caudal || 1;

  return (
    <div className="fixed inset-0 z-[2000] bg-void/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-panel border border-line-strong w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(ev) => ev.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Caudales de la red fluvial">
        <div className="p-5 border-b border-line flex items-start gap-4">
          <div className="flex-1">
            <p className="eyebrow mb-1">SAIH · MITECO</p>
            <h3 className="font-display text-lg font-semibold">Caudales de la red fluvial</h3>
            <p className="text-xs text-muted mt-1">{data.length} estaciones de aforo consolidadas desde las confederaciones hidrográficas.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-muted hover:text-fg"><X size={20} /></button>
        </div>
        <div className="p-4 border-b border-line">
          <div className="flex items-center bg-void border border-line focus-within:border-signal">
            <Search size={15} className="text-muted ml-3" />
            <input autoFocus value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Buscar río, estación o cuenca…"
              className="w-full bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted" />
          </div>
        </div>
        <ul className="flex-1 overflow-auto thin-scroll divide-y divide-line">
          {lista.map((c, i) => (
            <li key={`${c.nombre}-${i}`} className="px-5 py-2.5 grid grid-cols-[1fr_auto] gap-x-4 items-center">
              <div className="min-w-0">
                <p className="text-sm truncate" title={c.nombre}>{c.nombre}</p>
                <p className="font-data text-[10px] text-muted">{c.cuenca}</p>
              </div>
              <div className="text-right">
                <p className="font-data text-sm text-signal">{fmt(c.caudal, 2)} <span className="text-[10px] text-muted">m³/s</span></p>
                <div className="w-24 h-[3px] bg-line mt-1 ml-auto"><div className="h-full bg-signal/70" style={{ width: `${(c.caudal / max) * 100}%` }} /></div>
              </div>
            </li>
          ))}
          {lista.length === 0 && <li className="p-10 text-center text-sm text-muted">Sin resultados.</li>}
        </ul>
      </div>
    </div>
  );
}
