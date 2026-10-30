import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BeachAccessOutlinedIcon from '@mui/icons-material/BeachAccessOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { brand } from '../app/theme';
import PageLayout from '../components/ui/PageLayout';
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  type AppNotification,
} from '../services/notifications';
import {
  formatNotificationDate,
  formatNotificationDetailDate,
  getNotificationCategory,
  getNotificationNavigation,
  getNotificationTypeLabel,
  groupNotifications,
} from './notificationPresentation';

const TYPE_ICON: Record<AppNotification['type'], typeof InfoOutlinedIcon> = {
  turno: EventAvailableOutlinedIcon,
  acceso: QrCode2OutlinedIcon,
  vacacion: BeachAccessOutlinedIcon,
  corporativa: CalendarMonthOutlinedIcon,
  sistema: InfoOutlinedIcon,
};

const TYPE_COLOR: Record<AppNotification['type'], string> = {
  turno: brand.orange,
  acceso: '#4C8DFF',
  vacacion: '#27B3A7',
  corporativa: brand.red,
  sistema: '#94A3B8',
};

const CATEGORY_COLOR = {
  Urgente: { color: '#FF7186', background: 'rgba(255, 77, 106, 0.12)' },
  Aprobación: { color: '#42C7A5', background: 'rgba(39, 179, 167, 0.12)' },
  Recordatorio: { color: brand.orange, background: 'rgba(255, 130, 0, 0.12)' },
  Informativa: { color: '#7FAEFF', background: 'rgba(76, 141, 255, 0.12)' },
} as const;

function NotificationCard({
  notification,
  index,
  onOpen,
  onMarkRead,
  onDelete,
  onNavigate,
  markingRead,
  deleting,
}: {
  notification: AppNotification;
  index: number;
  onOpen: (notification: AppNotification) => void;
  onMarkRead: (notification: AppNotification) => void;
  onDelete: (notification: AppNotification) => void;
  onNavigate: (notification: AppNotification) => void;
  markingRead: boolean;
  deleting: boolean;
}) {
  const isUnread = !notification.read_at;
  const category = getNotificationCategory(notification);
  const Icon = TYPE_ICON[notification.type];

  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        overflow: 'visible',
        borderColor: isUnread ? 'rgba(76, 141, 255, 0.36)' : 'divider',
        bgcolor: isUnread ? 'rgba(76, 141, 255, 0.055)' : 'background.paper',
        borderRadius: 3,
        boxShadow: isUnread ? '0 8px 24px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.07)',
        animation: 'notificationEnter 360ms ease both',
        animationDelay: `${Math.min(index, 6) * 45}ms`,
        '@keyframes notificationEnter': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(0,0,0,0.14)' },
        '&:active': { transform: 'scale(0.99)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ position: 'relative', flexShrink: 0, pt: 0.25 }}>
          {isUnread && (
            <Box
              aria-label="No leída"
              title="No leída"
              sx={{
                position: 'absolute',
                zIndex: 1,
                top: -2,
                left: -3,
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#4C8DFF',
                boxShadow: '0 0 0 3px',
                color: 'background.paper',
              }}
            />
          )}
          <Avatar
            variant="rounded"
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: `${TYPE_COLOR[notification.type]}1F`,
              color: TYPE_COLOR[notification.type],
            }}
          >
            <Icon />
          </Avatar>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            sx={{ mb: 0.75, flexWrap: 'wrap' }}
          >
            <Chip
              size="small"
              label={category}
              sx={{
                height: 23,
                fontWeight: 700,
                color: CATEGORY_COLOR[category].color,
                bgcolor: CATEGORY_COLOR[category].background,
              }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={isUnread ? 'Sin leer' : 'Leída'}
              sx={{
                height: 23,
                borderColor: isUnread ? 'rgba(76, 141, 255, 0.5)' : 'divider',
                color: isUnread ? '#7FAEFF' : 'text.secondary',
              }}
            />
          </Stack>

          <Typography
            variant="subtitle1"
            component="h3"
            sx={{
              fontWeight: isUnread ? 750 : 600,
              lineHeight: 1.35,
              overflowWrap: 'anywhere',
            }}
          >
            {notification.title}
          </Typography>
          {notification.body && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                overflow: 'hidden',
                overflowWrap: 'anywhere',
              }}
            >
              {notification.body}
            </Typography>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 0.5, sm: 1.5 }}
            sx={{ mt: 1.25, alignItems: { xs: 'flex-start', sm: 'center' } }}
          >
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatNotificationDate(notification.created_at)}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {getNotificationTypeLabel(notification.type)}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            sx={{ mt: 1, ml: -0.75, flexWrap: 'wrap' }}
          >
            <Button
              size="small"
              onClick={() => onOpen(notification)}
              sx={{ minHeight: 40, px: 1, textTransform: 'none', fontWeight: 700 }}
            >
              Ver detalle
            </Button>
            {getNotificationNavigation(notification) && (
              <Button
                size="small"
                onClick={() => onNavigate(notification)}
                sx={{ minHeight: 40, px: 1, textTransform: 'none' }}
              >
                {getNotificationNavigation(notification)?.label}
              </Button>
            )}
            {isUnread && (
              <Button
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => onMarkRead(notification)}
                disabled={markingRead}
                sx={{ minHeight: 40, px: 1, textTransform: 'none' }}
              >
                Marcar leída
              </Button>
            )}
            <Tooltip title="Eliminar notificación">
              <span>
                <IconButton
                  aria-label={`Eliminar «${notification.title}»`}
                  onClick={() => onDelete(notification)}
                  disabled={deleting}
                  sx={{ minWidth: 40, minHeight: 40, color: 'text.secondary' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
    </Card>
  );
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const list = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const deleteNotification = useDeleteNotification();
  const [detail, setDetail] = useState<AppNotification | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AppNotification | null>(null);
  const notifications = list.data?.pages.flatMap((page) => page.items) ?? [];
  const unread = notifications.filter((notification) => !notification.read_at).length;
  const groups = groupNotifications(notifications);
  const mutationError = markRead.error ?? markAll.error ?? deleteNotification.error;

  const openDetail = (notification: AppNotification) => {
    setDetail(notification);
    if (!notification.read_at) markRead.mutate(notification.id);
  };

  const goToRelatedSection = (notification: AppNotification) => {
    const target = getNotificationNavigation(notification);
    if (!target) return;
    if (!notification.read_at) markRead.mutate(notification.id);
    navigate(target.path, target.state ? { state: target.state } : undefined);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteNotification.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  };

  return (
    <PageLayout title="Notificaciones">
      <Stack spacing={2} sx={{ pb: 1 }}>
        <Card
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3.5,
            background: 'linear-gradient(135deg, rgba(4,30,66,0.96), rgba(16,36,58,0.98))',
            borderColor: 'rgba(255,130,0,0.28)',
            boxShadow: '0 12px 30px rgba(4,30,66,0.18)',
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Box>
              <Typography variant="body2" color="rgba(255,255,255,0.72)">
                Tu actividad, siempre al día
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.25, color: brand.white, fontWeight: 800 }}>
                {list.isSuccess
                  ? unread > 0
                    ? `${unread} ${unread === 1 ? 'aviso pendiente' : 'avisos pendientes'}`
                    : 'Todo al día'
                  : 'Centro de avisos'}
              </Typography>
            </Box>
            <Avatar
              variant="rounded"
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'rgba(255,130,0,0.18)',
                color: brand.orange,
                borderRadius: 3,
              }}
            >
              <NotificationsActiveOutlinedIcon />
            </Avatar>
          </Stack>
          {unread > 0 && (
            <Button
              size="small"
              startIcon={<TaskAltIcon />}
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              sx={{
                mt: 1.5,
                minHeight: 44,
                color: brand.white,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              {markAll.isPending ? 'Actualizando…' : 'Marcar todas como leídas'}
            </Button>
          )}
        </Card>

        {mutationError && (
          <Alert severity="error" role="alert">
            No se pudo actualizar la notificación. Inténtalo de nuevo.
          </Alert>
        )}

        {list.isLoading && (
          <Stack spacing={1.25} aria-label="Cargando notificaciones">
            {[0, 1, 2].map((item) => (
              <Card key={item} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <Skeleton variant="rounded" width={44} height={44} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="35%" height={22} />
                    <Skeleton width="72%" height={26} />
                    <Skeleton width="92%" height={20} />
                    <Skeleton width="45%" height={36} sx={{ mt: 1 }} />
                  </Box>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        {list.isError && notifications.length === 0 && (
          <Alert
            severity="error"
            role="alert"
            action={
              <Button color="inherit" size="small" onClick={() => void list.refetch()}>
                Reintentar
              </Button>
            }
          >
            No se pudieron cargar las notificaciones.
          </Alert>
        )}

        {list.isSuccess && notifications.length === 0 && (
          <Card
            variant="outlined"
            sx={{
              py: { xs: 4, sm: 6 },
              px: 2.5,
              textAlign: 'center',
              borderRadius: 4,
              borderStyle: 'dashed',
              bgcolor: 'background.paper',
            }}
          >
            <Avatar
              variant="rounded"
              sx={{
                mx: 'auto',
                mb: 2,
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: 'rgba(255,130,0,0.12)',
                color: brand.orange,
              }}
            >
              <NotificationsActiveOutlinedIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Bandeja despejada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: 'auto', mt: 0.75 }}>
              Cuando haya novedades sobre turnos, accesos o vacaciones, aparecerán aquí.
            </Typography>
          </Card>
        )}

        {notifications.length > 0 &&
          groups.map((group) => (
            <Box key={group.label}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="overline"
                  component="h2"
                  sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: 1 }}
                >
                  {group.label}
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                <Typography variant="caption" color="text.secondary">
                  {group.items.length}
                </Typography>
              </Stack>
              <Stack spacing={1.25} sx={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
                {group.items.map((notification, index) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onOpen={openDetail}
                    onMarkRead={(item) => markRead.mutate(item.id)}
                    onDelete={setPendingDelete}
                    onNavigate={goToRelatedSection}
                    markingRead={markRead.isPending}
                    deleting={deleteNotification.isPending}
                  />
                ))}
              </Stack>
            </Box>
          ))}

        {list.isFetchNextPageError && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void list.fetchNextPage()}
              >
                Reintentar
              </Button>
            }
          >
            No se pudieron cargar más notificaciones.
          </Alert>
        )}

        {list.hasNextPage && (
          <Button
            variant="outlined"
            onClick={() => void list.fetchNextPage()}
            disabled={list.isFetchingNextPage}
            sx={{ minHeight: 48, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
          >
            {list.isFetchingNextPage ? 'Cargando…' : 'Cargar más notificaciones'}
          </Button>
        )}
      </Stack>

      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="notification-detail-title"
      >
        {detail && (
          <>
            <DialogTitle id="notification-detail-title" sx={{ fontWeight: 800, pr: 7 }}>
              {detail.title}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={1.5}>
                <Chip
                  size="small"
                  label={`${getNotificationCategory(detail)} · ${getNotificationTypeLabel(detail.type)}`}
                  sx={{
                    alignSelf: 'flex-start',
                    color: CATEGORY_COLOR[getNotificationCategory(detail)].color,
                    bgcolor: CATEGORY_COLOR[getNotificationCategory(detail)].background,
                  }}
                />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {detail.body || 'Esta notificación no incluye más detalles.'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatNotificationDetailDate(detail.created_at)}
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetail(null)} sx={{ minHeight: 44 }}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={!!pendingDelete}
        onClose={() => !deleteNotification.isPending && setPendingDelete(null)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="delete-notification-title"
      >
        <DialogTitle id="delete-notification-title" sx={{ fontWeight: 800 }}>
          ¿Eliminar notificación?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminará «{pendingDelete?.title}». Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setPendingDelete(null)}
            disabled={deleteNotification.isPending}
            sx={{ minHeight: 44 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteNotification.isPending}
            sx={{ minHeight: 44 }}
          >
            {deleteNotification.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
