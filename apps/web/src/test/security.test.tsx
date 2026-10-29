import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../app/providers';
import Seguridad from '../pages/account/Seguridad';
import { useAuthStore, type Profile } from '../services/auth';
import { supabase } from '../services/supabase';

const fakeSession = { user: { id: 'u1' } } as Session;
const employee: Profile = {
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
  useAuthStore.setState({ session: fakeSession, profile: employee, initializing: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function fillPasswordForm(currentPassword: string) {
  fireEvent.change(await screen.findByLabelText(/^Contraseña actual/), { target: { value: currentPassword } });
  fireEvent.change(screen.getByLabelText(/^Nueva contraseña/), { target: { value: 'Zafiro!Luna42' } });
  fireEvent.change(screen.getByLabelText(/^Repite la nueva contraseña/), { target: { value: 'Zafiro!Luna42' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
}

function renderSecurityPage() {
  render(
    <MemoryRouter>
      <AppProviders>
        <Seguridad />
      </AppProviders>
    </MemoryRouter>,
  );
}

test('solicita y comprueba la contraseña actual antes de actualizar la nueva', async () => {
  const verifyPassword = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
    data: { user: null, session: null },
    error: { message: 'Invalid login credentials' },
  } as never);
  const updatePassword = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
    data: { user: null },
    error: null,
  } as never);
  renderSecurityPage();

  await fillPasswordForm('incorrecta');

  expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual no es correcta.');
  expect(verifyPassword).toHaveBeenCalledWith({ email: employee.email, password: 'incorrecta' });
  expect(updatePassword).not.toHaveBeenCalled();
}, 15_000);

test('actualiza la contraseña solo después de verificar la actual', async () => {
  vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
    data: { user: null, session: null },
    error: null,
  } as never);
  const updatePassword = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
    data: { user: null },
    error: null,
  } as never);
  renderSecurityPage();

  await fillPasswordForm('ActualSegura1!');

  expect(await screen.findByRole('status')).toHaveTextContent('Tu contraseña se ha actualizado correctamente.');
  await waitFor(() => expect(updatePassword).toHaveBeenCalledWith({ password: 'Zafiro!Luna42' }));
  expect(screen.getByLabelText(/^Contraseña actual/)).toHaveValue('');
}, 15_000);

test('muestra un error de cierre de sesión si Supabase no puede cerrar la sesión', async () => {
  vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({
    error: { message: 'Network error' },
  } as never);
  await expect(useAuthStore.getState().signOut()).rejects.toMatchObject({ message: 'Network error' });
  expect(useAuthStore.getState().session).toEqual(fakeSession);
});
