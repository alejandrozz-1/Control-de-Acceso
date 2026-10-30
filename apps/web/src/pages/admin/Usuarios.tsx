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

type Profile = Database['public']['Tables']['profiles']['Row'];

const ROLE_LABEL: Record<string, string> = {
  empleado: 'Empleado',
  responsable: 'Responsable',
  admin: 'Admin',
};

export default function AdminUsuarios() {
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
          ese_email_ya_existe: 'Ese email ya tiene cuenta',
          limite_invitaciones_alcanzado: 'Límite de invitaciones alcanzado (plan free: 2/hora). Inténtalo más tarde o configura SMTP.',
          sin_permiso: 'Solo un administrador puede invitar usuarios',
        };
        throw new Error(messages[data.error] ?? 'No se pudo enviar la invitación');
      }
      setOk(`Invitación enviada a ${email}`);
      setOpen(false);
      setEmail('');
      setFullName('');
      setRole('empleado');
      void refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    }
  }

  return (
    <PageLayout title="Usuarios">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {isLoading ? 'Cargando…' : `${profiles?.length ?? 0} usuarios`}
        </Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Invitar usuario
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}

      <Paper variant="outlined">
        <Table size="small" sx={{ '& th, & td': { px: 1, py: 1.25 } }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.full_name}</TableCell>
                <TableCell sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{p.email}</TableCell>
                <TableCell>
                  <Chip size="small" label={ROLE_LABEL[p.role] ?? p.role} color={p.role === 'admin' ? 'primary' : 'default'} />
                </TableCell>
                <TableCell>{p.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Invitar usuario</DialogTitle>
        <DialogContent>
          <Box component="form" id="invite-form" onSubmit={onInvite} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label="Rol" select value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
              <MenuItem value="empleado">Empleado</MenuItem>
              <MenuItem value="responsable">Responsable</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" form="invite-form" variant="contained">Enviar invitación</Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
