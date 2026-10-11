import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import type { Transaction } from '../../types/transactions.types';

interface TransactionItemProps {
  transaction: Transaction;
  categoryName: string;
  onPress?: () => void;
}

export function TransactionItem({
  transaction,
  categoryName,
  onPress,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'INCOME';

  const formattedAmount = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(transaction.amount);

  const title = transaction.description?.trim()
    || (isIncome ? 'Ingreso registrado' : 'Gasto registrado');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {isIncome ? '↙' : '↗'}
        </Text>
      </View>

      <View style={styles.details}>
        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text
          style={styles.category}
          numberOfLines={1}
        >
          {categoryName}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          {
            color: isIncome
              ? colors.income
              : colors.expense,
          },
        ]}
        numberOfLines={1}
      >
        {isIncome ? '+' : '-'} S/ {formattedAmount}
      </Text>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F9E5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  category: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 20,
    color: colors.information,
  },
});
