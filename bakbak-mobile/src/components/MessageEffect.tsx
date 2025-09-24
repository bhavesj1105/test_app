import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import LottieView from './Lottie';

type EffectMeta = { type: string; params?: any } | null | undefined;

export interface MessageEffectProps {
  effect: EffectMeta;
  size?: number; // overlay box size if needed
  autoplay?: boolean;
  loop?: boolean;
  playOnceId?: string; // message id to ensure single play
}

// Very simple mapper from effect type -> require json file
const effectSources: Record<string, any> = {
  confetti: require('../../assets/lottie/confetti.json'),
  fireworks: require('../../assets/lottie/fireworks.json'),
};

const played = new Set<string>();

export const MessageEffect: React.FC<MessageEffectProps> = ({ effect, size = 160, autoplay = true, loop = false, playOnceId }: MessageEffectProps) => {
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (effect && autoplay) {
      if (playOnceId && played.has(playOnceId)) return;
  if (Platform.OS !== 'web') {
        animRef.current?.reset();
        animRef.current?.play();
      }
      if (playOnceId) played.add(playOnceId);
    }
  }, [effect, autoplay]);

  if (!effect || !effect.type || !effectSources[effect.type]) return null;
  const source = effectSources[effect.type];

  return (
    <View pointerEvents="none" style={[styles.overlay, { width: size, height: size }]}> 
  <LottieView {...(Platform.OS === 'web' ? {} : { ref: animRef, source })} style={{ width: size, height: size }} {...(Platform.OS === 'web' ? {} : { autoPlay: autoplay, loop })} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
});

export default MessageEffect;
