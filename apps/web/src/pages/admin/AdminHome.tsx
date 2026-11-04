import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';

const sections = [
  {
    title: 'Gestionar usuarios',
    description: 'Alta, activación, perfiles y estado de las cuentas.',
    to: '/admin/usuarios',
    Icon: ManageAccountsIcon,
  },
  {
    title: 'Credenciales de acceso',
    description: 'Consulta y revoca credenciales QR, temporales y NFC.',
    to: '/admin/credenciales',
    Icon: QrCode2Icon,
  },
  {
    title: 'Festivos y eventos',
    description: 'Administra festivos y eventos corporativos.',
    to: '/admin/festivos',
    Icon: EventAvailableIcon,
  },
];

export default function AdminHome() {
  return (
    <PageLayout title="Administración" backTo="/cuenta">
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Herramientas de administración del control de accesos.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        {sections.map(({ title, description, to, Icon }) => (
          <Card key={to} variant="outlined" sx={{ borderRadius: 1, boxShadow: 'none' }}>
            <CardActionArea component={RouterLink} to={to} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5, minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Icon color="primary" sx={{ fontSize: 30, mb: 2 }} />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>{title}</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.75 }}>{description}</Typography>
                <ArrowForwardIcon sx={{ color: 'text.secondary', alignSelf: 'flex-end', mt: 'auto', pt: 1 }} />
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </PageLayout>
  );
}
