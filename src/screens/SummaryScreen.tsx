import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { PieChart } from 'react-native-gifted-charts';

// Importamos tus interfaces y las funciones lógicas
import { Transaction, Category } from '../types/transactions.types';
import { calcularTotalPorTipo, agruparGastosPorCategoria, generarAlertaPresupuesto } from '../utils/reports.utils'; 

// --- DATOS FALSOS PARA PROBAR LA PANTALLA ---
const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Sueldo', type: 'INCOME', created_at: '2026-10-01T10:00:00Z' },
  { id: 'cat-2', name: 'Alimentación', type: 'EXPENSE', created_at: '2026-10-01T10:00:00Z' },
  { id: 'cat-3', name: 'Transporte', type: 'EXPENSE', created_at: '2026-10-01T10:00:00Z' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't-1', user_id: 'user-1', category_id: 'cat-1', type: 'INCOME', amount: 5000, description: 'Sueldo mensual', date: '2026-10-01', created_at: '2026-10-01T10:00:00Z', updated_at: '2026-10-01T10:00:00Z' },
  { id: 't-2', user_id: 'user-1', category_id: 'cat-2', type: 'EXPENSE', amount: 1500, description: 'Supermercado', date: '2026-10-05', created_at: '2026-10-05T10:00:00Z', updated_at: '2026-10-05T10:00:00Z' },
  { id: 't-3', user_id: 'user-1', category_id: 'cat-3', type: 'EXPENSE', amount: 200, description: 'Gasolina', date: '2026-10-08', created_at: '2026-10-08T10:00:00Z', updated_at: '2026-10-08T10:00:00Z' },
];

export function SummaryScreen({ transactions = MOCK_TRANSACTIONS, categories = MOCK_CATEGORIES }) {
  
  const ingresos = useMemo(() => calcularTotalPorTipo(transactions, 'INCOME'), [transactions]);
  const gastos = useMemo(() => calcularTotalPorTipo(transactions, 'EXPENSE'), [transactions]);
  const balance = ingresos - gastos;
  
  const datosGrafico = useMemo(() => agruparGastosPorCategoria(transactions, categories), [transactions, categories]);
  const alerta = useMemo(() => generarAlertaPresupuesto(transactions), [transactions]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resumen</Text>

      {alerta && (
        <View style={[styles.alertCard, alerta.severity === 'warning' ? styles.alertWarning : styles.alertInfo]}>
          <Text style={styles.alertTitle}>{alerta.title}</Text>
          <Text style={styles.alertMessage}>{alerta.message}</Text>
        </View>
      )}

      <View style={styles.summaryContainer}>
        <View style={styles.mainCard}>
          <Text style={styles.cardLabel}>Balance Total</Text>
          <Text style={styles.balanceValue}>S/ {balance.toFixed(2)}</Text>
        </View>
        
        <View style={styles.rowCards}>
          <View style={[styles.smallCard, styles.incomeCard]}>
            <Text style={styles.cardLabel}>Ingresos</Text>
            <Text style={styles.incomeValue}>S/ {ingresos.toFixed(2)}</Text>
          </View>
          <View style={[styles.smallCard, styles.expenseCard]}>
            <Text style={styles.cardLabel}>Gastos</Text>
            <Text style={styles.expenseValue}>S/ {gastos.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.subtitle}>Gastos por Categoría</Text>
        
        {datosGrafico.length > 0 ? (
          <View style={styles.chartWrapper}>
            <PieChart
              data={datosGrafico}
              donut
              showText
              textColor={colors.text}
              radius={110}
              innerRadius={70}
              centerLabelComponent={() => {
                return <Text style={styles.chartCenterText}>Gastos</Text>;
              }}
            />
          </View>
        ) : (
          <Text style={styles.emptyText}>Aún no hay gastos registrados.</Text>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 20 },
  subtitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 15 },
  alertCard: { padding: 15, borderRadius: 12, marginBottom: 24 },
  alertWarning: { backgroundColor: '#FFE5E5', borderLeftWidth: 4, borderLeftColor: '#FF4D4D' },
  alertInfo: { backgroundColor: '#E5F0FF', borderLeftWidth: 4, borderLeftColor: '#4D94FF' },
  alertTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5, color: '#333' },
  alertMessage: { fontSize: 14, color: '#555' },
  summaryContainer: { marginBottom: 30 },
  mainCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 15, elevation: 3 },
  rowCards: { flexDirection: 'row', justifyContent: 'space-between' },
  smallCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 3 },
  incomeCard: { marginRight: 8 },
  expenseCard: { marginLeft: 8 },
  cardLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  balanceValue: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  incomeValue: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  expenseValue: { fontSize: 18, fontWeight: 'bold', color: '#F44336' },
  chartContainer: { backgroundColor: 'white', padding: 20, borderRadius: 16, elevation: 3 },
  chartWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  chartCenterText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: 20 }
});