
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LottieView from 'lottie-react-native';
import { colors } from '../../theme/colors';
import { AnimatedPressable } from '../atoms/AnimatedPressable';

export type AppAlertType =
  | 'success'
  | 'error'
  | 'warning'
  | 'confirm';

interface AppAlertModalProps {
  visible: boolean;
  type: AppAlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const animations = {
  success: require('../../assets/animations/Success.json'),
  error: require('../../assets/animations/Error.json'),
  warning: require('../../assets/animations/Warning.json'),
  confirm: require('../../assets/animations/Warning.json'),
};

export function AppAlertModal({
  visible,
  type,
  title,
  message,
  confirmText,
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: AppAlertModalProps) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    scale.setValue(0.5);
    opacity.setValue(0);

    const animation = Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [visible, scale, opacity]);

  const isConfirmation = type === 'confirm';

  const primaryButtonText =
    confirmText ??
    (isConfirmation ? 'Confirmar' : 'Entendido');

  const handleClose = () => {
    if (loading) {
      return;
    }

    if (onCancel) {
      onCancel();
    } else {
      onConfirm?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}>
          <LottieView
            key={`${type}-${visible}`}
            source={animations[type]}
            autoPlay
            loop={false}
            style={styles.animation}
          />

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>{message}</Text>


          <View style={styles.actions}>
            {isConfirmation && (
              <AnimatedPressable
                containerStyle={styles.buttonContainer}
                style={[
                  styles.button,
                  styles.cancelButton,
                  loading && styles.disabledButton,
                ]}
                onPress={onCancel}
                disabled={loading}
                accessibilityRole="button">
                <Text style={styles.cancelButtonText}>
                  {cancelText}
                </Text>
              </AnimatedPressable>
            )}

            <AnimatedPressable
              containerStyle={styles.buttonContainer}
              style={[
                styles.button,
                styles.confirmButton,
                loading && styles.disabledButton,
              ]}
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button">
              <Text style={styles.confirmButtonText}>
                {loading ? 'Procesando...' : primaryButtonText}
              </Text>
            </AnimatedPressable>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(54, 21, 34, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },

  animation: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },

  title: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },

  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },

  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },

  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  confirmButton: {
    backgroundColor: colors.primary,
  },

  confirmButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.5,
  },
});
