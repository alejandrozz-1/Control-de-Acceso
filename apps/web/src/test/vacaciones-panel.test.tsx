import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AppProviders } from '../app/providers';
import VacacionesPanel from '../components/ui/VacacionesPanel';
import { useAuthStore } from '../services/auth';

const mockState = vi.hoisted(() => ({
  userId: 'employee-test',
  rangeCalls: 0,
  requests: [
    {
      id: 'pending-request',
      type: 'vacacion',
      start_date: '2026-07-27',
      end_date: '2026-08-05',
      days: 10,
      status: 'pendiente',
      reason: 'Vacaciones de verano',
      created_at: '2026-06-01T10:00:00Z',
      archived_at: null,
    },
    {
      id: 'approved-request',
      type: 'baja',
      start_date: '2026-11-18',
      end_date: '2026-11-20',
      days: 3,
      status: 'aprobada',
      reason: 'Recuperación',
      created_at: '2026-11-01T10:00:00Z',
      archived_at: null,
    },
    {
      id: 'rejected-request',
      type: 'permiso',
      start_date: '2026-12-01',
      end_date: '2026-12-01',
      days: 1,
      status: 'rechazada',
      reason: null,
      created_at: '2026-11-02T10:00:00Z',
      archived_at: null,
    },
    {
      id: 'cancelled-request',
      type: 'permiso',
      start_date: '2025-12-01',
      end_date: '2025-12-01',
      days: 1,
      status: 'anulada',
      reason: 'Cita aplazada',
      created_at: '2025-11-02T10:00:00Z',
      archived_at: null,
    },
  ],
}));

vi.mock('../services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          range: async (from: number, to: number) => {
            mockState.rangeCalls += 1;
            return {
              data: mockState.requests.slice(from, to + 1).map((request) => ({
                ...request,
                user_id: mockState.userId,
              })),
              error: null,
            };
          },
        }),
      }),
      update: (values: Record<string, unknown>) => {
        const filters: Record<string, unknown> = {};
        const builder = {
          eq: (column: string, value: unknown) => {
            filters[column] = value;
            return builder;
          },
          select: () => builder,
          maybeSingle: async () => {
            const request = mockState.requests.find((item) =>
              Object.entries(filters).every(([key, value]) => {
                if (key === 'user_id') return mockState.userId === value;
                return (item as Record<string, unknown>)[key] === value;
              }),
            );
            if (!request) return { data: null, error: null };
            Object.assign(request, values);
            return { data: { id: request.id }, error: null };
          },
        };
        return builder;
      },
    }),
  },
}));

beforeEach(() => {
  window.localStorage.clear();
  mockState.userId = `employee-${Math.random()}`;
  mockState.rangeCalls = 0;
  for (const request of mockState.requests) request.archived_at = null;
  useAuthStore.setState({
    session: { user: { id: mockState.userId } } as Session,
    profile: null,
    initializing: false,
    profileLoaded: true,
  });
});

function renderPanel() {
  return render(
    <AppProviders>
      <VacacionesPanel />
    </AppProviders>,
  );
}

test('muestra estadísticas, filtra tarjetas y ofrece acciones contextuales', async () => {
  renderPanel();

  const statistics = await screen.findByRole('group', { name: /Estadísticas de solicitudes/ });
  await waitFor(() => expect(within(statistics).getAllByText('1')).toHaveLength(4));
  expect(screen.getByText('Vacaciones de verano')).toBeInTheDocument();
  expect(screen.getByText('Baja médica')).toBeInTheDocument();
  expect(screen.getByText('Cita aplazada')).toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Año' })).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Ordenar por' })).not.toBeInTheDocument();
  expect(screen.queryByRole('group', { name: 'Histórico de solicitudes' })).not.toBeInTheDocument();
  expect(screen.queryByRole('group', { name: 'Filtrar solicitudes' })).not.toBeInTheDocument();
  const searchAndFilters = screen.getByRole('group', { name: 'Buscar solicitudes... · Filtros' });
  expect(within(searchAndFilters).getByRole('textbox', { name: 'Buscar solicitudes...' })).toBeInTheDocument();
  expect(within(searchAndFilters).getByRole('button', { name: 'Filtros' })).toBeInTheDocument();

  const cancelledFilter = within(statistics).getByRole('button', { name: 'Anuladas' });
  fireEvent.click(cancelledFilter);
  expect(cancelledFilter).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Cita aplazada')).toBeInTheDocument();
  expect(screen.queryByText('Vacaciones de verano')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Aprobadas' }));
  expect(screen.getByText('Recuperación')).toBeInTheDocument();
  expect(screen.queryByText('Vacaciones de verano')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Aprobadas' }));
  expect(screen.getByText('Vacaciones de verano')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Buscar solicitudes...' }), { target: { value: 'verano' } });
  expect(screen.getByText('Vacaciones de verano')).toBeInTheDocument();
  expect(screen.queryByText('Recuperación')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Buscar solicitudes...' }), { target: { value: '' } });

  fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
  const filtersDialog = screen.getByRole('dialog', { name: 'Filtros avanzados' });
  expect(within(filtersDialog).getByRole('combobox', { name: 'Año' })).toBeInTheDocument();
  expect(within(filtersDialog).getByRole('combobox', { name: 'Ordenar por' })).toBeInTheDocument();
  expect(within(filtersDialog).getByRole('button', { name: 'Activas' })).toBeInTheDocument();
  expect(within(filtersDialog).getByRole('button', { name: 'Archivadas' })).toBeInTheDocument();
  const yearSelect = within(filtersDialog).getByRole('combobox', { name: 'Año' });
  fireEvent.mouseDown(yearSelect);
  fireEvent.click(await screen.findByRole('option', { name: '2025' }));
  fireEvent.click(within(filtersDialog).getByRole('button', { name: 'Aplicar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('Cita aplazada')).toBeInTheDocument();
  expect(screen.queryByText('Recuperación')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
  const clearDialog = screen.getByRole('dialog', { name: 'Filtros avanzados' });
  fireEvent.click(within(clearDialog).getByRole('button', { name: 'Limpiar filtros' }));
  fireEvent.click(within(clearDialog).getByRole('button', { name: 'Aplicar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('Recuperación')).toBeInTheDocument();

  const pendingCard = screen.getByText('Vacaciones de verano').closest<HTMLElement>('.MuiCard-root');
  if (!pendingCard) throw new Error('No se encontró la tarjeta pendiente');
  fireEvent.click(within(pendingCard).getByLabelText('Opciones de solicitud'));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Archivar' }));
  await waitFor(() => expect(screen.queryByText('Vacaciones de verano')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
  const archiveDialog = screen.getByRole('dialog', { name: 'Filtros avanzados' });
  fireEvent.click(within(archiveDialog).getByRole('button', { name: 'Archivadas' }));
  fireEvent.click(within(archiveDialog).getByRole('button', { name: 'Aplicar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('Vacaciones de verano')).toBeInTheDocument();

  fireEvent.click(screen.getAllByLabelText('Opciones de solicitud')[0]);
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Restaurar' }));
  await waitFor(() => expect(screen.queryByText('Vacaciones de verano')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
  const activeDialog = screen.getByRole('dialog', { name: 'Filtros avanzados' });
  fireEvent.click(within(activeDialog).getByRole('button', { name: 'Activas' }));
  fireEvent.click(within(activeDialog).getByRole('button', { name: 'Aplicar' }));
  await waitFor(() => expect(screen.getByText('Vacaciones de verano')).toBeInTheDocument());
  expect(screen.getByText('Vacaciones de verano')).toBeInTheDocument();

  const activePendingCard = screen.getByText('Vacaciones de verano').closest<HTMLElement>('.MuiCard-root');
  if (!activePendingCard) throw new Error('No se encontró la solicitud restaurada');
  fireEvent.click(within(activePendingCard).getByLabelText('Opciones de solicitud'));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }));
  const editDialog = screen.getByRole('dialog', { name: 'Editar solicitud' });
  expect(within(editDialog).getByLabelText('Desde')).toHaveValue('2026-07-27');
}, 20_000);

test('carga el histórico del servidor por páginas y limita las tarjetas iniciales', async () => {
  mockState.requests.splice(
    0,
    mockState.requests.length,
    ...Array.from({ length: 502 }, (_, index) => ({
      id: `request-${index}`,
      type: 'vacacion',
      start_date: '2026-06-01',
      end_date: '2026-06-01',
      days: 1,
      status: 'aprobada',
      reason: `Request ${index}`,
      created_at: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      archived_at: null,
    })),
  );

  renderPanel();

  expect(await screen.findByRole('button', { name: 'Cargar más (482)' })).toBeInTheDocument();
  expect(mockState.rangeCalls).toBe(2);
  expect(screen.getAllByLabelText('Opciones de solicitud')).toHaveLength(20);
  fireEvent.click(screen.getByRole('button', { name: 'Cargar más (482)' }));
  await waitFor(() => expect(screen.getAllByLabelText('Opciones de solicitud')).toHaveLength(40));
});
