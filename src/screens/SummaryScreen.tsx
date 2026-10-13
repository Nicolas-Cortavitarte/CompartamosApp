import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

import { getTransactions } from '../services/transactions.service';
import { getCategories } from '../services/categories.service';
import type { Transaction, Category } from '../types/transactions.types';
import { SafeAreaView } from 'react-native-safe-area-context';

export function SummaryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setError] = useState('');

  // Selector de mes dinámico (por defecto el mes actual en formato YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [txData, catData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(txData || []);
      setCategories(catData || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar los datos del resumen.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Recargar al enfocar la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Generar lista de los últimos 6 meses
  const availableMonths = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Helper para formatear '2026-10' a 'Octubre 2026'
  const formatMonthLabel = (yyyyMm: string) => {
    const [year, month] = yyyyMm.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const monthName = date.toLocaleDateString('es-PE', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };

  // Filtrar transacciones por el mes seleccionado
  const monthlyTransactions = transactions.filter(t => {
    const dateString = String(t.date || '');
    return dateString.startsWith(selectedMonth);
  });

  // Cálculos principales con tolerancia a mayúsculas/minúsculas
  const totalIncome = monthlyTransactions
    .filter(t => t.type?.toUpperCase() === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = monthlyTransactions
    .filter(t => t.type?.toUpperCase() === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const balance = totalIncome - totalExpense;
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // Agrupación de gastos por categoría
  const expenseTransactions = monthlyTransactions.filter(
    t => t.type?.toUpperCase() === 'EXPENSE',
  );

  const categoryTotals = categories
    .map(cat => {
      const total = expenseTransactions
        .filter(t => t.category_id === cat.id)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const percentage =
        totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0;
      return {
        id: cat.id,
        name: cat.name,
        total,
        percentage,
      };
    })
    .filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  // Categoría principal (la de mayor gasto)
  const topCategory = categoryTotals.length > 0 ? categoryTotals[0] : null;

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.helper}>Cargando resumen financiero...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>Resumen</Text>
          <Text style={styles.subtitle}>Entiende cómo se mueve tu dinero.</Text>
        </View>

        {/* Selector de periodo interactiv con menú */}
        <TouchableOpacity
          style={styles.periodSelector}
          onPress={() => setIsMonthPickerVisible(!isMonthPickerVisible)}
        >
          <View style={styles.periodRow}>
            <Text style={styles.periodIcon}>📅</Text>
            <Text style={styles.periodLabel}>Mes seleccionado</Text>
          </View>
          <Text style={styles.periodDropdown}>
            {formatMonthLabel(selectedMonth)} ▾
          </Text>
        </TouchableOpacity>

        {/* Lista desplegable de meses */}
        {isMonthPickerVisible && (
          <View style={styles.monthPickerContainer}>
            {availableMonths.map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.monthPickerOption,
                  m === selectedMonth && styles.monthPickerOptionSelected,
                ]}
                onPress={() => {
                  setSelectedMonth(m);
                  setIsMonthPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.monthPickerText,
                    m === selectedMonth && styles.monthPickerTextSelected,
                  ]}
                >
                  {formatMonthLabel(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tarjetas de Ingresos y Gastos */}
        <View style={styles.cardsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>↑ Ingresos</Text>
            <Text style={[styles.metricValue, { color: '#D97706' }]}>
              S/ {totalIncome.toFixed(2)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>↓ Gastos</Text>
            <Text style={[styles.metricValue, { color: '#E11D48' }]}>
              S/ {totalExpense.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Tarjeta de Balance General */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceTitle}>Balance</Text>
          <Text style={styles.balanceValue}>S/ {balance.toFixed(2)}</Text>
        </View>

        {/* Progreso del Mes */}
        <View style={styles.monthSummaryCard}>
          <View style={styles.monthHeaderRow}>
            <Text style={styles.monthTitle}>
              {formatMonthLabel(selectedMonth)}
            </Text>
            <Text style={styles.monthCurrency}>En soles · S/</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryItemLabel}>Ingresos</Text>
            <Text style={styles.summaryItemValue}>
              S/ {totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFillIncome, { width: '100%' }]} />
          </View>

          <View style={[styles.summaryRow, { marginTop: 12 }]}>
            <Text style={styles.summaryItemLabel}>Gastos</Text>
            <Text style={styles.summaryItemValue}>
              S/ {totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFillExpense,
                { width: `${Math.min(100, expenseRatio)}%` },
              ]}
            />
          </View>

          <Text style={styles.summaryFooterText}>
            Tus gastos equivalen al {Math.round(expenseRatio)}% de tus ingresos.
          </Text>
        </View>

        {/* Sección: ¿En qué estás gastando? */}
        <Text style={styles.sectionTitle}>¿En qué estás gastando?</Text>
        <View style={styles.categoriesCard}>
          {categoryTotals.length === 0 ? (
            <Text style={styles.emptyCategories}>
              No hay gastos registrados en este mes.
            </Text>
          ) : (
            categoryTotals.map((cat, index) => (
              <View
                key={cat.id}
                style={[styles.categoryItem, index > 0 && styles.categoryDivider]}
              >
                <View style={styles.categoryRowTop}>
                  <Text style={styles.categoryNameText}>📦 {cat.name}</Text>
                  <Text style={styles.categoryAmountText}>
                    S/ {cat.total.toFixed(2)}{' '}
                    <Text style={styles.categoryPercentageText}>
                      ({cat.percentage}%)
                    </Text>
                  </Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFillExpense,
                      { width: `${cat.percentage}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Sección: Insights del mes */}
        <Text style={styles.sectionTitle}>Insights del mes</Text>

        <View
          style={[
            styles.insightBox,
            expenseRatio >= 80 ? styles.insightWarning : styles.insightNormal,
          ]}
        >
          <Text style={styles.insightTitleText}>
            {expenseRatio >= 80
              ? '⚠️ Tus gastos están aumentando significativamente.'
              : '✅ Tus gastos están bajo control.'}
          </Text>
          <Text style={styles.insightBodyText}>
            Este mes tus egresos representan el {Math.round(expenseRatio)}% de tus
            ingresos totales.
          </Text>
        </View>

        {topCategory && (
          <View style={styles.insightBoxNeutral}>
            <Text style={styles.insightTitleNeutral}>
              💡 {topCategory.name} representa el {topCategory.percentage}% de
              todos tus gastos.
            </Text>
          </View>
        )}

        <View style={styles.insightBoxSuccess}>
          <Text style={styles.insightTitleSuccess}>
            ✓ Tus ingresos siguen cubriendo tus egresos con éxito.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  helper: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  header: {
    marginTop: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodIcon: {
    fontSize: 16,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  periodDropdown: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  monthPickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  monthPickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  monthPickerOptionSelected: {
    backgroundColor: colors.primary + '15',
  },
  monthPickerText: {
    fontSize: 14,
    color: colors.text,
  },
  monthPickerTextSelected: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FDF2F4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCE7EC',
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  balanceContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  monthSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  monthCurrency: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryItemLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryItemValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFillIncome: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressBarFillExpense: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 3,
  },
  summaryFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    marginTop: 6,
  },
  categoriesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  categoryItem: {
    paddingVertical: 8,
  },
  categoryDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
  },
  categoryRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryAmountText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  categoryPercentageText: {
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  emptyCategories: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 12,
    fontSize: 13,
  },
  insightBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  insightWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  insightNormal: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  insightTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 4,
  },
  insightBodyText: {
    fontSize: 13,
    color: '#7F1D1D',
  },
  insightBoxNeutral: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  insightTitleNeutral: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  insightBoxSuccess: {
    backgroundColor: '#FDF2F4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCE7EC',
    marginBottom: 12,
  },
  insightTitleSuccess: {
    fontSize: 13,
    fontWeight: '600',
    color: '#BE185D',
  },
});
