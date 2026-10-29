import { describe, expect, it } from 'vitest';
import { buildEvent, buildHoliday } from '../pages/admin/Festivos';
import { revokeErrorText } from '../pages/admin/Credenciales';

describe('buildHoliday', () => {
  it('normaliza comunidad a minúsculas y solo si el ámbito es comunidad', () => {
    const nac = buildHoliday({ name: '  Navidad ', date: '2026-12-25', scope: 'nacional', comunidad: 'Madrid' });
    expect(nac.valid).toBe(true);
    expect(nac.row).toEqual({ name: 'Navidad', date: '2026-12-25', scope: 'nacional', comunidad: null });

    const com = buildHoliday({ name: 'San Isidro', date: '2026-05-15', scope: 'comunidad', comunidad: ' MADRID ' });
    expect(com.row.comunidad).toBe('madrid');
  });

  it('invalida nombre o fecha vacíos', () => {
    expect(buildHoliday({ name: '', date: '2026-12-25', scope: 'nacional', comunidad: '' }).valid).toBe(false);
    expect(buildHoliday({ name: 'x', date: '', scope: 'nacional', comunidad: '' }).valid).toBe(false);
  });
});

describe('buildEvent', () => {
  it('all_day guarda medianoche UTC del día elegido', () => {
    const e = buildEvent({ title: 'Día del empleado', allDay: true, date: '2026-05-29', start: '09:00', end: '', description: '' });
    expect(e.valid).toBe(true);
    if (!e.valid) return;
    expect(e.row.starts_at).toBe('2026-05-29T00:00:00.000Z');
    expect(e.row.ends_at).toBeNull();
    expect(e.row.all_day).toBe(true);
    // el calendario identifica el día con starts_at.slice(0,10)
    expect(e.row.starts_at.slice(0, 10)).toBe('2026-05-29');
  });

  it('evento con hora convierte local→ISO y valida el orden', () => {
    const ok = buildEvent({ title: 'Reunión', allDay: false, date: '2026-03-16', start: '09:00', end: '11:00', description: '' });
    expect(ok.valid).toBe(true);
    if (!ok.valid) return;
    expect(new Date(ok.row.starts_at!).getUTCHours()).toBeGreaterThanOrEqual(0);
    expect(ok.row.ends_at! > ok.row.starts_at!).toBe(true);

    const bad = buildEvent({ title: 'Reunión', allDay: false, date: '2026-03-16', start: '11:00', end: '09:00', description: '' });
    expect(bad.valid).toBe(false);
  });

  it('requiere título y fecha', () => {
    expect(buildEvent({ title: ' ', allDay: true, date: '2026-05-29', start: '', end: '', description: '' }).valid).toBe(false);
    expect(buildEvent({ title: 'x', allDay: false, date: '2026-05-29', start: '', end: '', description: '' }).valid).toBe(false);
  });
});

describe('revokeErrorText', () => {
  it('traduce errores de RLS a mensaje amable', () => {
    expect(revokeErrorText(new Error('new row violates row-level security policy'))).toContain('responsable del equipo');
    expect(revokeErrorText(null)).toBe('');
    expect(revokeErrorText(new Error('otra cosa'))).toContain('No se pudo revocar');
  });
});
