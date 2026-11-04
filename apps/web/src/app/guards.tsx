import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasRole, useAuthStore, type Role } from '../services/auth';
import { useI18n } from '../i18n/I18nProvider';

function Loading() {
  const { t } = useI18n();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }} role="status" aria-label={t('Cargando')}>
      <CircularProgress />
    </Box>
  );
}

/** Sin sesión válida → /login. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { session, initializing, profile, profileLoaded, profileError, signOut } = useAuthStore();
  const location = useLocation();
  if (initializing) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (!profileLoaded) return <Loading />;
  if (profileError || !profile) {
    return (
      <Container maxWidth="xs" sx={{ pt: 10 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo verificar el perfil de esta cuenta. Cierra sesión y vuelve a intentarlo; si el problema continúa, contacta con soporte.
        </Alert>
        <Button variant="outlined" onClick={() => void signOut()}>Cerrar sesión</Button>
      </Container>
    );
  }
  if (profile?.must_change_password && location.pathname !== '/activar') {
    return <Navigate to="/activar" replace />;
  }
  if (profile?.status === 'bloqueado' || profile?.status === 'inactivo') {
    return (
      <Container maxWidth="xs" sx={{ pt: 10 }}>
        <Alert severity="error" sx={{ mb: 2 }}>Tu cuenta está desactivada. Contacta con el administrador de tu organización.</Alert>
        <Typography color="text.secondary" sx={{ mb: 2 }}>{session.user.email}</Typography>
        <Button variant="outlined" onClick={() => void signOut()}>Cerrar sesión</Button>
      </Container>
    );
  }
  return <>{children ?? <Outlet />}</>;
}

/** Requiere sesión + rol mínimo (perfil aún cargando → spinner; sin permiso → /). */
export function RequireRole({ min, children }: { min: Role; children?: ReactNode }) {
  const { session, profile, initializing, profileLoaded } = useAuthStore();
  if (initializing) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  // El profile llega después del primer render de la sesión; sin esto, cargar /admin/* a pulso rebotaría en /
  if (!profileLoaded) return <Loading />;
  if (!hasRole(profile, min)) return <Navigate to="/" replace />;
  return <>{children ?? <Outlet />}</>;
}
