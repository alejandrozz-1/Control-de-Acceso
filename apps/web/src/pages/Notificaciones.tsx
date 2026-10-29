import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { brand } from '../app/theme';
import PageLayout from '../components/ui/PageLayout';
import { useMarkAllRead, useMarkRead, useNotifications, type AppNotification } from '../services/notifications';

const TYPE_ICON: Record<AppNotification['type'], React.ReactNode> = {
  turno: <EventAvailableIcon />,
  acceso: <QrCodeScannerIcon />,
  vacacion: <DoNotDisturbOnIcon />,
  corporativa: <CalendarMonthIcon />,
  sistema: <InfoIcon />,
};

const TYPE_COLOR: Record<AppNotification['type'], string> = {
  turno: brand.orange,
  acceso: brand.blue,
  vacacion: '#0EA5E9',
  corporativa: brand.red,
  sistema: '#64748B',
};

function groupLabel(iso: string, today: string): string {
  if (iso.slice(0, 10) === today) return 'Hoy';
  const d = new Date(iso);
  const yest = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (iso.slice(0, 10) === yest) return 'Ayer';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Centro de notificaciones: lista, no leídas destacadas y mark-all. */
export default function Notificaciones() {
  const list = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const today = new Date().toISOString().slice(0, 10);
  const unread = (list.data ?? []).filter((n) => !n.read_at).length;

  let lastLabel: string | null = null;

  return (
    <PageLayout title="Notificaciones">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        {list.isSuccess && unread > 0 && (
          <Typography variant="caption" color="text.secondary" aria-live="polite">
            {unread} sin leer
          </Typography>
        )}
        {unread > 0 && (
          <Button
            size="small"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            sx={{ ml: 'auto' }}
          >
            Marcar todas
          </Button>
        )}
      </Box>

      {list.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={64} aria-label={`Cargando notificación ${i + 1}`} />
          ))}
        </Box>
      )}

      {list.isError && (
        <Alert
          severity="error"
          role="alert"
          action={
            <Button color="inherit" size="small" onClick={() => list.refetch()}>
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar las notificaciones.
        </Alert>
      )}

      {list.isSuccess && list.data.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <NotificationsActiveIcon sx={{ fontSize: 48, opacity: 0.4 }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            No tienes notificaciones. Te avisaremos de cambios de turno, vacaciones y eventos.
          </Typography>
        </Box>
      )}

      {list.isSuccess && list.data.length > 0 && (
        <List disablePadding>
          {list.data.map((n) => {
            const label = groupLabel(n.created_at, today);
            const showLabel = label !== lastLabel;
            lastLabel = label;
            const isNew = !n.read_at;
            return (
              <Box key={n.id}>
                {showLabel && (
                  <Typography
                    variant="overline"
                    sx={{ display: 'block', mt: 1.5, mb: 0.5, px: 1, color: 'text.secondary', fontWeight: 700 }}
                  >
                    {label}
                  </Typography>
                )}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      alignItems: 'flex-start',
                      bgcolor: isNew ? 'action.hover' : 'transparent',
                      borderLeft: isNew ? `3px solid ${brand.orange}` : '3px solid transparent',
                    }}
                    onClick={() => isNew && markRead.mutate(n.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5, color: TYPE_COLOR[n.type] }}>
                      {TYPE_ICON[n.type]}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: isNew ? 700 : 500 }}>
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          {n.body}
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}
                          >
                            {new Date(n.created_at).toLocaleString('es-ES', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </Typography>
                        </>
                      }
                    />
                    {isNew && (
                      <IconButton
                        size="small"
                        aria-label={`Marcar «${n.title}» como leída`}
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead.mutate(n.id);
                        }}
                        sx={{ mt: 0.5, ml: 1 }}
                      >
                        <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: brand.orange }} />
                      </IconButton>
                    )}
                  </ListItemButton>
                </ListItem>
              </Box>
            );
          })}
        </List>
      )}
    </PageLayout>
  );
}
