import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface BalanceCardProps {
  balance: number;
  accumulatedBalance: number;
  reservedAmount: number;
}

function formatMoney(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${amount < 0 ? '- ' : ''}S/ ${formatted}`;
}

export function BalanceCard({
  balance,
  accumulatedBalance,
  reservedAmount,
}: BalanceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Balance disponible</Text>

      <Text
        style={styles.balanceAmount}
        adjustsFontSizeToFit
        numberOfLines={1}
        minimumFontScale={0.7}>
        {formatMoney(balance)}
      </Text>

      <View style={styles.footer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Balance acumulado
          </Text>

          <Text style={styles.detailAmount}>
            {formatMoney(accumulatedBalance)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Reservado en metas
          </Text>

          <Text style={styles.detailAmount}>
            {formatMoney(reservedAmount)}
          </Text>
        </View>

        {balance < 0 && (
          <Text style={styles.warningText}>
            ⚠️ Tu balance disponible es negativo. Revisa tus gastos y el dinero reservado en tus metas.
          </Text>
        )}
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
    minHeight: 170,
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
    marginBottom: 18,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    paddingTop: 14,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    color: colors.surface,
    fontSize: 12,
    opacity: 0.9,
    flexShrink: 1,
  },
  detailAmount: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  warningText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});
