import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LanguageIcon from '@mui/icons-material/Language';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AccountSubpage from './AccountSubpage';
import { useAuthStore } from '../../services/auth';

export default function Idioma() {
  const { profile } = useAuthStore();

  return (
    <AccountSubpage title="Idioma" description="Idioma de la aplicación">
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LanguageIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Idioma actual
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: 2,
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
            bgcolor: 'action.selected',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Español</Typography>
            <Typography variant="body2" color="text.secondary">Español (España)</Typography>
          </Box>
          <CheckCircleIcon color="primary" aria-label="Idioma seleccionado" />
        </Box>
        {profile && profile.locale !== 'es' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            La aplicación está disponible actualmente solo en español.
          </Alert>
        )}
      </Paper>
    </AccountSubpage>
  );
}
