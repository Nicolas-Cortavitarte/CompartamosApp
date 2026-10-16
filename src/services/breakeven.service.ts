import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BreakevenConfig,
  BreakevenStatus,
} from '../types/breakeven.types';
import type { Transaction } from '../types/transactions.types';

const BREAKEVEN_STORAGE_KEY = '@CuadramosApp:breakeven_config';

// Estado inicial cuando la app se instala por primera vez
export const INITIAL_UNCONFIGURED_CONFIG: BreakevenConfig = {
  monthlyFixedCosts: 0,
  avgProfitMargin: 0,
  workingDaysPerMonth: 26, // Valor por defecto amigable para días laborables
  dailySalesTarget: 0,
  isConfigured: false, // 👈 Marca que está sin configurar
};

export function calculateDailyBreakeven(
  monthlyCosts: number,
  profitMarginPercent: number,
  workingDays: number,
): number {
  if (workingDays <= 0 || profitMarginPercent <= 0) return 0;
  const monthlySalesNeeded = monthlyCosts / (profitMarginPercent / 100);
  return monthlySalesNeeded / workingDays;
}

export async function getBreakevenConfig(): Promise<BreakevenConfig> {
  try {
    const jsonValue = await AsyncStorage.getItem(BREAKEVEN_STORAGE_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue) as BreakevenConfig;
    }
  } catch (e) {
    console.error('Error al leer configuración:', e);
  }
  return INITIAL_UNCONFIGURED_CONFIG;
}

export async function saveBreakevenConfig(
  config: BreakevenConfig,
): Promise<void> {
  try {
    const dataToSave = { ...config, isConfigured: true };
    await AsyncStorage.setItem(
      BREAKEVEN_STORAGE_KEY,
      JSON.stringify(dataToSave),
    );
  } catch (e) {
    console.error('Error al guardar configuración:', e);
  }
}

export function evaluateDailyStatus(
  transactions: Transaction[],
  config: BreakevenConfig,
): BreakevenStatus {
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = transactions
    .filter(t => t.type === 'INCOME' && t.date === todayStr)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const dailyBreakeven = calculateDailyBreakeven(
    config.monthlyFixedCosts,
    config.avgProfitMargin,
    config.workingDaysPerMonth,
  );

  const progressPercentage =
    dailyBreakeven > 0
      ? Math.min(Math.round((todaySales / dailyBreakeven) * 100), 100)
      : 0;

  return {
    dailyBreakeven,
    todaySales,
    progressPercentage,
    isCovered: todaySales >= dailyBreakeven,
  };
}
