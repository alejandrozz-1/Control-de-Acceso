import { describe, expect, test } from 'vitest';
import { formatCountdown, secondsUntil } from '../services/access';
import { getCurrentShiftState, shiftProgress } from '../pages/Inicio';

describe('helpers de credenciales', () => {
  test('secondsUntil devuelve los segundos restantes y nunca negativos', () => {
    const now = Date.parse('2026-10-28T10:00:00Z');
    expect(secondsUntil('2026-10-28T10:01:00Z', now)).toBe(60);
    expect(secondsUntil('2026-10-28T10:00:30.999Z', now)).toBe(31);
    expect(secondsUntil('2026-10-28T10:00:00.001Z', now)).toBe(1);
    expect(secondsUntil('2026-10-28T09:59:00Z', now)).toBe(0);
  });

  test('formatCountdown muestra m:ss con ceros a la izquierda', () => {
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(65)).toBe('1:05');
    expect(formatCountdown(600)).toBe('10:00');
  });
});

describe('shiftProgress', () => {
  const at = (h: number, m: number) => new Date(2026, 9, 28, h, m);

  test('turno de mañana a mitad de jornada', () => {
    expect(shiftProgress('08:00', '16:00', false, at(12, 0))).toBe(50);
  });

  test('antes del inicio devuelve 0 y después del fin 100', () => {
    expect(shiftProgress('08:00', '16:00', false, at(7, 30))).toBe(0);
    expect(shiftProgress('08:00', '16:00', false, at(17, 0))).toBe(100);
  });

  test('turno de noche cruza medianoche', () => {
    // 22:00 - 06:00 → a las 02:00 va por el 50%
    expect(shiftProgress('22:00', '06:00', true, at(2, 0))).toBe(50);
    // 23:00 (1 h después de empezar) → 12%
    expect(shiftProgress('22:00', '06:00', true, at(23, 0))).toBe(13);
  });
});

describe('estado del turno actual', () => {
  const turno = {
    code: 'T',
    start_time: '16:00',
    end_time: '00:00',
    overnight: true,
  };

  test('antes de la hora de inicio indica que el turno es próximo', () => {
    const state = getCurrentShiftState(turno, null, new Date(2026, 9, 29, 11, 0));
    expect(state.label).toBe('Próximo turno');
    expect(state.active).toBe(false);
  });

  test('a la hora de inicio indica que el usuario ya está en turno', () => {
    const state = getCurrentShiftState(turno, null, new Date(2026, 9, 29, 16, 0));
    expect(state.label).toBe('En turno');
    expect(state.active).toBe(true);
  });

  test('después del fin de un turno diurno indica que ha finalizado', () => {
    const state = getCurrentShiftState(
      { code: 'M', start_time: '08:00', end_time: '16:00', overnight: false },
      null,
      new Date(2026, 9, 29, 16, 1),
    );
    expect(state.label).toBe('Turno finalizado');
    expect(state.active).toBe(false);
  });

  test('mantiene activo el turno nocturno anterior tras medianoche', () => {
    const previousNight = {
      code: 'N',
      start_time: '22:00',
      end_time: '06:00',
      overnight: true,
    };
    const todayMorning = {
      code: 'M',
      start_time: '08:00',
      end_time: '16:00',
      overnight: false,
    };
    const state = getCurrentShiftState(todayMorning, previousNight, new Date(2026, 9, 29, 2, 0));
    expect(state.label).toBe('En turno');
    expect(state.shift).toBe(previousNight);
  });
});
