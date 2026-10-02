import { Database, Code2, Map as MapIcon, Wrench, Layers, Server } from 'lucide-react';

export default function Objetivos() {
  const goals = [
    {
      title: 'Integración a escala nacional',
      desc: 'El reto fundamental se basa en conseguir la integración completa de todas las cuencas hidrográficas de España con sus respectivos embalses y ríos de forma centralizada y estandarizada.',
    },
    {
      title: 'Cálculo de energía potencial',
      desc: 'Con los datos hidrológicos consolidados, el modelo permite calcular la energía hidráulica máxima y la energía generada de manera indirecta, basándose en la capacidad y el llenado actual.',
    },
    {
      title: 'Cruce de datos de mercado',
      desc: 'Vinculación del potencial energético con el valor del mercado mayorista (MWh) para obtener estimaciones económicas en tiempo real del agua embalsada.',
    },
    {
      title: 'Accesibilidad geoespacial',
      desc: 'Presentación de los resultados a través de un visor cartográfico interoperable, que resalta las variables geográficas y la distribución espacial de los recursos hídricos.',
    },
  ];

  const pipeline = [
    {
      step: '01',
      category: 'Extracción',
      icon: <Code2 size={22} strokeWidth={1.5} />,
      title: 'Python & Pandas',
      desc: 'Scraping de MITECO y OMIE mediante BeautifulSoup. Transformación inicial de DataFrames y limpieza de nulos.',
      accent: 'teal' as const,
    },
    {
      step: '02',
      category: 'Orquestación ETL',
      icon: <Wrench size={22} strokeWidth={1.5} />,
      title: 'Pentaho PDI',
      desc: 'Orquestación de flujos de datos. Cruce de tablas relacionales de embalses y normalización de esquemas JSON.',
      accent: 'ochre' as const,
    },
    {
      step: '03',
      category: 'Geoprocesamiento',
      icon: <MapIcon size={22} strokeWidth={1.5} />,
      title: 'FME Engine',
      desc: 'Procesamiento espacial, reproyección de coordenadas cartográficas y generación de geometrías GeoJSON optimizadas.',
      accent: 'deep' as const,
    },
    {
      step: '04',
      category: 'Almacenamiento',
      icon: <Server size={22} strokeWidth={1.5} />,
      title: 'PostgreSQL + PostGIS',
      desc: 'Almacenamiento persistente de datos hidro-espaciales para consultas avanzadas y gestión de metadatos.',
      accent: 'teal' as const,
    },
    {
      step: '05',
      category: 'Frontend',
      icon: <Database size={22} strokeWidth={1.5} />,
      title: 'React & TypeScript',
      desc: 'Desarrollo de la interfaz de usuario con tipado estricto. Construido sobre Vite para compilación ultrarrápida.',
      accent: 'ochre' as const,
    },
    {
      step: '06',
      category: 'Cartografía web',
      icon: <Layers size={22} strokeWidth={1.5} />,
      title: 'Leaflet & Recharts',
      desc: 'Renderizado LOD (Level of Detail) dinámico. Visualización analítica y capas WMS transparentes integradas.',
      accent: 'deep' as const,
    },
  ];

  const accentClass = {
    teal: { border: 'hover:border-t-teal', text: 'text-teal', topBorder: 'border-t-teal/40' },
    ochre: { border: 'hover:border-t-ochre', text: 'text-ochre', topBorder: 'border-t-ochre/40' },
    deep: { border: 'hover:border-t-deep', text: 'text-deep', topBorder: 'border-t-deep/40' },
  };

  const bgIcons = [
    { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', top: '6%', left: '78%', size: 46, delay: 0, duration: 7 },
    { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', top: '55%', left: '92%', size: 36, delay: 1.2, duration: 6 },
    { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg', top: '70%', left: '68%', size: 42, delay: 2.1, duration: 8 },
    { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', top: '15%', left: '58%', size: 30, delay: 0.8, duration: 6.5 },
    { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg', top: '85%', left: '85%', size: 32, delay: 1.8, duration: 7.5 },
    { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg', top: '38%', left: '82%', size: 34, delay: 2.6, duration: 6.8 },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full">
      <style>{`
        @keyframes bgIconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(4deg); }
        }
      `}</style>

      <div className="mb-10 pb-6 border-b border-line relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden="true">
          {bgIcons.map((icon, i) => (
            <img
              key={i}
              src={icon.src}
              alt=""
              style={{
                position: 'absolute',
                top: icon.top,
                left: icon.left,
                width: icon.size,
                height: icon.size,
                opacity: 0.16,
                animation: `bgIconFloat ${icon.duration}s ease-in-out infinite`,
                animationDelay: `${icon.delay}s`,
              }}
            />
          ))}
        </div>
        <div className="relative">
          <p className="font-data text-xs text-teal mb-2">Objetivos</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Metas del modelo de integración
          </h1>
          <p className="text-base text-muted leading-relaxed mt-3 max-w-xl">
            Resultados esperados del modelo de integración hidroeléctrico.
          </p>
        </div>
      </div>

      <div className="border border-line bg-surface p-6 sm:p-8 mb-10 border-t-2 border-t-teal">
        <h2 className="text-[11px] text-muted mb-3">Objetivo principal</h2>
        <p className="text-ink leading-relaxed text-[15px] max-w-2xl">
          Desarrollar un modelo integral de transformación de datos hidrológicos españoles para facilitar su análisis temporal y espacial, cruzando datos topográficos, de capacidad hídrica y de mercado eléctrico en un ecosistema unificado.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 border border-line divide-y divide-line sm:divide-y-0 sm:divide-x mb-16">
        {goals.map((goal) => (
          <div key={goal.title} className="p-6 bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(14,36,34,0.1)] hover:z-10 relative">
            <h3 className="font-display text-base font-semibold text-ink mb-2">{goal.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{goal.desc}</p>
          </div>
        ))}
      </div>

      {/* PIPELINE TECNOLÓGICO */}
      <div className="pt-4 relative">
        <div className="lines-bg-soft absolute -inset-x-4 top-12 bottom-0 text-line opacity-40 pointer-events-none hidden sm:block" aria-hidden="true" />

        <div className="relative">
          <h2 className="font-display text-xl font-semibold text-ink mb-1">Pipeline tecnológico</h2>
          <p className="text-sm text-muted mb-8 max-w-lg">
            Herramientas implementadas en cada etapa del flujo, desde la extracción hasta la visualización.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pipeline.map((tech) => {
              const a = accentClass[tech.accent];
              return (
                <div
                  key={tech.title}
                  className={`group relative bg-surface border border-line border-t-2 ${a.topBorder} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(14,36,34,0.1)] ${a.border}`}
                >
                  <p className="font-data text-[10px] text-muted mb-3 tracking-wide">{tech.category}</p>
                  <div className={`mb-4 ${a.text}`}>{tech.icon}</div>
                  <h3 className="font-display text-base font-semibold text-ink mb-2">{tech.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{tech.desc}</p>
                  <span className="font-data text-[10px] text-line group-hover:text-muted transition-colors absolute top-5 right-5">{tech.step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CINTA DE TECNOLOGÍAS */}
      <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8">
        <style>{`
          @keyframes marqueeScroll {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marqueeFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marqueeScroll 32s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
          .marquee-item {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 110px;
            flex-shrink: 0;
          }
          .marquee-icon {
            width: 52px;
            height: 52px;
            animation: marqueeFloat 3.2s ease-in-out infinite;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s ease, opacity 0.3s ease;
            filter: grayscale(0.25);
            opacity: 0.7;
          }
          .marquee-item:hover .marquee-icon {
            transform: scale(1.25);
            animation-play-state: paused;
            filter: grayscale(0) drop-shadow(0 6px 10px rgba(14,36,34,0.18));
            opacity: 1;
          }
          .marquee-item:nth-child(3n) .marquee-icon { animation-delay: 0.6s; }
          .marquee-item:nth-child(4n) .marquee-icon { animation-delay: 1.4s; }
        `}</style>

        <div className="py-10 relative overflow-hidden">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 z-10" style={{ background: 'linear-gradient(to right, #f2f4f1, transparent)' }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 z-10" style={{ background: 'linear-gradient(to left, #f2f4f1, transparent)' }} />

            <div className="marquee-track">
              {[...Array(2)].map((_, dupIdx) => (
                [
                  { name: 'Python', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
                  { name: 'Pandas', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg' },
                  { name: 'PostgreSQL', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg' },
                  { name: 'React', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
                  { name: 'TypeScript', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' },
                  { name: 'Tailwind CSS', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
                  { name: 'Vite', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg' },
                  { name: 'HTML5', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg' },
                  { name: 'CSS3', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg' },
                  { name: 'JavaScript', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
                  { name: 'Node.js', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
                  { name: 'GitHub', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg' },
                ].map((tech) => (
                  <div key={`${dupIdx}-${tech.name}`} className="marquee-item" title={tech.name}>
                    <img src={tech.src} alt={tech.name} className="marquee-icon" />
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
