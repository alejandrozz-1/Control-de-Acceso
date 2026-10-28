import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { hasRole, useAuthStore, type Role } from '../services/auth';

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }} role="status" aria-label="Cargando">
      <CircularProgress />
    </Box>
  );
}

/** Sin sesión válida → /login. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { session, initializing } = useAuthStore();
  if (initializing) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children ?? <Outlet />}</>;
}

/** Requiere sesión + rol mínimo (no decidido → /login; sin permiso → /. */
export function RequireRole({ min, children }: { min: Role; children?: ReactNode }) {
  const { session, profile, initializing } = useAuthStore();
  if (initializing) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (!hasRole(profile, min)) return <Navigate to="/" replace />;
  return <>{children ?? <Outlet />}</>;
}
