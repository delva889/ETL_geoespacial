import { Link } from 'react-router-dom';
import { ArrowRight, Github, FileText, Satellite, Database, Workflow, Globe2, RefreshCw, Mountain } from 'lucide-react';
import HeroMap from '../components/HeroMap';
import { REPO_URL, MEMORIA_URL, useLastUpdate, fmt, fechaLarga } from '../lib/data';

const PIPELINE = [
  {
    n: '01', icon: Globe2, titulo: 'Adquisición',
    tools: 'Python · requests · BeautifulSoup · Selenium',
    desc: 'Scraping de embalses.net y de los portales SAIH de cada confederación (APIs, tokens y HTML heterogéneos).',
  },
  {
    n: '02', icon: Database, titulo: 'Normalización',
    tools: 'pandas · Pentaho PDI · rapidfuzz',
    desc: 'Limpieza, unificación de esquemas y emparejamiento difuso de nombres entre fuentes que no comparten identificadores.',
  },
  {
    n: '03', icon: Mountain, titulo: 'Geoprocesamiento',
    tools: 'FME · GeoPandas · PostGIS · ogr2ogr',
    desc: 'Reproyección, cruce con las geometrías oficiales de embalses y análisis ráster sobre el MDT de 200 m del IGN.',
  },
  {
    n: '04', icon: Satellite, titulo: 'Observación de la Tierra',
    tools: 'STAC · Sentinel-2 L2A · COG',
    desc: 'Búsqueda automática por bounding box y selección de la escena con menor nubosidad para cada embalse.',
  },
  {
    n: '05', icon: Workflow, titulo: 'Publicación',
    tools: 'GeoJSON · React · Leaflet',
    desc: 'Salida interoperable servida en un visor web que cualquiera puede consultar sin instalar nada.',
  },
];

const STACK: { grupo: string; items: string[] }[] = [
  { grupo: 'Datos', items: ['Python', 'pandas', 'GeoPandas', 'BeautifulSoup', 'Selenium', 'rapidfuzz'] },
  { grupo: 'SIG', items: ['FME', 'PostgreSQL / PostGIS', 'GDAL · ogr2ogr', 'Pentaho PDI', 'Shapefile · GeoPackage'] },
  { grupo: 'Observación de la Tierra', items: ['Copernicus Sentinel-2 L2A', 'STAC API', 'Cloud Optimized GeoTIFF', 'MDT200 (IGN)'] },
  { grupo: 'Automatización y web', items: ['GitHub Actions', 'GitHub Pages', 'React · TypeScript', 'Leaflet', 'Recharts'] },
];

export default function Proyecto() {
  const info = useLastUpdate();

  const kpis = [
    { label: 'Embalses georreferenciados', value: info?.total_geometrias, color: 'text-fg' },
    { label: 'Con lectura semanal', value: info?.embalses_con_datos, color: 'text-signal' },
    { label: 'Escenas Sentinel-2 vinculadas', value: info?.total_geometrias, color: 'text-fg' },
    { label: 'Estaciones de aforo SAIH', value: info?.estaciones_caudal, color: 'text-fg' },
    { label: 'Precio OMIE (€/MWh)', value: info?.precio_omie_eur_mwh, color: 'text-amber', decimals: 2 },
  ];

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative min-h-[620px] h-[calc(100svh-3.5rem)] max-h-[860px] overflow-hidden border-b border-line">
        <HeroMap />
        <div className="relative z-10 h-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="max-w-2xl fade-up">
            <p className="eyebrow mb-5">Proyecto · Ingeniería de datos geoespaciales</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
              Del dato disperso a la <span className="text-signal">inteligencia geoespacial</span>.
            </h1>
            <p className="text-base sm:text-lg text-fg-soft leading-relaxed mt-6 max-w-xl">
              Un pipeline ETL que integra los niveles de los embalses de España, los caudales del SAIH,
              el modelo digital del terreno, imágenes Sentinel-2 y el precio del mercado eléctrico en un único
              modelo geoespacial que se actualiza solo cada semana.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/visor"
                className="group inline-flex items-center gap-2 bg-signal text-void font-medium px-5 py-3 text-sm hover:bg-fg transition-colors">
                Abrir el visor
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-line-strong bg-void/60 px-5 py-3 text-sm text-fg hover:border-signal transition-colors">
                <Github size={16} /> Código
              </a>
              <a href={MEMORIA_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-line-strong bg-void/60 px-5 py-3 text-sm text-fg hover:border-signal transition-colors">
                <FileText size={16} /> Memoria técnica
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- KPIs EN VIVO ---------------- */}
      <section className="bg-void border-b border-line">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 pt-5 font-data text-[11px] text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-signal live-dot" />
            Datos del último ciclo automático
            {info?.timestamp && <span className="text-fg-soft">· {fechaLarga(info.timestamp)}</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 divide-line">
            {kpis.map((k, idx) => (
              <div key={k.label} className={`py-5 pr-4 ${idx > 0 ? 'md:border-l md:pl-5' : ''} border-line`}>
                <p className={`font-data text-2xl sm:text-3xl ${k.color}`}>
                  {k.value !== undefined ? fmt(k.value, k.decimals ?? 0) : '—'}
                </p>
                <p className="text-xs text-muted mt-1">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- RETO ---------------- */}
      <section className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16">
          <div>
            <p className="eyebrow mb-3">El reto</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              Los datos son abiertos. Lo difícil es que hablen entre sí.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-line border border-line">
            {[
              { k: '9', t: 'cuencas hidrográficas', d: 'Cada confederación publica sus datos con su propia estructura, API o tecnología web.' },
              { k: '0', t: 'identificadores comunes', d: 'Los nombres de embalses difieren entre fuentes: el cruce exige emparejamiento difuso de nombres.' },
              { k: '1', t: 'modelo unificado', d: 'Todo converge en un GeoJSON interoperable con geometría, estado hídrico, energía y escena satelital.' },
            ].map((c) => (
              <div key={c.t} className="bg-panel p-6">
                <p className="font-data text-4xl text-signal">{c.k}</p>
                <p className="font-display font-semibold mt-2">{c.t}</p>
                <p className="text-sm text-muted leading-relaxed mt-2">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- PIPELINE ---------------- */}
      <section className="border-y border-line bg-void relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow mb-3">Arquitectura</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Pipeline de extremo a extremo</h2>
            </div>
            <p className="inline-flex items-center gap-2 font-data text-xs text-fg-soft border border-line bg-panel px-3 py-2 self-start md:self-auto">
              <RefreshCw size={13} className="text-signal" />
              GitHub Actions · cada lunes 05:00 UTC
            </p>
          </div>

          <ol className="grid md:grid-cols-5 gap-px bg-line border border-line">
            {PIPELINE.map(({ n, icon: Icon, titulo, tools, desc }) => (
              <li key={n} className="bg-panel p-5 flex flex-col group hover:bg-raised transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <Icon size={20} strokeWidth={1.5} className="text-signal" />
                  <span className="font-data text-[11px] text-muted">{n}</span>
                </div>
                <h3 className="font-display text-lg font-semibold">{titulo}</h3>
                <p className="font-data text-[10.5px] text-signal/90 mt-1 leading-relaxed">{tools}</p>
                <p className="text-sm text-muted leading-relaxed mt-3">{desc}</p>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted mt-4 max-w-3xl">
            La automatización semanal refresca niveles, caudales y precio. La geometría, el análisis ráster y la
            vinculación de escenas se ejecutan en FME de escritorio y se conservan entre ciclos.
          </p>
        </div>
      </section>

      {/* ---------------- SENTINEL-2 + ENERGÍA ---------------- */}
      <section className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-24 grid lg:grid-cols-2 gap-6">
        <article className="corners min-w-0 border border-line bg-panel p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Satellite size={18} className="text-signal" strokeWidth={1.5} />
            <p className="eyebrow">Observación de la Tierra</p>
          </div>
          <h3 className="font-display text-2xl font-semibold tracking-tight">Una escena Sentinel-2 por embalse, sin búsqueda manual</h3>
          <p className="text-sm text-fg-soft leading-relaxed mt-3">
            Un flujo de FME extrae el bounding box de cada polígono, consulta el catálogo STAC de Earth Search
            (Element 84 / AWS), aplana la respuesta y conserva la captura L2A con menor cobertura de nubes.
            El enlace al Cloud Optimized GeoTIFF queda guardado como atributo del embalse.
          </p>
          <pre className="mt-6 bg-void border border-line p-4 font-data text-[11.5px] leading-relaxed text-fg-soft overflow-x-auto thin-scroll">
<span className="text-muted"># satelite.fmw — esquema simplificado</span>{'\n'}
<span className="text-signal">PostGIS</span>(embalses_geom){'\n'}
  → Reprojector → BoundsExtractor{'\n'}
  → HTTPCaller <span className="text-muted">POST /v1/search  sentinel-2-l2a</span>{'\n'}
  → JSONFragmenter → JSONFlattener{'\n'}
  → Sorter(<span className="text-amber">eo:cloud_cover ↑</span>) → Sampler(1){'\n'}
  → <span className="text-signal">PostGIS</span>(url_descarga = …/TCI.tif)
          </pre>
          <Link to="/visor" className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm text-signal hover:text-fg transition-colors">
            Ver la escena de cada embalse en el visor <ArrowRight size={14} />
          </Link>
        </article>

        <article className="corners min-w-0 border border-line bg-panel p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Mountain size={18} className="text-amber" strokeWidth={1.5} />
            <p className="eyebrow !text-amber">Análisis ráster</p>
          </div>
          <h3 className="font-display text-2xl font-semibold tracking-tight">Energía potencial a partir del relieve</h3>
          <p className="text-sm text-fg-soft leading-relaxed mt-3">
            Sobre el MDT de 200 m se toma la cota del embalse y la cota mínima en un buffer a su alrededor
            como posición del generador. El salto resultante alimenta el cálculo de energía potencial, que se
            valora con el precio del mercado mayorista (OMIE).
          </p>
          <div className="mt-6 bg-void border border-line p-5 flex-1 flex flex-col justify-center">
            <p className="font-data text-center text-lg sm:text-xl text-fg">
              E<sub className="text-xs">MWh</sub> = <span className="inline-flex flex-col align-middle mx-1 text-center">
                <span className="px-2 pb-1 border-b border-fg-soft">ρ · g · V · ΔH · η</span>
                <span className="pt-1">3,6 · 10⁹</span>
              </span>
            </p>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-6 font-data text-[11px]">
              {[
                ['ρ', '1000 kg/m³'],
                ['g', '9,81 m/s²'],
                ['V', 'volumen (m³)'],
                ['ΔH', 'Z(embalse) − h(generador)'],
                ['η', '0,80 (eficiencia)'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-amber w-6 shrink-0">{k}</dt><dd className="text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="text-[11px] text-muted mt-4">
            Estimación orientativa de vaciado completo; no sustituye a datos de explotación reales.
          </p>
        </article>
      </section>

      {/* ---------------- STACK ---------------- */}
      <section className="border-t border-line">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-4 gap-8">
          {STACK.map((s) => (
            <div key={s.grupo}>
              <p className="eyebrow mb-4">{s.grupo}</p>
              <ul className="flex flex-wrap gap-1.5">
                {s.items.map((it) => (
                  <li key={it} className="font-data text-[11.5px] text-fg-soft border border-line bg-panel px-2.5 py-1">{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="border-t border-line bg-void">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Explora el estado de los embalses</h2>
            <p className="text-sm text-muted mt-2">Mapa interactivo con imagen satelital, filtros por cuenca y ficha de cada embalse.</p>
          </div>
          <Link to="/visor"
            className="group inline-flex items-center gap-2 bg-signal text-void font-medium px-5 py-3 text-sm hover:bg-fg transition-colors self-start md:self-auto">
            Abrir el visor <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </>
  );
}
