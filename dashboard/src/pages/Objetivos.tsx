import { Database, Code2, Map as MapIcon, Wrench, Layers, Server } from 'lucide-react';

export default function Objetivos() {
  const techStack = [
    {
      category: 'Data Extraction',
      icon: <Code2 className="text-blue-500 mb-4" size={32} />,
      title: 'Python & Pandas',
      desc: 'Scraping de MITECO y OMIE mediante BeautifulSoup. Transformación inicial de DataFrames y limpieza de nulos.',
      color: 'hover:border-blue-400 hover:shadow-blue-100'
    },
    {
      category: 'ETL Pipeline',
      icon: <Wrench className="text-amber-500 mb-4" size={32} />,
      title: 'Pentaho PDI',
      desc: 'Orquestación de flujos de datos. Cruce de tablas relacionales de embalses y normalización de esquemas JSON.',
      color: 'hover:border-amber-400 hover:shadow-amber-100'
    },
    {
      category: 'Geoprocesamiento',
      icon: <MapIcon className="text-emerald-500 mb-4" size={32} />,
      title: 'FME Engine',
      desc: 'Procesamiento espacial, reproyección de coordenadas cartográficas y generación de geometrías GeoJSON optimizadas.',
      color: 'hover:border-emerald-400 hover:shadow-emerald-100'
    },
    {
      category: 'Data Warehouse',
      icon: <Server className="text-indigo-500 mb-4" size={32} />,
      title: 'PostgreSQL + PostGIS',
      desc: 'Almacenamiento persistente de datos hidro-espaciales para consultas avanzadas y gestión de metadatos.',
      color: 'hover:border-indigo-400 hover:shadow-indigo-100'
    },
    {
      category: 'Frontend Core',
      icon: <Database className="text-cyan-500 mb-4" size={32} />,
      title: 'React & TypeScript',
      desc: 'Desarrollo de la interfaz de usuario con tipado estricto. Construido sobre Vite para compilación ultrarrápida.',
      color: 'hover:border-cyan-400 hover:shadow-cyan-100'
    },
    {
      category: 'Web Mapping',
      icon: <Layers className="text-purple-500 mb-4" size={32} />,
      title: 'Leaflet & Recharts',
      desc: 'Renderizado LOD (Level of Detail) dinámico. Visualización analítica y WMS transparentes integrados.',
      color: 'hover:border-purple-400 hover:shadow-purple-100'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-12 animate-fade-in">
      <div className="mb-10 border-b border-neutral-200 pb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4 uppercase tracking-wide">
          2. Objetivos del Trabajo
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed">
          Metas y resultados esperados del modelo de integración hidroeléctrico.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 p-8 rounded-xl shadow-sm mb-12 hover:shadow-md transition-shadow duration-300">
        <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-600 rounded-sm inline-block"></span>
          Objetivo Principal
        </h2>
        <p className="text-neutral-700 leading-relaxed text-lg">
          El objetivo principal es desarrollar un modelo integral de transformación de datos hidrológicos españoles para facilitar su análisis temporal y espacial, cruzando datos topográficos, de capacidad hídrica y de mercado eléctrico en un ecosistema unificado.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <div className="bg-white border border-neutral-200 p-8 rounded-xl shadow-sm group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <h3 className="font-bold text-neutral-800 mb-3 uppercase tracking-wide text-sm group-hover:text-blue-600 transition-colors">Integración a Escala Nacional</h3>
          <p className="text-neutral-600 text-sm leading-relaxed">
            El reto fundamental se basa en conseguir la integración completa de todas las cuencas hidrográficas de España con sus respectivos embalses y ríos de forma centralizada y estandarizada.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-8 rounded-xl shadow-sm group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <h3 className="font-bold text-neutral-800 mb-3 uppercase tracking-wide text-sm group-hover:text-blue-600 transition-colors">Cálculo de Energía Potencial</h3>
          <p className="text-neutral-600 text-sm leading-relaxed">
            Con los datos hidrológicos consolidados, el modelo permite calcular la energía hidráulica máxima y la energía generada de manera indirecta, basándose en la capacidad y el llenado actual.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-8 rounded-xl shadow-sm group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <h3 className="font-bold text-neutral-800 mb-3 uppercase tracking-wide text-sm group-hover:text-blue-600 transition-colors">Cruce de Datos de Mercado</h3>
          <p className="text-neutral-600 text-sm leading-relaxed">
            Vinculación del potencial energético con el valor del mercado mayorista (MWh) para obtener estimaciones económicas en tiempo real del agua embalsada.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-8 rounded-xl shadow-sm group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <h3 className="font-bold text-neutral-800 mb-3 uppercase tracking-wide text-sm group-hover:text-blue-600 transition-colors">Accesibilidad Geoespacial</h3>
          <p className="text-neutral-600 text-sm leading-relaxed">
            Presentación de los resultados a través de un visor cartográfico interoperable, que resalta las variables geográficas y la distribución espacial de los recursos hídricos.
          </p>
        </div>
      </div>

      {/* SECCIÓN TECNOLÓGICA ANIMADA */}
      <div className="border-t border-neutral-200 pt-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 mb-3 uppercase tracking-widest inline-block">
            Stack Tecnológico y Librerías
          </h2>
          <p className="text-neutral-500">Herramientas implementadas en el pipeline de transformación y visualización</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((tech, idx) => (
            <div 
              key={idx} 
              className={`bg-white border border-neutral-200 p-6 rounded-xl shadow-sm cursor-default
                transform transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] ${tech.color}`}
            >
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">{tech.category}</div>
              <div className="transform transition-transform duration-500 hover:rotate-12 origin-left inline-block">
                {tech.icon}
              </div>
              <h3 className="text-lg font-bold text-neutral-800 mb-2">{tech.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{tech.desc}</p>
            </div>
          ))}
        </div>

        {/* CINTA DE LOGOS (MARQUEE INFINITO) */}
        <div className="mt-16 overflow-hidden relative w-full py-8">
          <style>{`
            @keyframes scrollLTR {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0%); }
            }
            @keyframes floatLogo {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-12px); }
            }
            .marquee-track {
              display: flex;
              width: 200%;
              animation: scrollLTR 35s linear infinite;
            }
            .marquee-track:hover {
              animation-play-state: paused;
            }
            .marquee-icon-container {
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .marquee-icon {
              width: 56px;
              height: 56px;
              animation: floatLogo 3.5s ease-in-out infinite;
              filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
              transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .marquee-icon:hover {
              transform: scale(1.3) rotate(10deg);
              animation: none; /* Stops floating when hovered to feel solid */
              filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));
            }
            /* Staggering the float animation so they don't all bounce at the exact same time */
            .marquee-icon-container:nth-child(even) .marquee-icon {
              animation-delay: 1.75s;
            }
            .marquee-icon-container:nth-child(3n) .marquee-icon {
              animation-delay: 0.8s;
            }
            /* Gradientes difuminados en los bordes para ocultar el corte */
            .gradient-edges::before, .gradient-edges::after {
              content: '';
              position: absolute;
              top: 0;
              width: 100px;
              height: 100%;
              z-index: 10;
              pointer-events: none;
            }
            .gradient-edges::before {
              left: 0;
              background: linear-gradient(to right, rgba(250,250,250,1), rgba(250,250,250,0));
            }
            .gradient-edges::after {
              right: 0;
              background: linear-gradient(to left, rgba(250,250,250,1), rgba(250,250,250,0));
            }
          `}</style>
          
          <div className="gradient-edges absolute inset-0 pointer-events-none"></div>

          <div className="marquee-track">
            {/* Array duplicado para crear el efecto infinito y contínuo de desplazamiento */}
            {[
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
              // --- DUPLICADO EXACTO PARA EL SCROLL INFINITO ---
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
              "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg"
            ].map((src, index) => (
              <div key={index} className="marquee-icon-container">
                <img src={src} alt="Tech Logo" className="marquee-icon" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
