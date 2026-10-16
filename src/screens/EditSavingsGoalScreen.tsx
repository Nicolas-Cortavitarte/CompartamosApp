import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import type {
  RouteProp,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { SavingsGoalWithProgress } from '../types/savings.types';

import { colors } from '../theme/colors';
import {
  getSavingsGoalsWithProgress,
  updateSavingsGoal,
} from '../services/savings.service';

import {
  AppAlertModal,
  type AppAlertType,
} from '../components/molecules/AppAlertModal';

import { AnimatedPressable } from '../components/atoms/AnimatedPressable';
import { SavingsDeadlinePicker } from '../components/molecules/SavingsDeadlinePicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditRouteProp = RouteProp<RootStackParamList, 'EditSavingsGoal'>;

export function EditSavingsGoalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditRouteProp>();
  const { goalId } = route.params;

  const [goal, setGoal] = useState<SavingsGoalWithProgress | null>(null);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appAlert, setAppAlert] = useState<{
    type: AppAlertType;
    title: string;
    message: string;
  } | null>(null);

  const [updated, setUpdated] = useState(false);
  const [returnOnClose, setReturnOnClose] = useState(false);

  const showAlert = (
    type: AppAlertType,
    title: string,
    message: string,
  ) => {
    setAppAlert({ type, title, message });
  };

  const closeAlert = () => {
    setAppAlert(null);

    if (updated || returnOnClose) {
      navigation.goBack();
    }
  };

  const loadGoal = useCallback(async () => {
    try {
      setLoading(true);

      const goals = await getSavingsGoalsWithProgress();
      const currentGoal = goals.find(item => item.id === goalId);

      if (!currentGoal) {
        setReturnOnClose(true);

        showAlert(
          'warning',
          'Meta no encontrada',
          'No pudimos encontrar esta meta.',
        );

        return;
      }

      setGoal(currentGoal);
      setName(currentGoal.name);
      setTargetAmount(String(currentGoal.target_amount));
      setDeadline(currentGoal.deadline);
    } catch (error) {
      console.error('Error al cargar meta:', error);

      showAlert(
        'error',
        'No se pudo cargar la meta',
        error instanceof Error
          ? error.message
          : 'Intenta nuevamente.',
      );
    } finally {
      setLoading(false);
    }
  }, [goalId, navigation]);

  useFocusEffect(
    useCallback(() => {
      void loadGoal();
    }, [loadGoal]),
  );

  const handleSave = async () => {
    if (saving || !goal) return;

    const trimmedName = name.trim();
    const normalizedAmount = targetAmount.trim().replace(',', '.');
    const amount = Number(normalizedAmount);

    if (!trimmedName) {
      showAlert(
        'warning',
        'Campo obligatorio',
        'Ingresa un nombre para tu meta.',
      );
      return;
    }

    if (
      !normalizedAmount ||
      !/^\d+(\.\d{1,2})?$/.test(normalizedAmount) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      showAlert(
        'warning',
        'Monto inválido',
        'Ingresa un monto positivo con máximo dos decimales.',
      );
      return;
    }

    if (
      Math.round(amount * 100) <
      Math.round(goal.saved_amount * 100)
    ) {
      showAlert(
        'warning',
        'Monto objetivo inválido',
        'El monto objetivo no puede ser menor que el dinero ahorrado.',
      );
      return;
    }

    try {
      setSaving(true);

      await updateSavingsGoal(goalId, {
        name: trimmedName,
        target_amount: amount,
        deadline,
      });

      setUpdated(true);

      showAlert(
        'success',
        '¡Meta actualizada!',
        'Los cambios de tu meta se guardaron correctamente.',
      );
    } catch (error) {
      console.error('Error al editar meta:', error);

      showAlert(
        'error',
        'No se pudo actualizar la meta',
        error instanceof Error
          ? error.message
          : 'Intenta nuevamente.',
      );
    } finally {
      setSaving(false);
    }
  };

  const alertModal = (
    <AppAlertModal
      visible={appAlert !== null}
      type={appAlert?.type ?? 'warning'}
      title={appAlert?.title ?? ''}
      message={appAlert?.message ?? ''}
      confirmText="Entendido"
      onConfirm={closeAlert}
      onCancel={closeAlert}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando meta...</Text>
        {alertModal}
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <Text style={styles.loadingText}>
          No se pudo mostrar la meta.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Volver</Text>
        </TouchableOpacity>

        { alertModal }
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver al detalle de la meta">
            <Text style={styles.backIcon}>‹</Text>
            <Text style={styles.title}>Editar meta de ahorro</Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>
            Actualiza los datos de tu meta cuando lo necesites.
          </Text>

          <Text style={styles.label}>Nombre de la meta</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Comprar herramientas"
            placeholderTextColor={colors.textSecondary}
            maxLength={80}
            editable={!saving}
          />

          <Text style={styles.label}>Monto objetivo (S/)</Text>
          <TextInput
            style={styles.input}
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="Ej. 1500.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            editable={!saving}
          />

          <Text style={styles.savedInfo}>
            Dinero ahorrado actualmente: S/ {goal.saved_amount.toFixed(2)}
          </Text>

          <SavingsDeadlinePicker
            value={deadline}
            onChange={setDeadline}
          />

          <Text style={styles.helper}>
            Puedes modificar o quitar la fecha límite. El monto objetivo
            no puede ser menor que el dinero que ya tienes ahorrado.
          </Text>

          <AnimatedPressable
            style={[
              styles.submitButton,
              saving && styles.disabledButton,
            ]}
            onPress={() => void handleSave()}
            disabled={saving}
            accessibilityRole="button">
            {saving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitText}>Guardar cambios</Text>
            )}
          </AnimatedPressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {alertModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
  },
  backLink: {
    color: colors.primary,
    marginTop: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backIcon: {
    fontSize: 32,
    color: colors.text,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 18,
  },
  savedInfo: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 18,
  },
  helper: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
