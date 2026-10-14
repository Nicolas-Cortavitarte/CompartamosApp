import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function AnimatedPressable({
  children,
  containerStyle,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={event => {
          if (!disabled) {
            animateScale(0.96);
          }

          onPressIn?.(event);
        }}
        onPressOut={event => {
          animateScale(1);
          onPressOut?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}