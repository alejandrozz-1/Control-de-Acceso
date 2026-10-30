import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import BlockIcon from '@mui/icons-material/Block';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PinIcon from '@mui/icons-material/Pin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import PageLayout from '../../components/ui/PageLayout';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../services/auth';

interface CredentialRow {
  id: string;
  kind: 'qr' | 'temporal' | 'nfc';
  status: 'activa' | 'revocada' | 'expirada' | string;
  created_at: string;
  revoked_at: string | null;
  user: { full_name: string; email: string } | null;
}

const KIND_LABEL: Record<string, string> = { qr: 'QR', temporal: 'Temporal', nfc: 'NFC' };
const STATUS_COLOR: Record<string, 'success' | 'error' | 'default'> = {
  activa: 'success', revocada: 'error', caducada: 'default',
};

/** Mensaje amable para errores previsibles (RLS/duplicados). */
export function revokeErrorText(m: unknown): string {
  if (!m) return '';
  const s = String(m);
  if (s.includes('row-level security') || s.includes('403')) return 'Solo un administrador o el responsable del equipo puede revocar';
  return 'No se pudo revocar. Inténtalo de nuevo.';
}

/** T-012: revocación individual/masiva de credenciales (auditoría y notificación las hace el trigger en servidor). */
export default function AdminCredenciales() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.session?.user.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmOne, setConfirmOne] = useState<CredentialRow | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin-credentials'],
    queryFn: async (): Promise<CredentialRow[]> => {
      const { data, error } = await supabase
        .from('access_credentials')
        .select('id, kind, status, created_at, revoked_at, user:profiles!access_credentials_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as CredentialRow[];
    },
  });

  const rows = list.data ?? [];
  const activeSelected = rows.filter((r) => selected.has(r.id) && r.status === 'activa');

  const revoke = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('access_credentials')
        .update({ status: 'revocada', revoked_at: new Date().toISOString(), revoked_by: uid })
        .in('id', ids)
        .eq('status', 'activa');
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      void qc.invalidateQueries({ queryKey: ['admin-credentials'] });
      setOk(ids.length > 1 ? `${ids.length} credenciales revocadas` : 'Credencial revocada');
      setSelected(new Set());
      setConfirmBulk(false);
      setConfirmOne(null);
    },
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableActive = rows.filter((r) => r.status === 'activa');
  const allSelected = selectableActive.length > 0 && selectableActive.every((r) => selected.has(r.id));

  return (
    <PageLayout title="Credenciales">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {list.isLoading ? 'Cargando…' : `${rows.length} credenciales · ${selectableActive.length} activas`}
        </Typography>
        {selectableActive.length > 0 && (
          <Button
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
            onClick={() => setSelected(allSelected ? new Set() : new Set(selectableActive.map((r) => r.id)))}
          >
            {allSelected ? 'Deseleccionar' : 'Seleccionar activas'}
          </Button>
        )}
      </Box>

      {ok && <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setOk(null)}>{ok}</Alert>}
      {revoke.isError && <Alert severity="error" role="alert" sx={{ mb: 1.5 }}>{revokeErrorText(revoke.error)}</Alert>}

      {list.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={64} aria-label={`Cargando credencial ${i + 1}`} />)}
        </Box>
      )}

      {list.isError && (
        <Alert severity="error" role="alert" action={<Button color="inherit" size="small" onClick={() => list.refetch()}>Reintentar</Button>}>
          No se pudieron cargar las credenciales.
        </Alert>
      )}

      {list.isSuccess && rows.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
          <QrCodeIcon sx={{ fontSize: 48, opacity: 0.4 }} />
          <Typography variant="body2" sx={{ mt: 1 }}>Aún no se ha emitido ninguna credencial.</Typography>
        </Box>
      )}

      {rows.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
          <List disablePadding>
            {rows.map((r) => {
              const isActive = r.status === 'activa';
              const isSel = selected.has(r.id);
              return (
                <ListItem
                  key={r.id}
                  disablePadding
                  secondaryAction={
                    isActive ? (
                      <IconButton
                        size="small"
                        aria-label={`Revocar credencial de ${r.user?.full_name ?? ''}`}
                        color="error"
                        onClick={() => setConfirmOne(r)}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    ) : undefined
                  }
                  sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <ListItemButton
                    disabled={!isActive}
                    onClick={() => toggle(r.id)}
                    sx={{ py: 1, px: 1, opacity: isActive ? 1 : 0.6 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        size="small"
                        checked={isSel}
                        disabled={!isActive}
                        tabIndex={-1}
                        disableRipple
                        slotProps={{ input: { 'aria-label': `Seleccionar credencial de ${r.user?.full_name ?? ''}` } }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                          {r.kind === 'temporal' ? <PinIcon sx={{ fontSize: 15 }} /> : <QrCodeIcon sx={{ fontSize: 15 }} />}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.user?.full_name ?? '—'}</Typography>
                          <Chip size="small" label={KIND_LABEL[r.kind] ?? r.kind} sx={{ height: 18, fontSize: '0.65rem' }} variant="outlined" />
                          <Chip size="small" color={STATUS_COLOR[r.status] ?? 'default'} label={r.status} sx={{ height: 18, fontSize: '0.65rem' }} />
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.user?.email}
                          {' · '}{new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          {r.revoked_at && ` · revocada ${new Date(r.revoked_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Revocación masiva */}
      <Dialog open={confirmBulk} onClose={() => setConfirmBulk(false)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Revocar {activeSelected.length} credenciales</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Dejarán de funcionar <strong>al instante</strong> (el QR caduca en cuanto se revoca). Las personas afectadas recibirán una notificación.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmBulk(false)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={revoke.isPending} onClick={() => revoke.mutate(activeSelected.map((r) => r.id))}>
            Revocar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revocación individual */}
      <Dialog open={!!confirmOne} onClose={() => setConfirmOne(null)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Revocar credencial</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmOne?.user?.full_name} dejará de poder usar su {KIND_LABEL[confirmOne?.kind ?? 'qr']} al instante y recibirá una notificación.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOne(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            disabled={revoke.isPending}
            onClick={() => confirmOne && revoke.mutate([confirmOne.id])}
          >
            Revocar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Barra de acción masiva fija sobre la navegación cuando hay selección */}
      {activeSelected.length > 0 && !confirmBulk && (
        <Box
          sx={{
            position: 'sticky', bottom: 80, zIndex: 5, display: 'flex', gap: 1, p: 1.5,
            bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            border: '1px solid', borderColor: 'divider', alignItems: 'center',
          }}
          role="region"
          aria-label="Acciones sobre la selección"
        >
          <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>{activeSelected.length} seleccionadas</Typography>
          <Button size="small" onClick={() => setSelected(new Set())}>Limpiar</Button>
          <Button size="small" color="error" variant="contained" startIcon={<BlockIcon />} onClick={() => setConfirmBulk(true)}>
            Revocar
          </Button>
        </Box>
      )}
    </PageLayout>
  );
}
