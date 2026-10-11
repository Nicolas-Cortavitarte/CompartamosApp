
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { colors } from '../../theme/colors';

interface TransactionDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function TransactionDatePicker({
  value,
  onChange,
}: TransactionDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = value.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  function handleDateChange(
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) {
    setShowPicker(false);

    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fecha</Text>

      <Pressable
        style={styles.input}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Seleccionar fecha del movimiento"
      >
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.icon}>▦</Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
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
  input: {
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
  dateText: {
    fontSize: 14,
    color: colors.text,
  },
  icon: {
    fontSize: 22,
    color: colors.textSecondary,
  },
});
