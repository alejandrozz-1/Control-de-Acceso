import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import App from '../App';
import { useAuthStore, type Profile } from '../services/auth';
import { supabase } from '../services/supabase';

const fakeSession = { user: { id: 'u1' } } as Session;

const empleado: Profile = {
  id: 'u1',
  email: 'emp1@test.local',
  full_name: 'Eva Empleada',
  employee_code: 'E0021',
  phone: null,
  role: 'empleado',
  center_id: null,
  locale: 'es',
  notification_prefs: {},
  mfa_enabled: false,
  status: 'activo',
  created_at: '2026-10-28T00:00:00Z',
  updated_at: null,
};

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  localStorage.setItem('rps-onboarding-done', '1');
  useAuthStore.setState({ session: null, profile: null, initializing: false, profileLoaded: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('sin sesión muestra la pantalla de login', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Control de Acceso' })).toBeInTheDocument();
  expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
});

test('con sesión el shell separa la navegación inferior de las acciones superiores', () => {
  useAuthStore.setState({ session: fakeSession, profile: empleado, profileLoaded: true });
  render(<App />);
  for (const label of ['Inicio', 'Calendario', 'Acceso']) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
  expect(screen.getByRole('link', { name: 'Abrir notificaciones' })).toHaveAttribute('href', '/notificaciones');
  expect(screen.getByRole('link', { name: 'Abrir cuenta' })).toHaveAttribute('href', '/cuenta');
});

test('la navegación inferior traduce Calendario al catalán', async () => {
  useAuthStore.setState({
    session: fakeSession,
    profile: { ...empleado, locale: 'ca' },
    profileLoaded: true,
  });
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText('Calendari')).toBeInTheDocument();
  });
});

test('la navegación interna actualiza la URL', () => {
  useAuthStore.setState({ session: fakeSession, profile: empleado, profileLoaded: true });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Calendario' }));
  expect(screen.getByRole('heading', { name: 'Calendario' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/calendario');
});

test('una URL interna abre esa ruta directamente', () => {
  useAuthStore.setState({ session: fakeSession, profile: empleado, profileLoaded: true });
  window.history.pushState({}, '', '/calendario');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Calendario' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/calendario');
});

test('la página Cuenta muestra el perfil y el botón de salir', () => {
  vi.spyOn(supabase, 'from').mockImplementation(() => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: (callback: (result: { data: null; error: null }) => unknown) =>
        Promise.resolve(callback({ data: null, error: null })),
    };
    return query as never;
  });
  useAuthStore.setState({ session: fakeSession, profile: empleado, profileLoaded: true });
  render(<App />);
  fireEvent.click(screen.getByRole('link', { name: 'Abrir cuenta' }));
  expect(screen.getByText('Eva Empleada')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Información' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Credencial' })).not.toBeInTheDocument();
  expect(screen.getByText('E0021')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Mi perfil/ })).toHaveAttribute('href', '/cuenta/perfil');
  expect(screen.getByRole('link', { name: 'Abrir notificaciones' })).toHaveAttribute('href', '/notificaciones');
  expect(screen.getByRole('link', { name: /Seguridad/ })).toHaveAttribute('href', '/cuenta/seguridad');
  expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
});
