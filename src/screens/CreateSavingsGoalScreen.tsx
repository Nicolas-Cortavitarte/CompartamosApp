import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { createSavingsGoal } from '../services/savings.service';
import { AnimatedPressable } from '../components/atoms/AnimatedPressable';
import { SavingsDeadlinePicker } from '../components/molecules/SavingsDeadlinePicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CreateSavingsGoalScreen() {
    const navigation = useNavigation<NavigationProp>();

    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (saving) {
            return;
        }

        const trimmedName = name.trim();
        const normalizedAmount = targetAmount.trim().replace(',', '.');
        const amount = Number(normalizedAmount);

        if (!trimmedName) {
            Alert.alert('Campo obligatorio', 'Ingresa un nombre para tu meta.');
            return;
        }

        if (
            !normalizedAmount ||
            !/^\d+(\.\d{1,2})?$/.test(normalizedAmount) ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            Alert.alert(
                'Monto inválido',
                'Ingresa un monto positivo con máximo dos decimales.',
            );
            return;
        }

        try {
            setSaving(true);

            await createSavingsGoal({
                name: trimmedName,
                target_amount: amount,
                deadline,
            });

            navigation.goBack();
        } catch (error) {
            console.error('Error al crear meta:', error);

            Alert.alert(
                'No se pudo crear la meta',
                error instanceof Error
                    ? error.message
                    : 'Intenta nuevamente.',
            );
        } finally {
            setSaving(false);
        }
    };

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
                        accessibilityLabel="Volver a mis metas">
                        <Text style={styles.backIcon}>‹</Text>
                        <Text style={styles.title}>Nueva meta de ahorro</Text>
                    </TouchableOpacity>

                    <Text style={styles.subtitle}>
                        Define un objetivo y comienza a ahorrar a tu ritmo.
                    </Text>

                    <Text style={styles.label}>Nombre de la meta</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ej. Comprar herramientas"
                        placeholderTextColor={colors.textSecondary}
                        maxLength={80}
                    />

                    <Text style={styles.label}>Monto objetivo (S/)</Text>
                    <TextInput
                        style={styles.input}
                        value={targetAmount}
                        onChangeText={setTargetAmount}
                        placeholder="Ej. 1500.00"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                    />

                    <SavingsDeadlinePicker
                        value={deadline}
                        onChange={setDeadline}
                    />

                    <Text style={styles.helper}>
                        Puedes dejar la fecha vacía y ahorrar sin un plazo fijo.
                    </Text>

                    <AnimatedPressable
                        style={[
                            styles.submitButton,
                            saving && styles.disabledButton,
                        ]}
                        onPress={() => void handleCreate()}
                        disabled={saving}
                        accessibilityRole="button">
                        {saving ? (
                            <ActivityIndicator color={colors.surface} />
                        ) : (
                            <Text style={styles.submitText}>
                                Crear meta de ahorro
                            </Text>
                        )}
                    </AnimatedPressable>
                </ScrollView>
            </KeyboardAvoidingView>
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
