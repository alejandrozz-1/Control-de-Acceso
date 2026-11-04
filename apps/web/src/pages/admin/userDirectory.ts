import type { Profile } from '../../services/auth';

export type ManagedUser = Profile & {
  last_sign_in_at: string | null;
  center: { id: string; name: string } | null;
};

export type UserFilters = {
  query: string;
  role: string;
  status: string;
  centerId: string;
};

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filterUsers(users: ManagedUser[], filters: UserFilters): ManagedUser[] {
  const terms = normalizeSearch(filters.query).trim().split(/\s+/).filter(Boolean);
  return users.filter((user) => {
    const searchable = normalizeSearch([
      user.full_name,
      user.email ?? '',
      user.employee_code ?? '',
    ].join(' '));
    return terms.every((term) => searchable.includes(term))
      && (filters.role === 'all' || user.role === filters.role)
      && (filters.status === 'all' || displayUserStatus(user) === filters.status)
      && (filters.centerId === 'all' || user.center_id === filters.centerId);
  });
}

export function displayUserStatus(user: Pick<ManagedUser, 'status' | 'must_change_password'>): string {
  if (user.status === 'bloqueado' || user.status === 'inactivo') return user.status;
  return user.must_change_password ? 'pendiente_activacion' : user.status;
}

export function displayCenterName(name: string): string {
  const normalized = normalizeSearch(name);
  if (normalized.includes('torre cristal')) return 'Torre Cristal Madrid';
  if (normalized.includes('cartagena')) return 'Cartagena';
  return name;
}
