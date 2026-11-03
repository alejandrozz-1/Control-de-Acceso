import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SchoolIcon from '@mui/icons-material/School';
import CancelIcon from '@mui/icons-material/Cancel';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../services/auth';
import { getIntlLocale } from '../../i18n/catalog';
import { useI18n } from '../../i18n/I18nProvider';

interface VacationRow {
  id: string;
  user_id: string;
  type: 'vacacion' | 'baja' | 'permiso' | 'formacion' | 'evento';
  start_date: string;
  end_date: string;
  days: number;
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'anulada';
  reason: string | null;
  created_at: string;
  archived_at: string | null;
  requester?: { full_name: string } | null;
}

type RequestCreationType = 'vacacion' | 'baja' | 'permiso';

const TYPE_LABEL: Record<string, string> = {
  vacacion: 'Vacaciones',
  baja: 'Baja médica',
  permiso: 'Permiso',
  formacion: 'Formación',
  evento: 'Evento corporativo',
};
const FILTERS = ['todas', 'pendiente', 'aprobada', 'rechazada', 'anulada'] as const;
type RequestFilter = (typeof FILTERS)[number];
type RequestTypeFilter = 'todas' | VacationRow['type'];
type RequestSort = 'recent' | 'oldest' | 'longest' | 'shortest';
type RequestPeriod = {
  status: RequestFilter;
  type: RequestTypeFilter;
  from: string;
  to: string;
  year: string;
  month: string;
};

const EMPTY_PERIOD: RequestPeriod = {
  status: 'todas',
  type: 'todas',
  from: '',
  to: '',
  year: 'todas',
  month: 'todos',
};
const PAGE_SIZE = 500;

const TYPE_ICON = {
  vacacion: BeachAccessIcon,
  baja: MedicalServicesIcon,
  permiso: AssignmentOutlinedIcon,
  formacion: SchoolIcon,
  evento: BusinessIcon,
};

/** Días naturales inclusivos entre dos fechas ISO (>= 1 si end >= start). */
export function inclusiveDays(start: string, end: string): number {
  const s = Date.parse(`${start}T12:00:00`);
  const e = Date.parse(`${end}T12:00:00`);
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.round((e - s) / 86_400_000) + 1;
}

function RequestDialog({
  open,
  onClose,
  request,
}: {
  open: boolean;
  onClose: () => void;
  request?: VacationRow | null;
}) {
  const { t } = useI18n();
  const uid = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const [type, setType] = useState<RequestCreationType>('vacacion');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) return;
    setType((request?.type as RequestCreationType | undefined) ?? 'vacacion');
    setStart(request?.start_date ?? '');
    setEnd(request?.end_date ?? '');
    setReason(request?.reason ?? '');
  }, [open, request]);

  const days = inclusiveDays(start, end);
  const save = useMutation({
    mutationFn: async () => {
      const values = {
        type,
        start_date: start,
        end_date: end,
        days,
        reason: reason.trim() || null,
      };
      if (request) {
        const { data, error } = await supabase
          .from('vacation_requests')
          .update(values)
          .eq('id', request.id)
          .eq('user_id', uid)
          .eq('status', 'pendiente')
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('La solicitud ya no está pendiente o no se puede editar.');
        return;
      }

      const { error } = await supabase.from('vacation_requests').insert({
        user_id: uid, // RLS vacation_insert exige user_id = auth.uid()
        ...values,
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
      <DialogTitle sx={{ fontWeight: 700 }}>{t(request ? 'Editar solicitud' : 'Nueva solicitud')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <TextField
          select
          label={t('Tipo')}
          value={type}
          onChange={(e) => setType(e.target.value as RequestCreationType)}
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
        {save.isError && <Alert severity="error" role="alert">{t('No se pudo guardar la solicitud. Inténtalo de nuevo.')}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>{t('Cancelar')}</Button>
        <Button
          variant="contained"
          disabled={invalid || save.isPending}
          onClick={() => save.mutate()}
        >
          {t(request ? 'Guardar cambios' : 'Enviar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RequestRow({
  r,
  own,
  onDecide,
  onEdit,
  onDetails,
  onCancel,
  archived,
  onArchive,
  onRestore,
  pending,
}: {
  r: VacationRow;
  own: boolean;
  onDecide?: (id: string, status: 'aprobada' | 'rechazada') => void;
  onEdit?: (request: VacationRow) => void;
  onDetails?: (request: VacationRow) => void;
  onCancel?: (request: VacationRow) => void;
  archived?: boolean;
  onArchive?: (request: VacationRow) => void;
  onRestore?: (request: VacationRow) => void;
  pending: boolean;
}) {
  const { locale, t } = useI18n();
  const intlLocale = getIntlLocale(locale);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const RequestTypeIcon = TYPE_ICON[r.type] ?? AssignmentOutlinedIcon;
  const statusMeta = {
    pendiente: { label: 'Pendiente', color: 'warning' as const, icon: <PendingActionsIcon fontSize="small" /> },
    aprobada: { label: 'Aprobada', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> },
    rechazada: { label: 'Rechazada', color: 'error' as const, icon: <CancelIcon fontSize="small" /> },
    anulada: { label: 'anulada', color: 'default' as const, icon: <CloseIcon fontSize="small" /> },
  }[r.status];
  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const dateRange = `${new Date(`${r.start_date}T12:00:00`).toLocaleDateString(intlLocale, dateOptions)} – ${new Date(`${r.end_date}T12:00:00`).toLocaleDateString(intlLocale, dateOptions)}`;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: '0 3px 14px rgba(4, 30, 66, 0.06)',
        transition: 'box-shadow 180ms ease, transform 180ms ease',
        '&:hover': { boxShadow: '0 8px 24px rgba(4, 30, 66, 0.1)', transform: 'translateY(-1px)' },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ p: 1, borderRadius: 2, color: 'secondary.main', bgcolor: 'action.hover', display: 'flex' }}>
            <RequestTypeIcon />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 750, lineHeight: 1.35 }}>
              {t(TYPE_LABEL[r.type] ?? 'Permiso')}
            </Typography>
            {!own && r.requester && (
              <Typography variant="body2" color="text.secondary">{r.requester.full_name}</Typography>
            )}
          </Box>
          {own && (
            <>
              <IconButton
                size="small"
                aria-label={t('Opciones de solicitud')}
                aria-haspopup="menu"
                aria-expanded={Boolean(menuAnchor)}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => { setMenuAnchor(null); onDetails?.(r); }}>
                  {t('Ver detalle')}
                </MenuItem>
                {r.status === 'pendiente' && (
                  <MenuItem onClick={() => { setMenuAnchor(null); onEdit?.(r); }}>
                    {t('Editar')}
                  </MenuItem>
                )}
                {r.status === 'pendiente' && (
                  <MenuItem onClick={() => { setMenuAnchor(null); onCancel?.(r); }} sx={{ color: 'error.main' }}>
                    {t('Cancelar solicitud')}
                  </MenuItem>
                )}
                {archived ? (
                  <MenuItem onClick={() => { setMenuAnchor(null); onRestore?.(r); }}>
                    <RestoreIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('Restaurar')}
                  </MenuItem>
                ) : (
                  <MenuItem onClick={() => { setMenuAnchor(null); onArchive?.(r); }}>
                    <ArchiveOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('Archivar')}
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
          {!own && r.status === 'pendiente' && onDecide && (
            <Stack direction="row">
              <IconButton
                size="small"
                aria-label={`${t('Aprobar')} ${t('solicitud de')} ${r.requester?.full_name ?? ''}`}
                color="success"
                onClick={() => onDecide(r.id, 'aprobada')}
                disabled={pending}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label={`${t('Rechazar')} ${t('solicitud de')} ${r.requester?.full_name ?? ''}`}
                color="error"
                onClick={() => onDecide(r.id, 'rechazada')}
                disabled={pending}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Stack>

        <Box sx={{ mt: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={statusMeta.icon}
            label={t(statusMeta.label)}
            color={statusMeta.color}
            sx={{ fontWeight: 700, textTransform: 'capitalize' }}
          />
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <CalendarMonthIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {dateRange}
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, alignItems: 'center', color: 'text.secondary' }}>
          <ScheduleIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {r.days} {t(r.days === 1 ? 'día' : 'días')}
          </Typography>
        </Stack>

        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
            {r.reason || t('Sin motivo indicado')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function RequestDetailsDialog({
  request,
  onClose,
}: {
  request: VacationRow | null;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  if (!request) return null;

  const intlLocale = getIntlLocale(locale);
  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const from = new Date(`${request.start_date}T12:00:00`).toLocaleDateString(intlLocale, dateOptions);
  const to = new Date(`${request.end_date}T12:00:00`).toLocaleDateString(intlLocale, dateOptions);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>{t('Ver detalle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t(TYPE_LABEL[request.type] ?? 'Permiso')}</Typography>
          <Chip label={t(request.status)} sx={{ alignSelf: 'flex-start', textTransform: 'capitalize' }} />
          <Box>
            <Typography variant="caption" color="text.secondary">{t('Fechas')}</Typography>
            <Typography variant="body2">{from} – {to}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">{t('Duración')}</Typography>
            <Typography variant="body2">{request.days} {t(request.days === 1 ? 'día' : 'días')}</Typography>
          </Box>
          {request.requester && (
            <Box>
              <Typography variant="caption" color="text.secondary">{t('Empleado')}</Typography>
              <Typography variant="body2">{request.requester.full_name}</Typography>
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">{t('Motivo')}</Typography>
            <Typography variant="body2">{request.reason || t('Sin motivo indicado')}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('Cerrar')}</Button>
      </DialogActions>
    </Dialog>
  );
}

function AdvancedFiltersDialog({
  open,
  filters,
  sort,
  showArchived,
  years,
  onClose,
  onApply,
}: {
  open: boolean;
  filters: RequestPeriod;
  sort: RequestSort;
  showArchived: boolean;
  years: string[];
  onClose: () => void;
  onApply: (filters: RequestPeriod, sort: RequestSort, showArchived: boolean) => void;
}) {
  const { locale, t } = useI18n();
  const [draft, setDraft] = useState(filters);
  const [draftSort, setDraftSort] = useState(sort);
  const [draftShowArchived, setDraftShowArchived] = useState(showArchived);
  const intlLocale = getIntlLocale(locale);

  useEffect(() => {
    if (open) {
      setDraft(filters);
      setDraftSort(sort);
      setDraftShowArchived(showArchived);
    }
  }, [filters, open, showArchived, sort]);

  const invalidRange = !!draft.from && !!draft.to && draft.from > draft.to;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>{t('Filtros avanzados')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <TextField
          select
          label={t('Estado')}
          value={draft.status}
          onChange={(event) => setDraft({ ...draft, status: event.target.value as RequestFilter })}
          size="small"
        >
          {FILTERS.map((status) => (
            <MenuItem key={status} value={status}>
              {t(status === 'todas' ? 'Todas' : status === 'pendiente' ? 'Pendientes' : status === 'aprobada' ? 'Aprobadas' : status === 'rechazada' ? 'Rechazadas' : 'Anuladas')}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t('Tipo de solicitud')}
          value={draft.type}
          onChange={(event) => setDraft({ ...draft, type: event.target.value as RequestTypeFilter })}
          size="small"
        >
          <MenuItem value="todas">{t('Todas')}</MenuItem>
          {Object.entries(TYPE_LABEL).map(([type, label]) => (
            <MenuItem key={type} value={type}>{t(label)}</MenuItem>
          ))}
        </TextField>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={draftShowArchived}
          aria-label={t('Histórico de solicitudes')}
          onChange={(_, value: boolean | null) => { if (value !== null) setDraftShowArchived(value); }}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none' } }}
        >
          <ToggleButton value={false}>{t('Activas')}</ToggleButton>
          <ToggleButton value={true}>{t('Archivadas')}</ToggleButton>
        </ToggleButtonGroup>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label={t('Desde')}
            type="date"
            value={draft.from}
            onChange={(event) => setDraft({ ...draft, from: event.target.value })}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t('Hasta')}
            type="date"
            value={draft.to}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
            size="small"
            fullWidth
            error={invalidRange}
            helperText={invalidRange ? t('El inicio debe ser anterior al final.') : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            select
            label={t('Año')}
            value={draft.year}
            onChange={(event) => setDraft({ ...draft, year: event.target.value })}
            size="small"
            fullWidth
          >
            <MenuItem value="todas">{t('Todos')}</MenuItem>
            {years.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
          </TextField>
          <TextField
            select
            label={t('Mes')}
            value={draft.month}
            onChange={(event) => setDraft({ ...draft, month: event.target.value })}
            size="small"
            fullWidth
          >
            <MenuItem value="todos">{t('Todos')}</MenuItem>
            {Array.from({ length: 12 }, (_, index) => {
              const month = String(index + 1).padStart(2, '0');
              const label = new Intl.DateTimeFormat(intlLocale, { month: 'long' }).format(new Date(2026, index, 1));
              return <MenuItem key={month} value={month}>{label}</MenuItem>;
            })}
          </TextField>
        </Stack>
        <TextField
          select
          label={t('Ordenar por')}
          value={draftSort}
          onChange={(event) => setDraftSort(event.target.value as RequestSort)}
          size="small"
        >
          <MenuItem value="recent">{t('Más recientes primero')}</MenuItem>
          <MenuItem value="oldest">{t('Más antiguas primero')}</MenuItem>
          <MenuItem value="longest">{t('Duración mayor')}</MenuItem>
          <MenuItem value="shortest">{t('Duración menor')}</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => { setDraft(EMPTY_PERIOD); setDraftSort('recent'); setDraftShowArchived(false); }}>
          {t('Limpiar filtros')}
        </Button>
        <Button onClick={onClose}>{t('Cancelar')}</Button>
        <Button
          variant="contained"
          disabled={invalidRange}
          onClick={() => { onApply(draft, draftSort, draftShowArchived); onClose(); }}
        >
          {t('Aplicar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Panel de vacaciones (T-016): el empleado solicita y anula las suyas;
 * el líder/admin ve las pendientes de su equipo y decide (RLS lo restringe,
 * el trigger `fn_vacation_review` lo valida en servidor y notifica al empleado).
 */
export default function VacacionesPanel() {
  const { locale, t } = useI18n();
  const uid = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editRequest, setEditRequest] = useState<VacationRow | null>(null);
  const [detailsRequest, setDetailsRequest] = useState<VacationRow | null>(null);
  const [cancelRequest, setCancelRequest] = useState<VacationRow | null>(null);
  const [filterDialog, setFilterDialog] = useState(false);
  const [filter, setFilter] = useState<RequestFilter>('todas');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<RequestPeriod>(EMPTY_PERIOD);
  const [sort, setSort] = useState<RequestSort>('recent');
  const [showArchived, setShowArchived] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const list = useQuery({
    queryKey: ['vacations', uid],
    enabled: !!uid,
    queryFn: async () => {
      const allRequests: VacationRow[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from('vacation_requests')
          .select('id, user_id, type, start_date, end_date, days, status, reason, created_at, archived_at, requester:profiles!vacation_requests_user_id_fkey(full_name)')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        const page = (data ?? []) as unknown as VacationRow[];
        allRequests.push(...page);
        if (page.length < PAGE_SIZE) return allRequests;
      }
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
    mutationFn: async (request: VacationRow) => {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update({ status: 'anulada' })
        .eq('id', request.id)
        .eq('user_id', uid)
        .eq('status', 'pendiente')
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('La solicitud ya no está pendiente o no se puede cancelar.');
    },
    onSuccess: () => {
      setCancelRequest(null);
      void qc.invalidateQueries({ queryKey: ['vacations'] });
    },
  });

  const archive = useMutation({
    mutationFn: async ({ request, shouldArchive }: { request: VacationRow; shouldArchive: boolean }) => {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update({ archived_at: shouldArchive ? new Date().toISOString() : null })
        .eq('id', request.id)
        .eq('user_id', uid)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('No se pudo actualizar el archivo de la solicitud.');
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['vacations'] }),
  });

  const mine = (list.data ?? []).filter((r) => r.user_id === uid);
  const years = [...new Set(mine.map((request) => request.start_date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const yearFilteredMine = period.year === 'todas'
    ? mine
    : mine.filter((request) => request.start_date.startsWith(period.year));
  const counts = {
    pendiente: yearFilteredMine.filter((request) => request.status === 'pendiente').length,
    aprobada: yearFilteredMine.filter((request) => request.status === 'aprobada').length,
    rechazada: yearFilteredMine.filter((request) => request.status === 'rechazada').length,
    anulada: yearFilteredMine.filter((request) => request.status === 'anulada').length,
  };
  const activeOrArchived = mine.filter((request) => Boolean(request.archived_at) === showArchived);
  const normalizedSearch = search.trim().toLocaleLowerCase(locale);
  const visibleMine = activeOrArchived
    .filter((request) => filter === 'todas' || request.status === filter)
    .filter((request) => period.status === 'todas' || request.status === period.status)
    .filter((request) => period.type === 'todas' || request.type === period.type)
    .filter((request) => period.year === 'todas' || request.start_date.startsWith(period.year))
    .filter((request) => period.month === 'todos' || request.start_date.slice(5, 7) === period.month)
    .filter((request) => !period.from || request.end_date >= period.from)
    .filter((request) => !period.to || request.start_date <= period.to)
    .filter((request) => {
      if (!normalizedSearch) return true;
      const searchable = [
        t(TYPE_LABEL[request.type] ?? 'Permiso'),
        t(request.status),
        request.reason ?? '',
      ].join(' ').toLocaleLowerCase(locale);
      return searchable.includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (sort === 'longest') return b.days - a.days || b.created_at.localeCompare(a.created_at);
      if (sort === 'shortest') return a.days - b.days || b.created_at.localeCompare(a.created_at);
      return sort === 'recent'
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at);
    });
  const displayedRequests = visibleMine.slice(0, visibleCount);
  const teamPending = (list.data ?? []).filter((r) => r.user_id !== uid && r.status === 'pendiente');
  const updateQuickFilter = (next: Exclude<RequestFilter, 'todas'>) => {
    setFilter((current) => current === next ? 'todas' : next);
    setPeriod((current) => current.status === 'todas' ? current : { ...current, status: 'todas' });
    setVisibleCount(20);
  };
  const updateSearch = (value: string) => {
    setSearch(value);
    setVisibleCount(20);
  };
  const applyAdvancedFilters = (nextPeriod: RequestPeriod, nextSort: RequestSort, nextShowArchived: boolean) => {
    setPeriod(nextPeriod);
    setSort(nextSort);
    setShowArchived(nextShowArchived);
    setVisibleCount(20);
  };
  const openNewRequest = () => {
    setEditRequest(null);
    setDialog(true);
  };
  const closeRequestDialog = () => {
    setDialog(false);
    setEditRequest(null);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 750 }}>
          {t('Tus solicitudes')}
        </Typography>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openNewRequest} sx={{ px: 1.5 }}>
          {t('Solicitar')}
        </Button>
      </Box>

      {list.isLoading && (
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={92} aria-label={t('Cargando solicitudes')} />
          <Skeleton variant="rounded" height={150} />
        </Stack>
      )}

      {list.isError && (
        <Alert
          severity="error"
          role="alert"
          action={<Button color="inherit" size="small" onClick={() => list.refetch()}>{t('Reintentar')}</Button>}
        >
          {t('No se pudieron cargar las solicitudes.')}
        </Alert>
      )}

      {decide.isError && (
        <Alert severity="error" role="alert" sx={{ mb: 1 }}>
          {t('No se pudo actualizar la solicitud. Solo el responsable del equipo puede decidir.')}
        </Alert>
      )}
      {anul.isError && (
        <Alert severity="error" role="alert" sx={{ mb: 1 }}>
          {t('No se pudo cancelar la solicitud. Inténtalo de nuevo.')}
        </Alert>
      )}
      {archive.isError && (
        <Alert severity="error" role="alert" sx={{ mb: 1 }}>
          {t('No se pudo archivar la solicitud. Inténtalo de nuevo.')}
        </Alert>
      )}

      {list.isSuccess && (
        <>
          <Box
            role="group"
            aria-label={`${t('Estadísticas de solicitudes')} · ${t('Resumen anual')} · ${period.year === 'todas' ? t('Todos') : period.year}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto repeat(4, minmax(0, 1fr))',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1 },
              mb: 1.25,
              px: 1,
              py: 0.75,
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: 700 }}>
              {period.year === 'todas' ? t('Todos') : period.year}
            </Typography>
            {([
              ['pendiente', 'Pend.', 'Pendientes', 'warning.main'],
              ['aprobada', 'Apr.', 'Aprobadas', 'success.main'],
              ['rechazada', 'Rech.', 'Rechazadas', 'error.main'],
              ['anulada', 'Anul.', 'Anuladas', 'text.secondary'],
            ] as const).map(([status, label, fullLabel, color]) => (
              <ButtonBase
                key={status}
                type="button"
                aria-label={t(fullLabel)}
                aria-pressed={filter === status}
                onClick={() => updateQuickFilter(status)}
                sx={{
                  minWidth: 0,
                  px: 0.5,
                  py: 0.25,
                  gap: 0.5,
                  borderRadius: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: filter === status ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.selected' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                }}
              >
                <Box component="span" sx={{ color, display: 'flex', fontSize: '0.95rem', fontWeight: 800 }}>
                  {counts[status]}
                </Box>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: 650 }}>
                  {t(label)}
                </Typography>
              </ButtonBase>
            ))}
          </Box>

          <Stack
            role="group"
            aria-label={`${t('Buscar solicitudes...')} · ${t('Filtros')}`}
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', mb: 1.25 }}
          >
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder={t('Buscar solicitudes...')}
              slotProps={{
                htmlInput: { 'aria-label': t('Buscar solicitudes...') },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, minWidth: 0 }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              aria-label={t('Filtros')}
              onClick={() => setFilterDialog(true)}
              sx={{
                flexShrink: 0,
                minWidth: { xs: 38, sm: 0 },
                width: { xs: 40, sm: 'auto' },
                minHeight: 40,
                px: { xs: 0, sm: 1.25 },
                fontSize: '0.8rem',
                textTransform: 'none',
                '& .MuiButton-startIcon': { mx: { xs: 0, sm: -0.5 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {t('Filtros')}
              </Box>
            </Button>
          </Stack>

          {mine.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('Aún no has solicitado vacaciones ni permisos.')}
            </Typography>
          ) : visibleMine.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(showArchived ? 'No hay solicitudes archivadas.' : 'No hay solicitudes que coincidan con los filtros.')}
            </Typography>
          ) : (
            <>
              <Stack spacing={1.5} sx={{ mb: teamPending.length > 0 ? 2.5 : 0 }}>
                {displayedRequests.map((request) => (
                  <RequestRow
                    key={request.id}
                    r={request}
                    own
                    archived={showArchived}
                    onEdit={(selected) => { setEditRequest(selected); setDialog(true); }}
                    onDetails={setDetailsRequest}
                    onCancel={setCancelRequest}
                    onArchive={(selected) => archive.mutate({ request: selected, shouldArchive: true })}
                    onRestore={(selected) => archive.mutate({ request: selected, shouldArchive: false })}
                    pending={anul.isPending || archive.isPending}
                  />
                ))}
              </Stack>
              {displayedRequests.length < visibleMine.length && (
                <Button fullWidth onClick={() => setVisibleCount((count) => count + 20)} sx={{ mb: 2 }}>
                  {t('Cargar más')} ({visibleMine.length - displayedRequests.length})
                </Button>
              )}
            </>
          )}
        </>
      )}

      {teamPending.length > 0 && (
        <>
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700, mt: 1, mb: 0.5 }}>
            {t('Pendientes de tu equipo')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('Al aprobar, la persona recibe una notificación.')}
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {teamPending.map((r) => (
              <RequestRow
                key={r.id}
                r={r}
                own={false}
                onDecide={(id, status) => decide.mutate({ id, status })}
                pending={decide.isPending}
              />
            ))}
          </Stack>
        </>
      )}

      <RequestDialog open={dialog} onClose={closeRequestDialog} request={editRequest} />
      <RequestDetailsDialog request={detailsRequest} onClose={() => setDetailsRequest(null)} />
      <AdvancedFiltersDialog
        open={filterDialog}
        filters={period}
        sort={sort}
        showArchived={showArchived}
        years={years}
        onClose={() => setFilterDialog(false)}
        onApply={applyAdvancedFilters}
      />
      <Dialog open={!!cancelRequest} onClose={() => setCancelRequest(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Cancelar solicitud')}</DialogTitle>
        <DialogContent>
          <Typography>{t('¿Seguro que quieres cancelar esta solicitud?')}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelRequest(null)}>{t('Volver')}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={anul.isPending}
            onClick={() => { if (cancelRequest) anul.mutate(cancelRequest); }}
          >
            {t('Cancelar solicitud')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
