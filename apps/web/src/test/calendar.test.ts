import { describe, expect, it } from 'vitest';
import { monthWeeks } from '../pages/Calendario';

describe('monthWeeks', () => {
  it('genera 6 semanas de 7 días empezando en lunes', () => {
    const weeks = monthWeeks(2026, 0); // enero 2026 (empieza en jueves)
    expect(weeks).toHaveLength(6);
    for (const w of weeks) expect(w).toHaveLength(7);
    // Primera celda: lunes 29/12/2025
    expect(weeks[0][0]).toBe('2025-12-29');
    // Última celda: domingo 8/2/2026
    expect(weeks[5][6]).toBe('2026-02-08');
  });

  it('las celdas son consecutivas', () => {
    const weeks = monthWeeks(2026, 5); // junio 2026
    const flat = weeks.flat();
    for (let i = 1; i < flat.length; i++) {
      const prev = new Date(`${flat[i - 1]}T12:00:00`);
      const next = new Date(`${flat[i]}T12:00:00`);
      expect((next.getTime() - prev.getTime()) / 86_400_000).toBe(1);
    }
  });
});
