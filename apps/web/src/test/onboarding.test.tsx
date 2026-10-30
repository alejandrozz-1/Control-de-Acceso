import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import Onboarding, { isOnboardingPending } from '../components/ui/Onboarding';
import { useAuthStore, type Profile } from '../services/auth';
import { AppProviders } from '../app/providers';

const perfil: Profile = {
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

function renderOnboarding() {
  return render(
    <AppProviders>
      <Onboarding />
    </AppProviders>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ session: null, profile: perfil, initializing: false });
});

test('el onboarding se muestra en el primer login y desaparece al terminar', async () => {
  expect(isOnboardingPending()).toBe(true);
  renderOnboarding();
  expect(screen.getByRole('heading', { name: 'Bienvenido a Control de Acceso' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(screen.getByRole('heading', { name: 'Cómo funciona' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(screen.getByRole('heading', { name: '¿Prefieres el modo oscuro?' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
  expect(isOnboardingPending()).toBe(false);
  renderOnboarding().unmount(); // ya no debe renderizar nada
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('«Saltar» cierra el onboarding y no vuelve a aparecer', async () => {
  renderOnboarding();
  fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
  expect(isOnboardingPending()).toBe(false);
});

test('elegir modo oscuro lo aplica y guarda la preferencia', async () => {
  renderOnboarding();
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.click(screen.getByRole('button', { name: 'Oscuro' }));

  await waitFor(() => {
    expect(localStorage.getItem('rps-color-scheme')).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-mui-color-scheme', 'dark');
  });
});

test('no se muestra si ya se completó', () => {
  localStorage.setItem('rps-onboarding-done', '1');
  renderOnboarding();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
