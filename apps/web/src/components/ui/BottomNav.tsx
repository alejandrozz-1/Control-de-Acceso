import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useLocation, useNavigate } from 'react-router-dom';

export const NAV_ITEMS = [
  { label: 'Inicio', path: '/', icon: <HomeIcon /> },
  { label: 'Calendario', path: '/calendario', icon: <CalendarMonthIcon /> },
  { label: 'Acceso', path: '/acceso', icon: <QrCodeScannerIcon /> },
  { label: 'Notificaciones', path: '/notificaciones', icon: <NotificationsIcon /> },
  { label: 'Cuenta', path: '/cuenta', icon: <PersonIcon /> },
] as const;

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((i) => i.path === pathname)?.path ?? '/';

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderRadius: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        aria-label="Navegación principal"
        value={current}
        onChange={(_, path: string) => navigate(path)}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction key={item.path} value={item.path} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
