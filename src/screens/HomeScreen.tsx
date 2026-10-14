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
import { InsightsCarousel } from '../components/organisms/InsightsCarousel';

import { getTransactions } from '../services/transactions.service';
import type { Transaction } from '../types/transactions.types';
import { FinancialMetricCard } from '../components/molecules/FinancialMetricCard';
import { RecentTransactions } from '../components/organisms/RecentTransactions';
import { SafeAreaView } from 'react-native-safe-area-context';


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
    .filter(t => t.type?.toUpperCase() === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type?.toUpperCase() === 'EXPENSE')
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

  const insights = [
    {
      id: 'balance',
      title: insightTitle,
      message: insightMessage,
    },
    {
      id: 'registro',
      title: 'Registra tus movimientos',
      message:
        'Registrar tus ingresos y gastos diariamente te ayuda a conocer mejor las finanzas de tu negocio.',
    },
    {
      id: 'ahorro',
      title: 'Construye un fondo de ahorro',
      message:
        'Cuando tengas dinero disponible, considera separar una parte para imprevistos o futuras inversiones.',
    },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.helper}>Cargando información del negocio...</Text>
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
        {/* Encabezado superior */}
        <View style={styles.header}>
          <Text style={styles.topInfo}>MI NEGOCIO</Text>
          <Text style={styles.title}>¡Hola! 👋</Text>
          <Text style={styles.subtitle}>
            Conoce cómo van las finanzas de tu negocio
          </Text>
        </View>

        {/* Tarjeta principal de Balance */}
        <BalanceCard balance={currentBalance} />

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

        {/* Tarjeta de Alerta / Insight */}
        <InsightsCarousel insights={insights} />

        {/* Sección Últimos Movimientos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          <TouchableOpacity
            onPress={() => {
              // Navega directamente a la pestaña 'Movimientos'
              (navigation as any).navigate('Movimientos');
            }}
          >
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <RecentTransactions transactions={transactions} />
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
