import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AccountSubpage from './AccountSubpage';
import { useAuthStore } from '../../services/auth';
import { useI18n } from '../../i18n/I18nProvider';

export default function Perfil() {
  const { profile } = useAuthStore();
  const { t } = useI18n();
  const preferredLanguage = profile?.locale === 'es'
    ? t('Español')
    : profile?.locale === 'en'
      ? t('Inglés')
      : profile?.locale === 'ar'
        ? t('Árabe')
        : t('No especificado');
  const details = [
    { label: 'Correo electrónico', value: profile?.email ?? t('No disponible'), Icon: EmailOutlinedIcon },
    { label: 'Teléfono', value: profile?.phone ?? t('No registrado'), Icon: PhoneOutlinedIcon },
    { label: 'Idioma preferido', value: preferredLanguage, Icon: LanguageIcon },
  ];

  return (
    <AccountSubpage title={t('Mi perfil')} description={t('Tus datos de contacto y preferencias')}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            <AccountCircleIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {t('Información personal')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Contacto y preferencias de tu cuenta.')}
            </Typography>
          </Box>
        </Box>
        <List disablePadding>
          {details.map(({ label, value, Icon }, index) => (
            <ListItem
              key={label}
              disableGutters
              divider={index < details.length - 1}
              sx={{ py: 1.25, alignItems: 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'primary.main', mt: 0.25 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t(label)}
                secondary={t(value)}
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
    </AccountSubpage>
  );
}
