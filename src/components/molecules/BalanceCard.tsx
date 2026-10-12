import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface BalanceCardProps {
  balance: number;
  income?: number;
  expense?: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const formattedBalance = balance.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Balance actual</Text>
      </View>

      <Text style={styles.balanceAmount}>S/ {formattedBalance}</Text>

      <Text style={styles.subtext}>Ingresos menos gastos · Octubre 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.85,
  },
});
