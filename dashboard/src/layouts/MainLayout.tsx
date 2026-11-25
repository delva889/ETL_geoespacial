import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Github, Map as MapIcon, BookOpen, Layers } from 'lucide-react';
import { REPO_URL, MEMORIA_URL, AUTORES, PROYECTO, PROYECTO_AMBITO } from '../lib/data';

const NAV = [
  { name: 'Visor', path: '/', icon: MapIcon },
  { name: 'Proyecto', path: '/proyecto', icon: Layers },
  { name: 'Metodología', path: '/metodologia', icon: BookOpen },
];

export default function MainLayout() {
  const { pathname } = useLocation();
  const enVisor = pathname === '/';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[3000] focus:bg-ink focus:text-white focus:px-3 focus:py-2 focus:rounded-lg">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-[1000] bg-white/80 backdrop-blur-xl border-b border-rule">
        <div className={`${enVisor ? 'max-w-[1680px] px-3 sm:px-4' : 'max-w-[1280px] px-5 sm:px-8'} mx-auto h-16 flex items-center gap-2 sm:gap-4`}>

          <Link to="/proyecto" className="hidden lg:flex items-center gap-3 min-w-0 flex-1 group" title={`${PROYECTO} ${PROYECTO_AMBITO}`}>
            <span className="min-w-0 leading-tight">
              <span className="block text-[14px] xl:text-[15px] leading-[1.25] font-semibold tracking-tight line-clamp-2 xl:line-clamp-1 group-hover:text-cobalt transition-colors duration-200">{PROYECTO}</span>
              <span className="hidden xl:block text-[13px] text-muted truncate">{PROYECTO_AMBITO.charAt(0).toUpperCase() + PROYECTO_AMBITO.slice(1)}</span>
            </span>
          </Link>

          <nav aria-label="Principal" className="flex items-center p-1 rounded-xl bg-paper-2 border border-rule shrink-0">
            {NAV.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 h-9 px-2 sm:px-3.5 rounded-lg text-[14px] sm:text-[15px] transition-colors duration-200 ${
                    isActive ? 'bg-white text-ink font-medium shadow-[0_1px_2px_rgba(11,18,32,0.08),0_0_0_1px_rgba(11,18,32,0.04)]' : 'text-ink-2 hover:text-ink'
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="hidden sm:block" />
                {name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <a href={MEMORIA_URL} target="_blank" rel="noopener noreferrer"
              className="hidden lg:inline-flex h-10 items-center px-3 rounded-lg text-[15px] text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors duration-200">
              Memoria
            </a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Código en GitHub"
              className="inline-flex h-10 items-center justify-center gap-2 w-10 sm:w-auto sm:px-3 rounded-lg bg-ink text-white text-[15px] hover:bg-cobalt transition-colors duration-200">
              <Github size={16} aria-hidden="true" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-grow w-full flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-night text-white">
        <div className="max-w-[1280px] mx-auto w-full px-5 sm:px-8 py-14 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="text-[18px] font-semibold tracking-tight leading-snug max-w-[34ch]">{PROYECTO} {PROYECTO_AMBITO}</p>
            <p className="text-white/65 mt-3">Autor: {AUTORES}.</p>
          </div>
          <ul className="md:col-span-2 space-y-2 text-[15px]">
            <li><a className="text-white/85 hover:text-white underline-offset-4 hover:underline" href={REPO_URL} target="_blank" rel="noopener noreferrer">Código en GitHub</a></li>
            <li><a className="text-white/85 hover:text-white underline-offset-4 hover:underline" href={MEMORIA_URL} target="_blank" rel="noopener noreferrer">Memoria técnica</a></li>
          </ul>
          <p className="md:col-span-4 text-[13px] text-white/55 leading-relaxed">
            Datos de embalses.net, SAIH del MITECO, OMIE, MDT200 del IGN e inventario de presas y embalses del MITECO;
            imágenes Copernicus Sentinel-2 a través de Earth Search. La energía y el valor de mercado son estimaciones.
          </p>
        </div>
      </footer>
    </div>
  );
}
