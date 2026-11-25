const BASE = import.meta.env.BASE_URL;

export interface Tech {
  id: string;
  nombre: string;
}

/** Herramientas reales del proyecto con logotipo disponible (devicon / simple-icons, autoalojados). */
export const TECH: Record<string, Tech> = {
  python: { id: 'python', nombre: 'Python' },
  pandas: { id: 'pandas', nombre: 'pandas' },
  selenium: { id: 'selenium', nombre: 'Selenium' },
  postgresql: { id: 'postgresql', nombre: 'PostgreSQL' },
  gdal: { id: 'gdal', nombre: 'GDAL' },
  qgis: { id: 'qgis', nombre: 'QGIS' },
  leaflet: { id: 'leaflet', nombre: 'Leaflet' },
  react: { id: 'react', nombre: 'React' },
  typescript: { id: 'typescript', nombre: 'TypeScript' },
  vitejs: { id: 'vitejs', nombre: 'Vite' },
  tailwindcss: { id: 'tailwindcss', nombre: 'Tailwind' },
  githubactions: { id: 'githubactions', nombre: 'GitHub Actions' },
  github: { id: 'github', nombre: 'GitHub' },
  javascript: { id: 'javascript', nombre: 'JavaScript' },
  html5: { id: 'html5', nombre: 'HTML' },
  css3: { id: 'css3', nombre: 'CSS' },
};

export const logoSrc = (id: string) => `${BASE}logos/${id}.svg`;

const BANDA = [
  'python', 'pandas', 'selenium', 'postgresql', 'gdal', 'qgis', 'leaflet', 'react',
  'typescript', 'vitejs', 'tailwindcss', 'githubactions', 'github', 'javascript', 'html5', 'css3',
];

/** Una línea de logotipos que se desplaza y flota. Se detiene al pasar el ratón; quieta con movimiento reducido. */
export function TechMarquee() {
  return (
    <div className="marquee relative overflow-hidden py-10" role="region" aria-label="Herramientas usadas en el proyecto">
      <ul className="marquee-track flex w-max items-center">
        {[0, 1].map((copia) =>
          BANDA.map((id, i) => (
            <li key={`${copia}-${id}`} aria-hidden={copia === 1} className="marquee-item w-[110px] shrink-0 flex items-center justify-center" title={TECH[id].nombre}>
              <img
                src={logoSrc(id)}
                alt={copia === 0 ? TECH[id].nombre : ''}
                width={52}
                height={52}
                className="marquee-icon w-[52px] h-[52px] object-contain"
                style={{ animationDelay: `${(i % 4) * 0.6}s` }}
              />
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

/** Logotipos tenues que flotan detrás de una cabecera. Decorativos: ocultos a lectores de pantalla. */
export function FloatingLogos({ ids }: { ids: string[] }) {
  // Ocupan el hueco entre el titular (columnas 1-7) y el texto (9-12)
  const pos = [
    { top: '10%', left: '50%', size: 44 },
    { top: '62%', left: '47%', size: 36 },
    { top: '30%', left: '58%', size: 50 },
    { top: '78%', left: '57%', size: 30 },
    { top: '6%', left: '64%', size: 32 },
    { top: '46%', left: '53%', size: 28 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
      {ids.slice(0, pos.length).map((id, i) => (
        <img
          key={id}
          src={logoSrc(id)}
          alt=""
          width={pos[i].size}
          height={pos[i].size}
          className="float-logo absolute"
          style={{ top: pos[i].top, left: pos[i].left, width: pos[i].size, height: pos[i].size, animationDelay: `${i * 0.9}s`, animationDuration: `${6 + (i % 3)}s` }}
        />
      ))}
    </div>
  );
}

/** Fila compacta de logotipos para cada paso del pipeline. */
export function ToolRow({ ids, extra = [] }: { ids: string[]; extra?: string[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
      {ids.map((id) => (
        <li key={id} className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
          <img src={logoSrc(id)} alt="" width={18} height={18} className="w-[18px] h-[18px] object-contain" />
          {TECH[id].nombre}
        </li>
      ))}
      {extra.map((n) => (
        <li key={n} className="text-[13px] text-ink-2 border border-rule px-1.5 leading-6">{n}</li>
      ))}
    </ul>
  );
}
