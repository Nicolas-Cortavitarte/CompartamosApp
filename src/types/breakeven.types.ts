export interface BreakevenConfig {
  monthlyFixedCosts: number; // Costos fijos mensuales (alquiler, luz, etc.)
  avgProfitMargin: number; // Margen de ganancia promedio (%)
  workingDaysPerMonth: number; // Días trabajados al mes
  dailySalesTarget: number; // Meta diaria de ventas calculada (S/)
  isConfigured: boolean; // 👇 Controla si el usuario ya ingresó sus datos
}

export interface BreakevenStatus {
  dailyBreakeven: number;
  todaySales: number;
  progressPercentage: number;
  isCovered: boolean;
}
