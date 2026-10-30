import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventIcon from '@mui/icons-material/Event';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { brand } from '../app/theme';
import PageLayout from '../components/ui/PageLayout';
import VacacionesPanel from '../components/ui/VacacionesPanel';
import { useAuthStore } from '../services/auth';
import { supabase } from '../services/supabase';

/** Colores por código de turno (M mañana, T tarde, N noche, L libre). */
export const SHIFT_COLORS: Record<string, string> = {
  M: '#FF8200',
  T: brand.blue,
  N: '#7C3AED',
  L: '#94A3B8',
};

const DAY_MS = 86_400_000;

type ISODate = string; // 'YYYY-MM-DD'

/** Matriz de semanas (lunes primero) de un mes, con fechas ISO de cada celda. */
export function monthWeeks(year: number, month: number): ISODate[][] {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const start = new Date(first.getTime() - offset * DAY_MS);
  const weeks: ISODate[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: ISODate[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor.toISOString().slice(0, 10));
      cursor.setTime(cursor.getTime() + DAY_MS);
    }
    weeks.push(week);
  }
  return weeks;
}

interface DayData {
  shift?: { code: string; start_time: string | null; end_time: string | null; overnight: boolean };
  holidays: string[];
  events: { title: string; all_day: boolean; starts_at: string }[];
  vacations: { type: string; status: string; start_date: string; end_date: string }[];
}

const SHIFT_LABEL: Record<string, string> = { M: 'Mañana', T: 'Tarde', N: 'Noche', L: 'Libre' };

function iso(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

/** Calendario mobile-first: mes con turnos, festivos, eventos y vacaciones del usuario. */
export default function Calendario() {
  const { profile } = useAuthStore();
  const today = iso(new Date());
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selected, setSelected] = useState<ISODate>(today);

  const monthStart = iso(new Date(Date.UTC(cursor.year, cursor.month, 1)));
  const monthEnd = iso(new Date(Date.UTC(cursor.year, cursor.month + 1, 1) - DAY_MS));

  const shiftsQuery = useQuery({
    queryKey: ['cal-shifts', profile?.id, monthStart],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_entries')
        .select('date, code, start_time, end_time, overnight')
        .eq('user_id', profile!.id)
        .gte('date', monthStart)
        .lte('date', monthEnd);
      if (error) throw error;
      return data as { date: string; code: string; start_time: string | null; end_time: string | null; overnight: boolean }[];
    },
  });

  const centerQuery = useQuery({
    queryKey: ['cal-center', profile?.center_id],
    enabled: !!profile?.center_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centers')
        .select('comunidad')
        .eq('id', profile!.center_id!)
        .maybeSingle();
      if (error) throw error;
      return data as { comunidad: string | null } | null;
    },
  });
  const comunidad = centerQuery.data?.comunidad ?? null;

  const holidaysQuery = useQuery({
    queryKey: ['cal-holidays', monthStart, comunidad],
    enabled: !centerQuery.isLoading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('name, date, scope, comunidad')
        .gte('date', monthStart)
        .lte('date', monthEnd);
      if (error) throw error;
      return (data as { name: string; date: string; scope: string; comunidad: string | null }[]).filter(
        (h) => h.scope === 'nacional' || (h.scope === 'comunidad' && h.comunidad === comunidad),
      );
    },
  });

  const eventsQuery = useQuery({
    queryKey: ['cal-events', monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_events')
        .select('title, starts_at, ends_at, all_day')
        .lte('starts_at', `${monthEnd}T23:59:59`)
        .gte('ends_at', `${monthStart}T00:00:00`)
        .order('starts_at');
      if (error) throw error;
      return data as { title: string; starts_at: string; ends_at: string; all_day: boolean }[];
    },
  });

  const vacationsQuery = useQuery({
    queryKey: ['cal-vacations', profile?.id, monthStart],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select('type, status, start_date, end_date')
        .eq('user_id', profile!.id)
        .lte('start_date', monthEnd)
        .gte('end_date', monthStart);
      if (error) throw error;
      return data as { type: string; status: string; start_date: string; end_date: string }[];
    },
  });

  const isLoading =
    centerQuery.isLoading ||
    shiftsQuery.isLoading || holidaysQuery.isLoading || eventsQuery.isLoading || vacationsQuery.isLoading;
  const isError = centerQuery.isError || shiftsQuery.isError || holidaysQuery.isError || eventsQuery.isError || vacationsQuery.isError;

  const byDate = new Map<ISODate, DayData>();
  const put = (date: ISODate) => {
    if (!byDate.has(date)) byDate.set(date, { holidays: [], events: [], vacations: [] });
    return byDate.get(date)!;
  };
  for (const s of shiftsQuery.data ?? []) put(s.date).shift = s;
  for (const h of holidaysQuery.data ?? []) put(h.date).holidays.push(h.name);
  for (const v of vacationsQuery.data ?? []) {
    const from = Math.max(Date.parse(v.start_date), Date.parse(monthStart));
    const to = Math.min(Date.parse(v.end_date), Date.parse(monthEnd));
    for (let t = from; t <= to; t += DAY_MS) put(iso(new Date(t))).vacations.push(v);
  }
  for (const e of eventsQuery.data ?? []) {
    const from = Math.max(Date.parse(e.starts_at.slice(0, 10)), Date.parse(monthStart));
    const to = Math.min(Date.parse(e.ends_at.slice(0, 10)), Date.parse(monthEnd));
    for (let t = from; t <= to; t += DAY_MS)
      put(iso(new Date(t))).events.push({ title: e.title, all_day: e.all_day, starts_at: e.starts_at });
  }

  const monthLabel = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
    setCursor({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
  };

  const sel = byDate.get(selected);
  const selLabel = new Date(`${selected}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <PageLayout title="Calendario">
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5, mb: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        {/* Navegación de mes */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton size="small" aria-label="Mes anterior" onClick={() => shiftMonth(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, '&::first-letter': { textTransform: 'uppercase' } }} aria-live="polite">
            {monthLabel}
          </Typography>
          <IconButton size="small" aria-label="Mes siguiente" onClick={() => shiftMonth(1)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Cabecera de días */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
            <Typography
              key={d}
              variant="caption"
              align="center"
              sx={{ fontWeight: 700, color: i > 4 ? 'text.secondary' : 'primary', opacity: 0.8 }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        {isLoading && (
          <Skeleton variant="rectangular" height={260} aria-label="Cargando calendario" sx={{ borderRadius: 2 }} />
        )}

        {isError && (
          <Alert
            severity="error"
            role="alert"
            action={
              <Button color="inherit" size="small" onClick={() => { shiftsQuery.refetch(); holidaysQuery.refetch(); eventsQuery.refetch(); vacationsQuery.refetch(); }}>
                Reintentar
              </Button>
            }
          >
            No se pudo cargar el calendario.
          </Alert>
        )}

        {/* Rejilla del mes */}
        {!isLoading && !isError && (
          <Box role="grid" aria-label={`Turnos de ${monthLabel}`}>
            {monthWeeks(cursor.year, cursor.month).map((week, wi) => (
              <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {week.map((date) => {
                  const inMonth = date.startsWith(`${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`);
                  const day = byDate.get(date);
                  const isToday = date === today;
                  const isSelected = date === selected;
                  return (
                    <Box
                      key={date}
                      role="gridcell"
                      component="button"
                      type="button"
                      aria-label={`${date}${day?.shift ? `, turno ${SHIFT_LABEL[day.shift.code] ?? day.shift.code}` : ''}`}
                      aria-selected={isSelected}
                      onClick={() => setSelected(date)}
                      sx={{
                        border: 'none',
                        cursor: 'pointer',
                        py: 0.75,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.4,
                        minWidth: 0,
                        bgcolor: isSelected ? 'primary.main' : 'transparent',
                        color: isSelected ? 'primary.contrastText' : inMonth ? 'text.primary' : 'text.disabled',
                        opacity: inMonth ? 1 : 0.45,
                        boxShadow: isToday && !isSelected ? `inset 0 0 0 1.5px ${brand.orange}` : undefined,
                        transition: 'background-color 0.15s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: isToday || isSelected ? 800 : 500, lineHeight: 1.1 }}>
                        {Number(date.slice(8))}
                      </Typography>
                      {/* Punto de turno + marcadores */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, height: 14 }}>
                        {day?.shift && (
                          <Box
                            component="span"
                            aria-hidden
                            sx={{
                              width: day.shift.code === 'L' ? 6 : 8,
                              height: day.shift.code === 'L' ? 6 : 8,
                              borderRadius: '50%',
                              bgcolor: isSelected ? brand.white : SHIFT_COLORS[day.shift.code],
                              opacity: day.shift.code === 'L' ? 0.7 : 1,
                            }}
                          />
                        )}
                        {day?.holidays.length ? (
                          <HolidayVillageIcon aria-hidden sx={{ fontSize: 12, color: isSelected ? brand.white : 'text.secondary' }} />
                        ) : null}
                        {day?.vacations.some((v) => v.status === 'aprobada') ? (
                          <BeachAccessIcon aria-hidden sx={{ fontSize: 12, color: isSelected ? brand.white : 'text.secondary' }} />
                        ) : null}
                        {day?.events.length ? (
                          <EventIcon aria-hidden sx={{ fontSize: 12, color: isSelected ? brand.white : 'text.secondary' }} />
                        ) : null}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        )}

        {/* Leyenda */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25, justifyContent: 'center' }}>
          {(['M', 'T', 'N', 'L'] as const).map((code) => (
            <Chip
              key={code}
              size="small"
              variant="outlined"
              label={SHIFT_LABEL[code]}
              sx={{ height: 24, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }}
              icon={
                <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: SHIFT_COLORS[code], ml: '6px !important' }} />
              }
            />
          ))}
          <Chip size="small" variant="outlined" label="Festivo" sx={{ height: 24, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }} icon={<HolidayVillageIcon sx={{ fontSize: 14, color: 'text.secondary !important' }} />} />
          <Chip size="small" variant="outlined" label="Vacaciones" sx={{ height: 24, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }} icon={<BeachAccessIcon sx={{ fontSize: 14, color: 'text.secondary !important' }} />} />
          <Chip size="small" variant="outlined" label="Evento" sx={{ height: 24, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }} icon={<EventIcon sx={{ fontSize: 14, color: 'text.secondary !important' }} />} />
        </Box>
      </Paper>

      {/* Detalle del día seleccionado */}
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }} aria-live="polite">
        <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700, '&::first-letter': { textTransform: 'uppercase' }, mb: 1.5 }}>
          {selLabel}
        </Typography>

        {!sel && (
          <Typography variant="body2" color="text.secondary">
            Sin datos para este día: no tienes turno asignado ni eventos.
          </Typography>
        )}

        {sel?.shift && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: sel.holidays.length || sel.vacations.length || sel.events.length ? 1.5 : 0 }}>
            <Box aria-hidden sx={{ width: 10, height: 36, borderRadius: 5, bgcolor: SHIFT_COLORS[sel.shift.code] }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {SHIFT_LABEL[sel.shift.code] ?? sel.shift.code}
              </Typography>
              {sel.shift.code !== 'L' && sel.shift.start_time && (
                <Typography variant="body2" color="text.secondary">
                  {sel.shift.start_time.slice(0, 5)}–{sel.shift.end_time?.slice(0, 5)}
                </Typography>
              )}
              {sel.shift.overnight && (
                <Typography variant="caption" color="text.secondary">
                  Turno de noche (termina al día siguiente)
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {sel?.holidays.map((name) => (
          <Typography key={name} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <HolidayVillageIcon sx={{ fontSize: 16 }} /> Festivo: {name}
          </Typography>
        ))}

        {sel?.vacations.map((v, i) => (
          <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BeachAccessIcon sx={{ fontSize: 16 }} />
            {v.type === 'vacacion' ? 'Vacaciones' : 'Permiso'} ({v.status})
          </Typography>
        ))}

        {sel?.events.map((e) => (
          <Typography key={e.title} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <EventIcon sx={{ fontSize: 16 }} />
            {e.title}
            {!e.all_day && (
              <Typography component="span" variant="caption" color="text.secondary">
                {new Date(e.starts_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
          </Typography>
        ))}
      </Paper>

      {/* Solicitud y aprobación de vacaciones (T-016) */}
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <VacacionesPanel />
      </Paper>
    </PageLayout>
  );
}
