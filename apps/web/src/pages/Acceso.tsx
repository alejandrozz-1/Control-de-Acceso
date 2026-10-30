import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { brand } from '../app/theme';
import { supabase } from '../services/supabase';
import { getNotificationTargetFromState } from './notificationPresentation';
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
  const [, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return Date.now();
}

/** Pantalla Acceso: fondo azul Repsol, QR a pantalla completa + código temporal (US-02). */
export default function Acceso() {
  const location = useLocation();
  const target = getNotificationTargetFromState(location.state);
  const credentialTarget = target?.kind === 'credential' ? target : null;
  const qrQuery = useQuery<QrCredential>({
    queryKey: ['access-qr'],
    queryFn: issueQr,
    retry: 1,
  });
  const credentialQuery = useQuery({
    queryKey: ['notification-credential', credentialTarget?.id],
    enabled: !!credentialTarget,
    queryFn: async () => {
      if (!credentialTarget) return null;
      const { data, error } = await supabase
        .from('access_credentials')
        .select('status')
        .eq('id', credentialTarget.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { refetch: refetchQr, isFetching: qrFetching } = qrQuery;
  const [temporal, setTemporal] = useState<{ code: string; expires_at: string } | null>(null);
  const [temporalError, setTemporalError] = useState<string | null>(null);
  const [temporalBusy, setTemporalBusy] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const qr = qrQuery.data;
  const now = useNow(true);
  const qrSeconds = qr
    ? Math.min(QR_TTL_SECONDS, secondsUntil(qr.expires_at, now))
    : 0;

  useEffect(() => {
    if (!qr || qrFetching || secondsUntil(qr.expires_at) === 0) return;

    const delay = Math.max(0, new Date(qr.expires_at).getTime() - Date.now());
    const timeout = window.setTimeout(() => {
      void refetchQr();
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [qr, qrFetching, refetchQr]);

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
        minHeight: 'calc(100dvh - 136px)',
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

      {credentialTarget && credentialQuery.isLoading && (
        <Alert severity="info" sx={{ width: '100%', maxWidth: 360 }}>
          Consultando la credencial relacionada…
        </Alert>
      )}
      {credentialTarget && credentialQuery.data && (
        <Alert severity={credentialQuery.data.status === 'revocada' ? 'warning' : 'info'} sx={{ width: '100%', maxWidth: 360 }}>
          Credencial relacionada: {credentialQuery.data.status}
        </Alert>
      )}
      {credentialTarget && credentialQuery.isError && (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 360 }}>
          No se pudo consultar la credencial relacionada.
        </Alert>
      )}
      {credentialTarget && !credentialQuery.isLoading && !credentialQuery.isError && !credentialQuery.data && (
        <Alert severity="warning" sx={{ width: '100%', maxWidth: 360 }}>
          La credencial relacionada ya no está disponible.
        </Alert>
      )}

      {qrQuery.isError && (
        <Alert
          severity="error"
          variant="filled"
          role="alert"
          sx={{ width: '100%', maxWidth: 360 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetchQr()}>
              Reintentar
            </Button>
          }
        >
          No se pudo generar tu QR.
        </Alert>
      )}

      <Box
        sx={{
          width: 288,
          height: 288,
          boxSizing: 'border-box',
          p: 1.5,
          border: `3px solid ${brand.orange}`,
          borderRadius: 4,
          bgcolor: brand.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 36px rgba(0,0,0,0.32), 0 0 0 4px rgba(255,130,0,0.14)',
          position: 'relative',
        }}
        aria-label={
          qr && qrImage
            ? `Código QR de acceso, caduca en ${formatCountdown(qrSeconds)}`
            : 'Generando código QR'
        }
      >
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

      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={() => void refetchQr()}
        disabled={qrQuery.isFetching}
        sx={{
          color: brand.white,
          borderColor: 'rgba(255,255,255,0.65)',
          minWidth: 240,
          '&:hover': { borderColor: brand.white, bgcolor: 'rgba(255,255,255,0.08)' },
        }}
      >
        {qrQuery.isLoading
          ? 'Generando código QR…'
          : qrFetching
            ? 'Regenerando…'
            : 'Regenerar código QR'}
      </Button>

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
