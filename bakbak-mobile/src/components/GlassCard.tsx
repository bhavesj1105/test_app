import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../constants/theme';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  className?: string;
  elevation?: number;
  borderRadius?: number;
  blurType?: 'light' | 'dark' | 'extraLight' | 'regular' | 'prominent';
  reducedTransparencyFallback?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 25,
  tint = 'light',
  className,
  elevation = 5,
  borderRadius = theme.borderRadius.lg,
  blurType = 'light',
  reducedTransparencyFallback,
}) => {
  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'transparent',
      android: theme.colors.glass.background,
    }),
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.glass.shadow,
        shadowOffset: {
          width: 0,
          height: elevation / 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: elevation,
      },
      android: {
        elevation: elevation,
      },
  }),
  };

  const borderStyle: ViewStyle = {
    borderWidth: Platform.select({
      ios: 0.5,
      android: 1,
    }),
    borderColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.3)',
      android: theme.colors.glass.border,
    }),
  };

  const innerShadowStyle: ViewStyle = Platform.select({
    ios: {
      shadowColor: '#FFFFFF',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.4,
      shadowRadius: 1,
    },
    default: {},
  }) as ViewStyle;

  if (Platform.OS === 'ios') {
    return (
      <View style={[containerStyle, borderStyle, ...(Array.isArray(style) ? style : [style || {}])]} className={className}>
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.content, innerShadowStyle]}>
          {children}
        </View>
      </View>
    );
  }

  // Android fallback with gradient and opacity
  return (
    <View style={[containerStyle, borderStyle, ...(Array.isArray(style) ? style : [style || {}])]} className={className}>
      <View style={[styles.androidBlur, { borderRadius }]} />
      <View style={styles.androidOverlay} />
      <View style={[styles.content, styles.androidContent]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
    zIndex: 1,
  },
  androidContent: {
    position: 'relative',
  },
  androidBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  androidOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 0,
  },
});

// Additional glass card variants
export interface GlassButtonProps extends GlassCardProps {
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  onPress,
  disabled = false,
  activeOpacity = 0.7,
  children,
  style,
  ...glassProps
}) => {
  const buttonBaseStyle: ViewStyle = {
    opacity: disabled ? 0.5 : 1,
  };

  if (Platform.OS === 'ios') {
    const { Pressable } = require('react-native');
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }: { pressed: boolean }) => [
          buttonBaseStyle,
          ...(Array.isArray(style) ? style : [style || {}]),
          pressed && { opacity: activeOpacity },
        ]}
      >
        <GlassCard {...glassProps}>
          {children}
        </GlassCard>
      </Pressable>
    );
  }

  const { TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[buttonBaseStyle, ...(Array.isArray(style) ? style : [style || {}]) ]}
    >
      <GlassCard {...glassProps}>
        {children}
      </GlassCard>
    </TouchableOpacity>
  );
};

// Glass card with different intensity levels
export const LightGlassCard: React.FC<Omit<GlassCardProps, 'intensity' | 'tint'>> = (props) => (
  <GlassCard {...props} intensity={15} tint="light" />
);

export const MediumGlassCard: React.FC<Omit<GlassCardProps, 'intensity' | 'tint'>> = (props) => (
  <GlassCard {...props} intensity={25} tint="light" />
);

export const DarkGlassCard: React.FC<Omit<GlassCardProps, 'intensity' | 'tint'>> = (props) => (
  <GlassCard {...props} intensity={30} tint="dark" />
);
