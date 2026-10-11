
import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Transaction } from '../types/transactions.types';

import { getTransactionById } from '../services/transactions.service';
import { TransactionForm } from '../components/organisms/TransactionForm';

import { colors } from '../theme/colors';

type EditScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditTransaction'
>;

export function EditTransactionScreen() {
  const navigation = useNavigation<EditScreenProps['navigation']>();
  const route = useRoute<EditScreenProps['route']>();

  const { transactionId } = route.params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransaction = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getTransactionById(transactionId);

      setTransaction(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el movimiento.',
      );
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useFocusEffect(
    useCallback(() => {
      void loadTransaction();
    }, [loadTransaction]),
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Editar movimiento
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>

          <Pressable onPress={loadTransaction}>
            <Text style={styles.retry}>Reintentar</Text>
          </Pressable>
        </View>
      ) : transaction ? (
        <TransactionForm
          key={transaction.id}
          transaction={transaction}
          onUpdated={() => navigation.goBack()}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 32,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
  retry: {
    color: colors.primary,
    fontWeight: '600',
  },
});
