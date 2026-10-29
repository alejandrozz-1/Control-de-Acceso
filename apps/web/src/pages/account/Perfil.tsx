import BadgeIcon from '@mui/icons-material/Badge';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import AccountSubpage from './AccountSubpage';
import { useAuthStore } from '../../services/auth';
import { supabase } from '../../services/supabase';

export default function Perfil() {
  const { profile } = useAuthStore();
  const centerQuery = useQuery({
    queryKey: ['account-profile-center', profile?.center_id],
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

  const details = [
    { label: 'Nombre completo', value: profile?.full_name ?? 'No disponible', Icon: PersonOutlinedIcon },
    { label: 'ID de empleado', value: profile?.employee_code ?? 'No asignado', Icon: BadgeIcon },
    { label: 'Correo electrónico', value: profile?.email ?? 'No disponible', Icon: EmailOutlinedIcon },
    { label: 'Teléfono', value: profile?.phone ?? 'No registrado', Icon: PhoneOutlinedIcon },
    {
      label: 'Centro asignado',
      value: !profile
        ? 'Cargando…'
        : centerQuery.isLoading
          ? 'Cargando…'
          : centerQuery.data?.name ?? 'Sin centro asignado',
      Icon: LocationOnOutlinedIcon,
    },
  ];

  return (
    <AccountSubpage title="Mi perfil" description="Datos de tu cuenta corporativa">
      {centerQuery.isError && (
        <Alert
          severity="error"
          role="alert"
          action={
            <Button color="inherit" size="small" onClick={() => void centerQuery.refetch()}>
              Reintentar
            </Button>
          }
        >
          No se pudo cargar el centro asignado.
        </Alert>
      )}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            <AccountCircleIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Información personal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Los datos los gestiona el administrador de tu organización.
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
                primary={label}
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
    </AccountSubpage>
  );
}
