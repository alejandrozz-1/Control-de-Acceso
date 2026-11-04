import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import PageLayout from '../../components/ui/PageLayout';
import type { Role } from '../../services/auth';
import { adminUsersRequest, AdminUsersFunctionUnavailableError } from '../../services/adminUsers';
import { getIntlLocale } from '../../i18n/catalog';
import { useI18n } from '../../i18n/I18nProvider';
import { displayCenterName, displayUserStatus, filterUsers, type ManagedUser } from './userDirectory';
import { supabase } from '../../services/supabase';

type UserStatus = 'activo' | 'inactivo' | 'bloqueado' | 'pendiente_activacion';
type Center = { id: string; name: string; active: boolean };
type UserDirectory = { profiles: ManagedUser[]; centers: Center[] };
type FormFields = {
  givenName: string;
  familyName: string;
  email: string;
  phone: string;
  centerId: string;
  role: Role;
  status: UserStatus;
};
type UserAction = 'delete' | 'block' | 'activate' | 'reset-password' | 'resend-activation';
type PendingAction = { action: UserAction; user: ManagedUser };

const EMPTY_FORM: FormFields = {
  givenName: '',
  familyName: '',
  email: '',
  phone: '',
  centerId: '',
  role: 'empleado',
  status: 'pendiente_activacion',
};

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  responsable: 'Responsable',
  empleado: 'Empleado',
  seguridad: 'Seguridad',
  recursos_humanos: 'Recursos Humanos',
};
const ROLE_COLOR: Record<Role, 'primary' | 'secondary' | 'info' | 'warning' | 'default'> = {
  admin: 'primary',
  responsable: 'secondary',
  empleado: 'default',
  seguridad: 'warning',
  recursos_humanos: 'info',
};
const STATUS_LABEL: Record<UserStatus, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  bloqueado: 'Bloqueado',
  pendiente_activacion: 'Pendiente de activación',
};
const STATUS_COLOR: Record<UserStatus, 'success' | 'default' | 'error' | 'warning'> = {
  activo: 'success',
  inactivo: 'default',
  bloqueado: 'error',
  pendiente_activacion: 'warning',
};
const CENTER_ORDER = ['Torre Cristal Madrid', 'Campus Repsol', 'Cartagena', 'Puertollano', 'Tarragona', 'A Coruña'];
const ACTION_LABEL: Record<UserAction, string> = {
  delete: 'Eliminar usuario',
  block: 'Bloquear usuario',
  activate: 'Activar usuario',
  'reset-password': 'Restablecer contraseña',
  'resend-activation': 'Reenviar activación',
};
const ERROR_LABEL: Record<string, string> = {
  ese_email_ya_existe: 'Ya existe una cuenta con ese email.',
  nombre_invalido: 'Revisa el nombre y los apellidos.',
  email_invalido: 'Introduce un email válido.',
  rol_invalido: 'El rol seleccionado no es válido.',
  estado_invalido: 'El estado seleccionado no es válido.',
  centro_invalido: 'Selecciona un centro válido.',
  usuario_no_encontrado: 'No se encontró el usuario.',
  usuario_no_pendiente_de_activacion: 'El usuario ya completó la activación.',
  no_puede_eliminarse_a_si_mismo: 'No puedes eliminar tu propia cuenta.',
  no_puede_eliminarse_el_ultimo_admin: 'No se puede desactivar ni eliminar el último administrador activo.',
  email_configuration_missing: 'Falta configurar Resend, el remitente o la URL de la aplicación en Supabase.',
  invalid_app_url: 'La URL pública de la aplicación no es válida.',
  email_delivery_failed: 'No se pudo enviar el correo. Revisa la configuración del proveedor de correo.',
};
const FUNCTION_DEPLOYMENT_MESSAGE = 'El directorio se muestra en modo lectura porque admin-users aún no está desplegada en Supabase. Para crear o editar cuentas, aplica la migración y despliega la función siguiendo el README.';

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || '—';
}

function actionPrompt(action: UserAction): string {
  if (action === 'delete') return '¿Desea eliminar este usuario? Esta acción no se puede deshacer.';
  if (action === 'block') return 'El usuario perderá el acceso a la aplicación.';
  if (action === 'activate') return 'Se permitirá al usuario iniciar sesión.';
  if (action === 'reset-password') return 'Se generará una contraseña temporal nueva y se enviará un código de activación al email del usuario.';
  return 'Se enviarán una contraseña temporal nueva y un código de activación al email del usuario.';
}

function UserActions({ user, onDetails, onEdit, onAction }: {
  user: ManagedUser;
  onDetails: () => void;
  onEdit: () => void;
  onAction: (action: UserAction) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const isDisabled = user.status === 'bloqueado' || user.status === 'inactivo';
  return (
    <>
      <IconButton aria-label={`Acciones de ${user.full_name}`} onClick={(event) => setAnchor(event.currentTarget)} size="small">
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { setAnchor(null); onDetails(); }}><PersonIcon fontSize="small" sx={{ mr: 1 }} />Ver detalle</MenuItem>
        <MenuItem onClick={() => { setAnchor(null); onEdit(); }}><EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Editar</MenuItem>
        <MenuItem onClick={() => { setAnchor(null); onAction('reset-password'); }}><VpnKeyOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Restablecer contraseña</MenuItem>
        {user.must_change_password && (
          <MenuItem onClick={() => { setAnchor(null); onAction('resend-activation'); }}>Reenviar activación</MenuItem>
        )}
        {isDisabled
          ? <MenuItem onClick={() => { setAnchor(null); onAction('activate'); }}><CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />Activar usuario</MenuItem>
          : <MenuItem onClick={() => { setAnchor(null); onAction('block'); }}><BlockIcon fontSize="small" sx={{ mr: 1 }} />Bloquear usuario</MenuItem>}
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setAnchor(null); onAction('delete'); }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />Eliminar usuario
        </MenuItem>
      </Menu>
    </>
  );
}

export default function AdminUsuarios() {
  const { locale } = useI18n();
  const intlLocale = getIntlLocale(locale);
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [details, setDetails] = useState<ManagedUser | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; severity: 'success' | 'error' } | null>(null);

  const directory = useQuery({
    queryKey: ['admin-user-directory'],
    queryFn: async (): Promise<UserDirectory> => {
      try {
        return await adminUsersRequest<UserDirectory>({ action: 'list' });
      } catch (error) {
        if (!(error instanceof AdminUsersFunctionUnavailableError)) throw error;

        const [profilesResult, centersResult] = await Promise.all([
          supabase.from('profiles')
            .select('id, email, full_name, employee_code, phone, role, center_id, status, created_at')
            .order('full_name'),
          supabase.from('centers').select('id, name, active').order('name'),
        ]);
        if (profilesResult.error) throw profilesResult.error;
        if (centersResult.error) throw centersResult.error;
        const centersById = new Map(centersResult.data.map((center) => [center.id, center]));

        return {
          profiles: profilesResult.data.map((profile) => ({
            ...profile,
            role: profile.role as Role,
            status: profile.status === 'baja' ? 'inactivo' : profile.status,
            must_change_password: false,
            updated_at: null,
            locale: 'es',
            mfa_enabled: false,
            notification_prefs: {},
            center: profile.center_id ? centersById.get(profile.center_id) ?? null : null,
            last_sign_in_at: null,
          })) as ManagedUser[],
          centers: centersResult.data,
        };
      }
    },
  });

  const visibleUsers = useMemo(() => filterUsers(directory.data?.profiles ?? [], {
    query,
    role: roleFilter,
    status: statusFilter,
    centerId: centerFilter,
  }), [directory.data?.profiles, query, roleFilter, statusFilter, centerFilter]);
  const pageUsers = visibleUsers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  useEffect(() => {
    setPage(0);
  }, [query, roleFilter, statusFilter, centerFilter]);

  const saveUser = useMutation({
    mutationFn: async () => {
      const fullName = `${form.givenName.trim()} ${form.familyName.trim()}`.trim();
      if (editing) {
        await adminUsersRequest({
          action: 'update',
          user_id: editing.id,
          full_name: fullName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          center_id: form.centerId || null,
          role: form.role,
          status: form.status,
        });
      } else {
        await adminUsersRequest({
          action: 'create',
          given_name: form.givenName.trim(),
          family_name: form.familyName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          center_id: form.centerId,
          role: form.role,
          status: form.status,
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-user-directory'] });
      setPage(0);
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setEditing(null);
      setFeedback({ text: editing ? 'Usuario actualizado.' : 'Usuario creado. Se ha enviado el correo de activación.', severity: 'success' });
    },
    onError: (error) => setFormError(ERROR_LABEL[error instanceof Error ? error.message : ''] ?? 'No se pudo guardar el usuario. Revisa los datos e inténtalo de nuevo.'),
  });

  const runUserAction = useMutation({
    mutationFn: async ({ action, user }: PendingAction) => {
      await adminUsersRequest({ action, user_id: user.id });
      return action;
    },
    onSuccess: (action) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-user-directory'] });
      setPage(0);
      setPendingAction(null);
      const result = action === 'delete'
        ? 'Usuario eliminado.'
        : action === 'block'
          ? 'Usuario bloqueado.'
          : action === 'activate'
            ? 'Usuario activado.'
            : action === 'reset-password'
              ? 'Se ha enviado una nueva contraseña temporal y un código de activación.'
              : 'Se ha reenviado el correo de activación.';
      setFeedback({ text: result, severity: 'success' });
    },
    onError: (error) => setFeedback({
      text: ERROR_LABEL[error instanceof Error ? error.message : ''] ?? 'No se pudo completar la acción. Inténtalo de nuevo.',
      severity: 'error',
    }),
  });

  function startCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, centerId: directory.data?.centers.find((center) => center.active)?.id ?? '' });
    setFormError(null);
    setFormOpen(true);
  }

  function startEdit(user: ManagedUser) {
    const [givenName = '', ...familyNames] = user.full_name.split(/\s+/);
    setEditing(user);
    setForm({
      givenName,
      familyName: familyNames.join(' '),
      email: user.email ?? '',
      phone: user.phone ?? '',
      centerId: user.center_id ?? '',
      role: user.role,
      status: user.status,
    });
    setFormError(null);
    setFormOpen(true);
  }

  function submitForm(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    saveUser.mutate();
  }

  function statusChip(user: ManagedUser) {
    const status = displayUserStatus(user) as UserStatus;
    return <Chip size="small" label={STATUS_LABEL[status] ?? status} color={STATUS_COLOR[status] ?? 'default'} />;
  }

  function dateLabel(value: string | null) {
    return value
      ? new Intl.DateTimeFormat(intlLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
      : 'Sin accesos';
  }

  const centers = (directory.data?.centers ?? [])
    .filter((center) => CENTER_ORDER.includes(displayCenterName(center.name)))
    .sort((a, b) =>
      CENTER_ORDER.indexOf(displayCenterName(a.name)) - CENTER_ORDER.indexOf(displayCenterName(b.name)),
    );

  return (
    <PageLayout title="Gestionar usuarios" backTo="/admin">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography color="text.secondary">
            {directory.isLoading ? 'Cargando directorio…' : `${visibleUsers.length} de ${directory.data?.profiles.length ?? 0} usuarios`}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={startCreate} sx={{ borderRadius: 1 }}>
          Crear usuario
        </Button>
      </Box>

      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>{feedback.text}</Alert>
      )}
      {!directory.isError && directory.data && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {FUNCTION_DEPLOYMENT_MESSAGE}
        </Alert>
      )}
      {directory.isError && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={() => void directory.refetch()}>Reintentar</Button>
        }>
          {directory.error instanceof AdminUsersFunctionUnavailableError
            ? 'No se pudo cargar el directorio: Supabase aún no tiene desplegada la función de administración.'
            : ERROR_LABEL[directory.error instanceof Error ? directory.error.message : ''] ?? 'No se pudo cargar el directorio de usuarios.'}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 1, mb: 2, p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'minmax(240px, 2fr) repeat(3, minmax(150px, 1fr))' }, gap: 1.25 }}>
          <TextField
            placeholder="Buscar usuario…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            size="small"
            fullWidth
            sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
              htmlInput: { 'aria-label': 'Buscar por nombre, email o código de empleado' },
            }}
          />
          <TextField select label="Rol" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} size="small" fullWidth>
            <MenuItem value="all">Todos los roles</MenuItem>
            {(Object.keys(ROLE_LABEL) as Role[]).map((role) => <MenuItem key={role} value={role}>{ROLE_LABEL[role]}</MenuItem>)}
          </TextField>
          <TextField select label="Estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} size="small" fullWidth>
            <MenuItem value="all">Todos los estados</MenuItem>
            {(Object.keys(STATUS_LABEL) as UserStatus[]).map((status) => <MenuItem key={status} value={status}>{STATUS_LABEL[status]}</MenuItem>)}
          </TextField>
          <TextField select label="Centro" value={centerFilter} onChange={(event) => setCenterFilter(event.target.value)} size="small" fullWidth>
            <MenuItem value="all">Todos los centros</MenuItem>
            {centers.map((center) => (
              <MenuItem key={center.id} value={center.id}>{displayCenterName(center.name)}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {directory.isLoading && (
        <Box sx={{ display: 'grid', gap: 1 }}>
          {[0, 1, 2].map((row) => <Skeleton key={row} variant="rounded" height={72} />)}
        </Box>
      )}

      {directory.isSuccess && visibleUsers.length === 0 && (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>No hay usuarios que coincidan</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Prueba a cambiar la búsqueda o los filtros.</Typography>
        </Paper>
      )}

      {visibleUsers.length > 0 && (
        <>
          <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1 }}>
            {pageUsers.map((user) => (
              <Paper key={user.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14 }}>{initials(user.full_name)}</Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{user.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{user.email ?? '—'}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                      <Chip size="small" label={ROLE_LABEL[user.role]} color={ROLE_COLOR[user.role]} />
                      {statusChip(user)}
                    </Box>
                  </Box>
                  <UserActions
                    user={user}
                    onDetails={() => setDetails(user)}
                    onEdit={() => startEdit(user)}
                    onAction={(action) => setPendingAction({ action, user })}
                  />
                </Box>
                <Divider sx={{ my: 1.25 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, color: 'text.secondary' }}>
                  <Typography variant="caption">{displayCenterName(user.center?.name ?? 'Sin centro')}</Typography>
                  <Typography variant="caption">Último acceso: {dateLabel(user.last_sign_in_at)}</Typography>
                </Box>
              </Paper>
            ))}
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 1 }}>
            <Table aria-label="Usuarios" size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 700, whiteSpace: 'nowrap' } }}>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Centro</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Último acceso</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageUsers.map((user) => (
                  <TableRow key={user.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ minWidth: 250 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 13 }}>{initials(user.full_name)}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }}>{user.full_name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                            {user.email ?? '—'}{user.employee_code ? ` · ${user.employee_code}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Chip size="small" label={ROLE_LABEL[user.role]} color={ROLE_COLOR[user.role]} /></TableCell>
                    <TableCell>{displayCenterName(user.center?.name ?? 'Sin centro')}</TableCell>
                    <TableCell>{statusChip(user)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateLabel(user.last_sign_in_at)}</TableCell>
                    <TableCell align="right">
                      <UserActions
                        user={user}
                        onDetails={() => setDetails(user)}
                        onEdit={() => startEdit(user)}
                        onAction={(action) => setPendingAction({ action, user })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={visibleUsers.length}
            page={page}
            onPageChange={(_event, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </>
      )}

      <Dialog open={formOpen} onClose={() => !saveUser.isPending && setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="user-form" onSubmit={submitForm} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
            {formError && <Alert severity="error" role="alert" sx={{ gridColumn: '1 / -1' }}>{formError}</Alert>}
            <TextField label="Nombre" value={form.givenName} onChange={(event) => setForm({ ...form, givenName: event.target.value })} required fullWidth />
            <TextField label="Apellidos" value={form.familyName} onChange={(event) => setForm({ ...form, familyName: event.target.value })} required fullWidth />
            <TextField label="Email corporativo" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required fullWidth sx={{ gridColumn: '1 / -1' }} />
            <TextField label="Teléfono" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} fullWidth />
            <TextField select label="Centro" value={form.centerId} onChange={(event) => setForm({ ...form, centerId: event.target.value })} fullWidth required>
              {centers.filter((center) => center.active || center.id === form.centerId).map((center) => (
                <MenuItem key={center.id} value={center.id}>{displayCenterName(center.name)}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Rol" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })} fullWidth>
              {(Object.keys(ROLE_LABEL) as Role[]).map((role) => <MenuItem key={role} value={role}>{ROLE_LABEL[role]}</MenuItem>)}
            </TextField>
            <TextField select label="Estado inicial" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as UserStatus })} fullWidth>
              {(Object.keys(STATUS_LABEL) as UserStatus[])
                .filter((status) => status !== 'pendiente_activacion' || !editing || editing.must_change_password)
                .map((status) => <MenuItem key={status} value={status}>{STATUS_LABEL[status]}</MenuItem>)}
            </TextField>
            {!editing && (
              <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                Se generarán una contraseña temporal y un código de activación, y se enviarán al email indicado. La persona deberá cambiar la contraseña al entrar por primera vez.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saveUser.isPending}>Cancelar</Button>
          <Button type="submit" form="user-form" variant="contained" disabled={saveUser.isPending} startIcon={saveUser.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {saveUser.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!details} onClose={() => setDetails(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Detalle del usuario</DialogTitle>
        <DialogContent>
          {details && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
              {[
                ['Nombre', details.full_name],
                ['Email', details.email ?? '—'],
                ['Código de empleado', details.employee_code ?? '—'],
                ['Teléfono', details.phone ?? '—'],
                ['Centro', displayCenterName(details.center?.name ?? 'Sin centro')],
                ['Rol', ROLE_LABEL[details.role]],
                ['Estado', STATUS_LABEL[displayUserStatus(details) as UserStatus]],
                ['Último acceso', dateLabel(details.last_sign_in_at)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetails(null)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={!!pendingAction} onClose={() => !runUserAction.isPending && setPendingAction(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {pendingAction && ACTION_LABEL[pendingAction.action]}
        </DialogTitle>
        <DialogContent>
          <Typography>{pendingAction && actionPrompt(pendingAction.action)}</Typography>
          {pendingAction?.action === 'delete' && (
            <Alert severity="warning" sx={{ mt: 2 }}>Se eliminarán también los datos de autenticación asociados a esta cuenta.</Alert>
          )}
          {runUserAction.isError && (
            <Alert severity="error" role="alert" sx={{ mt: 2 }}>
              {ERROR_LABEL[runUserAction.error instanceof Error ? runUserAction.error.message : ''] ?? 'No se pudo completar la acción. Inténtalo de nuevo.'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingAction(null)} disabled={runUserAction.isPending}>Cancelar</Button>
          <Button
            color={pendingAction?.action === 'delete' || pendingAction?.action === 'block' ? 'error' : 'primary'}
            variant="contained"
            disabled={!pendingAction || runUserAction.isPending}
            onClick={() => pendingAction && runUserAction.mutate(pendingAction)}
          >
            {runUserAction.isPending ? 'Procesando…' : pendingAction?.action === 'delete' ? 'Eliminar' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
