import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  AccessibilityInfo
} from 'react-native';
import { colors } from '../theme/colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

import { BalanceCard } from '../components/molecules/BalanceCard';
import { InsightsCarousel } from '../components/organisms/InsightsCarousel';

import { getTransactions } from '../services/transactions.service';
import type { Transaction } from '../types/transactions.types';
import { FinancialMetricCard } from '../components/molecules/FinancialMetricCard';
import { RecentTransactions } from '../components/organisms/RecentTransactions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSavingsBalanceSummary } from '../services/savings.service';
import type { SavingsBalanceSummary } from '../types/savings.types';


export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const requestIdRef = useRef(0);
  const balanceAnimation = useRef(new Animated.Value(0)).current;
  const metricsAnimation = useRef(new Animated.Value(0)).current;
  const [savingsBalance, setSavingsBalance] =
    useState<SavingsBalanceSummary | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;

    const startAnimation = async () => {
      const reduceMotion =
        await AccessibilityInfo.isReduceMotionEnabled();

      if (cancelled) {
        return;
      }

      if (reduceMotion) {
        balanceAnimation.setValue(1);
        metricsAnimation.setValue(1);
        return;
      }

      balanceAnimation.setValue(0);
      metricsAnimation.setValue(0);

      animation = Animated.stagger(120, [
        Animated.timing(balanceAnimation, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(metricsAnimation, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]);

      animation.start();
    };

    void startAnimation();

    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [loading, balanceAnimation, metricsAnimation]);



  const loadData = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    const isLatestRequest = () =>
      requestId === requestIdRef.current;

    setError(null);

    try {
      const transactionsData = await getTransactions();

      if (!isLatestRequest()) {
        return;
      }

      setTransactions(transactionsData);

      try {
        const balanceData = await getSavingsBalanceSummary(
          transactionsData,
        );

        if (!isLatestRequest()) {
          return;
        }

        setSavingsBalance(balanceData);
      } catch (savingsError) {
        if (!isLatestRequest()) {
          return;
        }

        console.error(
          'Error al cargar el balance de ahorro:',
          savingsError,
        );

        setSavingsBalance(null);

        setError(
          'Se cargaron tus movimientos, pero no pudimos consultar tus metas de ahorro.',
        );
      }
    } catch (transactionsError) {
      if (!isLatestRequest()) {
        return;
      }

      console.error(
        'Error al cargar las transacciones:',
        transactionsError,
      );

      setError(
        'No pudimos actualizar tus movimientos. Comprueba tu conexión e inténtalo nuevamente.',
      );
    } finally {
      if (isLatestRequest()) {
        setLoading(false);
        setRefreshing(false);
        setHasLoaded(true);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();

      return () => {
        requestIdRef.current += 1;
      };
    }, [loadData]),
  );

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

  if (loading && !hasLoaded) {
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

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              No pudimos actualizar toda tu información
            </Text>

            <Text style={styles.errorMessage}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadData()}
              accessibilityRole="button"
              accessibilityLabel="Reintentar carga de información">
              <Text style={styles.retryButtonText}>
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tarjeta principal de Balance */}
        <Animated.View
          style={{
            opacity: balanceAnimation,
            transform: [
              {
                translateY: balanceAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >

          {savingsBalance ? (
            <BalanceCard
              balance={savingsBalance.available_balance}
              accumulatedBalance={savingsBalance.accumulated_balance}
              reservedAmount={savingsBalance.reserved_amount}
            />
          ) : (
            <View style={styles.balanceUnavailable}>
              <Text style={styles.balanceUnavailableTitle}>
                Balance no disponible
              </Text>

              <Text style={styles.balanceUnavailableText}>
                No pudimos verificar cuánto dinero tienes
                reservado en tus metas.
              </Text>
            </View>
          )}
        </Animated.View>


        <TouchableOpacity
          style={styles.savingsAccess}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ir a mis metas de ahorro"
          onPress={() => navigation.navigate('SavingsGoals')}>
          <View style={styles.savingsAccessText}>
            <Text style={styles.savingsAccessTitle}>
              Mis metas de ahorro
            </Text>
            <Text style={styles.savingsAccessSubtitle}>
              Separa dinero para alcanzar tus objetivos
            </Text>
          </View>

          <Text style={styles.savingsAccessArrow}>›</Text>
        </TouchableOpacity>


        {/* Tarjetas de Ingresos y Gastos */}
        <Animated.View
          style={[
            styles.summaryButtonsRow,
            {
              opacity: metricsAnimation,
              transform: [
                {
                  translateY: metricsAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
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
        </Animated.View>

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

  savingsAccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 8,
  },
  savingsAccessText: {
    flex: 1,
    paddingRight: 12,
  },
  savingsAccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  savingsAccessSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  savingsAccessArrow: {
    fontSize: 28,
    color: colors.primary,
  },
  errorCard: {
    backgroundColor: colors.errorBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorTitle: {
    color: colors.error,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorMessage: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  balanceUnavailable: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    marginVertical: 8,
    minHeight: 150,
    justifyContent: 'center',
  },
  balanceUnavailableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  balanceUnavailableText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
