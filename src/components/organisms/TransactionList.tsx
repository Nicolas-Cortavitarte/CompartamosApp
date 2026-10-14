import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

import type { Category, Transaction } from '../../types/transactions.types';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { RootTabParamList } from '../../navigation/AppNavigator';

import { getTransactions } from '../../services/transactions.service';
import { getCategories } from '../../services/categories.service';

import { TransactionItem } from '../molecules/TransactionItem';
import { TransactionFilters } from '../molecules/TransactionFilters';
import { TransactionEmptyState } from '../molecules/TransactionEmptyState';
import type { TransactionPeriod } from '../molecules/TransactionFilters';

type TransactionFilter = 'ALL' | 'INCOME' | 'EXPENSE';

interface TransactionListProps {
  limit?: number;
  hideFilters?: boolean;
  transactions?: Transaction[];
}

export function TransactionList({
  limit,
  hideFilters = false,
  transactions: propTransactions,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<TransactionFilter>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedPeriod, setSelectedPeriod] =
    useState<TransactionPeriod>('LAST_MONTH');
  const activeTransactions = propTransactions ?? transactions;

  const loadTransactions = useCallback(async () => {
    try {
      setError('');

      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);

      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los movimientos.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!propTransactions) {
      void loadTransactions();
    } else {
      getCategories().then(setCategories).catch(console.error);
      setLoading(false);
    }
  }, [loadTransactions, propTransactions]);

  useEffect(() => {
    if (propTransactions !== undefined) {
      return;
    }

    const parentNavigation =
      navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

    if (!parentNavigation) {
      return;
    }

    const unsubscribe = parentNavigation.addListener('focus', () => {
      void loadTransactions();
    });

    return unsubscribe;
  }, [navigation, loadTransactions, propTransactions]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadTransactions();
  }

  function getCategoryName(categoryId: string): string {
    const category = categories.find(item => item.id === categoryId);

    return category?.name ?? 'Sin categoría';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);

  const daysToSubtract =
    selectedPeriod === 'LAST_MONTH' ? 29 : 89;

  startDate.setDate(startDate.getDate() - daysToSubtract);

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const startDateString = formatDate(startDate);
  const todayString = formatDate(today);

  const filteredTransactions = activeTransactions.filter(transaction => {
    const itemType = String(transaction.type || '').toUpperCase();
    const currentFilter = filter.toUpperCase();
    const matchesType = currentFilter === 'ALL' || itemType === currentFilter;

    const matchesCategory =
      !selectedCategoryId || transaction.category_id === selectedCategoryId;
    const transactionDate = transaction.date?.slice(0, 10) ?? '';

    const matchesPeriod =
      hideFilters ||
      (
        transactionDate >= startDateString &&
        transactionDate <= todayString
      );

    return matchesType && matchesCategory && matchesPeriod;
  });

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime(),
  );

  const displayTransactions = limit
    ? sortedTransactions.slice(0, limit)
    : sortedTransactions;

  const groupedTransactions = Object.entries(
    filteredTransactions.reduce<Record<string, Transaction[]>>(
      (groups, transaction) => {
        const date = transaction.date;

        if (!groups[date]) {
          groups[date] = [];
        }

        groups[date].push(transaction);

        return groups;
      },
      {},
    ),
  )
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, data]) => ({
      title: date,
      data,
    }));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.helper}>Cargando movimientos...</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      hideFilters && styles.containerWithoutPadding,
    ]}>
      {!hideFilters && (
        <>
          <Text style={styles.title}>Mis movimientos</Text>

          <Text style={styles.subtitle}>
            Cada ingreso y gasto, en un solo lugar.
          </Text>

          <View style={styles.filters}>
            {(
              [
                { value: 'ALL', label: 'Todos' },
                { value: 'INCOME', label: 'Ingresos' },
                { value: 'EXPENSE', label: 'Gastos' },
              ] as const
            ).map(option => {
              const selected = filter === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setFilter(option.value);
                    setSelectedCategoryId('');
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.filterButton,
                    selected && styles.filterSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.filterTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TransactionFilters
            categories={categories}
            type={filter}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>

          <Pressable onPress={loadTransactions}>
            <Text style={styles.retry}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {limit ? (
        <View>
          {displayTransactions.length === 0 && !error ? (
            <TransactionEmptyState
              filtered={activeTransactions.length > 0}
              onAddPress={() => {
                navigation.navigate('Agregar');
              }}
            />
          ) : (
            displayTransactions.map((item, index) => (
              <View key={item.id}>
                <TransactionItem
                  transaction={item}
                  categoryName={getCategoryName(item.category_id)}
                  onPress={() => {
                    const parentNavigation =
                      navigation.getParent<
                        NativeStackNavigationProp<RootStackParamList>
                      >();

                    parentNavigation?.navigate('TransactionDetail', {
                      transactionId: item.id,
                    });
                  }}
                />
                {index < displayTransactions.length - 1 && (
                  <View style={styles.separator} />
                )}
              </View>
            ))
          )}
        </View>
      ) : (
        <SectionList
          showsVerticalScrollIndicator={false}
          sections={groupedTransactions}
          keyExtractor={item => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>
              {formatSectionDate(section.title)}
            </Text>
          )}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              categoryName={getCategoryName(item.category_id)}
              onPress={() => {
                const parentNavigation =
                  navigation.getParent<
                    NativeStackNavigationProp<RootStackParamList>
                  >();

                parentNavigation?.navigate('TransactionDetail', {
                  transactionId: item.id,
                });
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            !error ? (
              <TransactionEmptyState
                filtered={activeTransactions.length > 0}
                onAddPress={() => {
                  navigation.navigate('Agregar');
                }}
              />
            ) : undefined
          }
        />
      )}
    </View>
  );
}

function formatSectionDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const formattedDate = date.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
  });

  if (date.getTime() === today.getTime()) {
    return `Hoy · ${formattedDate}`;
  }

  if (date.getTime() === yesterday.getTime()) {
    return `Ayer · ${formattedDate}`;
  }

  return date.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  center: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helper: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  filterTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.errorBackground,
    marginBottom: 16,
  },
  error: {
    fontSize: 13,
    color: colors.error,
  },
  retry: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  separator: {
    height: 12,
  },
  containerWithoutPadding: {
    paddingHorizontal: 0,
  },
});
