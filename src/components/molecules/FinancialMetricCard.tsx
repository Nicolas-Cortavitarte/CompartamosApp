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
  const textColor = isIncome ? '#D97706' : '#E11D48';

  const formattedAmount = amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: textColor }]}>
        S/ {formattedAmount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FDF2F4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCE7EC',
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
