import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import BadgeIcon from '@mui/icons-material/Badge';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useColorScheme } from '@mui/material/styles';
import appPackage from '../../../../package.json';
import { brand } from '../app/theme';
import PageLayout from '../components/ui/PageLayout';
import { useAuthStore } from '../services/auth';
import { supabase } from '../services/supabase';
import { useI18n } from '../i18n/I18nProvider';

const ROLE_LABEL: Record<string, string> = {
  empleado: 'Empleado',
  responsable: 'Responsable',
  admin: 'Administrador',
};

const settings = [
  { label: 'Mi perfil', to: '/cuenta/perfil', Icon: PersonOutlinedIcon },
  { label: 'Idioma', to: '/cuenta/idioma', Icon: LanguageIcon },
  { label: 'Seguridad', to: '/cuenta/seguridad', Icon: SecurityIcon },
  { label: 'Ayuda', to: '/cuenta/ayuda', Icon: HelpOutlinedIcon },
];

function initials(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  return `${first?.[0] ?? ''}${second?.[0] ?? ''}`.toUpperCase() || '—';
}

export default function Cuenta() {
  const { profile, signOut } = useAuthStore();
  const { locale, t } = useI18n();
  const { mode, setMode } = useColorScheme();
  const [error, setError] = useState<string | null>(null);

  const centerQuery = useQuery({
    queryKey: ['account-center', profile?.center_id],
    enabled: !!profile?.center_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centers')
        .select('name')
        .eq('id', profile!.center_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function onLogout() {
    setError(null);
    try {
      await signOut();
    } catch {
      setError(t('No se pudo cerrar sesión. Inténtalo de nuevo.'));
    }
  }

  const centerName = !profile
    ? t('Cargando…')
    : centerQuery.isError
      ? t('No se pudo cargar')
      : centerQuery.data?.name ?? t('Sin centro asignado');
  const roleName = profile ? t(ROLE_LABEL[profile.role] ?? profile.role) : t('Cargando…');

  return (
    <PageLayout title="Cuenta">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 1 }}>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 4,
            color: brand.white,
            background: brand.gradient,
            boxShadow: '0 12px 28px rgba(4,30,66,0.16)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
            <Avatar
              aria-label={`${t('Avatar de')} ${profile?.full_name ?? t('usuario')}`}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: brand.white,
                border: '2px solid rgba(255,255,255,0.72)',
                fontSize: '1.2rem',
                fontWeight: 800,
              }}
            >
              {profile ? initials(profile.full_name) : <Skeleton width={28} />}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {profile?.full_name ?? t('Cargando perfil…')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.92 }}>
                {roleName} · {profile?.employee_code ?? t('Sin ID de empleado')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <LocationOnIcon fontSize="small" />
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                  {centerQuery.isLoading ? t('Cargando centro…') : centerName}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {centerQuery.isError && (
          <Alert
            severity="error"
            role="alert"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void centerQuery.refetch()}
              >
                {t('Reintentar')}
              </Button>
            }
          >
            {t('No se ha podido cargar toda la información de tu cuenta.')}
          </Alert>
        )}

        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 4, boxShadow: '0 4px 18px rgba(4,30,66,0.06)' }}
        >
          <Typography variant="subtitle1" component="h2" sx={{ mb: 1.5, fontWeight: 800 }}>
            {t('Información')}
          </Typography>
          <List disablePadding>
            {[
              { label: 'ID empleado', value: profile?.employee_code ?? t('No asignado'), Icon: BadgeIcon },
              { label: 'Rol', value: roleName, Icon: AdminPanelSettingsIcon },
              { label: 'Centro asignado', value: centerName, Icon: LocationOnIcon },
              { label: 'Versión de la aplicación', value: `v${appPackage.version}`, Icon: AccessTimeIcon },
            ].map(({ label, value, Icon }, index, rows) => (
              <ListItem
                key={label}
                disableGutters
                divider={index < rows.length - 1}
                sx={{ py: 1.25, alignItems: 'flex-start' }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'text.secondary', mt: 0.25 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={t(label)}
                  secondary={value}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: {
                      variant: 'body2',
                      color: 'text.primary',
                      sx: { fontWeight: 600, overflowWrap: 'anywhere' },
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 18px rgba(4,30,66,0.06)' }}
        >
          <Typography variant="subtitle1" component="h2" sx={{ px: 2.5, pt: 2, fontWeight: 800 }}>
            {t('Configuración')}
          </Typography>
          <List disablePadding sx={{ py: 1 }}>
            {settings.map(({ label, to, Icon }, index) => (
              <ListItem key={to} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={to}
                  sx={{
                    minHeight: 56,
                    px: 2.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    ...(index < settings.length - 1 && {
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 42, color: 'primary.main' }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText primary={t(label)} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                  <ArrowForwardIosIcon sx={{ fontSize: 14, color: 'text.secondary', transform: locale === 'ar' ? 'scaleX(-1)' : undefined }} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem
              disablePadding
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', minHeight: 56, px: 2.5 }}>
                <ListItemIcon sx={{ minWidth: 42, color: 'primary.main' }}>
                  <DarkModeIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('Modo oscuro')}
                  secondary={t('Azul marino y acentos Repsol')}
                  slotProps={{ primary: { sx: { fontWeight: 600 } }, secondary: { variant: 'caption' } }}
                />
                <Switch
                  checked={mode === 'dark'}
                  onChange={(_, checked) => setMode(checked ? 'dark' : 'light')}
                  slotProps={{ input: { 'aria-label': t('Modo oscuro') } }}
                />
              </Box>
            </ListItem>
          </List>
        </Paper>

        {profile?.role === 'admin' && (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
            <Typography variant="subtitle1" component="h2" sx={{ mb: 1, fontWeight: 800 }}>
              {t('Administración')}
            </Typography>
            <Button component={RouterLink} to="/admin/usuarios" variant="outlined" fullWidth>
              {t('Gestionar usuarios')}
            </Button>
            <Button component={RouterLink} to="/admin/credenciales" variant="outlined" fullWidth sx={{ mt: 1 }}>
              {t('Credenciales de acceso')}
            </Button>
            <Button component={RouterLink} to="/admin/festivos" variant="outlined" fullWidth sx={{ mt: 1 }}>
              {t('Festivos y eventos')}
            </Button>
          </Paper>
        )}

        {error && <Alert severity="error" role="alert">{error}</Alert>}
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{ minHeight: 52, borderRadius: 3, fontWeight: 700 }}
        >
          {t('Cerrar sesión')}
        </Button>
      </Box>
    </PageLayout>
  );
}
