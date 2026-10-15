import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
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

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type {
    SavingsGoalWithProgress,
    SavingsMovement,
} from '../types/savings.types';

import {
    getSavingsGoalsWithProgress,
    getSavingsMovements,
    depositToSavingsGoal,
    getSavingsBalanceSummary,
    withdrawFromSavingsGoal,
    deleteSavingsGoal
} from '../services/savings.service';

import {
    AppAlertModal,
    type AppAlertType,
} from '../components/molecules/AppAlertModal';

import { colors } from '../theme/colors';
import { AnimatedPressable } from '../components/atoms/AnimatedPressable';

type DetailRoute = RouteProp<
    RootStackParamList,
    'SavingsGoalDetail'
>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatMoney(amount: number): string {
    const formatted = Math.abs(amount).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `${amount < 0 ? '- ' : ''}S/ ${formatted}`;
}

function formatDate(value: string): string {
    const date = new Date(value);

    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

export function SavingsGoalDetailScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<DetailRoute>();
    const { goalId } = route.params;

    const [goal, setGoal] =
        useState<SavingsGoalWithProgress | null>(null);

    const [movements, setMovements] =
        useState<SavingsMovement[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [depositVisible, setDepositVisible] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositing, setDepositing] = useState(false);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [withdrawVisible, setWithdrawVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [appAlert, setAppAlert] = useState<{
        type: AppAlertType;
        title: string;
        message: string;
    } | null>(null);

    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const showAlert = (
        type: AppAlertType,
        title: string,
        message: string,
    ) => {
        setAppAlert({ type, title, message });
    };

    const loadData = useCallback(async () => {
        try {
            setError(null);

            const [goalsData, movementsData, balanceData] = await Promise.all([
                getSavingsGoalsWithProgress(),
                getSavingsMovements(goalId),
                getSavingsBalanceSummary(),
            ]);

            setAvailableBalance(balanceData.available_balance);

            const selectedGoal =
                goalsData.find(item => item.id === goalId) ?? null;

            if (!selectedGoal) {
                throw new Error('No se encontró la meta seleccionada.');
            }

            setGoal(selectedGoal);
            setMovements(movementsData);
        } catch (err) {
            console.error('Error al cargar detalle de meta:', err);
            setError('No se pudo cargar la información de esta meta.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [goalId]);

    useFocusEffect(
        useCallback(() => {
            void loadData();
        }, [loadData]),
    );

    const onRefresh = () => {
        setRefreshing(true);
        void loadData();
    };


    const handleDeposit = async () => {
        if (!goal || depositing) {
            return;
        }

        const normalizedAmount = depositAmount.trim().replace(',', '.');
        const amount = Number(normalizedAmount);

        // Validar que el monto sea positivo y tenga máximo dos decimales
        if (
            !/^\d+(\.\d{1,2})?$/.test(normalizedAmount) ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            setDepositVisible(false);

            showAlert(
                'warning',
                'Monto inválido',
                'Ingresa un monto positivo con máximo dos decimales.',
            );

            return;
        }

        const remaining = Number(goal.remaining_amount);
        const available = Number(availableBalance);

        // Validar que el aporte no supere lo que falta para la meta
        if (amount > remaining) {
            setDepositVisible(false);

            showAlert(
                'warning',
                'Monto excedido',
                'El aporte no puede superar lo que falta para completar tu meta.',
            );

            return;
        }

        // Validar que exista suficiente saldo disponible
        if (amount > available) {
            setDepositVisible(false);

            showAlert(
                'warning',
                'Saldo insuficiente',
                'No tienes suficiente balance disponible para realizar este aporte.',
            );

            return;
        }

        try {
            setDepositing(true);

            await depositToSavingsGoal(goalId, amount);

            setDepositVisible(false);
            setDepositAmount('');

            await loadData();

            showAlert(
                'success',
                '¡Aporte realizado!',
                'Tu dinero se reservó correctamente para esta meta.',
            );
        } catch (err) {
            console.error('Error al aportar a la meta:', err);

            setDepositVisible(false);

            showAlert(
                'error',
                'No se pudo realizar el aporte',
                err instanceof Error
                    ? err.message
                    : 'Intenta nuevamente.',
            );
        } finally {
            setDepositing(false);
        }
    };


    const handleWithdrawal = async () => {
        if (!goal || withdrawing) {
            return;
        }

        const normalizedAmount = withdrawAmount.trim().replace(',', '.');
        const amount = Number(normalizedAmount);

        // Validar que el monto sea positivo
        if (
            !/^\d+(\.\d{1,2})?$/.test(normalizedAmount) ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            setWithdrawVisible(false);

            showAlert(
                'warning',
                'Monto inválido',
                'Ingresa un monto positivo con máximo dos decimales.',
            );

            return;
        }

        // Validar que no retire más dinero del ahorrado
        if (Math.round(amount * 100) > Math.round(goal.saved_amount * 100)) {
            setWithdrawVisible(false);

            showAlert(
                'warning',
                'Monto excedido',
                'No puedes retirar más dinero del que tienes ahorrado en esta meta.',
            );

            return;
        }

        try {
            setWithdrawing(true);

            await withdrawFromSavingsGoal(goalId, amount);

            setWithdrawVisible(false);
            setWithdrawAmount('');

            await loadData();

            showAlert(
                'success',
                '¡Retiro realizado!',
                'El dinero volvió a tu balance disponible.',
            );
        } catch (err) {
            console.error('Error al retirar dinero:', err);

            setWithdrawVisible(false);

            showAlert(
                'error',
                'No se pudo realizar el retiro',
                err instanceof Error
                    ? err.message
                    : 'Intenta nuevamente.',
            );
        } finally {
            setWithdrawing(false);
        }
    };

    const [deleting, setDeleting] = useState(false);


    const handleDelete = () => {
        if (!goal || deleting) {
            return;
        }

        if (Math.round(goal.saved_amount * 100) > 0) {
            showAlert(
                'warning',
                'No puedes eliminar esta meta',
                'Primero debes retirar todo el dinero ahorrado en esta meta.',
            );
            return;
        }

        setDeleteConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (!goal || deleting) {
            return;
        }

        try {
            setDeleting(true);

            await deleteSavingsGoal(goalId);

            setDeleteConfirmVisible(false);
            navigation.goBack();
        } catch (err) {
            console.error('Error al eliminar meta:', err);

            setDeleteConfirmVisible(false);
            showAlert(
                'error',
                'No se pudo eliminar la meta',
                err instanceof Error ? err.message : 'Intenta nuevamente.',
            );
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.helper}>Cargando tu meta...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                    />
                }>


                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button">
                        <Text style={styles.backIcon}>‹</Text>
                        <Text style={styles.backText}>Mis metas</Text>
                    </TouchableOpacity>

                    {goal && (
                        <AnimatedPressable
                            containerStyle={styles.optionsButtonContainer}
                            style={styles.optionsButton}
                            onPress={() => setOptionsVisible(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Opciones de la meta">
                            <Text style={styles.optionsIcon}>⋮</Text>
                        </AnimatedPressable>
                    )}
                </View>


                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => void loadData()}>
                            <Text style={styles.retryText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {goal && (
                    <>
                        <Modal
                            visible={optionsVisible}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setOptionsVisible(false)}>
                            <View style={styles.optionsOverlay}>
                                <TouchableOpacity
                                    style={styles.optionsBackdrop}
                                    activeOpacity={1}
                                    onPress={() => setOptionsVisible(false)}
                                    accessibilityLabel="Cerrar opciones"
                                />

                                <View style={styles.optionsMenu}>
                                    <Text style={styles.optionsTitle}>
                                        Opciones de la meta
                                    </Text>

                                    <AnimatedPressable
                                        style={styles.optionsItem}
                                        onPress={() => {
                                            setOptionsVisible(false);

                                            navigation.navigate('EditSavingsGoal', {
                                                goalId,
                                            });
                                        }}>
                                        <Text style={styles.optionsItemText}>
                                            ✎  Editar meta
                                        </Text>
                                    </AnimatedPressable>

                                    <View style={styles.optionsDivider} />

                                    <AnimatedPressable
                                        style={styles.optionsItem}
                                        disabled={deleting}
                                        onPress={() => {
                                            setOptionsVisible(false);

                                            setTimeout(() => {
                                                handleDelete();
                                            }, 350);
                                        }}>
                                        <Text style={styles.optionsDeleteText}>
                                            🗑  Eliminar meta
                                        </Text>
                                    </AnimatedPressable>
                                </View>
                            </View>
                        </Modal>

                        <Text style={styles.title}>{goal.name}</Text>

                        {goal.deadline && (
                            <Text style={styles.deadline}>
                                Fecha límite: {formatDate(`${goal.deadline}T12:00:00`)}
                            </Text>
                        )}

                        <View style={styles.progressCard}>
                            <Text style={styles.cardLabel}>Dinero ahorrado</Text>

                            <Text style={styles.savedAmount}>
                                {formatMoney(goal.saved_amount)}
                            </Text>

                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>
                                    {Math.round(goal.progress_percentage)}% completado
                                </Text>

                                <Text style={styles.targetText}>
                                    {formatMoney(Number(goal.target_amount))}
                                </Text>
                            </View>

                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${Math.min(
                                                100,
                                                Math.max(0, goal.progress_percentage),
                                            )}%`,
                                        },
                                    ]}
                                />
                            </View>

                            <Text style={styles.remainingText}>
                                {goal.remaining_amount > 0
                                    ? `Te faltan ${formatMoney(goal.remaining_amount)} para alcanzar tu objetivo.`
                                    : '¡Felicitaciones! Alcanzaste tu meta de ahorro.'}
                            </Text>
                        </View>


                        <View style={styles.savingsActions}>
                            <AnimatedPressable
                                containerStyle={styles.savingsActionContainer}
                                style={[
                                    styles.depositButton,
                                    goal.remaining_amount <= 0 && styles.disabledButton,
                                ]}
                                disabled={goal.remaining_amount <= 0}
                                onPress={() => {
                                    setDepositAmount('');
                                    setDepositVisible(true);
                                }}>
                                <Text style={styles.depositButtonText}>
                                    + Aportar
                                </Text>
                            </AnimatedPressable>

                            <AnimatedPressable
                                containerStyle={styles.savingsActionContainer}
                                style={[
                                    styles.withdrawButton,
                                    goal.saved_amount <= 0 && styles.disabledButton,
                                ]}
                                disabled={goal.saved_amount <= 0}
                                onPress={() => {
                                    setWithdrawAmount('');
                                    setWithdrawVisible(true);
                                }}>
                                <Text style={styles.withdrawButtonText}>
                                    Retirar
                                </Text>
                            </AnimatedPressable>
                        </View>

                        <Modal
                            visible={depositVisible}
                            transparent
                            animationType="fade"
                            onRequestClose={() => {
                                if (!depositing) {
                                    setDepositVisible(false);
                                }
                            }}>
                            <KeyboardAvoidingView
                                style={styles.modalOverlay}
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>
                                        Aportar a mi meta
                                    </Text>

                                    <Text style={styles.modalSubtitle}>
                                        Separa dinero de tu balance disponible.
                                    </Text>

                                    <View style={styles.depositInfo}>
                                        <Text style={styles.depositInfoText}>
                                            Disponible: {formatMoney(availableBalance)}
                                        </Text>

                                        <Text style={styles.depositInfoText}>
                                            Falta ahorrar: {formatMoney(goal.remaining_amount)}
                                        </Text>
                                    </View>

                                    <Text style={styles.depositLabel}>
                                        Monto del aporte (S/)
                                    </Text>

                                    <TextInput
                                        style={styles.depositInput}
                                        value={depositAmount}
                                        onChangeText={setDepositAmount}
                                        keyboardType="decimal-pad"
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textSecondary}
                                        editable={!depositing}
                                    />

                                    <View style={styles.modalActions}>
                                        <AnimatedPressable
                                            containerStyle={styles.buttonContainer}
                                            style={styles.cancelButton}
                                            disabled={depositing}
                                            onPress={() => setDepositVisible(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>
                                                Cancelar
                                            </Text>
                                        </AnimatedPressable>

                                        <AnimatedPressable
                                            containerStyle={styles.buttonContainer}
                                            style={[
                                                styles.confirmButton,
                                                depositing && styles.disabledButton,
                                            ]}
                                            disabled={depositing}
                                            onPress={() => void handleDeposit()}
                                        >
                                            {depositing ? (
                                                <ActivityIndicator color={colors.surface} />
                                            ) : (
                                                <Text style={styles.confirmButtonText}>
                                                    Confirmar
                                                </Text>
                                            )}
                                        </AnimatedPressable>
                                    </View>

                                </View>
                            </KeyboardAvoidingView>
                        </Modal>

                        <Modal
                            visible={withdrawVisible}
                            transparent
                            animationType="fade"
                            onRequestClose={() => {
                                if (!withdrawing) {
                                    setWithdrawVisible(false);
                                }
                            }}>
                            <KeyboardAvoidingView
                                style={styles.modalOverlay}
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>
                                        Retirar de mi meta
                                    </Text>

                                    <Text style={styles.modalSubtitle}>
                                        El dinero retirado volverá a tu balance disponible.
                                    </Text>

                                    <View style={styles.depositInfo}>
                                        <Text style={styles.depositInfoText}>
                                            Ahorrado en esta meta: {formatMoney(goal.saved_amount)}
                                        </Text>
                                    </View>

                                    <Text style={styles.depositLabel}>
                                        Monto del retiro (S/)
                                    </Text>

                                    <TextInput
                                        style={styles.depositInput}
                                        value={withdrawAmount}
                                        onChangeText={setWithdrawAmount}
                                        keyboardType="decimal-pad"
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textSecondary}
                                        editable={!withdrawing}
                                    />

                                    <View style={styles.modalActions}>
                                        <AnimatedPressable
                                            containerStyle={styles.buttonContainer}
                                            style={styles.cancelButton}
                                            disabled={withdrawing}
                                            onPress={() => setWithdrawVisible(false)}>
                                            <Text style={styles.cancelButtonText}>
                                                Cancelar
                                            </Text>
                                        </AnimatedPressable>

                                        <AnimatedPressable
                                            containerStyle={styles.buttonContainer}
                                            style={[
                                                styles.confirmButton,
                                                withdrawing && styles.disabledButton,
                                            ]}
                                            disabled={withdrawing}
                                            onPress={() => void handleWithdrawal()}>
                                            {withdrawing ? (
                                                <ActivityIndicator color={colors.surface} />
                                            ) : (
                                                <Text style={styles.confirmButtonText}>
                                                    Confirmar
                                                </Text>
                                            )}
                                        </AnimatedPressable>
                                    </View>
                                </View>
                            </KeyboardAvoidingView>
                        </Modal>

                        <Text style={styles.sectionTitle}>
                            Historial de ahorro
                        </Text>

                        {movements.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>
                                    Todavía no tienes movimientos
                                </Text>
                                <Text style={styles.emptyDescription}>
                                    Cuando realices tu primer aporte, aparecerá aquí.
                                </Text>
                            </View>
                        ) : (
                            movements.map(movement => (
                                <View key={movement.id} style={styles.movementCard}>
                                    <View style={styles.movementInfo}>
                                        <Text style={styles.movementTitle}>
                                            {movement.type === 'DEPOSIT'
                                                ? 'Aporte a la meta'
                                                : 'Retiro de la meta'}
                                        </Text>

                                        <Text style={styles.movementDate}>
                                            {formatDate(movement.created_at)}
                                        </Text>
                                    </View>

                                    <Text
                                        style={[
                                            styles.movementAmount,
                                            movement.type === 'WITHDRAWAL' &&
                                            styles.withdrawalAmount,
                                        ]}>
                                        {movement.type === 'DEPOSIT' ? '+' : '-'}
                                        {formatMoney(Number(movement.amount))}
                                    </Text>
                                </View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>

            <AppAlertModal
                visible={appAlert !== null}
                type={appAlert?.type ?? 'warning'}
                title={appAlert?.title ?? ''}
                message={appAlert?.message ?? ''}
                confirmText="Entendido"
                onConfirm={() => setAppAlert(null)}
                onCancel={() => setAppAlert(null)}
            />

            <AppAlertModal
                visible={deleteConfirmVisible}
                type="confirm"
                title="¿Eliminar meta?"
                message={`¿Estás seguro de que deseas eliminar "${goal?.name ?? 'esta meta'}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                loading={deleting}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteConfirmVisible(false)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    helper: {
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 8,
    },
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    backIcon: {
        fontSize: 30,
        color: colors.primary,
        marginRight: 8,
    },
    backText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    deadline: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 20,
    },
    progressCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 28,
    },
    cardLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    savedAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 8,
        marginBottom: 22,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    targetText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    progressTrack: {
        height: 10,
        backgroundColor: colors.errorBackground,
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    remainingText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 14,
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 24,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 19,
    },
    movementCard: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    movementInfo: {
        flex: 1,
    },
    movementTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    movementDate: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    movementAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.primary,
    },
    withdrawalAmount: {
        color: colors.expense,
    },
    errorBox: {
        backgroundColor: colors.errorBackground,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    errorText: {
        color: colors.error,
        fontSize: 13,
    },
    retryText: {
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 8,
    },
    depositButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center'
    },
    depositButtonText: {
        color: colors.surface,
        fontSize: 15,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(54,21,34,0.45)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 22,
        padding: 20,
    },
    modalTitle: {
        fontSize: 21,
        fontWeight: 'bold',
        color: colors.text,
    },
    modalSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 6,
        marginBottom: 18,
    },
    depositInfo: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        gap: 8,
        marginBottom: 18,
    },
    depositInfoText: {
        fontSize: 13,
        color: colors.text,
    },
    depositLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    depositInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: colors.text,
        fontSize: 16,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },

    buttonContainer: {
        flex: 1,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        minHeight: 46,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.text,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        minHeight: 46,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: colors.surface,
        fontWeight: 'bold',
    },
    savingsActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    savingsActionContainer: {
        flex: 1,
    },
    withdrawButton: {
        minHeight: 50,
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    withdrawButtonText: {
        color: colors.expense,
        fontSize: 15,
        fontWeight: 'bold',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    optionsButtonContainer: {
        borderRadius: 12,
    },
    optionsButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsIcon: {
        color: colors.text,
        fontSize: 26,
        fontWeight: 'bold',
        lineHeight: 30,
    },
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(54,21,34,0.35)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 75,
        paddingHorizontal: 16,
    },
    optionsBackdrop: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    optionsMenu: {
        width: 220,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 6,
    },
    optionsTitle: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    optionsItem: {
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderRadius: 10,
    },
    optionsItemText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    optionsDeleteText: {
        color: colors.expense,
        fontSize: 14,
        fontWeight: '600',
    },
    optionsDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 8,
    },
});
