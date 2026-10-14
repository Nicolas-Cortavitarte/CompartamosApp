import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native';

import type {
    NativeStackNavigationProp,
    NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Transaction } from '../types/transactions.types';

import { getTransactionById, deleteTransaction } from '../services/transactions.service';
import { getCategories } from '../services/categories.service';

import { AnimatedPressable } from '../components/atoms/AnimatedPressable';

import { colors } from '../theme/colors';

type DetailRouteProps = NativeStackScreenProps<
    RootStackParamList,
    'TransactionDetail'
>['route'];

type DetailNavigation = NativeStackNavigationProp<
    RootStackParamList,
    'TransactionDetail'
>;

export function TransactionDetailScreen() {
    const navigation = useNavigation<DetailNavigation>();
    const route = useRoute<DetailRouteProps>();

    const { transactionId } = route.params;

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const loadDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const [transactionData, categories] = await Promise.all([
                getTransactionById(transactionId),
                getCategories(),
            ]);

            setTransaction(transactionData);

            const category = categories.find(
                item => item.id === transactionData.category_id,
            );

            setCategoryName(category?.name ?? 'Sin categoría');
        } catch (err) {
            setTransaction(null);
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo cargar el movimiento.',
            );
        } finally {
            setLoading(false);
        }
    }, [transactionId]);

    function handleDelete() {
        if (!transaction || deleting) {
            return;
        }

        Alert.alert(
            'Eliminar movimiento',
            '¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeleting(true);

                            await deleteTransaction(transaction.id);

                            navigation.goBack();
                        } catch (err) {
                            Alert.alert(
                                'Error',
                                err instanceof Error
                                    ? err.message
                                    : 'No se pudo eliminar el movimiento.',
                            );
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ],
        );
    }

    useFocusEffect(
        useCallback(() => {
            void loadDetail();
        }, [loadDetail]),
    );

    const isIncome = transaction?.type === 'INCOME';

    const formattedAmount = transaction
        ? `${isIncome ? '+' : '-'} S/ ${Number(
            transaction.amount,
        ).toFixed(2)}`
        : '';

    const formattedDate = transaction
        ? (() => {
            const [year, month, day] = transaction.date
                .split('-')
                .map(Number);

            return new Date(year, month - 1, day)
                .toLocaleDateString('es-PE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });
        })()
        : '';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    accessibilityRole="button"
                >
                    <Text style={styles.backText}>‹</Text>
                </Pressable>

                <Text style={styles.headerTitle}>
                    Detalle del movimiento
                </Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator
                        size="large"
                        color={colors.primary}
                    />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.error}>{error}</Text>

                    <Pressable onPress={loadDetail}>
                        <Text style={styles.retry}>Reintentar</Text>
                    </Pressable>
                </View>
            ) : transaction ? (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.amountCard}>
                        <Text style={styles.typeLabel}>
                            {isIncome ? 'Ingreso' : 'Gasto'}
                        </Text>

                        <Text
                            style={[
                                styles.amount,
                                { color: isIncome ? colors.income : colors.expense },
                            ]}
                        >
                            {formattedAmount}
                        </Text>
                    </View>

                    <View style={styles.detailsCard}>
                        <DetailRow
                            label="Categoría"
                            value={categoryName}
                        />

                        <View style={styles.divider} />

                        <DetailRow
                            label="Fecha"
                            value={formattedDate}
                        />

                        <View style={styles.divider} />

                        <DetailRow
                            label="Descripción"
                            value={transaction.description || 'Sin descripción'}
                        />
                    </View>

                    <AnimatedPressable
                        style={styles.editButton}
                        onPress={() =>
                            navigation.navigate('EditTransaction', {
                                transactionId,
                            })
                        }
                        accessibilityRole="button"
                    >
                        <Text style={styles.editButtonText}>
                            ✎ Editar movimiento
                        </Text>
                    </AnimatedPressable>

                    <AnimatedPressable
                        style={[
                            styles.deleteButton,
                            deleting && styles.disabledButton,
                        ]}
                        onPress={handleDelete}
                        disabled={deleting}
                        accessibilityRole="button"
                    >
                        <Text style={styles.deleteButtonText}>
                            {deleting ? 'Eliminando...' : 'Eliminar movimiento'}
                        </Text>
                    </AnimatedPressable>

                </ScrollView>
            ) : null}
        </SafeAreaView>
    );
}

interface DetailRowProps {
    label: string;
    value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 16,
    },
    backButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backText: {
        fontSize: 32,
        color: colors.text,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    amountCard: {
        padding: 28,
        backgroundColor: colors.surface,
        borderRadius: 20,
        alignItems: 'center',
        gap: 12,
    },
    typeLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    amount: {
        fontSize: 34,
        fontWeight: '700',
    },
    detailsCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
    },
    detailRow: {
        paddingVertical: 16,
        gap: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
    error: {
        color: colors.error,
        textAlign: 'center',
    },
    retry: {
        color: colors.primary,
        fontWeight: '600',
    },
    deleteButton: {
        minHeight: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    deleteButtonText: {
        color: colors.error,
        fontSize: 15,
        fontWeight: '700',
    },
    disabledButton: {
        opacity: 0.5,
    },
    editButton: {
        minHeight: 52,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    editButtonText: {
        color: colors.surface,
        fontSize: 15,
        fontWeight: '700',
    },
});
