// @ts-nocheck
import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, CircleMarker, Popup, GeoJSON, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';

// Extrae el centro aproximado de un Feature (Polygon / MultiPolygon)
const getCentroid = (feature: any) => {
  let pts = [];
  if (feature.geometry.type === 'MultiPolygon') {
    pts = feature.geometry.coordinates[0][0];
  } else if (feature.geometry.type === 'Polygon') {
    pts = feature.geometry.coordinates[0];
  }
  if (!pts || pts.length === 0) return null;
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  pts.forEach((p: any) => {
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
    }
  });
  return null;
}

const getCuencaColor = (cuenca: string) => {
  const c = cuenca.toLowerCase();
  if (c.includes('cantabrico')) return 'bg-sky-100 text-sky-800 border-sky-200';
  if (c.includes('duero')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (c.includes('ebro')) return 'bg-red-100 text-red-800 border-red-200';
  if (c.includes('guadalquivir')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (c.includes('guadiana')) return 'bg-teal-100 text-teal-800 border-teal-200';
  if (c.includes('jucar')) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (c.includes('mino')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
  if (c.includes('segura')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (c.includes('tajo')) return 'bg-purple-100 text-purple-800 border-purple-200';
  return 'bg-neutral-100 text-neutral-800 border-neutral-200';
};

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [caudalesData, setCaudalesData] = useState<any[]>([]);
  const [showCaudalesModal, setShowCaudalesModal] = useState(false);
  const [caudalesFilter, setCaudalesFilter] = useState('');
  
  const [zoomLevel, setZoomLevel] = useState(6);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const geoJsonRef = useRef<any>(null);

  useEffect(() => {
    // Cargar datos de embalses
    fetch(`${import.meta.env.BASE_URL}data.geojson`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error(err));
      
    // Cargar datos consolidados de caudales (BBDD)
    fetch(`${import.meta.env.BASE_URL}caudales.json`)
      .then(res => res.json())
      .then(json => setCaudalesData(json))
      .catch(err => console.error(err));
  }, []);

  const stats = useMemo(() => {
    if (!data) return { totalCap: 0, totalEmb: 0, totalVar: 0, pct: 0, totalMwh: 0, totalValue: 0, byCuenca: [], top10: [] };
    
    let totalCap = 0; let totalEmb = 0; let totalVar = 0; let totalMwh = 0; let totalValue = 0;
    const cuencas: Record<string, { capacidad: number; embalsada: number; variacion: number; mwh: number; value: number }> = {};

    data.features.forEach((f: any) => {
      const cap = parseFloat(f.properties.capacidad) || 0;
      const emb = parseFloat(f.properties.embalsada) || 0;
      const vari = parseFloat(f.properties.variacion) || 0;
      const mwh = parseFloat(f.properties.mwh_conocidos) || 0;
      const value = parseFloat(f.properties.precio_actual) || 0;

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

    const top10 = [...data.features]
      .filter((f: any) => !isNaN(parseFloat(f.properties.mwh_conocidos)))
      .sort((a: any, b: any) => parseFloat(b.properties.mwh_conocidos) - parseFloat(a.properties.mwh_conocidos))
      .slice(0, 10)
      .map((f: any) => ({
        nombre: f.properties.pantano,
        mwh: parseFloat(f.properties.mwh_conocidos)
      }));

    return {
      totalCap, totalEmb, totalVar, totalMwh, totalValue,
      pct: totalCap > 0 ? (totalEmb / totalCap) * 100 : 0,
      byCuenca, top10
    };
  }, [data]);

  const handleFlyTo = (pantanoName: string) => {
    const feature = data.features.find((f: any) => f.properties.pantano === pantanoName);
    if (!feature || !mapRef.current) return;
    
    const center = getCentroid(feature);
    if (center) {
      mapRef.current.flyTo(center, 12, { duration: 1.5 });
      setTimeout(() => {
        // En zoom 12 estará activo el GeoJSON
        if (geoJsonRef.current) {
          geoJsonRef.current.eachLayer((layer: any) => {
            if (layer.feature.properties.pantano === pantanoName) {
              layer.openPopup();
            }
          });
        }
      }, 1600);
    }
  };

  const getStatusColor = (pct: number) => {
    // Escala cartográfica divergente (Sequía -> Abundancia)
    if (pct < 35) return '#d73027'; // Rojo/Marrón oscuro
    if (pct < 60) return '#fdae61'; // Naranja/Ambar suave
    if (pct < 80) return '#74add1'; // Azul claro
    return '#4575b4'; // Azul profundo
  };

  const geoJsonStyle = (feature: any) => {
    const rawCap = feature.properties.capacidad;
    const rawEmb = feature.properties.embalsada;
    const cap = isNaN(parseFloat(rawCap)) ? 0 : parseFloat(rawCap);
    const emb = isNaN(parseFloat(rawEmb)) ? 0 : parseFloat(rawEmb);
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
      <div className="flex items-center justify-center h-64 text-neutral-600 font-medium text-lg">
        Cargando modelo geoespacial...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto py-6">
      
      {/* Título de Sección */}
      <div className="border-b border-neutral-300 pb-4">
        <h2 className="text-2xl font-bold text-neutral-800 uppercase tracking-wide">
          Estado General de las Cuencas
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Indicadores globales de reservas, energía potencial y valor de mercado.
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-neutral-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Volumen Embalsado (hm³)</h3>
          <p className="text-3xl font-extrabold text-neutral-900">
            {stats.totalEmb.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            <span className="text-base font-normal text-neutral-500 ml-2">/ {stats.totalCap.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
          </p>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Energía Potencial (MWh)</h3>
          <p className="text-3xl font-extrabold text-neutral-900">
            {stats.totalMwh.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Mercado Estimado (M€)</h3>
          <p className="text-3xl font-extrabold text-neutral-900">
            {(stats.totalValue / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}
          </p>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Llenado Nacional</h3>
          <p className={`text-3xl font-extrabold ${stats.pct < 40 ? 'text-red-600' : 'text-blue-600'}`}>
            {stats.pct.toFixed(1)} %
          </p>
        </div>
      </div>

      {/* Main Container: Top 10 + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Top 10 */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm h-full flex flex-col">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide mb-4 border-b border-neutral-200 pb-3">
              Top 10 Embalses (MWh)
            </h3>
            <div className="flex flex-col gap-3 flex-grow overflow-y-auto">
              {stats.top10.map((t, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center text-sm cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                  onClick={() => handleFlyTo(t.nombre)}
                >
                  <span className="text-neutral-700 font-medium truncate w-32" title={t.nombre}>{idx + 1}. {t.nombre}</span>
                  <span className="text-neutral-900 font-bold">{t.mwh.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
            
            {/* Leyenda de Estado de Llenado */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Estado de Llenado (%)</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-neutral-300" style={{ backgroundColor: '#4575b4' }}></span>
                  <span className="text-xs text-neutral-600">&gt; 80% (Excelente)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-neutral-300" style={{ backgroundColor: '#74add1' }}></span>
                  <span className="text-xs text-neutral-600">60 - 80% (Óptimo)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-neutral-300" style={{ backgroundColor: '#fdae61' }}></span>
                  <span className="text-xs text-neutral-600">35 - 60% (Alerta)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-neutral-300" style={{ backgroundColor: '#d73027' }}></span>
                  <span className="text-xs text-neutral-600">&lt; 35% (Crítico)</span>
                </div>
              </div>
            </div>

            {/* Consulta de Caudales (SAIH) */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Red Fluvial y Caudales</h4>
              <button 
                onClick={() => setShowCaudalesModal(true)}
                className="w-full text-left flex items-center justify-between bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-3 rounded transition-colors group"
                title="Consultar BBDD de Caudales"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors">Base de Datos de Caudales</span>
                  <span className="text-[10px] text-emerald-700/80">{caudalesData.length} estaciones de aforo</span>
                </div>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-9 bg-white border border-neutral-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center z-10 relative">
            <h3 className="text-base font-bold text-neutral-800 uppercase tracking-wide">Visor Cartográfico de Embalses</h3>
          </div>
          <div className="h-[650px] w-full relative z-0">
            <MapContainer 
              center={[39.5, -3.0]} 
              zoom={6} 
              zoomControl={true}
              style={{ height: '100%', width: '100%', backgroundColor: '#e5e7eb' }}
              ref={mapRef}
            >
              {/* Mapa Base Topográfico (Físico, ideal para hidrología) */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
              />
              
              {/* WMS Oficial MITECO para Demarcaciones Hidrográficas Enteras con transparencia sutil */}
              <WMSTileLayer
                url="https://wms.mapama.gob.es/sig/Agua/Demarcaciones/wms.aspx"
                layers="Demarcaciones"
                format="image/png"
                transparent={true}
                opacity={0.30} // 30% opacidad para que se funda perfectamente con el relieve topográfico
              />

              <MapEvents setZoomLevel={setZoomLevel} />

              {zoomLevel >= 8 ? (
                <GeoJSON 
                  key={`geojson-polygons`}
                  data={data} 
                  style={geoJsonStyle}
                  ref={geoJsonRef}
                  onEachFeature={(feature, layer) => {
                    const rawCap = feature.properties.capacidad;
                    const rawEmb = feature.properties.embalsada;
                    const rawVar = feature.properties.variacion;
                    const mwhCon = feature.properties.mwh_conocidos || 0;
                    const precioActual = feature.properties.precio_actual || 0;
                    
                    const cap = isNaN(parseFloat(rawCap)) ? 0 : parseFloat(rawCap);
                    const emb = isNaN(parseFloat(rawEmb)) ? 0 : parseFloat(rawEmb);
                    const vari = isNaN(parseFloat(rawVar)) ? 0 : parseFloat(rawVar);
                    const pct = cap > 0 ? ((emb / cap) * 100).toFixed(1) : '0.0';
                    
                    layer.bindPopup(`
                      <div style="font-family: system-ui, sans-serif; min-width: 220px; color: #1f2937;">
                        <div style="font-weight: 800; font-size: 14px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 8px;">
                          ${feature.properties.pantano}
                        </div>
                        <div style="font-size: 12px; margin-bottom: 4px;"><strong>Cuenca:</strong> ${feature.properties.cuenca}</div>
                        <div style="font-size: 12px; margin-bottom: 4px;"><strong>Volumen:</strong> ${emb} / ${cap} hm³</div>
                        <div style="font-size: 12px; margin-bottom: 4px;"><strong>Llenado:</strong> <span style="color: ${getStatusColor(parseFloat(pct))}; font-weight: bold;">${pct}%</span></div>
                        <div style="font-size: 12px; margin-bottom: 8px;"><strong>Variación:</strong> ${vari > 0 ? '+' : ''}${vari} hm³</div>
                        <div style="background: #f3f4f6; padding: 6px; border-radius: 4px;">
                          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Energía:</strong> ${parseFloat(mwhCon).toLocaleString('es-ES', {maximumFractionDigits:0})} MWh</div>
                          <div style="font-size: 11px;"><strong>Mercado:</strong> ${parseFloat(precioActual).toLocaleString('es-ES', {maximumFractionDigits:0})} €</div>
                        </div>
                      </div>
                    `);
                  }}
                />
              ) : (
                data.features.map((feature: any, idx: number) => {
                  const center = getCentroid(feature);
                  if (!center) return null;

                  const rawCap = feature.properties.capacidad;
                  const rawEmb = feature.properties.embalsada;
                  const rawVar = feature.properties.variacion;
                  const mwhCon = feature.properties.mwh_conocidos || 0;
                  const precioActual = feature.properties.precio_actual || 0;
                  
                  const cap = isNaN(parseFloat(rawCap)) ? 0 : parseFloat(rawCap);
                  const emb = isNaN(parseFloat(rawEmb)) ? 0 : parseFloat(rawEmb);
                  const vari = isNaN(parseFloat(rawVar)) ? 0 : parseFloat(rawVar);
                  const pct = cap > 0 ? ((emb / cap) * 100) : 0;

                  // El radio depende de la capacidad, para que los grandes destaquen
                  const radius = Math.max(4, Math.sqrt(cap) * 0.4);

                  return (
                    <CircleMarker
                      key={idx}
                      center={center as [number, number]}
                      radius={radius}
                      fillColor={getStatusColor(pct)}
                      color="#ffffff"
                      weight={1.5}
                      fillOpacity={0.85}
                      ref={(el) => {
                        if (el && feature.properties.pantano) {
                          markerRefs.current[feature.properties.pantano] = el;
                        }
                      }}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '220px', color: '#1f2937' }}>
                          <div style={{ fontWeight: 800, fontSize: '14px', borderBottom: '2px solid #e5e7eb', paddingBottom: '6px', marginBottom: '8px' }}>
                            {feature.properties.pantano}
                          </div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Cuenca:</strong> {feature.properties.cuenca}</div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Volumen:</strong> {emb} / {cap} hm³</div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Llenado:</strong> <span style={{ color: getStatusColor(pct), fontWeight: 'bold' }}>{pct.toFixed(1)}%</span></div>
                          <div style={{ fontSize: '12px', marginBottom: '8px' }}><strong>Variación:</strong> {vari > 0 ? '+' : ''}{vari} hm³</div>
                          <div style={{ background: '#f3f4f6', padding: '6px', borderRadius: '4px' }}>
                            <div style={{ fontSize: '11px', marginBottom: '2px' }}><strong>Energía:</strong> {parseFloat(mwhCon).toLocaleString('es-ES', {maximumFractionDigits:0})} MWh</div>
                            <div style={{ fontSize: '11px' }}><strong>Mercado:</strong> {parseFloat(precioActual).toLocaleString('es-ES', {maximumFractionDigits:0})} €</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide mb-6 text-center">
            Energía y Mercado por Cuenca
          </h3>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCuenca} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{fontSize: 12, fill: '#525252'}} />
                <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#404040'}} width={130} />
                <RechartsTooltip 
                  contentStyle={{backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px'}}
                  formatter={(value: number) => value.toFixed(1)}
                />
                <Bar dataKey="value" name="Mercado (M€)" fill="#1e293b" barSize={12} />
                <Bar dataKey="mwh" name="Energía (GWh)" fill="#94a3b8" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide mb-6 text-center">
            Variación Neta de Volumen (hm³)
          </h3>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCuenca} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{fontSize: 12, fill: '#525252'}} />
                <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#404040'}} width={130} />
                <RechartsTooltip 
                  contentStyle={{backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px'}}
                />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Bar dataKey="variacion" name="Flujo Neto (hm³)" barSize={16}>
                  {stats.byCuenca.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.variacion < 0 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* MODAL DE CAUDALES */}
      {showCaudalesModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Caudales de la red fluvial</h3>
                <p className="text-xs text-neutral-500">Datos consolidados del SAIH para todas las demarcaciones hidrográficas.</p>
              </div>
              <button 
                onClick={() => setShowCaudalesModal(false)}
                className="text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 rounded-lg p-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-4 border-b border-neutral-200">
              <input 
                type="text" 
                placeholder="Buscar río, estación o cuenca..." 
                className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={caudalesFilter}
                onChange={(e) => setCaudalesFilter(e.target.value)}
              />
            </div>
            
            <div className="flex-1 overflow-auto bg-neutral-50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caudalesData
                  .filter(c => 
                    c.nombre.toLowerCase().includes(caudalesFilter.toLowerCase()) || 
                    c.cuenca.toLowerCase().includes(caudalesFilter.toLowerCase())
                  )
                  .sort((a, b) => b.caudal - a.caudal)
                  .slice(0, 100) // limit to top 100 for performance
                  .map((c, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm hover:border-emerald-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-1 border rounded uppercase tracking-wider ${getCuencaColor(c.cuenca)}`}>{c.cuenca}</span>
                      <span className="text-sm font-black text-neutral-900">{c.caudal.toLocaleString('es-ES', { maximumFractionDigits: 2 })} m³/s</span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-700 truncate" title={c.nombre}>{c.nombre}</h4>
                  </div>
                ))}
              </div>
              {caudalesData.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  Cargando o sin datos disponibles...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
