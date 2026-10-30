import type { AppNotification } from '../services/notifications';

export type NotificationGroup = 'Hoy' | 'Ayer' | 'Esta semana' | 'Más antiguas';
export type NotificationCategory = 'Urgente' | 'Aprobación' | 'Recordatorio' | 'Informativa';

export type NotificationTarget =
  | { kind: 'vacation'; id: string }
  | { kind: 'event'; id: string }
  | { kind: 'credential'; id: string };

export interface NotificationNavigation {
  path: string;
  label: string;
  state?: { notificationTarget: NotificationTarget };
}

export function getNotificationTargetFromState(state: unknown): NotificationTarget | null {
  if (!state || typeof state !== 'object' || !('notificationTarget' in state)) return null;
  const target = state.notificationTarget;
  if (!target || typeof target !== 'object' || !('kind' in target) || !('id' in target)) return null;
  if (typeof target.id !== 'string' || target.id.length === 0) return null;
  if (target.kind === 'vacation' || target.kind === 'event' || target.kind === 'credential') {
    return { kind: target.kind, id: target.id };
  }
  return null;
}

function dataId(notification: AppNotification, key: string): string | null {
  const value = notification.data?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getNotificationNavigation(notification: AppNotification): NotificationNavigation | null {
  if (notification.type === 'vacacion') {
    const requestId = dataId(notification, 'request_id');
    return {
      path: '/calendario',
      label: 'Ver en calendario',
      ...(requestId ? { state: { notificationTarget: { kind: 'vacation' as const, id: requestId } } } : {}),
    };
  }
  if (notification.type === 'corporativa') {
    const eventId = dataId(notification, 'event_id');
    return {
      path: '/calendario',
      label: 'Ver en calendario',
      ...(eventId ? { state: { notificationTarget: { kind: 'event' as const, id: eventId } } } : {}),
    };
  }
  if (notification.type === 'turno') {
    return { path: '/calendario', label: 'Ver calendario' };
  }
  if (notification.type === 'acceso') {
    const credentialId = dataId(notification, 'credential_id');
    return {
      path: '/acceso',
      label: 'Ver acceso',
      ...(credentialId
        ? { state: { notificationTarget: { kind: 'credential' as const, id: credentialId } } }
        : {}),
    };
  }
  return null;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNotificationGroup(iso: string, now = new Date()): NotificationGroup {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Más antiguas';

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notificationDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayKey = localDateKey(today);
  const notificationKey = localDateKey(notificationDay);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (notificationKey === todayKey) return 'Hoy';
  if (notificationKey === localDateKey(yesterday)) return 'Ayer';

  const weekStart = new Date(today);
  const dayFromMonday = (today.getDay() + 6) % 7;
  weekStart.setDate(today.getDate() - dayFromMonday);
  if (notificationDay >= weekStart && notificationDay < today) return 'Esta semana';
  return 'Más antiguas';
}

export function groupNotifications(
  notifications: AppNotification[],
  now = new Date(),
): { label: NotificationGroup; items: AppNotification[] }[] {
  const order: NotificationGroup[] = ['Hoy', 'Ayer', 'Esta semana', 'Más antiguas'];
  const grouped = new Map<NotificationGroup, AppNotification[]>();

  for (const notification of notifications) {
    const label = getNotificationGroup(notification.created_at, now);
    const items = grouped.get(label) ?? [];
    items.push(notification);
    grouped.set(label, items);
  }

  return order.flatMap((label) => {
    const items = grouped.get(label);
    return items ? [{ label, items }] : [];
  });
}

export function getNotificationCategory(notification: AppNotification): NotificationCategory {
  const data = notification.data;
  const explicitPriority = typeof data?.priority === 'string' ? data.priority.toLowerCase() : '';
  const explicitCategory = typeof data?.category === 'string' ? data.category.toLowerCase() : '';

  if (['urgent', 'high', 'critical', 'alta', 'urgente', 'critica', 'crítica'].includes(explicitPriority)) {
    return 'Urgente';
  }
  if (['urgent', 'urgente'].includes(explicitCategory)) return 'Urgente';
  if (['approval', 'aprobacion', 'aprobación'].includes(explicitCategory)) return 'Aprobación';
  if (['reminder', 'recordatorio'].includes(explicitCategory)) return 'Recordatorio';
  if (['informative', 'informativa', 'informativo', 'info'].includes(explicitCategory)) return 'Informativa';

  const text = `${notification.title} ${notification.body ?? ''}`.toLocaleLowerCase('es');
  if (
    (notification.type === 'acceso' && /revocad|bloquead|denegad|expirad/.test(text)) ||
    /urgente|acción inmediata|requiere atención inmediata/.test(text)
  ) {
    return 'Urgente';
  }
  if (/aprobaci[oó]n|aprobada|aprobado|rechazada|rechazado/.test(text)) return 'Aprobación';
  if (/recordatorio|te recordamos|recuerda que/.test(text)) return 'Recordatorio';
  if (notification.type === 'vacacion') return 'Aprobación';
  if (notification.type === 'turno') return 'Recordatorio';
  return 'Informativa';
}

export function formatNotificationDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNotificationDetailDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getNotificationTypeLabel(type: AppNotification['type']): string {
  const labels: Record<AppNotification['type'], string> = {
    turno: 'Turno',
    acceso: 'Acceso',
    vacacion: 'Vacaciones',
    corporativa: 'Corporativa',
    sistema: 'Sistema',
  };
  return labels[type];
}
