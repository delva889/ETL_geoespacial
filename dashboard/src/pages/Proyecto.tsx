import { Link } from 'react-router-dom';
import HeroMap from '../components/HeroMap';
import { REPO_URL, MEMORIA_URL, useLastUpdate, fmt } from '../lib/data';

const PASOS = [
  {
    titulo: 'Descarga',
    herramientas: 'Python, requests, BeautifulSoup, Selenium',
    texto: 'Lee embalses.net y el SAIH de cada confederación. Cada una publica distinto: una API JSON, una tabla HTML, un token JWT o una página que hay que abrir con un navegador automatizado.',
  },
  {
    titulo: 'Limpieza y cruce',
    herramientas: 'pandas, Pentaho PDI, rapidfuzz',
    texto: 'Unifica unidades y esquemas. Como las fuentes no comparten identificadores, los embalses se emparejan por similitud de nombre.',
  },
  {
    titulo: 'Geoprocesamiento',
    herramientas: 'FME, GeoPandas, PostGIS, ogr2ogr',
    texto: 'Reproyecta, une cada registro con su polígono y extrae del MDT de 200 m la cota del embalse y la del punto más bajo a su alrededor.',
  },
  {
    titulo: 'Imagen de satélite',
    herramientas: 'STAC, Sentinel-2 L2A, COG',
    texto: 'Busca en el catálogo de Earth Search la escena con menos nubes sobre cada embalse y guarda el enlace al GeoTIFF.',
  },
  {
    titulo: 'Publicación',
    herramientas: 'GeoJSON, React, Leaflet, GitHub Actions',
    texto: 'Cada lunes a las 05:00 UTC se refrescan niveles, caudales y precio, se compila la web y se publica en GitHub Pages.',
  },
];

const HERRAMIENTAS: [string, string[]][] = [
  ['Datos', ['Python', 'pandas', 'GeoPandas', 'BeautifulSoup', 'Selenium', 'rapidfuzz']],
  ['SIG', ['FME', 'PostgreSQL y PostGIS', 'GDAL / ogr2ogr', 'Pentaho PDI']],
  ['Observación de la Tierra', ['Sentinel-2 L2A', 'API STAC', 'Cloud Optimized GeoTIFF', 'MDT200 del IGN']],
  ['Web y automatización', ['React y TypeScript', 'Leaflet', 'Recharts', 'GitHub Actions y Pages']],
];

const W = 'max-w-[1360px] mx-auto w-full px-5 sm:px-8';

export default function Proyecto() {
  const info = useLastUpdate();
  const fecha = info?.timestamp
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(info.timestamp))
    : null;

  const cifras = [
    { valor: info?.total_geometrias, texto: 'embalses con su polígono' },
    { valor: info?.embalses_con_datos, texto: 'con lectura de nivel esta semana' },
    { valor: info?.estaciones_caudal, texto: 'estaciones de aforo del SAIH' },
    { valor: info?.precio_omie_eur_mwh, texto: '€/MWh en el mercado diario OMIE', dec: 2 },
  ];

  return (
    <>
      {/* Portada */}
      <section className={`${W} pt-16 sm:pt-24 pb-20`}>
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-10">
          <h1 className="md:col-span-7 text-[56px] sm:text-[88px] lg:text-[112px] leading-[0.92] tracking-[-0.02em]">
            {fmt(info?.total_geometrias ?? 805)} embalses en un mapa que se actualiza solo.
          </h1>
          <div className="md:col-span-4 md:col-start-9 md:pt-40 flex flex-col gap-8">
            <p className="text-[17px] leading-relaxed text-ink-2 max-w-[42ch]">
              Proyecto de ingeniería de datos geoespaciales. Reúne el nivel de los embalses, los caudales
              de nueve confederaciones, el relieve del IGN, una escena Sentinel-2 por embalse y el precio
              de la electricidad en un único GeoJSON, y lo publica cada semana sin intervención manual.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/visor" className="btn btn-ink">Abrir el visor</Link>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn btn-line">Ver el código</a>
            </div>
            <a href={MEMORIA_URL} target="_blank" rel="noopener noreferrer" className="link text-[15px] self-start">
              Leer la memoria técnica (PDF, 18 páginas)
            </a>
          </div>
        </div>

        <div className="mt-16 sm:mt-24">
          <HeroMap />
        </div>
      </section>

      {/* Último ciclo */}
      <section className="border-y border-ink bg-paper-2/60">
        <div className={`${W} py-10`}>
          <p className="margin-note mb-6">{fecha ? `Ciclo automático del ${fecha}` : 'Último ciclo automático'}</p>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-y-8">
            {cifras.map((c, i) => (
              <div key={c.texto} className={`pr-6 border-rule ${i % 2 === 1 ? 'border-l pl-6' : ''} ${i > 0 ? 'lg:border-l lg:pl-8' : ''}`}>
                <dt className="sr-only">{c.texto}</dt>
                <dd className="num text-[40px] sm:text-[52px] leading-none tracking-[-0.03em]">
                  {c.valor !== undefined ? fmt(c.valor, c.dec ?? 0) : '–'}
                </dd>
                <dd className="text-[14px] text-ink-2 mt-3 max-w-[22ch]">{c.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* El problema */}
      <section className={`${W} py-24 sm:py-32`}>
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-10">
          <h2 className="md:col-span-7 text-[44px] sm:text-[64px] leading-[0.95] tracking-[-0.015em]">
            Los datos del agua en España son públicos. Lo difícil es que coincidan.
          </h2>
          <div className="md:col-span-4 md:col-start-9 md:pt-24 space-y-5 text-[17px] leading-relaxed text-ink-2">
            <p>
              Cada confederación hidrográfica publica sus aforos con su propia web y su propio formato.
              El nombre de un mismo embalse cambia de una fuente a otra y ninguna comparte un identificador.
            </p>
            <p>
              Este pipeline hace ese trabajo de traducción una vez, lo deja escrito en código y lo repite
              cada semana. El resultado es una capa que cualquier SIG puede abrir.
            </p>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-t border-ink">
        <div className={`${W} py-24 sm:py-32 grid md:grid-cols-12 gap-x-8 gap-y-12`}>
          <div className="md:col-span-4">
            <h2 className="text-[44px] sm:text-[56px] leading-[0.95] tracking-[-0.015em] md:sticky md:top-28">
              Cinco pasos, de la web de cada confederación al mapa.
            </h2>
          </div>
          <ol className="md:col-span-7 md:col-start-6 border-t border-ink">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr] gap-x-4 py-8 border-b border-rule">
                <span className="num text-[13px] text-muted pt-2">{i + 1}</span>
                <div>
                  <h3 className="text-[32px] leading-none">{p.titulo}</h3>
                  <p className="num text-[12.5px] text-cobalt mt-3">{p.herramientas}</p>
                  <p className="text-[16px] leading-relaxed text-ink-2 mt-3 max-w-[60ch]">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sentinel-2 */}
      <section className="border-t border-ink bg-ink text-paper">
        <div className={`${W} py-24 sm:py-32 grid md:grid-cols-12 gap-x-8 gap-y-12`}>
          <div className="md:col-span-5">
            <h2 className="text-[44px] sm:text-[64px] leading-[0.95] tracking-[-0.015em]">
              Una escena de satélite por embalse, elegida sin abrir un visor.
            </h2>
            <p className="text-[17px] leading-relaxed text-paper/75 mt-8 max-w-[46ch]">
              Un flujo de FME calcula la caja envolvente de cada polígono, consulta el catálogo STAC de
              Earth Search y se queda con la captura Sentinel-2 L2A con menor cobertura de nubes.
              En el visor, cada ficha enlaza esa escena en Copernicus Browser.
            </p>
            <Link to="/visor" className="btn mt-10 border-paper text-paper hover:bg-paper hover:text-ink">
              Ver las escenas en el visor
            </Link>
          </div>
          <figure className="md:col-span-6 md:col-start-7 md:pt-20 m-0 min-w-0">
            <pre className="num text-[13px] sm:text-[14px] leading-[1.9] text-paper/85 border-t border-b border-paper/30 py-6 overflow-x-auto whitespace-pre">
{`PostGIS  embalses_geom
  Reprojector        EPSG:4326
  BoundsExtractor    bbox por embalse
  HTTPCaller         POST /v1/search
                     collections: sentinel-2-l2a
  JSONFragmenter
  JSONFlattener
  Sorter             eo:cloud_cover, ascendente
  Sampler            primera escena
PostGIS  url_descarga = …/TCI.tif`}
            </pre>
            <figcaption className="margin-note !text-paper/60 mt-3">satelite.fmw, esquema simplificado</figcaption>
          </figure>
        </div>
      </section>

      {/* Energía */}
      <section className={`${W} py-24 sm:py-32`}>
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-12 items-start">
          <div className="md:col-span-5">
            <h2 className="text-[44px] sm:text-[64px] leading-[0.95] tracking-[-0.015em]">
              La energía de un embalse sale de su volumen y de su desnivel.
            </h2>
            <p className="text-[17px] leading-relaxed text-ink-2 mt-8 max-w-[46ch]">
              Sobre el MDT de 200 m del IGN se toma la cota del embalse y, como posición del generador,
              la cota mínima en un buffer a su alrededor. Con ese salto se calcula la energía de vaciado
              completo y se valora al precio del mercado diario.
            </p>
            <p className="text-[14px] text-muted mt-6 max-w-[46ch]">
              Es una estimación orientativa, no un dato de explotación de las centrales.
            </p>
          </div>

          <div className="md:col-span-6 md:col-start-7 md:pt-12 min-w-0">
            <p className="font-serif italic text-[40px] sm:text-[64px] leading-none text-center py-10 border-y border-ink">
              <span className="inline-flex items-center gap-4">
                <span>E =</span>
                <span className="inline-flex flex-col items-center">
                  <span className="px-3 pb-2 border-b border-ink">ρ g V ΔH η</span>
                  <span className="pt-2">3,6 · 10<sup className="text-[0.5em]">9</sup></span>
                </span>
              </span>
            </p>
            <dl className="mt-6 grid grid-cols-[3rem_1fr] gap-y-2 text-[15px]">
              {[
                ['E', 'energía en MWh'],
                ['ρ', 'densidad del agua, 1000 kg/m³'],
                ['g', 'gravedad, 9,81 m/s²'],
                ['V', 'volumen embalsado en m³ (1 hm³ = 10⁶ m³)'],
                ['ΔH', 'cota del embalse menos cota del generador, en m'],
                ['η', 'eficiencia de la turbina, 0,80'],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-serif italic text-[20px] leading-6">{k}</dt>
                  <dd className="text-ink-2 border-b border-rule pb-2">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Herramientas */}
      <section className="border-t border-ink">
        <div className={`${W} py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-10`}>
          {HERRAMIENTAS.map(([grupo, items]) => (
            <div key={grupo}>
              <h3 className="text-[26px] leading-none pb-3 border-b border-ink">{grupo}</h3>
              <ul className="mt-4 space-y-1.5 text-[15px] text-ink-2">
                {items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Cierre */}
      <section className="border-t border-ink">
        <div className={`${W} py-24 sm:py-32 grid md:grid-cols-12 gap-x-8 gap-y-8 items-end`}>
          <p className="md:col-span-8 font-serif text-[44px] sm:text-[72px] leading-[0.95] tracking-[-0.015em]">
            Busca un embalse y mira cómo está esta semana.
          </p>
          <div className="md:col-span-3 md:col-start-10">
            <Link to="/visor" className="btn btn-ink">Abrir el visor</Link>
          </div>
        </div>
      </section>
    </>
  );
}
