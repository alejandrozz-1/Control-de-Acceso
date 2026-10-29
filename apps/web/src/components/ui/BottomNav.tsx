import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUnreadCount } from '../../services/notifications';

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
  const unread = useUnreadCount();

  const iconFor = (label: string, icon: React.ReactNode) =>
    label === 'Notificaciones' ? (
      <Badge badgeContent={unread.data ?? 0} color="error" max={9} overlap="circular">
        {icon}
      </Badge>
    ) : (
      icon
    );

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
          <BottomNavigationAction
            key={item.path}
            value={item.path}
            label={item.label}
            icon={iconFor(item.label, item.icon)}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
