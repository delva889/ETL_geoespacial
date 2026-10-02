import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap, CircleMarker as LeafletCircleMarker, GeoJSON as LeafletGeoJSON, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

interface EmbalseProperties {
  pantano: string;
  cuenca: string;
  capacidad: number | string;
  embalsada: number | string;
  variacion: number | string;
  mwh_conocidos?: number | string;
  precio_actual?: number | string;
}

interface EmbalseFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: EmbalseProperties;
}

interface EmbalsesGeoJSON {
  type: 'FeatureCollection';
  features: EmbalseFeature[];
}

interface CaudalEntry {
  nombre: string;
  cuenca: string;
  caudal: number;
}

interface CuencaStats {
  name: string;
  capacidad: number;
  embalsada: number;
  variacion: number;
  mwh: number;
  value: number;
}

interface Top10Entry {
  nombre: string;
  mwh: number;
}

interface LastUpdateInfo {
  timestamp: string;
  total_geometrias?: number;
  embalses_con_datos?: number;
  embalses_sin_datos?: number;
  precio_omie_eur_mwh?: number;
  estaciones_caudal?: number;
}

const getCentroid = (feature: EmbalseFeature): [number, number] | null => {
  let pts: number[][] = [];
  if (feature.geometry.type === 'MultiPolygon') {
    pts = (feature.geometry.coordinates as number[][][][])[0][0];
  } else if (feature.geometry.type === 'Polygon') {
    pts = (feature.geometry.coordinates as number[][][])[0];
  }
  if (!pts || pts.length === 0) return null;
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  pts.forEach((p) => {
    if (p[0] < minLng) minLng = p[0];
    if (p[0] > maxLng) maxLng = p[0];
    if (p[1] < minLat) minLat = p[1];
    if (p[1] > maxLat) maxLat = p[1];
  });
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
};

function MapEvents({ setZoomLevel }: { setZoomLevel: (z: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoomLevel(map.getZoom());
    },
  });
  return null;
}

const STATUS = {
  critico: '#9b3b2e',
  alerta: '#b4793a',
  optimo: '#0f6b66',
  excelente: '#1f3b57',
};

const getStatusLabel = (pct: number) => {
  if (pct < 35) return 'Crítico';
  if (pct < 60) return 'Alerta';
  if (pct < 80) return 'Óptimo';
  return 'Excelente';
};

function CountUp({ value, decimals = 0, duration = 1100 }: { value: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    let frame: number;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(value * ease(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{display.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

export default function Dashboard() {
  const [data, setData] = useState<EmbalsesGeoJSON | null>(null);
  const [caudalesData, setCaudalesData] = useState<CaudalEntry[]>([]);
  const [showCaudalesModal, setShowCaudalesModal] = useState(false);
  const [caudalesFilter, setCaudalesFilter] = useState('');

  const [zoomLevel, setZoomLevel] = useState(6);
  const [lastUpdate, setLastUpdate] = useState<LastUpdateInfo | null>(null);
  const [barsIn, setBarsIn] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef<Record<string, LeafletCircleMarker>>({});
  const geoJsonRef = useRef<LeafletGeoJSON | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.geojson`)
      .then(res => res.json())
      .then((json: EmbalsesGeoJSON) => setData(json))
      .catch(err => console.error(err));

    fetch(`${import.meta.env.BASE_URL}caudales.json`)
      .then(res => res.json())
      .then((json: CaudalEntry[]) => setCaudalesData(json))
      .catch(err => console.error(err));

    fetch(`${import.meta.env.BASE_URL}last_update.json`)
      .then(res => res.json())
      .then((json: LastUpdateInfo) => setLastUpdate(json))
      .catch(() => setLastUpdate(null));
  }, []);

  useEffect(() => {
    if (!data) return;
    setBarsIn(false);
    const t = setTimeout(() => setBarsIn(true), 60);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    if (!showCaudalesModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCaudalesModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showCaudalesModal]);

  const stats = useMemo(() => {
    if (!data) return { totalCap: 0, totalEmb: 0, totalVar: 0, pct: 0, totalMwh: 0, totalValue: 0, byCuenca: [] as CuencaStats[], top10: [] as Top10Entry[] };

    let totalCap = 0; let totalEmb = 0; let totalVar = 0; let totalMwh = 0; let totalValue = 0;
    const cuencas: Record<string, { capacidad: number; embalsada: number; variacion: number; mwh: number; value: number }> = {};

    data.features.forEach((f) => {
      const cap = parseFloat(String(f.properties.capacidad)) || 0;
      const emb = parseFloat(String(f.properties.embalsada)) || 0;
      const vari = parseFloat(String(f.properties.variacion)) || 0;
      const mwh = parseFloat(String(f.properties.mwh_conocidos)) || 0;
      const value = parseFloat(String(f.properties.precio_actual)) || 0;

      totalCap += cap; totalEmb += emb; totalVar += vari; totalMwh += mwh; totalValue += value;

      const cuenca = f.properties.cuenca || 'DESCONOCIDA';
      if (!cuencas[cuenca]) cuencas[cuenca] = { capacidad: 0, embalsada: 0, variacion: 0, mwh: 0, value: 0 };
      
      cuencas[cuenca].capacidad += cap;
      cuencas[cuenca].embalsada += emb;
      cuencas[cuenca].variacion += vari;
      cuencas[cuenca].mwh += (mwh / 1000); 
      cuencas[cuenca].value += (value / 1000000);
    });

    const byCuenca = Object.entries(cuencas)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => b.capacidad - a.capacidad);

    const top10: Top10Entry[] = [...data.features]
      .filter((f) => !isNaN(parseFloat(String(f.properties.mwh_conocidos))))
      .sort((a, b) => parseFloat(String(b.properties.mwh_conocidos)) - parseFloat(String(a.properties.mwh_conocidos)))
      .slice(0, 10)
      .map((f) => ({
        nombre: f.properties.pantano,
        mwh: parseFloat(String(f.properties.mwh_conocidos))
      }));

    return {
      totalCap, totalEmb, totalVar, totalMwh, totalValue,
      pct: totalCap > 0 ? (totalEmb / totalCap) * 100 : 0,
      byCuenca, top10
    };
  }, [data]);

  const mapFeatures = useMemo(() => {
    if (!data) return [];
    return data.features;
  }, [data]);

  const mapFeatureCollection = useMemo(
    () => ({ type: 'FeatureCollection' as const, features: mapFeatures }),
    [mapFeatures]
  );

  const handleFlyTo = (pantanoName: string) => {
    const feature = data?.features.find((f) => f.properties.pantano === pantanoName);
    if (!feature || !mapRef.current) return;

    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const center = getCentroid(feature);
    if (center) {
      mapRef.current.flyTo(center, 12, { duration: 1.5 });
      setTimeout(() => {
        if (geoJsonRef.current) {
          geoJsonRef.current.eachLayer((layer) => {
            const layerFeature = (layer as LeafletGeoJSON & { feature?: EmbalseFeature }).feature;
            if (layerFeature?.properties.pantano === pantanoName && 'openPopup' in layer) {
              (layer as unknown as { openPopup: () => void }).openPopup();
            }
          });
        }
      }, 1600);
    }
  };

  const getStatusColor = (pct: number) => {
    if (pct < 35) return STATUS.critico;
    if (pct < 60) return STATUS.alerta;
    if (pct < 80) return STATUS.optimo;
    return STATUS.excelente;
  };

  const geoJsonStyle = (feature?: EmbalseFeature): PathOptions => {
    const rawCap = feature?.properties.capacidad;
    const rawEmb = feature?.properties.embalsada;
    const cap = isNaN(parseFloat(String(rawCap))) ? 0 : parseFloat(String(rawCap));
    const emb = isNaN(parseFloat(String(rawEmb))) ? 0 : parseFloat(String(rawEmb));
    const pct = cap > 0 ? (emb / cap) * 100 : 0;

    return {
      fillColor: getStatusColor(pct),
      weight: 1.5,
      color: '#ffffff',
      opacity: 1,
      fillOpacity: 0.85
    };
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 font-data text-sm text-muted">
        Cargando modelo geoespacial…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 w-full max-w-[1400px] mx-auto">

      <div className="relative overflow-hidden pb-5 border-b border-line">
        <div className="lines-bg absolute inset-0 text-line opacity-60 pointer-events-none hidden sm:block" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="font-data text-xs text-teal mb-1">Visor cartográfico</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Estado general de las cuencas
            </h2>
            <p className="text-sm text-muted mt-1.5 max-w-lg">
              Reservas, energía potencial y valor de mercado estimado por demarcación hidrográfica.
            </p>
          </div>
          {lastUpdate?.timestamp && (
            <p className="font-data text-[11px] text-muted shrink-0 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
              </span>
              Actualizado{' '}
              <span className="text-ink">
                {new Date(lastUpdate.timestamp).toLocaleString('es-ES', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Lecturas nacionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-line divide-y divide-line sm:divide-y-0 sm:divide-x">
        <div className="p-5 border-t-2 border-t-teal bg-surface">
          <h3 className="text-[11px] text-muted mb-3">Volumen embalsado</h3>
          <p className="font-data text-[28px] leading-none text-ink">
            <CountUp value={stats.totalEmb} />
            <span className="text-sm text-muted ml-1">/ {stats.totalCap.toLocaleString('es-ES', { maximumFractionDigits: 0 })} hm³</span>
          </p>
        </div>
        <div className="p-5 border-t-2 border-t-teal bg-surface">
          <h3 className="text-[11px] text-muted mb-3">Energía potencial</h3>
          <p className="font-data text-[28px] leading-none text-ink">
            <CountUp value={stats.totalMwh} />
            <span className="text-sm text-muted ml-1">MWh</span>
          </p>
        </div>
        <div className="p-5 border-t-2 border-t-ochre bg-surface">
          <h3 className="text-[11px] text-muted mb-3">Mercado estimado</h3>
          <p className="font-data text-[28px] leading-none text-ink">
            <CountUp value={stats.totalValue / 1000000} decimals={1} />
            <span className="text-sm text-muted ml-1">M€</span>
          </p>
          <p className="text-[10px] text-muted mt-2">Estimación orientativa, no un precio de mercado real</p>
        </div>
        <div className="p-5 border-t-2 bg-surface relative overflow-hidden" style={{ borderTopColor: getStatusColor(stats.pct) }}>
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-out"
            style={{ height: barsIn ? `${stats.pct}%` : '0%', backgroundColor: getStatusColor(stats.pct), opacity: 0.07 }}
          />
          <div className="relative">
            <h3 className="text-[11px] text-muted mb-3">Llenado nacional</h3>
            <p className="font-data text-[28px] leading-none" style={{ color: getStatusColor(stats.pct) }}>
              <CountUp value={stats.pct} decimals={1} />
              <span className="text-sm ml-1">%</span>
            </p>
            <p className="text-[10px] text-muted mt-2">{getStatusLabel(stats.pct)}</p>
          </div>
        </div>
      </div>

      {/* Main Container: Top 10 + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Top 10 */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="border border-line bg-surface h-full flex flex-col">
            <h3 className="text-[11px] text-muted px-5 pt-5 pb-3 border-b border-line">
              Top 10 — energía potencial (MWh)
            </h3>
            <div className="flex flex-col flex-grow overflow-y-auto divide-y divide-line">
              {stats.top10.map((t, idx) => {
                const share = stats.top10[0]?.mwh ? (t.mwh / stats.top10[0].mwh) * 100 : 0;
                return (
                  <button
                    key={idx}
                    className="flex flex-col gap-1.5 text-left px-5 py-2.5 hover:bg-teal-soft transition-colors"
                    onClick={() => handleFlyTo(t.nombre)}
                  >
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="text-sm text-ink truncate" title={t.nombre}>
                        <span className="font-data text-[11px] text-muted mr-2">{String(idx + 1).padStart(2, '0')}</span>
                        {t.nombre}
                      </span>
                      <span className="font-data text-xs text-ink shrink-0">{t.mwh.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-[3px] bg-line">
                      <div
                        className="h-full bg-teal transition-[width] duration-700 ease-out"
                        style={{ width: barsIn ? `${share}%` : '0%', transitionDelay: `${idx * 45}ms` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-line">
              <h4 className="text-[11px] text-muted mb-3">Estado de llenado</h4>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'Excelente', sub: '> 80 %', color: STATUS.excelente },
                  { label: 'Óptimo', sub: '60–80 %', color: STATUS.optimo },
                  { label: 'Alerta', sub: '35–60 %', color: STATUS.alerta },
                  { label: 'Crítico', sub: '< 35 %', color: STATUS.critico },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-ink">{s.label}</span>
                    <span className="font-data text-[10px] text-muted ml-auto">{s.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-line">
              <button
                onClick={() => setShowCaudalesModal(true)}
                className="w-full text-left flex items-center justify-between border border-line hover:border-teal p-3 transition-colors group"
                title="Consultar base de datos de caudales"
              >
                <div className="flex flex-col">
                  <span className="text-xs text-ink">Red fluvial y caudales</span>
                  <span className="font-data text-[10px] text-muted">{caudalesData.length} estaciones de aforo</span>
                </div>
                <span className="font-data text-teal text-sm group-hover:translate-x-0.5 transition-transform">↗</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Map */}
        <div ref={mapSectionRef} className="lg:col-span-9 border border-line bg-surface flex flex-col overflow-hidden scroll-mt-20">
          <div className="p-4 border-b border-line flex items-center justify-between gap-3 z-10 relative">
            <h3 className="text-[11px] text-muted">Embalses — geometría real sobre el terreno</h3>
            
          </div>
          <div className="h-[650px] w-full relative z-0">
            <MapContainer
              center={[39.5, -3.0]}
              zoom={6}
              maxZoom={19}
              zoomControl={true}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', backgroundColor: '#e5e7eb' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri &amp; contributors"
                maxZoom={19}
                maxNativeZoom={19}
              />

              <MapEvents setZoomLevel={setZoomLevel} />

              {zoomLevel >= 7 ? (
                <GeoJSON
                  key="geojson-polygons"
                  data={mapFeatureCollection as unknown as GeoJSON.FeatureCollection}
                  style={geoJsonStyle as (feature?: GeoJSON.Feature) => PathOptions}
                  ref={geoJsonRef}
                  onEachFeature={(feature, layer) => {
                    const props = (feature as unknown as EmbalseFeature).properties;
                    const rawCap = props.capacidad;
                    const rawEmb = props.embalsada;
                    const rawVar = props.variacion;
                    const mwhCon = props.mwh_conocidos || 0;
                    const precioActual = props.precio_actual || 0;

                    const cap = isNaN(parseFloat(String(rawCap))) ? 0 : parseFloat(String(rawCap));
                    const emb = isNaN(parseFloat(String(rawEmb))) ? 0 : parseFloat(String(rawEmb));
                    const vari = isNaN(parseFloat(String(rawVar))) ? 0 : parseFloat(String(rawVar));
                    const pct = cap > 0 ? ((emb / cap) * 100).toFixed(1) : '0.0';
                    
                    layer.bindPopup(`
                      <div style="font-family: 'IBM Plex Sans', sans-serif; min-width: 230px; color: #0e2422;">
                        <div style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 14px; border-bottom: 1px solid #d7dcd3; padding-bottom: 6px; margin-bottom: 8px;">
                          ${props.pantano}
                        </div>
                        <div style="font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.03em; color: #5b6b62; margin-bottom: 6px;">ESTADO HIDROLÓGICO</div>
                        <div style="font-size: 12px; margin-bottom: 4px;"><strong>Cuenca:</strong> ${props.cuenca}</div>
                        <div style="font-size: 12px; margin-bottom: 4px;"><strong>Volumen:</strong> ${emb} / ${cap} hm³</div>
                        <div style="font-size: 12px; margin-bottom: 4px;"><strong>Llenado:</strong> <span style="color: ${getStatusColor(parseFloat(pct))}; font-weight: 600;">${pct}%</span></div>
                        <div style="font-size: 12px; margin-bottom: 10px;"><strong>Variación:</strong> ${vari > 0 ? '+' : ''}${vari} hm³</div>
                        <div style="border-top: 1px dashed #d7dcd3; padding-top: 8px;">
                          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.03em; color: #5b6b62; margin-bottom: 4px;">ESTIMACIÓN ENERGÉTICA (ORIENTATIVA)</div>
                          <div style="font-size: 11px; color: #5b6b62; margin-bottom: 2px;">Energía: ${parseFloat(String(mwhCon)).toLocaleString('es-ES', {maximumFractionDigits:0})} MWh</div>
                          <div style="font-size: 11px; color: #5b6b62;">Mercado: ${parseFloat(String(precioActual)).toLocaleString('es-ES', {maximumFractionDigits:0})} €</div>
                        </div>
                      </div>
                    `);
                  }}
                />
              ) : (
                mapFeatures.map((feature, idx) => {
                  const center = getCentroid(feature);
                  if (!center) return null;

                  const rawCap = feature.properties.capacidad;
                  const rawEmb = feature.properties.embalsada;
                  const rawVar = feature.properties.variacion;
                  const mwhCon = feature.properties.mwh_conocidos || 0;
                  const precioActual = feature.properties.precio_actual || 0;

                  const cap = isNaN(parseFloat(String(rawCap))) ? 0 : parseFloat(String(rawCap));
                  const emb = isNaN(parseFloat(String(rawEmb))) ? 0 : parseFloat(String(rawEmb));
                  const vari = isNaN(parseFloat(String(rawVar))) ? 0 : parseFloat(String(rawVar));
                  const pct = cap > 0 ? ((emb / cap) * 100) : 0;

                  const radius = Math.max(4, Math.sqrt(cap) * 0.4);

                  return (
                    <CircleMarker
                      key={idx}
                      center={center}
                      radius={radius}
                      fillColor={getStatusColor(pct)}
                      color="#ffffff"
                      weight={1.5}
                      fillOpacity={0.85}
                      ref={(el: LeafletCircleMarker | null) => {
                        if (el && feature.properties.pantano) {
                          markerRefs.current[feature.properties.pantano] = el;
                        }
                      }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", minWidth: '230px', color: '#0e2422' }}>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #d7dcd3', paddingBottom: '6px', marginBottom: '8px' }}>
                            {feature.properties.pantano}
                          </div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.03em', color: '#5b6b62', marginBottom: '6px' }}>ESTADO HIDROLÓGICO</div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Cuenca:</strong> {feature.properties.cuenca}</div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Volumen:</strong> {emb} / {cap} hm³</div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Llenado:</strong> <span style={{ color: getStatusColor(pct), fontWeight: 600 }}>{pct.toFixed(1)}%</span></div>
                          <div style={{ fontSize: '12px', marginBottom: '10px' }}><strong>Variación:</strong> {vari > 0 ? '+' : ''}{vari} hm³</div>
                          <div style={{ borderTop: '1px dashed #d7dcd3', paddingTop: '8px' }}>
                            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.03em', color: '#5b6b62', marginBottom: '4px' }}>ESTIMACIÓN ENERGÉTICA (ORIENTATIVA)</div>
                            <div style={{ fontSize: '11px', color: '#5b6b62', marginBottom: '2px' }}>Energía: {parseFloat(String(mwhCon)).toLocaleString('es-ES', {maximumFractionDigits:0})} MWh</div>
                            <div style={{ fontSize: '11px', color: '#5b6b62' }}>Mercado: {parseFloat(String(precioActual)).toLocaleString('es-ES', {maximumFractionDigits:0})} €</div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })
              )}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-line bg-surface p-5 flex flex-col">
          <h3 className="text-[11px] text-muted mb-5">
            Energía y mercado por cuenca
          </h3>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCuenca} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 3" stroke="#d7dcd3" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#5b6b62', fontFamily: "'IBM Plex Mono', monospace" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#0e2422' }} width={130} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d7dcd3', borderRadius: '2px', fontSize: '12px' }}
                  formatter={(value: number) => value.toFixed(1)}
                />
                <Bar dataKey="value" name="Mercado (M€)" fill="#1f3b57" barSize={12} />
                <Bar dataKey="mwh" name="Energía (GWh)" fill="#0f6b66" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-line bg-surface p-5 flex flex-col">
          <h3 className="text-[11px] text-muted mb-5">
            Variación neta de volumen (hm³)
          </h3>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCuenca} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 3" stroke="#d7dcd3" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#5b6b62', fontFamily: "'IBM Plex Mono', monospace" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#0e2422' }} width={130} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d7dcd3', borderRadius: '2px', fontSize: '12px' }}
                />
                <ReferenceLine x={0} stroke="#5b6b62" />
                <Bar dataKey="variacion" name="Flujo neto (hm³)" barSize={16}>
                  {stats.byCuenca.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.variacion < 0 ? '#9b3b2e' : '#0f6b66'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* MODAL DE CAUDALES */}
      {showCaudalesModal && (
        <div className="fixed inset-0 z-[9999] bg-ink/70 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-line">
            <div className="p-5 border-b border-line flex justify-between items-start gap-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Caudales de la red fluvial</h3>
                <p className="text-xs text-muted mt-1">Datos consolidados del SAIH para todas las demarcaciones hidrográficas.</p>
              </div>
              <button
                onClick={() => setShowCaudalesModal(false)}
                className="text-muted hover:text-ink transition-colors shrink-0 p-1"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-4 border-b border-line">
              <input
                type="text"
                placeholder="Buscar río, estación o cuenca…"
                className="w-full border border-line bg-paper p-2.5 text-sm outline-none focus-visible:border-teal"
                value={caudalesFilter}
                onChange={(e) => setCaudalesFilter(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-auto p-4 bg-paper">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {caudalesData
                  .filter(c =>
                    c.nombre.toLowerCase().includes(caudalesFilter.toLowerCase()) ||
                    c.cuenca.toLowerCase().includes(caudalesFilter.toLowerCase())
                  )
                  .sort((a, b) => b.caudal - a.caudal)
                  .slice(0, 100) // limit to top 100 for performance
                  .map((c, i) => (
                  <div key={i} className="bg-surface p-3.5 border border-line hover:border-teal transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-data text-[10px] text-muted">{c.cuenca}</span>
                      <span className="font-data text-sm text-ink shrink-0">{c.caudal.toLocaleString('es-ES', { maximumFractionDigits: 2 })} m³/s</span>
                    </div>
                    <h4 className="text-sm text-ink truncate" title={c.nombre}>{c.nombre}</h4>
                  </div>
                ))}
              </div>
              {caudalesData.length === 0 && (
                <div className="text-center py-12 text-muted text-sm">
                  Cargando o sin datos disponibles…
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
