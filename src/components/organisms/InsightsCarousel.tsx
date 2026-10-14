import React, { useState } from 'react';
import {
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
          <View
            key={insight.id}
            style={[
              styles.dot,
              activeIndex === index && styles.activeDot,
            ]}
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
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 20,
    backgroundColor: colors.primary,
  },
});
