import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useUnreadCount } from '../../services/notifications';
import { useAuthStore } from '../../services/auth';
import { brand } from '../../app/theme';
import { useI18n } from '../../i18n/I18nProvider';
import RepsolFlame from './RepsolFlame';

function initials(name: string | undefined): string {
  const [first, second] = (name ?? '').trim().split(/\s+/);
  return `${first?.[0] ?? ''}${second?.[0] ?? ''}`.toUpperCase() || 'U';
}

export default function AppHeader() {
  const { pathname } = useLocation();
  const profile = useAuthStore((state) => state.profile);
  const { t } = useI18n();
  const unread = useUnreadCount();
  const isHome = pathname === '/';

  return (
    <Box
      component="header"
      sx={{
        position: isHome ? 'absolute' : 'relative',
        top: isHome ? 20 : 0,
        zIndex: (theme) => theme.zIndex.appBar,
        height: isHome ? 48 : 88,
        width: '100%',
        color: brand.white,
        background: isHome ? 'transparent' : brand.gradient,
        borderRadius: isHome ? 0 : '0 0 32px 32px',
        boxShadow: isHome ? 'none' : '0 10px 25px -5px rgba(255,90,0,0.25)',
        overflow: isHome ? 'visible' : 'hidden',
      }}
    >
      {!isHome && (
        <Box
          sx={{
            position: 'absolute',
            top: -34,
            left: 14,
            opacity: 0.22,
            pointerEvents: 'none',
          }}
        >
          <RepsolFlame size={132} />
        </Box>
      )}
      <Box
        sx={{
          maxWidth: 600,
          height: 48,
          position: isHome ? 'relative' : 'absolute',
          top: isHome ? 0 : 20,
          right: 0,
          left: 0,
          mx: 'auto',
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
          zIndex: 1,
        }}
      >
        <Tooltip title={t('Notificaciones')}>
          <IconButton
            component={RouterLink}
            to="/notificaciones"
            aria-label={t('Abrir notificaciones')}
            aria-current={pathname === '/notificaciones' ? 'page' : undefined}
            sx={{
              width: 44,
              height: 44,
              color: brand.white,
              bgcolor: pathname === '/notificaciones' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.28)',
              },
            }}
          >
            <Badge badgeContent={unread.data ?? 0} color="error" max={9}>
              <NotificationsOutlinedIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Cuenta')}>
          <IconButton
            component={RouterLink}
            to="/cuenta"
            aria-label={t('Abrir cuenta')}
            aria-current={pathname.startsWith('/cuenta') ? 'page' : undefined}
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.28)',
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.8rem',
                fontWeight: 700,
                bgcolor: pathname.startsWith('/cuenta') ? brand.white : 'rgba(255,255,255,0.24)',
                color: pathname.startsWith('/cuenta') ? brand.blue : brand.white,
              }}
            >
              {initials(profile?.full_name)}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
