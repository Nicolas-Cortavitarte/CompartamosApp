import type { Transaction } from '../types/transactions.types';

export interface StreakInfo {
  /** Días seguidos con registros, hasta hoy o, si hoy aún no registras, hasta ayer. */
  current: number;
  longest: number;
  registeredToday: boolean;
  /** Tiene racha pero hoy todavía no registra: la pierde si el día termina así. */
  atRisk: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local -> 'YYYY-MM-DD' según la zona horaria del teléfono (no UTC). */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(key: string, delta: number): string {
  const [year, month, day] = key.split('-').map(Number);
  return dayKey(new Date(year, month - 1, day + delta));
}

function parseCreatedAt(value: string): Date | null {
  // Postgres puede devolver microsegundos; se recortan a milisegundos por seguridad.
  const date = new Date(String(value ?? '').replace(/(\.\d{3})\d+/, '$1'));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calcularRacha(
  transactions: Transaction[],
  now: Date = new Date(),
): StreakInfo {
  const days = new Set<string>();
  transactions.forEach(t => {
    const created = parseCreatedAt(t.created_at);
    if (created) {
      days.add(dayKey(created));
    }
  });

  const today = dayKey(now);
  const registeredToday = days.has(today);

  // La racha cuenta hacia atrás desde hoy; si hoy aún no hay registro, desde ayer.
  let cursor = registeredToday ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  // Racha más larga de todo el historial.
  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  Array.from(days)
    .sort()
    .forEach(day => {
      run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
      longest = Math.max(longest, run);
      previous = day;
    });

  return {
    current,
    longest,
    registeredToday,
    atRisk: current > 0 && !registeredToday,
  };
}

export function describirRacha(info: StreakInfo): {
  title: string;
  subtitle: string;
} {
  if (info.current === 0) {
    return {
      title: 'Empieza tu racha',
      subtitle: 'Registra un movimiento hoy para activarla.',
    };
  }

  const title = `${info.current} ${info.current === 1 ? 'día' : 'días'} seguidos`;

  return {
    title,
    subtitle: info.registeredToday
      ? '¡Hoy ya registraste! Vuelve mañana para sumar.'
      : 'Registra algo hoy para no perder tu racha.',
  };
}