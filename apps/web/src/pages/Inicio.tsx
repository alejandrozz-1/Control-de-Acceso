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
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/ui/PageLayout';
import { useAuthStore } from '../services/auth';
import { supabase } from '../services/supabase';

interface TodayShift {
  code: string;
  start_time: string | null;
  end_time: string | null;
  overnight: boolean;
}

const SHIFT_LABEL: Record<string, string> = { M: 'Mañana', T: 'Tarde', N: 'Noche', L: 'Libre' };

function greeting(name: string): string {
  const h = new Date().getHours();
  const hello = h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = name.split(' ')[0] ?? name;
  return `${hello}, ${firstName}`;
}

/** Inicio: saludo + turno de hoy (datos reales de shift_entries) + acceso rápido. */
export default function Inicio() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
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

  return (
    <PageLayout title={profile ? greeting(profile.full_name) : 'Inicio'} phase="">
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AccessTimeIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" component="h2">
            Tu turno de hoy
          </Typography>
        </Box>

        {!profile && <Skeleton variant="rounded" height={56} aria-label="Cargando perfil" />}

        {profile && shiftQuery.isLoading && (
          <Skeleton variant="rounded" height={56} aria-label="Cargando turno de hoy" />
        )}

        {profile && shiftQuery.isError && (
          <Alert
            severity="error"
            role="alert"
            action={
              <Button color="inherit" size="small" onClick={() => shiftQuery.refetch()}>
                Reintentar
              </Button>
            }
          >
            No se pudo cargar tu turno.
          </Alert>
        )}

        {profile && shiftQuery.isSuccess && !shiftQuery.data && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
            <EventBusyIcon />
            <Box>
              <Typography variant="body2">Hoy no tienes turno asignado.</Typography>
              <Button size="small" onClick={() => navigate('/calendario')} sx={{ px: 0 }}>
                Ver calendario
              </Button>
            </Box>
          </Box>
        )}

        {profile && shiftQuery.data && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box>
              <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
                {SHIFT_LABEL[shiftQuery.data.code] ?? shiftQuery.data.code}
              </Typography>
              {shiftQuery.data.start_time && (
                <Typography variant="body2" color="text.secondary">
                  {shiftQuery.data.start_time.slice(0, 5)} – {shiftQuery.data.end_time?.slice(0, 5)}
                  {shiftQuery.data.overnight ? ' (noche)' : ''}
                </Typography>
              )}
            </Box>
            <Chip
              size="small"
              color={shiftQuery.data.code === 'L' ? 'default' : 'secondary'}
              label={shiftQuery.data.code === 'L' ? 'Descanso' : 'En turno'}
            />
          </Box>
        )}
      </Paper>

      <Button
        variant="contained"
        color="secondary"
        fullWidth
        startIcon={<QrCodeScannerIcon />}
        onClick={() => navigate('/acceso')}
      >
        Mostrar mi QR de acceso
      </Button>
    </PageLayout>
  );
}
