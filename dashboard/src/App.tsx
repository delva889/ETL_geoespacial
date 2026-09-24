import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Introduccion from './pages/Introduccion';
import Objetivos from './pages/Objetivos';
import Metodologia from './pages/Metodologia';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Introduccion />} />
          <Route path="visor" element={<Dashboard />} />
          <Route path="objetivos" element={<Objetivos />} />
          <Route path="metodologia" element={<Metodologia />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
