import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorScheme } from '@mui/material/styles';
import { useState } from 'react';
import RepsolFlame from './RepsolFlame';
import { useAuthStore } from '../../services/auth';

const STORAGE_KEY = 'rps-onboarding-done';

export function isOnboardingPending(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return false; // sin storage accesible: no bloquear al usuario
  }
}

function markOnboardingDone() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* best-effort */
  }
}

const STEPS = [
  {
    title: 'Bienvenido a Control de Acceso',
    body: 'Consulta tu turno, muestra tu credencial digital y sigue tu actividad desde un solo lugar.',
    icon: <RepsolFlame size={72} />,
  },
  {
    title: 'Cómo funciona',
    body: 'El calendario muestra tu rotación de turnos y festivos. En «Acceso» generas tu QR temporal cada vez que entras a una instalación.',
    icon: (
      <Box sx={{ display: 'flex', gap: 2, color: 'primary.main' }}>
        <CalendarMonthIcon fontSize="large" />
        <QrCodeScannerIcon fontSize="large" />
        <NotificationsIcon fontSize="large" />
      </Box>
    ),
  },
];

/** Onboarding first-login: 2 pasos cortos + preferencia de tema, una sola vez por dispositivo. */
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(isOnboardingPending);
  const { mode, setMode } = useColorScheme();
  const fullName = useAuthStore((s) => s.profile?.full_name);

  const close = () => {
    markOnboardingDone();
    setOpen(false);
  };

  if (!open) return null;
  const isThemeStep = step >= STEPS.length;

  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs" aria-label="Bienvenida">
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        {isThemeStep ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 2, color: 'primary.main' }}>
              {mode === 'dark' ? <DarkModeIcon fontSize="large" /> : <LightModeIcon fontSize="large" />}
            </Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800, mb: 1 }}>
              Elige tu tema
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Puedes cambiarlo después en tu cuenta.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button variant={mode === 'light' ? 'contained' : 'outlined'} startIcon={<LightModeIcon />} onClick={() => setMode('light')}>
                Claro
              </Button>
              <Button variant={mode === 'dark' ? 'contained' : 'outlined'} startIcon={<DarkModeIcon />} onClick={() => setMode('dark')}>
                Oscuro
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>{STEPS[step].icon}</Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800, mb: 1 }}>
              {STEPS[step].title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fullName ? `${fullName.split(' ')[0]}, ` : ''}{STEPS[step].body}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
        <Button size="small" onClick={close}>
          Saltar
        </Button>
        <Button
          variant="contained"
          onClick={() => (isThemeStep ? close() : setStep(step + 1))}
          sx={{ px: 3 }}
        >
          {isThemeStep ? 'Empezar' : 'Siguiente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
