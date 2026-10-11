
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import type { TransactionType } from '../../types/transactions.types';

interface TransactionTypeButtonProps {
  type: TransactionType;
  selected: boolean;
  onPress: () => void;
}

export function TransactionTypeButton({
  type,
  selected,
  onPress,
}: TransactionTypeButtonProps) {
  const isIncome = type === 'INCOME';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.button,
        selected && styles.selectedButton,
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.icon,
            selected && styles.selectedText,
          ]}
        >
          {isIncome ? '↙' : '↗'}
        </Text>

        <Text
          style={[
            styles.label,
            selected && styles.selectedText,
          ]}
        >
          {isIncome ? 'Ingreso' : 'Gasto'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  selectedButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectedText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
