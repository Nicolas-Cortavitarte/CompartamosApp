// src/utils/reports.utils.ts (o dentro de tu index.tsx en utils)
import { Transaction, Category, Insight } from '../types/transactions.types';

// Función auxiliar de la semana 1 adaptada al nuevo SQL
export function calcularTotalPorTipo(transactions: Transaction[], tipo: 'INCOME' | 'EXPENSE'): number {
  return transactions
    .filter(t => t.type === tipo)
    .reduce((acc, t) => acc + Number(t.amount), 0);
}

// REP-02: Agrupar gastos por categoría para el gráfico
export function agruparGastosPorCategoria(transactions: Transaction[], categories: Category[]) {
  const gastos = transactions.filter(t => t.type === 'EXPENSE');
  const totalGastos = calcularTotalPorTipo(transactions, 'EXPENSE');

  if (totalGastos === 0) return [];

  // Creamos un mapa para sumar los montos por category_id
  const mapaGastos = gastos.reduce((acc, t) => {
    acc[t.category_id] = (acc[t.category_id] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  // Formateamos el resultado para la librería de gráficos (ej. react-native-gifted-charts)
  return Object.keys(mapaGastos).map(categoryId => {
    const categoria = categories.find(c => c.id === categoryId);
    const monto = mapaGastos[categoryId];
    const porcentaje = ((monto / totalGastos) * 100).toFixed(1);

    return {
      value: monto,
      text: `${porcentaje}%`,
      label: categoria ? categoria.name : 'Desconocido',
      // Aquí puedes asignar colores dependiendo de la categoría
      color: categoria?.name === 'Comida' ? '#FF6B6B' : '#4ECDC4' 
    };
  });
}

// INS-02: Regla del 80% (Insight obligatorio)
export function generarAlertaPresupuesto(transactions: Transaction[]): Insight | null {
  const ingresos = calcularTotalPorTipo(transactions, 'INCOME');
  const gastos = calcularTotalPorTipo(transactions, 'EXPENSE');

  if (ingresos === 0) return null; // Evitar división por cero

  const porcentajeGastado = (gastos / ingresos) * 100;

  if (porcentajeGastado >= 80) {
    return {
      id: 'alerta-presupuesto-80',
      type: 'budget_warning',
      title: '¡Cuidado con tus gastos!',
      message: `Has gastado el ${porcentajeGastado.toFixed(1)}% de tus ingresos. Te queda poco margen.`,
      severity: 'warning'
    };
  }

  return null; // Retorna null si no se cumple la condición de la alerta
}