import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import type {
  Category,
  TransactionType,
} from '../../types/transactions.types';

interface TransactionFiltersProps {
  categories: Category[];
  type: 'ALL' | TransactionType;
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

interface FilterOption {
  label: string;
  value: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril',
  'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function TransactionFilters({
  categories,
  type,
  selectedCategoryId,
  onCategoryChange,
  selectedMonth,
  onMonthChange,
}: TransactionFiltersProps) {
  const [openFilter, setOpenFilter] = useState<
    'category' | 'month' | null
  >(null);

  const availableCategories = categories.filter(
    category => type === 'ALL' || category.type === type,
  );

  const categoryOptions: FilterOption[] = [
    { label: 'Todas las categorías', value: '' },
    ...availableCategories.map(category => ({
      label: category.name,
      value: category.id,
    })),
  ];

  const currentYear = new Date().getFullYear();

  const monthOptions: FilterOption[] = [
    { label: 'Todos los meses', value: '' },
    ...Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0');

      return {
        label: `${MONTH_NAMES[index]} ${currentYear}`,
        value: `${currentYear}-${month}`,
      };
    }).reverse(),
  ];

  const categoryLabel =
    categoryOptions.find(option => option.value === selectedCategoryId)
      ?.label ?? 'Todas las categorías';

  const monthLabel =
    monthOptions.find(option => option.value === selectedMonth)
      ?.label ?? 'Todos los meses';

  const options = openFilter === 'category'
    ? categoryOptions
    : monthOptions;

  function handleSelect(value: string) {
    if (openFilter === 'category') {
      onCategoryChange(value);
    } else if (openFilter === 'month') {
      onMonthChange(value);
    }

    setOpenFilter(null);
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.selector}
        onPress={() => setOpenFilter('category')}
        accessibilityRole="button"
      >
        <Text style={styles.selectorText} numberOfLines={1}>
          {categoryLabel}
        </Text>
        <Text style={styles.arrow}>⌄</Text>
      </Pressable>

      <Pressable
        style={styles.selector}
        onPress={() => setOpenFilter('month')}
        accessibilityRole="button"
      >
        <Text style={styles.selectorText} numberOfLines={1}>
          {monthLabel}
        </Text>
        <Text style={styles.arrow}>⌄</Text>
      </Pressable>

      <Modal
        visible={openFilter !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenFilter(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {openFilter === 'category'
                ? 'Selecciona una categoría'
                : 'Selecciona un mes'}
            </Text>

            <ScrollView>
              {options.map(option => (
                <Pressable
                  key={option.value}
                  style={styles.option}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={styles.optionText}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setOpenFilter(null)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  selector: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  selectorText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    maxHeight: '70%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  cancelButton: {
    paddingTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
