import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProviders } from '../app/providers';
import Notificaciones from '../pages/Notificaciones';

type MockNotification = {
  id: string;
  type: 'turno' | 'acceso' | 'vacacion' | 'corporativa' | 'sistema';
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

type MockNotificationData = {
  pages: { items: MockNotification[]; nextCursor: null }[];
};

const mocks = vi.hoisted(() => ({
  notifications: {
    data: undefined as MockNotificationData | undefined,
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    fetchNextPage: vi.fn(),
  },
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

vi.mock('../services/notifications', () => ({
  useNotifications: () => mocks.notifications,
  useMarkRead: () => ({ mutate: mocks.markRead, isPending: false, error: null }),
  useMarkAllRead: () => ({ mutate: mocks.markAllRead, isPending: false, error: null }),
  useDeleteNotification: () => ({ mutate: mocks.deleteNotification, isPending: false, error: null }),
}));

const item = {
  id: 'notice-1',
  type: 'vacacion' as const,
  title: 'Vacaciones aprobadas',
  body: 'Tu solicitud ha sido aprobada.',
  data: { status: 'aprobada' },
  read_at: null,
  created_at: '2026-10-30T08:00:00.000Z',
};

function renderNotifications() {
  return render(
    <MemoryRouter initialEntries={['/notificaciones']}>
      <AppProviders>
        <Routes>
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/calendario" element={<div data-testid="target-route">Calendario relacionado</div>} />
          <Route path="/acceso" element={<div data-testid="target-route">Acceso relacionado</div>} />
        </Routes>
        <CurrentRoute />
      </AppProviders>
    </MemoryRouter>,
  );
}

function CurrentRoute() {
  const location = useLocation();
  return (
    <output data-testid="current-route">
      {location.pathname}
      {JSON.stringify(location.state)}
    </output>
  );
}

beforeEach(() => {
  mocks.notifications.data = { pages: [{ items: [item], nextCursor: null }] };
  mocks.notifications.isLoading = false;
  mocks.notifications.isError = false;
  mocks.notifications.isSuccess = true;
  mocks.notifications.hasNextPage = false;
  mocks.notifications.isFetchingNextPage = false;
  mocks.notifications.isFetchNextPageError = false;
  mocks.notifications.fetchNextPage.mockReset();
  mocks.markRead.mockReset();
  mocks.markAllRead.mockReset();
  mocks.deleteNotification.mockReset();
});

test('destaca las no leídas y no muestra insignias de lectura', () => {
  renderNotifications();

  const card = screen.getByRole('article');
  expect(card).toHaveTextContent('Aprobación');
  expect(card).toHaveAttribute('data-read-state', 'unread');
  expect(card).not.toHaveTextContent('Leída');
  expect(card).not.toHaveTextContent('Sin leer');
  expect(screen.getByRole('heading', { name: 'Vacaciones aprobadas' })).toHaveStyle({ fontWeight: '750' });
  expect(screen.getByLabelText('No leída')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Hoy' })).toBeInTheDocument();
});

test('las leídas se muestran discretamente y sin el indicador azul', () => {
  mocks.notifications.data = {
    pages: [{ items: [{ ...item, read_at: '2026-10-30T09:00:00.000Z' }], nextCursor: null }],
  };
  renderNotifications();

  const card = screen.getByRole('article');
  expect(card).toHaveAttribute('data-read-state', 'read');
  expect(card).not.toHaveTextContent('Leída');
  expect(screen.queryByLabelText('No leída')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Vacaciones aprobadas' })).toHaveStyle({ fontWeight: '400' });
});

test('permite marcar una notificación como leída', () => {
  renderNotifications();

  fireEvent.click(screen.getByRole('button', { name: 'Marcar leída' }));

  expect(mocks.markRead).toHaveBeenCalledWith(item.id);
});

test('abre el detalle y marca la notificación como leída', () => {
  renderNotifications();

  fireEvent.click(screen.getByRole('article'));

  expect(screen.getByRole('dialog')).toHaveTextContent(item.body);
  expect(mocks.markRead).toHaveBeenCalledWith(item.id);
});

test('confirma antes de eliminar una notificación', () => {
  mocks.deleteNotification.mockImplementation((_id, options) => options.onSuccess());
  renderNotifications();

  fireEvent.click(screen.getByRole('button', { name: `Eliminar «${item.title}»` }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Esta acción no se puede deshacer');

  fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

  expect(mocks.deleteNotification).toHaveBeenCalledWith(item.id, expect.objectContaining({
    onSuccess: expect.any(Function),
  }));
});

test('permite marcar todas las notificaciones como leídas', () => {
  renderNotifications();

  fireEvent.click(screen.getByRole('button', { name: 'Marcar todas como leídas' }));

  expect(mocks.markAllRead).toHaveBeenCalledOnce();
});

test('carga otra página de notificaciones a demanda', () => {
  mocks.notifications.hasNextPage = true;
  renderNotifications();

  fireEvent.click(screen.getByRole('button', { name: 'Cargar más notificaciones' }));

  expect(mocks.notifications.fetchNextPage).toHaveBeenCalledOnce();
});

test('abre la solicitud de vacaciones relacionada desde su notificación', () => {
  mocks.notifications.data = {
    pages: [{
      items: [{
        ...item,
        data: { request_id: 'request-42' },
      }],
      nextCursor: null,
    }],
  };
  renderNotifications();

  fireEvent.click(screen.getByRole('button', { name: 'Ver calendario' }));

  expect(screen.getByTestId('target-route')).toHaveTextContent('Calendario relacionado');
  expect(screen.getByTestId('current-route')).toHaveTextContent(
    '/calendario{"notificationTarget":{"kind":"vacation","id":"request-42"}}',
  );
});

test('traduce los datos automáticos y la acción de calendario con el idioma seleccionado', () => {
  window.localStorage.setItem('rps-locale', 'en');
  mocks.notifications.data = {
    pages: [{
      items: [{
        ...item,
        body: 'Tu solicitud del 27/11/2026 al 01/12/2026',
        data: { request_id: 'request-42' },
      }],
      nextCursor: null,
    }],
  };
  renderNotifications();

  expect(screen.getByRole('heading', { name: 'Vacation approved' })).toBeInTheDocument();
  expect(screen.getByText('Your request from 27 Nov 2026 to 1 Dec 2026')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'View calendar' }));
  expect(screen.getByTestId('target-route')).toHaveTextContent('Calendario relacionado');
});
