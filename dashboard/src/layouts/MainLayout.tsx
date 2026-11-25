import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Github } from 'lucide-react';
import { REPO_URL, MEMORIA_URL, AUTORES, PROYECTO, PROYECTO_AMBITO } from '../lib/data';

const NAV = [
  { name: 'Proyecto', path: '/' },
  { name: 'Visor', path: '/visor' },
  { name: 'Metodología', path: '/metodologia' },
];

export default function MainLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[3000] focus:bg-white focus:text-ink focus:px-3 focus:py-2 focus:rounded-lg">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-[1000] bg-night text-white border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="hidden sm:block min-w-0 leading-tight group" aria-label={`${PROYECTO}, inicio`}>
            <span className="block text-[14px] sm:text-[15px] font-semibold tracking-tight truncate group-hover:text-white/85">
              {PROYECTO}
            </span>
            <span className="block text-[12px] text-white/55 truncate">Energía hidráulica y solar en España</span>
          </Link>

          <nav aria-label="Principal" className="flex items-stretch h-full shrink-0 text-[15px] sm:text-[14px] -ml-2.5 sm:ml-0">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `relative flex items-center px-2.5 sm:px-4 transition-colors duration-200 ${
                    isActive ? 'text-white after:absolute after:left-2.5 after:right-2.5 sm:after:left-4 sm:after:right-4 after:bottom-0 after:h-[2px] after:bg-cobalt' : 'text-white/60 hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Repositorio en GitHub"
              className="hidden sm:flex items-center gap-2 pl-4 ml-2 border-l border-white/10 text-white/60 hover:text-white transition-colors duration-200">
              <Github size={16} aria-hidden="true" />
              <span className="hidden lg:inline">Código</span>
            </a>
          </nav>
        </div>
      </header>

      <main id="contenido" className="flex-grow w-full flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-night text-white">
        <div className="max-w-[1280px] mx-auto w-full px-5 sm:px-8 py-14 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="text-[18px] font-semibold tracking-tight leading-snug max-w-[34ch]">{PROYECTO} {PROYECTO_AMBITO}</p>
            <p className="text-white/65 mt-3">Autores: {AUTORES}.</p>
          </div>
          <ul className="md:col-span-2 space-y-2 text-[15px]">
            <li><a className="text-white/85 hover:text-white underline-offset-4 hover:underline" href={REPO_URL} target="_blank" rel="noopener noreferrer">Código en GitHub</a></li>
            <li><a className="text-white/85 hover:text-white underline-offset-4 hover:underline" href={MEMORIA_URL} target="_blank" rel="noopener noreferrer">Memoria técnica</a></li>
          </ul>
          <p className="md:col-span-4 text-[13px] text-white/55 leading-relaxed">
            Datos de embalses.net, SAIH del MITECO, OMIE, AEMET, MDT200 del IGN y Copernicus Sentinel-2 a través de Earth Search.
            La energía y el valor de mercado son estimaciones, no lecturas de explotación.
          </p>
        </div>
      </footer>
    </div>
  );
}
