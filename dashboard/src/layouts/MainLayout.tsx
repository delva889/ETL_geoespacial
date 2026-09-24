import { Outlet, NavLink } from 'react-router-dom';

export default function MainLayout() {
  const navItems = [
    { name: 'Introducción', path: '/' },
    { name: 'Visor Cartográfico', path: '/visor' },
    { name: 'Objetivos', path: '/objetivos' },
    { name: 'Fuentes y Datos', path: '/metodologia' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans flex flex-col">
      <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-4 md:py-0 md:h-16">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-bold text-neutral-900 leading-tight uppercase tracking-wide">
                  Modelo de Integración Geoespacial
                </h1>
                <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">
                  Energía Hidráulica en España
                </p>
              </div>
            </div>
            
            <nav className="flex flex-wrap justify-center md:justify-end w-full md:w-auto gap-4 md:gap-8 mt-4 md:mt-0">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `py-2 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 flex items-center ${
                      isActive 
                        ? 'border-blue-600 text-blue-700' 
                        : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-400'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-screen-2xl mx-auto px-2 sm:px-6 lg:px-8 py-6 flex flex-col">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-neutral-200 py-6 mt-auto">
        <div className="max-w-screen-2xl mx-auto px-4 flex flex-col items-center justify-center gap-3 text-center text-neutral-500">
          <p className="text-xs font-bold uppercase tracking-wider">
            Fuentes de Datos Abiertos: embalses.net / MITECO / OMIE
          </p>
          <div className="max-w-4xl px-4 py-2 bg-yellow-50/50 border border-yellow-100 rounded text-[11px] text-neutral-400">
            <strong>Aviso:</strong> Las métricas, valores económicos y capacidades mostradas en este visor son <strong>aproximaciones teóricas</strong> basadas en la integración de datos públicos. Tienen un fin puramente orientativo y <strong>pueden no corresponder completamente a la realidad operativa</strong> de las instalaciones hídricas.
          </div>
        </div>
      </footer>
    </div>
  );
}
