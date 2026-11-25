import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Proyecto from './pages/Proyecto';
import Metodologia from './pages/Metodologia';

const Visor = lazy(() => import('./pages/Visor'));

const Cargando = () => (
  <div className="flex-1 flex items-center justify-center p-16 font-data text-xs text-muted">Cargando visor…</div>
);

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Proyecto />} />
          <Route path="visor" element={<Suspense fallback={<Cargando />}><Visor /></Suspense>} />
          <Route path="metodologia" element={<Metodologia />} />
          <Route path="objetivos" element={<Navigate to="/metodologia" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
