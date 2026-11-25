import { Link } from 'react-router-dom';
import { REPO_URL, MEMORIA_URL } from '../lib/data';
import { FloatingLogos } from '../components/Logos';

const FIG = `${import.meta.env.BASE_URL}figuras/`;

const FLUJOS = [
  { file: 'fme-geocodificacion.webp', w: 1207, h: 278, titulo: 'Geocodificación de estaciones de aforo', texto: 'geocodingAPI.fmw. Las confederaciones no publican la posición de muchas estaciones, así que se geocodifican a partir de su nombre y su cuenca con la API de Google y se reproyectan. Procesa 498 estaciones.' },
  { file: 'fme-sentinel2.webp', w: 1181, h: 320, titulo: 'Escena Sentinel-2 por embalse', texto: 'satelite.fmw. Caja envolvente de cada polígono, petición al catálogo STAC, orden por nubosidad y una escena por embalse.' },
  { file: 'fme-energia.webp', w: 1245, h: 393, titulo: 'Análisis ráster y energía', texto: 'energia.fmw. Cotas del MDT de 200 m, buffer alrededor del embalse, estadísticas ráster y fórmula de energía para cada polígono.' },
  { file: 'pdi-caudales.webp', w: 912, h: 710, titulo: 'Normalización de caudales en Pentaho', texto: 'Transformación de PDI que une los CSV de cada confederación, añade constantes, renombra campos y carga el resultado en PostgreSQL.' },
];

const FUENTES = [
  { fuente: 'embalses.net', dato: 'Capacidad, agua embalsada y cambio semanal', acceso: 'Scraping de HTML', ciclo: 'Cada lunes' },
  { fuente: 'SAIH del MITECO', dato: 'Caudal en las estaciones de aforo de cada confederación', acceso: 'API REST, JWT, HTML, Selenium', ciclo: 'Cada lunes' },
  { fuente: 'OMIE', dato: 'Precio marginal del mercado diario', acceso: 'Fichero marginalpdbc', ciclo: 'Cada lunes' },
  { fuente: 'IGN, MDT200', dato: 'Cotas del terreno para calcular el salto', acceso: 'GeoTIFF', ciclo: 'Fijo, en FME' },
  { fuente: 'Geometrías de embalses', dato: 'Polígonos de las láminas de agua', acceso: 'Shapefile a PostGIS', ciclo: 'Fijo' },
  { fuente: 'Earth Search (STAC)', dato: 'Escenas Sentinel-2 L2A', acceso: 'API STAC, COG en AWS', ciclo: 'Fijo, en FME' },
];

const SCRIPTS = [
  { file: 'descarga_saih.py', txt: 'Descarga los caudales de cada SAIH adaptándose a cómo publica cada uno: API JSON, HTML con datos incrustados, tokens JWT o navegación con Selenium.' },
  { file: 'scraping.py', txt: 'Extrae el estado de los embalses por cuenca, normaliza las cifras a hm³ y lo guarda en CSV y, si hay conexión, en PostgreSQL.' },
  { file: 'consolidate_caudales.py', txt: 'Une los ficheros de las distintas confederaciones en un solo caudales.json.' },
  { file: 'geom.py y emparejamiento.py', txt: 'Empareja cada embalse con su polígono del inventario del MITECO comparando nombre normalizado, demarcación y capacidad, y exporta a PostGIS con ogr2ogr.' },
  { file: 'geocodingAPI, satelite y energia.fmw', txt: 'Geocodifican las estaciones, vinculan la mejor escena Sentinel-2 de cada embalse y calculan salto y energía sobre el MDT.' },
  { file: 'actualizar_geojson.py', txt: 'Fusiona los niveles nuevos sobre el GeoJSON publicado y recalcula energía (109 MWh por hm³) y valor al precio OMIE del día, sin tocar la geometría.' },
  { file: 'actualizar-datos.yml', txt: 'GitHub Actions ejecuta la cadena cada lunes, guarda los datos en el repositorio, compila la web y la publica en GitHub Pages.' },
];

const DECISIONES = [
  ['GeoJSON en EPSG:4326 como salida', 'Lo abre cualquier SIG y se sirve como fichero estático, sin servidor.'],
  ['Cada fuente falla por separado', 'Si una confederación cambia su web, el resto del pipeline sigue publicando.'],
  ['Geometría simplificada para la web', 'Douglas-Peucker con tolerancia de unos 10 m al compilar: un 80 % menos de vértices sin cambio visible a escala de embalse.'],
  ['Lo que cambia, cada semana; lo costoso, una vez', 'Niveles y precio se refrescan solos. El geoprocesamiento en FME se reutiliza entre ciclos.'],
  ['Mejor sin dibujar que mal dibujado', 'Si un embalse no tiene un polígono fiable por nombre, demarcación y capacidad, no se publica. Cada decisión queda en docs/revision_geometrias.csv.'],
];

const W = 'max-w-[1360px] mx-auto w-full px-5 sm:px-8';

export default function Metodologia() {
  return (
    <>
      <section className={`${W} pt-16 sm:pt-24 pb-20 relative`}>
        <FloatingLogos ids={['python', 'postgresql', 'gdal', 'qgis', 'pandas', 'githubactions']} />
        <div className="relative grid md:grid-cols-12 gap-x-8 gap-y-8">
          <h1 className="md:col-span-7 text-[56px] sm:text-[88px] leading-[0.92] tracking-[-0.02em]">
            Cómo se construye el modelo
          </h1>
          <p className="md:col-span-4 md:col-start-9 md:pt-24 text-[17px] leading-relaxed text-ink-2">
            Seis fuentes, siete piezas de código y una tarea programada. Esta página explica de dónde sale
            cada dato, qué script lo toca y qué limitaciones tiene el resultado.
          </p>
        </div>
      </section>

      {/* Fuentes */}
      <section className="border-t border-ink">
        <div className={`${W} py-20`}>
          <h2 className="text-[44px] sm:text-[56px] leading-[0.95] mb-10">Fuentes de datos</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[15px] border-collapse">
              <thead>
                <tr className="border-y border-ink text-left">
                  {['Fuente', 'Qué aporta', 'Cómo se obtiene', 'Se actualiza'].map((h) => (
                    <th key={h} scope="col" className="margin-note font-normal py-3 pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUENTES.map((f) => (
                  <tr key={f.fuente} className="border-b border-rule align-top">
                    <th scope="row" className="font-serif font-normal text-[22px] leading-tight py-4 pr-6 text-left whitespace-nowrap">{f.fuente}</th>
                    <td className="py-4 pr-6 text-ink-2">{f.dato}</td>
                    <td className="py-4 pr-6 num text-[13px] text-ink-2">{f.acceso}</td>
                    <td className={`py-4 whitespace-nowrap ${f.ciclo === 'Cada lunes' ? 'text-cobalt' : 'text-muted'}`}>{f.ciclo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Scripts */}
      <section className="border-t border-ink">
        <div className={`${W} py-20 grid md:grid-cols-12 gap-x-8 gap-y-10`}>
          <h2 className="md:col-span-4 text-[44px] sm:text-[56px] leading-[0.95] md:sticky md:top-28 self-start">
            El código, en el orden en que se ejecuta
          </h2>
          <ol className="md:col-span-7 md:col-start-6 border-t border-ink">
            {SCRIPTS.map((s, i) => (
              <li key={s.file} className="grid grid-cols-[3rem_1fr] gap-x-4 py-6 border-b border-rule">
                <span className="num text-[13px] text-muted pt-0.5">{i + 1}</span>
                <div>
                  <p className="num text-[14px] text-cobalt" translate="no">{s.file}</p>
                  <p className="text-[16px] leading-relaxed text-ink-2 mt-2 max-w-[62ch]">{s.txt}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Flujos */}
      <section className="border-t border-ink">
        <div className={`${W} py-20`}>
          <div className="grid md:grid-cols-12 gap-x-8 mb-12">
            <h2 className="md:col-span-7 text-[44px] sm:text-[56px] leading-[0.95]">Los flujos de FME y Pentaho, tal como son</h2>
            <p className="md:col-span-4 md:col-start-9 text-[15px] text-ink-2 self-end mt-4 md:mt-0">Capturas sacadas de los proyectos originales. Pulsa una para verla a tamaño completo.</p>
          </div>
          <div className="space-y-16">
            {FLUJOS.map((f) => (
              <figure key={f.file} className="m-0 grid md:grid-cols-12 gap-x-8 gap-y-5 items-start">
                <figcaption className="md:col-span-3">
                  <h3 className="text-[28px] leading-[1.05]">{f.titulo}</h3>
                  <p className="text-[15px] leading-relaxed text-ink-2 mt-3">{f.texto}</p>
                </figcaption>
                <a href={FIG + f.file} target="_blank" rel="noopener noreferrer"
                  className="md:col-span-9 block bg-white border border-rule p-3 sm:p-4 cursor-zoom-in hover:border-ink transition-colors duration-200"
                  aria-label={`Abrir a tamaño completo: ${f.titulo}`}>
                  <img src={FIG + f.file} width={f.w} height={f.h} loading="lazy" alt={`Captura del flujo: ${f.titulo}`} className="w-full h-auto" />
                </a>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Decisiones y límites */}
      <section className="border-t border-ink">
        <div className={`${W} py-20 grid md:grid-cols-12 gap-x-8 gap-y-16`}>
          <div className="md:col-span-7">
            <h2 className="text-[44px] sm:text-[56px] leading-[0.95] mb-10">Decisiones de diseño</h2>
            <dl className="border-t border-ink">
              {DECISIONES.map(([t, d]) => (
                <div key={t} className="py-5 border-b border-rule grid sm:grid-cols-[1fr_1.3fr] gap-x-8 gap-y-1">
                  <dt className="font-serif text-[22px] leading-tight">{t}</dt>
                  <dd className="text-[15px] leading-relaxed text-ink-2">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="md:col-span-4 md:col-start-9 md:pt-28">
            <h2 className="text-[36px] leading-none pb-4 border-b border-ink">Límites conocidos</h2>
            <ul className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-2">
              <li>La energía publicada usa un salto medio de 50 m para todos los embalses; el cálculo con el MDT de cada uno se hizo en FME. Supone el vaciado completo y no es un dato de explotación.</li>
              <li>No todos los embalses del inventario publican nivel cada semana. En el visor aparecen en gris.</li>
              <li>17 embalses de embalses.net no tienen un polígono fiable en el inventario y no aparecen en el mapa. Otros 23 se aceptaron con dudas y están marcados para revisar.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-ink">
        <div className={`${W} py-16 flex flex-wrap items-center gap-x-8 gap-y-4`}>
          <Link to="/visor" className="btn btn-ink">Abrir el visor</Link>
          <a href={MEMORIA_URL} target="_blank" rel="noopener noreferrer" className="link text-[15px]">Leer la memoria técnica (PDF)</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="link text-[15px]">Ver el código en GitHub</a>
        </div>
      </section>
    </>
  );
}
