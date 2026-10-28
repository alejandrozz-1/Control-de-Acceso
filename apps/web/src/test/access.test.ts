import { describe, expect, test } from 'vitest';
import { formatCountdown, secondsUntil } from '../services/access';
import { shiftProgress } from '../pages/Inicio';

describe('helpers de credenciales', () => {
  test('secondsUntil devuelve los segundos restantes y nunca negativos', () => {
    const now = Date.parse('2026-10-28T10:00:00Z');
    expect(secondsUntil('2026-10-28T10:01:00Z', now)).toBe(60);
    expect(secondsUntil('2026-10-28T10:00:30.999Z', now)).toBe(30);
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
