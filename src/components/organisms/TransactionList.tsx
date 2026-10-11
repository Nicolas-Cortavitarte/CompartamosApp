import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

import type {
  Category,
  Transaction,
} from '../../types/transactions.types';

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

type TransactionFilter = 'ALL' | 'INCOME' | 'EXPENSE';

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<TransactionFilter>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
  });

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
    loadTransactions();
  }, [loadTransactions]);


  useEffect(() => {
    const parentNavigation = navigation.getParent<
      NativeStackNavigationProp<RootStackParamList>
    >();

    if (!parentNavigation) {
      return;
    }

    const unsubscribe = parentNavigation.addListener(
      'focus',
      () => {
        void loadTransactions();
      },
    );

    return unsubscribe;
  }, [navigation, loadTransactions]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadTransactions();
  }

  function getCategoryName(categoryId: string): string {
    const category = categories.find(
      item => item.id === categoryId,
    );

    return category?.name ?? 'Sin categoría';
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType =
      filter === 'ALL' || transaction.type === filter;

    const matchesCategory =
      !selectedCategoryId ||
      transaction.category_id === selectedCategoryId;

    const matchesMonth =
      !selectedMonth ||
      transaction.date.startsWith(selectedMonth);

    return matchesType && matchesCategory && matchesMonth;
  });

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
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
        <Text style={styles.helper}>
          Cargando movimientos...
        </Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Mis movimientos
      </Text>

      <Text style={styles.subtitle}>
        Cada ingreso y gasto, en un solo lugar.
      </Text>

      <View style={styles.filters}>
        {([
          { value: 'ALL', label: 'Todos' },
          { value: 'INCOME', label: 'Ingresos' },
          { value: 'EXPENSE', label: 'Gastos' },
        ] as const).map(option => {
          const selected = filter === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => { setFilter(option.value); setSelectedCategoryId('') }}
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
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>

          <Pressable onPress={loadTransactions}>
            <Text style={styles.retry}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : null}

      <SectionList
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
              const parentNavigation = navigation.getParent<
                NativeStackNavigationProp<RootStackParamList>
              >();

              parentNavigation?.navigate('TransactionDetail', {
                transactionId: item.id,
              });
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          !error ? (
            <TransactionEmptyState
              filtered={transactions.length > 0}
              onAddPress={() => navigation.navigate('Agregar')}
            />
          ) : undefined
        }
      />
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
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  helper: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
});
