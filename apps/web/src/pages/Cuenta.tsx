import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PageLayout from '../components/ui/PageLayout';
import { hasRole, useAuthStore } from '../services/auth';

const ROLE_LABEL: Record<string, string> = {
  empleado: 'Empleado',
  responsable: 'Responsable',
  admin: 'Administrador',
};

export default function Cuenta() {
  const { profile, signOut } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  async function onLogout() {
    try {
      await signOut();
    } catch {
      setError('No se pudo cerrar sesión. Inténtalo de nuevo.');
    }
  }

  return (
    <PageLayout title="Cuenta" phase="Fase 1">
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <List disablePadding>
          <ListItem>
            <ListItemText
              primary={profile?.full_name || '—'}
              secondary={profile?.email ?? undefined}
            />
            {profile && (
              <Chip size="small" label={ROLE_LABEL[profile.role] ?? profile.role} color="primary" variant="outlined" />
            )}
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary={profile?.employee_code || 'Sin código de empleado'}
              secondary={profile?.center_id ? 'Centro asignado' : 'Sin centro asignado'}
            />
          </ListItem>
        </List>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {hasRole(profile, 'responsable') && (
          <>
            <Button component={RouterLink} to="/admin/usuarios" variant="outlined">
              Gestionar usuarios
            </Button>
            <Button component={RouterLink} to="/admin/credenciales" variant="outlined">
              Credenciales de acceso
            </Button>
            <Button component={RouterLink} to="/admin/festivos" variant="outlined">
              Festivos y eventos
            </Button>
          </>
        )}
        <Button variant="contained" color="error" onClick={onLogout}>
          Cerrar sesión
        </Button>
      </Box>
    </PageLayout>
  );
}
