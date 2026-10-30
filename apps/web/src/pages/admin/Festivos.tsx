import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { brand } from '../../app/theme';
import PageLayout from '../../components/ui/PageLayout';
import { supabase } from '../../services/supabase';
import { getIntlLocale } from '../../i18n/catalog';
import { useI18n } from '../../i18n/I18nProvider';

interface HolidayRow { id: string; name: string; date: string; scope: string; comunidad: string | null }
interface EventRow { id: string; title: string; description: string | null; starts_at: string; ends_at: string | null; all_day: boolean }

const SCOPE_LABEL: Record<string, string> = { nacional: 'Nacional', comunidad: 'Comunidad', centro: 'Centro' };

/** Normaliza el formulario de festivo: comunidad solo si aplica, en minúsculas. */
export function buildHoliday(input: { name: string; date: string; scope: string; comunidad: string }) {
  const name = input.name.trim();
  const date = input.date;
  const valid = !!name && /^\d{4}-\d{2}-\d{2}$/.test(date);
  return {
    valid,
    row: {
      name,
      date,
      scope: input.scope,
      comunidad: input.scope === 'comunidad' ? input.comunidad.trim().toLowerCase() || null : null,
    },
  };
}

/** Construye los timestamps de un evento (all_day guarda medianoche UTC; con hora convierte local→ISO). */
export function buildEvent(input: { title: string; allDay: boolean; date: string; start: string; end: string; description: string }) {
  const title = input.title.trim();
  if (!title || !input.date) return { valid: false as const };
  if (input.allDay) {
    return {
      valid: true as const,
      row: {
        title,
        description: input.description.trim() || null,
        starts_at: `${input.date}T00:00:00.000Z`,
        ends_at: null,
        all_day: true,
      },
    };
  }
  if (!input.start) return { valid: false as const };
  const starts_at = new Date(`${input.date}T${input.start}`).toISOString();
  const ends_at = input.end ? new Date(`${input.date}T${input.end}`).toISOString() : null;
  if (ends_at && ends_at < starts_at) return { valid: false as const };
  return {
    valid: true as const,
    row: { title, description: input.description.trim() || null, starts_at, ends_at, all_day: false },
  };
}

function EmptyState({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
      {icon}
      <Typography variant="body2" sx={{ mt: 1 }}>{children}</Typography>
    </Box>
  );
}

/** T-014: alta/baja de festivos y eventos corporativos (RLS admin-only ya existente). */
export default function AdminFestivos() {
  const { locale, t } = useI18n();
  const intlLocale = getIntlLocale(locale);
  const qc = useQueryClient();
  const [hDialog, setHDialog] = useState(false);
  const [eDialog, setEDialog] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: 'holiday' | 'event'; id: string; label: string } | null>(null);

  // form festivo
  const [hName, setHName] = useState('');
  const [hDate, setHDate] = useState('');
  const [hScope, setHScope] = useState('nacional');
  const [hCom, setHCom] = useState('');
  // form evento
  const [eTitle, setETitle] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eAllDay, setEAllDay] = useState(true);
  const [eDate, setEDate] = useState('');
  const [eStart, setEStart] = useState('09:00');
  const [eEnd, setEEnd] = useState('');

  const holidays = useQuery({
    queryKey: ['admin-holidays'],
    queryFn: async (): Promise<HolidayRow[]> => {
      const { data, error } = await supabase.from('holidays').select('id, name, date, scope, comunidad').order('date');
      if (error) throw error;
      return data as HolidayRow[];
    },
  });

  const events = useQuery({
    queryKey: ['admin-events'],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from('corporate_events')
        .select('id, title, description, starts_at, ends_at, all_day')
        .order('starts_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-holidays'] });
    void qc.invalidateQueries({ queryKey: ['admin-events'] });
    void qc.invalidateQueries({ queryKey: ['cal-holidays'] });
    void qc.invalidateQueries({ queryKey: ['cal-events'] });
  };

  const createHoliday = useMutation({
    mutationFn: async (row: ReturnType<typeof buildHoliday>['row']) => {
      const { error } = await supabase.from('holidays').insert(row);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setHDialog(false); setHName(''); setHDate(''); setHCom(''); },
  });

  const createEvent = useMutation({
    mutationFn: async (row: NonNullable<ReturnType<typeof buildEvent>['row']>) => {
      const { error } = await supabase.from('corporate_events').insert(row);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setEDialog(false); setETitle(''); setEDesc(''); setEDate(''); },
  });

  const remove = useMutation({
    mutationFn: async ({ kind, id }: { kind: 'holiday' | 'event'; id: string }) => {
      const table = kind === 'holiday' ? 'holidays' : 'corporate_events';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setConfirm(null); },
  });

  const onHolidaySubmit = (e: FormEvent) => {
    e.preventDefault();
    const built = buildHoliday({ name: hName, date: hDate, scope: hScope, comunidad: hCom });
    if (built.valid) createHoliday.mutate(built.row);
  };

  const onEventSubmit = (e: FormEvent) => {
    e.preventDefault();
    const built = buildEvent({ title: eTitle, allDay: eAllDay, date: eDate, start: eStart, end: eEnd, description: eDesc });
    if (built.valid) createEvent.mutate(built.row);
  };

  const errText = (m: unknown) => {
    if (!m) return null;
    const s = String(m);
    if (s.includes('row-level security') || s.includes('403')) return t('Solo un administrador puede modificar estos datos');
    if (s.includes('duplicate') || s.includes('23505')) return t('Ese registro ya existe');
    return t('No se pudo guardar. Inténtalo de nuevo.');
  };

  return (
    <PageLayout title="Festivos y eventos" phase="Fase 3 · admin">
      {createHoliday.isError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{errText(createHoliday.error)}</Alert>}
      {createEvent.isError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{errText(createEvent.error)}</Alert>}
      {remove.isError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{errText(remove.error)}</Alert>}

      {/* Festivos */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HolidayVillageIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700 }}>{t('Festivos')}</Typography>
          </Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setHDialog(true)}>{t('Añadir')}</Button>
        </Box>

        {holidays.isLoading && <Skeleton variant="rounded" height={72} aria-label={t('Cargando festivos')} />}
        {holidays.isError && (
          <Alert severity="error" role="alert" action={<Button color="inherit" size="small" onClick={() => holidays.refetch()}>{t('Reintentar')}</Button>}>
            {t('No se pudo cargar la lista de festivos.')}
          </Alert>
        )}
        {holidays.isSuccess && holidays.data.length === 0 && (
          <EmptyState icon={<HolidayVillageIcon sx={{ fontSize: 40, opacity: 0.4 }} />}>{t('No hay festivos configurados.')}</EmptyState>
        )}
        {(holidays.data ?? []).map((h) => (
          <Box key={h.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, fontWeight: 500 }}>{h.name}</Typography>
            <Chip
              size="small"
              label={h.comunidad ? `${t(SCOPE_LABEL[h.scope] ?? h.scope)} · ${h.comunidad}` : t(SCOPE_LABEL[h.scope] ?? h.scope)}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.68rem', flexShrink: 0 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {new Date(`${h.date}T12:00:00`).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short', year: '2-digit' })}
            </Typography>
            <IconButton size="small" aria-label={`${t('Eliminar festivo')} ${h.name}`} onClick={() => setConfirm({ kind: 'holiday', id: h.id, label: h.name })}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Paper>

      {/* Eventos corporativos */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon fontSize="small" sx={{ color: brand.orange }} />
            <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700 }}>{t('Eventos corporativos')}</Typography>
          </Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setEDialog(true)}>{t('Añadir')}</Button>
        </Box>

        {events.isLoading && <Skeleton variant="rounded" height={72} aria-label={t('Cargando eventos')} />}
        {events.isError && (
          <Alert severity="error" role="alert" action={<Button color="inherit" size="small" onClick={() => events.refetch()}>{t('Reintentar')}</Button>}>
            {t('No se pudieron cargar los eventos.')}
          </Alert>
        )}
        {events.isSuccess && events.data.length === 0 && (
          <EmptyState icon={<EventIcon sx={{ fontSize: 40, opacity: 0.4 }} />}>{t('No hay eventos corporativos.')}</EmptyState>
        )}
        {(events.data ?? []).map((ev) => (
          <Box key={ev.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{ev.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(ev.starts_at).toLocaleString(intlLocale, { day: 'numeric', month: 'short', year: '2-digit', hour: ev.all_day ? undefined : '2-digit', minute: ev.all_day ? undefined : '2-digit' })}
                {ev.all_day ? ` · ${t('todo el día')}` : ''}
              </Typography>
            </Box>
            <IconButton size="small" aria-label={`${t('Eliminar evento')} ${ev.title}`} onClick={() => setConfirm({ kind: 'event', id: ev.id, label: ev.title })}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Paper>

      {/* Alta festivo */}
      <Dialog open={hDialog} onClose={() => setHDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Nuevo festivo')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField label={t('Nombre')} value={hName} onChange={(e) => setHName(e.target.value)} size="small" required />
          <TextField label={t('Fecha')} type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} size="small" required
            slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label={t('Ámbito')} select value={hScope} onChange={(e) => setHScope(e.target.value)} size="small">
            <MenuItem value="nacional">{t('Nacional')}</MenuItem>
            <MenuItem value="comunidad">{t('Comunidad')}</MenuItem>
            <MenuItem value="centro">{t('Centro')}</MenuItem>
          </TextField>
          {hScope === 'comunidad' && (
            <TextField label={t('Comunidad (ej. madrid)')} value={hCom} onChange={(e) => setHCom(e.target.value)} size="small" />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setHDialog(false)}>{t('Cancelar')}</Button>
          <Button variant="contained" disabled={!hName.trim() || !hDate || createHoliday.isPending} onClick={onHolidaySubmit}>
            {t('Guardar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alta evento */}
      <Dialog open={eDialog} onClose={() => setEDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Nuevo evento')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField label={t('Título')} value={eTitle} onChange={(e) => setETitle(e.target.value)} size="small" required />
          <TextField label={t('Descripción (opcional)')} value={eDesc} onChange={(e) => setEDesc(e.target.value)} size="small" multiline minRows={2} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch checked={eAllDay} onChange={(e) => setEAllDay(e.target.checked)} slotProps={{ input: { 'aria-label': t('Todo el día') } }} />
            <Typography variant="body2">{t('Todo el día')}</Typography>
          </Box>
          <TextField label={t('Fecha')} type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} size="small" required
            slotProps={{ inputLabel: { shrink: true } }} />
          {!eAllDay && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label={t('Inicio')} type="time" value={eStart} onChange={(e) => setEStart(e.target.value)} size="small" fullWidth
                slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label={t('Fin (opcional)')} type="time" value={eEnd} onChange={(e) => setEEnd(e.target.value)} size="small" fullWidth
                slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEDialog(false)}>{t('Cancelar')}</Button>
          <Button variant="contained" disabled={!eTitle.trim() || !eDate || createEvent.isPending} onClick={onEventSubmit}>
            {t('Guardar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('¿Eliminar?')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('Se eliminará «{item}». Esta acción queda registrada en la auditoría.').replace('{item}', confirm?.label ?? '')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)}>{t('Cancelar')}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={remove.isPending}
            onClick={() => confirm && remove.mutate({ kind: confirm.kind, id: confirm.id })}
          >
            {t('Eliminar')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
