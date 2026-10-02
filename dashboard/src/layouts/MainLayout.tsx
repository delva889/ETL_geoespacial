import { Outlet, NavLink } from 'react-router-dom';
import { Github } from 'lucide-react';

const REPO_URL = 'https://github.com/delva889/ETL_geoespacial';

export default function MainLayout() {
  const navItems = [
    { name: 'Introducción', path: '/', code: '01' },
    { name: 'Objetivos', path: '/objetivos', code: '02' },
    { name: 'Datos y fuentes', path: '/metodologia', code: '03' },
    { name: 'Visor', path: '/visor', code: '04' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="bg-ink text-paper sticky top-0 z-50 relative overflow-hidden">
        <div className="lines-bg absolute inset-0 text-teal opacity-[0.08] pointer-events-none" aria-hidden="true" />
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-4 lg:py-0 lg:h-20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="font-data text-xs text-teal tracking-wider shrink-0">HGE&nbsp;/&nbsp;ES</span>
                <h1 className="font-display text-base sm:text-lg font-semibold leading-none tracking-tight">
                  Modelo de integración geoespacial
                  <span className="block font-sans font-normal text-[11px] text-paper/60 mt-1 tracking-normal">
                    Energía hidráulica en España
                  </span>
                </h1>
              </div>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="lg:hidden flex items-center gap-1.5 text-paper/70 hover:text-paper transition-colors text-xs shrink-0"
              >
                <Github size={16} />
                Código
              </a>
            </div>

            <nav className="flex flex-wrap items-stretch gap-x-6 gap-y-1 lg:gap-x-8 lg:h-full">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-2 text-[15px] py-1.5 lg:py-0 lg:border-t-2 transition-colors ${
                      isActive
                        ? 'border-teal text-paper'
                        : 'border-transparent text-paper/55 hover:text-paper hover:border-paper/30'
                    }`
                  }
                >
                  <span className="font-data text-[10px] text-paper/40 group-hover:text-paper/60">
                    {item.code}
                  </span>
                  {item.name}
                </NavLink>
              ))}
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 text-paper/50 hover:text-paper transition-colors text-sm shrink-0"
                title="Ver repositorio en GitHub"
              >
                <Github size={16} />
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-data text-[11px] text-muted tracking-wide mb-2">
              FUENTES: EMBALSES.NET · MITECO/SAIH · OMIE · IGN
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Las métricas de energía y valor de mercado son estimaciones orientativas obtenidas
              por integración de datos públicos y no corresponden a lecturas operativas oficiales.
            </p>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-data text-xs text-teal hover:text-ink transition-colors shrink-0"
          >
            github.com/delva889/ETL_geoespacial
          </a>
        </div>
      </footer>
    </div>
  );
}
