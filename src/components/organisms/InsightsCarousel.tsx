import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import { InsightCard } from '../molecules/InsightCard';

interface Insight {
  id: string;
  title: string;
  message: string;
}

interface InsightsCarouselProps {
  insights: Insight[];
}

interface AnimatedDotProps {
  active: boolean;
}

function AnimatedDot({ active }: AnimatedDotProps) {
  const progress = useRef(
    new Animated.Value(active ? 1 : 0),
  ).current;

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: reduceMotion ? 0 : 220,
      useNativeDriver: false,
    });

    animation.start();

    return () => animation.stop();
  }, [active, progress, reduceMotion]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [7, 20],
  });

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width,
          backgroundColor,
        },
      ]}
    />
  );
}

export function InsightsCarousel({
  insights,
}: InsightsCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidth = width - 32;

  function handleScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / cardWidth);

    setActiveIndex(
      Math.max(0, Math.min(index, insights.length - 1)),
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Consejos para tu negocio
      </Text>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.carousel}
      >
        {insights.map(insight => (
          <View
            key={insight.id}
            style={{ width: cardWidth }}
          >
            <InsightCard
              title={insight.title}
              message={insight.message}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.indicators}>
        {insights.map((insight, index) => (
          <AnimatedDot
            key={insight.id}
            active={activeIndex === index}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  carousel: {
    flexGrow: 0,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});