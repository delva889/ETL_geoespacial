import { useEffect, useState } from 'react';
import { X, Maximize2 } from 'lucide-react';

const FIG = `${import.meta.env.BASE_URL}figuras/`;

export interface Figura {
  file: string;
  w: number;
  h: number;
  titulo: string;
  texto: string;
  herramienta: 'FME' | 'Pentaho PDI';
  fuente?: string;
}

export const FIGURAS: Record<string, Figura> = {
  geocodificacion: {
    file: 'fme-geocodificacion.png', w: 1207, h: 278, herramienta: 'FME', fuente: 'geocodingAPI.fmw',
    titulo: 'Geocodificación de estaciones de aforo',
    texto: 'Las confederaciones no publican la posición de muchas estaciones. El flujo elimina duplicados, compone una dirección con el nombre y la cuenca, la geocodifica con la API de Google, crea el punto y lo reproyecta. 498 estaciones.',
  },
  sentinel: {
    file: 'fme-sentinel2.png', w: 1181, h: 320, herramienta: 'FME', fuente: 'satelite.fmw',
    titulo: 'Una escena Sentinel-2 por embalse',
    texto: 'Caja envolvente de cada polígono, petición al catálogo STAC de Earth Search, aplanado de la respuesta y orden por nubosidad para quedarse con una escena por embalse.',
  },
  energia: {
    file: 'fme-energia.png', w: 1245, h: 393, herramienta: 'FME', fuente: 'energia.fmw',
    titulo: 'Análisis ráster y energía',
    texto: 'Extrae del MDT de 200 m la cota del embalse y la mínima en un buffer a su alrededor, calcula el salto y aplica la fórmula de energía a cada polígono.',
  },
  caudales: {
    file: 'pdi-caudales.png', w: 912, h: 710, herramienta: 'Pentaho PDI',
    titulo: 'Normalización de caudales',
    texto: 'Une los ficheros de cada confederación, añade la cuenca como constante, renombra los campos a un esquema común y carga el resultado en PostgreSQL.',
  },
};

export function Captura({ fig, oscuro = false, pie }: { fig: Figura; oscuro?: boolean; pie?: string }) {
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAbierta(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [abierta]);

  return (
    <figure className="m-0 min-w-0">
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label={`Ver a tamaño completo: ${fig.titulo}`}
        className={`group relative block w-full rounded-2xl bg-white p-3 sm:p-5 cursor-zoom-in text-left transition-shadow duration-300 ${
          oscuro ? 'shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]' : 'border border-rule hover:shadow-[0_16px_40px_-20px_rgba(11,18,32,0.3)]'
        }`}
      >
        <img
          src={FIG + fig.file}
          width={fig.w}
          height={fig.h}
          loading="lazy"
          decoding="async"
          alt={`${fig.titulo}: captura del flujo en ${fig.herramienta}`}
          className="block mx-auto w-full h-auto"
          style={{ maxWidth: fig.w }}
        />
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 text-white text-[12px] px-2.5 py-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
          <Maximize2 size={12} /> Ampliar
        </span>
      </button>
      {pie && <figcaption className={`text-[13px] mt-3 ${oscuro ? 'text-white/55' : 'text-muted'}`}>{pie}</figcaption>}

      {abierta && (
        <div className="fixed inset-0 z-[3000] bg-night/90 backdrop-blur-sm flex flex-col" role="dialog" aria-modal="true" aria-label={fig.titulo} onClick={() => setAbierta(false)}>
          <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-4 text-white">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold truncate">{fig.titulo}</p>
              <p className="text-[13px] text-white/60">{fig.herramienta}{fig.fuente ? `, ${fig.fuente}` : ''}. Tamaño original {fig.w} × {fig.h} px</p>
            </div>
            <button type="button" onClick={() => setAbierta(false)} aria-label="Cerrar" autoFocus
              className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-auto px-5 sm:px-8 pb-8 grid place-items-center">
            <img src={FIG + fig.file} width={fig.w} height={fig.h} alt="" onClick={(e) => e.stopPropagation()}
              className="rounded-xl bg-white p-4 max-w-none" style={{ width: fig.w, height: 'auto' }} />
          </div>
        </div>
      )}
    </figure>
  );
}
