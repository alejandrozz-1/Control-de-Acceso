import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import BlockIcon from '@mui/icons-material/Block';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import PinIcon from '@mui/icons-material/Pin';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import PageLayout from '../../components/ui/PageLayout';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../services/auth';
import { getIntlLocale } from '../../i18n/catalog';
import { useI18n } from '../../i18n/I18nProvider';

interface CredentialRow {
  id: string;
  kind: 'qr' | 'temporal' | 'nfc';
  status: 'activa' | 'revocada' | 'caducada' | string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  user: {
    full_name: string;
    email: string;
    employee_code: string | null;
    role: string;
    center: { name: string } | null;
  } | null;
}

interface CredentialFilters {
  status: string;
  kind: string;
  role: string;
  centerId: string;
  datePreset: string;
  dateFrom: string;
  dateTo: string;
}

interface CredentialStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
}

interface PeopleIds {
  scopeIds: string[];
  matchingIds: string[];
}

const PAGE_SIZE = 10;
const ROW_HEIGHT = 64;
const VISIBLE_ROWS = 20;
const KIND_LABEL: Record<string, string> = { qr: 'QR', temporal: 'Temporal', nfc: 'NFC' };
const STATUS_COLOR: Record<string, 'success' | 'error' | 'default'> = {
  activa: 'success', revocada: 'error', caducada: 'default',
};
const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  responsable: 'Responsable',
  empleado: 'Empleado',
  seguridad: 'Seguridad',
  recursos_humanos: 'Recursos Humanos',
};
const INITIAL_FILTERS: CredentialFilters = {
  status: '', kind: '', role: '', centerId: '', datePreset: '', dateFrom: '', dateTo: '',
};

export function getMatchingKinds(search: string): string[] {
  const term = search.trim().toLocaleLowerCase();
  return Object.entries(KIND_LABEL)
    .filter(([kind, label]) => kind.includes(term) || label.toLocaleLowerCase().includes(term))
    .map(([kind]) => kind);
}

export function isRestorableCredential(credential: Pick<CredentialRow, 'status' | 'expires_at'>, now = new Date()): boolean {
  return credential.status === 'revocada' && (!credential.expires_at || new Date(credential.expires_at) > now);
}

function escapePostgrestValue(value: string): string {
  return value.replace(/[(),%_]/g, ' ').trim();
}

export function dateRange(filters: CredentialFilters): { from?: string; to?: string } {
  if (filters.datePreset === 'custom') {
    return {
      from: filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).toISOString() : undefined,
      to: filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).toISOString() : undefined,
    };
  }
  if (!filters.datePreset) return {};
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (filters.datePreset === 'today') return { from: start.toISOString() };
  start.setDate(start.getDate() - (filters.datePreset === '7days' ? 6 : 29));
  return { from: start.toISOString() };
}

function csvCell(value: string | null | undefined): string {
  return `"${(value ?? '').replaceAll('"', '""')}"`;
}

function downloadCredentials(rows: CredentialRow[], t: (key: string) => string) {
  const columns = ['Nombre', 'Email', 'ID empleado', 'Tipo', 'Estado', 'Centro', 'Fecha'];
  const data = rows.map((row) => [
    row.user?.full_name,
    row.user?.email,
    row.user?.employee_code,
    t(KIND_LABEL[row.kind] ?? row.kind),
    t(row.status),
    row.user?.center?.name,
    new Date(row.created_at).toLocaleString(),
  ]);
  const csv = `\uFEFF${[columns, ...data].map((line) => line.map((value) => csvCell(value)).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'credenciales.csv';
  link.click();
  URL.revokeObjectURL(url);
}

/** Mensaje amable para errores previsibles (RLS/duplicados). */
export function revokeErrorText(m: unknown): string {
  if (!m) return '';
  const s = String(m);
  if (s.includes('row-level security') || s.includes('403')) return 'Solo un administrador o el responsable del equipo puede revocar';
  return 'No se pudo revocar. Inténtalo de nuevo.';
}

/** Gestión de credenciales con filtros del servidor y paginación progresiva. */
export default function AdminCredenciales() {
  const { locale, t } = useI18n();
  const intlLocale = getIntlLocale(locale);
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.session?.user.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmOne, setConfirmOne] = useState<CredentialRow | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CredentialFilters>(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState<CredentialFilters>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState('newest');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listViewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const centers = useQuery({
    queryKey: ['admin-credential-centers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centers').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const restore = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase
        .from('access_credentials')
        .update({ status: 'activa', revoked_at: null, revoked_by: null })
        .in('id', ids)
        .eq('status', 'revocada')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .select('id');
      if (error) throw error;
      if (data.length !== ids.length) throw new Error('Some selected credentials could not be restored');
    },
    onSuccess: (_data, ids) => {
      void qc.invalidateQueries({ queryKey: ['admin-credentials'] });
      void qc.invalidateQueries({ queryKey: ['admin-credential-stats'] });
      setOk(`${ids.length} ${t('credenciales restauradas')}`);
      setSelected(new Set());
      setConfirmRestore(false);
    },
  });

  const needsPeople = Boolean(filters.role || filters.centerId || search.trim());
  const people = useQuery({
    queryKey: ['admin-credential-people', filters.role, filters.centerId, search.trim().toLocaleLowerCase()],
    enabled: needsPeople,
    queryFn: async (): Promise<PeopleIds> => {
      const scopeQuery = supabase.from('profiles').select('id');
      if (filters.role) scopeQuery.eq('role', filters.role as 'admin' | 'responsable' | 'empleado' | 'seguridad' | 'recursos_humanos');
      if (filters.centerId) scopeQuery.eq('center_id', filters.centerId);

      const term = escapePostgrestValue(search);
      const matchingQuery = supabase.from('profiles').select('id');
      if (filters.role) matchingQuery.eq('role', filters.role as 'admin' | 'responsable' | 'empleado' | 'seguridad' | 'recursos_humanos');
      if (filters.centerId) matchingQuery.eq('center_id', filters.centerId);
      if (term) {
        matchingQuery.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,employee_code.ilike.%${term}%`);
      }

      const [scopeResult, matchingResult] = await Promise.all([
        filters.role || filters.centerId ? scopeQuery : Promise.resolve({ data: [], error: null }),
        term ? matchingQuery : Promise.resolve({ data: [], error: null }),
      ]);
      if (scopeResult.error) throw scopeResult.error;
      if (matchingResult.error) throw matchingResult.error;
      return {
        scopeIds: (scopeResult.data ?? []).map((profile) => profile.id),
        matchingIds: (matchingResult.data ?? []).map((profile) => profile.id),
      };
    },
  });

  const peopleReady = !needsPeople || people.isSuccess;
  const profileIds = people.data;
  const list = useInfiniteQuery({
    queryKey: ['admin-credentials', search.trim(), filters, sort],
    enabled: peopleReady,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<{ rows: CredentialRow[]; nextOffset: number | null }> => {
      const term = search.trim();
      const matchingKinds = term ? getMatchingKinds(term) : [];
      const scopeIds = profileIds?.scopeIds ?? [];
      const matchingIds = profileIds?.matchingIds ?? [];
      const hasProfileScope = Boolean(filters.role || filters.centerId);

      if (hasProfileScope && scopeIds.length === 0) return { rows: [], nextOffset: null };
      if (term && matchingIds.length === 0 && matchingKinds.length === 0) return { rows: [], nextOffset: null };

      let query = supabase
        .from('access_credentials')
        .select('id, kind, status, created_at, expires_at, revoked_at, user:profiles!access_credentials_user_id_fkey(full_name, email, employee_code, role, center:centers!profiles_center_id_fkey(name))')
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (filters.status === 'pending') return { rows: [], nextOffset: null };
      if (filters.status) query = query.eq('status', filters.status as 'activa' | 'caducada' | 'revocada');
      if (filters.kind) query = query.eq('kind', filters.kind as 'qr' | 'nfc' | 'temporal');
      if (hasProfileScope) query = query.in('user_id', scopeIds);
      if (term) {
        if (matchingKinds.length && matchingIds.length) {
          query = query.or(`kind.in.(${matchingKinds.join(',')}),user_id.in.(${matchingIds.join(',')})`);
        } else if (matchingKinds.length) {
          query = query.in('kind', matchingKinds as ('qr' | 'nfc' | 'temporal')[]);
        } else {
          query = query.in('user_id', matchingIds);
        }
      }
      const dates = dateRange(filters);
      if (dates.from) query = query.gte('created_at', dates.from);
      if (dates.to) query = query.lte('created_at', dates.to);

      if (sort === 'oldest') query = query.order('created_at', { ascending: true });
      else if (sort === 'nameAsc') query = query.order('full_name', { referencedTable: 'user', ascending: true });
      else if (sort === 'nameDesc') query = query.order('full_name', { referencedTable: 'user', ascending: false });
      else if (sort === 'status') query = query.order('status', { ascending: true });
      else query = query.order('created_at', { ascending: false });
      query = query.order('id', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      const rows = data as unknown as CredentialRow[];
      return {
        rows,
        nextOffset: rows.length === PAGE_SIZE ? pageParam + PAGE_SIZE : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });

  const stats = useQuery({
    queryKey: ['admin-credential-stats'],
    queryFn: async (): Promise<CredentialStats> => {
      const count = (status?: string) => {
        let query = supabase.from('access_credentials').select('id', { count: 'exact', head: true });
        if (status) query = query.eq('status', status as 'activa' | 'caducada' | 'revocada');
        return query;
      };
      const [total, active, expired, revoked] = await Promise.all([
        count(), count('activa'), count('caducada'), count('revocada'),
      ]);
      for (const result of [total, active, expired, revoked]) if (result.error) throw result.error;
      return {
        total: total.count ?? 0,
        active: active.count ?? 0,
        expired: expired.count ?? 0,
        revoked: revoked.count ?? 0,
      };
    },
  });

  const rows = useMemo(() => list.data?.pages.flatMap((page) => page.rows) ?? [], [list.data]);
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 4);
  const visibleEndIndex = Math.min(rows.length, visibleStartIndex + VISIBLE_ROWS);
  const visibleRows = rows.slice(visibleStartIndex, visibleEndIndex);
  const activeSelected = rows.filter((row) => selected.has(row.id) && row.status === 'activa');
  const revokedSelected = rows.filter((row) => selected.has(row.id) && isRestorableCredential(row));
  const fetchNextPage = list.fetchNextPage;
  const hasNextPage = list.hasNextPage;
  const isFetchingNextPage = list.isFetchingNextPage;

  useEffect(() => {
    setSelected(new Set());
  }, [search, filters, sort]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void fetchNextPage();
    }, { root: listViewportRef.current, rootMargin: '240px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const revoke = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('access_credentials')
        .update({ status: 'revocada', revoked_at: new Date().toISOString(), revoked_by: uid })
        .in('id', ids)
        .eq('status', 'activa');
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      void qc.invalidateQueries({ queryKey: ['admin-credentials'] });
      void qc.invalidateQueries({ queryKey: ['admin-credential-stats'] });
      setOk(ids.length > 1 ? `${ids.length} ${t('credenciales revocadas')}` : t('Credencial revocada'));
      setSelected(new Set());
      setConfirmBulk(false);
      setConfirmOne(null);
    },
  });

  const toggle = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectableActive = rows.filter((row) => row.status === 'activa');
  const allSelected = selectableActive.length > 0 && selectableActive.every((row) => selected.has(row.id));

  return (
    <PageLayout title="Credenciales" backTo="/admin">
      {stats.isError && <Alert severity="error" sx={{ mb: 1.5 }}>{t('No se pudieron cargar las estadísticas de credenciales.')}</Alert>}
      <Stack component="div" role="group" sx={{ mb: 1.5, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }} aria-label={t('Estadísticas de credenciales')}>
        <Chip size="small" label={`${stats.data?.total ?? '—'} ${t('credenciales')}`} />
        <Chip size="small" color="success" label={`${stats.data?.active ?? '—'} ${t('activas')}`} />
        <Chip size="small" label={`${stats.data?.expired ?? '—'} ${t('caducadas')}`} />
        <Chip size="small" color="error" label={`${stats.data?.revoked ?? '—'} ${t('revocadas')}`} />
        <Chip size="small" variant="outlined" label={`0 ${t('pendientes')}`} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
        {t('El estado pendiente no está definido para las credenciales en el sistema actual.')}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('Buscar credencial...')}
          slotProps={{
            htmlInput: { 'aria-label': t('Buscar credencial...') },
            input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
          }}
        />
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => { setDraftFilters(filters); setFiltersOpen(true); }}>
          {t('Filtros')}
        </Button>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
          <InputLabel id="credential-sort-label">{t('Ordenar por')}</InputLabel>
          <Select labelId="credential-sort-label" value={sort} label={t('Ordenar por')} onChange={(event) => setSort(event.target.value)}>
            <MenuItem value="newest">{t('Más recientes')}</MenuItem>
            <MenuItem value="oldest">{t('Más antiguas')}</MenuItem>
            <MenuItem value="nameAsc">{t('Nombre A-Z')}</MenuItem>
            <MenuItem value="nameDesc">{t('Nombre Z-A')}</MenuItem>
            <MenuItem value="status">{t('Estado')}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {ok && <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setOk(null)}>{ok}</Alert>}
      {revoke.isError && <Alert severity="error" role="alert" sx={{ mb: 1.5 }}>{t(revokeErrorText(revoke.error))}</Alert>}
      {restore.isError && <Alert severity="error" role="alert" sx={{ mb: 1.5 }}>{t('No se pudieron restaurar las credenciales. Inténtalo de nuevo.')}</Alert>}
      {centers.isError && <Alert severity="error" sx={{ mb: 1.5 }}>{t('No se pudieron cargar los centros.')}</Alert>}
      {people.isError && <Alert severity="error" sx={{ mb: 1.5 }}>{t('No se pudieron aplicar los filtros de credenciales.')}</Alert>}

      {(list.isLoading || (needsPeople && people.isLoading)) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {[0, 1, 2].map((index) => <Skeleton key={index} variant="rounded" height={54} aria-label={`${t('Cargando credencial')} ${index + 1}`} />)}
        </Box>
      )}
      {list.isError && (
        <Alert severity="error" role="alert" action={<Button color="inherit" size="small" onClick={() => void list.refetch()}>{t('Reintentar')}</Button>}>
          {t('No se pudieron cargar las credenciales.')}
        </Alert>
      )}
      {list.isSuccess && rows.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <QrCodeIcon sx={{ fontSize: 44, opacity: 0.4 }} />
          <Typography variant="body2" sx={{ mt: 1 }}>{search || Object.values(filters).some(Boolean) ? t('No hay credenciales que coincidan con los filtros.') : t('Aún no se ha emitido ninguna credencial.')}</Typography>
        </Box>
      )}

      {rows.length > 0 && (
        <Paper variant="outlined" sx={{ mb: 2 }}>
          <Box sx={{ px: 1.5, py: 0.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={selectableActive.some((row) => selected.has(row.id)) && !allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(selectableActive.map((row) => row.id)))}
              slotProps={{ input: { 'aria-label': t('Seleccionar todas las credenciales activas cargadas') } }}
            />
            <Typography variant="caption" color="text.secondary">
              {t('Mostrando')} {rows.length}{stats.data ? ` ${t('de')} ${stats.data.total}` : ''} {t('credenciales')}
            </Typography>
          </Box>
          <Box
            ref={listViewportRef}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            sx={{ maxHeight: '65vh', overflowY: 'auto', overscrollBehavior: 'contain' }}
          >
          <List disablePadding>
            {visibleStartIndex > 0 && <ListItem disablePadding sx={{ height: visibleStartIndex * ROW_HEIGHT }} />}
            {visibleRows.map((row) => {
              const isActive = row.status === 'activa';
              const isSelected = selected.has(row.id);
              return (
                <ListItem
                  key={row.id}
                  disablePadding
                  secondaryAction={
                    isActive ? (
                      <IconButton
                        size="small"
                        aria-label={`${t('Revocar credencial de')} ${row.user?.full_name ?? ''}`}
                        color="error"
                        onClick={() => setConfirmOne(row)}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    ) : undefined
                  }
                  sx={{ height: ROW_HEIGHT, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <ListItemButton onClick={() => toggle(row.id)} sx={{ py: 0.25, pl: 1, pr: isActive ? 7 : 1, height: ROW_HEIGHT, boxSizing: 'border-box' }}>
                    <ListItemIcon sx={{ minWidth: 34 }}>
                      <Checkbox
                        edge="start"
                        size="small"
                        checked={isSelected}
                        tabIndex={-1}
                        disableRipple
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggle(row.id)}
                        slotProps={{ input: { 'aria-label': `${t('Seleccionar credencial de')} ${row.user?.full_name ?? ''}` } }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: 0.75, overflow: 'hidden' }}>
                          {row.kind === 'temporal' ? <PinIcon sx={{ fontSize: 14 }} /> : <QrCodeIcon sx={{ fontSize: 14 }} />}
                          <Typography variant="body2" noWrap sx={{ fontWeight: 600, maxWidth: { xs: 140, sm: 220 } }}>{row.user?.full_name ?? '—'}</Typography>
                          <Chip size="small" label={t(KIND_LABEL[row.kind] ?? row.kind)} variant="outlined" sx={{ height: 19, fontSize: '0.65rem' }} />
                          <Chip size="small" color={STATUS_COLOR[row.status] ?? 'default'} label={t(row.status)} sx={{ height: 19, fontSize: '0.65rem' }} />
                        </Stack>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.user?.email ?? '—'}
                          {row.user?.employee_code && ` · ${row.user.employee_code}`}
                          {row.user?.center?.name && ` · ${row.user.center.name}`}
                          {' · '}{new Date(row.created_at).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
            {visibleEndIndex < rows.length && <ListItem disablePadding sx={{ height: (rows.length - visibleEndIndex) * ROW_HEIGHT }} />}
          </List>
          <Box ref={sentinelRef} sx={{ height: 1 }} />
          </Box>
        </Paper>
      )}

      {isFetchingNextPage && (
        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, py: 1.5, justifyContent: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">{t('Cargando más credenciales...')}</Typography>
        </Stack>
      )}

      {selected.size > 0 && (
        <Paper
          role="region"
          aria-label={t('Acciones sobre la selección')}
          sx={{
            position: 'sticky', bottom: 80, zIndex: 5, display: 'flex', gap: 1, p: 1.25, mt: 1,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)', alignItems: 'center', flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>{selected.size} {t('credenciales seleccionadas')}</Typography>
          <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadCredentials(rows.filter((row) => selected.has(row.id)), t)}>
            {t('Exportar')}
          </Button>
          <Button size="small" color="error" variant="contained" startIcon={<BlockIcon />} disabled={activeSelected.length === 0} onClick={() => setConfirmBulk(true)}>
            {t('Revocar seleccionadas')}
          </Button>
          <Button size="small" variant="outlined" disabled={revokedSelected.length === 0} onClick={() => setConfirmRestore(true)}>
            {t('Restaurar seleccionadas')}
          </Button>
          <IconButton size="small" aria-label={t('Cancelar selección')} onClick={() => setSelected(new Set())}><CloseIcon fontSize="small" /></IconButton>
        </Paper>
      )}

      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Filtros')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="credential-status-label">{t('Estado')}</InputLabel>
              <Select labelId="credential-status-label" value={draftFilters.status} label={t('Estado')} onChange={(event) => setDraftFilters({ ...draftFilters, status: event.target.value })}>
                <MenuItem value="">{t('Todas')}</MenuItem>
                <MenuItem value="activa">{t('Activas')}</MenuItem>
                <MenuItem value="caducada">{t('Caducadas')}</MenuItem>
                <MenuItem value="revocada">{t('Revocadas')}</MenuItem>
                <MenuItem value="pending">{t('Pendientes')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="credential-kind-label">{t('Tipo')}</InputLabel>
              <Select labelId="credential-kind-label" value={draftFilters.kind} label={t('Tipo')} onChange={(event) => setDraftFilters({ ...draftFilters, kind: event.target.value })}>
                <MenuItem value="">{t('Todos')}</MenuItem>
                <MenuItem value="qr">QR</MenuItem>
                <MenuItem value="nfc">NFC</MenuItem>
                <MenuItem value="temporal">{t('Temporal')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="credential-role-label">{t('Rol')}</InputLabel>
              <Select labelId="credential-role-label" value={draftFilters.role} label={t('Rol')} onChange={(event) => setDraftFilters({ ...draftFilters, role: event.target.value })}>
                <MenuItem value="">{t('Todos')}</MenuItem>
                {Object.entries(ROLE_LABEL).map(([value, label]) => <MenuItem key={value} value={value}>{t(label)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="credential-center-label">{t('Centro')}</InputLabel>
              <Select labelId="credential-center-label" value={draftFilters.centerId} label={t('Centro')} onChange={(event) => setDraftFilters({ ...draftFilters, centerId: event.target.value })}>
                <MenuItem value="">{t('Todos')}</MenuItem>
                {(centers.data ?? []).map((center) => <MenuItem key={center.id} value={center.id}>{center.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="credential-date-label">{t('Fecha de creación')}</InputLabel>
              <Select labelId="credential-date-label" value={draftFilters.datePreset} label={t('Fecha de creación')} onChange={(event) => setDraftFilters({ ...draftFilters, datePreset: event.target.value })}>
                <MenuItem value="">{t('Cualquier fecha')}</MenuItem>
                <MenuItem value="today">{t('Hoy')}</MenuItem>
                <MenuItem value="7days">{t('Últimos 7 días')}</MenuItem>
                <MenuItem value="30days">{t('Últimos 30 días')}</MenuItem>
                <MenuItem value="custom">{t('Personalizado')}</MenuItem>
              </Select>
            </FormControl>
            {draftFilters.datePreset === 'custom' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField type="date" size="small" fullWidth label={t('Desde')} value={draftFilters.dateFrom} onChange={(event) => setDraftFilters({ ...draftFilters, dateFrom: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField type="date" size="small" fullWidth label={t('Hasta')} value={draftFilters.dateTo} onChange={(event) => setDraftFilters({ ...draftFilters, dateTo: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDraftFilters(INITIAL_FILTERS)}>{t('Limpiar')}</Button>
          <Button onClick={() => setFiltersOpen(false)}>{t('Cancelar')}</Button>
          <Button variant="contained" onClick={() => { setFilters(draftFilters); setFiltersOpen(false); }}>{t('Aplicar filtros')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmRestore} onClose={() => setConfirmRestore(false)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Restaurar credenciales')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('¿Desea restaurar las {count} credenciales seleccionadas?').replace('{count}', String(revokedSelected.length))}
            {' '}{t('Solo se restaurarán credenciales revocadas cuya fecha de vigencia no haya expirado.')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmRestore(false)}>{t('Cancelar')}</Button>
          <Button variant="contained" disabled={restore.isPending} onClick={() => restore.mutate(revokedSelected.map((row) => row.id))}>
            {t('Restaurar')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmBulk} onClose={() => setConfirmBulk(false)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Revocar seleccionadas')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('¿Desea revocar las {count} credenciales seleccionadas?').replace('{count}', String(activeSelected.length))}
            {' '}{t('Dejarán de funcionar al instante (el QR caduca en cuanto se revoca). Las personas afectadas recibirán una notificación.')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmBulk(false)}>{t('Cancelar')}</Button>
          <Button color="error" variant="contained" disabled={revoke.isPending} onClick={() => revoke.mutate(activeSelected.map((row) => row.id))}>
            {t('Confirmar')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmOne} onClose={() => setConfirmOne(null)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Revocar credencial')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('{name} dejará de poder usar su {kind} al instante y recibirá una notificación.')
              .replace('{name}', confirmOne?.user?.full_name ?? '')
              .replace('{kind}', t(KIND_LABEL[confirmOne?.kind ?? 'qr']))}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOne(null)}>{t('Cancelar')}</Button>
          <Button color="error" variant="contained" disabled={revoke.isPending} onClick={() => confirmOne && revoke.mutate([confirmOne.id])}>
            {t('Revocar')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
