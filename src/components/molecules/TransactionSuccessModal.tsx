import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LottieView from 'lottie-react-native';
import { colors } from '../../theme/colors';

interface TransactionSuccessModalProps {
  visible: boolean;
  isEditing: boolean;
  onFinished: () => void;
}

export function TransactionSuccessModal({
  visible,
  isEditing,
  onFinished,
}: TransactionSuccessModalProps) {
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

    const timeout = setTimeout(() => {
      onFinished();
    }, 1800);

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [visible, scale, opacity, onFinished]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => { }}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <LottieView
            source={require('../../assets/animations/Success.json')}
            autoPlay
            loop={false}
            style={styles.successAnimation}
          />

          <Text style={styles.title}>
            {isEditing
              ? '¡Movimiento actualizado!'
              : '¡Movimiento registrado!'}
          </Text>

          <Text style={styles.description}>
            {isEditing
              ? 'Tus cambios se guardaron correctamente.'
              : 'Tu movimiento se guardó correctamente.'}
          </Text>

          <Text style={styles.footer}>
            Tu balance está actualizado
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 36,
    alignItems: 'center',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkIcon: {
    color: colors.surface,
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  footer: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 20,
  },
  successAnimation: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
});
