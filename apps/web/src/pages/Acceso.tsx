import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { brand } from '../app/theme';
import {
  formatCountdown,
  issueQr,
  issueTemporal,
  secondsUntil,
  type QrCredential,
} from '../services/access';

const QR_TTL_SECONDS = 60;

/** Ticker de 1 s para el countdown (solo montado con un QR en pantalla). */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** Pantalla Acceso: fondo azul Repsol, QR a pantalla completa + código temporal (US-02). */
export default function Acceso() {
  const qrQuery = useQuery<QrCredential>({
    queryKey: ['access-qr'],
    queryFn: issueQr,
    refetchInterval: QR_TTL_SECONDS * 1000 - 5_000, // renueva 5 s antes de caducar
    retry: 1,
  });
  const [temporal, setTemporal] = useState<{ code: string; expires_at: string } | null>(null);
  const [temporalError, setTemporalError] = useState<string | null>(null);
  const [temporalBusy, setTemporalBusy] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const qr = qrQuery.data;
  const now = useNow(true);
  const qrSeconds = qr ? secondsUntil(qr.expires_at, now) : 0;

  useEffect(() => {
    let cancelled = false;
    if (qr) {
      QRCode.toDataURL(qr.payload, {
        margin: 1,
        width: 512,
        color: { dark: brand.blue, light: '#FFFFFF' },
      })
        .then((url) => !cancelled && setQrImage(url))
        .catch(() => !cancelled && setQrImage(null));
    }
    return () => {
      cancelled = true;
    };
  }, [qr]);

  async function onTemporal() {
    setTemporalBusy(true);
    setTemporalError(null);
    try {
      const t = await issueTemporal();
      setTemporal({ code: t.code, expires_at: t.expires_at });
    } catch (err) {
      setTemporalError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setTemporalBusy(false);
    }
  }

  const temporalSeconds = temporal ? secondsUntil(temporal.expires_at, now) : 0;

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
        gap: 2.5,
        px: 3,
        pt: 3,
        pb: 4,
      }}
    >
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
        Tu credencial de acceso
      </Typography>

      {qrQuery.isError && (
        <Alert
          severity="error"
          variant="filled"
          role="alert"
          sx={{ width: '100%', maxWidth: 360 }}
          action={
            <Button color="inherit" size="small" onClick={() => qrQuery.refetch()}>
              Reintentar
            </Button>
          }
        >
          No se pudo generar tu QR.
        </Alert>
      )}

      <Box
        sx={{
          width: 272,
          height: 272,
          borderRadius: 3,
          bgcolor: brand.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          position: 'relative',
        }}
        aria-label={
          qr && qrImage
            ? `Código QR de acceso, caduca en ${formatCountdown(qrSeconds)}`
            : 'Generando código QR'
        }
      >
        {/* Esquinas de visor estilo escáner (ref. index.html del compañero) */}
        {[
          { top: -6, left: -6, borderTop: 4, borderLeft: 4, borderRadius: '10px 0 0 0' },
          { top: -6, right: -6, borderTop: 4, borderRight: 4, borderRadius: '0 10px 0 0' },
          { bottom: -6, left: -6, borderBottom: 4, borderLeft: 4, borderRadius: '0 0 0 10px' },
          { bottom: -6, right: -6, borderBottom: 4, borderRight: 4, borderRadius: '0 0 10px 0' },
        ].map((corner, i) => (
          <Box
            key={i}
            aria-hidden
            sx={{
              position: 'absolute',
              width: 26,
              height: 26,
              borderStyle: 'solid',
              borderColor: brand.orange,
              ...corner,
            }}
          />
        ))}
        {qrQuery.isLoading ? (
          <CircularProgress size={48} sx={{ color: brand.blue }} />
        ) : qr && qrImage ? (
          <Box component="img" src={qrImage} alt="" sx={{ width: 240, height: 240 }} />
        ) : (
          <QrCode2Icon sx={{ fontSize: 120, color: brand.blue }} />
        )}
      </Box>

      {qr && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            size="small"
            label={qrSeconds > 0 ? 'Activa' : 'Caducada'}
            sx={{
              bgcolor: qrSeconds > 0 ? '#1FA971' : brand.orange,
              color: qrSeconds > 0 ? brand.white : brand.blue,
              fontWeight: 600,
            }}
          />
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', opacity: 0.9 }} aria-live="polite">
            Caduca en {formatCountdown(qrSeconds)}
          </Typography>
        </Box>
      )}

      {temporalError && (
        <Alert severity="error" variant="filled" role="alert" sx={{ maxWidth: 360 }}>
          {temporalError}
        </Alert>
      )}

      {temporal && temporalSeconds > 0 ? (
        <Box sx={{ textAlign: 'center' }} aria-live="polite">
          <Typography variant="h3" component="p" sx={{ fontWeight: 700, letterSpacing: 6, fontVariantNumeric: 'tabular-nums' }}>
            {temporal.code}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Código temporal · caduca en {formatCountdown(temporalSeconds)}
          </Typography>
        </Box>
      ) : (
        <Button
          variant="outlined"
          onClick={onTemporal}
          disabled={temporalBusy}
          sx={{
            color: brand.white,
            borderColor: 'rgba(255,255,255,0.5)',
            minWidth: 240,
            '&:hover': { borderColor: brand.white, bgcolor: 'rgba(255,255,255,0.08)' },
          }}
        >
          {temporalBusy ? 'Generando…' : 'Usar código temporal'}
        </Button>
      )}

      <Typography variant="caption" sx={{ opacity: 0.7, textAlign: 'center', maxWidth: 320 }}>
        Muéstralo en el lector al entrar. El acceso queda registrado automáticamente.
      </Typography>
    </Box>
  );
}
