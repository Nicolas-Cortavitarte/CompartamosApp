import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

import { BalanceCard } from '../components/molecules/BalanceCard';
import { InsightCard } from '../components/molecules/InsightCard';

import { getTransactions } from '../services/transactions.service';
import type { Transaction } from '../types/transactions.types';
import { FinancialMetricCard } from '../components/molecules/FinancialMetricCard';
import { RecentTransactions } from '../components/organisms/RecentTransactions';
export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.error('Error al cargar datos en HomeScreen:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Recarga automática al volver de 'Agregar' o 'Editar'
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

  // Cálculo preciso de Ingresos, Gastos y Balance sumando datos reales de Supabase
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const currentBalance = totalIncome - totalExpense;

  // Cálculo de porcentajes para la sección de resumen del mes
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const isHighExpense = totalIncome > 0 && expenseRatio >= 80;

  const insightTitle = isHighExpense
    ? 'Tus gastos están aumentando'
    : '¡Buen control financiero!';

  const insightMessage =
    totalIncome === 0
      ? 'Aún no registras ingresos este mes. Comienza a registrar tus movimientos.'
      : isHighExpense
      ? `Tus egresos representan el ${Math.round(
          expenseRatio,
        )}% de tus ingresos. Vigila tus gastos de cerca.`
      : `Tus egresos están bajo control (${Math.round(
          expenseRatio,
        )}% de tus ingresos).`;

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.helper}>Cargando información del negocio...</Text>
      </View>
    );
  }

  return (
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
      {/* Encabezado superior */}
      <View style={styles.header}>
        <Text style={styles.topInfo}>MI NEGOCIO / OCTUBRE 2026</Text>
        <Text style={styles.title}>Hola 👋</Text>
        <Text style={styles.subtitle}>Así va tu negocio este mes</Text>
      </View>

      {/* Tarjeta principal de Balance */}
      <BalanceCard
        balance={currentBalance}
        income={totalIncome}
        expense={totalExpense}
      />

      {/* Botones separados de Ingresos y Gastos (Estilo Figma) */}
      <View style={styles.summaryButtonsRow}>
        <FinancialMetricCard
          label="↑ Ingresos"
          amount={totalIncome}
          type="INCOME"
        />
        <FinancialMetricCard
          label="↓ Gastos"
          amount={totalExpense}
          type="EXPENSE"
        />
      </View>

      {/* Sección Resumen del mes */}
      <Text style={styles.sectionMainTitle}>Resumen del mes</Text>
      <View style={styles.monthSummaryCard}>
        <View style={styles.monthHeaderRow}>
          <Text style={styles.monthTitle}>Octubre 2026</Text>
          <Text style={styles.monthCurrency}>En soles · S/</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryItemLabel}>Ingresos</Text>
          <Text style={styles.summaryItemValue}>
            S/ {totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFillIncome,
              { width: `${Math.min(100, 100)}%` },
            ]}
          />
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

      {/* Tarjeta de Alerta / Insight */}
      <InsightCard title={insightTitle} message={insightMessage} />

      {/* Sección Últimos Movimientos */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Últimos movimientos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Movimientos')}>
          <Text style={styles.seeAllText}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      <RecentTransactions />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
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
    marginBottom: 12,
  },
  topInfo: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
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
  summaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FDF2F4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCE7EC',
  },
  miniCardLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  miniCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  monthSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
