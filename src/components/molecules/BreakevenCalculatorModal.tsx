import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors'; // Revisa si la ruta es ../theme/colors o ../../theme/colors
import { calculateDailyBreakeven } from '../../services/breakeven.service';
import type { BreakevenConfig } from '../../types/breakeven.types';

interface BreakevenCalculatorModalProps {
  visible: boolean;
  initialConfig: BreakevenConfig;
  onClose: () => void;
  onSave: (newConfig: BreakevenConfig) => void;
}

export function BreakevenCalculatorModal({
  visible,
  initialConfig,
  onClose,
  onSave,
}: BreakevenCalculatorModalProps) {
  const [fixedCosts, setFixedCosts] = useState('');
  const [margin, setMargin] = useState('');
  const [workingDays, setWorkingDays] = useState('26');

  // ⚠️ SOLUCIÓN AL PARPADEO: Cargar valores iniciales ÚNICAMENTE cuando el modal se abre
  useEffect(() => {
    if (visible) {
      setFixedCosts(
        initialConfig.monthlyFixedCosts > 0
          ? String(initialConfig.monthlyFixedCosts)
          : '',
      );
      setMargin(
        initialConfig.avgProfitMargin > 0
          ? String(initialConfig.avgProfitMargin)
          : '',
      );
      setWorkingDays(
        initialConfig.workingDaysPerMonth > 0
          ? String(initialConfig.workingDaysPerMonth)
          : '26',
      );
    }
  }, [visible]); // 👈 Quitamos 'initialConfig' del array de dependencias para cortar el bucle

  // Conversión numérica y cálculos en tiempo real
  const numCosts = parseFloat(fixedCosts) || 0;
  const numMargin = parseFloat(margin) || 0;
  const numDays = parseInt(workingDays, 10) || 1;

  const previewDailyTarget = calculateDailyBreakeven(
    numCosts,
    numMargin,
    numDays,
  );

  const handleSave = () => {
    const updatedConfig: BreakevenConfig = {
      monthlyFixedCosts: numCosts,
      avgProfitMargin: numMargin,
      workingDaysPerMonth: numDays,
      dailySalesTarget: previewDailyTarget,
      isConfigured: true,
    };
    onSave(updatedConfig);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Calculadora de Punto de Equilibrio</Text>
          <Text style={styles.subtitle}>
            Ingresa tus datos para calcular cuánto debes vender diariamente para
            cubrir tus costos fijos.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.form}>
            {/* Costos Fijos */}
            <Text style={styles.label}>Costos Fijos Mensuales (S/)</Text>
            <Text style={styles.helper}>
              Alquiler, sueldos, servicios (luz, agua, internet), etc.
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={fixedCosts}
              onChangeText={setFixedCosts}
              placeholder="Ej: 1200"
              placeholderTextColor="#9CA3AF"
            />

            {/* Margen de Ganancia */}
            <Text style={styles.label}>Margen de Ganancia Promedio (%)</Text>
            <Text style={styles.helper}>
              Ej: Si compras/produces a S/ 70 y vendes a S/ 100, tu margen es
              30%.
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={margin}
              onChangeText={setMargin}
              placeholder="Ej: 30"
              placeholderTextColor="#9CA3AF"
            />

            {/* Días Trabajados */}
            <Text style={styles.label}>Días Trabajados al Mes</Text>
            <Text style={styles.helper}>
              Días que abres tu negocio al mes (Ej: 26 días).
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={workingDays}
              onChangeText={setWorkingDays}
              placeholder="Ej: 26"
              placeholderTextColor="#9CA3AF"
            />

            {/* Vista Previa de Resultados */}
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>
                Tu Meta de Ventas Diarias:
              </Text>
              <Text style={styles.previewValue}>
                S/ {previewDailyTarget.toFixed(2)} / día
              </Text>
            </View>
          </ScrollView>

          {/* Botones de Acción */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (numCosts <= 0 || numMargin <= 0) && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={numCosts <= 0 || numMargin <= 0}
            >
              <Text style={styles.saveText}>Guardar Meta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  form: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
  },
  helper: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  previewCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  previewLabel: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3730A3',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '600',
    color: '#4B5563',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
