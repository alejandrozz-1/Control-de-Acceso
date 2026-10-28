import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { brand } from '../app/theme';

/** Pantalla Acceso: fondo azul Repsol, QR a pantalla completa (Fase 2 lo hace funcional). */
export default function Acceso() {
  return (
    <Box
      sx={{
        minHeight: 'calc(100dvh - 72px)',
        bgcolor: brand.blue,
        color: brand.white,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        px: 3,
        pt: 3,
      }}
    >
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
        Acceso
      </Typography>
      <Box
        sx={{
          width: 260,
          height: 260,
          borderRadius: 3,
          bgcolor: brand.white,
          color: brand.blue,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="QR de acceso pendiente de generar"
      >
        <QrCode2Icon sx={{ fontSize: 140 }} />
      </Box>
      <Chip label="Fase 2 — emisión de credenciales" sx={{ bgcolor: brand.orange, color: brand.blue }} />
      <Typography variant="body2" sx={{ opacity: 0.85, textAlign: 'center' }}>
        Tu credencial aparecerá aquí. También podrás usar un código temporal como alternativa.
      </Typography>
    </Box>
  );
}
