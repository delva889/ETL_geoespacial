import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Github, FileText } from 'lucide-react';
import { REPO_URL, MEMORIA_URL, AUTHOR } from '../lib/data';

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
    <div className="min-h-screen flex flex-col bg-base text-fg">
      <header className="sticky top-0 z-[1000] border-b border-line bg-void/85 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <Logo />
            <span className="font-display text-[15px] font-semibold tracking-tight">
              Hidro<span className="text-signal">GEO</span>
            </span>
            <span className="hidden md:inline font-data text-[10px] text-muted border-l border-line pl-2.5 ml-0.5">
              Embalses de España · ETL geoespacial
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm transition-colors ${
                    isActive ? 'text-fg bg-raised' : 'text-muted hover:text-fg'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            <span className="hidden sm:block w-px h-5 bg-line mx-1" />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted hover:text-fg transition-colors"
              title="Código en GitHub"
            >
              <Github size={16} />
              <span className="hidden lg:inline">Código</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow w-full flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-void">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold text-fg">{AUTHOR}</p>
            <p className="text-xs text-muted mt-1">
              Ingeniería de datos geoespaciales · SIG · Observación de la Tierra
            </p>
            <p className="text-[11px] text-muted/80 leading-relaxed mt-4">
              Fuentes: embalses.net · MITECO/SAIH · OMIE · IGN (MDT200) · Copernicus Sentinel-2 vía Earth Search (STAC).
              Las cifras de energía y valor de mercado son estimaciones orientativas, no lecturas operativas oficiales.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-line hover:border-signal px-3 py-2 text-xs text-fg-soft hover:text-fg transition-colors">
              <Github size={14} /> Repositorio
            </a>
            <a href={MEMORIA_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-line hover:border-signal px-3 py-2 text-xs text-fg-soft hover:text-fg transition-colors">
              <FileText size={14} /> Memoria técnica (PDF)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" stroke="#35d0c3" strokeWidth="1.2" opacity="0.5" />
      <circle cx="12" cy="12" r="6" stroke="#35d0c3" strokeWidth="1.2" />
      <path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="#35d0c3" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="1.6" fill="#35d0c3" />
    </svg>
  );
}
