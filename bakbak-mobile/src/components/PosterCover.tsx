import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const PosterCover: React.FC<{ uri?: string | null; colors?: string[]; height?: number; style?: StyleProp<ViewStyle> }>
  = ({ uri, colors = ['#1e3c72', '#2a5298'], height = 140, style }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.03, duration: 2500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 2500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.0, duration: 2500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.9, duration: 2500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [scale, opacity]);

  return (
    <View style={[styles.wrap, { height }, style]}
    >
      {uri ? (
        <Animated.Image source={{ uri }} style={[styles.bg, { transform: [{ scale }], opacity }]} blurRadius={8} />
      ) : (
        <Animated.View style={{ opacity, transform: [{ scale }], ...StyleSheet.absoluteFillObject }}>
          <LinearGradient colors={colors as any} style={styles.bg} />
        </Animated.View>
      )}
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden' },
  bg: { width: '100%', height: '100%', position: 'absolute' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
});

export default PosterCover;
