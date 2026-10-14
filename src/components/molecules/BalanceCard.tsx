import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const formattedBalance = Math.abs(balance).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isNegative = balance < 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Balance actual</Text>

      <Text
        style={styles.balanceAmount}
        adjustsFontSizeToFit
        numberOfLines={1}
        minimumFontScale={0.7}
      >
        {isNegative ? '- ' : ''}S/ {formattedBalance}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.subtext}>
          Total de ingresos menos gastos registrados
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 22,
    marginVertical: 8,
    minHeight: 150,
    justifyContent: 'center',
  },
  label: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    paddingTop: 12,
  },
  subtext: {
    color: colors.surface,
    fontSize: 12,
    opacity: 0.9,
  },
});
