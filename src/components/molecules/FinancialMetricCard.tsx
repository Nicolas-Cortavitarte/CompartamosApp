import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface FinancialMetricCardProps {
  label: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
}

export function FinancialMetricCard({
  label,
  amount,
  type,
}: FinancialMetricCardProps) {
  const isIncome = type === 'INCOME';

  const formattedAmount = amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>

      <Text
        style={[
          styles.value,
          { color: isIncome ? colors.income : colors.expense },
        ]}
        adjustsFontSizeToFit
        numberOfLines={1}
        minimumFontScale={0.7}
      >
        S/ {formattedAmount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
