import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HistoryIcon from '@mui/icons-material/History';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { brand } from '../app/theme';
import RepsolFlame from '../components/ui/RepsolFlame';
import { useAuthStore } from '../services/auth';
import { supabase } from '../services/supabase';
import { getIntlLocale } from '../i18n/catalog';
import { useI18n } from '../i18n/I18nProvider';

interface TodayShift {
  code: string;
  start_time: string | null;
  end_time: string | null;
  overnight: boolean;
}

type ShiftState = {
  label: string;
  active: boolean;
  shift: TodayShift | null;
};

const SHIFT_LABEL: Record<string, string> = { M: 'Mañana', T: 'Tarde', N: 'Noche', L: 'Libre' };
const ACCESS_METHOD_LABEL: Record<string, string> = {
  qr: 'Código QR',
  temporal: 'Código temporal',
  nfc: 'NFC',
  manual: 'Registro manual',
};
const ACCESS_SOURCE_LABEL: Record<string, string> = {
  app: 'Aplicación',
  torno: 'Torno de acceso',
  manual: 'Registro manual',
};

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeInMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getCurrentShiftState(
  todayShift: TodayShift | null | undefined,
  previousShift: TodayShift | null | undefined,
  now: Date,
): ShiftState {
  const currentMinute = now.getHours() * 60 + now.getMinutes();

  if (
    previousShift?.code !== undefined &&
    previousShift.code !== 'L' &&
    previousShift.overnight &&
    previousShift.end_time &&
    currentMinute < timeInMinutes(previousShift.end_time)
  ) {
    return { label: 'En turno', active: true, shift: previousShift };
  }

  if (!todayShift) return { label: 'Sin turno hoy', active: false, shift: null };
  if (todayShift.code === 'L') return { label: 'Fuera de turno', active: false, shift: todayShift };
  if (!todayShift.start_time || !todayShift.end_time) {
    return { label: 'Turno asignado', active: false, shift: todayShift };
  }

  const start = timeInMinutes(todayShift.start_time);
  const end = timeInMinutes(todayShift.end_time);
  if (currentMinute < start) {
    return { label: 'Próximo turno', active: false, shift: todayShift };
  }

  if (todayShift.overnight || end <= start) {
    return { label: 'En turno', active: true, shift: todayShift };
  }
  if (currentMinute < end) {
    return { label: 'En turno', active: true, shift: todayShift };
  }

  return { label: 'Turno finalizado', active: false, shift: todayShift };
}

function greeting(name: string, t: (key: string) => string): string {
  const h = new Date().getHours();
  const hello = t(h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches');
  const firstName = name.split(' ')[0] ?? name;
  return `${hello}, ${firstName}`;
}

/** % de jornada transcurrido (0-100); soporta turno de noche cruzando medianoche. */
export function shiftProgress(start: string, end: string, overnight: boolean, now: Date): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const s = toMin(start);
  const eRaw = toMin(end);
  const duration = overnight ? (eRaw + 1440 - s) % 1440 || 1440 : eRaw - s;
  if (duration <= 0) return 0;
  let elapsed = now.getHours() * 60 + now.getMinutes() - s;
  if (elapsed < 0) {
    if (overnight) elapsed += 1440;
    else return 0;
  }
  if (elapsed > duration) return 100;
  return Math.round((elapsed / duration) * 100);
}

/** Inicio: cabecera Waylet (saludo+reloj+estado) y turno de hoy con datos reales. */
export default function Inicio() {
  const { profile } = useAuthStore();
  const { locale, t } = useI18n();
  const intlLocale = getIntlLocale(locale);
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = dateKey(now);
  const yesterday = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const shiftQuery = useQuery({
    queryKey: ['shift-today', profile?.id, today],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_entries')
        .select('code, start_time, end_time, overnight')
        .eq('user_id', profile!.id)
        .eq('date', today)
        .maybeSingle();
      if (error) throw error;
      return data as TodayShift | null;
    },
  });
  const previousShiftQuery = useQuery({
    queryKey: ['shift-yesterday', profile?.id, yesterday],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_entries')
        .select('code, start_time, end_time, overnight')
        .eq('user_id', profile!.id)
        .eq('date', yesterday)
        .maybeSingle();
      if (error) throw error;
      return data as TodayShift | null;
    },
  });

  const centerQuery = useQuery({
    queryKey: ['center', profile?.center_id],
    enabled: !!profile?.center_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centers')
        .select('name')
        .eq('id', profile!.center_id!)
        .maybeSingle();
      if (error) throw error;
      return data as { name: string } | null;
    },
  });

  // Query for last access log
  const [lastAccess, setLastAccess] = useState<{
    event: string;
    date: string;
    hour: string;
    method: string;
    source: string;
  } | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('access_logs')
      .select('event, scanned_at, method, source')
      .eq('user_id', profile.id)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const log = data[0];
          const date = new Date(log.scanned_at);
          setLastAccess({
            event: log.event === 'entrada' ? 'Entrada' : log.event === 'salida' ? 'Salida' : 'Acceso denegado',
            date: date.toLocaleDateString(intlLocale, { day: 'numeric', month: 'short', year: 'numeric' }),
            hour: date.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' }),
            method: t(ACCESS_METHOD_LABEL[String(log.method)] ?? 'Método desconocido'),
            source: t(ACCESS_SOURCE_LABEL[String(log.source)] ?? 'Punto de acceso desconocido'),
          });
        }
      });
  }, [intlLocale, profile, t]);

  const shift = shiftQuery.data;
  const shiftState = getCurrentShiftState(shift, previousShiftQuery.data, now);
  const todayShiftState = getCurrentShiftState(shift, null, now);
  const isShiftStateLoading = shiftQuery.isLoading || previousShiftQuery.isLoading;
  const progress =
    todayShiftState.active && shift?.start_time && shift.end_time
      ? shiftProgress(shift.start_time, shift.end_time, shift.overnight, now)
      : null;

  return (
    <Box>
      {/* Cabecera Waylet: degradado de marca, llama decorativa y reloj en vivo */}
      <Box
        sx={{
          background: brand.gradient,
          color: brand.white,
          borderRadius: '0 0 36px 36px',
          px: 2.5,
          pt: 5,
          pb: 8,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(255,90,0,0.25)',
        }}
      >
        <Box sx={{ position: 'absolute', top: -28, right: -18, opacity: 0.15, pointerEvents: 'none' }}>
          <RepsolFlame size={200} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {centerQuery.data?.name ?? 'Control de Acceso'}
            </Typography>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 800, lineHeight: 1.15, fontSize: '1.15rem' }}>
              {profile ? greeting(profile.full_name, t) : t('Inicio')}
            </Typography>
          </Box>
        </Box>

        {/* Estado + reloj en vivo */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 2, position: 'relative' }}>
          <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 50,
            color: brand.white,
            fontWeight: 600,
            px: 4,
            py: 1,
          }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: '50%' }}>
            {/* empty - just the circle color */}
          </Box>
          {isShiftStateLoading ? t('Cargando turno…') : t(shiftState.label)}
        </Box>
          <Box
            sx={{ ml: 'auto', display: 'flex', alignItems: 'baseline', gap: 1, bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 2, px: 1.25, py: 0.5 }}
          >
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {now.toLocaleDateString(intlLocale, { weekday: 'short', day: 'numeric', month: 'short' })}
            </Typography>
            <Typography
              variant="body1"
              component="p"
              sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}
            >
              {now.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tarjetas superpuestas sobre la cabecera */}
      <Box sx={{ px: 2, mt: -5, position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AccessTimeIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700 }}>
              {t('Tu turno de hoy')}
            </Typography>
          </Box>

          {!profile && <Skeleton variant="rounded" height={56} aria-label={t('Cargando perfil…')} />}

          {profile && shiftQuery.isLoading && (
            <Skeleton variant="rounded" height={56} aria-label={t('Cargando turno…')} />
          )}

          {profile && shiftQuery.isError && (
            <Alert
              severity="error"
              role="alert"
              action={
                <Button color="inherit" size="small" onClick={() => shiftQuery.refetch()}>
                  {t('Reintentar')}
                </Button>
              }
            >
              {t('No se pudo cargar tu turno.')}
            </Alert>
          )}

          {profile && shiftQuery.isSuccess && !shift && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
              <EventBusyIcon />
              <Box>
                <Typography variant="body2">{t('Hoy no tienes turno asignado.')}</Typography>
                <Button size="small" onClick={() => navigate('/calendario')} sx={{ px: 0 }}>
                  {t('Ver calendario')}
                </Button>
              </Box>
            </Box>
          )}

          {profile && shiftQuery.isSuccess && shift && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box>
                  <Typography variant="h6" component="p" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {t(SHIFT_LABEL[shift.code] ?? shift.code)}
                  </Typography>
                  {shift.start_time && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {shift.start_time.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                      {shift.overnight ? ' (noche)' : ''}
                    </Typography>
                  )}
                </Box>
                <Chip
                  size="small"
                  color={todayShiftState.active ? 'secondary' : 'default'}
                  label={shiftQuery.isLoading ? t('Cargando…') : t(todayShiftState.label)}
                />
              </Box>

              {progress !== null && (
                <Box sx={{ mt: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('Progreso de jornada')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {progress}%
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${progress}%`,
                        height: '100%',
                        background: brand.gradient,
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </Box>
                </Box>
              )}

            </Box>
          )}

        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AccessTimeIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700 }}>
              {t('Último acceso')}
            </Typography>
          </Box>

          {lastAccess ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: 'rgba(52,211,153,0.12)',
              }}
            >
              {lastAccess.event === 'Entrada' ? (
                <LoginIcon color="success" aria-hidden="true" />
              ) : lastAccess.event === 'Salida' ? (
                <LogoutIcon color="warning" aria-hidden="true" />
              ) : (
                <EventBusyIcon color="error" aria-hidden="true" />
              )}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t(lastAccess.event)}{t(' registrada')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {lastAccess.date} · {lastAccess.hour}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('Método:')} {lastAccess.method}
                  {lastAccess.source !== lastAccess.method && ` · ${t('Punto de acceso:')} ${lastAccess.source}`}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('No hay registros de acceso recientes.')}
            </Typography>
          )}

          <Button
            size="small"
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/historial-acceso')}
            sx={{ mt: 1.5, borderRadius: 2 }}
          >
            {t('Ver historial')}
          </Button>
        </Paper>

        <Button
          variant="contained"
          fullWidth
          startIcon={<QrCodeScannerIcon />}
          onClick={() => navigate('/acceso')}
          sx={{
            background: brand.gradient,
            py: 1.5,
            borderRadius: 3,
            fontWeight: 700,
            boxShadow: '0 8px 20px -4px rgba(255,90,0,0.4)',
          }}
        >
          {t('Mostrar mi QR de acceso')}
        </Button>
      </Box>
    </Box>
  );
}