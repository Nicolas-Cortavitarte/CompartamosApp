
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

import { colors } from '../../theme/colors';

interface TransactionAmountInputProps {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

export function TransactionAmountInput({
  value,
  onChangeText,
  error,
}: TransactionAmountInputProps) {
  function handleChangeText(text: string) {
    const normalized = text.replace(',', '.');

    if (/^\d*(\.\d{0,2})?$/.test(normalized)) {
      onChangeText(normalized);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Monto</Text>

      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
        ]}
      >
        <Text style={styles.currency}>S/</Text>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          placeholder="0.00"
          placeholderTextColor={colors.information}
          keyboardType="decimal-pad"
          accessibilityLabel="Monto en soles"
        />
      </View>

      <Text
        style={[
          styles.helperText,
          error ? styles.errorText : null,
        ]}
      >
        {error || 'Escribe el monto en soles.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 82,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  currency: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.textSecondary,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  helperText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
  },
});
