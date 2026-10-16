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
      'Registraste un egreso elevado.',
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
      <TransactionList />
    </SafeAreaView>
  );
}
