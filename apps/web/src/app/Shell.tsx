import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import BottomNav from '../components/ui/BottomNav';
import Onboarding from '../components/ui/Onboarding';

/** Shell de la app: contenido + navegación inferior fija (mobile-first). */
export default function Shell() {
  return (
    <>
      <Onboarding />
      <Box component="main" sx={{ pb: 'calc(72px + env(safe-area-inset-bottom))', minHeight: '100dvh' }}>
        <Outlet />
      </Box>
      <BottomNav />
    </>
  );
}
