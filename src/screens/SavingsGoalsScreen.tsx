import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

import { colors } from '../theme/colors';

import {
    getSavingsBalanceSummary,
    getSavingsGoalsWithProgress,
} from '../services/savings.service';

import type {
    SavingsBalanceSummary,
    SavingsGoalWithProgress,
} from '../types/savings.types';

const formatMoney = (amount: number) =>
    `S/ ${Math.abs(amount).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export function SavingsGoalsScreen() {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [goals, setGoals] = useState<SavingsGoalWithProgress[]>([]);
    const [summary, setSummary] =
        useState<SavingsBalanceSummary | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setError(null);

            const [goalsData, summaryData] = await Promise.all([
                getSavingsGoalsWithProgress(),
                getSavingsBalanceSummary(),
            ]);

            setGoals(goalsData);
            setSummary(summaryData);
        } catch (err) {
            console.error('Error al cargar metas:', err);
            setError('No pudimos cargar tus metas. Intenta nuevamente.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            void loadData();
        }, [loadData]),
    );

    const onRefresh = () => {
        setRefreshing(true);
        void loadData();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.helper}>Cargando tus metas...</Text>
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

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Volver al inicio">
                    <Text style={styles.backIcon}>‹</Text>
                    <Text style={styles.title}>Mis metas de ahorro</Text>
                </TouchableOpacity>

                <Text style={styles.subtitle}>
                    Organiza tus ahorros y alcanza tus objetivos.
                </Text>

                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => void loadData()}>
                            <Text style={styles.retryText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {summary && (
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>Balance disponible</Text>

                        <Text style={styles.balanceAmount}>
                            {summary.available_balance < 0 ? '- ' : ''}
                            {formatMoney(summary.available_balance)}
                        </Text>

                        <View style={styles.balanceDivider} />

                        <View style={styles.balanceRow}>
                            <View style={styles.balanceColumn}>
                                <Text style={styles.balanceDetailLabel}>
                                    Balance acumulado
                                </Text>
                                <Text style={styles.balanceDetailValue}>
                                    {summary.accumulated_balance < 0 ? '- ' : ''}
                                    {formatMoney(summary.accumulated_balance)}
                                </Text>
                            </View>

                            <View style={styles.balanceColumn}>
                                <Text style={styles.balanceDetailLabel}>
                                    Dinero reservado
                                </Text>
                                <Text style={styles.balanceDetailValue}>
                                    {formatMoney(summary.reserved_amount)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {summary && summary.available_balance < 0 && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            Tu balance disponible es negativo. Revisa tus gastos
                            y el dinero reservado en tus metas.
                        </Text>
                    </View>
                )}


                {/* Sección de metas */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Mis objetivos</Text>

                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreateSavingsGoal')}
                        accessibilityRole="button">
                        <Text style={styles.createButtonText}>
                            + Nueva meta
                        </Text>
                    </TouchableOpacity>
                </View>

                {goals.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <LottieView
                            source={require('../assets/animations/Piggy-bank.json')}
                            autoPlay
                            loop
                            style={styles.emptyAnimation}
                        />

                        <Text style={styles.emptyTitle}>
                            Aún no tienes metas de ahorro
                        </Text>

                        <Text style={styles.emptyDescription}>
                            Crea tu primera meta para comenzar a reservar dinero
                            para tus objetivos.
                        </Text>
                    </View>
                ) : (
                    goals.map(goal => (
                        <TouchableOpacity
                            key={goal.id}
                            style={styles.goalCard}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={`Ver detalle de ${goal.name}`}
                            onPress={() =>
                                navigation.navigate('SavingsGoalDetail', {
                                    goalId: goal.id,
                                })
                            }>

                            <View style={styles.goalHeader}>
                                <Text style={styles.goalName}>
                                    {goal.name}
                                </Text>

                                <Text style={styles.goalPercentage}>
                                    {Math.round(goal.progress_percentage)}%
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

                            <View style={styles.goalAmounts}>
                                <Text style={styles.goalAmountText}>
                                    {formatMoney(goal.saved_amount)} ahorrados
                                </Text>

                                <Text style={styles.goalAmountText}>
                                    Meta: {formatMoney(Number(goal.target_amount))}
                                </Text>
                            </View>

                            {goal.progress_percentage >= 100 && (
                                <Text style={styles.completedText}>
                                    ¡Meta alcanzada!
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))
                )}

            </ScrollView>
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
        marginTop: 8,
        color: colors.textSecondary,
        fontSize: 14,
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
        marginBottom: 20,
    },
    balanceCard: {
        backgroundColor: colors.primary,
        borderRadius: 20,
        padding: 22,
        marginBottom: 20,
    },
    balanceLabel: {
        color: colors.surface,
        fontSize: 14,
        opacity: 0.9,
    },
    balanceAmount: {
        color: colors.surface,
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 8,
    },
    balanceDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginVertical: 16,
    },
    balanceRow: {
        flexDirection: 'row',
        gap: 12,
    },
    balanceColumn: {
        flex: 1,
    },
    balanceDetailLabel: {
        color: colors.surface,
        fontSize: 11,
        opacity: 0.85,
    },
    balanceDetailValue: {
        color: colors.surface,
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 4,
    },
    warningBox: {
        backgroundColor: colors.warningBackground,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    warningText: {
        color: colors.text,
        fontSize: 13,
        lineHeight: 19,
    },
    errorBox: {
        backgroundColor: colors.errorBackground,
        padding: 14,
        borderRadius: 12,
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    createButton: {
        backgroundColor: colors.errorBackground,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    createButtonText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyIcon: {
        fontSize: 40,
        color: colors.primary,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    goalCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 12,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    goalName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        flex: 1,
        marginRight: 12,
    },
    goalPercentage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    progressTrack: {
        height: 9,
        backgroundColor: colors.errorBackground,
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    goalAmounts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    goalAmountText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    completedText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 12,
    },
    emptyAnimation: {
        width: 150,
        height: 150,
        marginBottom: 12,
    },
});
