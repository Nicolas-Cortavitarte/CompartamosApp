import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

interface TransactionEmptyStateProps {
  filtered?: boolean;
  onAddPress?: () => void;
}

export function TransactionEmptyState({
  filtered = false,
  onAddPress,
}: TransactionEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>▤</Text>
      </View>

      <Text style={styles.title}>
        {filtered
          ? 'No encontramos movimientos'
          : 'Aún no tienes movimientos'}
      </Text>

      <Text style={styles.description}>
        {filtered
          ? 'Prueba con otros filtros para encontrar tus movimientos.'
          : 'Registra tu primer ingreso o gasto y empieza a llevar el control de tu dinero.'}
      </Text>

      {!filtered && onAddPress ? (
        <Pressable
          style={styles.button}
          onPress={onAddPress}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            + Registrar movimiento
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
    gap: 12,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.errorBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 36,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
});
