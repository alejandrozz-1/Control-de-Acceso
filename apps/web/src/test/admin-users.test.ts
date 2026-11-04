import { describe, expect, it } from 'vitest';
import { hasRole } from '../services/auth';
import { displayCenterName, displayUserStatus, filterUsers, type ManagedUser } from '../pages/admin/userDirectory';

const user = (overrides: Partial<ManagedUser> = {}): ManagedUser => ({
  id: 'user-1',
  full_name: 'Eva García',
  email: 'eva.garcia@repsol.com',
  employee_code: 'E-1024',
  role: 'empleado',
  status: 'activo',
  must_change_password: false,
  center_id: 'center-1',
  phone: null,
  created_at: '2026-11-03T08:00:00Z',
  updated_at: null,
  locale: 'es',
  mfa_enabled: false,
  notification_prefs: {},
  last_sign_in_at: '2026-11-03T08:42:00Z',
  center: { id: 'center-1', name: 'Repsol Madrid — Torre Cristal' },
  ...overrides,
});

describe('admin user directory', () => {
  it('searches accent-insensitively across name, email and employee code', () => {
    const rows = [user(), user({ id: 'user-2', full_name: 'Carlos Ruiz', email: 'carlos@example.com', employee_code: 'E-2000' })];
    expect(filterUsers(rows, { query: 'garcia', role: 'all', status: 'all', centerId: 'all' })).toHaveLength(1);
    expect(filterUsers(rows, { query: 'E-2000', role: 'all', status: 'all', centerId: 'all' })[0].id).toBe('user-2');
    expect(filterUsers(rows, { query: 'eva repsol', role: 'all', status: 'all', centerId: 'all' })).toHaveLength(1);
  });

  it('combines role, status and center filters', () => {
    const rows = [
      user(),
      user({ id: 'user-2', role: 'admin', center_id: 'center-2', status: 'bloqueado', center: null }),
    ];
    expect(filterUsers(rows, { query: '', role: 'admin', status: 'bloqueado', centerId: 'center-2' })).toHaveLength(1);
    expect(filterUsers(rows, { query: '', role: 'admin', status: 'activo', centerId: 'all' })).toHaveLength(0);
  });

  it('presents the first-login requirement as pending and shortens legacy center names', () => {
    expect(displayUserStatus(user({ must_change_password: true }))).toBe('pendiente_activacion');
    expect(displayUserStatus(user({ status: 'bloqueado', must_change_password: true }))).toBe('bloqueado');
    expect(displayCenterName('Repsol Madrid — Torre Cristal')).toBe('Torre Cristal Madrid');
    expect(displayCenterName('Repsol Cartagena — Refino')).toBe('Cartagena');
  });

  it('keeps security and HR roles outside the administration role hierarchy', () => {
    expect(hasRole(user({ role: 'seguridad' }), 'admin')).toBe(false);
    expect(hasRole(user({ role: 'recursos_humanos' }), 'admin')).toBe(false);
    expect(hasRole(user({ role: 'admin' }), 'admin')).toBe(true);
  });
});
