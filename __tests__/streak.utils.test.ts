import { calcularRacha } from '../src/utils/streak.utils';
import type { Transaction } from '../src/types/transactions.types';

const tx = (d: Date): Transaction => ({
  id: d.toISOString(),
  user_id: 'u',
  category_id: 'c',
  type: 'EXPENSE',
  amount: 10,
  description: null,
  date: '2026-10-16',
  created_at: d.toISOString(),
  updated_at: d.toISOString(),
});

const now = new Date(2026, 9, 16, 12, 0, 0); // 16 oct 2026, hora local
const at = (day: number) => tx(new Date(2026, 9, day, 9, 0, 0));

describe('calcularRacha', () => {
  it('sin movimientos: racha 0', () => {
    expect(calcularRacha([], now).current).toBe(0);
  });

  it('hoy y ayer: racha 2', () => {
    expect(calcularRacha([at(16), at(15)], now)).toMatchObject({
      current: 2,
      registeredToday: true,
      atRisk: false,
    });
  });

  it('solo ayer: la racha sigue pero en riesgo', () => {
    expect(calcularRacha([at(15)], now)).toMatchObject({
      current: 1,
      registeredToday: false,
      atRisk: true,
    });
  });

  it('un día sin registrar rompe la racha', () => {
    const r = calcularRacha([at(16), at(14), at(13)], now);
    expect(r.current).toBe(1);
    expect(r.longest).toBe(2);
  });
}); 