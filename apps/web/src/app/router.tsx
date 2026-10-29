import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './guards';
import Shell from './Shell';
import Login from '../pages/Login';
import Inicio from '../pages/Inicio';
import Calendario from '../pages/Calendario';
import Acceso from '../pages/Acceso';
import Notificaciones from '../pages/Notificaciones';
import Cuenta from '../pages/Cuenta';
import AdminUsuarios from '../pages/admin/Usuarios';
import HistorialAcceso from '../pages/HistorialAcceso';
import AdminFestivos from '../pages/admin/Festivos';
import AdminCredenciales from '../pages/admin/Credenciales';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><Shell /></RequireAuth>}>
        <Route path="/" element={<Inicio />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/acceso" element={<Acceso />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/cuenta" element={<Cuenta />} />
        <Route path="/historial-acceso" element={<HistorialAcceso />} />
        <Route element={<RequireRole min="responsable" />}>
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/festivos" element={<AdminFestivos />} />
          <Route path="/admin/credenciales" element={<AdminCredenciales />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
