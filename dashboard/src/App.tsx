import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';
import { Activity, ShieldAlert, Zap, BarChart3, Database, Euro } from 'lucide-react';

interface ReservoirFeature {
  type: string;
  properties: {
    pantano: string;
    cuenca: string;
    capacidad: any;
    embalsada: any;
    variacion: any;
    timestamp: string;
    mwh_max: any;
    mwh_conocidos: any;
    precio_actual: any;
    precio_max: any;
    url_descarga: string;
  };
  geometry: any;
}

export default function App() {
  const [data, setData] = useState<any>(null);
  const [scrapeDate, setScrapeDate] = useState<string>("Desconocida");
  const mapRef = useRef<any>(null);
  const geoJsonRef = useRef<any>(null);

  const handleFlyTo = (pantanoName: string) => {
    if (mapRef.current && geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer: any) => {
        if (layer.feature && layer.feature.properties && layer.feature.properties.pantano === pantanoName) {
          const bounds = layer.getBounds();
          mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
          layer.openPopup();
        }
      });
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.geojson`)
      .then(res => {
        if (!res.ok) throw new Error("Error fetching data");
        return res.json();
      })
      .then(json => {
        setData(json);
        if (json.features && json.features.length > 0) {
          const rawDate = json.features[0].properties.timestamp;
          if (rawDate) {
            setScrapeDate(new Date(rawDate).toLocaleString('es-ES'));
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  const stats = useMemo(() => {
    if (!data) return { totalCap: 0, totalEmb: 0, totalVar: 0, pct: 0, totalMwh: 0, totalValue: 0, byCuenca: [] };
    
    let totalCap = 0;
    let totalEmb = 0;
    let totalVar = 0;
    let totalMwh = 0;
    let totalValue = 0;
    
    const cuencas: Record<string, { capacidad: number; embalsada: number; variacion: number }> = {};

    data.features.forEach((f: ReservoirFeature) => {
      const rawCap = f.properties.capacidad;
      const rawEmb = f.properties.embalsada;
      const rawVar = f.properties.variacion;
      
      const mwh = parseFloat(f.properties.mwh_conocidos) || 0;
      const value = parseFloat(f.properties.precio_actual) || 0;

      const cap = isNaN(parseFloat(rawCap)) ? 0 : parseFloat(rawCap);
      const emb = isNaN(parseFloat(rawEmb)) ? 0 : parseFloat(rawEmb);
      const vari = isNaN(parseFloat(rawVar)) ? 0 : parseFloat(rawVar);

      totalCap += cap;
      totalEmb += emb;
      totalVar += vari;
      totalMwh += mwh;
      totalValue += value;

      const cuenca = f.properties.cuenca || 'DESCONOCIDA';
      if (!cuencas[cuenca]) {
        cuencas[cuenca] = { capacidad: 0, embalsada: 0, variacion: 0, mwh: 0, value: 0 };
      }
      cuencas[cuenca].capacidad += cap;
      cuencas[cuenca].embalsada += emb;
      cuencas[cuenca].variacion += vari;
      cuencas[cuenca].mwh += (mwh / 1000); // Guardamos en GWh para gráficas
      cuencas[cuenca].value += (value / 1000000); // Guardamos en Millones de € para gráficas
    });

    const byCuenca = Object.entries(cuencas).map(([name, vals]) => ({
      name,
      ...vals
    })).sort((a, b) => b.capacidad - a.capacidad);

    const top10 = [...data.features]
      .filter((f: any) => !isNaN(parseFloat(f.properties.mwh_conocidos)))
      .sort((a: any, b: any) => parseFloat(b.properties.mwh_conocidos) - parseFloat(a.properties.mwh_conocidos))
      .slice(0, 10)
      .map((f: any) => ({
        nombre: f.properties.pantano,
        mwh: parseFloat(f.properties.mwh_conocidos)
      }));

    return {
      totalCap,
      totalEmb,
      totalVar,
      totalMwh,
      totalValue,
      pct: totalCap > 0 ? (totalEmb / totalCap) * 100 : 0,
      byCuenca,
      top10
    };
  }, [data]);

  const getPctColor = (pct: number) => {
    if (pct < 35) return '#ff2a2a'; 
    if (pct < 70) return '#ffb300'; 
    return '#00e5ff'; 
  };

  const geoJsonStyle = (feature: any) => {
    const rawCap = feature.properties.capacidad;
    const rawEmb = feature.properties.embalsada;
    const cap = isNaN(parseFloat(rawCap)) ? 0 : parseFloat(rawCap);
    const emb = isNaN(parseFloat(rawEmb)) ? 0 : parseFloat(rawEmb);
    
    const pct = cap > 0 ? (emb / cap) * 100 : 0;
    const color = getPctColor(pct);
    
    return {
      fillColor: color,
      weight: 2,
      opacity: 0.9,
      color: color, 
      fillOpacity: 0.25
    };
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#090b10] text-[#00e5ff] font-mono text-lg">
        <p className="tracking-widest animate-pulse">INICIALIZANDO SISTEMAS TELEMÉTRICOS...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#090b10] text-gray-300 font-sans selection:bg-[#00e5ff] selection:text-black flex flex-col overflow-hidden">
      <header className="border-b border-gray-800 bg-[#0d1117] p-4 flex flex-col md:flex-row justify-between items-center z-10 shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">
              Modelo de transformación e integración
            </h1>
            <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">
              de datos geoespaciales aplicado a la energía hidráulica en España
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-8 font-mono text-sm text-gray-400">
          <div className="flex flex-col items-end">
            <span className="uppercase text-xs text-gray-500">Autor</span>
            <span className="text-[#00e5ff] font-semibold text-base">Carlos del Valle</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="uppercase text-xs text-gray-500">Última actualización (Scraping)</span>
            <span className="text-gray-300 text-base">{scrapeDate}</span>
          </div>
        </div>
      </header>

      <main className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-5 flex-grow overflow-hidden">
        <div className="xl:col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
          <div className="bg-[#12161f] border border-gray-800 rounded-sm p-4 relative overflow-hidden group shrink-0">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3b82f6] opacity-50"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Volumen Embalsado (hm³)</h3>
              <Activity size={16} className="text-gray-500" />
            </div>
            <p className="text-2xl font-mono font-medium text-white">{stats.totalEmb.toLocaleString('es-ES', { maximumFractionDigits: 0 })} <span className="text-sm text-gray-500">/ {stats.totalCap.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span></p>
          </div>

          <div className="bg-[#12161f] border border-gray-800 rounded-sm p-4 relative overflow-hidden group shrink-0">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#00e5ff] opacity-70"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Energía Potencial</h3>
              <Zap size={16} className="text-gray-500" />
            </div>
            <p className="text-2xl font-mono font-medium text-white">{stats.totalMwh.toLocaleString('es-ES', { maximumFractionDigits: 0 })} <span className="text-sm text-gray-500">MWh</span></p>
          </div>
          
          <div className="bg-[#12161f] border border-gray-800 rounded-sm p-4 relative overflow-hidden group shrink-0">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#10b981] opacity-70"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Mercado Estimado</h3>
              <Euro size={16} className="text-gray-500" />
            </div>
            <p className="text-2xl font-mono font-medium text-white">{(stats.totalValue / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} <span className="text-sm text-gray-500">M€</span></p>
          </div>

          <div className="bg-[#12161f] border border-gray-800 rounded-sm p-4 relative overflow-hidden shrink-0">
            <div className={`absolute top-0 left-0 w-1 h-full opacity-70 ${stats.pct < 40 ? 'bg-[#ff2a2a]' : 'bg-[#00e5ff]'}`}></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Nivel Nacional</h3>
              <ShieldAlert size={16} className={stats.pct < 40 ? "text-[#ff2a2a]" : "text-gray-500"} />
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-mono font-bold ${stats.pct < 40 ? 'text-[#ff2a2a]' : 'text-white'}`}>
                {stats.pct.toFixed(1)}<span className="text-sm">%</span>
              </p>
            </div>
          </div>

          <div className="bg-[#12161f] border border-gray-800 rounded-sm p-3 mt-1 flex flex-col flex-grow min-h-[160px] overflow-hidden">
             <div className="border-b border-gray-800 pb-2 mb-3 shrink-0">
               <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-wider text-center">Top 10 Embalses Estratégicos (MWh)</h3>
             </div>
             <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
               {stats.top10.map((t, idx) => (
                 <div 
                   key={idx} 
                   className="flex justify-between items-center text-xs font-mono cursor-pointer hover:bg-[#1e293b] p-1 rounded transition-colors"
                   onClick={() => handleFlyTo(t.nombre)}
                 >
                   <span className="text-gray-300 truncate w-32" title={t.nombre}>{idx + 1}. {t.nombre}</span>
                   <span className="text-[#00e5ff] font-bold">{t.mwh.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="xl:col-span-6 bg-[#12161f] border border-gray-800 rounded-sm flex flex-col relative h-[500px] xl:h-full overflow-hidden">
          <div className="flex-grow w-full bg-[#0a0a0a] relative z-0">
            <MapContainer 
              center={[40.0, -3.5]} 
              zoom={6} 
              zoomControl={true}
              style={{ height: '100%', width: '100%', backgroundColor: '#090b10' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
              />
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              />
              
              <GeoJSON 
                key="reservoirs-layer"
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
                  
                  const varColor = vari < 0 ? '#ffb300' : '#00e5ff';
                  const varSign = vari > 0 ? '+' : '';

                  layer.bindPopup(`
                    <div style="background: #1e293b; padding: 6px; font-family: monospace; color: #d1d5db; min-width: 240px;">
                      <div style="color: #ffffff; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 8px; text-transform: uppercase; font-weight: bold; font-size: 14px;">
                        ${feature.properties.pantano}
                      </div>
                      <table style="width: 100%; font-size: 12px; line-height: 1.6;">
                        <tr><td style="color: #94a3b8; padding-right: 12px;">CUENCA</td><td style="text-align: right;">${feature.properties.cuenca}</td></tr>
                        <tr><td style="color: #94a3b8; padding-right: 12px;">VOLUMEN</td><td style="text-align: right; color: #fff;">${emb} hm³ / ${cap} hm³</td></tr>
                        <tr><td style="color: #94a3b8; padding-right: 12px;">LLENADO</td><td style="text-align: right; color: ${getPctColor(parseFloat(pct))}; font-weight: bold; font-size: 13px;">${pct}%</td></tr>
                        <tr><td style="color: #94a3b8; padding-right: 12px;">CAUDAL NETO</td><td style="text-align: right; color: ${varColor}; font-weight: bold; font-size: 13px;">${varSign}${vari} hm³</td></tr>
                        <tr><td colspan="2"><hr style="border-color: #334155; margin: 4px 0;"></td></tr>
                        <tr><td style="color: #94a3b8; padding-right: 12px;">ENERGÍA POT.</td><td style="text-align: right; color: #facc15; font-weight: bold;">${parseFloat(mwhCon).toLocaleString('es-ES', {maximumFractionDigits:0})} MWh</td></tr>
                        <tr><td style="color: #94a3b8; padding-right: 12px;">MERCADO</td><td style="text-align: right; color: #10b981; font-weight: bold;">${parseFloat(precioActual).toLocaleString('es-ES', {maximumFractionDigits:0})} €</td></tr>
                      </table>
                    </div>
                  `, { className: 'industrial-popup' });
                }}
              />
            </MapContainer>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 z-[400] flex justify-between items-center pointer-events-none">
            <div className="bg-[#090b10]/90 backdrop-blur border border-gray-800 px-4 py-2 rounded-sm flex gap-6 text-xs font-mono text-gray-300">
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#ff2a2a] inline-block border border-gray-900"></span> CRÍTICO (&lt;35%)</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#ffb300] inline-block border border-gray-900"></span> ALERTA (35-70%)</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#00e5ff] inline-block border border-gray-900"></span> NOMINAL (&gt;70%)</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 flex flex-col gap-5 overflow-y-auto overflow-x-visible custom-scrollbar pr-2 pb-4">
          {/* FME RESULTS CHART: ENERGY AND MARKET VALUE */}
          <div className="bg-[#12161f] border border-gray-800 rounded-sm p-5 flex-grow min-h-[550px] flex flex-col group relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#10b981] opacity-70"></div>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
              <Zap size={18} className="text-[#10b981]" />
              <h3 className="text-sm font-mono text-gray-300 uppercase tracking-wider">Potencial Energético (FME)</h3>
            </div>
            <div className="flex-grow w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCuenca} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" scale="sqrt" domain={[0, 'dataMax']} stroke="#4b5563" tick={{fontSize: 12, fill: '#d1d5db'}} tickLine={false} axisLine={{stroke: '#1f2937'}} tickFormatter={(v) => v.toFixed(0)} />
                  <YAxis dataKey="name" type="category" stroke="#4b5563" tick={{fontSize: 10, fill: '#d1d5db'}} width={130} tickLine={false} axisLine={false} interval={0} />
                  <RechartsTooltip 
                    cursor={{fill: '#1f2937', opacity: 0.4}} 
                    contentStyle={{backgroundColor: '#090b10', borderColor: '#374151', color: '#e5e7eb', fontFamily: 'monospace', fontSize: '13px', zIndex: 1000}}
                    itemStyle={{color: '#00e5ff'}}
                    formatter={(value: number) => value.toFixed(2)}
                  />
                  <Bar dataKey="value" name="Mercado (Millones €)" fill="#10b981" barSize={10} minPointSize={4} />
                  <Bar dataKey="mwh" name="Energía (GWh)" fill="#facc15" barSize={10} minPointSize={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#12161f] border border-gray-800 rounded-sm p-5 flex-grow min-h-[550px] flex flex-col relative">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
              <BarChart3 size={18} className="text-[#00e5ff]" />
              <h3 className="text-sm font-mono text-gray-300 uppercase tracking-wider">Flujo de Variación (hm³)</h3>
            </div>
            <div className="flex-grow w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCuenca} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke="#4b5563" tick={{fontSize: 12, fill: '#d1d5db'}} tickLine={false} axisLine={{stroke: '#1f2937'}} tickFormatter={(v) => v.toFixed(0)} />
                  <YAxis dataKey="name" type="category" stroke="#4b5563" tick={{fontSize: 10, fill: '#d1d5db'}} width={130} tickLine={false} axisLine={false} interval={0} />
                  <RechartsTooltip 
                    cursor={{fill: '#1f2937', opacity: 0.4}} 
                    contentStyle={{backgroundColor: '#090b10', borderColor: '#374151', color: '#e5e7eb', fontFamily: 'monospace', fontSize: '13px', zIndex: 1000}}
                    itemStyle={{color: '#00e5ff', fontWeight: 'bold'}}
                    formatter={(value: number) => value.toFixed(2)}
                  />
                  <ReferenceLine x={0} stroke="#4b5563" />
                  <Bar dataKey="variacion" name="Flujo Neto (hm³)" barSize={10}>
                    {stats.byCuenca.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.variacion < 0 ? '#ffb300' : '#00e5ff'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#12161f] border border-gray-800 rounded-sm p-5 flex-grow min-h-[550px] flex flex-col relative">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
              <Database size={18} className="text-[#3b82f6]" />
              <h3 className="text-sm font-mono text-gray-300 uppercase tracking-wider">Volumen por Cuenca (hm³)</h3>
            </div>
            <div className="flex-grow w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCuenca} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" scale="sqrt" domain={[0, 'dataMax']} stroke="#4b5563" tick={{fontSize: 12, fill: '#d1d5db'}} tickLine={false} axisLine={{stroke: '#1f2937'}} tickFormatter={(v) => v.toFixed(0)} />
                  <YAxis dataKey="name" type="category" stroke="#4b5563" tick={{fontSize: 10, fill: '#d1d5db'}} width={130} tickLine={false} axisLine={false} interval={0} />
                  <RechartsTooltip 
                    cursor={{fill: '#1f2937', opacity: 0.4}} 
                    contentStyle={{backgroundColor: '#090b10', borderColor: '#374151', color: '#e5e7eb', fontFamily: 'monospace', fontSize: '13px', zIndex: 1000}}
                    itemStyle={{color: '#00e5ff'}}
                    formatter={(value: number) => value.toFixed(2)}
                  />
                  <Bar dataKey="capacidad" name="Capacidad Total" fill="#1f2937" barSize={10} minPointSize={4} />
                  <Bar dataKey="embalsada" name="Volumen Actual" fill="#3b82f6" barSize={10} minPointSize={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
