import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[3000] focus:bg-ink focus:text-paper focus:px-3 focus:py-2">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-[1000] bg-paper/95 backdrop-blur-sm border-b border-rule">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-baseline gap-3 min-w-0" aria-label={`${AUTHOR}, inicio`}>
            <span className="font-serif text-[24px] sm:text-[26px] leading-none tracking-tight whitespace-nowrap" translate="no">{AUTHOR}</span>
            <span className="hidden lg:inline text-[14px] text-muted whitespace-nowrap">Ingeniería de datos geoespaciales</span>
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-0.5 sm:gap-6 text-[14px] sm:text-[15px] shrink-0">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-1.5 sm:px-0 py-3 border-b transition-colors duration-200 ${
                    isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
              className="hidden sm:block py-3 text-muted hover:text-ink transition-colors duration-200">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main id="contenido" className="flex-grow w-full flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-ink">
        <div className="max-w-[1360px] mx-auto w-full px-5 sm:px-8 py-12 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-serif text-3xl leading-none">{AUTHOR}</p>
            <p className="text-ink-2 mt-3">Ingeniería de datos geoespaciales, SIG y observación de la Tierra.</p>
          </div>
          <ul className="md:col-span-3 space-y-2 text-[15px]">
            <li><a className="link" href={REPO_URL} target="_blank" rel="noopener noreferrer">Repositorio en GitHub</a></li>
            <li><a className="link" href={MEMORIA_URL} target="_blank" rel="noopener noreferrer">Memoria técnica (PDF)</a></li>
          </ul>
          <p className="md:col-span-4 text-[13px] text-muted leading-relaxed">
            Datos de embalses.net, SAIH del MITECO, OMIE, MDT200 del IGN y Copernicus Sentinel-2 a través de Earth Search.
            La energía y el valor de mercado son estimaciones, no lecturas de explotación.
          </p>
        </div>
      </footer>
    </div>
  );
}
