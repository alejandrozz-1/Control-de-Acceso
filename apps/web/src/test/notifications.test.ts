import { expect, test } from 'vitest';
import type { AppNotification } from '../services/notifications';
import {
  getNotificationCategory,
  getNotificationGroup,
  getNotificationNavigation,
  getNotificationTargetFromState,
  groupNotifications,
} from '../pages/notificationPresentation';

function notification(
  createdAt: string,
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: createdAt,
    type: 'sistema',
    title: 'Aviso',
    body: null,
    data: null,
    read_at: null,
    created_at: createdAt,
    ...overrides,
  };
}

test('agrupa notificaciones por hoy, ayer, esta semana y más antiguas', () => {
  const now = new Date(2026, 9, 30, 12);
  expect(getNotificationGroup('2026-10-30T08:00:00', now)).toBe('Hoy');
  expect(getNotificationGroup('2026-10-29T08:00:00', now)).toBe('Ayer');
  expect(getNotificationGroup('2026-10-26T08:00:00', now)).toBe('Esta semana');
  expect(getNotificationGroup('2026-10-24T08:00:00', now)).toBe('Más antiguas');
});

test('mantiene el orden cronológico original dentro de los grupos de fechas', () => {
  const notifications = [
    notification('2026-10-29T18:00:00'),
    notification('2026-10-30T08:00:00'),
    notification('2026-10-29T09:00:00'),
  ];

  expect(groupNotifications(notifications, new Date(2026, 9, 30, 12))).toEqual([
    { label: 'Hoy', items: [notifications[1]] },
    { label: 'Ayer', items: [notifications[0], notifications[2]] },
  ]);
});

test('clasifica urgencia explícita, aprobaciones, recordatorios e información', () => {
  expect(getNotificationCategory(notification('2026-10-30T08:00:00', {
    data: { priority: 'high' },
  }))).toBe('Urgente');
  expect(getNotificationCategory(notification('2026-10-30T08:00:00', {
    type: 'vacacion',
    title: 'Vacaciones aprobadas',
  }))).toBe('Aprobación');
  expect(getNotificationCategory(notification('2026-10-30T08:00:00', {
    type: 'turno',
  }))).toBe('Recordatorio');
  expect(getNotificationCategory(notification('2026-10-30T08:00:00'))).toBe('Informativa');
});

test('marca como urgente la revocación de una credencial de acceso', () => {
  expect(getNotificationCategory(notification('2026-10-30T08:00:00', {
    type: 'acceso',
    title: 'Credencial revocada',
  }))).toBe('Urgente');
});

test('usa categorías explícitas y reconoce aprobaciones y recordatorios', () => {
  expect(getNotificationCategory(notification('2026-10-30T08:00:00', {
    data: { category: 'informativa' },
  }))).toBe('Informativa');
  expect(getNotificationCategory(notification('2026-10-30T08:00:00', {
    title: 'Solicitud aprobada',
  }))).toBe('Aprobación');
  expect(getNotificationCategory(notification('2026-10-30T08:00:00', {
    title: 'Recordatorio de evento',
  }))).toBe('Recordatorio');
});

test('enlaza solicitudes, eventos y credenciales con su sección y elemento asociado', () => {
  const vacation = getNotificationNavigation(notification('2026-10-30T08:00:00', {
    type: 'vacacion',
    data: { request_id: 'request-42' },
  }));
  expect(vacation).toEqual({
    path: '/calendario',
    label: 'Ver en calendario',
    state: { notificationTarget: { kind: 'vacation', id: 'request-42' } },
  });

  const event = getNotificationNavigation(notification('2026-10-30T08:00:00', {
    type: 'corporativa',
    data: { event_id: 'event-7' },
  }));
  expect(event?.state?.notificationTarget).toEqual({ kind: 'event', id: 'event-7' });

  const credential = getNotificationNavigation(notification('2026-10-30T08:00:00', {
    type: 'acceso',
    data: { credential_id: 'credential-9' },
  }));
  expect(credential).toEqual({
    path: '/acceso',
    label: 'Ver acceso',
    state: { notificationTarget: { kind: 'credential', id: 'credential-9' } },
  });
  expect(getNotificationTargetFromState(vacation?.state)).toEqual({ kind: 'vacation', id: 'request-42' });
  expect(getNotificationTargetFromState({ notificationTarget: { kind: 'other', id: 'x' } })).toBeNull();
});
