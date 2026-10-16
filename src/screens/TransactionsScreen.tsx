import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionList } from '../components/organisms/TransactionList';
import { colors } from '../theme/colors';
import { triggerSmartVoiceNotification } from '../services/notificationService';

export function TransactionsScreen() {
  const handleCohesiveAlert = () => {
    triggerSmartVoiceNotification(
      '⚠️ Alerta de Presupuesto',
      'Registraste un egreso elevado en Comida / Salidas.',
      '¡Atención! Has registrado un egreso elevado de doscientos soles en entretenimiento. Te queda el treinta por ciento de tu presupuesto mensual.',
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* Botón de prueba para la notificación con voz */}
      <TouchableOpacity style={styles.button} onPress={handleCohesiveAlert}>
        <Text style={styles.buttonText}>
          📢 Probar Alerta Inteligente con Voz
        </Text>
      </TouchableOpacity>

      <TransactionList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
