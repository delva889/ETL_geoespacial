import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Proyecto from './pages/Proyecto';
import Metodologia from './pages/Metodologia';

const Visor = lazy(() => import('./pages/Visor'));

const Cargando = () => (
  <div className="flex-1 flex items-center justify-center p-16 text-ink-2">Cargando el visor…</div>
);

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* El visor es la portada: lo primero que ve quien entra */}
          <Route index element={<Suspense fallback={<Cargando />}><Visor /></Suspense>} />
          <Route path="proyecto" element={<Proyecto />} />
          <Route path="metodologia" element={<Metodologia />} />
          <Route path="visor" element={<Navigate to="/" replace />} />
          <Route path="objetivos" element={<Navigate to="/proyecto" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
