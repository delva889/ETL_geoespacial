import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HeroMap from '../components/HeroMap';
import { TechMarquee, ToolRow } from '../components/Logos';
import { REPO_URL, MEMORIA_URL, AUTORES, PROYECTO, PROYECTO_AMBITO, useLastUpdate, fmt } from '../lib/data';
import { Captura, FIGURAS } from '../components/Figuras';

const W = 'max-w-[1280px] mx-auto w-full px-5 sm:px-8';

const PASOS = [
  {
    titulo: 'Scraping',
    logos: ['python', 'selenium'], extra: ['requests', 'BeautifulSoup'],
    texto: 'Extrae de forma automática los niveles de embalses.net, los caudales de los SAIH de cada confederación y el precio diario del mercado eléctrico (OMIE).',
  },
  {
    titulo: 'Limpieza y cruce',
    logos: ['pandas'], extra: ['Pentaho PDI', 'rapidfuzz'],
    texto: 'Unifica unidades y esquemas, y empareja cada embalse con su polígono por nombre, demarcación y capacidad.',
  },
  {
    titulo: 'Geoprocesamiento',
    logos: ['postgresql', 'gdal', 'qgis'], extra: ['FME', 'PostGIS'],
    texto: 'Reproyecta, carga en PostGIS y calcula sobre el MDT de 200 m la cota de cada embalse y su salto.',
  },
  {
    titulo: 'Satélite',
    logos: [], extra: ['FME', 'STAC', 'Sentinel-2 L2A'],
    texto: 'Busca en Earth Search la escena con menos nubes sobre cada embalse y guarda el enlace al GeoTIFF.',
  },
  {
    titulo: 'Publicación',
    logos: ['githubactions', 'react', 'typescript', 'leaflet'], extra: [],
    texto: 'Cada lunes se refrescan niveles, caudales y precio, se compila la web y se publica en GitHub Pages.',
  },
];

function CountUp({ value, dec = 0 }: { value: number; dec?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(value); return; }
    let raf = 0; const t0 = performance.now(); const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      setV(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmt(v, dec)}</>;
}

export default function Proyecto() {
  const info = useLastUpdate();
  const fecha = info?.timestamp
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(info.timestamp))
    : null;

  const cifras = [
    { valor: info?.total_geometrias, texto: 'embalses dibujados con su polígono oficial' },
    { valor: info?.embalses_con_datos, texto: 'con lectura de nivel en el último ciclo' },
    { valor: info?.estaciones_caudal, texto: 'estaciones de aforo de los SAIH' },
    { valor: info?.precio_omie_eur_mwh, texto: '€/MWh, precio del mercado diario OMIE', dec: 2 },
  ];

  return (
    <>

      <section className="relative flex flex-col bg-night text-white min-h-[calc(100svh-3.5rem)] sm:min-h-[620px] sm:h-[calc(100svh-3.5rem)] overflow-hidden">
        <HeroMap />
        <div className={`${W} relative z-10 flex-1 flex flex-col justify-center pt-12 pb-8 sm:pt-0 sm:pb-24`}>
          <div className="max-w-[860px] rise">
            {fecha && (
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 backdrop-blur px-3 py-1.5 text-[13px] text-white/85 mb-7">
                <span className="relative flex w-2 h-2" aria-hidden="true">
                  <span className="absolute inset-0 rounded-full bg-[#4ade80] animate-ping opacity-60" />
                  <span className="relative w-2 h-2 rounded-full bg-[#4ade80]" />
                </span>
                Datos del {fecha}. Se actualizan cada lunes.
              </p>
            )}
            <h1 className="text-[38px] sm:text-[56px] lg:text-[68px] leading-[1.02] tracking-[-0.045em]">
              {PROYECTO}
              <span className="block mt-2 text-[24px] sm:text-[32px] lg:text-[38px] leading-[1.1] tracking-[-0.03em] font-normal text-white/70">{PROYECTO_AMBITO}</span>
            </h1>
            <p className="text-[17px] sm:text-[18px] leading-relaxed text-white/75 mt-6 max-w-[60ch]">
              Un pipeline que extrae por scraping los niveles de los embalses, los caudales de las confederaciones
              hidrográficas y el precio de la electricidad, los cruza con el relieve del IGN y con imágenes Sentinel-2,
              y publica el resultado cada semana en un mapa.
            </p>
            <p className="text-[14px] text-white/55 mt-4">Autores: {AUTORES}</p>
            <div className="flex flex-wrap items-center gap-3 mt-9">
              <Link to="/" className="btn btn-light">Abrir el visor</Link>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark">Ver el código</a>
              <a href={MEMORIA_URL} target="_blank" rel="noopener noreferrer" className="text-[15px] text-white/75 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white ml-2">
                Memoria técnica (PDF)
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={`${W} pt-16 sm:pt-20`}>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-rule rounded-2xl overflow-hidden border border-rule">
          {cifras.map((c) => (
            <div key={c.texto} className="bg-white p-6 sm:p-8">
              <dt className="sr-only">{c.texto}</dt>
              <dd className="num text-[36px] sm:text-[48px] leading-none font-medium tracking-[-0.04em]">
                {c.valor !== undefined ? <CountUp value={c.valor} dec={c.dec ?? 0} /> : '–'}
              </dd>
              <dd className="text-[14px] text-ink-2 mt-3 max-w-[24ch]">{c.texto}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Herramientas del proyecto" className="pt-6">
        <TechMarquee />
      </section>

      <section className={`${W} py-20 sm:py-28 grid md:grid-cols-12 gap-x-10 gap-y-8 items-end`}>
        <h2 className="md:col-span-7 text-[36px] sm:text-[52px] leading-[1.02]">
          Los datos del agua son públicos. Lo difícil es que coincidan.
        </h2>
        <div className="md:col-span-5 space-y-4 text-[17px] leading-relaxed text-ink-2">
          <p>
            Cada confederación publica sus aforos con su propia web y su propio formato, y el nombre de un
            mismo embalse cambia de una fuente a otra.
          </p>
          <p>Este proyecto hace esa traducción en código y la repite cada semana. El resultado es una capa que cualquier SIG puede abrir.</p>
        </div>
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${W} py-20 sm:py-28`}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <h2 className="text-[36px] sm:text-[52px] leading-[1.02] max-w-[16ch]">Cómo funciona, en cinco pasos</h2>
            <Link to="/metodologia" className="link text-[15px] self-start md:self-auto">Ver la metodología completa</Link>
          </div>
          <ol className="grid md:grid-cols-5 gap-10 md:gap-6 relative">
            <div className="hidden md:block absolute top-5 left-5 right-5 h-px bg-rule" aria-hidden="true" />
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="relative">
                <span className="relative z-10 grid place-items-center w-10 h-10 rounded-full bg-ink text-white num text-[14px]">{i + 1}</span>
                <h3 className="text-[22px] leading-tight mt-5">{p.titulo}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2 mt-2">{p.texto}</p>
                <ToolRow ids={p.logos} extra={p.extra} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-night text-white">
        <div className={`${W} py-20 sm:py-28 grid lg:grid-cols-12 gap-x-12 gap-y-12 items-center`}>
          <div className="lg:col-span-5">
            <h2 className="text-[36px] sm:text-[52px] leading-[1.02]">Una escena de satélite por embalse, sin abrir un visor.</h2>
            <p className="text-[17px] leading-relaxed text-white/70 mt-6 max-w-[48ch]">
              Un flujo de FME calcula la caja envolvente de cada polígono, consulta el catálogo STAC de Earth Search
              y se queda con la captura Sentinel-2 L2A con menos nubes. Cada ficha del visor enlaza su escena en Copernicus Browser.
            </p>
            <Link to="/" className="btn btn-light mt-9">Ver las escenas en el visor</Link>
          </div>
          <div className="lg:col-span-7">
            <Captura oscuro fig={FIGURAS.sentinel} pie="satelite.fmw: 956 polígonos, 4692 escenas candidatas, 939 escenas elegidas. Pulsa para ampliar." />
          </div>
        </div>
      </section>

      <section className={`${W} py-20 sm:py-28`}>
        <div className="grid lg:grid-cols-12 gap-x-12 gap-y-12 items-start">
          <div className="lg:col-span-5">
            <h2 className="text-[36px] sm:text-[52px] leading-[1.02]">La energía de un embalse sale de su volumen y su desnivel.</h2>
            <p className="text-[17px] leading-relaxed text-ink-2 mt-6 max-w-[48ch]">
              En FME, sobre el MDT de 200 m del IGN, se toma la cota del embalse y, como posición del generador, la cota
              mínima en un buffer a su alrededor. La actualización semanal, que corre sin FME, aplica un salto medio de
              50 m (109 MWh por hm³) y lo valora al precio OMIE del día.
            </p>
            <p className="text-[14px] text-muted mt-4">Estimación orientativa de vaciado completo, no un dato de explotación.</p>
          </div>
          <div className="lg:col-span-7 panel p-8 sm:p-10">
            <p className="text-center text-[30px] sm:text-[44px] font-medium tracking-[-0.03em] text-ink">
              <span className="inline-flex items-center gap-4">
                <span>E =</span>
                <span className="inline-flex flex-col items-center">
                  <span className="px-3 pb-2 border-b-2 border-ink">ρ · g · V · ΔH · η</span>
                  <span className="pt-2">3,6 · 10<sup className="text-[0.5em]">9</sup></span>
                </span>
              </span>
            </p>
            <dl className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-[15px]">
              {[
                ['E', 'energía, en MWh'],
                ['ρ', 'densidad del agua, 1000 kg/m³'],
                ['g', 'gravedad, 9,81 m/s²'],
                ['V', 'volumen embalsado, en m³'],
                ['ΔH', 'salto entre embalse y generador, en m'],
                ['η', 'eficiencia de la turbina, 0,80'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 border-t border-rule pt-3">
                  <dt className="w-8 shrink-0 font-semibold text-cobalt">{k}</dt>
                  <dd className="text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="mt-14">
          <Captura fig={FIGURAS.energia} pie="energia.fmw: cruza el MDT con los polígonos de PostGIS. Pulsa para ampliar." />
        </div>
      </section>

      <section className={`${W} pb-24`}>
        <div className="rounded-3xl bg-cobalt text-white px-8 sm:px-14 py-14 sm:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <h2 className="text-[32px] sm:text-[44px] leading-[1.05] max-w-[18ch]">Busca un embalse y mira cómo está esta semana.</h2>
          <Link to="/" className="btn btn-light self-start md:self-auto">Abrir el visor</Link>
        </div>
      </section>
    </>
  );
}
