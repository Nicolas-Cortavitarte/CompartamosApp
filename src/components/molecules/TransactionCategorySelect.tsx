
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
import type { Category } from '../../types/transactions.types';

interface TransactionCategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}

export function TransactionCategorySelect({
  categories,
  value,
  onChange,
}: TransactionCategorySelectProps) {
  const [visible, setVisible] = useState(false);

  const selectedCategory = categories.find(
    category => category.id === value,
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Categoría</Text>

      <Pressable
        style={styles.selector}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.value,
            !selectedCategory && styles.placeholder,
          ]}
        >
          {selectedCategory?.name ?? 'Selecciona una categoría'}
        </Text>

        <Text style={styles.arrow}>⌄</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Selecciona una categoría
            </Text>

            <ScrollView>
              {categories.map(category => (
                <Pressable
                  key={category.id}
                  style={styles.option}
                  onPress={() => {
                    onChange(category.id);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setVisible(false)}
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
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  selector: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 14,
    color: colors.text,
  },
  placeholder: {
    color: colors.information,
  },
  arrow: {
    fontSize: 22,
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
    fontSize: 15,
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
