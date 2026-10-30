import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../services/auth';
import { getIntlLocale } from '../../i18n/catalog';
import { useI18n } from '../../i18n/I18nProvider';

interface VacationRow {
  id: string;
  user_id: string;
  type: 'vacacion' | 'baja' | 'permiso';
  start_date: string;
  end_date: string;
  days: number;
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'anulada';
  reason: string | null;
  created_at: string;
  requester?: { full_name: string } | null;
}

const TYPE_LABEL: Record<string, string> = { vacacion: 'Vacaciones', baja: 'Baja', permiso: 'Permiso' };
const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pendiente: 'warning',
  aprobada: 'success',
  rechazada: 'error',
  anulada: 'default',
};

/** Días naturales inclusivos entre dos fechas ISO (>= 1 si end >= start). */
export function inclusiveDays(start: string, end: string): number {
  const s = Date.parse(`${start}T12:00:00`);
  const e = Date.parse(`${end}T12:00:00`);
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.round((e - s) / 86_400_000) + 1;
}

function RequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const uid = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const [type, setType] = useState('vacacion');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');

  const days = inclusiveDays(start, end);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vacation_requests').insert({
        user_id: uid, // RLS vacation_insert exige user_id = auth.uid()
        type: type as VacationRow['type'],
        start_date: start,
        end_date: end,
        days,
        reason: reason.trim() || null,
        status: 'pendiente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vacations'] });
      setStart(''); setEnd(''); setReason(''); setType('vacacion');
      onClose();
    },
  });

  const invalid = !start || !end || days < 1;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>{t('Nueva solicitud')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <TextField
          select
          label={t('Tipo')}
          value={type}
          onChange={(e) => setType(e.target.value)}
          size="small"
        >
          <MenuItem value="vacacion">{t('Vacaciones')}</MenuItem>
          <MenuItem value="permiso">{t('Permiso')}</MenuItem>
          <MenuItem value="baja">{t('Baja')}</MenuItem>
        </TextField>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label={t('Desde')}
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t('Hasta')}
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            size="small"
            fullWidth
            error={!!start && !!end && days < 1}
            helperText={!!start && !!end && days < 1 ? t('Fecha inválida') : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
        <TextField
          label={t('Motivo (opcional)')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          size="small"
          multiline
          minRows={2}
        />
        {days > 0 && (
          <Typography variant="body2" color="text.secondary" aria-live="polite">
            {days} {t(days === 1 ? 'día natural' : 'días naturales')} — {t('quedará pendiente de aprobación de tu responsable.')}
          </Typography>
        )}
        {save.isError && (
          <Alert severity="error" role="alert">{t('No se pudo enviar la solicitud. Inténtalo de nuevo.')}</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>{t('Cancelar')}</Button>
        <Button
          variant="contained"
          disabled={invalid || save.isPending}
          onClick={() => save.mutate()}
        >
          {t('Enviar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RequestRow({
  r,
  own,
  onDecide,
  onAnul,
  pending,
}: {
  r: VacationRow;
  own: boolean;
  onDecide?: (id: string, status: 'aprobada' | 'rechazada') => void;
  onAnul?: (id: string) => void;
  pending: boolean;
}) {
  const { locale, t } = useI18n();
  const intlLocale = getIntlLocale(locale);

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t(TYPE_LABEL[r.type])}
          {!own && r.requester ? ` · ${r.requester.full_name.split(' ')[0]}` : ''}
        </Typography>
        <Chip size="small" color={STATUS_COLOR[r.status]} label={t(r.status)} sx={{ height: 20, fontSize: '0.7rem' }} />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontVariantNumeric: 'tabular-nums' }}>
          {new Date(`${r.start_date}T12:00:00`).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })} –{' '}
          {new Date(`${r.end_date}T12:00:00`).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })} · {r.days}{' '}
          {t(r.days === 1 ? 'día' : 'días')}
        </Typography>
        {own && r.status === 'pendiente' && onAnul && (
          <Tooltip title={t('Anular solicitud')}>
            <IconButton size="small" aria-label={t('Anular solicitud')} onClick={() => onAnul(r.id)} disabled={pending}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {!own && r.status === 'pendiente' && onDecide && (
          <>
            <Tooltip title={t('Aprobar')}>
              <IconButton
                size="small"
                aria-label={`${t('Aprobar')} ${t('solicitud de')} ${r.requester?.full_name ?? ''}`}
                color="success"
                onClick={() => onDecide(r.id, 'aprobada')}
                disabled={pending}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('Rechazar')}>
              <IconButton
                size="small"
                aria-label={`${t('Rechazar')} ${t('solicitud de')} ${r.requester?.full_name ?? ''}`}
                color="error"
                onClick={() => onDecide(r.id, 'rechazada')}
                disabled={pending}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      {r.reason && (
        <Typography variant="caption" color="text.secondary">«{r.reason}»</Typography>
      )}
      <Divider sx={{ mt: 1 }} />
    </Box>
  );
}

/**
 * Panel de vacaciones (T-016): el empleado solicita y anula las suyas;
 * el líder/admin ve las pendientes de su equipo y decide (RLS lo restringe,
 * el trigger `fn_vacation_review` lo valida en servidor y notifica al empleado).
 */
export default function VacacionesPanel() {
  const { t } = useI18n();
  const uid = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);

  const list = useQuery({
    queryKey: ['vacations', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select('id, user_id, type, start_date, end_date, days, status, reason, created_at, requester:profiles!vacation_requests_user_id_fkey(full_name)')
        .order('start_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as VacationRow[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'aprobada' | 'rechazada' }) => {
      const { error } = await supabase.from('vacation_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['vacations'] }),
  });

  const anul = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vacation_requests').update({ status: 'anulada' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['vacations'] }),
  });

  const mine = (list.data ?? []).filter((r) => r.user_id === uid);
  const teamPending = (list.data ?? []).filter((r) => r.user_id !== uid && r.status === 'pendiente');
  const canDecide = teamPending.length > 0;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700 }}>
          {t('Tus solicitudes')}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setDialog(true)} sx={{ px: 1 }}>
          {t('Solicitar')}
        </Button>
      </Box>

      {list.isLoading && <Skeleton variant="rounded" height={72} aria-label={t('Cargando solicitudes')} />}

      {list.isError && (
        <Alert
          severity="error"
          role="alert"
          action={<Button color="inherit" size="small" onClick={() => list.refetch()}>{t('Reintentar')}</Button>}
        >
          {t('No se pudieron cargar las solicitudes.')}
        </Alert>
      )}

      {list.isSuccess && mine.length === 0 && !canDecide && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('Aún no has solicitado vacaciones ni permisos.')}
        </Typography>
      )}

      {(decide.isError || anul.isError) && (
        <Alert severity="error" role="alert" sx={{ mb: 1 }}>
          {t('No se pudo actualizar la solicitud. Solo el responsable del equipo puede decidir.')}
        </Alert>
      )}

      <Box sx={{ mb: teamPending.length > 0 ? 2 : 0 }}>
        {mine.map((r) => (
          <RequestRow
            key={r.id}
            r={r}
            own
            onAnul={(id) => anul.mutate(id)}
            pending={anul.isPending}
          />
        ))}
      </Box>

      {teamPending.length > 0 && (
        <>
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700, mt: 1, mb: 0.5 }}>
            {t('Pendientes de tu equipo')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('Al aprobar, la persona recibe una notificación.')}
          </Typography>
          {teamPending.map((r) => (
            <RequestRow
              key={r.id}
              r={r}
              own={false}
              onDecide={(id, status) => decide.mutate({ id, status })}
              pending={decide.isPending}
            />
          ))}
        </>
      )}

      <RequestDialog open={dialog} onClose={() => setDialog(false)} />
    </>
  );
}
