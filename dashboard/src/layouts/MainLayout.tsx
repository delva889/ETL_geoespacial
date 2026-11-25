import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { REPO_URL, MEMORIA_URL, AUTHOR } from '../lib/data';

const NAV = [
  { name: 'Proyecto', path: '/' },
  { name: 'Visor', path: '/visor' },
  { name: 'Metodología', path: '/metodologia' },
];

export default function MainLayout() {
  const { pathname } = useLocation();
  const enPortada = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sobre la portada oscura la barra es transparente; al bajar (o en otras páginas) es clara
  const oscura = enPortada && !scrolled;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[3000] focus:bg-ink focus:text-white focus:px-3 focus:py-2 focus:rounded-lg">
        Saltar al contenido
      </a>

      <header
        className={`${enPortada ? 'fixed' : 'sticky'} top-0 inset-x-0 z-[1000] transition-colors duration-300 ${
          oscura ? 'bg-transparent text-white' : 'bg-white/85 backdrop-blur-md text-ink border-b border-rule'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 min-w-0" aria-label={`${AUTHOR}, inicio`}>
            <span className={`grid place-items-center w-8 h-8 rounded-lg text-[13px] font-semibold shrink-0 ${oscura ? 'bg-white text-night' : 'bg-ink text-white'}`} aria-hidden="true">
              CV
            </span>
            <span className="hidden sm:inline text-[15px] font-semibold tracking-tight whitespace-nowrap" translate="no">{AUTHOR}</span>
            <span className={`hidden lg:inline text-[14px] whitespace-nowrap ${oscura ? 'text-white/60' : 'text-muted'}`}>Datos geoespaciales</span>
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-1 text-[14px] shrink-0">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-full transition-colors duration-200 ${
                    isActive
                      ? oscura ? 'bg-white/15 text-white' : 'bg-paper-2 text-ink'
                      : oscura ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
              className={`hidden sm:inline-flex ml-2 btn !min-h-[36px] !px-4 !text-[14px] ${oscura ? 'btn-light' : 'btn-ink'}`}>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main id="contenido" className="flex-grow w-full flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-night text-white">
        <div className="max-w-[1280px] mx-auto w-full px-5 sm:px-8 py-14 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-2xl font-semibold tracking-tight">{AUTHOR}</p>
            <p className="text-white/65 mt-2">Ingeniería de datos geoespaciales, SIG y observación de la Tierra.</p>
          </div>
          <ul className="md:col-span-3 space-y-2 text-[15px]">
            <li><a className="text-white/85 hover:text-white underline-offset-4 hover:underline" href={REPO_URL} target="_blank" rel="noopener noreferrer">Repositorio en GitHub</a></li>
            <li><a className="text-white/85 hover:text-white underline-offset-4 hover:underline" href={MEMORIA_URL} target="_blank" rel="noopener noreferrer">Memoria técnica (PDF)</a></li>
          </ul>
          <p className="md:col-span-4 text-[13px] text-white/55 leading-relaxed">
            Datos de embalses.net, SAIH del MITECO, OMIE, MDT200 del IGN y Copernicus Sentinel-2 a través de Earth Search.
            La energía y el valor de mercado son estimaciones, no lecturas de explotación.
          </p>
        </div>
      </footer>
    </div>
  );
}
