import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Github } from 'lucide-react';
import { REPO_URL, MEMORIA_URL } from '../lib/data';

const FUENTES = [
  { fuente: 'embalses.net', dato: 'Capacidad, volumen embalsado y variación semanal', acceso: 'Web scraping (HTML)', ciclo: 'Semanal · CI' },
  { fuente: 'MITECO · SAIH', dato: 'Caudal en estaciones de aforo de cada confederación', acceso: 'APIs REST, JWT, HTML, Selenium', ciclo: 'Semanal · CI' },
  { fuente: 'OMIE', dato: 'Precio marginal del mercado diario (€/MWh)', acceso: 'Fichero marginalpdbc', ciclo: 'Semanal · CI' },
  { fuente: 'IGN · MDT200', dato: 'Cotas del terreno para el salto hidráulico', acceso: 'GeoTIFF', ciclo: 'Estático · FME' },
  { fuente: 'Geometrías de embalses', dato: 'Polígonos de las láminas de agua', acceso: 'Shapefile → PostGIS', ciclo: 'Estático' },
  { fuente: 'Earth Search (STAC)', dato: 'Escenas Copernicus Sentinel-2 L2A', acceso: 'API STAC · COG en AWS', ciclo: 'Estático · FME' },
];

const PASOS = [
  { file: 'descarga_saih.py', txt: 'Descarga los caudales de cada SAIH adaptándose a su tecnología: API JSON, HTML con datos incrustados, tokens JWT o navegación con Selenium.' },
  { file: 'scraping.py', txt: 'Extrae el estado de los embalses por cuenca, normaliza las cifras (hm³) y lo guarda en CSV y, si está disponible, en PostgreSQL.' },
  { file: 'consolidate_caudales.py', txt: 'Unifica los ficheros heterogéneos de las confederaciones en un único caudales.json.' },
  { file: 'geom.py', txt: 'Empareja nombres entre el inventario de geometrías y los datos tabulares con similitud textual (rapidfuzz) y exporta a PostGIS con ogr2ogr.' },
  { file: 'FME · geocodingAPI / satelite / energia', txt: 'Geocodifica estaciones, vincula la mejor escena Sentinel-2 de cada embalse y calcula el salto y la energía sobre el MDT.' },
  { file: 'actualizar_geojson.py', txt: 'Fusiona los niveles nuevos y el precio OMIE del día sobre el GeoJSON publicado, sin tocar geometría ni análisis ráster.' },
  { file: 'actualizar-datos.yml', txt: 'GitHub Actions ejecuta la cadena cada lunes, commitea los datos, compila la web y la publica en GitHub Pages.' },
];

const DECISIONES = [
  ['GeoJSON (EPSG:4326) como formato de salida', 'Interoperable, legible por cualquier SIG y servible como fichero estático sin backend.'],
  ['Fallos aislados por fuente', 'Si una confederación cambia su web, el resto del pipeline sigue publicando.'],
  ['Geometría simplificada para la web', 'Douglas-Peucker (≈10 m) en el build: ~80 % menos vértices sin cambio visible a escala de embalse.'],
  ['Separar lo dinámico de lo costoso', 'Niveles y precios se refrescan cada semana; el geoprocesamiento pesado se reutiliza entre ciclos.'],
];

export default function Metodologia() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow mb-3">Metodología</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Cómo se construye el modelo</h1>
        <p className="text-fg-soft leading-relaxed mt-4">
          En España la información hidrológica es abierta, pero está repartida entre confederaciones que no comparten
          formatos ni identificadores. El objetivo es convertir esas fuentes aisladas en un modelo geoespacial único,
          trazable y actualizado, que permita analizar el estado de los embalses y su potencial energético a escala nacional.
        </p>
      </header>

      {/* Fuentes */}
      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold mb-4">Fuentes de datos</h2>
        <div className="border border-line overflow-x-auto thin-scroll">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-void text-left">
                {['Fuente', 'Dato', 'Acceso', 'Ciclo'].map((h) => (
                  <th key={h} className="font-data text-[10.5px] tracking-wider uppercase text-muted font-normal px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FUENTES.map((f) => (
                <tr key={f.fuente} className="bg-panel hover:bg-raised transition-colors">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{f.fuente}</td>
                  <td className="px-4 py-3 text-fg-soft">{f.dato}</td>
                  <td className="px-4 py-3 font-data text-[12px] text-muted">{f.acceso}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-data text-[11px] px-2 py-0.5 border ${f.ciclo.includes('CI') ? 'text-signal border-signal/40' : 'text-muted border-line-strong'}`}>
                      {f.ciclo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Proceso */}
      <section className="mt-14 grid lg:grid-cols-[1fr_1fr] gap-10">
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Proceso, paso a paso</h2>
          <ol className="relative border-l border-line-strong ml-2">
            {PASOS.map((p, i) => (
              <li key={p.file} className="pl-6 pb-6 last:pb-0 relative">
                <span className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] bg-base border border-signal" />
                <p className="font-data text-[12px] text-signal">
                  <span className="text-muted mr-2">{String(i + 1).padStart(2, '0')}</span>{p.file}
                </p>
                <p className="text-sm text-fg-soft leading-relaxed mt-1">{p.txt}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-display text-xl font-semibold mb-4">Decisiones de diseño</h2>
            <div className="grid gap-px bg-line border border-line">
              {DECISIONES.map(([t, d]) => (
                <div key={t} className="bg-panel p-4">
                  <p className="font-medium text-sm">{t}</p>
                  <p className="text-sm text-muted leading-relaxed mt-1">{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-amber/30 bg-amber-dim p-5">
            <p className="font-data text-[10.5px] tracking-wider uppercase text-amber mb-2">Limitaciones</p>
            <ul className="text-sm text-fg-soft leading-relaxed space-y-1.5 list-disc pl-4 marker:text-amber">
              <li>La energía y el valor de mercado son estimaciones de vaciado completo, no datos de explotación.</li>
              <li>No todos los embalses del inventario tienen lectura semanal publicada; se muestran en gris.</li>
              <li>El emparejamiento por nombre puede asignar alguna geometría de forma incorrecta y requiere revisión manual.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-16 flex flex-wrap gap-3">
        <Link to="/visor" className="group inline-flex items-center gap-2 bg-signal text-void font-medium px-5 py-3 text-sm hover:bg-fg transition-colors">
          Ir al visor <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <a href={MEMORIA_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-line-strong px-5 py-3 text-sm hover:border-signal transition-colors">
          <FileText size={16} /> Memoria técnica completa
        </a>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-line-strong px-5 py-3 text-sm hover:border-signal transition-colors">
          <Github size={16} /> Código fuente
        </a>
      </section>
    </div>
  );
}
