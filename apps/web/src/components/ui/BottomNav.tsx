import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Fab from '@mui/material/Fab';
import Paper from '@mui/material/Paper';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeIcon from '@mui/icons-material/Home';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useLocation, useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';

export const NAV_ITEMS = [
  { label: 'Inicio', path: '/', icon: <HomeIcon /> },
  { label: 'Calendario', path: '/calendario', icon: <CalendarMonthIcon /> },
  { label: 'Acceso', path: '/acceso', icon: <QrCodeScannerIcon /> },
] as const;

export function getActiveNavPath(pathname: string): string | null {
  return NAV_ITEMS.find((item) => item.path === pathname)?.path ?? null;
}

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = getActiveNavPath(pathname);

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderRadius: '20px 20px 0 0',
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflow: 'visible',
      }}
    >
      <Box
        component="nav"
        aria-label="Navegación principal"
        sx={{
          height: 72,
          maxWidth: 600,
          mx: 'auto',
          px: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
        {NAV_ITEMS.slice(0, 1).map((item) => (
          <ButtonBase
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={current === item.path ? 'page' : undefined}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 0.25,
              color: current === item.path ? 'primary.main' : 'text.secondary',
              borderRadius: 2,
            }}
          >
            {item.icon}
            <Typography variant="caption" sx={{ fontWeight: current === item.path ? 700 : 500 }}>
              {item.label}
            </Typography>
          </ButtonBase>
        ))}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', pb: 1.25 }}>
          <Typography variant="caption" sx={{ color: current === '/acceso' ? 'primary.main' : 'text.secondary', fontWeight: current === '/acceso' ? 700 : 500 }}>
            Acceso
          </Typography>
        </Box>
        {NAV_ITEMS.slice(1, 2).map((item) => (
          <ButtonBase
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={current === item.path ? 'page' : undefined}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 0.25,
              color: current === item.path ? 'primary.main' : 'text.secondary',
              borderRadius: 2,
            }}
          >
            {item.icon}
            <Typography variant="caption" sx={{ fontWeight: current === item.path ? 700 : 500 }}>
              {item.label}
            </Typography>
          </ButtonBase>
        ))}
        <Fab
          color="secondary"
          aria-label="Acceso"
          aria-current={current === '/acceso' ? 'page' : undefined}
          onClick={() => navigate('/acceso')}
          sx={{
            position: 'absolute',
            left: '50%',
            top: -24,
            transform: 'translateX(-50%)',
            width: 58,
            height: 58,
            minHeight: 58,
            border: '4px solid',
            borderColor: 'background.default',
            boxShadow: '0 6px 16px rgba(4, 30, 66, 0.25)',
            '&:hover': { transform: 'translateX(-50%) translateY(-2px)' },
          }}
        >
          <QrCodeScannerIcon />
        </Fab>
      </Box>
    </Paper>
  );
}