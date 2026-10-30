import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { brand } from '../app/theme';
import { useAuthStore } from '../services/auth';
import type { Tables } from '../services/database.types';
import { supabase } from '../services/supabase';
import { getIntlLocale } from '../i18n/catalog';
import { useI18n } from '../i18n/I18nProvider';

type AccessLog = Pick<Tables<'access_logs'>, 'id' | 'event' | 'method' | 'source' | 'scanned_at'>;

const METHOD_LABELS: Record<AccessLog['method'], string> = {
  qr: 'Código QR',
  temporal: 'Código temporal',
  nfc: 'NFC',
  manual: 'Registro manual',
};

const SOURCE_LABELS: Record<AccessLog['source'], string> = {
  app: 'Aplicación',
  torno: 'Torno de acceso',
  manual: 'Registro manual',
};

function formatAccessDate(value: string, locale: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export default function HistorialAcceso() {
  const { locale, t } = useI18n();
  const intlLocale = getIntlLocale(locale);
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const historyQuery = useQuery({
    queryKey: ['access-history', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('access_logs')
        .select('id, event, method, source, scanned_at')
        .eq('user_id', profile.id)
        .order('scanned_at', { ascending: false });
      if (error) throw error;
      return data as AccessLog[];
    },
  });

  const goBack = () => navigate('/');

  const logs = historyQuery.data ?? [];

  return (
    <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={goBack}
        sx={{ mb: 2, ml: -1, borderRadius: 2 }}
      >
        {t('Volver')}
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: brand.blue }}>
          {t('Historial de accesos')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {t('Consulta tus entradas y salidas registradas')}
        </Typography>
      </Box>

      {!profile && <Alert severity="info">{t('Inicia sesión para consultar tu historial.')}</Alert>}

      {historyQuery.isLoading && profile && (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} variant="rounded" height={104} />
          ))}
        </Box>
      )}

      {historyQuery.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void historyQuery.refetch()}>
              {t('Reintentar')}
            </Button>
          }
        >
          {t('No se pudo cargar el historial de accesos.')}
        </Alert>
      )}

      {historyQuery.isSuccess && logs.length === 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <AccessTimeIcon sx={{ color: brand.orange, fontSize: 36, mb: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('Todavía no hay accesos registrados')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('Tus entradas y salidas aparecerán aquí.')}
          </Typography>
        </Paper>
      )}

      {historyQuery.isSuccess && logs.length > 0 && (
        <Box
          component="ol"
          aria-label={t('Registros de acceso')}
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'grid',
            gap: 1.5,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 15,
              top: 16,
              bottom: 16,
              width: 2,
              bgcolor: 'divider',
            },
          }}
        >
          {logs.map((log) => {
            const denied = log.event === 'denegado';
            const entry = log.event === 'entrada';
            const label = t(denied ? 'Acceso denegado' : entry ? 'Entrada' : 'Salida');
            const color = denied ? brand.red : entry ? '#1FA971' : brand.orange;
            const Icon = denied ? BlockIcon : entry ? LoginIcon : LogoutIcon;
            const formatted = formatAccessDate(log.scanned_at, intlLocale);

            return (
              <Box
                component="li"
                key={log.id}
                sx={{ display: 'flex', alignItems: 'stretch', gap: 1.5, position: 'relative' }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 32,
                    flex: '0 0 32px',
                    display: 'flex',
                    justifyContent: 'center',
                    pt: 1.5,
                    zIndex: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: color,
                      color: brand.white,
                      boxShadow: (theme) => `0 0 0 4px ${theme.palette.background.default}`,
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </Box>
                </Box>

                <Card
                  variant="outlined"
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    borderLeft: `4px solid ${color}`,
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatted.date} · {formatted.time}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {t('Método:')} {t(METHOD_LABELS[log.method])} · {t('Punto de acceso:')} {t(SOURCE_LABELS[log.source])}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
}
