import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import BottomNav from '../components/ui/BottomNav';
import AppHeader from '../components/ui/AppHeader';
import Onboarding from '../components/ui/Onboarding';
import { useNotificationsRealtime } from '../services/notifications';

/** Shell de la app: contenido + navegación inferior fija (mobile-first). */
export default function Shell() {
  useNotificationsRealtime();
  return (
    <>
      <Onboarding />
      <Box
        component="main"
        sx={{
          pb: 'calc(72px + env(safe-area-inset-bottom))',
          minHeight: '100dvh',
          position: 'relative',
        }}
      >
        <AppHeader />
        <Outlet />
      </Box>
      <BottomNav />
    </>
  );
}
