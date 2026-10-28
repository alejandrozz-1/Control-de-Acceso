import { describe, expect, test } from 'vitest';
import { formatCountdown, secondsUntil } from '../services/access';

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
