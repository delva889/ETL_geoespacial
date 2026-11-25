import { Link } from 'react-router-dom';
import { REPO_URL, MEMORIA_URL } from '../lib/data';
import { FloatingLogos } from '../components/Logos';
import { Captura, FIGURAS, type Figura } from '../components/Figuras';

const W = 'max-w-[1280px] mx-auto w-full px-5 sm:px-8';
const FME_URL = `${REPO_URL}/tree/main/fme_workspaces`;

const FUENTES = [
  { fuente: 'embalses.net', dato: 'Capacidad, agua embalsada y cambio semanal', acceso: 'Scraping', ciclo: 'Cada lunes' },
  { fuente: 'SAIH del MITECO', dato: 'Caudal en las estaciones de aforo', acceso: 'Scraping', ciclo: 'Cada lunes' },
  { fuente: 'OMIE', dato: 'Precio marginal del mercado diario', acceso: 'Descarga de fichero', ciclo: 'Cada lunes' },
  { fuente: 'IGN, MDT200', dato: 'Cotas del terreno para calcular el salto', acceso: 'GeoTIFF', ciclo: 'Fijo, en FME' },
  { fuente: 'Inventario de presas y embalses (MITECO)', dato: 'Polígonos de las láminas de agua', acceso: 'Shapefile a PostGIS', ciclo: 'Fijo' },
  { fuente: 'Earth Search (STAC)', dato: 'Escenas Copernicus Sentinel-2 L2A', acceso: 'API STAC', ciclo: 'Fijo, en FME' },
];

const SCRAPING = [
  {
    origen: 'embalses.net',
    que: 'La tabla de cada cuenca hidrográfica: nombre del embalse, capacidad, agua embalsada y variación respecto a la semana anterior, en hm³.',
    como: 'Lectura del HTML de cada página de cuenca.',
  },
  {
    origen: 'SAIH de las confederaciones',
    que: 'El caudal más reciente de las estaciones de aforo de Duero, Tajo, Segura, Júcar, Ebro, Guadalquivir, Miño-Sil, Cantábrico y Guadiana.',
    como: 'Cada portal publica distinto: APIs JSON, tablas HTML, valores incrustados en la página o datos que solo aparecen tras abrirla con un navegador automatizado y obtener un token.',
  },
  {
    origen: 'OMIE',
    que: 'El precio marginal del mercado eléctrico diario, que se usa para valorar la energía almacenada.',
    como: 'Descarga del fichero diario publicado por el operador del mercado.',
  },
];

const DECISIONES = [
  ['GeoJSON en EPSG:4326 como salida', 'Lo abre cualquier SIG y se sirve como fichero estático, sin servidor.'],
  ['Cada fuente falla por separado', 'Si una confederación cambia su web, el resto del proceso sigue publicando.'],
  ['Cada embalse con su polígono oficial', 'Se emparejan por nombre, demarcación y capacidad. Si no hay un polígono fiable, el embalse no se dibuja.'],
  ['Geometría simplificada para la web', 'Douglas-Peucker con tolerancia de unos 10 m: un 80 % menos de vértices sin cambio visible a escala de embalse.'],
  ['Lo que cambia, cada semana; lo costoso, una vez', 'Niveles y precio se refrescan solos. El geoprocesamiento en FME se reutiliza entre ciclos.'],
];

function Flujo({ fig }: { fig: Figura }) {
  return (
    <div className="grid lg:grid-cols-12 gap-x-10 gap-y-5 items-start">
      <div className="lg:col-span-4">
        <h3 className="text-[22px] leading-tight">{fig.titulo}</h3>
        <p className="text-[15px] leading-relaxed text-ink-2 mt-3">{fig.texto}</p>
        {fig.fuente && (
          <a href={`${REPO_URL}/blob/main/fme_workspaces/${fig.fuente}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex mt-4 num text-[13px] text-cobalt hover:underline underline-offset-4">
            {fig.fuente}
          </a>
        )}
      </div>
      <div className="lg:col-span-8">
        <Captura fig={fig} />
      </div>
    </div>
  );
}

export default function Metodologia() {
  return (
    <>
      <section className={`${W} pt-16 sm:pt-24 pb-20 relative`}>
        <FloatingLogos ids={['python', 'postgresql', 'gdal', 'qgis', 'pandas', 'githubactions']} />
        <div className="relative grid md:grid-cols-12 gap-x-8 gap-y-8">
          <h1 className="md:col-span-7 text-[44px] sm:text-[68px] leading-[1] tracking-[-0.045em]">
            Cómo se construye el modelo
          </h1>
          <p className="md:col-span-4 md:col-start-9 md:pt-16 text-[17px] leading-relaxed text-ink-2">
            De dónde sale cada dato, qué se extrae por scraping y cómo se transforma en FME y Pentaho
            hasta llegar al visor.
          </p>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className={`${W} py-20`}>
          <h2 className="text-[34px] sm:text-[46px] leading-[1.02] mb-10">Fuentes de datos</h2>
          <div className="overflow-x-auto panel">
            <table className="w-full min-w-[720px] text-[15px] border-collapse">
              <thead>
                <tr className="border-b border-rule text-left bg-paper-2">
                  {['Fuente', 'Qué aporta', 'Cómo se obtiene', 'Se actualiza'].map((h) => (
                    <th key={h} scope="col" className="margin-note font-normal py-3 px-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUENTES.map((f) => (
                  <tr key={f.fuente} className="border-b border-rule last:border-b-0 align-top">
                    <th scope="row" className="font-semibold text-[15px] py-4 px-5 text-left">{f.fuente}</th>
                    <td className="py-4 px-5 text-ink-2">{f.dato}</td>
                    <td className="py-4 px-5 text-ink-2">{f.acceso}</td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[13px] ${f.ciclo === 'Cada lunes' ? 'bg-cobalt/10 text-cobalt' : 'bg-paper-2 text-muted'}`}>{f.ciclo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${W} py-20 grid lg:grid-cols-12 gap-x-10 gap-y-10`}>
          <div className="lg:col-span-4">
            <h2 className="text-[34px] sm:text-[46px] leading-[1.02]">Qué se extrae por scraping</h2>
            <p className="text-[16px] leading-relaxed text-ink-2 mt-5">
              Ninguna de estas fuentes ofrece una descarga unificada, así que la información se extrae de sus webs de forma
              automática cada lunes con Python (requests, BeautifulSoup y Selenium).
            </p>
          </div>
          <ul className="lg:col-span-7 lg:col-start-6 divide-y divide-rule border-y border-rule">
            {SCRAPING.map((s) => (
              <li key={s.origen} className="py-6 grid sm:grid-cols-[200px_1fr] gap-x-6 gap-y-2">
                <p className="font-semibold text-[17px]">{s.origen}</p>
                <div>
                  <p className="text-[16px] leading-relaxed">{s.que}</p>
                  <p className="text-[14px] leading-relaxed text-muted mt-2">{s.como}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className={`${W} py-20`}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <h2 className="text-[34px] sm:text-[46px] leading-[1.02]">Flujos de FME</h2>
            <a href={FME_URL} target="_blank" rel="noopener noreferrer" className="btn btn-line self-start md:self-auto">
              Ver los archivos .fmw en GitHub
            </a>
          </div>
          <div className="space-y-20">
            <Flujo fig={FIGURAS.geocodificacion} />
            <Flujo fig={FIGURAS.sentinel} />
            <Flujo fig={FIGURAS.energia} />
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${W} py-20`}>
          <h2 className="text-[34px] sm:text-[46px] leading-[1.02] mb-4">Flujo de Pentaho PDI</h2>
          <p className="text-[16px] text-ink-2 mb-14 max-w-[60ch]">
            Normalización de los caudales de las confederaciones antes de cargarlos en PostgreSQL.
          </p>
          <Flujo fig={FIGURAS.caudales} />
        </div>
      </section>

      <section>
        <div className={`${W} py-20 grid md:grid-cols-12 gap-x-8 gap-y-16`}>
          <div className="md:col-span-7">
            <h2 className="text-[34px] sm:text-[46px] leading-[1.02] mb-10">Decisiones de diseño</h2>
            <dl className="border-t border-rule">
              {DECISIONES.map(([t, d]) => (
                <div key={t} className="py-5 border-b border-rule grid sm:grid-cols-[1fr_1.3fr] gap-x-8 gap-y-1">
                  <dt className="font-semibold text-[16px] leading-snug">{t}</dt>
                  <dd className="text-[15px] leading-relaxed text-ink-2">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="md:col-span-4 md:col-start-9 md:pt-24">
            <div className="panel p-6 bg-[#fff8eb] border-[#f5dfb3]">
              <h2 className="text-[22px] leading-tight pb-4 border-b border-[#f5dfb3]">Límites conocidos</h2>
              <ul className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-2">
                <li>La energía publicada usa un salto medio de 50 m para todos los embalses; el cálculo con el MDT de cada uno se hizo en FME. Supone el vaciado completo y no es un dato de explotación.</li>
                <li>No todos los embalses publican nivel cada semana. En el visor aparecen en gris.</li>
                <li>Algunos portales SAIH no responden desde servidores fuera de España, así que sus caudales pueden faltar en una semana concreta.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className={`${W} py-16 flex flex-wrap items-center gap-x-8 gap-y-4`}>
          <Link to="/" className="btn btn-ink">Abrir el visor</Link>
          <a href={MEMORIA_URL} target="_blank" rel="noopener noreferrer" className="link text-[15px]">Leer la memoria técnica (PDF)</a>
          <a href={FME_URL} target="_blank" rel="noopener noreferrer" className="link text-[15px]">Archivos de FME en GitHub</a>
        </div>
      </section>
    </>
  );
}
