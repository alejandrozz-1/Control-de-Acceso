import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import PageLayout from '../../components/ui/PageLayout';
import { supabase } from '../../services/supabase';
import type { Database } from '../../services/database.types';
import { useI18n } from '../../i18n/I18nProvider';

type Profile = Database['public']['Tables']['profiles']['Row'];

const ROLE_LABEL: Record<string, string> = {
  empleado: 'Empleado',
  responsable: 'Responsable',
  admin: 'Admin',
};

export default function AdminUsuarios() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('empleado');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, full_name: fullName, role },
      });
      if (error) throw error;
      if (data?.error) {
        const messages: Record<string, string> = {
          ese_email_ya_existe: t('Ese email ya tiene cuenta'),
          limite_invitaciones_alcanzado: t('Límite de invitaciones alcanzado (plan free: 2/hora). Inténtalo más tarde o configura SMTP.'),
          sin_permiso: t('Solo un administrador puede invitar usuarios'),
        };
        throw new Error(messages[data.error] ?? t('No se pudo enviar la invitación'));
      }
      setOk(`${t('Invitación enviada a')} ${email}`);
      setOpen(false);
      setEmail('');
      setFullName('');
      setRole('empleado');
      void refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Error inesperado'));
    }
  }

  return (
    <PageLayout title="Usuarios" phase="Fase 1 · admin">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {isLoading ? t('Cargando…') : `${profiles?.length ?? 0} ${t('usuarios')}`}
        </Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          {t('Invitar usuario')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('Nombre')}</TableCell>
              <TableCell>{t('Email')}</TableCell>
              <TableCell>{t('Rol')}</TableCell>
              <TableCell>{t('Estado')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.full_name}</TableCell>
                <TableCell sx={{ wordBreak: 'break-all' }}>{p.email}</TableCell>
                <TableCell>
                  <Chip size="small" label={t(ROLE_LABEL[p.role] ?? p.role)} color={p.role === 'admin' ? 'primary' : 'default'} />
                </TableCell>
                <TableCell>{p.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('Invitar usuario')}</DialogTitle>
        <DialogContent>
          <Box component="form" id="invite-form" onSubmit={onInvite} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label={t('Nombre completo')} value={fullName} onChange={(e) => setFullName(e.target.value)} required fullWidth />
            <TextField label={t('Email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label={t('Rol')} select value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
              <MenuItem value="empleado">{t('Empleado')}</MenuItem>
              <MenuItem value="responsable">{t('Responsable')}</MenuItem>
              <MenuItem value="admin">{t('Administrador')}</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('Cancelar')}</Button>
          <Button type="submit" form="invite-form" variant="contained">{t('Enviar invitación')}</Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
