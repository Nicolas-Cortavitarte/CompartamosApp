import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import type {
  BreakevenConfig,
  BreakevenStatus,
} from '../../types/breakeven.types';

interface BreakevenCardProps {
  config: BreakevenConfig;
  status: BreakevenStatus;
  onPressConfigure: () => void;
}

export function BreakevenCard({
  config,
  status,
  onPressConfigure,
}: BreakevenCardProps) {
  // 🔴 ESTADO 1: Usuario NO ha configurado aún sus datos
  if (!config.isConfigured) {
    return (
      <View style={styles.unconfiguredContainer}>
        <View style={styles.unconfiguredHeader}>
          <Text style={styles.emojiIcon}>🎯</Text>
          <View style={styles.textFlex}>
            <Text style={styles.unconfiguredTitle}>Calcula tu Meta Diaria</Text>
            <Text style={styles.unconfiguredSubtitle}>
              Configura tus gastos fijos (alquiler, servicios) para saber cuánto
              debes vender hoy para no perder dinero.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            console.log('¡Click detectado en el botón de la tarjeta!');
            onPressConfigure();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>+ Configurar Gastos Fijos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🟢 ESTADO 2: Usuario YA configuró sus datos (Barra de progreso activa)
  const remaining = Math.max(0, status.dailyBreakeven - status.todaySales);

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.85}
      onPress={onPressConfigure}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Text style={styles.badgeEmoji}>
            {status.isCovered ? '🎉' : '🎯'}
          </Text>
          <Text style={styles.cardTitle}>Meta Diaria de Ventas</Text>
        </View>
        <TouchableOpacity style={styles.gearButton} onPress={onPressConfigure}>
          <Text style={styles.gearIcon}>⚙️ Editar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View>
          <Text style={styles.metricLabel}>Ventas de Hoy</Text>
          <Text style={styles.todaySalesText}>
            S/ {status.todaySales.toFixed(2)}
          </Text>
        </View>
        <View style={styles.alignRight}>
          <Text style={styles.metricLabel}>Punto de Equilibrio</Text>
          <Text style={styles.targetText}>
            S/ {status.dailyBreakeven.toFixed(2)} /día
          </Text>
        </View>
      </View>

      {/* Barra de Progreso */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${status.progressPercentage}%`,
              backgroundColor: status.isCovered ? '#10B981' : colors.primary,
            },
          ]}
        />
      </View>

      {/* Mensajes motivacionales */}
      <View style={styles.footerRow}>
        {status.isCovered ? (
          <Text style={styles.successMessage}>
            ¡Punto de equilibrio cubierto! Todo lo que vendas ahora es ganancia
            neta. 🚀
          </Text>
        ) : (
          <Text style={styles.pendingMessage}>
            Te faltan{' '}
            <Text style={styles.boldText}>S/ {remaining.toFixed(2)}</Text> para
            cubrir los costos fijos de hoy.
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Tarjeta de estado "Sin Configurar"
  unconfiguredContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    zIndex: 10,
  },
  unconfiguredHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emojiIcon: {
    fontSize: 28,
  },
  textFlex: {
    flex: 1,
  },
  unconfiguredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3730A3',
    marginBottom: 2,
  },
  unconfiguredSubtitle: {
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Tarjeta de estado Activo
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeEmoji: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  gearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  gearIcon: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  todaySalesText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  targetText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  footerRow: {
    marginTop: 2,
  },
  successMessage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  pendingMessage: {
    fontSize: 12,
    color: '#4B5563',
  },
  boldText: {
    fontWeight: '700',
    color: '#DC2626',
  },
});
