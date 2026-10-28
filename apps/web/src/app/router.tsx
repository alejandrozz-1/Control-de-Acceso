import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './Shell';
import Inicio from '../pages/Inicio';
import Calendario from '../pages/Calendario';
import Acceso from '../pages/Acceso';
import Notificaciones from '../pages/Notificaciones';
import Cuenta from '../pages/Cuenta';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/acceso" element={<Acceso />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/cuenta" element={<Cuenta />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
