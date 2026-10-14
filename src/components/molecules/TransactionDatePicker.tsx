import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import { colors } from '../../theme/colors';

LocaleConfig.locales.es = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: [
    'Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.',
    'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.',
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado',
  ],
  dayNamesShort: [
    'Dom.', 'Lun.', 'Mar.', 'Mié.',
    'Jue.', 'Vie.', 'Sáb.',
  ],
  today: 'Hoy',
};

LocaleConfig.defaultLocale = 'es';

interface TransactionDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

function formatISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseISO(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function TransactionDatePicker({
  value,
  onChange,
}: TransactionDatePickerProps) {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatISO(value));

  const today = formatISO(new Date());

  const formattedDate = value.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  function openCalendar() {
    setSelectedDate(formatISO(value));
    setVisible(true);
  }

  function confirmDate() {
    onChange(parseISO(selectedDate));
    setVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fecha</Text>

      <Pressable
        style={styles.input}
        onPress={openCalendar}
        accessibilityRole="button"
        accessibilityLabel="Seleccionar fecha del movimiento"
      >
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.calendarIcon}>▦</Text>
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
              Seleccionar fecha
            </Text>

            <Text style={styles.modalSubtitle}>
              ¿Cuándo realizaste este movimiento?
            </Text>

            <Calendar
              key={selectedDate.slice(0, 7)}
              current={selectedDate}
              maxDate={today}
              firstDay={1}
              enableSwipeMonths
              onDayPress={day => {
                setSelectedDate(day.dateString);
              }}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: colors.primary,
                  selectedTextColor: colors.surface,
                },
              }}
              theme={{
                calendarBackground: colors.surface,
                backgroundColor: colors.surface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.surface,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.border,
                monthTextColor: colors.text,
                arrowColor: colors.primary,
                textDayFontSize: 15,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 12,
                textMonthFontWeight: '700',
              }}
              style={styles.calendar}
            />

            <View style={styles.actions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.cancelText}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={styles.confirmButton}
                onPress={confirmDate}
              >
                <Text style={styles.confirmText}>
                  Confirmar
                </Text>
              </Pressable>
            </View>
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
  calendarIcon: {
    fontSize: 22,
    color: colors.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(54, 21, 34, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    gap: 8,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  calendar: {
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: colors.surface,
    fontWeight: '700',
  },
});
