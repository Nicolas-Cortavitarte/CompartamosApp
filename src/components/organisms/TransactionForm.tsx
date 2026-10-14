import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import type {
  Category,
  Transaction,
  TransactionType,
} from '../../types/transactions.types';

import { getCategories } from '../../services/categories.service';
import { createTransaction, updateTransaction } from '../../services/transactions.service';

import { TransactionTypeButton } from '../atoms/TransactionTypeButton';
import { TransactionAmountInput } from '../atoms/TransactionAmountInput';
import { TransactionCategorySelect } from '../molecules/TransactionCategorySelect';
import { TransactionDatePicker } from '../molecules/TransactionDatePicker';
import { TransactionSuccessModal } from '../molecules/TransactionSuccessModal';

interface TransactionFormProps {
  transaction?: Transaction;
  onCreated?: () => void;
  onUpdated?: () => void;
}

export function TransactionForm({
  transaction,
  onCreated,
  onUpdated,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? 'EXPENSE',
  );

  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : '',
  );

  const [categoryId, setCategoryId] = useState(
    transaction?.category_id ?? '',
  );

  const [description, setDescription] = useState(
    transaction?.description ?? '',
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState<Date>(() => {
    if (!transaction) {
      return new Date();
    }

    const [year, month, day] = transaction.date
      .split('-')
      .map(Number);

    return new Date(year, month - 1, day);
  });
  const isEditing = Boolean(transaction);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const result = await getCategories();

        if (active) {
          setCategories(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar las categorías.',
          );
        }
      } finally {
        if (active) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const filteredCategories = categories.filter(
    category => category.type === type,
  );

  function changeType(nextType: TransactionType) {
    setType(nextType);
    setCategoryId('');
    setError('');
  }

  const handleSuccessFinished = useCallback(() => {
    setShowSuccess(false);

    if (isEditing) {
      onUpdated?.();
    } else {
      onCreated?.();
    }
  }, [isEditing, onUpdated, onCreated]);

  async function handleSubmit() {
    if (saving) {
      return;
    }

    const numericAmount = Number(amount);

    if (
      !amount.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError('Ingresa un monto válido mayor que cero.');
      return;
    }

    if (!categoryId) {
      setError('Selecciona una categoría.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const formattedDate = `${year}-${month}-${day}`;

      const transactionData = {
        type,
        amount: numericAmount,
        category_id: categoryId,
        description: description.trim() || null,
        date: formattedDate,
      };

      if (transaction) {
        await updateTransaction(transaction.id, transactionData);
      } else {
        await createTransaction(transactionData);

        setAmount('');
        setCategoryId('');
        setDescription('');
        setDate(new Date());
      }

      setShowSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : transaction
            ? 'No se pudo actualizar el movimiento.'
            : 'No se pudo registrar el movimiento.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TransactionSuccessModal
        visible={showSuccess}
        isEditing={isEditing}
        onFinished={handleSuccessFinished}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {isEditing ? 'Editar movimiento' : 'Nuevo movimiento'}
        </Text>

        <Text style={styles.subtitle}>
          Registra tus ingresos y gastos para llevar el control de tu dinero.
        </Text>

        <View style={styles.typeSelector}>
          <TransactionTypeButton
            type="INCOME"
            selected={type === 'INCOME'}
            onPress={() => changeType('INCOME')}
          />

          <TransactionTypeButton
            type="EXPENSE"
            selected={type === 'EXPENSE'}
            onPress={() => changeType('EXPENSE')}
          />
        </View>

        <TransactionAmountInput
          value={amount}
          onChangeText={setAmount}
        />

        {loadingCategories ? (
          <ActivityIndicator color={colors.primary} />
        ) : filteredCategories.length === 0 ? (
          <Text style={styles.helper}>
            No hay categorías disponibles para este tipo de movimiento.
          </Text>
        ) : (
          <TransactionCategorySelect
            categories={filteredCategories}
            value={categoryId}
            onChange={id => {
              setCategoryId(id);
              setError('');
            }}
          />
        )}

        <TransactionDatePicker
          value={date}
          onChange={setDate}
        />

        <View style={styles.descriptionHeader}>
          <Text style={styles.label}>Descripción</Text>
          <Text style={styles.optionalText}>Opcional</Text>
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Ej. Compra de productos al proveedor"
          placeholderTextColor={colors.information}
          style={styles.descriptionInput}
          maxLength={250}
          multiline
          numberOfLines={3}
        />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={saving || loadingCategories || filteredCategories.length === 0}
          style={[
            styles.saveButton,
            (saving || loadingCategories || filteredCategories.length === 0) &&
            styles.saveButtonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <View style={styles.saveButtonContent}>
              <Text style={styles.saveButtonIcon}>✓</Text>
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Guardar cambios' : 'Guardar movimiento'}
              </Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.footerHelper}>
          Tu balance se actualizará al guardar.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  helper: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  descriptionInput: {
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 13,
    color: colors.error,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonIcon: {
    fontSize: 17,
    color: colors.surface,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionalText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footerHelper: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
