import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { COLORS } from '../constants';

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
}

function makeStars(count: number, w: number, h: number, size: number, color: string): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: size + Math.random() * size,
      color,
    });
  }
  return stars;
}

// One seamlessly looping layer: the star pattern is drawn twice, stacked
// vertically, and translated by exactly one screen-height per cycle.
function StarLayer({ duration, count, size, color }: { duration: number; count: number; size: number; color: string }) {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => makeStars(count, width, height, size, color), [width, height, count, size, color]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, height] });

  return (
    <Animated.View style={[styles.layer, { top: -height, height: height * 2, transform: [{ translateY }] }]}>
      {[0, height].map((offset) =>
        stars.map((s, i) => (
          <View
            key={`${offset}-${i}`}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y + offset,
              width: s.size,
              height: s.size,
              backgroundColor: s.color,
            }}
          />
        ))
      )}
    </Animated.View>
  );
}

export function Starfield() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <StarLayer duration={34000} count={26} size={1.5} color={COLORS.star} />
      <StarLayer duration={19000} count={14} size={2.2} color={COLORS.starBright} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
