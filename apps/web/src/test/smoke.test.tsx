import { render, screen } from '@testing-library/react';
import { beforeEach } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import App from '../App';
import { useAuthStore, type Profile } from '../services/auth';

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
  localStorage.setItem('rps-onboarding-done', '1');
  useAuthStore.setState({ session: null, profile: null, initializing: false });
});

test('sin sesión muestra la pantalla de login', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Control de Acceso' })).toBeInTheDocument();
  expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
});

test('con sesión el shell muestra los 5 destinos de la navegación inferior', () => {
  useAuthStore.setState({ session: fakeSession, profile: empleado });
  render(<App />);
  for (const label of ['Inicio', 'Calendario', 'Acceso', 'Notificaciones', 'Cuenta']) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});

test('la ruta desconocida redirige a Inicio', () => {
  useAuthStore.setState({ session: fakeSession, profile: empleado });
  window.history.pushState({}, '', '/no-existe');
  render(<App />);
  expect(screen.getByRole('heading', { name: /Buenos días|Buenas tardes|Buenas noches/ })).toBeInTheDocument();
});

test('un empleado no puede entrar a /admin/usuarios (redirige a Inicio)', () => {
  useAuthStore.setState({ session: fakeSession, profile: empleado });
  window.history.pushState({}, '', '/admin/usuarios');
  render(<App />);
  expect(screen.getByRole('heading', { name: /Buenos días|Buenas tardes|Buenas noches/ })).toBeInTheDocument();
});

test('la página Cuenta muestra el perfil y el botón de salir', () => {
  useAuthStore.setState({ session: fakeSession, profile: empleado });
  window.history.pushState({}, '', '/cuenta');
  render(<App />);
  expect(screen.getByText('Eva Empleada')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
});
